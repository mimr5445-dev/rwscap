# PROJECT_STATE.md — ذاكرة المشروع المعتمدة (Tier L2)

> مُدار وفق مهارتي `agent-memory` و`memory-engineering`.
> **سياسة النسيان (Forgetting Policy F1)**: احذف أو حدّث أي بند بمجرد تغيّر المعمارية أو زوال قيده. لا تُضِف سجلات محادثة خام هنا (تُحفظ الحقائق الموثّقة فقط).

## حقائق المشروع المؤكدة (Verified Facts)

- **المنتج**: `RWSCap` — محرر فيديو عربي متجاوب للهواتف بواجهة CapCut المظلمة (React 19 + TypeScript 5.7 + Vite 6 + Tailwind CSS v4).
- **الفرع النشط**: `arena/316aab97-rwscap` · طلب السحب المفتوح: PR #1 (`https://github.com/mimr5445-dev/rwscap/pull/1`).
- **خادم التطوير**: `npm run dev` يعمل على `0.0.0.0:5173` مع `server.allowedHosts: true` في `vite.config.ts` لدعم المعاينة المباشرة.
- **معمارية الكود**:
  - `src/types/editor.ts`: نماذج البيانات والإعدادات الافتراضية.
  - `src/utils/timelineOps.ts`: دوال نقية ومختبرة لعمليات المقاطع (split, trim, duplicate, delete, speed).
  - `src/utils/demoRenderer.ts`: محرك الرسم الإجرائي (Canvas 2D)، الفلاتر، والتركيب متعدد الطبقات.
  - `src/utils/audioSynth.ts`: مولّد الموجات الصوتية ومحرك Web Audio المتزامن مع التشغيل.
  - `src/utils/exportVideo.ts`: مصدّر فيديو حقيقي عبر `Canvas.captureStream` + `MediaRecorder` (.webm) مع بديل PNG.
  - `src/utils/cn.ts`: أداة دمج الأصناف (`clsx` + `tailwind-merge`).
- **نظام المهارات المدمج**: 119 مهارة (`SKILL.md`) عبر 7 حزم + 12 قاعدة هندسية تحت `.agents/` مفهرسة في `.agents/skills/registry.json` ومخططها في `SKILLS_MASTER_PLAN.md`.
- **الاختبارات والتحقق**: Vitest مُعدّ (`npm test`) بـ 16 اختباراً للوحدات النقية + `npm run typecheck` + `npm run build`.

## حدود البيئة المعروفة (Environment Facts)

- Node v22 + npm 10 + Python 3.11 + ImageMagick متوفرة في الـ sandbox.
- متصفح Chromium / Playwright غير مثبت محلياً في الـ sandbox؛ التحقق الآلي يعتمد على Vitest + `tsc --noEmit` + `vite build` + فحص HTTP للخادم.
