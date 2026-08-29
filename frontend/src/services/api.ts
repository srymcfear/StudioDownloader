import type {
  VideoInfo,
  PlaylistInfo,
  DownloadRequestPayload,
  BatchDownloadPayload,
  TaskProgress,
  WatchedChannel,
  WatchedChannelCreatePayload,
  CloudConfig,
  CloudConfigPayload,
  TelegramTestResponse,
} from '../types';

const API_BASE = '/api';

export async function checkHealth(): Promise<{ status: string; ffmpeg: string; ytdlp: string }> {
  const res = await fetch(`${API_BASE}/health`);
  if (!res.ok) throw new Error('API server is not responding');
  return res.json();
}

export async function fetchMediaInfo(url: string, proxy?: string): Promise<VideoInfo | PlaylistInfo> {
  const res = await fetch(`${API_BASE}/info`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url, proxy })
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Failed to extract video information' }));
    throw new Error(err.detail || 'Failed to extract media info');
  }

  return res.json();
}

export async function startDownloadTask(payload: DownloadRequestPayload): Promise<{ task_id: string; status: string }> {
  const res = await fetch(`${API_BASE}/download/start`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Failed to start download task' }));
    throw new Error(err.detail || 'Failed to start download');
  }

  return res.json();
}

export async function startBatchDownloadTask(payload: BatchDownloadPayload): Promise<{ task_id: string; status: string; count: number }> {
  const res = await fetch(`${API_BASE}/download/batch`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Failed to start batch download task' }));
    throw new Error(err.detail || 'Failed to start batch download');
  }

  return res.json();
}

export function subscribeToTaskProgress(
  taskId: string,
  onProgress: (data: TaskProgress) => void,
  onError: (error: Error) => void
): () => void {
  let isDone = false;
  const eventSource = new EventSource(`${API_BASE}/download/progress/${taskId}`);

  const handleData = (rawText: string) => {
    try {
      let cleaned = rawText.trim();
      if (cleaned.startsWith('data:')) {
        cleaned = cleaned.replace(/^data:\s*/, '').trim();
      }
      const data: TaskProgress = JSON.parse(cleaned);
      onProgress(data);
      if (data.status === 'completed' || data.status === 'error') {
        isDone = true;
        cleanup();
      }
    } catch (e) {
      console.warn('Parsing SSE data warning', e);
    }
  };

  eventSource.onmessage = (event) => {
    if (event.data) {
      handleData(event.data);
    }
  };

  eventSource.onerror = (err) => {
    console.warn('EventSource warning, relying on status poller:', err);
    if (onError && isDone) {
      onError(new Error('EventSource connection ended'));
    }
  };

  // Fallback poller every 800ms to guarantee 100% update reliability
  const poller = setInterval(async () => {
    if (isDone) return;
    try {
      const res = await fetch(`${API_BASE}/download/status/${taskId}`);
      if (res.ok) {
        const data: TaskProgress = await res.json();
        onProgress(data);
        if (data.status === 'completed' || data.status === 'error') {
          isDone = true;
          cleanup();
        }
      }
    } catch (e) {
      // ignore transient fetch errors
    }
  }, 800);

  const cleanup = () => {
    clearInterval(poller);
    try {
      eventSource.close();
    } catch (e) {}
  };

  return cleanup;
}

export async function saveCookies(content: string): Promise<void> {
  const res = await fetch(`${API_BASE}/cookie/save`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content })
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Failed to save cookies' }));
    throw new Error(err.detail || 'Failed to save cookies');
  }
}

export async function fetchAISummary(params: {
  title: string;
  description?: string;
  duration_seconds?: number;
  url?: string;
}): Promise<import('../types').AISummaryData> {
  const res = await fetch(`${API_BASE}/ai/summarize`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params)
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Failed to generate AI summary' }));
    throw new Error(err.detail || 'AI Summarization failed');
  }
  return res.json();
}

// ── Plan 6: Channel Auto-Watcher API ─────────────────────────────────────────

export async function fetchWatchedChannels(): Promise<WatchedChannel[]> {
  const res = await fetch(`${API_BASE}/watcher/channels`);
  if (!res.ok) throw new Error('Không thể tải danh sách kênh theo dõi');
  return res.json();
}

export async function addWatchedChannel(payload: WatchedChannelCreatePayload): Promise<WatchedChannel> {
  const res = await fetch(`${API_BASE}/watcher/channel`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Lỗi thêm kênh' }));
    throw new Error(err.detail || 'Không thể thêm kênh');
  }
  return res.json();
}

export async function deleteWatchedChannel(channelId: string): Promise<void> {
  const res = await fetch(`${API_BASE}/watcher/channel/${channelId}`, {
    method: 'DELETE'
  });
  if (!res.ok) throw new Error('Lỗi xóa kênh');
}

export async function toggleWatchedChannel(channelId: string, autoDownload: boolean): Promise<WatchedChannel> {
  const res = await fetch(`${API_BASE}/watcher/channel/${channelId}/toggle`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ auto_download: autoDownload })
  });
  if (!res.ok) throw new Error('Lỗi cập nhật trạng thái kênh');
  return res.json();
}

export async function scanWatchedChannel(channelId: string): Promise<any> {
  const res = await fetch(`${API_BASE}/watcher/channel/${channelId}/scan`, {
    method: 'POST'
  });
  if (!res.ok) throw new Error('Lỗi quét kênh');
  return res.json();
}

export async function scanAllWatchedChannels(): Promise<any> {
  const res = await fetch(`${API_BASE}/watcher/scan-all`, {
    method: 'POST'
  });
  if (!res.ok) throw new Error('Lỗi quét toàn bộ kênh');
  return res.json();
}

// ── Plan 6: Cloud Sync & Telegram API ────────────────────────────────────────

export async function fetchCloudConfig(): Promise<CloudConfig> {
  const res = await fetch(`${API_BASE}/cloud/config`);
  if (!res.ok) throw new Error('Không thể tải cấu hình đám mây');
  return res.json();
}

export async function saveCloudConfig(payload: CloudConfigPayload): Promise<CloudConfig> {
  const res = await fetch(`${API_BASE}/cloud/config`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!res.ok) throw new Error('Không thể lưu cấu hình đám mây');
  return res.json();
}

export async function testTelegramBot(botToken: string, chatId: string): Promise<TelegramTestResponse> {
  const res = await fetch(`${API_BASE}/cloud/telegram/test`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ bot_token: botToken, chat_id: chatId })
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Lỗi kiểm tra kết nối Telegram' }));
    throw new Error(err.detail || 'Kiểm tra kết nối thất bại');
  }
  return res.json();
}

export async function sendTaskFileToTelegram(taskId: string): Promise<{ status: string; message: string }> {
  const res = await fetch(`${API_BASE}/cloud/telegram/send/${taskId}`, {
    method: 'POST'
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Lỗi gửi file tới Telegram' }));
    throw new Error(err.detail || 'Không thể gửi file');
  }
  return res.json();
}
