# CLAUDE.md

## What this is

Mintaka is a calming web app built around a stylized 3D "crystal ocean" scene (React Three Fiber / Three.js). It bundles two small relaxation tools layered over the scene: a slow-typing space and a 5-3-8 breath guide, plus a procedural ocean ambience audio track. UI copy is in Traditional Chinese.

## Tech stack

- React 19 + TypeScript, built with Vite 8
- 3D: `three`, `@react-three/fiber`, `@react-three/drei`
- State: `zustand` (`src/store/useUIStore.ts`)
- Linting: `oxlint`

## Commands

- Install: `npm install`
- Dev server: `npm run dev` (Vite, default port 5173)
- Build: `npm run build` (runs `tsc -b` then `vite build`)
- Preview production build: `npm run preview`
- Lint: `npm run lint` (oxlint)

There is no test script/framework configured in this repo.

## Structure

- `src/App.tsx` — top-level layout: ocean canvas, overlay UI, tool dock, audio-start hint
- `src/scene/` — `OceanScene.tsx` (R3F Canvas setup) and `Ocean.tsx` (mesh/geometry), `oceanShaders.ts` (GLSL for the water surface)
- `src/tools/` — `TypingSpace.tsx` (slow typing exercise, uses `typingWords.ts`) and `BreathGuide.tsx` (5-3-8 breathing pacer)
- `src/audio/` — `oceanAmbience.ts` (Web Audio procedural ambience generator) and `useOceanAmbience.ts` (hook wiring it to UI state)
- `src/store/useUIStore.ts` — single zustand store: active tool (`none | typing | breath`), audio started/muted state

## Notable/non-obvious points

- `vite.config.ts` sets `base: '/mintaka/'` — the app is deployed under a `/mintaka/` subpath, not the domain root. Keep this in mind when testing built output or asset paths.
- Audio only starts on explicit user interaction (`startAudio` in the store, triggered by the "進入海洋" button) — this is a deliberate workaround for browser autoplay restrictions, not a bug.
- `README.md` is still the unmodified Vite React+TS template README and does not describe the actual project; don't treat it as a source of truth.
- Ocean water visuals are driven by custom shaders in `src/scene/oceanShaders.ts` rather than a drei/three helper — changes to water appearance likely need GLSL edits there.
