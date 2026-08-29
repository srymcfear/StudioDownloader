import React, { useState, useEffect } from 'react';
import {
  Search,
  Music,
  Video,
  Sparkles,
  Layers,
  Zap,
  Trash2,
  Settings,
  Clipboard,
  X,
  Keyboard,
  ArrowRight,
  Radio,
  Cloud,
} from 'lucide-react';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectAction: (actionId: string, payload?: any) => void;
}

interface CommandItem {
  id: string;
  category: string;
  title: string;
  subtitle: string;
  icon: React.ComponentType<{ className?: string }>;
  hotkey?: string;
  payload?: any;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  onSelectAction,
}) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);

  const commands: CommandItem[] = [
    {
      id: 'paste_url',
      category: 'Thao tác nhanh',
      title: 'Dán link từ Clipboard',
      subtitle: 'Tự động quét và phân tích link YouTube trong bộ nhớ tạm',
      icon: Clipboard,
      hotkey: '⌘ + V',
    },
    {
      id: 'quick_mp3_320k',
      category: 'Xuất âm thanh',
      title: 'Tải nhanh MP3 320kbps Studio',
      subtitle: 'Chất lượng CBR 320k cao nhất với ID3 tag & Album Art',
      icon: Music,
      hotkey: '⌥ + 1',
    },
    {
      id: 'quick_flac',
      category: 'Xuất âm thanh',
      title: 'Tải nhanh FLAC Lossless 100%',
      subtitle: 'Âm thanh phòng thu nguyên bản không nén',
      icon: Sparkles,
      hotkey: '⌥ + 2',
    },
    {
      id: 'quick_video_1080p',
      category: 'Xuất Video',
      title: 'Tải nhanh Video 1080p 60fps Full HD',
      subtitle: 'Định dạng MP4 tương thích mọi thiết bị',
      icon: Video,
      hotkey: '⌥ + 3',
    },
    {
      id: 'quick_video_4k',
      category: 'Xuất Video',
      title: 'Tải nhanh Video 4K Ultra HD',
      subtitle: 'Độ phân giải 2160p siêu sắc nét chuẩn HDR',
      icon: Zap,
      hotkey: '⌥ + 4',
    },
    {
      id: 'switch_mode_focus',
      category: 'Không gian làm việc',
      title: 'Chuyển sang Focus Studio Mode',
      subtitle: 'Ẩn sidebar, mở rộng khu vực biên tập & timeline sóng âm',
      icon: Layers,
      hotkey: 'F',
    },
    {
      id: 'switch_mode_workstation',
      category: 'Không gian làm việc',
      title: 'Chuyển sang Workstation Mode (3 cột)',
      subtitle: 'Hiển thị đầy đủ động cơ, bàn làm việc và inspector',
      icon: Layers,
      hotkey: 'W',
    },
    {
      id: 'open_watcher',
      category: 'Tự động hóa',
      title: 'Mở Quản lý Kênh Theo Dõi (Auto-Watcher)',
      subtitle: 'Tự động quét và tải video/nhạc mới từ kênh đã đăng ký',
      icon: Radio,
      hotkey: '⌥ + W',
    },
    {
      id: 'open_cloud',
      category: 'Đám mây',
      title: 'Mở Cấu hình Đồng Bộ Telegram & Drive',
      subtitle: 'Tự động chuyển file đã xuất về Telegram Bot cá nhân',
      icon: Cloud,
      hotkey: '⌥ + T',
    },
    {
      id: 'open_settings',
      category: 'Hệ thống',
      title: 'Mở Cài đặt Cookie & Proxy',
      subtitle: 'Vượt giới hạn độ tuổi và YouTube Bot Challenge',
      icon: Settings,
      hotkey: '⌘ + ,',
    },
    {
      id: 'clear_history',
      category: 'Hệ thống',
      title: 'Xóa toàn bộ lịch sử tải về',
      subtitle: 'Dọn sạch danh sách các tệp đã tải trong phiên',
      icon: Trash2,
    },
  ];

  const filtered = commands.filter(
    (c) =>
      c.title.toLowerCase().includes(query.toLowerCase()) ||
      c.subtitle.toLowerCase().includes(query.toLowerCase()) ||
      c.category.toLowerCase().includes(query.toLowerCase())
  );

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % (filtered.length || 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + (filtered.length || 1)) % (filtered.length || 1));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (filtered[selectedIndex]) {
          onSelectAction(filtered[selectedIndex].id, filtered[selectedIndex].payload);
          onClose();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, filtered, selectedIndex, onClose, onSelectAction]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 p-4 bg-black/50 backdrop-blur-md transition-all">
      <div className="w-full max-w-2xl liquid-glass-modal rounded-3xl overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
        {/* Search Bar Header */}
        <div className="flex items-center px-4 py-3.5 border-b border-white/10 gap-3 bg-white/[0.03]">
          <Search className="w-5 h-5 text-[#F95721] flex-shrink-0" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Gõ lệnh hoặc tìm tính năng (MP3, 4K, Focus mode, Cài đặt...)"
            className="w-full bg-transparent text-sm sm:text-base text-[#F5EFEB] placeholder-[#C4B8B0]/60 focus:outline-none font-medium"
            autoFocus
          />
          <div className="flex items-center gap-1.5 text-[11px] text-[#C4B8B0] bg-white/[0.06] px-2 py-1 rounded-lg border border-white/10">
            <Keyboard className="w-3.5 h-3.5 text-[#C4B8B0]" />
            <span>ESC để đóng</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-[#C4B8B0] hover:text-white rounded-lg hover:bg-white/[0.08] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Results List */}
        <div className="max-h-[60vh] overflow-y-auto p-2 space-y-1.5">
          {filtered.length === 0 ? (
            <div className="py-12 text-center text-[#C4B8B0]/70 text-sm">
              Không tìm thấy lệnh phù hợp với "{query}"
            </div>
          ) : (
            filtered.map((cmd, idx) => {
              const Icon = cmd.icon;
              const isSelected = idx === selectedIndex;
              return (
                <button
                  key={cmd.id}
                  type="button"
                  onClick={() => {
                    onSelectAction(cmd.id, cmd.payload);
                    onClose();
                  }}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`w-full p-3 rounded-2xl flex items-center justify-between gap-3 text-left transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-[#F95721]/20 border border-[#F95721]/60 text-white shadow-lg shadow-[#F95721]/20 ring-1 ring-[#F95721]/30'
                      : 'liquid-glass-card text-[#C4B8B0] hover:text-white hover:border-white/20'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`p-2 rounded-xl transition-all ${
                        isSelected
                          ? 'bg-[#F95721] text-white shadow-md shadow-[#F95721]/40'
                          : 'bg-white/[0.06] text-[#C4B8B0] border border-white/10'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold">{cmd.title}</span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-white/[0.06] text-[#C4B8B0] font-medium border border-white/10">
                          {cmd.category}
                        </span>
                      </div>
                      <p className="text-[11px] text-[#C4B8B0]/80 truncate mt-0.5">
                        {cmd.subtitle}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    {cmd.hotkey && (
                      <span className="px-2 py-0.5 rounded-lg bg-white/[0.06] border border-white/10 text-[10px] font-mono text-[#C4B8B0] font-semibold">
                        {cmd.hotkey}
                      </span>
                    )}
                    {isSelected && (
                      <ArrowRight className="w-4 h-4 text-[#F95721]" />
                    )}
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* Footer info */}
        <div className="px-4 py-2.5 bg-black/40 border-t border-white/10 flex items-center justify-between text-[11px] text-[#C4B8B0]">
          <span>Dùng ↑ ↓ để di chuyển • Enter để chọn</span>
          <span className="font-mono text-[#C4B8B0]/80">FEAR STUDIO Workspace Pro</span>
        </div>
      </div>
    </div>
  );
};
