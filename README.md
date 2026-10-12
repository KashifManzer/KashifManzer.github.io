# Kashif Manzer · Engineering Connections

The homepage is a scroll-driven Three.js portfolio. `/direction/` redirects older links to the homepage, preserving their fragments and query parameters.

The camera starts above a distant solar system, approaches Earth over three-and-a-half screen heights, holds with Earth/Moon/satellite in view, then descends through a cloud transition into a fictional technology city over one screen height. The route continues through SettleMint, CSULB Institutional Research, and Viasat, followed by a two-screen asteroid impact sequence and the settled social contact clearing. The original nine-screen route and camera milestones through 18 are preserved; impacts extend the timeline to 22. Navigation offers Experience and Contact; legacy `#work` resolves to experience, including without JavaScript. Contact navigation immediately opens the settled scene. Scrolling upward reverses the camera path.

Earth rotates slowly, the illustrative satellite orbits, and distant planets move. Each city stop presents one dimensional technology mark—Go, Kubernetes, or Python—against a quiet architectural backdrop. Official artwork for all nine technologies remains available through the HTML inspection buttons. Select a sculpture or its button to rotate and zoom it; closing returns to the same point in the journey. Reduced motion shortens the page and shows static chapter captures, including the settled clearing. Without graphics or JavaScript, every chapter and all four social destinations remain available with captured local images.

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

`capture-keyframes.mjs` now captures nine positions along the real scroll journey on desktop and mobile. It saves screenshots in `test-results/journey/` and updates fallback WebP files in `public/direction/`. Rebuild afterward. `record-journey.mjs` records native wheel input through the complete route to `test-results/journey/scroll-walkthrough.webm`, with progress/error evidence alongside it.

Use `?webgl` or `?tier=low|high` to test graphics modes. `?still` freezes ambient orbital motion, smoke and flame flicker for repeatable camera comparisons while leaving scrolling enabled. `?audit` records per-frame draw calls and triangle counts in document data attributes. These are diagnostic URL switches, not extra interface controls.

`audit-districts.mjs` captures all three districts and nine logo inspections on desktop and mobile-sized viewports, samples frame intervals, and reports browser errors/warnings to `test-results/districts/audit.json`. The inspector tests cover keyboard/pointer/touch controls, missing/malformed/slow logos, scroll/focus restoration, resize, reduced motion and graphics loss. Logos use shared cached geometry; inspection reuses the current canvas and renderer. Optional logo requests time out individually after five seconds.

Automated checks and local recordings do not establish visual quality, complete WCAG conformance, or physical-device performance. Physical phones, actual browser zoom, and assistive-technology sessions remain unverified. Vite retains its >500KB raw graphics-chunk advisory. Earlier Lighthouse scores belonged to the rejected static study and are not evidence for this rebuild.

## Code and assets

- `src/components/Journey.astro`: shared homepage/direction content and responsive layout.
- `src/scene/cinematic/journey.ts`: Lenis wheel smoothing, shared scroll timeline, motion preferences, navigation, and failure recovery.
- `src/scene/cinematic/world.ts`: continuous camera paths, solar system, Earth, atmosphere, and orbital motion.
- `src/scene/cinematic/social-asteroids.ts`: seeded fractured shells, extruded local social SVGs, displaced crater terrain and bounded instanced debris, smoke and embers.
- `src/scene/cinematic/city.ts`: district architecture, lighting, sculpture mounts and instanced skyline.
- `src/scene/cinematic/logos.ts`, `technologies.ts`, `inspection.ts`: vector-to-mesh construction, verified experience copy and accessible inspection.
- `src/scene/core.ts`: shared renderer, resizing, single draw loop, and disposal.
- `src/pages/observatory.astro` and `src/scene/experience.ts`: retained inspection and planet explorer.

No new dependencies were added for the rebuilt journey. Lenis advances inside the existing renderer loop (`autoRaf: false`, `syncTouch: false`, `lerp: 0.1`). Native touch and keyboard scrolling remain available; camera, copy, effects and HUD follow one timeline without another damping stage. Layout measurements are cached and refreshed on resize or content changes. The optional observatory still uses its existing GSAP/Lenis integration.

