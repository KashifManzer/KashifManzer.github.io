import Lenis from "lenis";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export interface ScrollState {
  /** 0..1 across the whole page. */
  progress: number;
  /** Continuous stop index: 0 at the first section, 1 at the second, ... */
  stop: number;
  /** Signed scroll velocity from Lenis (px per frame). */
  velocity: number;
}

/**
 * Lenis drives smooth scroll, GSAP's ticker drives Lenis, ScrollTrigger reads positions.
 * `stop` is derived from which `[data-stop]` section sits at the viewport center.
 */
export function initScroll(): ScrollState {
  const state: ScrollState = { progress: 0, stop: 0, velocity: 0 };
  const lenis = new Lenis({ anchors: true });
  lenis.on("scroll", (l: Lenis) => {
    state.velocity = l.velocity;
    ScrollTrigger.update();
  });
  gsap.ticker.add((time) => lenis.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);

  // Section tops, re-measured whenever ScrollTrigger refreshes (resize, fonts, images).
  const sections = gsap.utils.toArray<HTMLElement>("[data-stop]");
  let tops: number[] = [];
  const measure = () => (tops = sections.map((el) => el.getBoundingClientRect().top + scrollY));

  ScrollTrigger.create({
    start: 0,
    end: "max",
    onRefresh: measure,
    onUpdate: (self) => {
      state.progress = self.progress;
      // Stop i is fully reached when section i's top hits the viewport top.
      const y = self.scroll();
      let stop = 0;
      for (let i = 1; i < tops.length; i++) {
        const t = (y - tops[i - 1]) / (tops[i] - tops[i - 1]);
        if (t <= 0) break;
        stop = i - 1 + Math.min(t, 1);
      }
      state.stop = stop;
    },
  });
  measure();

  if (import.meta.env.DEV) Object.assign(window, { __scroll: state, __tops: () => tops, __syncScroll: () => ScrollTrigger.update() });
  return state;
}
