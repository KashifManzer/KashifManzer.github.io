# Kashif Manzer - Portfolio

A scroll-driven 3D portfolio: a glass core in ember dust dives into a night city, one chapter per role.

Built with Astro (static), three.js (WebGPU renderer with automatic WebGL2 fallback, TSL shaders), GSAP ScrollTrigger, and Lenis.
Deployed to GitHub Pages at https://kashifmanzer.github.io.

## Develop

```bash
npm install
npm run dev      # http://localhost:4321
npm run build    # type check + static build into dist/
npm run preview  # serve dist/
```

## Testing switches

- `?webgl` forces the WebGL2 backend.
- `?tier=low` or `?tier=high` forces the quality tier.
- In dev, `window.__tick(seconds)` advances frames manually, so screenshots work in a background tab.

## Layout

- `src/pages/index.astro`: page, loader, and copy.
- `src/scene/`: renderer core, scroll mapping, and one module per scene element (crystal, dust, city, post-processing, the film timeline).
- `PRODUCT.md`: product facts the design must stay true to.
