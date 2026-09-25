import { defineConfig } from "astro/config";

export default defineConfig({
  site: "https://kashifmanzer.github.io",
  devToolbar: { enabled: false },
  vite: {
    // Pre-bundle the 3D/scroll deps together; discovering them lazily re-optimizes mid-session
    // and serves 504 "Outdated Optimize Dep" to the page.
    optimizeDeps: {
      include: ["three/webgpu", "three/tsl", "three/addons/tsl/display/BloomNode.js", "three/addons/tsl/display/ChromaticAberrationNode.js", "three/addons/tsl/display/FilmNode.js", "gsap", "gsap/ScrollTrigger", "lenis"],
    },
  },
});
