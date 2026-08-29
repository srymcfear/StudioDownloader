import React, { useState } from 'react';
import { Link2, Clipboard, X, Loader2, Play } from 'lucide-react';

interface UrlInputProps {
  onExtract: (url: string) => void;
  isLoading: boolean;
}

export const UrlInput: React.FC<UrlInputProps> = ({ onExtract, isLoading }) => {
  const [url, setUrl] = useState('');

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text && text.trim()) {
        setUrl(text.trim());
        onExtract(text.trim());
      }
    } catch (err) {
      console.warn('Clipboard read error', err);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (url.trim()) {
      onExtract(url.trim());
    }
  };

  const sampleChips = [
    { label: 'Sơn Tùng M-TP', url: 'https://www.youtube.com/watch?v=zoEtcR5EW08' },
    { label: 'TikTok Hot Dance', url: 'https://www.tiktok.com/@tiktok/video/7106594312292453678' },
    { label: 'Alan Walker Faded', url: 'https://soundcloud.com/alanwalker/faded' },
    { label: 'Costa Rica 4K', url: 'https://www.youtube.com/watch?v=LXb3EKWsInQ' },
  ];

  return (
    <div className="w-full max-w-3xl mx-auto space-y-3">
      {/* Search Input Box */}
      <form onSubmit={handleSubmit} className="relative w-full">
        <div className="relative flex items-center h-12 px-3 rounded-2xl bg-[#241C18]/80 backdrop-blur-md border border-[rgba(232,168,124,0.15)] shadow-2xl focus-within:border-[#F95721] focus-within:ring-2 focus-within:ring-[#F95721]/20 transition-all">
          {/* Link Icon */}
          <div className="pl-1 pr-2 text-[#C4B8B0] flex-shrink-0">
            <Link2 className="w-5 h-5 text-[#C4B8B0]" />
          </div>

          {/* Text Input */}
          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="Dán liên kết video hoặc playlist"
            className="w-full bg-transparent text-sm sm:text-base text-[#F5EFEB] placeholder-[#C4B8B0]/60 focus:outline-none pr-28 font-medium"
            disabled={isLoading}
          />

          {/* Actions Inside Input */}
          <div className="absolute right-1.5 flex items-center gap-1.5">
            {url ? (
              <button
                type="button"
                onClick={() => setUrl('')}
                className="w-8 h-8 flex items-center justify-center text-[#C4B8B0] hover:text-white rounded-lg hover:bg-[#2E2420] transition-colors cursor-pointer"
                title="Xóa URL"
              >
                <X className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handlePaste}
                className="flex items-center gap-1 h-8 px-2.5 text-xs font-semibold text-[#C4B8B0] hover:text-white bg-[#181412] hover:bg-[#2E2420] rounded-lg border border-[rgba(232,168,124,0.15)] transition-all cursor-pointer"
                title="Dán (⌘V)"
              >
                <Clipboard className="w-3.5 h-3.5 text-[#C4B8B0]" />
                <span className="hidden sm:inline">Dán</span>
                <span className="text-[10px] text-[#C4B8B0]/70 font-mono hidden md:inline">(⌘V)</span>
              </button>
            )}

            {/* Primary Action Button (Flame Orange) */}
            <button
              type="submit"
              disabled={isLoading || !url.trim()}
              className="flex items-center gap-1.5 h-9 px-4 bg-[#F95721] hover:bg-[#EA4812] active:scale-98 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs sm:text-sm font-bold rounded-xl shadow-md shadow-[#F95721]/25 transition-all cursor-pointer"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Đang quét...</span>
                </>
              ) : (
                <span>Phân tích</span>
              )}
            </button>
          </div>
        </div>
      </form>

      {/* Helper line (14px, high contrast >= 4.5:1 on dusk #181412) */}
      <p className="text-center text-sm text-[#C4B8B0] font-medium tracking-wide">
        YouTube, TikTok, Facebook, Instagram, SoundCloud, X — không watermark.
      </p>

      {/* Sample Chips (Single row of 4 chips, label = content name only) */}
      <div className="flex items-center justify-center gap-2 flex-wrap pt-1">
        {sampleChips.map((chip, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => {
              setUrl(chip.url);
              onExtract(chip.url);
            }}
            className="flex items-center gap-1.5 h-9 px-3 rounded-xl bg-[#241C18]/90 hover:bg-[#2E2420] text-[#C4B8B0] hover:text-white border border-[rgba(232,168,124,0.12)] hover:border-[rgba(232,168,124,0.25)] transition-all text-xs font-medium cursor-pointer"
          >
            <Play className="w-3 h-3 text-[#F95721] fill-[#F95721]" />
            <span>{chip.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};
