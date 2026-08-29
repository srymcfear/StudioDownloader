<div align="center">

# 🔥 FEAR STUDIO — Ultra-Performance Media Downloader

**Nền Tảng Bóc Tách & Tải Xuất Media Đa Nền Tảng Tốc Độ Cao**

[![FastAPI](https://img.shields.io/badge/FastAPI-0.115+-009688.svg?style=flat-square&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![Python](https://img.shields.io/badge/Python-3.12+-3776AB.svg?style=flat-square&logo=python&logoColor=white)](https://python.org)
[![React](https://img.shields.io/badge/React-19-61DAFB.svg?style=flat-square&logo=react&logoColor=black)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7+-3178C6.svg?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.0-06B6D4.svg?style=flat-square&logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![FFmpeg](https://img.shields.io/badge/FFmpeg-7.1-007808.svg?style=flat-square&logo=ffmpeg&logoColor=white)](https://ffmpeg.org)
[![yt--dlp](https://img.shields.io/badge/yt--dlp-2026.08+-red.svg?style=flat-square)](https://github.com/yt-dlp/yt-dlp)
[![License](https://img.shields.io/badge/License-MIT-orange.svg?style=flat-square)](LICENSE)

*Một sản phẩm chất lượng cao của **TEAM FEAR** • Phát triển với ❤️ bởi **srymc***

[Tính Năng](#-tính-năng-nổi-bật) • [Cài Đặt Nhanh](#-hướng-dẫn-cài-đặt--khởi-động) • [Kiến Trúc](#-kiến-trúc-hệ-thống) • [Tài Liệu API](#-tài-liệu-api) • [Bản Quyền](#-tác-giả--bản-quyền)

</div>

---

## 🌟 Tổng Quan Dự Án

**FEAR STUDIO** là hệ thống phần mềm trích xuất và chuyển đổi media chuyên nghiệp, kết hợp giữa backend siêu tốc **FastAPI (Python 3.12+)** và giao diện phòng thu **React 19 + TypeScript (Tailwind CSS v4)**. Hệ thống cho phép bóc tách video độ phân giải siêu cao lên đến **8K 60fps HDR** và âm thanh chuẩn phòng thu **MP3 320 kbps CBR, Lossless FLAC, WAV, M4A/AAC** từ hàng loạt nền tảng phổ biến nhất thế giới.

---

## ✨ Tính Năng Nổi Bật

### 1. 🎥 Bóc Tách & Xuất Video Siêu Nét (Ultra HD)
- Hỗ trợ toàn diện các độ phân giải: **8K (4320p), 4K (2160p), 2K (1440p), Full HD 1080p 60fps**.
- Động cơ **FFmpeg 7.1** tự động hòa trộn (muxing) luồng hình ảnh bitrate cao nhất cùng luồng âm thanh tốt nhất.
- Tùy chọn container xuất: **MP4** hoặc **MKV**.

### 2. 🎵 Âm Thanh Chuẩn Phòng Thu & Lossless
- **MP3 320 kbps CBR**: Mã hóa qua bộ giải mã LAME MP3 chất lượng cao nhất, tự động nhúng Metadata ID3 Tag và ảnh bìa Album HD.
- **FLAC & WAV Lossless**: Giữ nguyên vẹn 100% tần số và độ trung thực từ nguồn phát.
- **Apple M4A / AAC (256 kbps)**: Tối ưu cho tai nghe và hệ sinh thái Apple.
- **Native Opus (160 kbps)**: Luồng âm thanh nguyên bản không nén lại.

### 3. 🌐 Hỗ Trợ Đa Nền Tảng (Multi-Platform Media Suite)
- **YouTube**: Video, Shorts, Playlist, Live Stream.
- **TikTok**: Tải video chất lượng gốc **Không Watermark (No Watermark)**.
- **Facebook & Instagram**: Hỗ trợ Reels, Watch, Video bài viết Full HD.
- **SoundCloud**: Trích xuất luồng âm thanh High Quality (HQ Stream).
- **Twitter / X & Bilibili**: Video chất lượng cao lên đến 4K.

### 4. 🎛️ AI Audio Separation & Studio Trimming
- **Tách Beat Karaoke**: Tự động lọc lời ca sĩ để tạo beat hát karaoke bằng thuật toán đảo pha nâng cao.
- **Tách Vocal Acapella**: Tách riêng giọng hát ca sĩ trong trẻo.
- **Timeline Audio Trimmer**: Cắt chọn chính xác đoạn nhạc chuông / điệp khúc mong muốn (`start_time` → `end_time`).

### 5. 📑 Trình Tải Danh Sách Phát (Playlist Direct Batch)
- Tự động nhận diện Playlist lên đến hàng trăm video.
- Tùy chọn **`Chọn tất cả`** hoặc **`Bỏ chọn tất cả`** linh hoạt.
- Tải trực tiếp song song từng tệp về máy tính mà không cần nén ZIP.

### 6. 📡 Kênh Tự Động Tải & Đồng Bộ Đám Mây (Channel Watcher & Cloud Sync)
- **Channel Auto-Watcher**: Đăng ký danh sách kênh theo dõi, tự động quét định kỳ và tải video mới xuất bản.
- **Cloud Sync (Telegram Bot)**: Cấu hình Telegram Bot Token & Chat ID để tự động đẩy file đã tải trực tiếp về Telegram cá nhân/nhóm.

### 7. 🛡️ Vượt Chặn & An Toàn Bảo Mật Cao Cấp
- Cơ chế quản lý Cookie YouTube (`cookies.txt`) chống checkpoint bot.
- Tích hợp Proxy xoay vòng (HTTP / SOCKS5).
- Tường lửa SSRF đa tầng chặn toàn bộ IP nội bộ và Private Subnets.

---

## 🛠️ Ngăn Xếp Công Nghệ (Tech Stack)

| Thành Phần | Công Nghệ Sử Dụng |
|---|---|
| **Backend Engine** | Python 3.12+, FastAPI, Uvicorn, yt-dlp, FFmpeg 7.1 Core |
| **Frontend Framework** | React 19, TypeScript, Vite 8, Tailwind CSS v4, Lucide Icons |
| **Giao Thức Realtime** | Server-Sent Events (SSE) cho thanh tiến trình % tốc độ mili-giây |
| **Bảo Mật & Network** | SSRF Filtering, SlowAPI Rate Limiting, Cookie & Proxy Encryption |
| **Hệ Thống Tối Ưu** | A2 Dusk Studio Theme, Zero-Delay Instant Rendering |

---

## 🚀 Hướng Dẫn Cài Đặt & Khởi Động

### Yêu Cầu Tiên Quyết
- **Python 3.12+** và trình quản lý gói [uv](https://github.com/astral-sh/uv) (khuyên dùng) hoặc `pip`.
- **Node.js 18+** và [pnpm](https://pnpm.io).
- **FFmpeg 7.0+** cài đặt trên hệ thống (`brew install ffmpeg` trên macOS hoặc `apt install ffmpeg` trên Ubuntu/Debian).

### 1. Khởi Động Nhanh (1-Click Startup)

Chỉ cần chạy tập lệnh tự động hóa:
```bash
git clone https://github.com/<your-username>/FEAR-TubeStudio.git
cd FEAR-TubeStudio
chmod +x start.sh
./start.sh
```

### 2. Cài Đặt Thủ Công

#### Khởi chạy Backend:
```bash
cd backend
uv venv
source .venv/bin/activate   # Trên Windows: .venv\Scripts\activate
uv pip install -e .
python run.py
```
*Backend API chạy tại: `http://localhost:8000` (Tài liệu Swagger: `http://localhost:8000/docs`)*

#### Khởi chạy Frontend:
```bash
cd frontend
pnpm install
pnpm dev --host 0.0.0.0 --port 5173
```
*Frontend Studio chạy tại: `http://localhost:5173` (hoặc IP mạng LAN `http://192.168.x.x:5173`)*

---

## 📡 Tài Liệu API

| Phương Thức | Endpoint | Chức Năng |
|---|---|---|
| `GET` | `/api/health` | Kiểm tra trạng thái máy chủ, FFmpeg, yt-dlp, dung lượng ổ đĩa |
| `POST` | `/api/info` | Trích xuất thông tin video / playlist / bài hát từ URL |
| `POST` | `/api/download/start` | Bắt đầu tải và chuyển đổi định dạng một tệp media |
| `GET` | `/api/download/progress/{task_id}` | Lắng nghe luồng tiến trình Server-Sent Events (SSE) |
| `GET` | `/api/download/file/{task_id}` | Tải trực tiếp tệp media hoàn tất về máy |
| `POST` | `/api/watcher/add` | Đăng ký kênh YouTube/TikTok tự động quét tải mới |
| `POST` | `/api/cloud/telegram/test` | Kiểm tra kết nối Telegram Bot Cloud Sync |

---

## 📂 Cấu Trúc Thư Mục Dự Án

```text
FEAR-TubeStudio/
├── backend/                  # Động cơ FastAPI & dịch vụ trích xuất yt-dlp
│   ├── app/
│   │   ├── api/              # API Endpoints (Download, Watcher, Cloud, Cookie)
│   │   ├── core/             # Cấu hình hệ thống & SSRF Security Validator
│   │   ├── models/           # Pydantic Schemas & Data Models
│   │   └── services/         # Task Manager, Channel Watcher, Cloud Sync, AI
│   ├── pyproject.toml        # Cấu hình gói & phụ thuộc Python
│   └── run.py                # Điểm khởi chạy Uvicorn Backend
├── frontend/                 # Giao diện phòng thu React 19 + TypeScript
│   ├── src/
│   │   ├── components/       # Header, UrlInput, FormatSelector, LeftSidebar...
│   │   ├── services/         # Axios API Client & Smart SSE Poller
│   │   └── index.css         # A2 Dusk Studio Design System
│   ├── package.json
│   └── vite.config.ts
├── start.sh                  # Script khởi động tự động toàn diện
├── .gitignore                # Quy chuẩn lọc file rác, media và credentials
├── LICENSE                   # Giấy phép nguồn mở MIT
└── README.md                 # Tài liệu hướng dẫn sử dụng
```

---

## 👥 Tác Giả & Bản Quyền

- **Tổ chức:** `TEAM FEAR`
- **Tác giả phát triển:** `srymc`
- **Giấy phép:** [MIT License](LICENSE) © 2026 **TEAM FEAR**.