NASA sources and derivative details: `public/textures/ATTRIBUTION.txt` and `public/textures/cinematic/ATTRIBUTION.txt`. The city, Sun texture, satellite, and orbital arrangement are illustrations, not actual employer premises, live telemetry, or scientifically scaled geometry. Asset downloads can be reproduced with `node scripts/fetch-cinematic-assets.mjs`.

Logo artwork sources, archive members and SHA-256 hashes are in `public/logos/SOURCES.json`; attribution is in `public/logos/ATTRIBUTION.txt`. Re-fetch with `python3 scripts/fetch-technology-logos.py`. No new dependencies were needed for logo geometry, environment lighting, architecture or inspection. Desktop uses one local shadowed light and modest bloom; mobile reduces geometric detail and omits those effects. Studio inspection bypasses bloom to preserve readable artwork colors.

## Search and contact

The homepage is the sole sitemap entry. `Base.astro` controls canonical URLs, indexing, social previews, and homepage ProfilePage/Person structured data. All four user-confirmed social profiles are shared by the contact UI and structured data through `src/data/profile.ts`. Social links open in a new tab, identify that behavior accessibly, and use locally captured asteroid images in fallback mode. No analytics, social embeds, or ad trackers are installed.

Recreate the 1200×630 preview with `node scripts/generate-social.mjs`. Do not add claims, employment availability, email, résumé, or repository links without verified inputs. Search Console ownership verification and indexing requests require the owner's Google account; deployment alone does not submit those requests or guarantee indexing.

## Release

The workflow builds with Node 24 and `npm ci`, runs Chromium release checks, uploads only `dist`, and deploys only passing `main` builds. Pull requests run verification without publishing. Full local regression includes Chrome, Firefox, and WebKit; CI release checks focus on metadata, redirects, social links, responsive navigation, and the shortened journey. Preserve the pre-release commit and revert the release commit to roll back; do not force-push.

Do not rebuild while browser tests read `dist`. After regenerating fallback posters, rebuild before running final tests. Local test reports and recordings are evidence, not production assets.

## Social asteroid journey

