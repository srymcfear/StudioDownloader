import os
from pathlib import Path
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    APP_NAME: str = "YouTube Studio Downloader API"
    VERSION: str = "1.0.0"
    DEBUG: bool = True
    
    # Base directories
    BASE_DIR: Path = Path(__file__).resolve().parent.parent
    DOWNLOAD_DIR: Path = BASE_DIR / "downloads"
    TEMP_DIR: Path = BASE_DIR / "temp"
    COOKIES_DIR: Path = BASE_DIR / "cookies"
    
    # Expiration for temporary downloaded files (in seconds)
    FILE_EXPIRY_SECONDS: int = 3600 * 2  # 2 hours
    
    # Optional default proxy (e.g., socks5://127.0.0.1:9050 or http://user:pass@host:port)
    DEFAULT_PROXY: str | None = None
    
    # Rate limit and constraints
    MAX_CONCURRENT_DOWNLOADS: int = 5
    
    # CORS — VULN-06 fix: explicit origins only, no wildcard '*'
    CORS_ORIGINS: list[str] = [
        "http://localhost:3000",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:8000",
        "http://127.0.0.1:8000",
    ]

settings = Settings()

# Ensure directories exist
settings.DOWNLOAD_DIR.mkdir(parents=True, exist_ok=True)
settings.TEMP_DIR.mkdir(parents=True, exist_ok=True)
settings.COOKIES_DIR.mkdir(parents=True, exist_ok=True)
