#!/usr/bin/env python3
"""فحص مستودع محلي وعرض أنواع المشروع المحتملة. للقراءة فقط، لا يعدّل أي ملف.

الاستخدام:
    python repository_inspector.py [مسار_المجلد]
"""
import json
import os
import sys

MARKERS = {
    "requirements.txt": "python",
    "pyproject.toml": "python",
    "setup.py": "python",
    "Pipfile": "python",
    "package.json": "nodejs",
    "Cargo.toml": "rust",
    "go.mod": "go",
    "pom.xml": "java-maven",
    "build.gradle": "gradle",
    "build.gradle.kts": "gradle",
    "CMakeLists.txt": "c-cpp",
    "Makefile": "make",
    "Dockerfile": "docker",
    "index.html": "static-web",
    "pubspec.yaml": "flutter",
    "AndroidManifest.xml": "android",
    "README.md": "docs",
    "README": "docs",
    "LICENSE": "docs",
}

SKIP_DIRS = {".git", "node_modules", "venv", ".venv", "__pycache__"}


def scan(root):
    found = {}
    extensions = {}
    files_scanned = 0

    for dirpath, dirnames, filenames in os.walk(root):
        dirnames[:] = [d for d in dirnames if d not in SKIP_DIRS]
        for name in filenames:
            files_scanned += 1
            if name in MARKERS:
                rel = os.path.relpath(os.path.join(dirpath, name), root)
                found.setdefault(MARKERS[name], []).append(rel)
            ext = os.path.splitext(name)[1].lower()
            if ext:
                extensions[ext] = extensions.get(ext, 0) + 1

    top_extensions = dict(sorted(extensions.items(), key=lambda x: -x[1])[:8])
    return {
        "root": os.path.abspath(root),
        "files_scanned": files_scanned,
        "markers": found,
        "top_extensions": top_extensions,
        "note": (
            "وجود ملف مرجعي لا يثبت طريقة التشغيل ولا التوافق مع Android. "
            "افحص التبعيات وتعليمات README قبل أي تثبيت."
        ),
    }


def main():
    target = sys.argv[1] if len(sys.argv) > 1 else "."
    if not os.path.isdir(target):
        print(json.dumps({"error": "not a directory", "path": target}, ensure_ascii=False, indent=2))
        sys.exit(1)
    print(json.dumps(scan(target), ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
