# Ticket T1: Setup Base Environment

## Goal
Initialize the Next.js 15 application, configure Tailwind CSS, and set up the static export required for GitHub Pages deployment (`KashifManzer.github.io`). Establish the basic layout structure that will house the WebGL canvas and UI overlays.

## Acceptance Criteria
- [ ] A new Next.js 15 (App Router) project is initialized in the root directory.
- [ ] Tailwind CSS is configured with a deep slate and neon cyan/emerald color palette.
- [ ] `next.config.js` is configured with `output: 'export'` and image optimization disabled (required for GH pages). No `basePath` is needed since it's a `.github.io` user site.
- [ ] Basic directory structure is established (`components/canvas`, `components/sections`, `components/layout`).
- [ ] The default Next.js boilerplate is stripped out.
- [ ] The app builds successfully using `npm run build` into an `out/` directory.

## Verify
1. Run `npm run build`. Confirm the `out/` folder is generated without errors.
2. Run `npx serve@latest out`. Open the browser and confirm a clean, blank dark screen loads without console errors.

## Contract
This ticket establishes the root `layout.tsx` and `page.tsx` that [T2] and [T3] will depend on. It provides the Tailwind theme that all UI components will use.
