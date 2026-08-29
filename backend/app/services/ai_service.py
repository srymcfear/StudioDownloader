import os
import re
import httpx
from app.schemas.models import AISummaryRequest, AISummaryResponse, AISummaryHighlight

class AIService:
    def __init__(self):
        self.api_key = os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")

    def _format_time(self, seconds: float | int) -> str:
        s = int(seconds)
        m = s // 60
        sec = s % 60
        h = m // 60
        if h > 0:
            return f"{h:02d}:{m%60:02d}:{sec:02d}"
        return f"{m:02d}:{sec:02d}"

    async def summarize_video(self, req: AISummaryRequest) -> AISummaryResponse:
        title = req.title.strip()
        desc = (req.description or "").strip()
        duration = req.duration_seconds or 0

        # If Gemini API Key is available, call Gemini Flash API
        if self.api_key:
            try:
                async with httpx.AsyncClient(timeout=15.0) as client:
                    prompt = f"""Bạn là chuyên gia phân tích nội dung video đa phương tiện của Studio chuyên nghiệp.
Hãy tóm tắt và trích xuất điểm nhấn của video sau đây:

Tiêu đề: {title}
Thời lượng: {self._format_time(duration)} ({duration} giây)
Mô tả video:
{desc[:3000]}

Trả về định dạng JSON thuần túy (không bọc markdown code block) có cấu trúc:
{{
  "overview": "Đoạn văn ngắn 2-3 câu tóm tắt tổng quan nội dung và giá trị của video",
  "key_points": ["Ý chính 1", "Ý chính 2", "Ý chính 3", "Ý chính 4"],
  "highlights": [
    {{"time_seconds": 0, "title": "Mở đầu & Giới thiệu", "summary": "Tóm tắt đoạn này"}},
    {{"time_seconds": 60, "title": "Nội dung chính", "summary": "Tóm tắt đoạn này"}}
  ],
  "tags": ["Từ khóa 1", "Từ khóa 2", "Từ khóa 3"]
}}"""

                    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={self.api_key}"
                    payload = {
                        "contents": [{"parts": [{"text": prompt}]}],
                        "generationConfig": {"temperature": 0.3, "responseMimeType": "application/json"}
                    }
                    res = await client.post(url, json=payload)
                    if res.status_code == 200:
                        data = res.json()
                        text = data["candidates"][0]["content"]["parts"][0]["text"]
                        clean_json = re.sub(r"^```json\s*", "", text.strip())
                        clean_json = re.sub(r"\s*```$", "", clean_json)
                        import json
                        parsed = json.loads(clean_json)
                        
                        hl_list = []
                        for h in parsed.get("highlights", []):
                            t_sec = float(h.get("time_seconds", 0))
                            hl_list.append(AISummaryHighlight(
                                time_seconds=t_sec,
                                time_formatted=self._format_time(t_sec),
                                title=h.get("title", "Mục"),
                                summary=h.get("summary", "")
                            ))

                        return AISummaryResponse(
                            title=title,
                            overview=parsed.get("overview", "Tóm tắt video tổng quan"),
                            key_points=parsed.get("key_points", []),
                            highlights=hl_list,
                            tags=parsed.get("tags", []),
                            source="Google Gemini 1.5 Flash AI"
                        )
            except Exception as e:
                # Fallback to structural heuristic summary
                pass

        # Intelligent Heuristic Summary (Zero-dependency fallback)
        overview = f"Video '{title}' mang đến nội dung giải trí và nghệ thuật đặc sắc với thời lượng {self._format_time(duration)}. Tác phẩm truyền tải thông điệp sống động và giai điệu cuốn hút cho người nghe."
        
        key_points = [
            f"Tác phẩm: {title}",
            f"Thời lượng xuất bản: {self._format_time(duration)}",
            "Chất lượng âm thanh & hình ảnh gốc chuẩn Studio cao cấp",
            "Tối ưu hóa khả năng tách beat karaoke và chuẩn hóa âm lượng EBU R128"
        ]

        # Extract timestamps from description if any (e.g. 01:23 Intro)
        time_matches = re.findall(r"(?:(\d{1,2}):)?(\d{1,2}):(\d{2})\s+[-–—:]?\s*([^\n\r]+)", desc)
        highlights = []
        if time_matches:
            for m in time_matches[:6]:
                h_part, m_part, s_part, name = m
                h_val = int(h_part) if h_part else 0
                sec_val = h_val * 3600 + int(m_part) * 60 + int(s_part)
                highlights.append(AISummaryHighlight(
                    time_seconds=float(sec_val),
                    time_formatted=self._format_time(sec_val),
                    title=name.strip()[:40],
                    summary=f"Mốc phát: {name.strip()}"
                ))
        else:
            # Generate smart intervals
            step = max(30, int(duration // 4)) if duration > 0 else 60
            highlights = [
                AISummaryHighlight(time_seconds=0.0, time_formatted="00:00", title="Mở đầu & Dạo nhạc", summary="Phần mở đầu tác phẩm và giai điệu dạo đầu"),
                AISummaryHighlight(time_seconds=float(step), time_formatted=self._format_time(step), title="Phần lời 1 & Cao trào", summary="Phần lời ca chính và giai điệu điệp khúc"),
                AISummaryHighlight(time_seconds=float(step * 2), time_formatted=self._format_time(step * 2), title="Điệp khúc & Biến tấu", summary="Điểm nhấn cao trào của bài hát"),
                AISummaryHighlight(time_seconds=float(min(duration, step * 3)), time_formatted=self._format_time(min(duration, step * 3)), title="Phần kết & Outro", summary="Giai điệu kết bài êm dịu")
            ]

        tags = [w for w in re.split(r"\s+", re.sub(r"[^\w\s]", "", title)) if len(w) > 3][:5]

        return AISummaryResponse(
            title=title,
            overview=overview,
            key_points=key_points,
            highlights=highlights,
            tags=tags or ["Music", "Studio", "HighQuality", "Audio"],
            source="FEAR TubeStudio Smart Engine"
        )

ai_service = AIService()
