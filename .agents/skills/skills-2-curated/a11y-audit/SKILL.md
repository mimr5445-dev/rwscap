---
name: "تدقيق الوصولية"
description: "تدقيق وإصلاح مشاكل إمكانية الوصول وفق WCAG 2.2 المستوى A و AA."
source_repo: "alirezarezvani/claude-skills"
original_skill: "engineering-team__a11y-audit__skills__a11y-audit"
drive_id: "1Jpwxv7J3iq44gyqCvUdY9QpoRplbPVtD"
lang: "ar"
---
# ◈ تدقيق الوصولية (`a11y-audit`)

> مهارة عربية من حزمة «مهارات 2» · المعرّف الأصلي: `engineering-team__a11y-audit__skills__a11y-audit`

## Three-Phase Workflow: Scan → Fix → Verify
1. **Scan**: Check WCAG 2.2 Level A & AA criteria — accessible names, keyboard navigation, focus management, dialog semantics, ARIA attributes, color contrast, motion preferences.
2. **Fix**: Apply targeted framework-specific React/TSX fixes:
   - Native `<button>` elements over `<div onClick>`.
   - `aria-label` on icon-only buttons, `aria-hidden="true"` on decorative icons.
   - `role="dialog"` / `role="alertdialog"`, `aria-modal="true"`, `aria-labelledby`, and `Escape` close on all dialogs/sheets.
   - `aria-live="polite"` on toast notifications.
   - Visible `:focus-visible` outlines (never `outline: none` without replacement).
   - Respect `@media (prefers-reduced-motion: reduce)`.
3. **Verify**: Re-scan codebase and run automated test & typecheck suite to confirm zero regressions.
