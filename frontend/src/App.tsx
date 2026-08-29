import { useState, useEffect, useCallback } from 'react';
import { Header, type WorkspaceMode } from './components/Header';
import { UrlInput } from './components/UrlInput';
import { MediaInfoCard } from './components/MediaInfoCard';
import { FormatSelector } from './components/FormatSelector';
import { TrimmingDrawer } from './components/TrimmingDrawer';
import { ProgressCard } from './components/ProgressCard';
import { PlaylistView } from './components/PlaylistView';
import { DownloadHistory } from './components/DownloadHistory';
import { SettingsModal } from './components/SettingsModal';
import { LeftSidebar } from './components/LeftSidebar';
import { CommandPalette } from './components/CommandPalette';
import { FloatingQueueDock } from './components/FloatingQueueDock';
import { QueueWorkspaceView } from './components/QueueWorkspaceView';
import { AISummaryModal } from './components/AISummaryModal';
import { ChannelWatcherModal } from './components/ChannelWatcherModal';
import { CloudSyncModal } from './components/CloudSyncModal';
import type {
  VideoInfo,
  PlaylistInfo,
  PlaylistItem,
  DownloadRequestPayload,
  TaskProgress,
  HistoryItem,
  TrimConfig,
  AISummaryData,
} from './types';
import {
  checkHealth,
  fetchMediaInfo,
  startDownloadTask,
  subscribeToTaskProgress,
  fetchAISummary,
} from './services/api';
import {
  AlertCircle,
  Heart,
  Link2,
} from 'lucide-react';

