import React, { useState } from 'react';
import type { HistoryItem } from '../types';
import {
  Clock,
  Download,
  Trash2,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Music,
  Video,
} from 'lucide-react';

interface LeftSidebarProps {
  history: HistoryItem[];
  onClearHistory: () => void;
  onDeleteHistoryItem?: (id: string) => void;
}

export const LeftSidebar: React.FC<LeftSidebarProps> = React.memo(({
  history,
  onClearHistory,
  onDeleteHistoryItem,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showConfirmClear, setShowConfirmClear] = useState(false);

  const handleClearWithConfirm = () => {
    if (showConfirmClear) {
      onClearHistory();
      setShowConfirmClear(false);
    } else {
      setShowConfirmClear(true);
      setTimeout(() => setShowConfirmClear(false), 4000);
    }
  };

  if (isCollapsed) {
    return (
      <aside className="w-10 flex flex-col items-center py-3 liquid-glass-panel rounded-3xl">
        <button
          type="button"
          onClick={() => setIsCollapsed(false)}
          className="p-2 text-[#C4B8B0] hover:text-white rounded-xl hover:bg-white/10 transition-colors cursor-pointer"
          title="Mở rộng lịch sử gần đây"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
        <div className="mt-4 writing-vertical text-[11px] font-semibold text-[#C4B8B0] tracking-wider rotate-180">
          Lịch sử ({history.length})
        </div>
      </aside>
    );
  }

  return (
    <aside className="w-full xl:w-60 flex-shrink-0 space-y-3">
      <div className="p-4 rounded-3xl liquid-glass-panel shadow-2xl space-y-3">
        {/* Header */}
        <div className="flex items-center justify-between pb-2 border-b border-white/10">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-[#F95721]" />
            <h3 className="text-xs font-bold text-white">
              Lịch sử gần đây
            </h3>
            {history.length > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-white/10 text-[10px] text-white font-mono border border-white/10">
                {history.length}
              </span>
            )}
          </div>

          <div className="flex items-center gap-1">
            {history.length > 0 && (
              <button
                type="button"
                onClick={handleClearWithConfirm}
                className={`p-1 rounded-lg transition-colors cursor-pointer text-xs ${
                  showConfirmClear
                    ? 'bg-rose-500/20 text-rose-300 font-semibold px-1.5'
                    : 'text-[#C4B8B0] hover:text-rose-400'
                }`}
                title={showConfirmClear ? 'Nhấn lần nữa để xóa tất cả' : 'Xóa toàn bộ lịch sử'}
              >
                {showConfirmClear ? 'Xác nhận xóa?' : <Trash2 className="w-3.5 h-3.5" />}
              </button>
            )}

            <button
              type="button"
              onClick={() => setIsCollapsed(true)}
              className="p-1 text-[#C4B8B0] hover:text-white rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
              title="Thu gọn"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* History Rows (Max 4 items) */}
        <div className="space-y-2">
          {history.length === 0 ? (
            <p className="text-[12px] text-[#C4B8B0]/70 italic py-4 text-center">
              Chưa có tệp tải về
            </p>
          ) : (
            history.slice(0, 4).map((item) => (
              <div
                key={item.id}
                className="p-2.5 rounded-2xl liquid-glass-card flex items-center justify-between gap-2 group"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 mb-1">
                    {item.media_type === 'audio' ? (
                      <Music className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                    ) : (
                      <Video className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
                    )}
                    <span className="text-[10px] font-mono text-slate-300 uppercase font-semibold">
                      {item.target_ext || 'MP3'} • {item.quality || '320k'}
                    </span>
                  </div>

                  <p
                    className="text-xs font-medium text-slate-200 truncate cursor-default"
                    title={item.title}
                  >
                    {item.title}
                  </p>
                </div>

                {/* Per-row Actions: Open / Re-download / Delete */}
                <div className="flex items-center gap-1 flex-shrink-0">
                  {item.download_url && (
                    <a
                      href={item.download_url}
                      download={item.filename}
                      className="macos-btn macos-btn-secondary p-1.5 !rounded-lg text-slate-300 hover:text-white"
                      title="Lưu lại tệp"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </a>
                  )}

                  {item.url && (
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noreferrer"
                      className="p-1.5 rounded-lg text-[#C4B8B0] hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                      title="Mở liên kết gốc"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}

                  {onDeleteHistoryItem && (
                    <button
                      type="button"
                      onClick={() => onDeleteHistoryItem(item.id)}
                      className="p-1.5 rounded-lg text-[#C4B8B0] hover:text-rose-400 hover:bg-white/10 transition-colors cursor-pointer"
                      title="Xóa khỏi lịch sử"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </aside>
  );
});
