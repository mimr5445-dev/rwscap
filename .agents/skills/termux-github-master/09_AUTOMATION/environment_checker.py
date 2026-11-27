#!/usr/bin/env python3
"""فحص بيئة Termux والأدوات المتوفرة. للقراءة فقط.

الاستخدام:
    python environment_checker.py
"""
import json
import os
import platform
import shutil
import subprocess
import sys


def run(cmd):
    """يشغل أمراً ويعيد أول سطر من مخرجه، أو حالة الخطأ."""
    try:
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=10)
    except FileNotFoundError:
        return "NOT INSTALLED"
    except Exception as exc:  # نُبقي الفحص مستمراً مهما حدث
        return f"error: {exc}"
    output = (result.stdout or result.stderr).strip()
    return output.splitlines()[0] if output else "no output"


def main():
    prefix = os.environ.get("PREFIX", "")
    home = os.path.expanduser("~")
    info = {
        "python": sys.version.split()[0],
        "system": platform.system(),
        "machine": platform.machine(),
        "release": platform.release(),
        "is_termux": "com.termux" in prefix,
        "prefix": prefix or "not set",
        "git": run(["git", "--version"]),
        "node": run(["node", "--version"]),
        "npm": run(["npm", "--version"]),
        "pip": run([sys.executable, "-m", "pip", "--version"]),
        "home_free_gb": round(shutil.disk_usage(home).free / 1e9, 2),
        "storage_linked": os.path.isdir(os.path.join(home, "storage")),
    }
    print(json.dumps(info, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
