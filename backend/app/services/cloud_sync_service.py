import json
import logging
import threading
from pathlib import Path
from typing import Any
import httpx

from app.schemas.models import CloudConfig, CloudConfigUpdate

logger = logging.getLogger(__name__)

DATA_DIR = Path(__file__).resolve().parent.parent / "data"
CONFIG_FILE = DATA_DIR / "cloud_config.json"


class CloudSyncService:
    def __init__(self):
        self._lock = threading.Lock()
        self._ensure_storage()
        self._config: dict[str, Any] = self._load()

    def _ensure_storage(self):
        DATA_DIR.mkdir(parents=True, exist_ok=True)
        if not CONFIG_FILE.exists():
            default_cfg = {
                "telegram_bot_token": "",
                "telegram_chat_id": "",
                "auto_sync_telegram": False,
                "gdrive_enabled": False,
                "gdrive_folder_id": ""
            }
            with open(CONFIG_FILE, "w", encoding="utf-8") as f:
                json.dump(default_cfg, f, ensure_ascii=False, indent=2)

    def _load(self) -> dict[str, Any]:
        try:
            with open(CONFIG_FILE, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception as e:
            logger.error(f"Failed to load cloud config: {e}")
            return {
                "telegram_bot_token": "",
                "telegram_chat_id": "",
                "auto_sync_telegram": False,
                "gdrive_enabled": False,
                "gdrive_folder_id": ""
            }

    def _save(self):
        try:
            with open(CONFIG_FILE, "w", encoding="utf-8") as f:
                json.dump(self._config, f, ensure_ascii=False, indent=2)
        except Exception as e:
            logger.error(f"Failed to save cloud config: {e}")

    def get_config(self) -> CloudConfig:
        with self._lock:
            return CloudConfig(**self._config)

    def update_config(self, update: CloudConfigUpdate) -> CloudConfig:
        with self._lock:
            update_data = update.model_dump(exclude_unset=True)
            self._config.update(update_data)
            self._save()
            return CloudConfig(**self._config)

    def is_auto_sync_enabled(self) -> bool:
        with self._lock:
            return (
                self._config.get("auto_sync_telegram", False)
                and bool(self._config.get("telegram_bot_token"))
                and bool(self._config.get("telegram_chat_id"))
            )

    def test_telegram(self, bot_token: str, chat_id: str) -> dict[str, Any]:
        token = bot_token.strip()
        cid = chat_id.strip()
        if not token or not cid:
            return {"status": "error", "message": "Bot Token và Chat ID không được để trống."}

        try:
            with httpx.Client(timeout=10.0) as client:
                # Check bot info
                me_res = client.get(f"https://api.telegram.org/bot{token}/getMe")
                if me_res.status_code != 200:
                    return {"status": "error", "message": "Bot Token không hợp lệ hoặc đã bị thu hồi."}
                
                bot_name = me_res.json().get("result", {}).get("first_name", "Telegram Bot")

                # Send test message
                msg_payload = {
                    "chat_id": cid,
                    "text": f"🎉 <b>FEAR TubeStudio</b> đã kết nối thành công với Bot <b>{bot_name}</b>!\n\nTừ nay, file tải về và thông báo tác vụ sẽ được tự động đồng bộ trực tiếp vào đây.",
                    "parse_mode": "HTML"
                }
                msg_res = client.post(f"https://api.telegram.org/bot{token}/sendMessage", json=msg_payload)
                if msg_res.status_code != 200:
                    return {"status": "error", "message": f"Không thể gửi tin nhắn tới Chat ID: {msg_res.text}"}

                return {
                    "status": "success",
                    "bot_name": bot_name,
                    "message": f"Kết nối thành công với Bot @{me_res.json().get('result', {}).get('username', bot_name)}!"
                }
        except Exception as e:
            return {"status": "error", "message": f"Lỗi kết nối Telegram: {str(e)}"}

    def send_file_to_telegram(self, file_path: Path, caption: str | None = None) -> dict[str, Any]:
        with self._lock:
            token = self._config.get("telegram_bot_token", "").strip()
            cid = self._config.get("telegram_chat_id", "").strip()

        if not token or not cid:
            return {"status": "error", "message": "Chưa cấu hình Telegram Bot Token hoặc Chat ID."}

        if not file_path.exists():
            return {"status": "error", "message": f"File không tồn tại: {file_path.name}"}

        # Telegram Bot API standard file size limit is 50MB
        file_size_mb = file_path.stat().st_size / (1024 * 1024)
        ext = file_path.suffix.lower()

        try:
            with httpx.Client(timeout=120.0) as client:
                if file_size_mb > 50:
                    # Send message with local link info instead of raw file
                    msg_text = f"📦 <b>FEAR TubeStudio — File Hoàn Tất</b>\n\n📁 Tên file: <code>{file_path.name}</code>\n💾 Dung lượng: <b>{file_size_mb:.1f} MB</b> (Vượt quá giới hạn 50MB của Telegram Bot)\n\n<i>{caption or ''}</i>"
                    client.post(
                        f"https://api.telegram.org/bot{token}/sendMessage",
                        json={"chat_id": cid, "text": msg_text, "parse_mode": "HTML"}
                    )
                    return {"status": "warning", "message": "File > 50MB, đã gửi thông báo thông tin file."}

                send_caption = caption or f"🚀 {file_path.name} (Xuất bởi FEAR TubeStudio)"
                with open(file_path, "rb") as f:
                    if ext in [".mp3", ".m4a", ".flac", ".wav", ".opus"]:
                        res = client.post(
                            f"https://api.telegram.org/bot{token}/sendAudio",
                            data={"chat_id": cid, "caption": send_caption[:1024]},
                            files={"audio": (file_path.name, f)}
                        )
                    elif ext in [".mp4", ".mkv", ".webm"]:
                        res = client.post(
                            f"https://api.telegram.org/bot{token}/sendVideo",
                            data={"chat_id": cid, "caption": send_caption[:1024]},
                            files={"video": (file_path.name, f)}
                        )
                    else:
                        res = client.post(
                            f"https://api.telegram.org/bot{token}/sendDocument",
                            data={"chat_id": cid, "caption": send_caption[:1024]},
                            files={"document": (file_path.name, f)}
                        )

                if res.status_code == 200:
                    return {"status": "success", "message": f"Đã gửi file {file_path.name} tới Telegram!"}
                else:
                    return {"status": "error", "message": f"Telegram API error: {res.text}"}
        except Exception as e:
            logger.error(f"Failed to send file to Telegram: {e}")
            return {"status": "error", "message": f"Lỗi gửi file: {str(e)}"}


cloud_sync = CloudSyncService()
