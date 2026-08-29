import React, { useState } from 'react';
import type { VideoInfo } from '../types';
import { Eye, ThumbsUp, Clock, User, Bookmark, ChevronDown, ChevronUp, Radio, Sparkles } from 'lucide-react';
import { QualityBadge } from './QualityBadge';

interface MediaInfoCardProps {
  info: VideoInfo;
  onOpenAISummary?: () => void;
}

export const MediaInfoCard: React.FC<MediaInfoCardProps> = React.memo(({ info, onOpenAISummary }) => {
  const [showDesc, setShowDesc] = useState(false);

  const formatNumber = (num?: number) => {
    if (!num) return 'N/A';
    if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
    if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`;
    return num.toLocaleString();
  };

  const highestRes = info.video_formats?.[0]?.resolution || 'HD';

  return (
    <div className="w-full liquid-glass-panel rounded-3xl p-5 sm:p-6 space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-start">
        {/* Thumbnail Container */}
        <div className="relative md:col-span-4 rounded-2xl overflow-hidden group shadow-2xl aspect-video bg-slate-950/80 border border-white/15">
          {info.thumbnail ? (
            <img
              src={info.thumbnail}
              alt={info.title}
              loading="lazy"
              decoding="async"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-slate-500">
              No Thumbnail
            </div>
          )}

          {/* Overlays */}
          <div className="absolute bottom-2 right-2 px-2.5 py-0.5 rounded-lg bg-black/80 backdrop-blur-sm text-white text-xs font-mono font-semibold border border-white/10">
            {info.duration_formatted}
          </div>

          {info.is_live && (
            <div className="absolute top-2 left-2 flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-red-600/90 backdrop-blur-sm text-white text-xs font-bold shadow">
              <Radio className="w-3 h-3" /> TRỰC TIẾP
            </div>
          )}

          <div className="absolute top-2 right-2">
            <QualityBadge
              label={highestRes}
              variant={highestRes.includes('8K') ? '8k' : highestRes.includes('4K') ? '4k' : 'fhd'}
            />
          </div>
        </div>

        {/* Info Column */}
        <div className="md:col-span-8 space-y-3">
          <div className="flex items-start justify-between gap-3">
            <h3 className="text-lg sm:text-xl font-bold text-white leading-snug line-clamp-2">
              {info.title}
            </h3>

            {onOpenAISummary && (
              <button
                type="button"
                onClick={onOpenAISummary}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold shadow-lg shadow-purple-500/25 border border-white/20 transition-all cursor-pointer shrink-0"
                title="Tóm tắt nội dung video bằng trí tuệ nhân tạo Gemini AI"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Tóm tắt AI</span>
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2.5 text-xs sm:text-sm text-[#C4B8B0]">
            <div className="flex items-center gap-1.5 font-medium text-slate-200 bg-white/[0.05] px-2.5 py-1 rounded-lg border border-white/[0.08]">
              <User className="w-3.5 h-3.5 text-blue-400" />
              <span>{info.uploader || 'YouTube Creator'}</span>
            </div>

            <div className="flex items-center gap-1 bg-white/[0.05] px-2.5 py-1 rounded-lg border border-white/[0.08]">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>{info.duration_formatted}</span>
            </div>

            {info.view_count && (
              <div className="flex items-center gap-1 bg-white/[0.05] px-2.5 py-1 rounded-lg border border-white/[0.08]">
                <Eye className="w-3.5 h-3.5 text-slate-400" />
                <span>{formatNumber(info.view_count)} lượt xem</span>
              </div>
            )}

            {info.like_count && (
              <div className="flex items-center gap-1 bg-white/[0.05] px-2.5 py-1 rounded-lg border border-white/[0.08]">
                <ThumbsUp className="w-3.5 h-3.5 text-slate-400" />
                <span>{formatNumber(info.like_count)} thích</span>
              </div>
            )}
          </div>

          {/* Chapters indicator if available */}
          {info.chapters && info.chapters.length > 0 && (
            <div className="flex items-center gap-2 text-xs text-amber-300 bg-amber-500/15 px-3 py-1.5 rounded-xl border border-amber-500/25 w-fit">
              <Bookmark className="w-3.5 h-3.5" />
              <span>Có {info.chapters.length} chương (chapters) đánh dấu thời lượng</span>
            </div>
          )}

          {/* Description snippet */}
          {info.description && (
            <div className="space-y-1.5 pt-1">
              <button
                type="button"
                onClick={() => setShowDesc(!showDesc)}
                className="flex items-center gap-1 text-xs text-[#C4B8B0] hover:text-white transition-colors cursor-pointer"
              >
                <span>{showDesc ? 'Thu gọn mô tả' : 'Xem tóm tắt mô tả video'}</span>
                {showDesc ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>
              {showDesc && (
                <p className="text-xs text-[#C4B8B0] bg-black/40 p-3.5 rounded-2xl border border-white/10 whitespace-pre-line leading-relaxed">
                  {info.description}
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
});
