---
name: "نظام تصميم الواجهة"
description: "نظام تصميم واجهة موحد وتوليد الرموز التصميمية (Design Tokens)."
source_repo: "alirezarezvani/claude-skills"
original_skill: "product-team__skills__ui-design-system"
drive_id: "1iHp_ihPB-RwR0f6gLm5sD4c78C6TsvoO"
lang: "ar"
---
# ◈ نظام تصميم الواجهة (`ui-design-system`)

> مهارة عربية من حزمة «مهارات 2» · المعرّف الأصلي: `product-team__skills__ui-design-system`

## Workflows
1. **Design Tokens**: Define semantic color, surface, typography, spacing (8pt grid), radius, motion, and z-index tokens in CSS custom properties (`src/index.css`) and document in `DESIGN.md`.
2. **Component System**: Structure Atoms (buttons, icons, sliders), Molecules (tool sheets, modals, timeline pills), and Organisms (TopBar, PreviewStage, TransportBar, Timeline, BottomToolbar).
3. **Responsive Design**: Mobile-first container (`max-w-[430px]`, `h-dvh`), safe-area insets, touch targets ≥ 44×44px where interactive.
4. **WCAG AA Validation**: Normal text ≥ 4.5:1 contrast, large text ≥ 3:1, visible focus indicators, semantic HTML elements.
