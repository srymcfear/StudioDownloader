import React from 'react';
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

export const QueueWorkspaceView: React.FC<QueueWorkspaceViewProps> = ({
  activeTasks,
  history,
  onClearHistory,
}) => {
  return (
    <div className="space-y-6">
      {/* Overview Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="glass-panel p-4 rounded-2xl border border-slate-800 space-y-1">
          <span className="text-xs text-slate-400 font-medium">Tác vụ đang xử lý</span>
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold font-mono text-blue-400">
              {activeTasks.filter((t) => t.status !== 'completed' && t.status !== 'error').length}
            </span>
            <span className="text-xs text-slate-500">tệp trong luồng</span>
          </div>
        </div>

        <div className="glass-panel p-4 rounded-2xl border border-slate-800 space-y-1">
          <span className="text-xs text-slate-400 font-medium">Đã hoàn thành phiên</span>
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold font-mono text-emerald-400">
              {history.length}
            </span>
            <span className="text-xs text-slate-500">tệp đã xuất</span>
          </div>
        </div>

        <div className="glass-panel p-4 rounded-2xl border border-slate-800 space-y-1">
          <span className="text-xs text-slate-400 font-medium">Băng thông Studio</span>
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold font-mono text-purple-400">
              10 Luồng
            </span>
            <span className="text-xs text-slate-500">Parallel Chunks</span>
          </div>
        </div>
      </div>

      {/* Active Tasks Queue Table */}
      <div className="glass-panel rounded-2xl border border-slate-800/90 shadow-xl overflow-hidden">
        <div className="p-4 bg-slate-900/60 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-blue-400" />
            <h3 className="text-sm font-bold text-white">Hàng đợi đang xử lý</h3>
          </div>
        </div>

        <div className="p-4 space-y-3">
          {activeTasks.length === 0 ? (
            <div className="text-center py-10 text-slate-500 text-xs space-y-2">
              <Layers className="w-8 h-8 mx-auto text-slate-600 opacity-50" />
              <p>Chưa có tác vụ tải nào đang chạy trong hàng đợi.</p>
              <p className="text-[11px] text-slate-600">Dán link YouTube ở trên hoặc bấm phím ⌘+V để thêm tệp.</p>
            </div>
          ) : (
            activeTasks.map((task) => (
              <div
                key={task.task_id}
                className="p-3.5 rounded-xl bg-slate-900/70 border border-slate-800 space-y-2"
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
                    <span className="text-xs font-mono font-bold text-slate-300">
                      {Math.round(task.percent)}%
                    </span>
                    {task.status === 'completed' && task.download_url && (
                      <a
                        href={task.download_url}
                        download={task.filename || 'media'}
                        className="flex items-center gap-1 px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition-colors cursor-pointer"
                      >
                        <Download className="w-3.5 h-3.5" /> Tải về
                      </a>
                    )}
                  </div>
                </div>

                <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
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

                <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
                  <span>{task.message}</span>
                  <span>Tốc độ: {task.speed_formatted || 'Đang đồng bộ'}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* History Library */}
      <div className="glass-panel rounded-2xl border border-slate-800/90 shadow-xl overflow-hidden">
        <div className="p-4 bg-slate-900/60 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-bold text-white">Kho tệp đã hoàn tất ({history.length})</h3>
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

        <div className="p-4 space-y-2">
          {history.length === 0 ? (
            <div className="text-center py-10 text-slate-500 text-xs">
              Chưa có lịch sử tải nào được lưu lại.
            </div>
          ) : (
            history.map((item) => (
              <div
                key={item.id}
                className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between gap-3 hover:border-slate-700 transition-all"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`p-2 rounded-lg ${
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
                    <p className="text-[11px] text-slate-400">
                      {item.quality} • {new Date(item.timestamp).toLocaleTimeString()}
                    </p>
                  </div>
                </div>

                <a
                  href={item.download_url}
                  download={item.filename || 'media'}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow transition-colors flex-shrink-0 cursor-pointer"
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
};
