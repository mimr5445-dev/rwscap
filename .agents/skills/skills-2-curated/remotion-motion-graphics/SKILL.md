---
name: "جرافيك الحركة Remotion"
description: "مبادئ الرسوم المتحركة البرمجية وإطارات الفيديو الموثقة."
source_repo: "fernandokaraka/remotion-motion-graphics-skill"
original_skill: "remotion-motion-graphics"
drive_id: "1l2dVooVI7zqS0G4MdA_TI4JcCn4rhm-w"
lang: "ar"
---
# ◈ جرافيك الحركة Remotion (`remotion-motion-graphics`)

> مهارة عربية من حزمة «مهارات 2» · المعرّف الأصلي: `remotion-motion-graphics`

## Motion & Video Craft Principles (Applied to RWSCap Preview & Export)
- **Diagnose before decorating**: Verify computed frame values at `t = 0`, midpoint, and `duration` (with clamped interpolation!) before adding polish.
- **Complete lifecycle**: Clamped enter → hold → exit; never allow runaway extrapolation.
- **Readability**: Title-safe 5–10% margins, crisp contrast/shadows behind overlay text over footage, canvas-relative sizing so aspect ratio switches (`9:16`, `16:9`, `1:1`, `4:5`) never clip overlays.
- **Audio sync**: Audio cues and synthesized tracks stay tightly synchronized with timeline playhead and clip mute/volume states.
