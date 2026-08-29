import React, { useState, useEffect } from 'react';
import {
  X,
  Send,
  Cloud,
  CheckCircle2,
  AlertCircle,
  Shield,
  ExternalLink,
  Loader2,
} from 'lucide-react';
import {
  fetchCloudConfig,
  saveCloudConfig,
  testTelegramBot,
} from '../services/api';

interface CloudSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CloudSyncModal: React.FC<CloudSyncModalProps> = ({ isOpen, onClose }) => {
  const [botToken, setBotToken] = useState('');
  const [chatId, setChatId] = useState('');
  const [autoSync, setAutoSync] = useState(false);
  const [gdriveEnabled, setGdriveEnabled] = useState(false);
  const [gdriveFolderId, setGdriveFolderId] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadConfig();
    }
  }, [isOpen]);

  const loadConfig = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const cfg = await fetchCloudConfig();
      setBotToken(cfg.telegram_bot_token || '');
      setChatId(cfg.telegram_chat_id || '');
      setAutoSync(cfg.auto_sync_telegram || false);
      setGdriveEnabled(cfg.gdrive_enabled || false);
      setGdriveFolderId(cfg.gdrive_folder_id || '');
    } catch (e: any) {
      setError(e.message || 'Không thể tải cấu hình Cloud');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTestTelegram = async () => {
    if (!botToken.trim() || !chatId.trim()) {
      setError('Vui lòng nhập đầy đủ Telegram Bot Token và Chat ID để kiểm tra.');
      return;
    }

    try {
      setIsTesting(true);
      setError(null);
      const res = await testTelegramBot(botToken.trim(), chatId.trim());
      setSuccessMsg(res.message || 'Kết nối Telegram thành công! Hãy kiểm tra tin nhắn thử nghiệm trên Telegram.');
      setTimeout(() => setSuccessMsg(null), 5000);
    } catch (e: any) {
      setError(e.message || 'Kiểm tra kết nối thất bại');
    } finally {
      setIsTesting(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSaving(true);
      setError(null);
      await saveCloudConfig({
        telegram_bot_token: botToken.trim(),
        telegram_chat_id: chatId.trim(),
        auto_sync_telegram: autoSync,
        gdrive_enabled: gdriveEnabled,
        gdrive_folder_id: gdriveFolderId.trim(),
      });
      setSuccessMsg('Đã lưu cấu hình Đồng bộ Đám mây thành công!');
      setTimeout(() => {
        setSuccessMsg(null);
        onClose();
      }, 1500);
    } catch (e: any) {
      setError(e.message || 'Lỗi lưu cấu hình');
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80">
      <div className="relative w-full max-w-xl max-h-[90vh] flex flex-col rounded-3xl glass-panel border border-slate-700/80 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center">
              <Cloud className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                Đồng Bộ Đám Mây & Telegram
              </h2>
              <p className="text-[11px] text-slate-400">
                Tự động gửi file media đã xử lý trực tiếp về tài khoản Telegram
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Notifications */}
        {error && (
          <div className="mx-6 mt-3 p-3 rounded-xl bg-rose-950/40 border border-rose-800/60 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}
        {successMsg && (
          <div className="mx-6 mt-3 p-3 rounded-xl bg-emerald-950/40 border border-emerald-800/60 text-emerald-300 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-6 space-y-5">
          {isLoading ? (
            <div className="py-12 text-center text-xs text-slate-400 space-y-2">
              <Loader2 className="w-5 h-5 animate-spin mx-auto text-blue-400" />
              <p>Đang tải cấu hình...</p>
            </div>
          ) : (
            <>
              {/* Telegram Section */}
              <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Send className="w-4 h-4 text-sky-400" />
                    <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                      Cấu hình Telegram Bot
                    </h3>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-sky-500/10 text-sky-400 font-mono border border-sky-500/20">
                    Bot API
                  </span>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-[11px] text-slate-300 font-medium mb-1">
                      Telegram Bot Token:
                    </label>
                    <input
                      type="text"
                      value={botToken}
                      onChange={(e) => setBotToken(e.target.value)}
                      placeholder="123456789:ABCdefGhIJKlmNoPQRsTUVwxyZ..."
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 font-mono"
                    />
                    <p className="text-[10px] text-slate-500 mt-1">
                      Tạo bot miễn phí bằng cách chat với <a href="https://t.me/BotFather" target="_blank" rel="noreferrer" className="text-blue-400 hover:underline inline-flex items-center gap-0.5">@BotFather <ExternalLink className="w-2.5 h-2.5" /></a> trên Telegram.
                    </p>
                  </div>

                  <div>
                    <label className="block text-[11px] text-slate-300 font-medium mb-1">
                      Telegram Chat ID:
                    </label>
                    <input
                      type="text"
                      value={chatId}
                      onChange={(e) => setChatId(e.target.value)}
                      placeholder="VD: 987654321 hoặc -100123456789 (nhóm)"
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 font-mono"
                    />
                    <p className="text-[10px] text-slate-500 mt-1">
                      Lấy Chat ID cá nhân bằng cách chat với <a href="https://t.me/userinfobot" target="_blank" rel="noreferrer" className="text-blue-400 hover:underline inline-flex items-center gap-0.5">@userinfobot <ExternalLink className="w-2.5 h-2.5" /></a>.
                    </p>
                  </div>

                  <div className="pt-1 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={handleTestTelegram}
                      disabled={isTesting || !botToken || !chatId}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-200 hover:text-white border border-slate-700 text-xs font-semibold transition-all cursor-pointer"
                    >
                      <Send className={`w-3.5 h-3.5 text-sky-400 ${isTesting ? 'animate-pulse' : ''}`} />
                      <span>{isTesting ? 'Đang gửi thử...' : 'Gửi Tin Nhắn Thử Nghiệm'}</span>
                    </button>

                    <label className="flex items-center gap-2 text-xs text-slate-200 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={autoSync}
                        onChange={(e) => setAutoSync(e.target.checked)}
                        className="rounded bg-slate-950 border-slate-700 text-sky-500 focus:ring-0"
                      />
                      <span className="font-medium">Tự động gửi file khi tải xong</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Google Drive Section */}
              <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Cloud className="w-4 h-4 text-emerald-400" />
                    <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                      Đồng Bộ Google Drive
                    </h3>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-mono border border-emerald-500/20">
                    Storage Pro
                  </span>
                </div>

                <div>
                  <label className="block text-[11px] text-slate-300 font-medium mb-1">
                    Google Drive Folder ID (Tùy chọn):
                  </label>
                  <input
                    type="text"
                    value={gdriveFolderId}
                    onChange={(e) => setGdriveFolderId(e.target.value)}
                    placeholder="VD: 1a2B3c4D5e6F7g8H9..."
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 font-mono"
                  />
                </div>

                <div className="flex items-center justify-between pt-1">
                  <label className="flex items-center gap-2 text-xs text-slate-200 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={gdriveEnabled}
                      onChange={(e) => setGdriveEnabled(e.target.checked)}
                      className="rounded bg-slate-950 border-slate-700 text-emerald-500 focus:ring-0"
                    />
                    <span className="font-medium">Bật lưu trữ Drive định kỳ</span>
                  </label>
                </div>
              </div>

              {/* Security Badge */}
              <div className="p-3 rounded-xl bg-blue-950/20 border border-blue-800/30 flex items-center gap-2 text-xs text-slate-400">
                <Shield className="w-4 h-4 text-blue-400 flex-shrink-0" />
                <span className="text-[11px]">
                  Token và Chat ID được mã hóa an toàn tại máy chủ nội bộ và không bao giờ chia sẻ ra ngoài.
                </span>
              </div>
            </>
          )}

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isSaving || isLoading}
              className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-bold transition-all shadow-lg shadow-blue-600/20 cursor-pointer"
            >
              {isSaving ? 'Đang lưu...' : 'Lưu Cấu Hình'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
