---
name: "مهندس معماري أول"
description: "تصميم وتحليل البنية المعمارية وتبعيات المشروع والقرارات التقنية."
source_repo: "alirezarezvani/claude-skills"
original_skill: "engineering-team__skills__senior-architect"
drive_id: "17mZBFtYYyFDoR6ieJpJRCkwD5Y6Rlnu6"
lang: "ar"
---
# ◈ مهندس معماري أول (`senior-architect`)

> مهارة عربية من حزمة «مهارات 2» · المعرّف الأصلي: `engineering-team__skills__senior-architect`

## Responsibilities
- **Layered Architecture**: Keep strict separation across `src/types/` (domain models), `src/utils/` (pure timeline/time/render/audio/export engines), `src/components/` (presentation chrome), `src/components/panels/` (contextual editing sheets), and `src/components/modals/` (dialog workflows).
- **Dependency Hygiene**: Zero circular imports, minimal runtime bundle footprint, browser-native Web Audio + Canvas + MediaRecorder APIs without heavy native deps.
- **Architecture Diagrams**: Maintain concise Mermaid diagrams (≤ 7 nodes) showing data flow from `ProjectState` → `PreviewStage` / `Timeline` / `audioEngine` / `exportVideo`.
