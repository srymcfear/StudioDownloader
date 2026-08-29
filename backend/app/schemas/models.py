from enum import Enum
from typing import Literal
from pydantic import BaseModel, Field

class MediaType(str, Enum):
    VIDEO = "video"
    AUDIO = "audio"
    PLAYLIST = "playlist"

class QualityPreset(str, Enum):
    BEST_8K = "4320p"
    BEST_4K = "2160p"
    BEST_2K = "1440p"
    FHD_1080P = "1080p"
    HD_720P = "720p"
    SD_480P = "480p"
    SD_360P = "360p"
    
    # Audio Presets
    MP3_320K = "mp3_320k"
    MP3_256K = "mp3_256k"
    MP3_192K = "mp3_192k"
    MP3_128K = "mp3_128k"
    M4A_BEST = "m4a_best"
    FLAC_LOSSLESS = "flac_lossless"
    WAV_LOSSLESS = "wav_lossless"
    OPUS_ORIGINAL = "opus_original"

class VideoFormatOption(BaseModel):
    format_id: str
    resolution: str | None = None
    height: int | float | None = None
    fps: float | int | None = None
    ext: str = "mp4"
    filesize_approx: int | float | None = None
    filesize_formatted: str | None = None
    vcodec: str | None = None
    acodec: str | None = None
    is_hdr: bool = False
    has_audio: bool = False
    is_recommended: bool = False
    note: str | None = None

class AudioFormatOption(BaseModel):
    format_id: str
    ext: str = "mp3"
    abr: int | float | None = None  # average bitrate in kbps
    filesize_approx: int | float | None = None
    filesize_formatted: str | None = None
    acodec: str | None = None
    is_recommended: bool = False
    note: str | None = None

class SubtitleOption(BaseModel):
    lang: str
    name: str
    ext: str = "srt"
    url: str | None = None

class ChapterItem(BaseModel):
    title: str
    start_time: float
    end_time: float

class VideoInfoResponse(BaseModel):
    id: str
    url: str
    title: str
    uploader: str | None = None
    uploader_url: str | None = None
    channel: str | None = None
    platform: str | None = "youtube"
    duration: int | float = 0
    duration_formatted: str = "00:00"
    thumbnail: str | None = None
    view_count: int | float | None = None
    like_count: int | float | None = None
    description: str | None = None
    is_live: bool = False
    is_short: bool = False
    video_formats: list[VideoFormatOption] = Field(default_factory=list)
    audio_formats: list[AudioFormatOption] = Field(default_factory=list)
    subtitles: list[SubtitleOption] = Field(default_factory=list)
    chapters: list[ChapterItem] = Field(default_factory=list)

class PlaylistItem(BaseModel):
    id: str
    title: str
    url: str
    duration: int | float | None = None
    duration_formatted: str | None = None
    thumbnail: str | None = None
    uploader: str | None = None

class PlaylistInfoResponse(BaseModel):
    id: str
    title: str
    uploader: str | None = None
    platform: str | None = "youtube"
    entry_count: int = 0
    entries: list[PlaylistItem] = Field(default_factory=list)

class TrimConfig(BaseModel):
    enabled: bool = False
    start_time: float = 0.0  # seconds
    end_time: float = 0.0    # seconds

class DownloadRequest(BaseModel):
    url: str
    media_type: Literal["video", "audio"] = "video"
    format_id: str | None = None
    quality_preset: str | None = None
    target_ext: str = "mp4"  # mp4, mkv, mp3, m4a, flac, wav, opus
    audio_bitrate: str = "320k"  # for mp3 conversion
    embed_thumbnail: bool = True
    embed_metadata: bool = True
    embed_subtitles: bool = False
    subtitle_lang: str | None = None
    trim: TrimConfig | None = None
    cookie_content: str | None = None
    proxy: str | None = None
    # AI & DSP Audio Enhancement (Plan 2)
    audio_effect: Literal["none", "karaoke", "vocal_only"] = "none"
    normalize_loudness: bool = False  # EBU R128 (-14 LUFS)

class TaskStatusEnum(str, Enum):
    PENDING = "pending"
    STARTING = "starting"
    DOWNLOADING = "downloading"
    MERGING = "merging"
    CONVERTING = "converting"
    TRIMMING = "trimming"
    PROCESSING_AI = "processing_ai"
    COMPLETED = "completed"
    ERROR = "error"

class TaskProgress(BaseModel):
    task_id: str
    status: TaskStatusEnum
    percent: float = 0.0
    speed_formatted: str = "0 KB/s"
    eta_formatted: str = "--:--"
    downloaded_bytes: int = 0
    total_bytes: int = 0
    message: str = "Initializing..."
    filename: str | None = None
    download_url: str | None = None
    error: str | None = None

class BatchDownloadRequest(BaseModel):
    urls: list[str]
    media_type: Literal["video", "audio"] = "audio"
    quality_preset: str = "mp3_320k"
    target_ext: str = "mp3"
    audio_bitrate: str = "320k"
    playlist_title: str | None = "Playlist"
    proxy: str | None = None
    audio_effect: Literal["none", "karaoke", "vocal_only"] = "none"
    normalize_loudness: bool = False

class AISummaryRequest(BaseModel):
    title: str
    description: str | None = None
    duration_seconds: float | int | None = None
    url: str | None = None

class AISummaryHighlight(BaseModel):
    time_seconds: float = 0.0
    time_formatted: str = "00:00"
    title: str
    summary: str

class AISummaryResponse(BaseModel):
    title: str
    overview: str
    key_points: list[str] = Field(default_factory=list)
    highlights: list[AISummaryHighlight] = Field(default_factory=list)
    tags: list[str] = Field(default_factory=list)
    source: str = "Gemini Flash AI Engine"

# ── Plan 6: Channel Auto-Watcher & Cloud Sync Schemas ─────────────────────────

class WatchedChannel(BaseModel):
    id: str
    name: str
    url: str
    platform: str = "youtube"
    quality_preset: str = "mp3_320k"
    media_type: Literal["video", "audio"] = "audio"
    audio_effect: Literal["none", "karaoke", "vocal_only"] = "none"
    auto_download: bool = True
    last_checked_at: str | None = None
    last_video_title: str | None = None
    downloaded_video_ids: list[str] = Field(default_factory=list)
    created_at: str

class WatchedChannelCreate(BaseModel):
    url: str
    name: str | None = None
    quality_preset: str = "mp3_320k"
    media_type: Literal["video", "audio"] = "audio"
    audio_effect: Literal["none", "karaoke", "vocal_only"] = "none"
    auto_download: bool = True

class CloudConfig(BaseModel):
    telegram_bot_token: str = ""
    telegram_chat_id: str = ""
    auto_sync_telegram: bool = False
    gdrive_enabled: bool = False
    gdrive_folder_id: str = ""

class CloudConfigUpdate(BaseModel):
    telegram_bot_token: str | None = None
    telegram_chat_id: str | None = None
    auto_sync_telegram: bool | None = None
    gdrive_enabled: bool | None = None
    gdrive_folder_id: str | None = None

class TelegramTestRequest(BaseModel):
    bot_token: str
    chat_id: str
