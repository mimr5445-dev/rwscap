---
name: "سجل الأخطاء الذكي"
description: "سجل أخطاء يحفظ الأخطاء المؤكدة والدروس المستفادة لمنع تكرارها."
source_repo: "hierichhsu/lessons"
original_skill: "lessons"
drive_id: "1wsTRQ-7qs9x55W2S--wKjgBGala6GpTn"
lang: "ar"
---
# ◈ سجل الأخطاء الذكي (`lessons`)

> مهارة عربية من حزمة «مهارات 2» · المعرّف الأصلي: `lessons`

## Format & Discipline
Maintain `.agents/memory/ERROR_LEDGER.md` with verified before/after entries:
```markdown
- **<symptom with exact error text in backticks>** — <confirmed cause>. Do: <concise preventive rule>. (rwscap, YYYY-MM-DD)
```
- Before work, read the project's section in `.agents/memory/ERROR_LEDGER.md`.
- If the same error repeats 3 times, stop editing and form a materially different root-cause hypothesis.
- Never write a rule that tells future sessions to skip tests or verification.
- Keep sections under 25 entries; promote recurring lessons into `AGENTS.md`.
