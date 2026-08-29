import React, { useState, useMemo } from 'react';
import {
  Scissors,
  Clock,
  Sparkles,
} from 'lucide-react';
import type { TrimConfig } from '../types';

interface TrimmingDrawerProps {
  duration: number;
  trimConfig: TrimConfig;
  onChange: (config: TrimConfig) => void;
}

export const TrimmingDrawer: React.FC<TrimmingDrawerProps> = ({
  duration,
  trimConfig,
  onChange,
}) => {
  const maxDuration = duration > 0 ? duration : 300; // fallback 5 min
  const [startSec, setStartSec] = useState<number>(trimConfig.start_time || 0);
  const [endSec, setEndSec] = useState<number>(
    trimConfig.end_time > 0 ? Math.min(trimConfig.end_time, maxDuration) : Math.min(60, maxDuration)
  );

  function formatTime(seconds: number): string {
    const s = Math.max(0, Math.floor(seconds));
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  }

  // Generate 48 realistic simulated audio waveform heights based on song curve
  const waveformBars = useMemo(() => {
    const bars: number[] = [];
    const count = 48;
    for (let i = 0; i < count; i++) {
      // Create a nice musical curve (intro low, verse mid, chorus high, outro taper)
      const pos = i / count;
      const wave = Math.sin(pos * Math.PI) * 0.7 + Math.sin(pos * Math.PI * 4) * 0.2 + 0.15;
      const randomJitter = (Math.sin(i * 13.37) + 1) * 0.15;
      const height = Math.min(100, Math.max(15, Math.round((wave + randomJitter) * 100)));
      bars.push(height);
    }
    return bars;
  }, []);

  const handleToggle = (enabled: boolean) => {
    const newStart = startSec;
    const newEnd = endSec > startSec ? endSec : Math.min(maxDuration, startSec + 30);
    onChange({
      enabled,
      start_time: newStart,
      end_time: newEnd,
    });
  };

  const applyTrim = (s: number, e: number) => {
    const validStart = Math.max(0, Math.min(s, maxDuration - 1));
    const validEnd = Math.max(validStart + 1, Math.min(e, maxDuration));
    setStartSec(validStart);
    setEndSec(validEnd);
    onChange({
      enabled: true,
      start_time: validStart,
      end_time: validEnd,
    });
  };

  // Preset Handlers
  const handlePresetRingtone = () => {
    // 30s preset (e.g. from 15s to 45s)
    const mid = Math.floor(maxDuration * 0.2);
    applyTrim(mid, Math.min(maxDuration, mid + 30));
  };

  const handlePresetShorts = () => {
    // 60s TikTok / Shorts preset
    const mid = Math.floor(maxDuration * 0.15);
    applyTrim(mid, Math.min(maxDuration, mid + 60));
  };

  const handlePresetChorus = () => {
    // 15s Hook / Chorus
    const mid = Math.floor(maxDuration * 0.35);
    applyTrim(mid, Math.min(maxDuration, mid + 15));
  };

  const handlePresetFull = () => {
    applyTrim(0, maxDuration);
  };

  const trimmedLength = Math.max(0, endSec - startSec);
  const startPercent = (startSec / maxDuration) * 100;
  const endPercent = (endSec / maxDuration) * 100;

  return (
    <div className="glass-card rounded-2xl p-4 sm:p-5 border border-slate-700/70 shadow-xl space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
            <Scissors className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              Trình Cắt Nhạc & Video Studio (Interactive Waveform)
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                PRO TIMELINE
              </span>
            </h4>
            <p className="text-xs text-slate-400">
              Kéo thả mốc thời gian hoặc chọn preset để lấy đoạn nhạc chuông / TikTok
            </p>
          </div>
        </div>

        {/* Toggle switch */}
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={trimConfig.enabled}
            onChange={(e) => handleToggle(e.target.checked)}
            className="sr-only peer"
          />
          <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500 shadow-inner"></div>
        </label>
      </div>

      {trimConfig.enabled && (
        <div className="pt-2 border-t border-slate-700/60 space-y-4">
          {/* Quick Studio Presets */}
          <div className="flex items-center gap-2 flex-wrap text-xs">
            <span className="text-slate-400 font-medium text-[11px] flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Presets nhanh:
            </span>
            <button
              type="button"
              onClick={handlePresetRingtone}
              className="px-2.5 py-1 rounded-lg bg-slate-900/90 hover:bg-amber-500/20 text-slate-300 hover:text-amber-300 border border-slate-700/80 hover:border-amber-500/40 text-[11px] font-semibold transition-all cursor-pointer"
            >
              🔔 30s Nhạc Chuông
            </button>
            <button
              type="button"
              onClick={handlePresetShorts}
              className="px-2.5 py-1 rounded-lg bg-slate-900/90 hover:bg-blue-500/20 text-slate-300 hover:text-blue-300 border border-slate-700/80 hover:border-blue-500/40 text-[11px] font-semibold transition-all cursor-pointer"
            >
              📱 60s TikTok / Shorts
            </button>
            <button
              type="button"
              onClick={handlePresetChorus}
              className="px-2.5 py-1 rounded-lg bg-slate-900/90 hover:bg-purple-500/20 text-slate-300 hover:text-purple-300 border border-slate-700/80 hover:border-purple-500/40 text-[11px] font-semibold transition-all cursor-pointer"
            >
              🔥 15s Hook / Điệp Khúc
            </button>
            <button
              type="button"
              onClick={handlePresetFull}
              className="px-2.5 py-1 rounded-lg bg-slate-900/90 hover:bg-emerald-500/20 text-slate-300 hover:text-emerald-300 border border-slate-700/80 hover:border-emerald-500/40 text-[11px] font-semibold transition-all cursor-pointer"
            >
              🎵 Toàn bộ ({formatTime(maxDuration)})
            </button>
          </div>

          {/* Interactive Waveform Visualizer Canvas */}
          <div className="relative p-3 rounded-xl bg-slate-950/80 border border-slate-800 shadow-inner space-y-2 select-none overflow-hidden">
            {/* Waveform Bar Graphic */}
            <div className="relative h-16 w-full flex items-end justify-between gap-0.5 px-1 py-1">
              {waveformBars.map((height, i) => {
                const barPercent = (i / waveformBars.length) * 100;
                const isInSelection = barPercent >= startPercent && barPercent <= endPercent;

                return (
                  <div
                    key={i}
                    className={`flex-1 rounded-full transition-all duration-150 ${
                      isInSelection
                        ? 'bg-gradient-to-t from-amber-500 to-amber-300 opacity-95 shadow-sm shadow-amber-500/50'
                        : 'bg-slate-700/40 hover:bg-slate-600/60'
                    }`}
                    style={{ height: `${height}%` }}
                  />
                );
              })}

              {/* Range Shade Overlay */}
              <div
                className="absolute top-0 bottom-0 bg-amber-500/15 border-x-2 border-amber-400 pointer-events-none rounded-md transition-all"
                style={{
                  left: `${startPercent}%`,
                  width: `${Math.max(1, endPercent - startPercent)}%`,
                }}
              />
            </div>

            {/* Range Slider Track */}
            <div className="relative pt-1">
              <div className="w-full flex items-center justify-between text-[11px] font-mono text-slate-500 px-1">
                <span>00:00</span>
                <span className="text-amber-400 font-bold">
                  Đoạn cắt: {formatTime(startSec)} ➔ {formatTime(endSec)} ({formatTime(trimmedLength)})
                </span>
                <span>{formatTime(maxDuration)}</span>
              </div>
            </div>
          </div>

          {/* Precision Controls Row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-center pt-1">
            {/* Start Control */}
            <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1.5">
              <div className="flex items-center justify-between text-xs text-slate-300">
                <span className="font-semibold text-amber-300">Điểm bắt đầu</span>
                <span className="font-mono font-bold text-white">{formatTime(startSec)}</span>
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => applyTrim(startSec - 5, endSec)}
                  className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-[11px] text-slate-300 rounded font-mono transition-colors"
                >
                  -5s
                </button>
                <button
                  type="button"
                  onClick={() => applyTrim(startSec - 1, endSec)}
                  className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-[11px] text-slate-300 rounded font-mono transition-colors"
                >
                  -1s
                </button>
                <button
                  type="button"
                  onClick={() => applyTrim(startSec + 1, endSec)}
                  className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-[11px] text-slate-300 rounded font-mono transition-colors"
                >
                  +1s
                </button>
                <button
                  type="button"
                  onClick={() => applyTrim(startSec + 5, endSec)}
                  className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-[11px] text-slate-300 rounded font-mono transition-colors"
                >
                  +5s
                </button>
              </div>
            </div>

            {/* End Control */}
            <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1.5">
              <div className="flex items-center justify-between text-xs text-slate-300">
                <span className="font-semibold text-amber-300">Điểm kết thúc</span>
                <span className="font-mono font-bold text-white">{formatTime(endSec)}</span>
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => applyTrim(startSec, endSec - 5)}
                  className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-[11px] text-slate-300 rounded font-mono transition-colors"
                >
                  -5s
                </button>
                <button
                  type="button"
                  onClick={() => applyTrim(startSec, endSec - 1)}
                  className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-[11px] text-slate-300 rounded font-mono transition-colors"
                >
                  -1s
                </button>
                <button
                  type="button"
                  onClick={() => applyTrim(startSec, endSec + 1)}
                  className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-[11px] text-slate-300 rounded font-mono transition-colors"
                >
                  +1s
                </button>
                <button
                  type="button"
                  onClick={() => applyTrim(startSec, endSec + 5)}
                  className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-[11px] text-slate-300 rounded font-mono transition-colors"
                >
                  +5s
                </button>
              </div>
            </div>

            {/* Summary length badge */}
            <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between">
              <div className="space-y-0.5">
                <span className="text-[11px] text-amber-300/80 block font-medium">Tổng độ dài xuất</span>
                <div className="flex items-center gap-1 text-sm font-bold text-amber-400 font-mono">
                  <Clock className="w-4 h-4" />
                  <span>{formatTime(trimmedLength)}</span>
                </div>
              </div>
              <span className="text-[10px] px-2 py-1 rounded bg-amber-500/20 text-amber-300 font-bold">
                FFmpeg Stream Copy
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
