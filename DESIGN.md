---
product: RWSCap
surface: Arabic Mobile Video Editor (CapCut-style RTL Web App)
status: verified
updated: 2026-11-27
governed_by:
  - .agents/skills/ui-skills/create-design-md/SKILL.md
  - .agents/skills/ui-ux-pro-max/design-system/SKILL.md
  - .agents/skills/skills-2-curated/ui-design-system/SKILL.md
  - .agents/skills/skills-2-curated/frontend-design/SKILL.md
---

# DESIGN.md — نظام تصميم RWSCap

توثيق اللغة البصرية الفعلية المعتمدة في `rwscap` كما هي مطبّقة في `src/index.css` و`src/components/**`.

## 1. لوحة الألوان المعتمدة (Color Tokens)

| الدور التصميمي | CSS Variable | القيمة | الاستخدام الفعلي |
|---|---|---|---|
| خلفية الإطار الخارجي | `--cap-bg-shell` | `#0A0A0A` | خلفية الشاشة الخارجية على سطح المكتب (`index.html`, `App.tsx`) |
| سطح الترويسة والمعاينة وشريط النقل | `--cap-bg-top` | `#141414` | `TopBar`, `PreviewStage`, `TransportBar` |
| سطح الخط الزمني وشريط الأدوات السفلي | `--cap-bg-timeline` | `#1C1C1C` | `Timeline`, `BottomToolbar` |
| سطح ألواح الأدوات السفلية | `--cap-bg-sheet` | `#1B1C1E` | `ToolSheet` |
| سطح النوافذ المنبثقة | `--cap-bg-modal` | `#1E2023` | `ExportModal`, `CoverModal`, `SearchModal`, `ProjectModal`, `AlertDialog` |
| شرائط المسارات الفرعية | `--cap-bg-track` | `#262626` | مسار الصوت والنصوص والتراكب |
| كبسولة الدقة والإطارات | `--cap-bg-pill` | `#292A2C` | زر `▾ 540P` في `TopBar` |
| اللون الأساسي التفاعلي (CTA) | `--cap-cyan` | `#00CAE0` | زر `تصدير`، مؤشرات التفعيل، حلقات التركيز `:focus-visible` |
| نص فوق اللون السماوي | `--cap-cyan-ink` | `#0B181C` | نص زر `تصدير` لتحقيق تباين WCAG AA مرتفع |
| لون الإجراءات التدميرية | `--cap-danger` | `#FF8080` / `#D93848` | حذف مقطع، تأكيد إعادة التعيين في `AlertDialog` |
| مؤشر التشغيل (Playhead) | `--cap-playhead` | `#FEFEFE` | الخط العمودي المركزي الثابت في `Timeline` |
| النص الأساسي / الثانوي / الخافت | `--cap-text-*` | `#EAEAEA` / `#8E8E8E` / `#666666` | عناوين الأدوات، الطوابع الزمنية، التلميحات |

## 2. الطباعة والأرقام (Typography)

- **العائلة الأساسية**: `'IBM Plex Sans Arabic', 'Inter', -apple-system, BlinkMacSystemFont, sans-serif`.
- **الأرقام والوقت**: إلزامي استخدام `tabular-nums` (`font-variant-numeric: tabular-nums`) لجميع الطوابع الزمنية (`00:00 / 00:09`)، ومقياس المسطرة، ونِسب التصدير والسرعة والصوت.
- **توازن العناوين**: `text-balance` على عناوين النوافذ والألواح، و`text-pretty` على نصوص الوصف.

## 3. البنية المكانية والاتجاه (Layout & Bi-Directional Contract)

الإطار الرئيسي (`main` في `src/App.tsx`): `w-full sm:max-w-[430px] h-dvh flex flex-col overflow-hidden`.

