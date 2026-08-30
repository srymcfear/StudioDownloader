import React, { useState, useEffect } from 'react';
import {
  X,
  Plus,
  Trash2,
  RefreshCw,
  Radio,
  CheckCircle2,
  AlertCircle,
  Music,
  Video,
} from 'lucide-react';
import type { WatchedChannel, WatchedChannelCreatePayload } from '../types';
import {
  fetchWatchedChannels,
  addWatchedChannel,
  deleteWatchedChannel,
  toggleWatchedChannel,
  scanWatchedChannel,
  scanAllWatchedChannels,
} from '../services/api';

interface ChannelWatcherModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ChannelWatcherModal: React.FC<ChannelWatcherModalProps> = ({ isOpen, onClose }) => {
  const [channels, setChannels] = useState<WatchedChannel[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isScanningAll, setIsScanningAll] = useState(false);
  const [scanningChannelId, setScanningChannelId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Form state
  const [showAddForm, setShowAddForm] = useState(false);
  const [url, setUrl] = useState('');
  const [name, setName] = useState('');
  const [mediaType, setMediaType] = useState<'audio' | 'video'>('audio');
  const [qualityPreset, setQualityPreset] = useState('mp3_320k');
  const [audioEffect, setAudioEffect] = useState<'none' | 'karaoke' | 'vocal_only'>('none');
  const [autoDownload, setAutoDownload] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadChannels = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await fetchWatchedChannels();
      setChannels(data);
    } catch (e: any) {
      setError(e.message || 'Không thể tải danh sách kênh');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadChannels();
    }
  }, [isOpen]);

  const handleAddChannel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;

    try {
      setIsSubmitting(true);
      setError(null);
      const payload: WatchedChannelCreatePayload = {
        url: url.trim(),
        name: name.trim() || undefined,
        media_type: mediaType,
        quality_preset: qualityPreset,
        audio_effect: audioEffect,
        auto_download: autoDownload,
      };
      await addWatchedChannel(payload);
      setSuccessMsg('Đã thêm kênh theo dõi thành công!');
      setUrl('');
      setName('');
      setShowAddForm(false);
      await loadChannels();
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (e: any) {
      setError(e.message || 'Lỗi khi thêm kênh');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteWatchedChannel(id);
      setChannels((prev) => prev.filter((c) => c.id !== id));
    } catch (e: any) {
      setError(e.message || 'Lỗi khi xóa kênh');
    }
  };

  const handleToggle = async (id: string, currentVal: boolean) => {
    try {
      const updated = await toggleWatchedChannel(id, !currentVal);
      setChannels((prev) => prev.map((c) => (c.id === id ? updated : c)));
    } catch (e: any) {
      setError(e.message || 'Lỗi cập nhật');
    }
  };

  const handleScanSingle = async (id: string) => {
    try {
      setScanningChannelId(id);
      setError(null);
      const res = await scanWatchedChannel(id);
      setSuccessMsg(`Quét xong! Tìm thấy ${res.new_items_found || 0} nội dung mới.`);
      await loadChannels();
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (e: any) {
      setError(e.message || 'Lỗi khi quét kênh');
    } finally {
      setScanningChannelId(null);
    }
  };

  const handleScanAll = async () => {
    try {
      setIsScanningAll(true);
      setError(null);
      await scanAllWatchedChannels();
      setSuccessMsg('Đã quét toàn bộ danh sách kênh!');
      await loadChannels();
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (e: any) {
      setError(e.message || 'Lỗi khi quét tất cả');
    } finally {
      setIsScanningAll(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80">
      <div className="relative w-full max-w-2xl max-h-[90vh] flex flex-col rounded-3xl liquid-glass-modal border border-slate-700/80 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center">
              <Radio className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                Kênh Tự Động Theo Dõi (Auto-Watcher)
              </h2>
              <p className="text-[11px] text-slate-400">
                Tự động quét & tải video/nhạc mới nhất mỗi 30 phút
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Notifications */}
        {error && (
          <div className="mx-6 mt-3 p-3 rounded-xl bg-rose-950/40 border border-rose-800/60 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}
        {successMsg && (
          <div className="mx-6 mt-3 p-3 rounded-xl bg-emerald-950/40 border border-emerald-800/60 text-emerald-300 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Action Bar */}
        <div className="flex items-center justify-between px-6 py-3 border-b border-slate-800/60 bg-slate-900/30">
          <button
            type="button"
            onClick={() => setShowAddForm(!showAddForm)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-md shadow-blue-600/20 transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{showAddForm ? 'Đóng Form' : 'Thêm Kênh Mới'}</span>
          </button>

          <button
            type="button"
            onClick={handleScanAll}
            disabled={isScanningAll || channels.length === 0}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-200 hover:text-white border border-slate-700 text-xs font-semibold transition-all cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-purple-400 ${isScanningAll ? 'animate-spin' : ''}`} />
            <span>{isScanningAll ? 'Đang quét...' : 'Quét Tất Cả Ngay'}</span>
          </button>
        </div>

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* Add Channel Form */}
          {showAddForm && (
            <form onSubmit={handleAddChannel} className="p-4 rounded-2xl bg-slate-900/80 border border-slate-700/80 space-y-3">
              <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                Đăng Ký Kênh Mới
              </h3>
              <div>
                <label className="block text-[11px] text-slate-400 font-medium mb-1">
                  URL Kênh / Playlist / Profile (YouTube, TikTok, Facebook):
                </label>
                <input
                  type="text"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://www.youtube.com/@SonTungMTP hoặc link playlist..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] text-slate-400 font-medium mb-1">
                    Tên gợi nhớ (Tùy chọn):
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="VD: Sơn Tùng M-TP Official"
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] text-slate-400 font-medium mb-1">
                    Loại xuất file:
                  </label>
                  <div className="grid grid-cols-2 gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        setMediaType('audio');
                        setQualityPreset('mp3_320k');
                      }}
                      className={`flex items-center justify-center gap-1 py-1.5 rounded-lg text-xs font-medium border ${
                        mediaType === 'audio'
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                          : 'bg-slate-950 text-slate-400 border-slate-800'
                      }`}
                    >
                      <Music className="w-3.5 h-3.5" /> Âm thanh
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setMediaType('video');
                        setQualityPreset('1080p');
                      }}
                      className={`flex items-center justify-center gap-1 py-1.5 rounded-lg text-xs font-medium border ${
                        mediaType === 'video'
                          ? 'bg-blue-500/20 text-blue-300 border-blue-500/40'
                          : 'bg-slate-950 text-slate-400 border-slate-800'
                      }`}
                    >
                      <Video className="w-3.5 h-3.5" /> Video
                    </button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] text-slate-400 font-medium mb-1">
                    Chất lượng tải về:
                  </label>
                  <select
                    value={qualityPreset}
                    onChange={(e) => setQualityPreset(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none"
                  >
                    {mediaType === 'audio' ? (
                      <>
                        <option value="mp3_320k">MP3 320kbps Studio (Khuyên dùng)</option>
                        <option value="m4a_best">Apple M4A / AAC Gốc</option>
                        <option value="flac_lossless">FLAC Lossless</option>
                      </>
                    ) : (
                      <>
                        <option value="1080p">1080p Full HD MP4</option>
                        <option value="2160p">4K Ultra HD</option>
                        <option value="720p">720p HD Tiết kiệm</option>
                      </>
                    )}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] text-slate-400 font-medium mb-1">
                    Hiệu ứng AI DSP:
                  </label>
                  <select
                    value={audioEffect}
                    onChange={(e) => setAudioEffect(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none"
                  >
                    <option value="none">Chuẩn nguyên bản</option>
                    <option value="karaoke">🎤 Tách Beat Karaoke AI</option>
                    <option value="vocal_only">🗣️ Tách Vocal Acapella AI</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={autoDownload}
                    onChange={(e) => setAutoDownload(e.target.checked)}
                    className="rounded bg-slate-950 border-slate-700 text-blue-600 focus:ring-0"
                  />
                  <span>Tự động tải khi phát hiện video mới</span>
                </label>

                <button
                  type="submit"
                  disabled={isSubmitting || !url.trim()}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-bold transition-all shadow-md shadow-blue-600/20 cursor-pointer"
                >
                  {isSubmitting ? 'Đang lưu...' : 'Lưu & Theo Dõi'}
                </button>
              </div>
            </form>
          )}

          {/* List of Channels */}
          {isLoading ? (
            <div className="py-12 text-center text-xs text-slate-400 space-y-2">
              <RefreshCw className="w-5 h-5 animate-spin mx-auto text-purple-400" />
              <p>Đang tải danh sách kênh theo dõi...</p>
            </div>
          ) : channels.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-500 space-y-2 rounded-2xl border border-dashed border-slate-800">
              <Radio className="w-6 h-6 mx-auto text-slate-600" />
              <p className="font-semibold text-slate-400">Chưa có kênh nào được theo dõi</p>
              <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
                Bấm "Thêm Kênh Mới" ở trên để đăng ký tự động tải video mới từ các kênh YouTube hoặc TikTok yêu thích.
              </p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {channels.map((ch) => (
                <div
                  key={ch.id}
                  className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-slate-700/80 transition-all flex items-center justify-between gap-3"
                >
                  <div className="min-w-0 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase bg-slate-800 text-slate-300 font-mono">
                        {ch.platform}
                      </span>
                      <h4 className="text-xs font-bold text-white truncate max-w-md">
                        {ch.name}
                      </h4>
                    </div>

                    <div className="flex items-center gap-2 text-[11px] text-slate-400 flex-wrap">
                      <span className="text-emerald-400 font-mono font-semibold">
                        {ch.quality_preset}
                      </span>
                      {ch.audio_effect !== 'none' && (
                        <span className="text-purple-400 font-mono">
                          [{ch.audio_effect === 'karaoke' ? 'Beat Karaoke' : 'Vocal'}]
                        </span>
                      )}
                      <span>•</span>
                      <span className="text-slate-500 truncate max-w-[200px]">
                        {ch.last_video_title ? `Mới nhất: ${ch.last_video_title}` : 'Chưa quét'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      type="button"
                      onClick={() => handleToggle(ch.id, ch.auto_download)}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-colors cursor-pointer ${
                        ch.auto_download
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                          : 'bg-slate-800 text-slate-500 border-slate-700'
                      }`}
                      title="Bật/Tắt tự động tải"
                    >
                      {ch.auto_download ? 'TỰ TẢI: BẬT' : 'TỰ TẢI: TẮT'}
                    </button>

                    <button
                      type="button"
                      onClick={() => handleScanSingle(ch.id)}
                      disabled={scanningChannelId === ch.id}
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors cursor-pointer"
                      title="Quét kênh này ngay"
                    >
                      <RefreshCw
                        className={`w-3.5 h-3.5 text-purple-400 ${
                          scanningChannelId === ch.id ? 'animate-spin' : ''
                        }`}
                      />
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDelete(ch.id)}
                      className="p-1.5 rounded-lg bg-rose-950/30 hover:bg-rose-900/50 text-rose-400 border border-rose-800/40 transition-colors cursor-pointer"
                      title="Xóa theo dõi"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
