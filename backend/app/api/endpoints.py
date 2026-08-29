import os
import re
import ipaddress
import unicodedata
import threading
import urllib.parse
from pathlib import Path
from fastapi import APIRouter, HTTPException, BackgroundTasks, Body
from fastapi.responses import FileResponse
from sse_starlette.sse import EventSourceResponse
from pydantic import BaseModel
import yt_dlp

from app.config import settings
from app.services.ytdlp_service import YtDlpService
from app.services.ffmpeg_service import get_ffmpeg_version
from app.services.task_manager import task_manager
from app.services.ai_service import ai_service
from app.services.channel_watcher import channel_watcher
from app.services.cloud_sync_service import cloud_sync
from app.schemas.models import (
    VideoInfoResponse,
    PlaylistInfoResponse,
    DownloadRequest,
    BatchDownloadRequest,
    TaskProgress,
    AISummaryRequest,
    AISummaryResponse,
    WatchedChannel,
    WatchedChannelCreate,
    CloudConfig,
    CloudConfigUpdate,
    TelegramTestRequest,
)

router = APIRouter(prefix="/api")
ytdlp_service = YtDlpService()

# ── SSRF Protection & Multi-Platform Validation ────────────────────────────────
_ALLOWED_MEDIA_ROOT_DOMAINS = (
    "youtube.com",
    "youtu.be",
    "youtube-nocookie.com",
    "tiktok.com",
    "facebook.com",
    "fb.watch",
    "instagram.com",
    "instagr.am",
    "twitter.com",
    "x.com",
    "soundcloud.com",
    "bilibili.com",
    "b23.tv",
    "vimeo.com",
    "reddit.com",
    "threads.net",
    "mixcloud.com",
)

def _is_allowed_media_host(host: str) -> bool:
    host = host.lower().strip(".")
    for root in _ALLOWED_MEDIA_ROOT_DOMAINS:
        if host == root or host.endswith("." + root):
            return True
    return False

# Only safe HTTP schemes are allowed
_SAFE_SCHEMES: frozenset = frozenset({"http", "https"})

# Private / link-local / loopback CIDRs — block these for SSRF protection
_BLOCKED_CIDRS = [
    ipaddress.ip_network("10.0.0.0/8"),
    ipaddress.ip_network("172.16.0.0/12"),
    ipaddress.ip_network("192.168.0.0/16"),
    ipaddress.ip_network("127.0.0.0/8"),
    ipaddress.ip_network("169.254.0.0/16"),   # AWS/GCP metadata
    ipaddress.ip_network("::1/128"),
    ipaddress.ip_network("fc00::/7"),
    ipaddress.ip_network("fe80::/10"),
]


def _validate_youtube_url(raw_url: str) -> str:
    """
    Strictly validate that the URL is a safe, real media URL from supported platforms.
    Raises HTTPException(400) on any violation.
    Returns the stripped URL on success.
    """
    url = raw_url.strip()
    if not url:
        raise HTTPException(status_code=400, detail="URL không được để trống.")

    try:
        parsed = urllib.parse.urlparse(url)
    except Exception:
        raise HTTPException(status_code=400, detail="URL không hợp lệ.")

    # 1. Scheme must be http or https only — blocks file://, dict://, gopher://, etc.
    scheme = (parsed.scheme or "").lower()
    if scheme not in _SAFE_SCHEMES:
        raise HTTPException(
            status_code=400,
            detail=f"[SSRF Block] Scheme '{scheme}://' bị chặn. Chỉ chấp nhận https://."
        )

    # 2. Hostname must be an allowed media domain
    host = (parsed.hostname or "").lower().strip(".")
    if not host:
        raise HTTPException(status_code=400, detail="URL thiếu hostname.")
    if not _is_allowed_media_host(host):
        raise HTTPException(
            status_code=400,
            detail=f"[SSRF Block] Host '{host}' không được hỗ trợ. Chỉ hỗ trợ YouTube, TikTok, Facebook, Instagram, SoundCloud, X/Twitter, Bilibili."
        )

    # 3. Reject numeric IP literals — blocks http://1.2.3.4/?ref=youtube.com
    try:
        addr = ipaddress.ip_address(host)
        for net in _BLOCKED_CIDRS:
            if addr in net:
                raise HTTPException(
                    status_code=400,
                    detail="[SSRF Block] IP nội bộ / link-local bị chặn vì lý do bảo mật."
                )
    except ValueError:
        pass  # Normal hostname, not an IP literal — safe

    # 4. Port must be standard HTTP/HTTPS (None, 80, 443) — prevents port-scan / intranet pivoting
    if parsed.port is not None and parsed.port not in (80, 443):
        raise HTTPException(
            status_code=400,
            detail="[SSRF Block] Port không hợp lệ. Chỉ chấp nhận port 80/443."
        )

    # 5. Reject URLs with credentials embedded in netloc / authority
    if parsed.username or parsed.password or "@" in parsed.netloc:
        raise HTTPException(
            status_code=400,
            detail="[SSRF Block] URL không được chứa thông tin xác thực (user:password@...)."
        )

    # 6. Reject fragment authority confusion tricks (e.g. #@attacker.com)
    if parsed.fragment and ("@" in parsed.fragment or "/" in parsed.fragment or "\\" in parsed.fragment):
        raise HTTPException(
            status_code=400,
            detail="[SSRF Block] URL chứa fragment không hợp lệ."
        )

    # 7. Reject control chars and unencoded quotes
    if any(ord(c) < 32 or c in ('"', "'", "`", "<", ">") for c in url):
        raise HTTPException(
            status_code=400,
            detail="[SSRF Block] URL chứa ký tự điều khiển hoặc không hợp lệ."
        )

    # Strip fragments for downstream processing safety
    clean_url = urllib.parse.urlunparse(parsed._replace(fragment=""))
    return clean_url
