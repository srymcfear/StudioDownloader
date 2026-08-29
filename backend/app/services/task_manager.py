import os
import re
import uuid
import time
import zipfile
import shutil
import asyncio
import threading
import subprocess
from pathlib import Path
from typing import AsyncGenerator
import yt_dlp

from app.config import settings
from app.services.ffmpeg_service import get_ffmpeg_executable
from app.services.ytdlp_service import format_bytes, format_duration, get_node_path
from app.schemas.models import (
    DownloadRequest,
    BatchDownloadRequest,
    TaskProgress,
    TaskStatusEnum
)

class TaskManager:
    def __init__(self):
        self.tasks: dict[str, TaskProgress] = {}
        self.task_files: dict[str, Path] = {}
        self.subscribers: dict[str, list[asyncio.Queue]] = {}
        self.lock = threading.Lock()
        self.ffmpeg_path = get_ffmpeg_executable()
        # VULN-03: cap simultaneous yt-dlp/FFmpeg threads to prevent CPU exhaustion DoS
        self._download_semaphore = threading.Semaphore(settings.MAX_CONCURRENT_DOWNLOADS)

    def create_task(self) -> str:
        task_id = str(uuid.uuid4())
        with self.lock:
            self.tasks[task_id] = TaskProgress(
                task_id=task_id,
                status=TaskStatusEnum.PENDING,
                percent=0.0,
                message="Đang xếp hàng đợi xử lý..."
            )
            self.subscribers[task_id] = []
        return task_id

    def _is_valid_task_id(self, task_id: str) -> bool:
        """Guard: task_id must be a UUID4 string to prevent glob/path injection."""
        try:
            import uuid as _uuid
            val = _uuid.UUID(task_id, version=4)
            return str(val) == task_id
        except (ValueError, AttributeError):
            return False

    def get_task(self, task_id: str) -> TaskProgress | None:
        if not self._is_valid_task_id(task_id):
            return None
        with self.lock:
            return self.tasks.get(task_id)

    def get_task_file(self, task_id: str) -> Path | None:
        # VULN-02: reject non-UUID task_ids before glob() to prevent path traversal
        if not self._is_valid_task_id(task_id):
            return None
        with self.lock:
            cached = self.task_files.get(task_id)
            if cached and cached.exists():
                return cached
        # Look on disk for matching file with task_id prefix
        matches = list(settings.DOWNLOAD_DIR.glob(f"{task_id}_*"))
        if matches and matches[0].exists():
            # Extra safety: ensure the resolved path is inside DOWNLOAD_DIR
            resolved = matches[0].resolve()
            if not str(resolved).startswith(str(settings.DOWNLOAD_DIR.resolve())):
                return None
            with self.lock:
                self.task_files[task_id] = matches[0]
            return matches[0]
        return None

    def _broadcast_update(self, task_id: str, progress: TaskProgress):
        with self.lock:
            self.tasks[task_id] = progress
            queues = list(self.subscribers.get(task_id, []))
        for q in queues:
            try:
                q.put_nowait(progress.model_dump_json())
            except Exception:
                pass

    async def subscribe(self, task_id: str) -> AsyncGenerator[str, None]:
        q = asyncio.Queue()
        with self.lock:
            if task_id in self.tasks:
                q.put_nowait(self.tasks[task_id].model_dump_json())
            if task_id not in self.subscribers:
                self.subscribers[task_id] = []
            self.subscribers[task_id].append(q)

        try:
            while True:
                data = await q.get()
                yield {"data": data}
                with self.lock:
                    current_task = self.tasks.get(task_id)
                if current_task and current_task.status in (TaskStatusEnum.COMPLETED, TaskStatusEnum.ERROR):
                    break
        finally:
            with self.lock:
                if task_id in self.subscribers and q in self.subscribers[task_id]:
                    self.subscribers[task_id].remove(q)

    def run_download_sync(self, task_id: str, request: DownloadRequest):
        # VULN-03: block here until a slot is free (max MAX_CONCURRENT_DOWNLOADS simultaneous)
        self._broadcast_update(
            task_id,
            TaskProgress(
                task_id=task_id,
                status=TaskStatusEnum.PENDING,
                percent=0.0,
                message="Đang chờ slot tải... (hàng đợi an toàn)"
            )
        )
        with self._download_semaphore:
            self._run_download_inner(task_id, request)

    def _run_download_inner(self, task_id: str, request: DownloadRequest):
        output_template = str(settings.DOWNLOAD_DIR / f"{task_id}_%(title).100B.%(ext)s")
        temp_dir = settings.TEMP_DIR / task_id
        temp_dir.mkdir(parents=True, exist_ok=True)

        def progress_hook(d: dict):
            status_str = d.get("status")
            if status_str == "downloading":
                total_bytes = d.get("total_bytes") or d.get("total_bytes_estimate") or 0
                downloaded_bytes = d.get("downloaded_bytes") or 0
                speed = d.get("speed") or 0
                eta = d.get("eta") or 0
                
                percent = 0.0
                if total_bytes > 0:
                    percent = min(round((downloaded_bytes / total_bytes) * 100, 1), 99.0)
                elif d.get("_percent_str"):
                    clean_p = re.sub(r"[^\d.]", "", d["_percent_str"])
                    try:
                        percent = min(float(clean_p), 99.0)
                    except ValueError:
                        percent = 50.0

                speed_str = f"{format_bytes(speed)}/s" if speed else "Đang tăng tốc..."
                eta_str = f"{format_duration(eta)} còn lại" if eta else "Đang tính..."

                self._broadcast_update(
                    task_id,
                    TaskProgress(
                        task_id=task_id,
                        status=TaskStatusEnum.DOWNLOADING,
                        percent=percent,
                        speed_formatted=speed_str,
                        eta_formatted=eta_str,
                        downloaded_bytes=downloaded_bytes,
                        total_bytes=total_bytes,
                        message=f"Đang tải tốc độ cao... ({percent}%)"
                    )
                )
            elif status_str == "finished":
                self._broadcast_update(
                    task_id,
                    TaskProgress(
                        task_id=task_id,
                        status=TaskStatusEnum.MERGING,
                        percent=99.0,
                        message="Đang ghép luồng & xuất chất lượng cao..."
                    )
                )

        node_path = get_node_path()

        ydl_opts: dict = {
            "ffmpeg_location": self.ffmpeg_path,
            "outtmpl": output_template,
            "paths": {"temp": str(temp_dir)},
            "progress_hooks": [progress_hook],
            "quiet": True,
            "no_warnings": True,
            "nocheckcertificate": True,
            "geo_bypass": True,
            "source_address": "0.0.0.0",  # Force IPv4
            "concurrent_fragment_downloads": 10,
            "http_chunk_size": 10485760,  # 10MB chunk for unthrottled streaming
            "buffersize": 1024 * 1024,    # 1MB buffer
            "socket_timeout": 20,
            "retries": 5,
            "fragment_retries": 5,
            "js_runtimes": {"node": {"path": node_path}} if node_path else {},
            "extractor_args": {
                "youtube": {
                    "player_client": ["android", "ios", "web"]
                }
            },
            "postprocessor_args": {
                "ffmpeg": ["-threads", "0"]
            }
        }

        if request.proxy or settings.DEFAULT_PROXY:
            ydl_opts["proxy"] = request.proxy or settings.DEFAULT_PROXY

        postprocessors = []

        if request.media_type == "audio":
            target_ext = request.target_ext.lower()
            if target_ext in ["flac", "wav"]:
                preferred_codec = target_ext
                preferred_quality = None
            elif target_ext == "m4a":
                preferred_codec = "m4a"
                preferred_quality = "256"
            elif target_ext == "opus":
                preferred_codec = "opus"
                preferred_quality = "0"
            else: # Default mp3
                preferred_codec = "mp3"
                preferred_quality = request.audio_bitrate.replace("k", "") if request.audio_bitrate else "320"

            ydl_opts["format"] = "bestaudio/best"
            
            extract_opts = {
                "key": "FFmpegExtractAudio",
                "preferredcodec": preferred_codec,
            }
            if preferred_quality:
                extract_opts["preferredquality"] = preferred_quality
            postprocessors.append(extract_opts)

            if request.embed_metadata:
                postprocessors.append({"key": "FFmpegMetadata", "add_metadata": True})
            if request.embed_thumbnail:
                ydl_opts["writethumbnail"] = True
                postprocessors.append({"key": "EmbedThumbnail", "already_have_thumbnail": False})

        else: # Video
            target_ext = request.target_ext if request.target_ext in ["mp4", "mkv", "webm"] else "mp4"
            
            if request.quality_preset and "p" in request.quality_preset:
                height_num = re.sub(r"\D", "", request.quality_preset)
                if height_num:
                    ydl_opts["format"] = f"bestvideo[height<={height_num}]+bestaudio/best[height<={height_num}]/best"
                else:
                    ydl_opts["format"] = "bestvideo+bestaudio/best"
            elif request.format_id and request.format_id != "best":
                ydl_opts["format"] = f"{request.format_id}+bestaudio/best"
            else:
                ydl_opts["format"] = "bestvideo+bestaudio/best"

            ydl_opts["merge_output_format"] = target_ext

            if request.embed_metadata:
                postprocessors.append({"key": "FFmpegMetadata", "add_metadata": True})
            if request.embed_thumbnail and target_ext in ["mp4", "mkv"]:
                ydl_opts["writethumbnail"] = True
                postprocessors.append({"key": "EmbedThumbnail", "already_have_thumbnail": False})
            if request.embed_subtitles and request.subtitle_lang:
                ydl_opts["writesubtitles"] = True
                ydl_opts["subtitleslangs"] = [request.subtitle_lang]
                postprocessors.append({"key": "FFmpegEmbedSubtitle", "already_have_subtitle": False})

        if postprocessors:
            ydl_opts["postprocessors"] = postprocessors

        try:
            self._broadcast_update(
                task_id,
                TaskProgress(
                    task_id=task_id,
                    status=TaskStatusEnum.STARTING,
                    percent=1.0,
                    message="Đang khởi tạo kết nối tốc độ cao..."
                )
            )

            with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                info = ydl.extract_info(request.url, download=True)
                downloaded_file = ydl.prepare_filename(info)
                actual_file = Path(downloaded_file)
                # First check matching the requested target extension (e.g. .mp3, .m4a, .flac)
                target_ext = request.target_ext.lower().strip()
                ext_matches = [f for f in settings.DOWNLOAD_DIR.glob(f"{task_id}_*.{target_ext}") if f.is_file()]
                if ext_matches:
                    actual_file = ext_matches[0]
                elif not actual_file.exists():
                    valid_matches = [
                        f for f in settings.DOWNLOAD_DIR.glob(f"{task_id}_*")
                        if f.is_file() and not f.name.endswith(('.temp', '.part', '.ytdl', '.webp', '.jpg', '.png'))
                    ]
                    if valid_matches:
                        actual_file = valid_matches[0]

                if not actual_file.exists():
                    raise FileNotFoundError(f"Không tìm thấy file xuất cho tác vụ {task_id}")

            # Trimming if requested
            if request.trim and request.trim.enabled and request.trim.end_time > request.trim.start_time:
                self._broadcast_update(
                    task_id,
                    TaskProgress(
                        task_id=task_id,
                        status=TaskStatusEnum.TRIMMING,
                        percent=99.0,
                        message=f"Đang cắt đoạn {format_duration(request.trim.start_time)} đến {format_duration(request.trim.end_time)}..."
                    )
                )
                trimmed_file = actual_file.parent / f"trimmed_{actual_file.name}"
                start_sec = str(request.trim.start_time)
                duration_sec = str(request.trim.end_time - request.trim.start_time)

                cmd = [
                    self.ffmpeg_path,
                    "-y",
                    "-ss", start_sec,
                    "-i", str(actual_file),
                    "-t", duration_sec,
                    "-c", "copy",
                    str(trimmed_file)
                ]
                res = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
                if res.returncode == 0 and trimmed_file.exists():
                    actual_file.unlink(missing_ok=True)
                    actual_file = trimmed_file

            # AI & DSP Audio Enhancement (Plan 2)
            has_effect = request.audio_effect and request.audio_effect != "none"
            if (has_effect or request.normalize_loudness) and actual_file.suffix.lower() in [".mp3", ".m4a", ".flac", ".wav", ".opus", ".webm"]:
                effect_msg = "Đang tách Beat Karaoke..." if request.audio_effect == "karaoke" else "Đang trích xuất Vocal Acapella..." if request.audio_effect == "vocal_only" else "Đang chuẩn hóa âm lượng EBU R128 (-14 LUFS)..."
                self._broadcast_update(
                    task_id,
                    TaskProgress(
                        task_id=task_id,
                        status=TaskStatusEnum.PROCESSING_AI,
                        percent=99.0,
                        message=effect_msg
                    )
                )

                af_filters = []
                if request.audio_effect == "karaoke":
                    # Center-channel phase cancellation for instant instrumental beat
                    af_filters.append("pan=stereo|c0=c0-c1|c1=c1-c0")
                elif request.audio_effect == "vocal_only":
                    # Center vocal isolation with vocal bandpass
                    af_filters.append("pan=mono|c0=0.5*c0+0.5*c1,highpass=f=200,lowpass=f=3800")

                if request.normalize_loudness:
                    # EBU R128 / ITU-R BS.1770 standard -14 LUFS
                    af_filters.append("loudnorm=I=-14:LRA=11:TP=-1.5")

                if af_filters:
                    prefix_tag = "karaoke_" if request.audio_effect == "karaoke" else "vocal_" if request.audio_effect == "vocal_only" else "ebur128_"
                    processed_file = actual_file.parent / f"{prefix_tag}{actual_file.name}"
                    
                    codec_arg = ["-c:a", "libmp3lame"] if actual_file.suffix.lower() == ".mp3" else ["-c:a", "aac"] if actual_file.suffix.lower() == ".m4a" else []
                    cmd_af = [
                        self.ffmpeg_path,
                        "-y",
                        "-i", str(actual_file),
                        "-af", ",".join(af_filters),
                        *codec_arg,
                        "-b:a", request.audio_bitrate if hasattr(request, 'audio_bitrate') and request.audio_bitrate else "320k",
                        str(processed_file)
                    ]
                    res_af = subprocess.run(cmd_af, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
                    if res_af.returncode == 0 and processed_file.exists():
                        actual_file.unlink(missing_ok=True)
                        actual_file = processed_file

            clean_display_name = actual_file.name.replace(f"{task_id}_", "")
            if clean_display_name.startswith("trimmed_"):
                clean_display_name = clean_display_name.replace("trimmed_", "[Trimmed] ")
            if clean_display_name.startswith("karaoke_"):
                clean_display_name = clean_display_name.replace("karaoke_", "[Karaoke Beat] ")
            elif clean_display_name.startswith("vocal_"):
                clean_display_name = clean_display_name.replace("vocal_", "[Acapella Vocal] ")
            elif clean_display_name.startswith("ebur128_"):
                clean_display_name = clean_display_name.replace("ebur128_", "[EBU R128] ")

            with self.lock:
                self.task_files[task_id] = actual_file

            download_url = f"/api/download/file/{task_id}"

            self._broadcast_update(
                task_id,
                TaskProgress(
                    task_id=task_id,
                    status=TaskStatusEnum.COMPLETED,
                    percent=100.0,
                    message="Hoàn tất xử lý file!",
                    filename=clean_display_name,
                    download_url=download_url
                )
            )

            # Auto-sync to Telegram if enabled (Plan 6)
            try:
                from app.services.cloud_sync_service import cloud_sync
                if cloud_sync.is_auto_sync_enabled():
                    threading.Thread(
                        target=cloud_sync.send_file_to_telegram,
                        args=(actual_file, f"🎬 {clean_display_name}"),
                        daemon=True
                    ).start()
            except Exception as e_cloud:
                logger.error(f"Telegram auto-sync error: {e_cloud}")

        except Exception as e:
            self._broadcast_update(
                task_id,
                TaskProgress(
                    task_id=task_id,
                    status=TaskStatusEnum.ERROR,
                    percent=0.0,
                    message="Lỗi khi tải hoặc ghép luồng.",
                    error=str(e)
                )
            )
        finally:
            if temp_dir.exists():
                shutil.rmtree(temp_dir, ignore_errors=True)

    def run_batch_download_sync(self, task_id: str, request: BatchDownloadRequest):
        """Downloads multiple selected tracks from a playlist."""
        total_urls = len(request.urls)
        if total_urls == 0:
            self._broadcast_update(
                task_id,
                TaskProgress(
                    task_id=task_id,
                    status=TaskStatusEnum.ERROR,
                    percent=0.0,
                    message="Không có URL nào được chọn.",
                    error="Danh sách rỗng"
                )
            )
            return

        batch_dir = settings.TEMP_DIR / f"batch_{task_id}"
        batch_dir.mkdir(parents=True, exist_ok=True)
        downloaded_files: list[Path] = []
        node_path = get_node_path()

        try:
            self._broadcast_update(
                task_id,
                TaskProgress(
                    task_id=task_id,
                    status=TaskStatusEnum.STARTING,
                    percent=1.0,
                    message=f"Bắt đầu tải gói {total_urls} bài hát đã chọn..."
                )
            )

            for index, url in enumerate(request.urls):
                current_percent = round((index / total_urls) * 90.0, 1)
                self._broadcast_update(
                    task_id,
                    TaskProgress(
                        task_id=task_id,
                        status=TaskStatusEnum.DOWNLOADING,
                        percent=max(1.0, current_percent),
                        message=f"Đang tải bài [{index + 1}/{total_urls}]..."
                    )
                )

                output_template = str(batch_dir / "%(title).80B.%(ext)s")
                ydl_opts: dict = {
                    "ffmpeg_location": self.ffmpeg_path,
                    "outtmpl": output_template,
                    "quiet": True,
                    "no_warnings": True,
                    "nocheckcertificate": True,
                    "geo_bypass": True,
                    "concurrent_fragment_downloads": 10,
                    "http_chunk_size": 10485760,
                    "buffersize": 1024 * 1024,
                    "js_runtimes": {"node": {"path": node_path}},
                    "remote_components": ["ejs:github"],
                    "postprocessor_args": {
                        "ffmpeg": ["-threads", "0"]
                    }
                }

                if request.proxy or settings.DEFAULT_PROXY:
                    ydl_opts["proxy"] = request.proxy or settings.DEFAULT_PROXY

                postprocessors = []

                if request.media_type == "audio":
                    target_ext = request.target_ext.lower()
                    if target_ext in ["flac", "wav"]:
                        preferred_codec = target_ext
                        preferred_quality = None
                    elif target_ext == "m4a":
                        preferred_codec = "m4a"
                        preferred_quality = "256"
                    else: # MP3
                        preferred_codec = "mp3"
                        preferred_quality = request.audio_bitrate.replace("k", "") if request.audio_bitrate else "320"

                    ydl_opts["format"] = "bestaudio/best"
                    extract_opts = {
                        "key": "FFmpegExtractAudio",
                        "preferredcodec": preferred_codec,
                    }
                    if preferred_quality:
                        extract_opts["preferredquality"] = preferred_quality
                    postprocessors.append(extract_opts)
                    postprocessors.append({"key": "FFmpegMetadata", "add_metadata": True})
                    ydl_opts["writethumbnail"] = True
                    postprocessors.append({"key": "EmbedThumbnail", "already_have_thumbnail": False})

                else: # Video
                    target_ext = request.target_ext if request.target_ext in ["mp4", "mkv"] else "mp4"
                    ydl_opts["format"] = "bestvideo[height<=1080]+bestaudio/best[height<=1080]/best"
                    ydl_opts["merge_output_format"] = target_ext
                    postprocessors.append({"key": "FFmpegMetadata", "add_metadata": True})

                if postprocessors:
                    ydl_opts["postprocessors"] = postprocessors

                try:
                    with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                        ydl.download([url])
                except Exception as track_err:
                    print(f"Error downloading track {url}: {track_err}")

            for f in batch_dir.iterdir():
                if f.is_file() and not f.name.endswith(".temp") and not f.name.endswith(".part"):
                    downloaded_files.append(f)

            if not downloaded_files:
                raise RuntimeError("Không tải được tệp nào từ danh sách bài đã chọn.")

            self._broadcast_update(
                task_id,
                TaskProgress(
                    task_id=task_id,
                    status=TaskStatusEnum.MERGING,
                    percent=95.0,
                    message=f"Đang nén {len(downloaded_files)} tệp vào gói .ZIP..."
                )
            )

            clean_playlist_title = re.sub(r'[\\/*?:"<>|]', "", request.playlist_title or "Playlist").strip()
            zip_filename = f"{task_id}_[FEAR]_{clean_playlist_title}.zip"
            zip_path = settings.DOWNLOAD_DIR / zip_filename

            with zipfile.ZipFile(zip_path, "w", zipfile.ZIP_DEFLATED) as zipf:
                for file_path in downloaded_files:
                    zipf.write(file_path, arcname=file_path.name)

            display_filename = f"[FEAR]_{clean_playlist_title}.zip"
            download_url = f"/api/download/file/{task_id}"

            with self.lock:
                self.task_files[task_id] = zip_path

            self._broadcast_update(
                task_id,
                TaskProgress(
                    task_id=task_id,
                    status=TaskStatusEnum.COMPLETED,
                    percent=100.0,
                    message=f"Đã xử lý thành công {len(downloaded_files)} bài!",
                    filename=display_filename,
                    download_url=download_url
                )
            )

        except Exception as e:
            self._broadcast_update(
                task_id,
                TaskProgress(
                    task_id=task_id,
                    status=TaskStatusEnum.ERROR,
                    percent=0.0,
                    message="Lỗi khi tải gói danh sách phát.",
                    error=str(e)
                )
            )
        finally:
            if batch_dir.exists():
                shutil.rmtree(batch_dir, ignore_errors=True)

task_manager = TaskManager()
