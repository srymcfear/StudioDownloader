import React, { useState, useMemo } from 'react';
import type { TaskProgress } from '../types';
import {
  Layers,
  ChevronUp,
  ChevronDown,
  Download,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  X,
} from 'lucide-react';

interface FloatingQueueDockProps {
  activeTasks: TaskProgress[];
  onRemoveTask?: (taskId: string) => void;
  onClearCompleted?: () => void;
}

export const FloatingQueueDock: React.FC<FloatingQueueDockProps> = React.memo(({
  activeTasks,
  onRemoveTask,
  onClearCompleted,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const runningTasks = useMemo(() => activeTasks.filter(
    (t) => t.status !== 'completed' && t.status !== 'error'
  ), [activeTasks]);
  
  const completedTasks = useMemo(() => activeTasks.filter((t) => t.status === 'completed'), [activeTasks]);

  const avgPercent = useMemo(() =>
    activeTasks.length > 0
      ? activeTasks.reduce((acc, t) => acc + (t.percent || 0), 0) / activeTasks.length
      : 0
  , [activeTasks]);

  if (activeTasks.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 sm:right-6 z-40 max-w-md w-full px-2 sm:px-0">
      <div className="liquid-glass-panel rounded-2xl border border-blue-500/40 shadow-2xl shadow-blue-500/20 overflow-hidden transition-all duration-300">
        {/* Floating Bar Header (Always Visible) */}
        <div
          onClick={() => setIsExpanded(!isExpanded)}
          className="p-3.5 flex items-center justify-between gap-3 bg-slate-900/90 hover:bg-slate-800/90 transition-colors cursor-pointer select-none"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="p-2 rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/30 flex-shrink-0">
              <Layers className="w-4 h-4" />
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-white truncate">
                  Hàng Đợi Studio ({activeTasks.length})
                </span>
                {runningTasks.length > 0 ? (
                  <span className="flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
                    <Loader2 className="w-2.5 h-2.5 animate-spin" /> Đang tải {runningTasks.length}
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    <CheckCircle2 className="w-2.5 h-2.5" /> Hoàn tất
                  </span>
                )}
              </div>

              {/* Progress mini indicator */}
              <div className="flex items-center gap-2 mt-1">
                <div className="w-24 sm:w-36 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-blue-500 to-emerald-400 transition-all duration-300"
                    style={{ width: `${Math.max(5, avgPercent)}%` }}
                  />
                </div>
                <span className="text-[10px] font-mono text-slate-400 font-bold">
                  {Math.round(avgPercent)}%
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              type="button"
              className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-700/50 transition-colors"
            >
              {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Expanded Task Queue Details */}
        {isExpanded && (
          <div className="p-3 bg-slate-950/90 border-t border-slate-800/80 space-y-2 max-h-72 overflow-y-auto">
            <div className="flex items-center justify-between text-[11px] text-slate-400 pb-1 border-b border-slate-800">
              <span className="font-semibold">Chi tiết tiến trình nền ({activeTasks.length} tệp)</span>
              {completedTasks.length > 0 && onClearCompleted && (
                <button
                  type="button"
                  onClick={onClearCompleted}
                  className="text-xs text-blue-400 hover:text-blue-300 transition-colors cursor-pointer"
                >
                  Xóa mục đã xong
                </button>
              )}
            </div>

            {activeTasks.map((task) => {
              const isTaskDone = task.status === 'completed';
              const isTaskError = task.status === 'error';

              return (
                <div
                  key={task.task_id}
                  className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1.5 hover:border-slate-700 transition-all"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      {isTaskDone ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                      ) : isTaskError ? (
                        <AlertTriangle className="w-3.5 h-3.5 text-rose-400 flex-shrink-0" />
                      ) : (
                        <Loader2 className="w-3.5 h-3.5 text-blue-400 animate-spin flex-shrink-0" />
                      )}

                      <span className="text-xs font-semibold text-white truncate max-w-[200px]">
                        {task.filename || task.message || `Tác vụ #${task.task_id.substring(0, 6)}`}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-xs font-mono font-bold text-slate-300">
                        {Math.round(task.percent)}%
                      </span>

                      {isTaskDone && task.download_url && (
                        <a
                          href={task.download_url}
                          download={task.filename || 'media'}
                          className="p-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs transition-colors cursor-pointer"
                          title="Lưu file về máy"
                        >
                          <Download className="w-3 h-3" />
                        </a>
                      )}

                      {onRemoveTask && (
                        <button
                          type="button"
                          onClick={() => onRemoveTask(task.task_id)}
                          className="p-1 text-slate-500 hover:text-rose-400 rounded transition-colors cursor-pointer"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Task progress bar */}
                  <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-200 ${
                        isTaskDone
                          ? 'bg-emerald-500'
                          : isTaskError
                          ? 'bg-rose-500'
                          : 'bg-blue-500'
                      }`}
                      style={{ width: `${Math.max(3, task.percent)}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono">
                    <span className="truncate max-w-[150px]">{task.message}</span>
                    <span>{task.speed_formatted || 'Đang đồng bộ'}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
});
