"use client";
import { useEffect, useRef } from "react";
import gsap from "gsap";
import Link from "next/link";

export function Navbar() {
  const navRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (mediaQuery.matches || !navRef.current) return;

    gsap.fromTo(
      navRef.current.children,
      { y: -20, opacity: 0 },
      { y: 0, opacity: 1, duration: 1, stagger: 0.1, ease: "power3.out", delay: 0.2 }
    );
  }, []);

  return (
    <header
      ref={navRef}
      className="fixed top-0 left-0 right-0 z-50 flex items-start justify-between p-8 md:p-12 text-white pointer-events-none mix-blend-difference"
    >
      <div className="font-mono text-sm tracking-widest uppercase pointer-events-auto">
        <Link href="/">Kashif.M</Link>
      </div>
      <nav className="flex flex-col items-end gap-3 font-mono text-sm pointer-events-auto">
        <Link href="#experience" className="hover:text-neon-cyan transition-colors">Experience</Link>
        <Link href="#projects" className="hover:text-neon-cyan transition-colors">Projects</Link>
      </nav>
    </header>
  );
}
