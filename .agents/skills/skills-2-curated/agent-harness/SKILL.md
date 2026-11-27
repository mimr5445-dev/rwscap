---
name: "جهاز الوكيل"
description: "إطار إدارة حلقة تنفيذ الوكيل والتحقق المستقل لكل مهمة."
source_repo: "alirezarezvani/claude-skills"
original_skill: "engineering__agent-harness__skills__agent-harness"
drive_id: "1UoqMEr46mnvfr1S2eufjTP6UKfq9QUtC"
lang: "ar"
---
# ◈ جهاز الوكيل (`agent-harness`)

> مهارة عربية من حزمة «مهارات 2» · المعرّف الأصلي: `engineering__agent-harness__skills__agent-harness`

## Execution Loop Contract
`GOAL → PLAN → [EXECUTE → VERIFY]* → CLOSE`
- Never declare a task verified without fresh subprocess command evidence (`npm test`, `npm run typecheck`, `npm run build`).
- Never relax or weaken a verification gate just to make it pass.
- One write stream at a time; retry only with a materially changed approach.
