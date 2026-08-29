import os
import json
import time
import uuid
import logging
import threading
from datetime import datetime
from pathlib import Path
from typing import Any

from app.config import settings
from app.schemas.models import WatchedChannel, WatchedChannelCreate, DownloadRequest
from app.services.ytdlp_service import ytdlp_service, detect_platform
from app.services.task_manager import task_manager

logger = logging.getLogger(__name__)

DATA_DIR = Path(__file__).resolve().parent.parent / "data"
CHANNELS_FILE = DATA_DIR / "watched_channels.json"


class ChannelWatcherService:
    def __init__(self):
        self._lock = threading.Lock()
        self._ensure_storage()
        self._channels: dict[str, dict[str, Any]] = self._load()
        self._watcher_thread: threading.Thread | None = None
        self._running = False
        self.start_background_scanner()

    def _ensure_storage(self):
        DATA_DIR.mkdir(parents=True, exist_ok=True)
        if not CHANNELS_FILE.exists():
            with open(CHANNELS_FILE, "w", encoding="utf-8") as f:
                json.dump({}, f, ensure_ascii=False, indent=2)

    def _load(self) -> dict[str, dict[str, Any]]:
        try:
            with open(CHANNELS_FILE, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception as e:
            logger.error(f"Failed to load watched channels: {e}")
            return {}

    def _save(self):
        try:
            with open(CHANNELS_FILE, "w", encoding="utf-8") as f:
                json.dump(self._channels, f, ensure_ascii=False, indent=2)
        except Exception as e:
            logger.error(f"Failed to save watched channels: {e}")

    def get_channels(self) -> list[WatchedChannel]:
        with self._lock:
            items = []
            for ch in self._channels.values():
                try:
                    items.append(WatchedChannel(**ch))
                except Exception:
                    pass
            return sorted(items, key=lambda x: x.created_at, reverse=True)

    def add_channel(self, req: WatchedChannelCreate) -> WatchedChannel:
        url = req.url.strip()
        channel_id = str(uuid.uuid4())
        platform = detect_platform(url)

        name = req.name
        if not name:
            try:
                info = ytdlp_service.extract_info(url)
                name = getattr(info, "title", None) or getattr(info, "uploader", None) or getattr(info, "channel", None) or "Watched Channel"
            except Exception:
                name = f"Kênh {platform.capitalize()}"

        now_iso = datetime.now().isoformat()
        channel_data = {
            "id": channel_id,
            "name": name,
            "url": url,
            "platform": platform,
            "quality_preset": req.quality_preset,
            "media_type": req.media_type,
            "audio_effect": req.audio_effect,
            "auto_download": req.auto_download,
            "last_checked_at": None,
            "last_video_title": None,
            "downloaded_video_ids": [],
            "created_at": now_iso
        }

        with self._lock:
            self._channels[channel_id] = channel_data
            self._save()

        threading.Thread(target=self.scan_channel, args=(channel_id,), daemon=True).start()
        return WatchedChannel(**channel_data)

    def delete_channel(self, channel_id: str) -> bool:
        with self._lock:
            if channel_id in self._channels:
                del self._channels[channel_id]
                self._save()
                return True
            return False

    def toggle_channel(self, channel_id: str, auto_download: bool) -> WatchedChannel | None:
        with self._lock:
            if channel_id in self._channels:
                self._channels[channel_id]["auto_download"] = auto_download
                self._save()
                return WatchedChannel(**self._channels[channel_id])
            return None

    def scan_channel(self, channel_id: str) -> dict[str, Any]:
        with self._lock:
            channel_data = self._channels.get(channel_id)
            if not channel_data:
                return {"status": "error", "message": "Channel not found"}

        url = channel_data["url"]
        quality_preset = channel_data["quality_preset"]
        media_type = channel_data["media_type"]
        audio_effect = channel_data.get("audio_effect", "none")
        downloaded_ids = set(channel_data.get("downloaded_video_ids", []))
        auto_download = channel_data.get("auto_download", True)

        try:
            info = ytdlp_service.extract_info(url)
        except Exception as e:
            return {"status": "error", "message": f"Scan failed: {str(e)}"}

        new_tasks_started = []
        latest_title = None

        if hasattr(info, "entries") and info.entries:
            entries = info.entries[:3]
            for entry in entries:
                vid_id = getattr(entry, "id", "")
                vid_url = getattr(entry, "url", "")
                vid_title = getattr(entry, "title", "Video")

                if not latest_title:
                    latest_title = vid_title

                if vid_id and vid_id not in downloaded_ids:
                    downloaded_ids.add(vid_id)
                    if auto_download:
                        dl_req = DownloadRequest(
                            url=vid_url or url,
                            media_type=media_type,
                            quality_preset=quality_preset,
                            audio_effect=audio_effect,
                            target_ext="mp3" if media_type == "audio" else "mp4"
                        )
                        task_id = task_manager.start_download(dl_req)
                        new_tasks_started.append({"id": vid_id, "title": vid_title, "task_id": task_id})
        else:
            vid_id = getattr(info, "id", "")
            vid_title = getattr(info, "title", "Media")
            latest_title = vid_title
            if vid_id and vid_id not in downloaded_ids:
                downloaded_ids.add(vid_id)
                if auto_download:
                    dl_req = DownloadRequest(
                        url=url,
                        media_type=media_type,
                        quality_preset=quality_preset,
                        audio_effect=audio_effect,
                        target_ext="mp3" if media_type == "audio" else "mp4"
                    )
                    task_id = task_manager.start_download(dl_req)
                    new_tasks_started.append({"id": vid_id, "title": vid_title, "task_id": task_id})

        with self._lock:
            if channel_id in self._channels:
                self._channels[channel_id]["last_checked_at"] = datetime.now().isoformat()
                if latest_title:
                    self._channels[channel_id]["last_video_title"] = latest_title
                self._channels[channel_id]["downloaded_video_ids"] = list(downloaded_ids)
                self._save()

        return {
            "status": "success",
            "channel_id": channel_id,
            "new_items_found": len(new_tasks_started),
            "tasks": new_tasks_started
        }

    def scan_all_channels(self) -> list[dict[str, Any]]:
        results = []
        with self._lock:
            channel_ids = list(self._channels.keys())

        for c_id in channel_ids:
            res = self.scan_channel(c_id)
            results.append(res)
        return results

    def start_background_scanner(self):
        if self._running:
            return
        self._running = True

        def _loop():
            while self._running:
                try:
                    time.sleep(1800)
                    if self._running:
                        self.scan_all_channels()
                except Exception as e:
                    logger.error(f"Watcher background loop error: {e}")
                    time.sleep(60)

        self._watcher_thread = threading.Thread(target=_loop, daemon=True)
        self._watcher_thread.start()


channel_watcher = ChannelWatcherService()
