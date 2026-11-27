---
name: "الأمان الأول"
description: "نمذجة التهديدات STRIDE/DREAD وفحص الأسرار وأمان التطبيق."
source_repo: "alirezarezvani/claude-skills"
original_skill: "engineering-team__skills__senior-security"
drive_id: "14wakBeIfEUOQCMppptlkBX2uLMzL8JVP"
lang: "ar"
---
# ◈ الأمان الأول (`senior-security`)

> مهارة عربية من حزمة «مهارات 2» · المعرّف الأصلي: `engineering-team__skills__senior-security`

## Threat Modeling (STRIDE) & Secret Hygiene for RWSCap
- **Secrets Sweep**: Zero API keys, tokens, or credentials committed in source or `.agents/` logs.
- **Client-Side Media Safety**: Validate uploaded file MIME types (`video/*`, `image/*`, `audio/*`), sanitize `localStorage` project hydration with fallback defaults (`JSON.parse` inside `try/catch`), and prevent XSS by never injecting raw HTML strings.
- **Verification Gate**: Scan staged diffs before every commit (`secret_gate` discipline).