export function App() {
  const [serverOnline, setServerOnline] = useState(false);
  const [systemInfo, setSystemInfo] = useState<{ ffmpeg: string; ytdlp: string } | null>(null);
  const [isLoadingInfo, setIsLoadingInfo] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Workspace Mode (Workstation 3-col / Focus Studio / Queue Mode)
  const [workspaceMode, setWorkspaceMode] = useState<WorkspaceMode>(() => {
    return (localStorage.getItem('tubestudio_workspace_mode') as WorkspaceMode) || 'workstation';
  });

  const [mediaInfo, setMediaInfo] = useState<VideoInfo | null>(null);
  const [playlistInfo, setPlaylistInfo] = useState<PlaylistInfo | null>(null);

  const [trimConfig, setTrimConfig] = useState<TrimConfig>({
    enabled: false,
    start_time: 0,
    end_time: 0,
  });

  const [currentProgress, setCurrentProgress] = useState<TaskProgress | null>(null);
  const [allActiveTasks, setAllActiveTasks] = useState<TaskProgress[]>([]);
  const [isDownloading, setIsDownloading] = useState(false);

  // Batch queue state
  const [activeBatchIndex, setActiveBatchIndex] = useState<number | null>(null);
  const [activeBatchTotal, setActiveBatchTotal] = useState<number | null>(null);

  // Modals & Settings
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isChannelWatcherOpen, setIsChannelWatcherOpen] = useState(false);
  const [isCloudSyncOpen, setIsCloudSyncOpen] = useState(false);
  const [proxy, setProxy] = useState('');
  const [history, setHistory] = useState<HistoryItem[]>([]);

  // AI Summary Studio Modal State (Plan 2)
  const [isAISummaryOpen, setIsAISummaryOpen] = useState(false);
  const [aiSummaryData, setAiSummaryData] = useState<AISummaryData | null>(null);
  const [isAISummaryLoading, setIsAISummaryLoading] = useState(false);

  const handleOpenAISummary = async () => {
    if (!mediaInfo) return;
    setIsAISummaryOpen(true);
    if (aiSummaryData && aiSummaryData.title === mediaInfo.title) {
      return;
    }
    setIsAISummaryLoading(true);
    try {
      const data = await fetchAISummary({
        title: mediaInfo.title,
        description: mediaInfo.description,
        duration_seconds: mediaInfo.duration,
        url: mediaInfo.url,
      });
      setAiSummaryData(data);
    } catch (err: any) {
      console.error('AI summary error:', err);
    } finally {
      setIsAISummaryLoading(false);
    }
  };

  // Switch workspace mode and persist
  const handleWorkspaceModeChange = (mode: WorkspaceMode) => {
    setWorkspaceMode(mode);
    localStorage.setItem('tubestudio_workspace_mode', mode);
  };

  // Load history on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('tubestudio_history');
      if (saved) setHistory(JSON.parse(saved));
    } catch (e) {
      console.warn('Failed to load history', e);
    }

    checkHealth()
      .then((data) => {
        setServerOnline(true);
        setSystemInfo({ ffmpeg: data.ffmpeg, ytdlp: data.ytdlp });
      })
      .catch(() => setServerOnline(false));
  }, []);

  const saveHistoryItem = (item: HistoryItem) => {
    setHistory((prev) => {
      const updated = [item, ...prev.filter((i) => i.id !== item.id)].slice(0, 50);
      try {
        localStorage.setItem('tubestudio_history', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
  };

  const handleClearHistory = () => {
    setHistory([]);
    localStorage.removeItem('tubestudio_history');
  };

  const triggerBrowserFileDownload = (url: string, filename?: string) => {
    const link = document.createElement('a');
    link.href = url;
    if (filename) link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExtract = useCallback(
    async (url: string) => {
      setIsLoadingInfo(true);
      setErrorMessage(null);
      setMediaInfo(null);
      setPlaylistInfo(null);
      setCurrentProgress(null);

      try {
        const result = await fetchMediaInfo(url, proxy || undefined);
        if ('entries' in result && result.entries) {
          setPlaylistInfo(result as PlaylistInfo);
        } else {
          setMediaInfo(result as VideoInfo);
          if ((result as VideoInfo).duration) {
            setTrimConfig({
              enabled: false,
              start_time: 0,
              end_time: (result as VideoInfo).duration,
            });
          }
        }
      } catch (err: any) {
        setErrorMessage(err.message || 'Không thể lấy thông tin video.');
      } finally {
        setIsLoadingInfo(false);
      }
    },
    [proxy]
  );

  const handleStartDownload = useCallback(
    async (payload: DownloadRequestPayload) => {
      setIsDownloading(true);
      setErrorMessage(null);

      if (trimConfig.enabled && trimConfig.end_time > trimConfig.start_time) {
        payload.trim = trimConfig;
      }
      if (proxy) {
        payload.proxy = proxy;
      }

      try {
        const { task_id } = await startDownloadTask(payload);

        const initialTaskProgress: TaskProgress = {
          task_id,
          status: 'starting',
          percent: 2.0,
          speed_formatted: 'Đang kết nối...',
          eta_formatted: '--:--',
          downloaded_bytes: 0,
          total_bytes: 0,
          message: 'Đang kết nối tới máy chủ và khởi tạo luồng...',
          filename: undefined,
          download_url: undefined,
          error: undefined,
        };

        // Set immediate progress
        setCurrentProgress(initialTaskProgress);
        setAllActiveTasks((prev) => [
          initialTaskProgress,
          ...prev.filter((t) => t.task_id !== task_id),
        ]);

        window.scrollTo({ top: 160, behavior: 'smooth' });

        subscribeToTaskProgress(
          task_id,
          (progress) => {
            setCurrentProgress(progress);
            setAllActiveTasks((prev) =>
              prev.map((t) => (t.task_id === progress.task_id ? progress : t))
            );

            if (progress.status === 'completed') {
              setIsDownloading(false);
              if (progress.download_url) {
                triggerBrowserFileDownload(progress.download_url, progress.filename);
                if (mediaInfo) {
                  saveHistoryItem({
                    id: task_id,
                    title: mediaInfo.title,
                    thumbnail: mediaInfo.thumbnail,
                    media_type: payload.media_type,
                    quality:
                      payload.media_type === 'audio'
                        ? payload.audio_bitrate || 'MP3 320k'
                        : payload.quality_preset || '1080p',
                    download_url: progress.download_url,
                    filename: progress.filename || 'media',
                    timestamp: Date.now(),
                  });
                }
              }
            } else if (progress.status === 'error') {
              setIsDownloading(false);
            }
          },
          (error) => {
            console.warn('SSE notification ended:', error);
            setIsDownloading(false);
          }
        );
      } catch (err: any) {
        setErrorMessage(err.message || 'Không thể bắt đầu tác vụ.');
        setIsDownloading(false);
        setCurrentProgress(null);
      }
    },
    [trimConfig, proxy, mediaInfo]
  );

  // Global Keyboard Shortcuts (Cmd+K, Cmd+V, Cmd+Enter)
  useEffect(() => {
    const handleGlobalKeyDown = async (e: KeyboardEvent) => {
      // Cmd+K or Ctrl+K -> Command Palette
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
      }
      // Cmd+V when not in an active input
      else if (
        (e.metaKey || e.ctrlKey) &&
        e.key.toLowerCase() === 'v' &&
        document.activeElement?.tagName !== 'INPUT' &&
        document.activeElement?.tagName !== 'TEXTAREA'
      ) {
        try {
          const text = await navigator.clipboard.readText();
          if (text && (text.includes('youtube.com') || text.includes('youtu.be'))) {
            e.preventDefault();
            handleExtract(text);
          }
        } catch (err) {}
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [handleExtract]);

  // Command Palette Action Dispatcher
  const handleCommandAction = (actionId: string) => {
    switch (actionId) {
      case 'paste_url':
        navigator.clipboard.readText().then((text) => {
          if (text) handleExtract(text);
        });
        break;
      case 'quick_mp3_320k':
        if (mediaInfo) {
          handleStartDownload({
            url: mediaInfo.url,
            media_type: 'audio',
            target_ext: 'mp3',
            audio_bitrate: '320k',
            quality_preset: 'MP3 320k',
            embed_metadata: true,
            embed_thumbnail: true,
          });
        }
        break;
      case 'quick_flac':
        if (mediaInfo) {
          handleStartDownload({
            url: mediaInfo.url,
            media_type: 'audio',
            target_ext: 'flac',
            audio_bitrate: '0',
            quality_preset: 'FLAC Lossless',
            embed_metadata: true,
            embed_thumbnail: true,
          });
        }
        break;
      case 'quick_video_1080p':
        if (mediaInfo) {
          handleStartDownload({
            url: mediaInfo.url,
            media_type: 'video',
            target_ext: 'mp4',
            quality_preset: '1080p',
            embed_metadata: true,
            embed_thumbnail: true,
          });
        }
        break;
      case 'quick_video_4k':
        if (mediaInfo) {
          handleStartDownload({
            url: mediaInfo.url,
            media_type: 'video',
            target_ext: 'mp4',
            quality_preset: '2160p',
            embed_metadata: true,
            embed_thumbnail: true,
          });
        }
        break;
      case 'switch_mode_focus':
      case 'switch_mode_workstation':
        handleWorkspaceModeChange('workstation');
        break;
      case 'open_settings':
        setIsSettingsOpen(true);
        break;
      case 'open_watcher':
        setIsChannelWatcherOpen(true);
        break;
      case 'open_cloud':
        setIsCloudSyncOpen(true);
        break;
      case 'clear_history':
        handleClearHistory();
        break;
      default:
        break;
    }
  };

  // Direct multi-item download without zip
  const handleStartBatchDownloadDirect = async (
    items: PlaylistItem[],
    formatConfig: {
      media_type: 'video' | 'audio';
      target_ext: string;
      audio_bitrate?: string;
      quality_preset?: string;
    }
  ) => {
    if (items.length === 0) return;

    setIsDownloading(true);
    setErrorMessage(null);
    setActiveBatchTotal(items.length);

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      setActiveBatchIndex(i + 1);

      setCurrentProgress({
        task_id: item.id,
        status: 'downloading',
        percent: 5.0,
        speed_formatted: 'Đang tải...',
        eta_formatted: '--:--',
        downloaded_bytes: 0,
        total_bytes: 0,
        message: `Đang tải (${i + 1}/${items.length}): ${item.title}`,
      });

      try {
        const { task_id } = await startDownloadTask({
          url: item.url,
          media_type: formatConfig.media_type,
          target_ext: formatConfig.target_ext,
          audio_bitrate: formatConfig.audio_bitrate,
          quality_preset: formatConfig.quality_preset,
          embed_metadata: true,
          embed_thumbnail: true,
          proxy: proxy || undefined,
        });

        await new Promise<void>((resolve) => {
          const unsubscribe = subscribeToTaskProgress(
            task_id,
            (progress) => {
              setCurrentProgress(progress);
              if (progress.status === 'completed') {
                if (progress.download_url) {
                  triggerBrowserFileDownload(progress.download_url, progress.filename);
                  saveHistoryItem({
                    id: task_id,
                    title: item.title,
                    thumbnail: item.thumbnail,
                    media_type: formatConfig.media_type,
                    quality:
                      formatConfig.media_type === 'audio'
                        ? formatConfig.audio_bitrate || 'MP3 320k'
                        : formatConfig.quality_preset || '1080p',
                    download_url: progress.download_url,
                    filename: progress.filename || `${item.title}.${formatConfig.target_ext}`,
                    timestamp: Date.now(),
                  });
                }
                unsubscribe();
                resolve();
              } else if (progress.status === 'error') {
                unsubscribe();
                resolve();
              }
            },
            () => {
              unsubscribe();
              resolve();
            }
          );
        });

        await new Promise((r) => setTimeout(r, 600));
      } catch (err: any) {
        console.error(`Error downloading item ${item.title}:`, err);
      }
    }

    setIsDownloading(false);
    setActiveBatchIndex(null);
    setActiveBatchTotal(null);
    setCurrentProgress({
      task_id: 'batch_done',
      status: 'completed',
      percent: 100.0,
      speed_formatted: '0 KB/s',
      eta_formatted: '--:--',
      downloaded_bytes: 0,
      total_bytes: 0,
      message: `Đã hoàn tất tải trực tiếp toàn bộ ${items.length} tệp về máy!`,
    });
  };

  const handleReset = () => {
    setCurrentProgress(null);
    setIsDownloading(false);
    setActiveBatchIndex(null);
    setActiveBatchTotal(null);
  };

  const activeQueueCount = allActiveTasks.filter(
    (t) => t.status !== 'completed' && t.status !== 'error'
  ).length;

  const handleDeleteHistoryItem = (id: string) => {
    const updated = history.filter((item) => item.id !== id);
    setHistory(updated);
    localStorage.setItem('tubestudio_download_history', JSON.stringify(updated));
  };

  return (
    <div className="relative min-h-screen bg-transparent text-slate-100 flex flex-col font-sans selection:bg-[#F95721]/30 selection:text-white">
      {/* Dynamic Background Video Layer */}
      <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
        <video
          autoPlay
          loop
          muted
          playsInline
          poster="/custom_bg.png"
          className="w-full h-full object-cover opacity-90"
        >
          <source src="/bg_cat.mp4" type="video/mp4" />
          <source src="https://raw.githubusercontent.com/srymcfear/StudioDownloader/main/src/bg_cat.mp4" type="video/mp4" />
        </video>
        {/* Studio Vignette & Contrast Overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#070B18]/65 via-[#0B1224]/75 to-[#070B18]/85 backdrop-blur-[1px]" />
      </div>

      {/* Top Header */}
      <Header
        workspaceMode={workspaceMode}
        onWorkspaceModeChange={handleWorkspaceModeChange}
        onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenHistory={() => setIsHistoryOpen(true)}
        historyCount={history.length}
        activeQueueCount={activeQueueCount}
        serverOnline={serverOnline}
      />

      {/* Main Studio Area */}
      <main className="relative z-10 flex-1 max-w-[1440px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-6">
        {/* VIEW 1: QUEUE WORKSPACE MODE */}
        {workspaceMode === 'queue' && (
          <div className="max-w-4xl mx-auto space-y-6">
            <UrlInput onExtract={handleExtract} isLoading={isLoadingInfo} />
            <QueueWorkspaceView
              activeTasks={allActiveTasks}
              history={history}
              onClearHistory={handleClearHistory}
              onSelectSample={handleExtract}
            />
          </div>
        )}

        {/* VIEW 2: WORKSTATION MODE (2-Zone Focused Layout) */}
        {workspaceMode === 'workstation' && (
          <div className="flex flex-col xl:flex-row gap-6 items-start">
            {/* Left Zone: Recent Downloads (Collapsible, max 4 items) */}
            <LeftSidebar
              history={history}
              onClearHistory={handleClearHistory}
              onDeleteHistoryItem={handleDeleteHistoryItem}
            />

            {/* Center Dominant Zone: Input, Media Result & Downloads */}
            <div className="flex-1 min-w-0 w-full space-y-5">
              {/* Search URL Input */}
              <UrlInput onExtract={handleExtract} isLoading={isLoadingInfo} />

              {/* Global Error Banner */}
              {errorMessage && (
                <div className="p-3.5 rounded-2xl bg-rose-950/40 border border-rose-800/60 text-rose-200 text-xs flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
                  <p className="font-medium">{errorMessage}</p>
                </div>
              )}

              {/* Active Progress Tracker */}
              {currentProgress && (
                <div>
                  <ProgressCard progress={currentProgress} onReset={handleReset} />
                </div>
              )}

              {/* Media Details & Format Selection for Single Video */}
              {mediaInfo && !currentProgress?.download_url && (
                <div className="space-y-4">
                  <MediaInfoCard info={mediaInfo} onOpenAISummary={handleOpenAISummary} />

                  {/* Trimming Drawer with Waveform */}
                  <TrimmingDrawer
                    duration={mediaInfo.duration}
                    trimConfig={trimConfig}
                    onChange={setTrimConfig}
                  />

                  {/* Format & Quality Picker */}
                  <FormatSelector
                    info={mediaInfo}
                    onStartDownload={handleStartDownload}
                    isDownloading={isDownloading}
                  />
                </div>
              )}

              {/* Playlist View with Direct Multi-File Download */}
              {playlistInfo && !currentProgress?.download_url && (
                <div className="space-y-4">
                  <PlaylistView
                    playlist={playlistInfo}
                    onDownloadItem={handleStartDownload}
                    onDownloadBatchDirect={handleStartBatchDownloadDirect}
                    isDownloading={isDownloading}
                    activeBatchIndex={activeBatchIndex}
                    activeBatchTotal={activeBatchTotal}
                  />
                </div>
              )}

              {/* Quiet Empty State (No fake player, no marketing H1) */}
              {!mediaInfo && !playlistInfo && (
                <div className="flex flex-col items-center justify-center py-16 px-6 text-center space-y-3 rounded-2xl glass-panel shadow-2xl">
                  <div className="w-12 h-12 rounded-2xl bg-[#181412] border border-[rgba(232,168,124,0.15)] text-slate-400 flex items-center justify-center shadow-inner">
                    <Link2 className="w-5 h-5 text-[#F95721]" />
                  </div>
                  <div className="space-y-1 max-w-sm">
                    <h3 className="text-sm font-semibold text-slate-200">
                      Dán liên kết để bắt đầu
                    </h3>
                    <p className="text-xs text-[#C4B8B0] leading-relaxed">
                      Hệ thống tự động trích xuất định dạng và chất lượng gốc.
                    </p>
                  </div>
                </div>
              )}

              {/* Compact Bottom Status Bar */}
              <div className="pt-4 border-t border-[rgba(232,168,124,0.12)] flex items-center justify-between text-xs text-[#C4B8B0] font-mono">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/50" />
                  <span className="text-slate-300">Sẵn sàng</span>
                  <span className="text-slate-600">|</span>
                  <span>Định dạng mặc định: MP3 320 kbps / MP4 1080p</span>
                </div>
                <div>
                  <span className="text-[#C4B8B0]/70">FEAR STUDIO</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Floating Bottom Queue Dock for Active Background Tasks */}
      <FloatingQueueDock
        activeTasks={allActiveTasks}
        onClearCompleted={() =>
          setAllActiveTasks((prev) => prev.filter((t) => t.status !== 'completed'))
        }
      />

      {/* Command Palette Modal (Cmd+K) */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        onSelectAction={handleCommandAction}
      />

      {/* Footer with Team FEAR & dev by srymc */}
      <footer className="relative z-10 w-full bg-[#181412]/90 border-t border-[rgba(232,168,124,0.12)] py-4 mt-8 text-center text-xs text-[#C4B8B0] space-y-1">
        <p className="flex items-center justify-center gap-1.5 font-medium">
          <span>© 2026</span>
          <strong className="text-white font-mono tracking-wider">TEAM FEAR</strong>
          <span>•</span>
          <span>Dev with</span>
          <Heart className="w-3.5 h-3.5 text-[#F95721] fill-[#F95721] inline" />
          <span>by</span>
          <strong className="text-slate-300 font-semibold">srymc</strong>
        </p>
        <p className="text-[11px] text-slate-500 font-mono">
          High Performance Media Extraction System • Alone Workspace Pro
        </p>
      </footer>

      {/* Modals */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        proxy={proxy}
        onSaveProxy={setProxy}
        systemInfo={systemInfo}
      />

      <DownloadHistory
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        history={history}
        onClearHistory={handleClearHistory}
      />

      {/* Channel Auto-Watcher Modal (Plan 6) */}
      <ChannelWatcherModal
        isOpen={isChannelWatcherOpen}
        onClose={() => setIsChannelWatcherOpen(false)}
      />

      {/* Cloud Sync & Telegram Modal (Plan 6) */}
      <CloudSyncModal
        isOpen={isCloudSyncOpen}
        onClose={() => setIsCloudSyncOpen(false)}
      />

      {/* AI Video Summary & Chapter Breakdown Modal (Plan 2) */}
      <AISummaryModal
        isOpen={isAISummaryOpen}
        onClose={() => setIsAISummaryOpen(false)}
        summaryData={aiSummaryData}
        isLoading={isAISummaryLoading}
        onSelectTimestamp={(sec) => {
          setTrimConfig((prev) => ({
            ...prev,
            enabled: true,
            start_time: sec,
          }));
          setIsAISummaryOpen(false);
        }}
      />
    </div>
  );
}

export default App;
