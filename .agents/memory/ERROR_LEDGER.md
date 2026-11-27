# ERROR_LEDGER.md — سجل الأخطاء الذكي (Smart Lessons Ledger)

> مُدار وفق مهارة `smart-error-ledger` (`lessons`) من حزمة مهارات 2 و`TERMUX_GITHUB_MASTER/06_MEMORY_SYSTEM`.
> **الصيغة**: `- **<العرض مع نص الخطأ الدقيق>** — <السبب المؤكد>. Do: <قاعدة المنع>. (<المشروع>, <التاريخ>)`
> **الحد الأقصى**: 25 مدخلاً لكل قسم؛ عند تكرار خطأ في جلستين يُرقّى إلى `AGENTS.md`.

## rwscap

- **قصّ أزرار الخط الزمني عند استخدام `overflow-hidden` على حاوية المسارات** — كان `overflow-hidden` يقتطع زر `+` العائم وحواف شريط `♪`/`T`. Do: استخدم `overflow-x-clip` على حاوية الخط الزمني بدلاً من `overflow-hidden`. (rwscap, 2026-11-27)
- **مرور `buildCssFilterString` بسلسلة `'brightness(100%) contrast(100%) saturate(100%)'` عند القيم المحايدة** — إجبار Canvas 2D على تشغيل فلتر برمجي في كل إطار بدون حاجة. Do: أرجع `'none'` فورياً عندما تكون التعديلات `0` والفلتر `original` أو شدته `<= 0`. (rwscap, 2026-11-27)
- **منع التكبير في `index.html` عبر `maximum-scale=1.0, user-scalable=no`** — مخالفة WCAG 1.4.4 لإمكانية الوصول على الهواتف. Do: اقتصر في `viewport` على `width=device-width, initial-scale=1.0, viewport-fit=cover`. (rwscap, 2026-11-27)
- **التنفيذ المباشر لإعادة تعيين المشروع بدون تأكيد** — مخالفة قاعدة `baseline-ui` للإجراءات التدميرية غير القابلة للتراجع. Do: مرّر كل إجراء تدميري عبر `AlertDialog` (`role="alertdialog"`) مع تركيز افتراضي على زر الإلغاء. (rwscap, 2026-11-27)
- **تضخم مخرجات `google_drive.list_files` مع `page_size: 100` وانقطاع الاستجابة** — بعض الاستجابات الطويلة تُقتطع في المنتصف. Do: استخدم `page_size: 45` مع `next_page_token` أو حقول محددة (`files(id,name,parents)`). (rwscap, 2026-11-27)
- **تعارض أسماء الملفات عند التنزيل المتوازي لملفات تحمل نفس الاسم `SKILL.md` عبر `download_file`** — كل تنزيل يكتب فوق `google_drive/SKILL.md`. Do: استخدم `read_file_text` للقراءة المتوازية أو نزّل واحداً تلو الآخر مع نقله مباشرة. (rwscap, 2026-11-27)
- **تحذير `esbuild css minify` (`"file" is not a known CSS property`) وتضخّم CSS بعد إضافة `.agents/`** — ماسح Tailwind v4 التلقائي فحص ملفات Markdown داخل `.agents/` وفسّر `[file:line]` كصنف CSS عشوائي. Do: قيّد نطاق Tailwind v4 في `src/index.css` عبر `@import "tailwindcss" source("../src");` و`@source "../index.html";`. (rwscap, 2026-11-27)
