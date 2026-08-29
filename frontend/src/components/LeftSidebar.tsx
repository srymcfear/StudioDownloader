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

export const LeftSidebar: React.FC<LeftSidebarProps> = ({
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
      <aside className="w-10 flex flex-col items-center py-2 glass-panel rounded-2xl">
        <button
          type="button"
          onClick={() => setIsCollapsed(false)}
          className="p-2 text-[#C4B8B0] hover:text-white rounded-lg hover:bg-[#2E2420] transition-colors cursor-pointer"
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
      <div className="p-3.5 rounded-2xl glass-panel shadow-xl space-y-3">
        {/* Header */}
        <div className="flex items-center justify-between pb-2 border-b border-[rgba(232,168,124,0.12)]">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-[#C4B8B0]" />
            <h3 className="text-xs font-bold text-slate-200">
              Lịch sử gần đây
            </h3>
            {history.length > 0 && (
              <span className="px-1.5 py-0.2 rounded bg-[#181412] text-[10px] text-[#C4B8B0] font-mono border border-[rgba(232,168,124,0.1)]">
                {history.length}
              </span>
            )}
          </div>

          <div className="flex items-center gap-1">
            {history.length > 0 && (
              <button
                type="button"
                onClick={handleClearWithConfirm}
                className={`p-1 rounded transition-colors cursor-pointer text-xs ${
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
              className="p-1 text-[#C4B8B0] hover:text-white transition-colors cursor-pointer"
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
                className="p-2.5 rounded-xl bg-[#241C18]/80 border border-[rgba(232,168,124,0.1)] flex items-center justify-between gap-2 group hover:border-[rgba(232,168,124,0.25)] transition-all"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 mb-1">
                    {item.media_type === 'audio' ? (
                      <Music className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                    ) : (
                      <Video className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
                    )}
                    <span className="text-[10px] font-mono text-[#C4B8B0] uppercase font-semibold">
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
                      className="p-1.5 rounded-lg bg-[#181412] text-[#C4B8B0] hover:text-white hover:bg-[#2E2420] border border-[rgba(232,168,124,0.1)] transition-colors cursor-pointer"
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
                      className="p-1.5 rounded-lg text-[#C4B8B0] hover:text-white hover:bg-[#2E2420] transition-colors cursor-pointer"
                      title="Mở liên kết gốc"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}

                  {onDeleteHistoryItem && (
                    <button
                      type="button"
                      onClick={() => onDeleteHistoryItem(item.id)}
                      className="p-1.5 rounded-lg text-[#C4B8B0] hover:text-rose-400 hover:bg-[#2E2420] transition-colors cursor-pointer"
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
};
