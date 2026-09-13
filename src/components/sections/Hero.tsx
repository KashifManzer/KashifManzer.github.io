"use client";
import { useEffect, useRef } from "react";
import gsap from "gsap";

export function Hero() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (mediaQuery.matches || !containerRef.current) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        ".hero-element",
        { y: 30, opacity: 0 },
        { y: 0, opacity: 1, duration: 1.2, stagger: 0.15, ease: "power3.out", delay: 0.6 }
      );
    }, containerRef);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={containerRef} className="absolute inset-0 z-10 pointer-events-none">
      <div className="absolute bottom-8 left-8 md:bottom-16 md:left-16 lg:bottom-24 lg:left-24 max-w-xl pointer-events-auto">
        <h1 className="hero-element text-4xl md:text-6xl lg:text-7xl font-sans font-medium tracking-tight leading-[1.05] text-white drop-shadow-[0_4px_16px_rgba(0,0,0,0.8)]">
          Backend<br />Engineer.
        </h1>
        <div className="hero-element mt-6 flex items-center gap-4">
          <div className="h-[1px] w-12 bg-neon-cyan drop-shadow-[0_0_8px_rgba(34,211,238,0.8)]"></div>
          <p className="text-neon-cyan font-mono text-sm tracking-widest uppercase drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">Distributed Systems</p>
        </div>
        <p className="hero-element mt-6 max-w-[45ch] text-base md:text-lg text-white/90 font-sans leading-relaxed drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]">
          Building high-performance infrastructure, scalable node networks, and robust cloud architectures.
        </p>
        <div className="hero-element mt-10">
          <a href="#experience" className="inline-flex items-center justify-center bg-white text-black px-6 py-3 font-mono text-xs md:text-sm uppercase tracking-wide hover:bg-neon-cyan transition-colors">
            View Experience
          </a>
        </div>
      </div>
    </section>
  );
}
