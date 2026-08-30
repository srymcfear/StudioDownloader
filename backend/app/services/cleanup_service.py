import time
import asyncio
from pathlib import Path
from app.config import settings

async def start_periodic_cleanup():
    """Periodically deletes downloaded files older than settings.FILE_EXPIRY_SECONDS."""
    while True:
        try:
            now = time.time()
            for directory in [settings.DOWNLOAD_DIR, settings.TEMP_DIR]:
                if not directory.exists():
                    continue
                for item in directory.iterdir():
                    try:
                        # Check file age
                        mtime = item.stat().st_mtime
                        if now - mtime > settings.FILE_EXPIRY_SECONDS:
                            if item.is_file():
                                item.unlink(missing_ok=True)
                            elif item.is_dir():
                                import shutil
                                shutil.rmtree(item, ignore_errors=True)
                    except Exception:
                        pass
        except Exception:
            pass
        from app.services.task_manager import task_manager
        task_manager.cleanup_expired_tasks()
        await asyncio.sleep(600)  # Check every 10 minutes
