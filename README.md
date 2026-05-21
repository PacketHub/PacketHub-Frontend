# PacketHub

A modern Vite + React + TypeScript frontend for community-driven IT discussions, built to deploy easily on Vercel.

## 📌 Overview

PacketHub is a beginner-friendly forum UI for sharing posts, browsing topics, and connecting with other tech enthusiasts. The app includes:

- React Router powered client-side navigation
- Supabase authentication integration
- Search, category filters, and post management UI
- Admin dashboard support and profile pages
- Vite-based fast development and production builds

## 🚀 Getting Started

```bash
npm install
npm run dev
```

Then open the local URL shown in the terminal.

## 🧪 Scripts

- `npm run dev` — start the development server
- `npm run build` — create a production build
- `npm run preview` — preview the built app locally
- `npm run lint` — run ESLint across the codebase
- `npm test` — run Vitest tests

## 📦 Vercel Deployment

This repository is configured for Vercel with `vercel.json` and uses `npm run build` for production builds.

## 📁 Project Structure

- `src/` — application source code
- `public/` — static public assets
- `vite.config.ts` — Vite build configuration
- `vercel.json` — Vercel deployment settings

## 💡 Notes

- `.gitignore` already excludes macOS `.DS_Store` files
- `dist/` is the production output folder for Vercel

---

Built for a clean deployment experience and a polished community forum frontend.
