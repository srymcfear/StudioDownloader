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
        <div className="relative flex items-center h-13 px-4 rounded-3xl liquid-glass-panel shadow-2xl focus-within:border-[#F95721] focus-within:ring-2 focus-within:ring-[#F95721]/30 transition-all">
          {/* Link Icon */}
          <div className="pl-1 pr-2.5 text-[#C4B8B0] flex-shrink-0">
            <Link2 className="w-5 h-5 text-[#F95721]" />
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
                className="w-8 h-8 flex items-center justify-center text-[#C4B8B0] hover:text-white rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
                title="Xóa URL"
              >
                <X className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handlePaste}
                className="macos-btn macos-btn-secondary h-8 px-3 rounded-xl text-xs"
                title="Dán (⌘V)"
              >
                <Clipboard className="w-3.5 h-3.5 text-[#C4B8B0]" />
                <span className="hidden sm:inline">Dán</span>
                <span className="text-[10px] text-[#C4B8B0]/70 font-mono hidden md:inline">(⌘V)</span>
              </button>
            )}

            {/* Primary Action Button (MacBook Style Flame) */}
            <button
              type="submit"
              disabled={isLoading || !url.trim()}
              className="macos-btn macos-btn-primary h-8 px-4 rounded-xl text-xs sm:text-sm disabled:opacity-40 disabled:cursor-not-allowed"
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

      {/* Sample Chips (MacBook Pills) */}
      <div className="flex items-center justify-center gap-2 flex-wrap pt-1">
        {sampleChips.map((chip, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => {
              setUrl(chip.url);
              onExtract(chip.url);
            }}
            className="macos-btn macos-btn-secondary h-8 px-3 rounded-full text-xs font-medium"
          >
            <Play className="w-3 h-3 text-[#F95721] fill-[#F95721]" />
            <span>{chip.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};
