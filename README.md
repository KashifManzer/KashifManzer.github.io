# Kashif Manzer · Engineering Connections

The homepage is a scroll-driven Three.js portfolio. `/direction/` redirects older links to the homepage, preserving their fragments and query parameters.

The camera starts above a distant solar system, approaches Earth over three-and-a-half screen heights, holds with Earth/Moon/satellite in view, then descends through a cloud transition into a fictional technology city over one screen height. The route continues through SettleMint, CSULB Institutional Research, and Viasat, followed by NetLink, OmniAgent, and the social contact section. The full cinematic route spans nine screen heights. Native navigation skips directly to experience or projects. Scrolling upward reverses the camera path.

Earth rotates slowly, the illustrative satellite orbits, and distant planets move. Each city stop presents one dimensional technology mark—Go, Kubernetes, or Python—against a quiet architectural backdrop. Official artwork for all nine technologies remains available through the HTML inspection buttons. Select a sculpture or its button to rotate and zoom it; closing returns to the same point in the journey. Reduced motion shortens the page and keeps the 3D view still. Without graphics or JavaScript, every chapter and project remains available with captured local images.

The optional eight-planet explorer and satellite inspection live in a dedicated, noindex playground at `/observatory/`, without duplicate career content. The journey's **Explore the planets** link opens the explorer directly; the observatory provides a link back to the journey.

## Run locally

```bash
npm install
npm run dev
npm run build
npm run preview -- --host 127.0.0.1 --port 4323 --ignore-lock
```

Static Astro output, deployed to GitHub Pages through the verification workflow on `main`. Pages must use the GitHub Actions build source, not the legacy Jekyll source. All graphics assets and fonts are local. Personal facts come from `PRODUCT.md`; no résumé, contact address, or project links have been fabricated.

## Verification

```bash
npx playwright install firefox webkit
npm run build
npm test
node scripts/capture-keyframes.mjs http://127.0.0.1:4323
node scripts/record-journey.mjs http://127.0.0.1:4323
node scripts/audit-districts.mjs http://127.0.0.1:4323
npm run build
```

Tests use installed Chrome plus Playwright Firefox/WebKit. They cover real wheel/touch scrolling, reverse travel, the cloud transition, graphics backends/quality tiers, responsive layouts, deep links/history, reduced motion, accessibility, failed/slow assets, context loss, no JavaScript, and retained explorer interactions. Reports are in `test-results/`; disposable browser artifacts use `test-results/browser/`, so reruns preserve journey captures and recordings.

`capture-keyframes.mjs` now captures seven positions along the real scroll journey on desktop and mobile. It saves screenshots in `test-results/journey/` and updates fallback WebP files in `public/direction/`. Rebuild afterward. `record-journey.mjs` records native wheel input through the complete route to `test-results/journey/scroll-walkthrough.webm`, with progress/error evidence alongside it.

Use `?webgl` or `?tier=low|high` to test graphics modes. `?still` freezes ambient orbital motion for repeatable camera comparisons while leaving scrolling enabled. `?audit` records per-frame draw calls and triangle counts in document data attributes. These are diagnostic URL switches, not extra interface controls.

`audit-districts.mjs` captures all three districts and nine logo inspections on desktop and mobile-sized viewports, samples frame intervals, and reports browser errors/warnings to `test-results/districts/audit.json`. The inspector tests cover keyboard/pointer/touch controls, missing/malformed/slow logos, scroll/focus restoration, resize, reduced motion and graphics loss. Logos use shared cached geometry; inspection reuses the current canvas and renderer. Optional logo requests time out individually after five seconds.

Automated checks and local recordings do not establish visual quality, complete WCAG conformance, or physical-device performance. Physical phones, actual browser zoom, and assistive-technology sessions remain unverified. Vite retains its >500KB raw graphics-chunk advisory. Earlier Lighthouse scores belonged to the rejected static study and are not evidence for this rebuild.

## Code and assets

- `src/components/Journey.astro`: shared homepage/direction content and responsive layout.
- `src/scene/cinematic/journey.ts`: native scroll, camera smoothing, motion preferences, navigation, and failure recovery.
- `src/scene/cinematic/world.ts`: continuous camera paths, solar system, Earth, atmosphere, and orbital motion.
- `src/scene/cinematic/city.ts`: district architecture, lighting, sculpture mounts and instanced skyline.
- `src/scene/cinematic/logos.ts`, `technologies.ts`, `inspection.ts`: vector-to-mesh construction, verified experience copy and accessible inspection.
- `src/scene/core.ts`: shared renderer, resizing, single draw loop, and disposal.
- `src/pages/observatory.astro` and `src/scene/experience.ts`: retained inspection and planet explorer.

No new dependencies were added for the rebuilt journey. Native scrolling feeds the existing renderer; there is no second animation scheduler. The optional observatory still uses its existing GSAP/Lenis integration.

NASA sources and derivative details: `public/textures/ATTRIBUTION.txt` and `public/textures/cinematic/ATTRIBUTION.txt`. The city, Sun texture, satellite, and orbital arrangement are illustrations, not actual employer premises, live telemetry, or scientifically scaled geometry. Asset downloads can be reproduced with `node scripts/fetch-cinematic-assets.mjs`.

Logo artwork sources, archive members and SHA-256 hashes are in `public/logos/SOURCES.json`; attribution is in `public/logos/ATTRIBUTION.txt`. Re-fetch with `python3 scripts/fetch-technology-logos.py`. No new dependencies were needed for logo geometry, environment lighting, architecture or inspection. Desktop uses one local shadowed light and modest bloom; mobile reduces geometric detail and omits those effects. Studio inspection bypasses bloom to preserve readable artwork colors.

## Search and contact

The homepage is the sole sitemap entry. `Base.astro` controls canonical URLs, indexing, social previews, and homepage ProfilePage/Person structured data. All four user-confirmed social profiles are shared by the contact UI and structured data through `src/data/profile.ts`. Social links open in a new tab, identify that behavior accessibly, and use local SVG artwork. No analytics, social embeds, or ad trackers are installed.

Recreate the 1200×630 preview with `node scripts/generate-social.mjs`. Do not add claims, employment availability, email, résumé, or repository links without verified inputs. Search Console ownership verification and indexing requests require the owner's Google account; deployment alone does not submit those requests or guarantee indexing.

## Release

The workflow builds with Node 24 and `npm ci`, runs Chromium release checks, uploads only `dist`, and deploys only passing `main` builds. Pull requests run verification without publishing. Full local regression includes Chrome, Firefox, and WebKit; CI release checks focus on metadata, redirects, social links, responsive navigation, and the shortened journey. Preserve the pre-release commit and revert the release commit to roll back; do not force-push.

Do not rebuild while browser tests read `dist`. After regenerating fallback posters, rebuild before running final tests. Local test reports and recordings are evidence, not production assets.