# ───────────────────────────────────────────────────────────────────────────────


@router.get("/health")
async def health_check():
    return {
        "status": "online",
        "app_name": settings.APP_NAME,
        "version": settings.VERSION,
        "ffmpeg": get_ffmpeg_version(),
        "ytdlp": yt_dlp.version.__version__
    }


class InfoRequest(DownloadRequest):
    pass


@router.post("/info")
async def get_info(req: DownloadRequest):
    url = _validate_youtube_url(req.url)
    proxy = _validate_proxy(req.proxy)

    cookie_file = None
    default_cookie = settings.COOKIES_DIR / "youtube_cookies.txt"
    if default_cookie.exists():
        cookie_file = str(default_cookie)

    try:
        import asyncio
        data = await asyncio.to_thread(ytdlp_service.extract_info, url, proxy=proxy, cookie_file=cookie_file)
        return data
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Không thể lấy thông tin video: {str(e)}")


_ALLOWED_EXTENSIONS = frozenset({"mp4", "mkv", "webm", "mp3", "m4a", "flac", "wav", "opus"})
_ALLOWED_BITRATES = frozenset({"320k", "256k", "192k", "128k", "64k"})

def _validate_download_params(req: DownloadRequest):
    """VULN-07 Fix: Strictly validate all parameters before queueing tasks."""
    ext = (req.target_ext or "").lower().strip()
    if ext not in _ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"[Param Block] Định dạng xuất '{ext}' không hợp lệ. Chỉ chấp nhận: {', '.join(sorted(_ALLOWED_EXTENSIONS))}."
        )
    req.target_ext = ext

    if req.media_type == "audio":
        br = (req.audio_bitrate or "").lower().strip()
        if br not in _ALLOWED_BITRATES:
            raise HTTPException(
                status_code=400,
                detail=f"[Param Block] Bitrate '{br}' không hợp lệ. Chỉ chấp nhận: {', '.join(sorted(_ALLOWED_BITRATES))}."
            )
        req.audio_bitrate = br

    if req.format_id:
        # Prevent format selector injection
        fid = req.format_id.strip()
        if not re.match(r"^[a-zA-Z0-9_\-\+]+$", fid) and fid != "best":
            raise HTTPException(
                status_code=400,
                detail="[Param Block] Format ID chứa ký tự không hợp lệ."
            )
        req.format_id = fid

    # Validate AI Audio Effect
    eff = (req.audio_effect or "none").lower().strip()
    if eff not in ("none", "karaoke", "vocal_only"):
        raise HTTPException(status_code=400, detail="[Param Block] Hiệu ứng âm thanh không hợp lệ.")
    req.audio_effect = eff


@router.post("/ai/summarize", response_model=AISummaryResponse)
async def summarize_video_endpoint(req: AISummaryRequest):
    """AI Video Summarization & Chapter Breakdown via Gemini Flash AI."""
    if not req.title or not req.title.strip():
        raise HTTPException(status_code=400, detail="Tiêu đề video không được để trống.")
    if req.url:
        _validate_youtube_url(req.url)
    
    summary_data = await ai_service.summarize_video(req)
    return summary_data


@router.post("/download/start")
async def start_download(req: DownloadRequest, background_tasks: BackgroundTasks):
    url = _validate_youtube_url(req.url)
    req.url = url
    req.proxy = _validate_proxy(req.proxy)
    _validate_download_params(req)

    task_id = task_manager.create_task()

    thread = threading.Thread(
        target=task_manager.run_download_sync,
        args=(task_id, req),
        daemon=True
    )
    thread.start()

    return {"task_id": task_id, "status": "queued"}


