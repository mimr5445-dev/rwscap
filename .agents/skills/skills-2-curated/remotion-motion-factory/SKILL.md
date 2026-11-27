---
name: "مصنع الحركة Remotion"
description: "قواعد هندسة المشاهد المتحركة والتوقيت المعتمدة على الإطارات."
source_repo: "haidrrrry/claude-remotion-skill"
original_skill: "claude-remotion-skill"
drive_id: "19QGmWRfRQjq8DJIkjTy5X1Yr1UDsLiRg"
lang: "ar"
---
# ◈ مصنع الحركة Remotion (`claude-remotion-skill`)

> مهارة عربية من حزمة «مهارات 2» · المعرّف الأصلي: `claude-remotion-skill`

## Scene & Canvas Composition Standards
- Always clamp interpolations (`clamp(value, min, max)`).
- Layer order discipline: background → media/assets → overlays/text/stickers → color grade/filters → framing/vignette.
- All timing derives from project FPS/duration rather than hardcoded magic frame counts.
- Centralize visual theme tokens instead of scattering arbitrary hex colors.
