# AGENTS.md — RWSCap AI Engineering & Skills Router

هذا الملف هو نقطة الدخول الموحّدة لأي وكيل برمجي (Claude Code / Codex / Cursor / Arena / Gemini / Antigravity) يعمل على مستودع **`rwscap`**.

## 1. قبل البدء في أي مهمة (Mandatory Pre-Flight)

1. اقرأ الذاكرة المعتمدة للمشروع:
   - `.agents/memory/PROJECT_STATE.md` (الحالة المعمارية الموثّقة L2)
   - `.agents/memory/ERROR_LEDGER.md` (سجل الأخطاء المؤكدة لمنع تكرارها)
   - `DESIGN.md` (قبل أي تعديل على الواجهة أو الألوان أو الخط الزمني)
2. افتح المخطط الكامل `.agents/skills/registry.json` و`SKILLS_MASTER_PLAN.md` وحدّد **مهارة واحدة أو حزمة محددة فقط** تناسب نوع المهمة — لا تحمّل كل المهارات دفعة واحدة.
3. التزم بالقواعد الهندسية في `.agents/rules/`.

## 2. جدول التوجيه الذكي حسب المهمة (Task → Skill Routing)

| نوع المهمة | المهارات المطلوب تفعيلها أولاً | المسار داخل المستودع |
|---|---|---|
| ميزة جديدة / تخطيط / عصف ذهني | `brainstorming` → `writing-plans` → `project-engineering` | `.agents/skills/superpowers/brainstorming/SKILL.md` |
| تصميم واجهة / ألوان / رموز تصميمية | `ui-ux-pro-max` + `design-system` + `frontend-design` + `baseline-ui` | `.agents/skills/ui-ux-pro-max/ui-ux-pro-max/SKILL.md` |
| توثيق أو تحديث نظام التصميم | `create-design-md` + `ui-design-system` | `.agents/skills/ui-skills/create-design-md/SKILL.md` |
| تدقيق وإصلاح الوصولية (WCAG 2.2) | `fixing-accessibility` + `a11y-audit` | `.agents/skills/ui-skills/fixing-accessibility/SKILL.md` |
| تحسين SEO والبيانات الوصفية (`index.html`) | `fixing-metadata` | `.agents/skills/ui-skills/fixing-metadata/SKILL.md` |
| أداء الحركة / Canvas / الرسوم المتحركة | `fixing-motion-performance` + `remotion-motion-graphics` | `.agents/skills/ui-skills/fixing-motion-performance/SKILL.md` |
| كتابة كود جديد أو تعديل منطق (TDD) | `test-driven-development` + `write-tests` + `senior-qa` | `.agents/skills/superpowers/test-driven-development/SKILL.md` |
| تشخيص خطأ أو سلوك غير متوقع | `systematic-debugging` + `root-cause-tracing` + `smart-error-ledger` | `.agents/skills/superpowers/systematic-debugging/SKILL.md` |
| مراجعة البنية المعمارية والأمان والكود | `senior-architect` + `senior-security` + `code-reviewer` + `review-local-changes` | `.agents/skills/skills-2-curated/code-reviewer/SKILL.md` |
| تحديث التوثيق و`README.md` | `readme-polish` + `update-docs` + `write-concisely` | `.agents/skills/skills-2-curated/readme-polish/SKILL.md` |
| الالتزام (Commit) / PR / Git / Termux | `commit-craft` + `commit` + `create-pr` + `termux-github-master` | `.agents/skills/skills-2-curated/commit-craft/SKILL.md` |
| فحص وتحليل مستودعات خارجية | `repository-forensic-reader` | `.agents/skills/repository-forensic-reader/SKILL.md` |
| **قبل إعلان إتمام أي مهمة (إلزامي دائماً)** | `verification-before-completion` | `.agents/skills/superpowers/verification-before-completion/SKILL.md` |

## 3. بوابات التحقق الإلزامية (Hard Verification Gates)

لا يجوز إعلان نجاح أي مهمة قبل تشغيل الأوامر التالية فعلياً والحصول على كود خروج `0`:

```bash
npm test
npm run typecheck
npm run build
```

## 4. ثوابت المشروع المعمارية (Non-Negotiable Invariants)

- **واجهة CapCut العربية RTL**: الحفاظ على لوحة الألوان الداكنة (`#141414`, `#1C1C1C`, `#262626`, `#00CAE0`) ونسق الهاتف (`max-w-[430px] h-dvh`) والخط الزمني التفاعلي.
- **عزل المنطق النقي**: جميع عمليات الخط الزمني (تقسيم، قص، تكرار، حذف، سرعة) تعيش في `src/utils/timelineOps.ts` ومغطاة باختبارات Vitest.
- **الوصولية**: جميع النوافذ (`ToolSheet`, Modals, `AlertDialog`) تحمل `role="dialog"` أو `role="alertdialog"` وتُغلق بمفتاح `Escape`، وجميع الإجراءات التدميرية تمر عبر `AlertDialog`.
- **الأداء**: إيقاف حلقة التشغيل تلقائياً عند `document.hidden`، وإرجاع `'none'` من `buildCssFilterString` عند القيم المحايدة.
- **أمان الأسرار**: ممنوع تماماً حفظ مفاتيح API أو رموز دخول أو ملفات `.env` داخل المستودع أو سجل الذاكرة.
