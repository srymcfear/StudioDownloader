import os
import re
import math
import shutil
from typing import Any, Callable
from pathlib import Path
import yt_dlp

from app.config import settings
from app.services.ffmpeg_service import get_ffmpeg_executable
from app.schemas.models import (
    VideoInfoResponse,
    VideoFormatOption,
    AudioFormatOption,
    SubtitleOption,
    ChapterItem,
    PlaylistInfoResponse,
    PlaylistItem,
    DownloadRequest
)

def format_bytes(bytes_count: int | float | None) -> str:
    if not bytes_count or bytes_count <= 0:
        return "Unknown size"
    units = ["B", "KB", "MB", "GB", "TB"]
    i = 0
    while bytes_count >= 1024 and i < len(units) - 1:
        bytes_count /= 1024.0
        i += 1
    return f"{bytes_count:.1f} {units[i]}"

def format_duration(seconds: int | float | None) -> str:
    if not seconds or seconds <= 0:
        return "00:00"
    seconds = int(seconds)
    hours = seconds // 3600
    minutes = (seconds % 3600) // 60
    secs = seconds % 60
    if hours > 0:
        return f"{hours:02d}:{minutes:02d}:{secs:02d}"
    return f"{minutes:02d}:{secs:02d}"

def is_short_url(url: str, duration: int | None = None) -> bool:
    if "/shorts/" in url:
        return True
    if duration and duration <= 60:
        return True
    return False

def detect_platform(url: str, extractor_key: str | None = None) -> str:
    url_lower = url.lower()
    if extractor_key:
        ext_lower = extractor_key.lower()
        if "tiktok" in ext_lower:
            return "tiktok"
        if "facebook" in ext_lower:
            return "facebook"
        if "instagram" in ext_lower:
            return "instagram"
        if "soundcloud" in ext_lower:
            return "soundcloud"
        if "twitter" in ext_lower:
            return "twitter"
        if "bilibili" in ext_lower:
            return "bilibili"
        if "youtube" in ext_lower:
            return "youtube"
    
    if "tiktok.com" in url_lower:
        return "tiktok"
    if "facebook.com" in url_lower or "fb.watch" in url_lower:
        return "facebook"
    if "instagram.com" in url_lower or "instagr.am" in url_lower:
        return "instagram"
    if "soundcloud.com" in url_lower:
        return "soundcloud"
    if "twitter.com" in url_lower or "x.com" in url_lower:
        return "twitter"
    if "bilibili.com" in url_lower or "b23.tv" in url_lower:
        return "bilibili"
    if "youtube.com" in url_lower or "youtu.be" in url_lower:
        return "youtube"
    return "other"

def get_node_path() -> str:
    return shutil.which("node") or "/Users/minber/.local/bin/node" or "node"

