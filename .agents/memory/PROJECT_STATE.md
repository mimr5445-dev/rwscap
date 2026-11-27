# PROJECT_STATE.md — ذاكرة المشروع المعتمدة (Tier L2)

> مُدار وفق مهارتي `agent-memory` و`memory-engineering`.
> **سياسة النسيان (Forgetting Policy F1)**: احذف أو حدّث أي بند بمجرد تغيّر المعمارية أو زوال قيده. لا تُضِف سجلات محادثة خام هنا (تُحفظ الحقائق الموثّقة فقط).

## حقائق المشروع المؤكدة (Verified Facts)

- **المنتج**: `RWSCap` — محرر فيديو عربي احترافي متجاوب للهواتف بواجهة CapCut المظلمة (React 19 + TypeScript 5.7 + Vite 6 + Tailwind CSS v4).
- **الفرع النشط**: `arena/316aab97-rwscap` · طلب السحب المفتوح: **PR #2** (`https://github.com/mimr5445-dev/rwscap/pull/2`) بعد دمج PR #1 في `main`.
- **خادم التطوير**: `npm run dev` يعمل على `0.0.0.0:5173` مع `server.allowedHosts: true` في `vite.config.ts` لدعم المعاينة المباشرة.
- **معمارية الكود الاحترافية**:
  - `src/types/editor.ts`: نماذج البيانات الاحترافية (انتقالات المقاطع، التحويل المكاني، تحريك المقاطع وKen Burns، تحريك النصوص/الملصقات، تجميد الإطار، وتلاشي الصوت).
  - `src/utils/easing.ts`: منحنيات تخفيف مقيدة (`easeOutCubic`, `easeInOutCubic`, `easeOutBack`)، محرك حركة الطبقات (`typewriter`, `pop`, `slide-up`, `fade`)، حركة المقاطع (`ken-burns` وغيرها)، كشف نافذة الانتقالات، والمحاذاة المغناطيسية 50%.
  - `src/utils/timelineOps.ts`: دوال نقية ومختبرة لعمليات المقاطع (split, trim, duplicate, delete, speed, reorder, transform, transition, animation, freeze-frame).
  - `src/utils/projectStorage.ts`: حفظ تلقائي فوري في `localStorage` + تصدير/استيراد ملفات `.rwscap.json` مع تحقق أمني صارم ضد القيم الفاسدة وتنقية روابط `blob:` المؤقتة.
  - `src/utils/demoRenderer.ts`: محرك الرسم والتركيب الموحد (Canvas 2D) مع مزج 6 انتقالات سينمائية، تحويلات مكانية، حركات مقاطع وطبقات، وفلاتر.
  - `src/utils/audioSynth.ts`: محرك Web Audio مع تلاشي دخول/خروج (`fadeIn`/`fadeOut`)، مقياس ذروة صوتي حي، وبث `MediaStreamDestination` لدمج الصوت في التصدير.
  - `src/utils/exportVideo.ts`: مصدّر فيديو + صوت حقيقي عبر `Canvas.captureStream` + `Web Audio MediaStream` + `MediaRecorder` (.webm) مع تحرير تلقائي للذاكرة.
  - `src/components/panels/`: `TransitionPanel`, `TransformPanel`, `AnimationPanel`, `TextPanel` (مع تعديل فوري وتحريك), `StickersPanel` (مع تحريك), `AudioPanel` (مع تلاشي صوتي), بالإضافة إلى ألواح CapCut الأصلية.
- **نظام المهارات المدمج**: 119 مهارة (`SKILL.md`) عبر 7 حزم + 12 قاعدة هندسية تحت `.agents/` مفهرسة في `.agents/skills/registry.json` ومخططها في `SKILLS_MASTER_PLAN.md`.
- **الاختبارات والتحقق**: Vitest مُعدّ (`npm test`) بـ **31 اختباراً** للوحدات النقية + `npm run typecheck` + `npm run build`.

## حدود البيئة المعروفة (Environment Facts)

- Node v22 + npm 10 + Python 3.11 + ImageMagick متوفرة في الـ sandbox.
- متصفح Chromium / Playwright غير مثبت محلياً في الـ sandbox؛ التحقق الآلي يعتمد على Vitest + `tsc --noEmit` + `vite build` + فحص HTTP للخادم.
