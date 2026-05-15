# Ultimate Game Showdown

Neon arcade-style game rating/tier-list app built with React, TypeScript, and Vite.

## Local development

```bash
npm install
npm run dev
```

Open the local URL Vite prints in the terminal.

## Build test

```bash
npm run build
npm run preview
```

## GitHub Pages deployment

This project is configured for the repo name:

```txt
TierListGame
```

Important deployment settings already included:

- `vite.config.ts` uses `base: '/TierListGame/'`
- `.github/workflows/deploy.yml` builds the app and uploads `dist/`
- data and public asset paths use the GitHub Pages base path

In GitHub, set:

```txt
Settings → Pages → Build and deployment → Source → GitHub Actions
```

Expected Pages URL:

```txt
https://<your-github-username>.github.io/TierListGame/
```

If you rename the repo, update `base` in `vite.config.ts` and the hardcoded `/TierListGame/assets/...` CSS paths in `src/styles.css`.

## Notes

- Game data lives in `public/data/data.json`.
- Covers, UI images, fonts, and audio live under `public/assets/`.
- User progress is saved in browser `localStorage`.