@router.post("/download/batch")
async def start_batch_download(req: BatchDownloadRequest):
    if not req.urls or len(req.urls) == 0:
        raise HTTPException(status_code=400, detail="No URLs provided in batch request.")

    # Validate parameters
    ext = (req.target_ext or "").lower().strip()
    if ext not in _ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"[Param Block] Định dạng xuất '{ext}' không hợp lệ."
        )
    req.target_ext = ext

    br = (req.audio_bitrate or "").lower().strip()
    if br not in _ALLOWED_BITRATES:
        raise HTTPException(
            status_code=400,
            detail=f"[Param Block] Bitrate '{br}' không hợp lệ."
        )
    req.audio_bitrate = br

    req.proxy = _validate_proxy(req.proxy)

    # Validate ALL URLs in the batch before starting any task
    validated_urls = []
    for raw_url in req.urls:
        validated_urls.append(_validate_youtube_url(raw_url))
    req.urls = validated_urls

    task_id = task_manager.create_task()

    thread = threading.Thread(
        target=task_manager.run_batch_download_sync,
        args=(task_id, req),
        daemon=True
    )
    thread.start()

    return {"task_id": task_id, "status": "queued", "count": len(req.urls)}


@router.get("/download/progress/{task_id}")
async def get_progress_stream(task_id: str):
    task = task_manager.get_task(task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found.")
    return EventSourceResponse(task_manager.subscribe(task_id))


@router.get("/download/status/{task_id}", response_model=TaskProgress)
async def get_task_status(task_id: str):
    task = task_manager.get_task(task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found.")
    return task


def sanitize_ascii_filename(name: str) -> str:
    nfkd = unicodedata.normalize('NFKD', name)
    ascii_only = nfkd.encode('ASCII', 'ignore').decode('ASCII')
    cleaned = re.sub(r'[^a-zA-Z0-9\.\-\_\s]', '_', ascii_only).strip()
    return cleaned or "media"


@router.get("/download/file/{task_id}")
async def download_file(task_id: str):
    file_path = task_manager.get_task_file(task_id)
    if not file_path or not file_path.exists():
        raise HTTPException(status_code=404, detail="File not ready or expired.")

    filename = file_path.name.replace(f"{task_id}_", "")
    if filename.startswith("trimmed_"):
        filename = filename.replace("trimmed_", "[Trimmed] ")

    encoded_filename = urllib.parse.quote(filename)
    safe_ascii_filename = sanitize_ascii_filename(filename)

    media_type = "application/octet-stream"
    if filename.endswith(".mp4"):
        media_type = "video/mp4"
    elif filename.endswith(".mkv"):
        media_type = "video/x-matroska"
    elif filename.endswith(".mp3"):
        media_type = "audio/mpeg"
    elif filename.endswith(".m4a"):
        media_type = "audio/mp4"
    elif filename.endswith(".flac"):
        media_type = "audio/flac"
    elif filename.endswith(".wav"):
        media_type = "audio/wav"
    elif filename.endswith(".opus"):
        media_type = "audio/opus"
    elif filename.endswith(".zip"):
        media_type = "application/zip"

    headers = {
        "Content-Disposition": f"attachment; filename=\"{safe_ascii_filename}\"; filename*=UTF-8''{encoded_filename}",
        "Access-Control-Expose-Headers": "Content-Disposition",
        "Cache-Control": "public, max-age=3600",
    }

    return FileResponse(
        path=file_path,
        media_type=media_type,
        headers=headers
    )


# ── VULN-05: Proxy Validator ───────────────────────────────────────────────────
_PROXY_ALLOWED_SCHEMES = frozenset({"http", "https", "socks5", "socks5h", "socks4", "socks4a"})

def _validate_proxy(proxy: str | None) -> str | None:
    """
    Reject proxy strings that point to private/loopback addresses
    or use disallowed schemes. Returns the proxy string if valid, None if empty.
    """
    if not proxy or not proxy.strip():
        return None
    p = proxy.strip()
    try:
        parsed = urllib.parse.urlparse(p)
    except Exception:
        raise HTTPException(status_code=400, detail="[Proxy Block] Proxy URL không hợp lệ.")

    scheme = (parsed.scheme or "").lower()
    if scheme not in _PROXY_ALLOWED_SCHEMES:
        raise HTTPException(
            status_code=400,
            detail=f"[Proxy Block] Scheme '{scheme}' không được phép làm proxy. Dùng http/https/socks5."
        )

    host = (parsed.hostname or "").lower()
    # Block loopback / link-local to prevent proxy pivoting into localhost services
    for net in _BLOCKED_CIDRS:
        try:
            addr = ipaddress.ip_address(host)
            if addr in net:
                raise HTTPException(
                    status_code=400,
                    detail="[Proxy Block] Proxy trỏ vào địa chỉ nội bộ bị chặn."
                )
        except ValueError:
            # Not an IP, check hostname
            if host in ("localhost", "127.0.0.1", "::1", "0.0.0.0"):
                raise HTTPException(
                    status_code=400,
                    detail="[Proxy Block] Proxy trỏ vào localhost bị chặn."
                )
    return p
# ───────────────────────────────────────────────────────────────────────────────


# ── VULN-04: Cookie Save with Size Limit & Format Guard ───────────────────────
_MAX_COOKIE_BYTES = 512 * 1024  # 512 KB hard cap

class CookieSaveRequest(BaseModel):
    content: str  # Full Netscape HTTP cookie file content

@router.post("/cookie/save")
async def save_cookies(req: CookieSaveRequest):
    stripped = req.content.strip()
    if not stripped:
        raise HTTPException(status_code=400, detail="Cookie content is empty.")

    # Size guard — prevent disk-fill DoS (VULN-04)
    if len(stripped.encode("utf-8")) > _MAX_COOKIE_BYTES:
        raise HTTPException(
            status_code=413,
            detail=f"[Cookie Block] Cookie quá lớn (> {_MAX_COOKIE_BYTES // 1024}KB). Vui lòng kiểm tra lại file."
        )

    # Format guard — must start with Netscape cookie file header
    first_line = stripped.splitlines()[0] if stripped.splitlines() else ""
    if (
        not first_line.startswith("# Netscape HTTP Cookie File")
        and not first_line.startswith("# HTTP Cookie File")
    ):
        raise HTTPException(
            status_code=400,
            detail="[Cookie Block] File cookie không đúng định dạng Netscape. Hãy xuất đúng cách từ trình duyệt."
        )

    cookie_path = settings.COOKIES_DIR / "youtube_cookies.txt"
    cookie_path.write_text(stripped, encoding="utf-8")
    return {"status": "success", "message": "Cookie đã lưu thành công."}
# ───────────────────────────────────────────────────────────────────────────────


# ── Plan 6: Channel Auto-Watcher Endpoints ────────────────────────────────────

@router.get("/watcher/channels", response_model=list[WatchedChannel])
async def get_watched_channels():
    return channel_watcher.get_channels()

@router.post("/watcher/channel", response_model=WatchedChannel)
async def add_watched_channel(req: WatchedChannelCreate):
    _validate_youtube_url(req.url)
    return channel_watcher.add_channel(req)

@router.delete("/watcher/channel/{channel_id}")
async def delete_watched_channel(channel_id: str):
    success = channel_watcher.delete_channel(channel_id)
    if not success:
        raise HTTPException(status_code=404, detail="Không tìm thấy kênh cần xóa.")
    return {"status": "success", "message": "Đã xóa kênh khỏi danh sách theo dõi."}

@router.post("/watcher/channel/{channel_id}/toggle")
async def toggle_watched_channel(channel_id: str, auto_download: bool = Body(..., embed=True)):
    ch = channel_watcher.toggle_channel(channel_id, auto_download)
    if not ch:
        raise HTTPException(status_code=404, detail="Không tìm thấy kênh.")
    return ch

@router.post("/watcher/channel/{channel_id}/scan")
async def scan_single_channel(channel_id: str):
    res = channel_watcher.scan_channel(channel_id)
    return res

@router.post("/watcher/scan-all")
async def scan_all_watched_channels():
    res = channel_watcher.scan_all_channels()
    return {"status": "success", "results": res}


# ── Plan 6: Cloud Sync & Telegram Endpoints ───────────────────────────────────

@router.get("/cloud/config", response_model=CloudConfig)
async def get_cloud_config():
    return cloud_sync.get_config()

@router.post("/cloud/config", response_model=CloudConfig)
async def update_cloud_config(update: CloudConfigUpdate):
    return cloud_sync.update_config(update)

@router.post("/cloud/telegram/test")
async def test_telegram_connection(req: TelegramTestRequest):
    return cloud_sync.test_telegram(req.bot_token, req.chat_id)

@router.post("/cloud/telegram/send/{task_id}")
async def send_task_file_to_telegram(task_id: str):
    file_path = task_manager.task_files.get(task_id)
    if not file_path or not file_path.exists():
        raise HTTPException(status_code=404, detail="Không tìm thấy file của tác vụ đã chỉ định.")
    res = cloud_sync.send_file_to_telegram(file_path)
    return res
