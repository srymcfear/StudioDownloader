import React, { useState } from 'react';
import type { HistoryItem } from '../types';
import { X, Trash2, Download, Music, Video, Clock, Loader2 } from 'lucide-react';

interface DownloadHistoryProps {
  isOpen: boolean;
  onClose: () => void;
  history: HistoryItem[];
  onClearHistory: () => void;
}

export const DownloadHistory: React.FC<DownloadHistoryProps> = ({
  isOpen,
  onClose,
  history,
  onClearHistory,
}) => {
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleDownloadItem = async (item: HistoryItem) => {
    try {
      setDownloadingId(item.id);
      const res = await fetch(item.download_url);
      if (!res.ok) {
        throw new Error('File không khả dụng hoặc đã bị dọn dẹp.');
      }
      const blob = await res.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = item.filename || `${item.title}.${item.media_type === 'audio' ? 'mp3' : 'mp4'}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(blobUrl);
    } catch (err: any) {
      console.warn('Fallback direct download:', err);
      window.location.assign(item.download_url);
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80">
      <div className="relative w-full max-w-2xl rounded-3xl glass-panel border border-slate-700/80 shadow-2xl p-6 space-y-5 max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-blue-400" />
            <h3 className="text-base font-bold text-white">Lịch sử tải về gần đây</h3>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* History List */}
        <div className="flex-1 overflow-y-auto space-y-2 pr-1">
          {history.length === 0 ? (
            <div className="text-center py-12 text-slate-500 text-sm">
              Chưa có lịch sử tải nào được ghi nhận.
            </div>
          ) : (
            history.map((item) => (
              <div
                key={item.id}
                className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between gap-3 hover:border-slate-700 transition-all"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`p-2 rounded-lg ${item.media_type === 'audio' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-blue-500/20 text-blue-400'}`}>
                    {item.media_type === 'audio' ? <Music className="w-4 h-4" /> : <Video className="w-4 h-4" />}
                  </div>

                  <div className="min-w-0">
                    <h4 className="text-xs sm:text-sm font-semibold text-white truncate">
                      {item.title}
                    </h4>
                    <p className="text-[11px] text-slate-400">
                      {item.quality} • {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  disabled={downloadingId === item.id}
                  onClick={() => handleDownloadItem(item)}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-semibold shadow transition-colors flex-shrink-0 cursor-pointer"
                >
                  {downloadingId === item.id ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Download className="w-3.5 h-3.5" />
                  )}
                  <span>{downloadingId === item.id ? 'Đang lưu...' : 'Tải lại'}</span>
                </button>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        {history.length > 0 && (
          <div className="pt-3 border-t border-slate-800 flex justify-between items-center text-xs">
            <span className="text-slate-500">Tổng cộng {history.length} mục</span>
            <button
              type="button"
              onClick={onClearHistory}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-rose-950/40 text-rose-300 hover:bg-rose-900/60 border border-rose-800/40 transition-colors cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" /> Xóa lịch sử
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
