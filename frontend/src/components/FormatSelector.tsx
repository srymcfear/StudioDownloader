import React, { useState } from 'react';
import type { VideoInfo, VideoFormatOption, DownloadRequestPayload } from '../types';
import { Video, Music, Subtitles, Download, HardDrive, FileText, Image as ImageIcon, Sparkles, Mic, Volume2 } from 'lucide-react';
import { QualityBadge } from './QualityBadge';

interface FormatSelectorProps {
  info: VideoInfo;
  onStartDownload: (payload: DownloadRequestPayload) => void;
  isDownloading: boolean;
}

export const FormatSelector: React.FC<FormatSelectorProps> = ({
  info,
  onStartDownload,
  isDownloading,
}) => {
  const [activeTab, setActiveTab] = useState<'audio' | 'video' | 'extra'>('audio');
  const [targetExt, setTargetExt] = useState<'mp4' | 'mkv'>('mp4');
  
  // AI & DSP Audio Enhancement (Plan 2)
  const [audioEffect, setAudioEffect] = useState<'none' | 'karaoke' | 'vocal_only'>('none');
  const [normalizeLoudness, setNormalizeLoudness] = useState<boolean>(false);

  const handleCustomAudioDownload = (
    targetExtType: string,
    bitrate: string,
    presetName: string
  ) => {
    onStartDownload({
      url: info.url,
      media_type: 'audio',
      target_ext: targetExtType,
      audio_bitrate: bitrate,
      quality_preset: presetName,
      embed_metadata: true,
      embed_thumbnail: true,
      audio_effect: audioEffect,
      normalize_loudness: normalizeLoudness,
    });
  };

  const handleVideoDownload = (format: VideoFormatOption) => {
    onStartDownload({
      url: info.url,
      media_type: 'video',
      format_id: format.format_id,
      quality_preset: `${format.height}p`,
      target_ext: targetExt,
      embed_metadata: true,
      embed_thumbnail: true,
    });
  };

  const handleDownloadThumbnail = () => {
    if (info.thumbnail) {
      window.open(info.thumbnail, '_blank');
    }
  };

  return (
    <div className="w-full liquid-glass-panel rounded-3xl p-5 sm:p-6 space-y-5">
      {/* Tabs Header */}
      <div className="flex items-center justify-between flex-wrap gap-3 pb-2 border-b border-white/10">
        <div className="flex items-center gap-1.5 p-1 bg-black/40 rounded-2xl border border-white/10">
          <button
            type="button"
            onClick={() => setActiveTab('audio')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
              activeTab === 'audio'
                ? 'bg-emerald-500/30 text-emerald-300 border border-emerald-400/50 shadow-lg shadow-emerald-500/20'
                : 'text-[#C4B8B0] hover:text-white hover:bg-white/[0.06]'
            }`}
          >
            <Music className="w-4 h-4" />
            <span>Tải Nhạc (MP3 320k / Lossless)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('video')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
              activeTab === 'video'
                ? 'bg-blue-500/30 text-blue-300 border border-blue-400/50 shadow-lg shadow-blue-500/20'
                : 'text-[#C4B8B0] hover:text-white hover:bg-white/[0.06]'
            }`}
          >
            <Video className="w-4 h-4" />
            <span>Tải Video (MP4 / MKV)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('extra')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
              activeTab === 'extra'
                ? 'bg-purple-500/30 text-purple-300 border border-purple-400/50 shadow-lg shadow-purple-500/20'
                : 'text-[#C4B8B0] hover:text-white hover:bg-white/[0.06]'
            }`}
          >
            <Subtitles className="w-4 h-4" />
            <span>Phụ đề & Ảnh bìa</span>
          </button>
        </div>

        {/* Video format toggle (MP4 vs MKV) */}
        {activeTab === 'video' && (
          <div className="flex items-center gap-2 text-xs text-[#C4B8B0]">
            <span>Định dạng:</span>
            <div className="flex bg-black/40 rounded-xl p-1 border border-white/10">
              <button
                type="button"
                onClick={() => setTargetExt('mp4')}
                className={`px-3 py-1 rounded-lg font-bold transition-colors cursor-pointer ${
                  targetExt === 'mp4' ? 'bg-blue-600 text-white shadow-sm' : 'text-[#C4B8B0] hover:text-white'
                }`}
              >
                MP4
              </button>
              <button
                type="button"
                onClick={() => setTargetExt('mkv')}
                className={`px-3 py-1 rounded-lg font-bold transition-colors cursor-pointer ${
                  targetExt === 'mkv' ? 'bg-blue-600 text-white shadow-sm' : 'text-[#C4B8B0] hover:text-white'
                }`}
              >
                MKV
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Tab Content: Audio Studio Presets */}
      {activeTab === 'audio' && (
        <div className="space-y-4">
          {/* AI Audio Studio Controls */}
          <div className="p-3.5 rounded-xl bg-gradient-to-r from-purple-950/30 via-slate-900 to-indigo-950/30 border border-purple-500/30 space-y-2.5">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <div className="p-1 rounded-lg bg-purple-500/20 text-purple-400">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                    AI Audio Studio & Xử Lý Âm Thanh
                  </h4>
                  <p className="text-[11px] text-slate-400">
                    Tách beat karaoke, trích xuất vocal hoặc cân bằng âm lượng tự động
                  </p>
                </div>
              </div>

              {/* EBU R128 Toggle */}
              <button
                type="button"
                onClick={() => setNormalizeLoudness(!normalizeLoudness)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                  normalizeLoudness
                    ? 'bg-purple-600 text-white border-purple-400 shadow-md shadow-purple-500/20'
                    : 'bg-slate-900/80 text-slate-400 border-slate-800 hover:text-slate-200'
                }`}
                title="Cân bằng độ to bài hát chuẩn Spotify / Apple Music (-14 LUFS)"
              >
                <Volume2 className="w-3.5 h-3.5" />
                <span>EBU R128 (-14 LUFS)</span>
                {normalizeLoudness && <span className="text-[10px] font-mono">✓ Bật</span>}
              </button>
            </div>

            {/* Effect Pills */}
            <div className="grid grid-cols-3 gap-2 pt-1 border-t border-slate-800/80">
              <button
                type="button"
                onClick={() => setAudioEffect('none')}
                className={`py-1.5 px-2 rounded-lg text-xs font-medium border text-center transition-all cursor-pointer ${
                  audioEffect === 'none'
                    ? 'bg-blue-600 text-white border-blue-400 shadow-sm'
                    : 'bg-slate-900/60 text-slate-400 border-slate-800 hover:text-white'
                }`}
              >
                🎵 Nhạc Đầy Đủ (Gốc)
              </button>

              <button
                type="button"
                onClick={() => setAudioEffect('karaoke')}
                className={`flex items-center justify-center gap-1 py-1.5 px-2 rounded-lg text-xs font-medium border text-center transition-all cursor-pointer ${
                  audioEffect === 'karaoke'
                    ? 'bg-emerald-600 text-white border-emerald-400 shadow-sm'
                    : 'bg-slate-900/60 text-slate-400 border-slate-800 hover:text-white'
                }`}
              >
                <Music className="w-3 h-3" />
                <span>🎧 Tách Beat Karaoke</span>
              </button>

              <button
                type="button"
                onClick={() => setAudioEffect('vocal_only')}
                className={`flex items-center justify-center gap-1 py-1.5 px-2 rounded-lg text-xs font-medium border text-center transition-all cursor-pointer ${
                  audioEffect === 'vocal_only'
                    ? 'bg-rose-600 text-white border-rose-400 shadow-sm'
                    : 'bg-slate-900/60 text-slate-400 border-slate-800 hover:text-white'
                }`}
              >
                <Mic className="w-3 h-3" />
                <span>🎤 Tách Vocal Acapella</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {/* MP3 320 kbps Ultra */}
            <div className="relative glass-card rounded-xl p-4 flex flex-col justify-between gap-3 border border-[#F95721]/50 bg-[#F95721]/5 shadow-lg shadow-[#F95721]/5">
              <div className="flex items-start justify-between gap-2">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-base text-white">MP3 320 kbps</span>
                    <QualityBadge label="Studio HD" variant="audio" />
                  </div>
                  <p className="text-xs text-slate-400 leading-tight">
                    Chuẩn CBR 320 kbps • Nhúng ID3 Tag & Bìa HD
                  </p>
                </div>
                <span className="px-2 py-0.5 rounded bg-[#F95721] text-white text-[10px] font-bold">
                  Khuyên dùng
                </span>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-xs">
                <span className="text-slate-400 font-mono">Chất lượng cao nhất</span>
                <button
                  type="button"
                  disabled={isDownloading}
                  onClick={() => handleCustomAudioDownload('mp3', '320k', 'MP3 320 kbps')}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#F95721] hover:bg-[#EA4812] disabled:opacity-50 text-white font-semibold text-xs shadow-md shadow-[#F95721]/20 transition-all transform active:scale-95 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" /> Tải MP3 320 kbps
                </button>
              </div>
            </div>

            {/* FLAC Lossless */}
            <div className="relative glass-card rounded-xl p-4 flex flex-col justify-between gap-3 border border-teal-500/40 bg-teal-950/20 shadow-md">
              <div className="flex items-start justify-between gap-2">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-base text-white">FLAC Lossless</span>
                    <QualityBadge label="100% Gốc" variant="lossless" />
                  </div>
                  <p className="text-xs text-slate-400 leading-tight">
                    Âm thanh không nén • Giữ nguyên vẹn 100% độ trung thực
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-xs">
                <span className="text-slate-400 font-mono">Lossless Audio</span>
                <button
                  type="button"
                  disabled={isDownloading}
                  onClick={() => handleCustomAudioDownload('flac', '0', 'FLAC Lossless')}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-500 disabled:opacity-50 text-white font-semibold text-xs shadow-md transition-all transform active:scale-95 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" /> Tải FLAC
                </button>
              </div>
            </div>

            {/* WAV Studio Master */}
            <div className="relative glass-card rounded-xl p-4 flex flex-col justify-between gap-3 border border-slate-800 hover:border-slate-700">
              <div className="flex items-start justify-between gap-2">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-base text-white">WAV PCM</span>
                    <QualityBadge label="Master" variant="lossless" />
                  </div>
                  <p className="text-xs text-slate-400 leading-tight">
                    Định dạng sóng âm thanh nguyên bản cho phòng thu & DJ
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-xs">
                <span className="text-slate-400 font-mono">Uncompressed</span>
                <button
                  type="button"
                  disabled={isDownloading}
                  onClick={() => handleCustomAudioDownload('wav', '0', 'WAV Lossless')}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 disabled:opacity-50 text-white font-semibold text-xs transition-all transform active:scale-95 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" /> Tải WAV
                </button>
              </div>
            </div>

            {/* M4A / AAC 256k */}
            <div className="relative glass-card rounded-xl p-4 flex flex-col justify-between gap-3 border border-slate-800 hover:border-slate-700">
              <div className="flex items-start justify-between gap-2">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-base text-white">Apple M4A (AAC)</span>
                    <QualityBadge label="256 kbps" variant="audio" />
                  </div>
                  <p className="text-xs text-slate-400 leading-tight">
                    Âm thanh trong trẻo, tương thích chuẩn iTunes & iOS
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-xs">
                <span className="text-slate-400 font-mono">AAC High Profile</span>
                <button
                  type="button"
                  disabled={isDownloading}
                  onClick={() => handleCustomAudioDownload('m4a', '256k', 'M4A 256k')}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 disabled:opacity-50 text-white font-semibold text-xs transition-all transform active:scale-95 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" /> Tải M4A
                </button>
              </div>
            </div>

            {/* MP3 192k */}
            <div className="relative glass-card rounded-xl p-4 flex flex-col justify-between gap-3 border border-slate-800 hover:border-slate-700">
              <div className="flex items-start justify-between gap-2">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-base text-white">MP3 192kbps</span>
                    <QualityBadge label="Tiêu chuẩn" variant="default" />
                  </div>
                  <p className="text-xs text-slate-400 leading-tight">
                    Dung lượng gọn nhẹ, phù hợp nghe trên điện thoại
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-xs">
                <span className="text-slate-400 font-mono">Tiết kiệm bộ nhớ</span>
                <button
                  type="button"
                  disabled={isDownloading}
                  onClick={() => handleCustomAudioDownload('mp3', '192k', 'MP3 192k')}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 disabled:opacity-50 text-white font-semibold text-xs transition-all transform active:scale-95 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" /> Tải MP3 192k
                </button>
              </div>
            </div>

            {/* Original Opus */}
            <div className="relative glass-card rounded-xl p-4 flex flex-col justify-between gap-3 border border-slate-800 hover:border-slate-700">
              <div className="flex items-start justify-between gap-2">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-base text-white">Native Opus</span>
                    <QualityBadge label="Web Audio" variant="default" />
                  </div>
                  <p className="text-xs text-slate-400 leading-tight">
                    Định dạng âm thanh gốc của YouTube, trích xuất siêu nhanh
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-xs">
                <span className="text-slate-400 font-mono">Trích xuất trực tiếp</span>
                <button
                  type="button"
                  disabled={isDownloading}
                  onClick={() => handleCustomAudioDownload('opus', '0', 'Opus Native')}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 disabled:opacity-50 text-white font-semibold text-xs transition-all transform active:scale-95 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" /> Tải Opus
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab Content: Video */}
      {activeTab === 'video' && (
        <div className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {info.video_formats.map((fmt, idx) => {
              const res = fmt.resolution || `${fmt.height}p`;
              const isHigh = (fmt.height || 0) >= 1080;
              const isUltra = (fmt.height || 0) >= 2160;

              return (
                <div
                  key={idx}
                  className={`relative glass-card rounded-xl p-4 flex flex-col justify-between gap-3 border transition-colors ${
                    fmt.is_recommended
                      ? 'border-blue-500/60 bg-blue-950/20 shadow-md shadow-blue-500/10'
                      : 'border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-base text-white">
                          {res}
                        </span>
                        <QualityBadge
                          label={targetExt.toUpperCase()}
                          variant="default"
                        />
                      </div>
                      <p className="text-xs text-slate-400 mt-1">
                        {fmt.note || (isUltra ? 'Ultra High Definition' : isHigh ? 'Full HD Video' : 'Standard')}
                      </p>
                    </div>

                    <div className="flex flex-col items-end gap-1">
                      {fmt.is_recommended && (
                        <span className="px-2 py-0.5 rounded bg-blue-600 text-white text-[10px] font-bold">
                          Khuyên dùng
                        </span>
                      )}
                      {fmt.is_hdr && (
                        <QualityBadge label="HDR" variant="hdr" />
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-xs">
                    <span className="text-slate-400 flex items-center gap-1 font-mono">
                      <HardDrive className="w-3.5 h-3.5 text-slate-500" />
                      {fmt.filesize_formatted || 'Dung lượng tối ưu'}
                    </span>

                    <button
                      type="button"
                      disabled={isDownloading}
                      onClick={() => handleVideoDownload(fmt)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-semibold text-xs shadow-md shadow-blue-600/20 transition-colors cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" /> Tải Video
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab Content: Subtitles & Extra */}
      {activeTab === 'extra' && (
        <div className="space-y-4">
          {/* Thumbnail download */}
          <div className="p-4 rounded-xl glass-card border border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-500/20 text-purple-400">
                <ImageIcon className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-white">Ảnh bìa (Thumbnail) độ phân giải gốc</h4>
                <p className="text-xs text-slate-400">Tải ảnh chất lượng cao nhất Full HD / 4K</p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleDownloadThumbnail}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-medium text-xs shadow-md transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" /> Xem / Tải ảnh
            </button>
          </div>

          {/* Subtitles list */}
          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-white flex items-center gap-2">
              <FileText className="w-4 h-4 text-slate-400" /> Danh sách phụ đề (Subtitles / CC)
            </h4>

            {info.subtitles && info.subtitles.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                {info.subtitles.map((sub, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-lg bg-slate-900/60 border border-slate-800 flex items-center justify-between text-xs"
                  >
                    <span className="text-slate-300 font-medium truncate max-w-[160px]">
                      {sub.name}
                    </span>
                    <span className="text-[10px] text-slate-500 uppercase font-mono">
                      .{sub.ext}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-500 italic p-3 rounded-lg bg-slate-900/40">
                Video này không có phụ đề rời hoặc phụ đề tự động.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
