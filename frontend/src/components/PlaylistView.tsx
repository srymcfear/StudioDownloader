import React, { useState, useEffect } from 'react';
import type { PlaylistInfo, PlaylistItem, DownloadRequestPayload } from '../types';
import { ListMusic, CheckSquare, Square, Music, Video, Download, Layers } from 'lucide-react';

interface PlaylistViewProps {
  playlist: PlaylistInfo;
  onDownloadItem: (payload: DownloadRequestPayload) => void;
  onDownloadBatchDirect: (
    items: PlaylistItem[],
    formatConfig: {
      media_type: 'video' | 'audio';
      target_ext: string;
      audio_bitrate?: string;
      quality_preset?: string;
    }
  ) => void;
  isDownloading: boolean;
  activeBatchIndex?: number | null;
  activeBatchTotal?: number | null;
}

export const PlaylistView: React.FC<PlaylistViewProps> = React.memo(({
  playlist,
  onDownloadItem,
  onDownloadBatchDirect,
  isDownloading,
  activeBatchIndex,
  activeBatchTotal,
}) => {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(
    new Set(playlist.entries.map((e) => e.id))
  );

  useEffect(() => {
    setSelectedIds(new Set(playlist.entries.map((e) => e.id)));
  }, [playlist.id, playlist.entries]);

  const [batchFormat, setBatchFormat] = useState<'mp3' | 'mp4' | 'flac'>('mp3');

  const toggleSelect = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const handleTriggerBatch = () => {
    const selectedItems = playlist.entries.filter((e) => selectedIds.has(e.id));
    if (selectedItems.length === 0) return;

    if (batchFormat === 'mp3') {
      onDownloadBatchDirect(selectedItems, {
        media_type: 'audio',
        target_ext: 'mp3',
        audio_bitrate: '320k',
      });
    } else if (batchFormat === 'flac') {
      onDownloadBatchDirect(selectedItems, {
        media_type: 'audio',
        target_ext: 'flac',
      });
    } else {
      onDownloadBatchDirect(selectedItems, {
        media_type: 'video',
        target_ext: 'mp4',
        quality_preset: '1080p',
      });
    }
  };

  const selectedCount = selectedIds.size;

  return (
    <div className="w-full liquid-glass-panel rounded-2xl p-4 sm:p-6 border border-slate-800/90 shadow-xl space-y-4">
      {/* Playlist Info Header */}
      <div className="flex items-center justify-between flex-wrap gap-3 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
            <ListMusic className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-bold text-white line-clamp-1">{playlist.title}</h3>
            <p className="text-xs text-slate-400">
              {playlist.uploader || 'YouTube'} • {playlist.entry_count} video
            </p>
          </div>
        </div>

        {/* Dual Actions: Select All & Deselect All */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => setSelectedIds(new Set(playlist.entries.map((e) => e.id)))}
            disabled={selectedCount === playlist.entries.length}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed text-xs font-semibold text-slate-200 hover:text-white border border-slate-700 transition-colors cursor-pointer"
          >
            <CheckSquare className="w-3.5 h-3.5 text-blue-400" /> Chọn tất cả ({playlist.entries.length})
          </button>

          <button
            type="button"
            onClick={() => setSelectedIds(new Set())}
            disabled={selectedCount === 0}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed text-xs font-semibold text-slate-200 hover:text-white border border-slate-700 transition-colors cursor-pointer"
          >
            <Square className="w-3.5 h-3.5 text-slate-400" /> Bỏ chọn tất cả
          </button>
        </div>
      </div>

      {/* PROMINENT DIRECT BATCH ACTION BAR (NO ZIP) */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-950/40 via-indigo-950/40 to-slate-900/60 border border-blue-500/40 shadow-xl space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-blue-400" />
            <span className="text-xs sm:text-sm font-bold text-white">
              Tải Trực Tiếp: <strong className="text-blue-400 font-mono text-sm sm:text-base">{selectedCount}</strong> / {playlist.entries.length} tệp
            </span>
          </div>

          {/* Format Picker Pills */}
          <div className="flex items-center gap-1 bg-slate-900/90 p-1 rounded-xl border border-slate-800 text-xs font-semibold">
            <button
              type="button"
              onClick={() => setBatchFormat('mp3')}
              className={`px-2.5 py-1.5 rounded-lg transition-all cursor-pointer ${
                batchFormat === 'mp3'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              MP3 320k
            </button>
            <button
              type="button"
              onClick={() => setBatchFormat('mp4')}
              className={`px-2.5 py-1.5 rounded-lg transition-all cursor-pointer ${
                batchFormat === 'mp4'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Video 1080p
            </button>
            <button
              type="button"
              onClick={() => setBatchFormat('flac')}
              className={`px-2.5 py-1.5 rounded-lg transition-all cursor-pointer ${
                batchFormat === 'flac'
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              FLAC Lossless
            </button>
          </div>
        </div>

        {/* Big Direct Download Button */}
        <button
          type="button"
          disabled={isDownloading || selectedCount === 0}
          onClick={handleTriggerBatch}
          className="w-full flex items-center justify-center gap-2 py-3 px-5 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-emerald-600 hover:from-blue-500 hover:to-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-xs sm:text-sm shadow-lg shadow-blue-500/25 transition-all transform active:scale-98 cursor-pointer"
        >
          <Download className="w-4 h-4" />
          <span>
            {selectedCount === 0
              ? 'Vui lòng tích chọn bài để tải'
              : activeBatchIndex && activeBatchTotal
              ? `ĐANG TẢI BÀI [${activeBatchIndex}/${activeBatchTotal}]...`
              : `TẢI TRỰC TIẾP ${selectedCount} FILE ĐÃ CHỌN VỀ MÁY`}
          </span>
        </button>
      </div>

      {/* Track List */}
      <div className="space-y-1.5 max-h-96 overflow-y-auto pr-1">
        {playlist.entries.map((item, idx) => {
          const isSelected = selectedIds.has(item.id);

          return (
            <div
              key={item.id || idx}
              className={`p-2.5 rounded-xl flex items-center justify-between gap-3 border transition-all ${
                isSelected
                  ? 'bg-slate-800/80 border-slate-700/80'
                  : 'bg-slate-900/40 border-slate-800/50 opacity-40'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <button
                  type="button"
                  onClick={() => toggleSelect(item.id)}
                  className="text-slate-400 hover:text-blue-400 cursor-pointer"
                >
                  {isSelected ? (
                    <CheckSquare className="w-4 h-4 text-blue-400" />
                  ) : (
                    <Square className="w-4 h-4" />
                  )}
                </button>

                <div className="relative w-12 h-8 rounded-lg overflow-hidden bg-slate-900 flex-shrink-0">
                  {item.thumbnail ? (
                    <img src={item.thumbnail} alt={item.title} className="w-full h-full object-cover" loading="lazy" decoding="async" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-[10px] text-slate-600">
                      {idx + 1}
                    </div>
                  )}
                </div>

                <div className="min-w-0">
                  <h4 className="text-xs font-semibold text-white truncate">
                    {idx + 1}. {item.title}
                  </h4>
                  <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono">
                    <span>{item.duration_formatted || '--:--'}</span>
                  </div>
                </div>
              </div>

              {/* Single item quick download triggers */}
              <div className="flex items-center gap-1 flex-shrink-0">
                <button
                  type="button"
                  disabled={isDownloading}
                  onClick={() =>
                    onDownloadItem({
                      url: item.url,
                      media_type: 'audio',
                      target_ext: 'mp3',
                      audio_bitrate: '320k',
                    })
                  }
                  className="p-1.5 rounded-lg bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600 hover:text-white border border-emerald-500/30 transition-colors cursor-pointer"
                  title="Tải riêng bài này (MP3 320k)"
                >
                  <Music className="w-3 h-3" />
                </button>

                <button
                  type="button"
                  disabled={isDownloading}
                  onClick={() =>
                    onDownloadItem({
                      url: item.url,
                      media_type: 'video',
                      target_ext: 'mp4',
                      quality_preset: '1080p',
                    })
                  }
                  className="p-1.5 rounded-lg bg-blue-600/20 text-blue-400 hover:bg-blue-600 hover:text-white border border-blue-500/30 transition-colors cursor-pointer"
                  title="Tải riêng bài này (Video 1080p)"
                >
                  <Video className="w-3 h-3" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
});
