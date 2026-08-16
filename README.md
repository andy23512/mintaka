# Mintaka

A calming web app built around a stylized 3D "crystal ocean" scene, with two small relaxation tools layered on top: a slow-typing space and a 5-3-8 breath guide, plus a procedural + recorded ocean ambience track.

**[Live demo →](https://andy23512.github.io/mintaka/)**

## Features

- Custom-shader ocean with Gerstner waves, Fresnel reflectance, and depth-based transparency down to a sandy seafloor
- Interactive water ripples that follow the cursor, with a matching soft splash sound
- Ambient sea-wave + seagull audio (CC0), with a mute toggle and volume control
- **Slow Typing Space** — a distraction-free typing exercise
- **5-3-8 Breath Guide** — a paced breathing exercise (5s inhale · 3s hold · 8s exhale)

## Tech stack

- React 19 + TypeScript, built with Vite
- 3D: [three.js](https://threejs.org/), [`@react-three/fiber`](https://github.com/pmndrs/react-three-fiber), [`@react-three/drei`](https://github.com/pmndrs/drei)
- State: [zustand](https://github.com/pmndrs/zustand)
- Linting: [oxlint](https://oxc.rs/)

## Development

```bash
npm install
npm run dev
```

Other scripts:

```bash
npm run build    # type-check and build for production
npm run preview  # preview the production build locally
npm run lint      # run oxlint
```

The app is deployed to GitHub Pages under the `/mintaka/` subpath on every push to `main` (see `.github/workflows/`).
