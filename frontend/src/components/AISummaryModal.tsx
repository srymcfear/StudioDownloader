import React, { useState } from 'react';
import type { AISummaryData } from '../types';
import {
  Sparkles,
  X,
  CheckCircle2,
  Clock,
  Tag,
  Copy,
  Check,
  Bot,
  Layers,
  BookOpen
} from 'lucide-react';

interface AISummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  summaryData: AISummaryData | null;
  isLoading: boolean;
  onSelectTimestamp?: (seconds: number) => void;
}

export const AISummaryModal: React.FC<AISummaryModalProps> = ({
  isOpen,
  onClose,
  summaryData,
  isLoading,
  onSelectTimestamp
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopyText = () => {
    if (!summaryData) return;
    const text = `📌 TÓM TẮT VIDEO: ${summaryData.title}\n\n📝 TỔNG QUAN:\n${summaryData.overview}\n\n💡 Ý CHÍNH:\n${summaryData.key_points.map(p => `• ${p}`).join('\n')}\n\n⏱️ MỐC THỜI GIAN:\n${summaryData.highlights.map(h => `[${h.time_formatted}] ${h.title}: ${h.summary}`).join('\n')}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80">
      <div
        className="relative w-full max-w-2xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/90">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-purple-500/20 text-purple-400 border border-purple-500/30">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-white">
                  Tóm Tắt & Phân Tích Nội Dung AI
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 text-[10px] font-mono flex items-center gap-1 font-semibold">
                  <Bot className="w-3 h-3" /> {summaryData?.source || 'Gemini Flash'}
                </span>
              </div>
              <p className="text-xs text-slate-400 truncate max-w-md">
                {summaryData?.title || 'Đang trích xuất điểm nhấn video...'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label="Đóng"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Content */}
        <div className="p-6 overflow-y-auto space-y-5 custom-scrollbar">
          {isLoading ? (
            <div className="py-16 flex flex-col items-center justify-center space-y-4 text-center">
              <div className="relative">
                <div className="w-14 h-14 rounded-full border-2 border-purple-500/20 border-t-purple-500 animate-spin" />
                <Sparkles className="w-6 h-6 text-purple-400 absolute inset-0 m-auto" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">
                  AI đang đọc hiểu & phân tích nội dung...
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Trích xuất điểm nhấn, ý chính và lập mốc thời gian tự động
                </p>
              </div>
            </div>
          ) : summaryData ? (
            <>
              {/* Overview Box */}
              <div className="p-4 rounded-xl bg-purple-950/20 border border-purple-500/20 space-y-2">
                <div className="flex items-center gap-2 text-purple-300 text-xs font-bold uppercase tracking-wider">
                  <BookOpen className="w-4 h-4" /> Tổng Quan Nội Dung
                </div>
                <p className="text-sm text-slate-200 leading-relaxed">
                  {summaryData.overview}
                </p>
              </div>

              {/* Key Takeaways */}
              {summaryData.key_points && summaryData.key_points.length > 0 && (
                <div className="space-y-2.5">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Các Ý Chính Nổi Bật
                  </h3>
                  <div className="grid grid-cols-1 gap-2">
                    {summaryData.key_points.map((point, idx) => (
                      <div
                        key={idx}
                        className="flex items-start gap-2.5 p-2.5 rounded-xl bg-slate-950/60 border border-slate-800 text-xs text-slate-200"
                      >
                        <span className="flex items-center justify-center w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-bold shrink-0 mt-0.5">
                          {idx + 1}
                        </span>
                        <span className="leading-snug">{point}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Highlights / Chapters */}
              {summaryData.highlights && summaryData.highlights.length > 0 && (
                <div className="space-y-2.5">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-blue-400" /> Mốc Thời Gian & Phân Đoạn
                  </h3>
                  <div className="space-y-2">
                    {summaryData.highlights.map((hl, idx) => (
                      <div
                        key={idx}
                        onClick={() => onSelectTimestamp && onSelectTimestamp(hl.time_seconds)}
                        className="group p-3 rounded-xl bg-slate-950/70 hover:bg-slate-800/80 border border-slate-800/80 hover:border-blue-500/40 transition-all cursor-pointer flex items-center justify-between gap-3"
                      >
                        <div className="space-y-0.5 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="px-1.5 py-0.2 rounded bg-blue-500/20 text-blue-400 border border-blue-500/30 text-[10px] font-mono font-bold">
                              {hl.time_formatted}
                            </span>
                            <h4 className="text-xs font-bold text-white group-hover:text-blue-300 transition-colors truncate">
                              {hl.title}
                            </h4>
                          </div>
                          <p className="text-[11px] text-slate-400 truncate pl-0.5">
                            {hl.summary}
                          </p>
                        </div>
                        <div className="text-[10px] text-slate-500 group-hover:text-blue-400 font-medium shrink-0 flex items-center gap-1">
                          <Layers className="w-3 h-3" /> Chọn mốc
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Tags */}
              {summaryData.tags && summaryData.tags.length > 0 && (
                <div className="pt-2 flex items-center gap-1.5 flex-wrap">
                  <Tag className="w-3.5 h-3.5 text-slate-500" />
                  {summaryData.tags.map((tag, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 rounded-lg bg-slate-800 text-slate-300 text-[10px] font-medium border border-slate-700/60"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="py-12 text-center text-slate-400 text-sm">
              Không có dữ liệu tóm tắt. Vui lòng thử lại.
            </div>
          )}
        </div>

        {/* Footer */}
        {summaryData && !isLoading && (
          <div className="px-6 py-3.5 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between">
            <button
              type="button"
              onClick={handleCopyText}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-all cursor-pointer"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" /> Đã sao chép!
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-purple-400" /> Sao chép tóm tắt
                </>
              )}
            </button>

            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-all shadow-md shadow-purple-500/20 cursor-pointer"
            >
              Đóng
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
