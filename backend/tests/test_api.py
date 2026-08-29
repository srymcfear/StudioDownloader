import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app
from app.services.ytdlp_service import format_bytes, format_duration

@pytest.mark.asyncio
async def test_health_endpoint():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.get("/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "online"
        assert "ffmpeg" in data
        assert "ytdlp" in data

@pytest.mark.asyncio
async def test_info_invalid_url():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.post("/api/info", json={"url": "https://google.com"})
        assert response.status_code == 400
        assert "Only YouTube URLs are supported" in response.json()["detail"]

def test_format_helpers():
    assert format_bytes(1024) == "1.0 KB"
    assert format_bytes(1048576) == "1.0 MB"
    assert format_bytes(1073741824) == "1.0 GB"
    assert format_duration(65) == "01:05"
    assert format_duration(3665) == "01:01:05"
