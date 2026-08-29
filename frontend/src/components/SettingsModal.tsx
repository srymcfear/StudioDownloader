import React, { useState } from 'react';
import { X, Shield, Globe, Cookie, Check, Loader2, Info } from 'lucide-react';
import { saveCookies } from '../services/api';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  proxy: string;
  onSaveProxy: (proxy: string) => void;
  systemInfo: { ffmpeg: string; ytdlp: string } | null;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  proxy,
  onSaveProxy,
  systemInfo,
}) => {
  const [cookieText, setCookieText] = useState('');
  const [proxyInput, setProxyInput] = useState(proxy);
  const [isSavingCookie, setIsSavingCookie] = useState(false);
  const [cookieSaved, setCookieSaved] = useState(false);

  if (!isOpen) return null;

  const handleSaveCookie = async () => {
    if (!cookieText.trim()) return;
    setIsSavingCookie(true);
    try {
      await saveCookies(cookieText);
      setCookieSaved(true);
      setTimeout(() => setCookieSaved(false), 3000);
    } catch (err) {
      alert('Không thể lưu cookie: ' + (err as Error).message);
    } finally {
      setIsSavingCookie(false);
    }
  };

  const handleSaveAll = () => {
    onSaveProxy(proxyInput.trim());
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-md transition-all">
      <div className="w-full max-w-lg liquid-glass-modal rounded-3xl p-5 sm:p-6 space-y-5 max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-xl bg-[#F95721]/15 text-[#F95721] border border-[#F95721]/30">
              <Shield className="w-4 h-4" />
            </div>
            <h3 className="text-base font-bold text-[#F5EFEB]">Cấu hình Hệ thống & Vượt Chặn</h3>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-[#C4B8B0] hover:text-white rounded-xl hover:bg-white/[0.08] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="space-y-4 flex-1 overflow-y-auto pr-1">
          {/* Proxy Setting */}
          <div className="space-y-1.5">
            <label className="flex items-center gap-2 text-xs font-semibold text-slate-200">
              <Globe className="w-4 h-4 text-cyan-400" /> Custom Proxy (Tùy chọn)
            </label>
            <input
              type="text"
              value={proxyInput}
              onChange={(e) => setProxyInput(e.target.value)}
              placeholder="http://user:pass@host:port hoặc socks5://..."
              className="w-full liquid-glass-input rounded-xl px-3 py-2 text-xs text-white placeholder-[#C4B8B0]/50 focus:outline-none"
            />
            <p className="text-[11px] text-[#C4B8B0]/80">
              Sử dụng khi server gặp giới hạn IP từ YouTube hoặc cần tải video giới hạn quốc gia.
            </p>
          </div>

          {/* Cookie Setting */}
          <div className="space-y-1.5">
            <label className="flex items-center gap-2 text-xs font-semibold text-slate-200">
              <Cookie className="w-4 h-4 text-amber-400" /> Cung cấp Cookie YouTube (Netscape format)
            </label>
            <textarea
              rows={4}
              value={cookieText}
              onChange={(e) => setCookieText(e.target.value)}
              placeholder="# Netscape HTTP Cookie File&#10;.youtube.com TRUE / FALSE 1750000000..."
              className="w-full liquid-glass-input rounded-xl p-3 text-xs font-mono text-slate-200 placeholder-[#C4B8B0]/50 focus:outline-none"
            />
            <div className="flex items-center justify-between gap-2 pt-1">
              <p className="text-[11px] text-[#C4B8B0]/80">
                Cho phép tải video 18+, video riêng tư hoặc tránh Captcha bot detection.
              </p>
              <button
                type="button"
                onClick={handleSaveCookie}
                disabled={isSavingCookie || !cookieText.trim()}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 border border-amber-500/40 disabled:opacity-40 font-bold text-xs shadow transition-all cursor-pointer flex-shrink-0"
              >
                {isSavingCookie ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                <span>{cookieSaved ? 'Đã lưu!' : 'Lưu Cookie'}</span>
              </button>
            </div>
          </div>

          {/* System Environment Info */}
          {systemInfo && (
            <div className="p-3.5 rounded-2xl liquid-glass-card text-[11px] space-y-1.5 text-[#C4B8B0]">
              <div className="flex items-center gap-1.5 font-semibold text-slate-200 mb-1">
                <Info className="w-3.5 h-3.5 text-[#F95721]" /> Thông tin phiên bản Engine
              </div>
              <div><strong className="text-slate-300">FFmpeg:</strong> {systemInfo.ffmpeg}</div>
              <div><strong className="text-slate-300">yt-dlp:</strong> v{systemInfo.ytdlp}</div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-white/10 flex justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl liquid-glass-btn-secondary text-[#C4B8B0] hover:text-white text-xs font-semibold cursor-pointer transition-all"
          >
            Đóng
          </button>
          <button
            type="button"
            onClick={handleSaveAll}
            className="px-4 py-2 rounded-xl liquid-glass-btn-primary text-white text-xs font-bold shadow-md cursor-pointer transition-all"
          >
            Lưu thay đổi
          </button>
        </div>
      </div>
    </div>
  );
};