class YtDlpService:
    def __init__(self):
        self.ffmpeg_location = get_ffmpeg_executable()

    def get_base_ydl_opts(self, proxy: str | None = None, cookie_file: str | None = None) -> dict[str, Any]:
        node_path = get_node_path()
        opts: dict[str, Any] = {
            "ffmpeg_location": self.ffmpeg_location,
            "quiet": True,
            "no_warnings": True,
            "extract_flat": False,
            "nocheckcertificate": True,
            "geo_bypass": True,
            "ignoreerrors": False,
            "source_address": "0.0.0.0",  # Force IPv4 to prevent macOS IPv6 timeouts
            "socket_timeout": 15,
            "retries": 3,
            "fragment_retries": 3,
            "concurrent_fragment_downloads": 5,
            "http_chunk_size": 10485760,
            "buffersize": 1024 * 1024,
            "js_runtimes": {"node": {"path": node_path}} if node_path else {},
            "extractor_args": {
                "youtube": {
                    "player_client": ["android", "ios", "web"]
                }
            },
            "user_agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
        }
        if proxy or settings.DEFAULT_PROXY:
            opts["proxy"] = proxy or settings.DEFAULT_PROXY
        if cookie_file and Path(cookie_file).exists():
            opts["cookiefile"] = cookie_file
        return opts

    def extract_info(self, url: str, proxy: str | None = None, cookie_file: str | None = None) -> VideoInfoResponse | PlaylistInfoResponse:
        opts = self.get_base_ydl_opts(proxy, cookie_file)
        opts["extract_flat"] = "in_playlist"
        
        with yt_dlp.YoutubeDL(opts) as ydl:
            try:
                info = ydl.extract_info(url, download=False)
            except Exception:
                opts["extract_flat"] = False
                with yt_dlp.YoutubeDL(opts) as ydl_retry:
                    info = ydl_retry.extract_info(url, download=False)

        if not info:
            raise ValueError("Could not extract metadata from the provided URL.")

        # Check if playlist
        if info.get("_type") == "playlist" or ("entries" in info and len(info.get("entries", [])) > 1):
            entries: list[PlaylistItem] = []
            for entry in info.get("entries", []):
                if not entry:
                    continue
                e_id = entry.get("id", "")
                e_url = entry.get("url") or f"https://www.youtube.com/watch?v={e_id}"
                e_thumb = entry.get("thumbnail")
                if not e_thumb and entry.get("thumbnails"):
                    e_thumb = entry["thumbnails"][-1].get("url")
                dur = entry.get("duration")
                entries.append(
                    PlaylistItem(
                        id=e_id,
                        title=entry.get("title", "Unknown Title"),
                        url=e_url,
                        duration=dur,
                        duration_formatted=format_duration(dur),
                        thumbnail=e_thumb,
                        uploader=entry.get("uploader") or entry.get("channel") or "Unknown Creator"
                    )
                )
            return PlaylistInfoResponse(
                id=info.get("id", "playlist"),
                title=info.get("title", "Media Playlist"),
                uploader=info.get("uploader") or info.get("channel"),
                platform=detect_platform(url, info.get("extractor_key") or info.get("extractor")),
                entry_count=len(entries),
                entries=entries
            )

        # Single video handling
        video_id = info.get("id", "")
        title = info.get("title", "Unknown Video")
        duration = info.get("duration", 0)
        thumbnail = info.get("thumbnail")
        if not thumbnail and info.get("thumbnails"):
            thumbnail = info["thumbnails"][-1].get("url")

        formats = info.get("formats", [])
        video_formats_map: dict[str, VideoFormatOption] = {}
        audio_formats_map: dict[str, AudioFormatOption] = {}

        for f in formats:
            vcodec = f.get("vcodec")
            acodec = f.get("acodec")
            height = f.get("height")
            fps = f.get("fps")
            ext = f.get("ext", "mp4")
            filesize = f.get("filesize") or f.get("filesize_approx")
            format_id = f.get("format_id", "")
            dynamic_range = f.get("dynamic_range")
            is_hdr = dynamic_range in ["HDR", "HDR10", "HLG", "DolbyVision"] or "HDR" in f.get("format_note", "")

            # Audio-only streams
            if (vcodec == "none" or not vcodec) and acodec != "none" and acodec:
                abr = f.get("abr") or f.get("tbr")
                if abr:
                    abr = int(abr)
                audio_key = f"{ext}_{abr or 0}"
                if audio_key not in audio_formats_map or (filesize and (audio_formats_map[audio_key].filesize_approx or 0) < filesize):
                    audio_formats_map[audio_key] = AudioFormatOption(
                        format_id=format_id,
                        ext=ext,
                        abr=abr,
                        filesize_approx=filesize,
                        filesize_formatted=format_bytes(filesize),
                        acodec=acodec,
                        is_recommended=(abr is not None and abr >= 128),
                        note=f"{acodec} @ {abr}kbps" if abr else acodec
                    )

            # Video streams
            elif height and height >= 144:
                rounded_fps = int(round(fps)) if fps is not None else None
                rounded_height = int(round(height))
                res_label = f"{rounded_height}p"
                if rounded_fps and rounded_fps >= 50:
                    res_label += f"{rounded_fps}"
                if is_hdr:
                    res_label += " HDR"

                key = f"{rounded_height}p_{rounded_fps or 30}_{is_hdr}_{ext}"
                if key not in video_formats_map:
                    video_formats_map[key] = VideoFormatOption(
                        format_id=format_id,
                        resolution=f"{f.get('width', 0)}x{rounded_height}" if f.get("width") else f"{rounded_height}p",
                        height=rounded_height,
                        fps=rounded_fps,
                        ext=ext,
                        filesize_approx=filesize,
                        filesize_formatted=format_bytes(filesize),
                        vcodec=vcodec,
                        acodec=acodec,
                        is_hdr=is_hdr,
                        has_audio=(acodec != "none" and acodec is not None),
                        is_recommended=(rounded_height in [1080, 2160, 4320]),
                        note=f"{vcodec} / {rounded_fps or 30}fps" if vcodec else None
                    )

        # Standard video presets
        sorted_videos = sorted(
            video_formats_map.values(),
            key=lambda v: (v.height or 0, v.fps or 0, 1 if v.is_hdr else 0),
            reverse=True
        )

        # Subtitles
        subtitles: list[SubtitleOption] = []
        raw_subs = info.get("subtitles") or {}
        raw_auto_subs = info.get("automatic_captions") or {}

        for lang, sub_entries in raw_subs.items():
            if sub_entries:
                subtitles.append(
                    SubtitleOption(
                        lang=lang,
                        name=sub_entries[0].get("name", lang),
                        ext="srt",
                        url=sub_entries[0].get("url")
                    )
                )
        for lang, sub_entries in raw_auto_subs.items():
            if lang in ["vi", "en", "ja", "ko"] and sub_entries and not any(s.lang == lang for s in subtitles):
                subtitles.append(
                    SubtitleOption(
                        lang=lang,
                        name=f"{lang.upper()} (Tự động)",
                        ext="srt",
                        url=sub_entries[0].get("url")
                    )
                )

        # Chapters
        chapters: list[ChapterItem] = []
        for ch in info.get("chapters") or []:
            chapters.append(
                ChapterItem(
                    title=ch.get("title", "Chapter"),
                    start_time=float(ch.get("start_time", 0)),
                    end_time=float(ch.get("end_time", 0))
                )
            )

        return VideoInfoResponse(
            id=video_id,
            url=url,
            title=title,
            uploader=info.get("uploader"),
            uploader_url=info.get("uploader_url"),
            channel=info.get("channel"),
            platform=detect_platform(url, info.get("extractor_key") or info.get("extractor")),
            duration=duration,
            duration_formatted=format_duration(duration),
            thumbnail=thumbnail,
            view_count=info.get("view_count"),
            like_count=info.get("like_count"),
            description=info.get("description"),
            is_live=bool(info.get("is_live")),
            is_short=is_short_url(url, duration),
            video_formats=sorted_videos[:12],
            audio_formats=list(audio_formats_map.values()),
            subtitles=subtitles[:10],
            chapters=chapters
        )

ytdlp_service = YtDlpService()
