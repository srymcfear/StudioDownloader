import React from 'react';
import {
  FileCheck2,
  Lock,
  Command,
  Zap,
  Radio,
  Cloud,
} from 'lucide-react';

interface RightSidebarProps {
  onOpenSettings: () => void;
  onOpenCommandPalette?: () => void;
  onOpenChannelWatcher?: () => void;
  onOpenCloudSync?: () => void;
}

export const RightSidebar: React.FC<RightSidebarProps> = React.memo(({
  onOpenSettings,
  onOpenCommandPalette,
  onOpenChannelWatcher,
  onOpenCloudSync,
}) => {
  return (
    <aside className="space-y-4">
      {/* Cloud & Auto-Watcher Suite (Plan 6) */}
      <div className="liquid-glass-panel p-3.5 rounded-2xl border border-slate-800/90 shadow-xl space-y-2.5">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-purple-500/20 text-purple-400">
            <Radio className="w-3.5 h-3.5" />
          </div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
            Tự Động & Đám Mây
          </h3>
        </div>

        <div className="space-y-2">
          {onOpenChannelWatcher && (
            <button
              type="button"
              onClick={onOpenChannelWatcher}
              className="w-full flex items-center justify-between p-2.5 rounded-xl bg-slate-900/70 hover:bg-slate-800/90 border border-slate-800 hover:border-purple-500/40 text-xs text-slate-200 hover:text-white transition-all cursor-pointer group"
            >
              <div className="flex items-center gap-2">
                <Radio className="w-3.5 h-3.5 text-purple-400" />
                <span className="font-semibold">Kênh Tự Động Tải</span>
              </div>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-300 border border-purple-500/20 font-mono">
                Auto-Watcher
              </span>
            </button>
          )}

          {onOpenCloudSync && (
            <button
              type="button"
              onClick={onOpenCloudSync}
              className="w-full flex items-center justify-between p-2.5 rounded-xl bg-slate-900/70 hover:bg-slate-800/90 border border-slate-800 hover:border-sky-500/40 text-xs text-slate-200 hover:text-white transition-all cursor-pointer group"
            >
              <div className="flex items-center gap-2">
                <Cloud className="w-3.5 h-3.5 text-sky-400" />
                <span className="font-semibold">Đồng Bộ Telegram</span>
              </div>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-sky-500/10 text-sky-300 border border-sky-500/20 font-mono">
                Cloud Bot
              </span>
            </button>
          )}
        </div>
      </div>

      {/* Quick Controls & Hotkeys */}
      <div className="liquid-glass-panel p-3.5 rounded-2xl border border-slate-800/90 shadow-xl space-y-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-blue-500/20 text-blue-400">
            <Command className="w-3.5 h-3.5" />
          </div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
            Phím Tắt & Thao Tác
          </h3>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between p-2 rounded-xl bg-slate-900/60 border border-slate-800 text-xs">
            <span className="text-slate-300">Command Palette</span>
            <kbd className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300 font-mono text-[10px]">
              ⌘K / Ctrl+K
            </kbd>
          </div>

          <div className="flex items-center justify-between p-2 rounded-xl bg-slate-900/60 border border-slate-800 text-xs">
            <span className="text-slate-300">Dán Link Nhanh</span>
            <kbd className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300 font-mono text-[10px]">
              ⌘V / Ctrl+V
            </kbd>
          </div>

          {onOpenCommandPalette && (
            <button
              type="button"
              onClick={onOpenCommandPalette}
              className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-200 hover:text-white border border-slate-700/80 text-xs font-semibold transition-all cursor-pointer"
            >
              <Command className="w-3.5 h-3.5 text-blue-400" /> Mở Bảng Lệnh (⌘K)
            </button>
          )}
        </div>
      </div>

      {/* Security & Bypass Settings */}
      <div className="liquid-glass-panel p-3.5 rounded-2xl border border-slate-800/90 shadow-xl space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400">
              <Lock className="w-3.5 h-3.5" />
            </div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Bảo Mật & Vượt Chặn
            </h3>
          </div>
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
            <Zap className="w-2.5 h-2.5" /> Active
          </span>
        </div>

        <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 text-xs text-slate-400 space-y-1.5">
          <p className="text-[11px] leading-relaxed">
            Tự động đổi chuỗi User-Agent xoay vòng & xác thực Cookie để tránh bị giới hạn tốc độ.
          </p>
        </div>

        <button
          type="button"
          onClick={onOpenSettings}
          className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 text-xs font-semibold transition-all cursor-pointer"
        >
          <FileCheck2 className="w-3.5 h-3.5 text-emerald-400" /> Cấu hình Cookie & Proxy
        </button>
      </div>
    </aside>
  );
});
