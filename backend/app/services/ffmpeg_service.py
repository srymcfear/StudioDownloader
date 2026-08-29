import os
import shutil
import subprocess
from pathlib import Path
import imageio_ffmpeg

_ffmpeg_path: str | None = None

def get_ffmpeg_executable() -> str:
    """
    Returns the path to the ffmpeg executable.
    Checks imageio_ffmpeg first, then system PATH.
    """
    global _ffmpeg_path
    if _ffmpeg_path and Path(_ffmpeg_path).exists():
        return _ffmpeg_path

    # Try imageio-ffmpeg
    try:
        exe = imageio_ffmpeg.get_ffmpeg_exe()
        if exe and Path(exe).exists():
            _ffmpeg_path = exe
            return exe
    except Exception:
        pass

    # Try system PATH
    sys_ffmpeg = shutil.which("ffmpeg")
    if sys_ffmpeg:
        _ffmpeg_path = sys_ffmpeg
        return sys_ffmpeg

    raise RuntimeError("FFmpeg executable not found. Please ensure imageio-ffmpeg or ffmpeg is installed.")

def get_ffmpeg_version() -> str:
    try:
        exe = get_ffmpeg_executable()
        result = subprocess.run([exe, "-version"], stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True, check=True)
        first_line = result.stdout.split("\n")[0]
        return first_line
    except Exception as e:
        return f"Unknown / Error ({e})"
