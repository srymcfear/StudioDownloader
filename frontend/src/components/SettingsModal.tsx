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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80">
      <div className="w-full max-w-lg glass-panel rounded-2xl border border-slate-700/80 shadow-2xl p-5 sm:p-6 space-y-5 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-blue-400" />
            <h3 className="text-base font-bold text-white">Cấu hình Hệ thống & Vượt Chặn</h3>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="space-y-4 flex-1 overflow-y-auto pr-1">
          {/* Proxy Setting */}
          <div className="space-y-1.5">
            <label className="flex items-center gap-2 text-xs font-semibold text-slate-300">
              <Globe className="w-4 h-4 text-cyan-400" /> Custom Proxy (Tùy chọn)
            </label>
            <input
              type="text"
              value={proxyInput}
              onChange={(e) => setProxyInput(e.target.value)}
              placeholder="http://user:pass@host:port hoặc socks5://..."
              className="w-full bg-slate-900/80 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
            />
            <p className="text-[11px] text-slate-500">
              Sử dụng khi server gặp giới hạn IP từ YouTube hoặc cần tải video giới hạn quốc gia.
            </p>
          </div>

          {/* Cookie Setting */}
          <div className="space-y-1.5">
            <label className="flex items-center gap-2 text-xs font-semibold text-slate-300">
              <Cookie className="w-4 h-4 text-amber-400" /> Cung cấp Cookie YouTube (Netscape format)
            </label>
            <textarea
              rows={4}
              value={cookieText}
              onChange={(e) => setCookieText(e.target.value)}
              placeholder="# Netscape HTTP Cookie File&#10;.youtube.com TRUE / FALSE 1750000000..."
              className="w-full bg-slate-900/80 border border-slate-700 rounded-xl p-3 text-xs font-mono text-slate-300 focus:outline-none focus:border-amber-500"
            />
            <div className="flex items-center justify-between">
              <p className="text-[11px] text-slate-500">
                Cho phép tải video 18+, video riêng tư hoặc tránh Captcha bot detection.
              </p>
              <button
                type="button"
                onClick={handleSaveCookie}
                disabled={isSavingCookie || !cookieText.trim()}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white font-medium text-xs shadow transition-colors"
              >
                {isSavingCookie ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                <span>{cookieSaved ? 'Đã lưu!' : 'Lưu Cookie'}</span>
              </button>
            </div>
          </div>

          {/* System Environment Info */}
          {systemInfo && (
            <div className="p-3 rounded-xl bg-slate-900/50 border border-slate-800 text-[11px] space-y-1 text-slate-400">
              <div className="flex items-center gap-1.5 font-semibold text-slate-300 mb-1">
                <Info className="w-3.5 h-3.5 text-blue-400" /> Thông tin phiên bản Engine
              </div>
              <div><strong className="text-slate-300">FFmpeg:</strong> {systemInfo.ffmpeg}</div>
              <div><strong className="text-slate-300">yt-dlp:</strong> v{systemInfo.ytdlp}</div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium"
          >
            Đóng
          </button>
          <button
            type="button"
            onClick={handleSaveAll}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow"
          >
            Lưu thay đổi
          </button>
        </div>
      </div>
    </div>
  );
};
