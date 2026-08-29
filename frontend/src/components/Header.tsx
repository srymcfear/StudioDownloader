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

export const Header: React.FC<HeaderProps> = ({
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
    <header className="sticky top-0 z-40 w-full bg-[#181412]/90 backdrop-blur-md border-b border-[rgba(232,168,124,0.12)]">
      <div className="max-w-[1680px] mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between gap-3">
        {/* Brand / Logo */}
        <div className="flex items-center gap-3">
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

        {/* Center: Workstation | Queue Mode Switcher */}
        <div className="flex items-center p-0.5 bg-[#241C18]/90 rounded-xl border border-[rgba(232,168,124,0.12)]">
          <button
            type="button"
            onClick={() => onWorkspaceModeChange('workstation')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              workspaceMode === 'workstation'
                ? 'bg-slate-800 text-white border border-slate-700 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
            title="Bàn làm việc studio"
          >
            <LayoutGrid className="w-3.5 h-3.5 text-[#F95721]" />
            <span>Workstation</span>
          </button>

          <button
            type="button"
            onClick={() => onWorkspaceModeChange('queue')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              workspaceMode === 'queue'
                ? 'bg-slate-800 text-white border border-slate-700 shadow-sm'
                : 'text-slate-400 hover:text-white'
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

        {/* Right Action Buttons */}
        <div className="flex items-center gap-2">
          {/* Command Palette Button (⌘K) */}
          <button
            type="button"
            onClick={onOpenCommandPalette}
            className="flex items-center gap-2 px-3 h-9 rounded-lg bg-[#241C18]/80 hover:bg-[#2E2420] text-[#C4B8B0] hover:text-white border border-[rgba(232,168,124,0.12)] transition-all text-xs font-medium cursor-pointer"
            title="Mở bảng lệnh (⌘K)"
          >
            <Search className="w-3.5 h-3.5 text-[#C4B8B0]" />
            <span className="hidden lg:inline text-[#C4B8B0]">Lệnh nhanh</span>
            <kbd className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-[#181412] border border-[rgba(232,168,124,0.15)] text-[10px] font-mono text-[#C4B8B0] font-bold">
              <Command className="w-2.5 h-2.5" /> K
            </kbd>
          </button>

          {/* History Button */}
          <button
            type="button"
            onClick={onOpenHistory}
            className="flex items-center gap-1.5 px-3 h-9 rounded-lg bg-[#241C18]/80 hover:bg-[#2E2420] text-[#C4B8B0] hover:text-white border border-[rgba(232,168,124,0.12)] transition-all text-xs font-medium cursor-pointer"
            title="Xem lịch sử tệp đã tải"
          >
            <History className="w-3.5 h-3.5 text-[#C4B8B0]" />
            <span className="hidden sm:inline">Lịch sử</span>
            {historyCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-[#181412] border border-[rgba(232,168,124,0.15)] text-[#C4B8B0] text-[10px] font-bold">
                {historyCount}
              </span>
            )}
          </button>

          {/* Settings Button */}
          <button
            type="button"
            onClick={onOpenSettings}
            className="flex items-center justify-center w-9 h-9 rounded-lg bg-[#241C18]/80 hover:bg-[#2E2420] text-[#C4B8B0] hover:text-white border border-[rgba(232,168,124,0.12)] transition-all text-xs font-medium cursor-pointer"
            title="Cài đặt hệ thống & Proxy"
          >
            <Settings className="w-4 h-4 text-[#C4B8B0]" />
          </button>
        </div>
      </div>
    </header>
  );
};
