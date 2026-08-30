import React from 'react';
import type { TaskProgress } from '../types';
import { Download, Loader2, CheckCircle2, AlertTriangle, Cpu, Zap, Clock, RotateCcw } from 'lucide-react';

interface ProgressCardProps {
  progress: TaskProgress | null;
  onReset: () => void;
}

export const ProgressCard: React.FC<ProgressCardProps> = React.memo(({ progress, onReset }) => {
  if (!progress) return null;

  const isCompleted = progress.status === 'completed';
  const isError = progress.status === 'error';
  const isMerging = progress.status === 'merging' || progress.status === 'converting' || progress.status === 'trimming';

  const handleDownloadFile = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!progress.download_url) return;
    const link = document.createElement('a');
    link.href = progress.download_url;
    link.download = progress.filename || 'media_file.mp3';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="w-full liquid-glass-panel rounded-2xl p-5 sm:p-7 border border-blue-500/30 shadow-xl space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`p-2.5 rounded-xl ${
            isCompleted
              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
              : isError
              ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
              : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
          }`}>
            {isCompleted ? (
              <CheckCircle2 className="w-6 h-6" />
            ) : isError ? (
              <AlertTriangle className="w-6 h-6" />
            ) : isMerging ? (
              <Cpu className="w-6 h-6 text-amber-400" />
            ) : (
              <Loader2 className="w-6 h-6 animate-spin" />
            )}
          </div>

          <div>
            <h3 className="text-base sm:text-lg font-bold text-white">
              {isCompleted
                ? 'Xử lý hoàn tất! File đã sẵn sàng'
                : isError
                ? 'Đã xảy ra sự cố'
                : isMerging
                ? 'Đang ghép luồng chất lượng cao với FFmpeg...'
                : 'Đang tải luồng dữ liệu gốc...'}
            </h3>
            <p className="text-xs text-slate-400">
              {progress.message}
            </p>
          </div>
        </div>

        {/* Percentage badge */}
        {!isError && (
          <div className="text-right">
            <span className="text-2xl sm:text-3xl font-extrabold font-mono text-white">
              {Math.round(progress.percent)}%
            </span>
          </div>
        )}
      </div>

      {/* Progress Bar */}
      {!isError && (
        <div className="space-y-2">
          <div className="w-full h-3 bg-slate-900 rounded-full overflow-hidden p-0.5 border border-slate-800">
            <div
              className={`h-full w-full rounded-full origin-left transition-transform duration-100 ease-out ${
                isCompleted
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-400'
                  : 'bg-gradient-to-r from-blue-600 via-indigo-500 to-purple-600'
              }`}
              style={{ transform: `scaleX(${Math.max(0.03, progress.percent / 100)})` }}
            />
          </div>

          {/* Speed and ETA stats */}
          <div className="flex items-center justify-between text-xs text-slate-400 px-1 font-mono">
            <div className="flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span>Tốc độ: {progress.speed_formatted || 'Đang xử lý'}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-blue-400" />
              <span>Còn lại: {progress.eta_formatted || '--:--'}</span>
            </div>
          </div>
        </div>
      )}

      {/* Error state */}
      {isError && (
        <div className="p-4 rounded-xl bg-rose-950/30 border border-rose-800/50 text-rose-300 text-xs space-y-2">
          <p className="font-semibold">Chi tiết lỗi:</p>
          <p className="font-mono bg-black/40 p-2 rounded text-[11px] break-all">
            {progress.error || 'Unknown error occurred'}
          </p>
          <button
            type="button"
            onClick={onReset}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-rose-700 hover:bg-rose-600 text-white font-medium text-xs transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Thử lại
          </button>
        </div>
      )}

      {/* Completed Download Action */}
      {isCompleted && (
        <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
          <button
            type="button"
            onClick={handleDownloadFile}
            className="w-full sm:flex-1 flex items-center justify-center gap-2.5 py-3.5 px-6 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-500 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50 text-white font-bold text-sm sm:text-base shadow-lg shadow-emerald-500/25 transition-all transform active:scale-98 cursor-pointer"
          >
            <Download className="w-5 h-5" /> TẢI FILE VỀ MÁY NGAY
          </button>

          <button
            type="button"
            onClick={onReset}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-sm font-medium border border-slate-700 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" /> Tải liên kết khác
          </button>
        </div>
      )}
    </div>
  );
});