```text
┌─────────────────────────────────────┐
│ 1. TopBar (#141414)                 │  تصدير | ▾ 540P | بحث | إغلاق
├─────────────────────────────────────┤
│ 2. PreviewStage (#141414)           │  Canvas 16:9 + طبقات نص/ملصقات قابلة للسحب
├─────────────────────────────────────┤
│ 3. TransportBar (#141414)           │  ملء الشاشة | تشغيل | ON/OFF | تراجع | إعادة
├─────────────────────────────────────┤
│ 4. Timeline (#1C1C1C)               │  مسطرة LTR + مؤشر مركزي #FEFEFE + شريط مصغّرات + +
├─────────────────────────────────────┤
│ 5. BottomToolbar (#1C1C1C)          │  تعديل · صوت · نص · تراكب · شروحات · فلاتر · ضبط · ملصقات · نسبة · خلفية
└─────────────────────────────────────┘
```

- **قاعدة RTL/LTR الحرجة**:
  - واجهة التطبيق بالكامل `dir="rtl" lang="ar"`.
  - مسطرة الخط الزمني وشريط المقاطع ومنزلقات القيم تعمل بإحداثيات `dir="ltr"` لضمان اتجاه زمني متّسق مع محررات الفيديو.
  - حاوية الخط الزمني تستخدم `overflow-x-clip` (وليس `overflow-hidden` العام) حتى لا ينقصّ زر الإضافة `+` أو أزرار `♪`/`T`.

## 4. طبقات العمق (Fixed Z-Index Scale)

| المتغير | القيمة | العناصر |
|---|---|---|
| `--z-base` | `0` | السطح الأساسي والمعاينة |
| `--z-sticky` | `20` | عناصر الخط الزمني المثبتة |
| `--z-playhead` | `30` | خط مؤشر التشغيل المركزي |
| `--z-sheet` | `40` | ألواح الأدوات السفلية (`ToolSheet`) |
| `--z-modal` | `50` | النوافذ المنبثقة (`ExportModal`, `CoverModal`, `SearchModal`, `ProjectModal`, `AlertDialog`) |
| `--z-toast` | `60` | إشعار الحالة العائم (`role="status"`) |

## 5. الحركة وإمكانية الوصول (Motion & Accessibility)

- احترام `@media (prefers-reduced-motion: reduce)` تلقائياً في `src/index.css`.
- جميع منحنيات الحركة للطبقات والمقاطع والانتقالات (`src/utils/easing.ts`) تستخدم تخفيفاً مقيداً `[0..1]` (`easeOutCubic`, `easeInOutCubic`, `easeOutBack`) مع خروج أسرع من الدخول وفق قواعد `remotion-motion-graphics`.
- إيقاف حلقة `requestAnimationFrame` تلقائياً عند إخفاء التبويب (`document.hidden`).
- تركيز لوحة المفاتيح مرئي عبر `:focus-visible` باللون `#00CAE0`.
- جميع الأيقونات الزخرفية في `CapCutIcons.tsx` تحمل `aria-hidden="true" focusable="false"`.
- جميع الإجراءات التدميرية غير القابلة للتراجع تمرّ عبر `AlertDialog` (`role="alertdialog"`).

## 6. امتدادات المستوى الاحترافي (بدون كسر بساطة الواجهة الافتراضية)

- **شارات الانتقال (`⇄`)**: تظهر فقط عند نقاط التقاء مقطعين متجاورين في `Timeline` (أبيض افتراضياً، وسماوي `#00CAE0` عند تفعيل انتقال) — الشاشة الأولية بمقطع واحد تبقى مطابقة للقطة CapCut.
- **خطوط المحاذاة المغناطيسية (`50%`)**: خطوط سماوية دقيقة (`1px`) تظهر في `PreviewStage` حصراً أثناء سحب النص أو الملصق قرب المنتصف الأفقي/العمودي (`±2%`).
- **أدوات المقطع السياقية**: عند تحديد أي مقطع تظهر أدوات `تقسيم · تحويل · تحريك · السرعة · الصوت · تجميد · تقديم/تأخير · ضبط · تكرار · حذف` في `BottomToolbar`.
- **الحفظ التلقائي وملفات `.rwscap.json` والاختصارات**: مدمجة بنظافة داخل `ProjectModal` دون إضافة أزرار مشتتة على الترويسة الرئيسية.
