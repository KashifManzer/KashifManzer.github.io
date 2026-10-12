import "lenis/dist/lenis.css";
import Lenis from "lenis";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export function initScroll() {
  const lenis = new Lenis({ smoothWheel: true });
  const tick = (time: number) => lenis.raf(time * 1000);
  lenis.on("scroll", ScrollTrigger.update);
  gsap.ticker.add(tick);
  const state = { progress: 0 };
  const trigger = ScrollTrigger.create({
    trigger: ".hero", start: "top top", endTrigger: "#work", end: "top bottom",
    onUpdate: (self) => { state.progress = self.progress; },
    onRefresh: (self) => { state.progress = self.progress; },
  });
  return {
    state,
    pause: () => lenis.stop(),
    resume: () => lenis.start(),
    setReducedMotion(reduced: boolean) { lenis.options.smoothWheel = !reduced; },
    jump(target: HTMLElement) { lenis.scrollTo(target, { immediate: true, force: true }); },
    dispose() { trigger.kill(); gsap.ticker.remove(tick); lenis.destroy(); },
  };
}

export type Scroll = ReturnType<typeof initScroll>;
