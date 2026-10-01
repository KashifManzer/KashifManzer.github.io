import Lenis from "lenis";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export interface ScrollState {
  /** Continuous stop index: 0 at the first section, 1 at the second, ... */
  stop: number;
}

/**
 * Lenis drives smooth scroll, GSAP's ticker drives Lenis, ScrollTrigger reads positions.
 * `stop` is derived from which `[data-stop]` section sits at the viewport center.
 */
export function initScroll(): ScrollState {
  const state: ScrollState = { stop: 0 };
  // Lenis already makes anchor jumps instant under reduced motion; this also drops wheel smoothing.
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const lenis = new Lenis({ anchors: true, smoothWheel: !reduced });
  lenis.on("scroll", () => ScrollTrigger.update());
  gsap.ticker.add((time) => lenis.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);

  // Section tops, re-measured whenever ScrollTrigger refreshes (resize, fonts, images).
  const sections = gsap.utils.toArray<HTMLElement>("[data-stop]");
  let tops: number[] = [];
  const measure = () => (tops = sections.map((el) => el.getBoundingClientRect().top + scrollY));

  // Stop i is fully reached when section i's top hits the viewport top.
  const computeStop = (y: number) => {
    let stop = 0;
    for (let i = 1; i < tops.length; i++) {
      const span = tops[i] - tops[i - 1];
      if (span <= 0) continue; // collapsed section: skip instead of dividing by zero
      const t = (y - tops[i - 1]) / span;
      if (t <= 0) break;
      stop = i - 1 + Math.min(t, 1);
    }
    return stop;
  };

  ScrollTrigger.create({
    start: 0,
    end: "max",
    // ScrollTrigger runs onUpdate before onRefresh, so recompute here with the fresh tops.
    onRefresh: (self) => {
      measure();
      state.stop = computeStop(self.scroll());
    },
    onUpdate: (self) => (state.stop = computeStop(self.scroll())),
  });
  measure();

  if (import.meta.env.DEV) Object.assign(window, { __scroll: state, __tops: () => tops, __syncScroll: () => ScrollTrigger.update() });
  return state;
}
