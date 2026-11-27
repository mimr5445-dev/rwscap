---
name: "اختبار تطبيقات الويب"
description: "اختبار تطبيقات الويب المحلية والتحقق التفاعلي من DOM."
source_repo: "anthropics/skills"
original_skill: "webapp-testing"
drive_id: "19xhPH2HjGnFVxRMT0cOr0Uubygqv4iMP"
lang: "ar"
---
# ◈ اختبار تطبيقات الويب (`webapp-testing`)

> مهارة عربية من حزمة «مهارات 2» · المعرّف الأصلي: `webapp-testing`

## Reconnaissance-Then-Action Pattern
1. Verify dev server readiness (`0.0.0.0:5173`, HTTP 200).
2. Prefer automated Vitest unit/component suites + Playwright E2E scripts (when Chromium is available) waiting for `networkidle`.
3. Use accessible semantic selectors (`getByRole`, `getByLabel`, Arabic text labels) over brittle CSS class queries.
