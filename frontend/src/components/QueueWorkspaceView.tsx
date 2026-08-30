import React, { useMemo } from 'react';
import type { TaskProgress, HistoryItem } from '../types';
import {
  Layers,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Download,
  Trash2,
  Clock,
  Music,
  Video,
} from 'lucide-react';

interface QueueWorkspaceViewProps {
  activeTasks: TaskProgress[];
  history: HistoryItem[];
  onClearHistory: () => void;
  onSelectSample?: (url: string) => void;
}

export const QueueWorkspaceView: React.FC<QueueWorkspaceViewProps> = React.memo(({
  activeTasks,
  history,
  onClearHistory,
}) => {
  const activeTaskCount = useMemo(() => activeTasks.filter((t) => t.status !== 'completed' && t.status !== 'error').length, [activeTasks]);
  const historyCount = useMemo(() => history.length, [history]);

  return (
    <div className="space-y-6">
      {/* Overview Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="liquid-glass-panel p-5 rounded-3xl space-y-1">
          <span className="text-xs text-[#C4B8B0] font-medium">Tác vụ đang xử lý</span>
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold font-mono text-blue-400">
              {activeTaskCount}
            </span>
            <span className="text-xs text-slate-400">tệp trong luồng</span>
          </div>
        </div>

        <div className="liquid-glass-panel p-5 rounded-3xl space-y-1">
          <span className="text-xs text-[#C4B8B0] font-medium">Đã hoàn thành phiên</span>
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold font-mono text-emerald-400">
              {historyCount}
            </span>
            <span className="text-xs text-slate-400">tệp đã xuất</span>
          </div>
        </div>

        <div className="liquid-glass-panel p-5 rounded-3xl space-y-1">
          <span className="text-xs text-[#C4B8B0] font-medium">Băng thông Studio</span>
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold font-mono text-purple-400">
              10 Luồng
            </span>
            <span className="text-xs text-slate-400">Parallel Chunks</span>
          </div>
        </div>
      </div>

      {/* Active Tasks Queue Table */}
      <div className="liquid-glass-panel rounded-3xl shadow-2xl overflow-hidden">
        <div className="p-4 bg-black/30 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-blue-400" />
            <h3 className="text-sm font-bold text-white">Hàng đợi đang xử lý</h3>
          </div>
        </div>

        <div className="p-5 space-y-3">
          {activeTasks.length === 0 ? (
            <div className="text-center py-12 text-[#C4B8B0] text-xs space-y-2">
              <Layers className="w-8 h-8 mx-auto text-slate-500 opacity-60" />
              <p className="font-medium text-slate-300">Chưa có tác vụ tải nào đang chạy trong hàng đợi.</p>
              <p className="text-[11px] text-[#C4B8B0]/80">Dán link YouTube ở trên hoặc bấm phím ⌘+V để thêm tệp.</p>
            </div>
          ) : (
            activeTasks.map((task) => (
              <div
                key={task.task_id}
                className="p-4 rounded-2xl liquid-glass-card space-y-2.5"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    {task.status === 'completed' ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                    ) : task.status === 'error' ? (
                      <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0" />
                    ) : (
                      <Loader2 className="w-4 h-4 text-blue-400 animate-spin flex-shrink-0" />
                    )}

                    <span className="text-xs sm:text-sm font-semibold text-white truncate">
                      {task.filename || task.message || `Tác vụ #${task.task_id.substring(0, 8)}`}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-xs font-mono font-bold text-slate-200">
                      {Math.round(task.percent)}%
                    </span>
                    {task.status === 'completed' && task.download_url && (
                      <a
                        href={task.download_url}
                        download={task.filename || 'media'}
                        className="macos-btn macos-btn-emerald px-3 py-1 rounded-full text-xs font-semibold"
                      >
                        <Download className="w-3.5 h-3.5" /> Tải về
                      </a>
                    )}
                  </div>
                </div>

                <div className="w-full h-2 bg-black/40 rounded-full overflow-hidden border border-white/5">
                  <div
                    className={`h-full transition-all duration-300 ${
                      task.status === 'completed'
                        ? 'bg-emerald-500'
                        : task.status === 'error'
                        ? 'bg-rose-500'
                        : 'bg-gradient-to-r from-blue-500 to-indigo-500'
                    }`}
                    style={{ width: `${Math.max(3, task.percent)}%` }}
                  />
                </div>

                <div className="flex items-center justify-between text-[11px] text-[#C4B8B0] font-mono">
                  <span>{task.message}</span>
                  <span>Tốc độ: {task.speed_formatted || 'Đang đồng bộ'}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* History Library */}
      <div className="liquid-glass-panel rounded-3xl shadow-2xl overflow-hidden">
        <div className="p-4 bg-black/30 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-bold text-white">Kho tệp đã hoàn tất ({historyCount})</h3>
          </div>
          {history.length > 0 && (
            <button
              type="button"
              onClick={onClearHistory}
              className="flex items-center gap-1 text-xs text-rose-400 hover:text-rose-300 transition-colors cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" /> Dọn sạch
            </button>
          )}
        </div>

        <div className="p-5 space-y-2.5">
          {history.length === 0 ? (
            <div className="text-center py-10 text-[#C4B8B0] text-xs">
              Chưa có lịch sử tải nào được lưu lại.
            </div>
          ) : (
            history.map((item) => (
              <div
                key={item.id}
                className="p-3.5 rounded-2xl liquid-glass-card flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`p-2 rounded-xl border border-white/10 ${
                      item.media_type === 'audio'
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : 'bg-blue-500/20 text-blue-400'
                    }`}
                  >
                    {item.media_type === 'audio' ? <Music className="w-4 h-4" /> : <Video className="w-4 h-4" />}
                  </div>

                  <div className="min-w-0">
                    <h4 className="text-xs sm:text-sm font-semibold text-white truncate">
                      {item.title}
                    </h4>
                    <p className="text-[11px] text-[#C4B8B0]">
                      {item.quality} • {new Date(item.timestamp).toLocaleTimeString()}
                    </p>
                  </div>
                </div>

                <a
                  href={item.download_url}
                  download={item.filename || 'media'}
                  className="macos-btn macos-btn-blue px-3.5 py-1.5 rounded-full text-xs font-semibold shadow flex-shrink-0"
                >
                  <Download className="w-3.5 h-3.5" /> Tải lại
                </a>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
});
