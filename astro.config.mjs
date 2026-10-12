import { defineConfig } from "astro/config";

export default defineConfig({
  site: "https://kashifmanzer.github.io",
  devToolbar: { enabled: false },
  build: { inlineStylesheets: "always" },
  vite: {
    // Pre-bundle the 3D/scroll deps together; discovering them lazily re-optimizes mid-session
    // and serves 504 "Outdated Optimize Dep" to the page.
    optimizeDeps: {
      include: ["three/webgpu", "three/tsl", "three/addons/controls/OrbitControls.js", "gsap", "gsap/ScrollTrigger", "lenis"],
    },
  },
});