Four decorative rocks carry the confirmed LinkedIn, GitHub, Instagram and X artwork. Their camera-space paths preserve apparent movement through the space/city switch; the final descent blends into world-space landing positions. Heating begins during atmospheric entry at timeline 9, following the distinction described by [NASA](https://science.nasa.gov/solar-system/meteors-meteorites/). This is a cinematic illustration, not a physical simulation. All fragment transforms and crater depths derive from scroll time, so reverse scrolling and arbitrary seeks do not accumulate state. Ambient smoke and flicker use a separate clock. Mobile retains four objects with fewer shell segments and particles, without bloom or shadows.

The HTML contact links stay usable independently of graphics and highlight the matching settled logo on hover/focus. Optional SVG loading is bounded to five seconds; failed artwork retains the rock and its named link. Technology inspection stops Lenis, restores native scroll and focus on close, and restarts at the saved position. Lenis follows its [custom-loop integration](https://github.com/darkroomengineering/lenis).

Run `node scripts/audit-journey.mjs http://127.0.0.1:4322 current` for five viewport sizes, chapter/impact captures, forward/reverse wheel recordings, and frame/draw-call/triangle samples. The same script with `baseline` captures the original route for a same-host comparison. Evidence is local under `test-results/asteroids/`; it is not a physical-device benchmark. This change does not publish the site.

### Prior asteroid implementation — 2026-10-11

The final production build passed Astro's checks with zero diagnostics (44 files). The full Chrome/Firefox/WebKit suite completed with **100 passed, two expected CDP-only touch skips, zero failures and zero flaky tests**. It includes automated WCAG A/AA checks, actual rendered highlight/reversal comparisons, native jumps during wheel inertia, history, inspection restoration, missing artwork, interrupted initialization, context loss and no-JavaScript navigation. All 18 fallback WebP files were regenerated and decoded at their expected dimensions.

Opening, approach, entry, each career stop, three impact positions and settled contact were visually reviewed at 1440×900, 390×844, 768×1024, 320×568 and 844×390. The final five recorded wheel journeys each reached timeline 22 and returned to 0, with no browser errors or horizontal overflow. Reports and forward/reverse WebM recordings are under `test-results/asteroids/`; the consolidated evidence is `verification.json`, with the full passing suite in `regression.json`.

Same-host warmed Chrome recordings, with `?still` freezing ambient motion and the scroll journey active (milliseconds; counts include renderer passes):

| Viewport / tier | Median | p95 | p99 | Peak draw calls | Peak triangles |
| --- | ---: | ---: | ---: | ---: | ---: |
| Baseline desktop / high | 16.7 | 16.7 | 16.8 | 121 | 218,617 |
| Asteroids desktop / high | 16.7 | 16.8 | 33.3 | 146 | 240,497 |
| Baseline mobile / low | 16.7 | 16.7 | 16.8 | 109 | 51,583 |
| Asteroids mobile / low | 16.7 | 16.7 | 33.3 | 134 | 60,735 |
| Asteroids tablet / high | 16.7 | 16.8 | 33.3 | 146 | 240,497 |
| Asteroids narrow / low | 16.7 | 16.8 | 33.4 | 117 | 54,631 |
| Asteroids landscape / high | 16.7 | 16.8 | 66.7 | 139 | 240,497 |

Lenis synchronizes scroll interpolation and visual timing; the added geometry increases rendering cost. Occasional longer frames remain, especially in landscape. These recordings include capture overhead and do not establish uninterrupted 60 fps, cold-start performance, or physical-device performance. The existing deferred graphics-chunk size advisory remains. Nothing was published by this update.


## Realistic scenes and direct asteroid links

`src/scene/materials.ts` supplies shared texture loading and independent planet material instances for the journey and Observatory. NASA Earth, Moon, clouds and Jupiter remain; Solar System Scope maps supply the other planets, Sun, Saturn rings and ocean roughness. Color maps use sRGB and normal/roughness/AO maps remain data. Source URLs and conversion notes are in `public/textures/realism/`.

The contact card is replaced with four native anchors over projected visible rock bounds. They activate only at the settled contact stop and retain browser keyboard, touch, context-menu and new-tab behavior. Hover/focus labels and visible focus outlines supplement the dimensional marks. Reduced motion, missing graphics, no JavaScript and failed images retain the same named destinations. Generated asteroid captures are under `public/social/asteroid-*.webp`.

Rock Boulder Dry maps supply stone color, OpenGL normals, roughness and AO. Four differently proportioned fractured shells settle into fixed resting poses inside displaced craters. High quality adds bounded cavity lights, rock shadows and emissive-only MRT bloom; low quality uses baked cavity tint and soft contact occlusion. Logo colors come from LinkedIn blue, white GitHub/X marks and a color field sampled from Meta's original Instagram artwork. Geometry preserves the existing attributed dimensional outlines.

Debris transforms upload only when scroll-dependent impact state changes. Ambient smoke, embers and textured flames remain bounded instanced effects. Asteroid light layouts remain constant through travel, with intensity controlling illumination; settled shadows are cached. Opening, approach, career, impact and clearing shader variants compile sequentially before the animation loop; static HTML stays readable throughout loading. Native touch scrolling and the single Lenis-driven timeline remain.

Verification commands:

- `npm run build` and `npx playwright test` (planet tests now run in all three browsers).
- `node scripts/audit-realism.mjs http://127.0.0.1:4322` captures every journey milestone and all eight planets at five viewport sizes, and generates asteroid fallback crops.
- `node scripts/capture-keyframes.mjs http://127.0.0.1:4322` and `node scripts/capture-posters.mjs http://127.0.0.1:4322` regenerate scene posters; rebuild afterward.
- `node scripts/benchmark-realism.mjs http://127.0.0.1:4322 current` measures three cold/warm runs on desktop, mobile-size and landscape viewports with ambient animation active, without video recording. Run against the preserved pre-change build for baseline comparison.
- `node scripts/audit-journey.mjs http://127.0.0.1:4322 realism` records ambient forward/reverse travel separately from timing benchmarks.

The prior frozen/recorded performance table above is historical and cannot establish current smoothness. Raw new evidence lives under `test-results/realism/`. Physical-device performance remains unverified. Publishing is separate.


### Realism verification — 2026-10-11

The production build passes with zero Astro diagnostics (49 checked files). The final complete 126-case browser run produced **124 passes and two expected CDP-only skips**, with no failures. Automated WCAG A/AA checks, pointer/keyboard/touch/middle-click destinations, resize bounds, history, context loss, failed maps/logos/images, no JavaScript and interrupted loading are included. Reversal and settled lighting are checked across all three engines; complete rendering covers both backends and quality tiers. Ambient-animation regression coverage also checks city/impact shadow transitions in both directions.

Five viewport audits cover every journey milestone and all eight Observatory planets. All target rectangles remain separated, on screen, and at least 44×44 CSS pixels. Captured chapter, Observatory and individual-asteroid fallbacks are regenerated. Reports are in `test-results/realism/`; `final-regression.json` records the complete final run; earlier diagnostic and correction runs are retained separately.

Unrecorded Chrome/WebGPU timings below are the median of three runs per device/phase; all use ambient animation. Baseline is the preserved pre-revision build, with only matching audit frame/resource counters added. “Cold” means first traversal in a new browser context, **not** a purged operating-system or GPU-driver cache.

| Viewport / phase | p99 ms, baseline → current | Maximum frame ms, baseline → current | Peak draw calls, baseline → current |
| --- | ---: | ---: | ---: |
| desktop / cold | 50.0 → 33.3 | 133.3 → 133.4 | 146 → 117 |
| desktop / warm | 33.4 → 33.4 | 100.1 → 66.7 | 146 → 118 |
| mobile / cold | 50.0 → 33.3 | 133.3 → 116.6 | 134 → 88 |
| mobile / warm | 50.0 → 16.8 | 83.3 → 50.1 | 134 → 88 |
| landscape / cold | 66.7 → 50.0 | 116.7 → 133.4 | 139 → 116 |
| landscape / warm | 50.0 → 49.9 | 83.4 → 66.6 | 139 → 116 |

Median frame intervals remain about 16.7 ms and p95 about 16.8 ms. The maps increase texture counts (desktop 33 → 47; mobile 18 → 31), while geometry resources decrease from 86 to 67. Warm desktop triangles are 240,497 → 245,833; mobile 60,735 → 52,855. Raw runs include frame intervals, rendered-frame counts, draw calls, triangles, texture/geometry counts and explicit preparation timings.

Early optimization runs exposed multi-second first-entry stalls and are retained in the `before-light-stabilization/` and `stable-lights-before-complete-preparation/` evidence folders. Keeping the asteroid light layout constant, caching settled shadows and preparing additional scene variants improved repeated traversal. WebGL preparation is bounded to avoid excessive startup waits. A separate ambient video audit then caught depth textures being replaced on their first shadow render after precompilation. Shadow render targets now initialize before the animation loop, and pending shadow updates survive preparation. The final browser suite includes regression coverage, and benchmarks now collect GPU console errors as well as page errors. Final warmed p99 is effectively unchanged on desktop and landscape, while mobile improves from 50.0 to 16.8 ms. Median maximum warmed frames improve on all three viewports, but the final runs still contain 50–150 ms outliers; these measurements do not establish a jank-free experience or performance on physical phones. Remaining spikes are not assigned to shader compilation without a profiler trace. The existing deferred graphics-bundle advisory remains. Production deployment is tracked by the [GitHub Pages workflow](https://github.com/KashifManzer/KashifManzer.github.io/actions/workflows/deploy.yml).
