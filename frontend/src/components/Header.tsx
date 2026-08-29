import React from 'react';
import {
  Settings,
  History,
  Flame,
  LayoutGrid,
  Layers,
  Search,
  Command,
} from 'lucide-react';

export type WorkspaceMode = 'workstation' | 'queue';

interface HeaderProps {
  workspaceMode: WorkspaceMode;
  onWorkspaceModeChange: (mode: WorkspaceMode) => void;
  onOpenCommandPalette: () => void;
  onOpenSettings: () => void;
  onOpenHistory: () => void;
  historyCount: number;
  activeQueueCount?: number;
  serverOnline: boolean;
}

export const Header: React.FC<HeaderProps> = React.memo(({
  workspaceMode,
  onWorkspaceModeChange,
  onOpenCommandPalette,
  onOpenSettings,
  onOpenHistory,
  historyCount,
  activeQueueCount = 0,
  serverOnline,
}) => {
  return (
    <header className="sticky top-0 z-40 w-full bg-[#181412]/80 backdrop-blur-xl border-b border-white/10 shadow-sm">
      <div className="max-w-[1680px] mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between gap-3">
        {/* Brand / Logo + macOS Window Traffic Lights */}
        <div className="flex items-center gap-3.5">
          {/* Traffic Light Dots */}
          <div className="flex items-center gap-1.5 px-1 py-1">
            <span className="w-3 h-3 rounded-full macos-traffic-red cursor-pointer" title="Đóng" />
            <span className="w-3 h-3 rounded-full macos-traffic-yellow cursor-pointer" title="Thu nhỏ" />
            <span className="w-3 h-3 rounded-full macos-traffic-green cursor-pointer" title="Toàn màn hình" />
          </div>

          <div className="h-4 w-[1px] bg-white/10 mx-0.5" />

          <div className="relative flex items-center justify-center w-8 h-8 rounded-xl bg-gradient-to-tr from-[#F95721] to-[#FF7A00] text-white shadow-md shadow-[#F95721]/20">
            <Flame className="w-4 h-4 fill-white" />
            <div className="absolute -bottom-0.5 -right-0.5 flex h-2 w-2">
              <span
                className={`relative inline-flex rounded-full h-2 w-2 border border-[#181412] ${
                  serverOnline ? 'bg-emerald-500' : 'bg-rose-500'
                }`}
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-sm sm:text-base tracking-wider text-white font-mono">
              FEAR STUDIO
            </span>
          </div>
        </div>

        {/* Center: macOS Segmented Tab Switcher (Workstation | Queue) */}
        <div className="flex items-center p-1 bg-black/40 backdrop-blur-md rounded-full border border-white/10 shadow-inner">
          <button
            type="button"
            onClick={() => onWorkspaceModeChange('workstation')}
            className={`macos-btn px-3.5 py-1 rounded-full text-xs font-semibold ${
              workspaceMode === 'workstation'
                ? 'macos-btn-secondary !bg-white/15 !text-white !border-white/20 shadow-sm'
                : 'text-[#C4B8B0] hover:text-white'
            }`}
            title="Bàn làm việc studio"
          >
            <LayoutGrid className="w-3.5 h-3.5 text-[#F95721]" />
            <span>Workstation</span>
          </button>

          <button
            type="button"
            onClick={() => onWorkspaceModeChange('queue')}
            className={`macos-btn px-3.5 py-1 rounded-full text-xs font-semibold ${
              workspaceMode === 'queue'
                ? 'macos-btn-secondary !bg-white/15 !text-white !border-white/20 shadow-sm'
                : 'text-[#C4B8B0] hover:text-white'
            }`}
            title="Hàng đợi tải xuống"
          >
            <Layers className="w-3.5 h-3.5 text-blue-400" />
            <span>Hàng đợi</span>
            {activeQueueCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-blue-600 text-white text-[10px] font-bold">
                {activeQueueCount}
              </span>
            )}
          </button>
        </div>

        {/* Right Action Buttons (MacBook Style) */}
        <div className="flex items-center gap-2">
          {/* Command Palette Button (⌘K) */}
          <button
            type="button"
            onClick={onOpenCommandPalette}
            className="macos-btn macos-btn-secondary h-8 px-3 rounded-full text-xs"
            title="Mở bảng lệnh (⌘K)"
          >
            <Search className="w-3.5 h-3.5 text-[#C4B8B0]" />
            <span className="hidden lg:inline text-[#C4B8B0]">Lệnh nhanh</span>
            <kbd className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-black/40 border border-white/15 text-[10px] font-mono text-slate-300 font-bold">
              <Command className="w-2.5 h-2.5" /> K
            </kbd>
          </button>

          {/* History Button */}
          <button
            type="button"
            onClick={onOpenHistory}
            className="macos-btn macos-btn-secondary h-8 px-3 rounded-full text-xs"
            title="Xem lịch sử tệp đã tải"
          >
            <History className="w-3.5 h-3.5 text-[#C4B8B0]" />
            <span className="hidden sm:inline">Lịch sử</span>
            {historyCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-white/10 text-white text-[10px] font-bold">
                {historyCount}
              </span>
            )}
          </button>

          {/* Settings Button */}
          <button
            type="button"
            onClick={onOpenSettings}
            className="macos-btn macos-btn-secondary w-8 h-8 rounded-full"
            title="Cài đặt hệ thống & Proxy"
          >
            <Settings className="w-4 h-4 text-[#C4B8B0]" />
          </button>
        </div>
      </div>
    </header>
  );
});
