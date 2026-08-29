export interface VideoFormatOption {
  format_id: string;
  resolution?: string;
  height?: number;
  fps?: number;
  ext: string;
  filesize_approx?: number;
  filesize_formatted?: string;
  vcodec?: string;
  acodec?: string;
  is_hdr: boolean;
  has_audio: boolean;
  is_recommended: boolean;
  note?: string;
}

export interface AudioFormatOption {
  format_id: string;
  ext: string;
  abr?: number;
  filesize_approx?: number;
  filesize_formatted?: string;
  acodec?: string;
  is_recommended: boolean;
  note?: string;
}

export interface SubtitleOption {
  lang: string;
  name: string;
  ext: string;
  url?: string;
}

export interface ChapterItem {
  title: string;
  start_time: number;
  end_time: number;
}

export interface VideoInfo {
  id: string;
  url: string;
  title: string;
  uploader?: string;
  uploader_url?: string;
  channel?: string;
  platform?: string;
  duration: number;
  duration_formatted: string;
  thumbnail?: string;
  view_count?: number;
  like_count?: number;
  description?: string;
  is_live: boolean;
  is_short: boolean;
  video_formats: VideoFormatOption[];
  audio_formats: AudioFormatOption[];
  subtitles: SubtitleOption[];
  chapters: ChapterItem[];
}

export interface PlaylistItem {
  id: string;
  title: string;
  url: string;
  duration?: number;
  duration_formatted?: string;
  thumbnail?: string;
  uploader?: string;
}

export interface PlaylistInfo {
  id: string;
  title: string;
  uploader?: string;
  platform?: string;
  entry_count: number;
  entries: PlaylistItem[];
}

export interface TrimConfig {
  enabled: boolean;
  start_time: number;
  end_time: number;
}

export interface DownloadRequestPayload {
  url: string;
  media_type: 'video' | 'audio';
  format_id?: string;
  quality_preset?: string;
  target_ext: string;
  audio_bitrate?: string;
  embed_thumbnail?: boolean;
  embed_metadata?: boolean;
  embed_subtitles?: boolean;
  subtitle_lang?: string;
  trim?: TrimConfig;
  proxy?: string;
  audio_effect?: 'none' | 'karaoke' | 'vocal_only';
  normalize_loudness?: boolean;
}

export interface BatchDownloadPayload {
  urls: string[];
  media_type: 'video' | 'audio';
  quality_preset?: string;
  target_ext: string;
  audio_bitrate?: string;
  playlist_title?: string;
  proxy?: string;
  audio_effect?: 'none' | 'karaoke' | 'vocal_only';
  normalize_loudness?: boolean;
}

export type TaskStatus =
  | 'pending'
  | 'starting'
  | 'downloading'
  | 'merging'
  | 'converting'
  | 'trimming'
  | 'processing_ai'
  | 'completed'
  | 'error';

export interface TaskProgress {
  task_id: string;
  status: TaskStatus;
  percent: number;
  speed_formatted: string;
  eta_formatted: string;
  downloaded_bytes: number;
  total_bytes: number;
  message: string;
  filename?: string;
  download_url?: string;
  error?: string;
}

export interface HistoryItem {
  id: string;
  title: string;
  url?: string;
  thumbnail?: string;
  media_type: 'video' | 'audio';
  quality: string;
  target_ext?: string;
  download_url: string;
  filename: string;
  timestamp: number;
}

export interface AISummaryHighlight {
  time_seconds: number;
  time_formatted: string;
  title: string;
  summary: string;
}

export interface AISummaryData {
  title: string;
  overview: string;
  key_points: string[];
  highlights: AISummaryHighlight[];
  tags: string[];
  source: string;
}

// ── Plan 6: Watched Channels & Cloud Sync Types ──────────────────────────────

export interface WatchedChannel {
  id: string;
  name: string;
  url: string;
  platform: string;
  quality_preset: string;
  media_type: 'video' | 'audio';
  audio_effect: 'none' | 'karaoke' | 'vocal_only';
  auto_download: boolean;
  last_checked_at?: string;
  last_video_title?: string;
  downloaded_video_ids: string[];
  created_at: string;
}

export interface WatchedChannelCreatePayload {
  url: string;
  name?: string;
  quality_preset: string;
  media_type: 'video' | 'audio';
  audio_effect: 'none' | 'karaoke' | 'vocal_only';
  auto_download: boolean;
}

export interface CloudConfig {
  telegram_bot_token: string;
  telegram_chat_id: string;
  auto_sync_telegram: boolean;
  gdrive_enabled: boolean;
  gdrive_folder_id: string;
}

export interface CloudConfigPayload {
  telegram_bot_token?: string;
  telegram_chat_id?: string;
  auto_sync_telegram?: boolean;
  gdrive_enabled?: boolean;
  gdrive_folder_id?: string;
}

export interface TelegramTestResponse {
  status: 'success' | 'error';
  bot_name?: string;
  message: string;
}
