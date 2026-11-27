---
name: "ذاكرة الوكيل"
description: "نظام ذاكرة متعدد الطبقات للوكيل بين الجلسات (L0–L3)."
source_repo: "alirezarezvani/claude-skills"
original_skill: "engineering__agent-memory__skills__agent-memory"
drive_id: "1ilxia67EVXKcBqJNXlEvl5YXhpmDOvCH"
lang: "ar"
---
# ◈ ذاكرة الوكيل (`agent-memory`)

> مهارة عربية من حزمة «مهارات 2» · المعرّف الأصلي: `engineering__agent-memory__skills__agent-memory`

## Promotion Ladder
- **L0**: Raw session logs (never committed).
- **L1**: Candidate observations/lessons discovered mid-session.
- **L2**: Verified project facts committed under `.agents/memory/PROJECT_STATE.md`.
- **L3**: Stable engineering principles promoted into `AGENTS.md`.
- **Hard Rules**: Never store secrets/tokens/personal paths; never silently overwrite conflicting facts; surface contradictions explicitly.
