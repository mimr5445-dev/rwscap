---
name: "مراجع الكود"
description: "مراجع كود متخصص لتحليل طلبات السحب وجودة الكود والأمان."
source_repo: "alirezarezvani/claude-skills"
original_skill: "engineering-team__skills__code-reviewer"
drive_id: "1IE26WSeDOTS5PllUk1TLZCWWVQnYc0lh"
lang: "ar"
---
# ◈ مراجع الكود (`code-reviewer`)

> مهارة عربية من حزمة «مهارات 2» · المعرّف الأصلي: `engineering-team__skills__code-reviewer`

## Review Thresholds & Checks
- **Security**: No hardcoded secrets, unsafe innerHTML/eval, or unsanitized user media URLs; revoke `URL.createObjectURL` blobs on teardown.
- **TypeScript/React Quality**: Strict `tsc --noEmit` cleanliness, no stale closures in `requestAnimationFrame` loops, clean effect teardown, memoized heavy renders.
- **Structural Thresholds**: Flag long functions (>50 lines), god components (>500 lines), deep nesting (>4 levels), and mixed concerns.
- **Verdicts**: Approve (90+, 0 high issues) · Approve with suggestions (75+, ≤2 high) · Request changes (50–74) · Block (<50 or critical).
