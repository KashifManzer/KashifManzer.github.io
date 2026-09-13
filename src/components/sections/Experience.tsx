"use client";
import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

export function Experience() {
  const containerRef = useRef<HTMLDivElement>(null);

  const jobs = [
    {
      company: "Viasat",
      role: "Software Engineer Intern",
      date: "May 2026 - Aug 2026",
      desc: "Built a Python AI agent using the Google ADK to automate pre-warming of high-demand titles for in-flight entertainment. Orchestrated on GCP Cloud Run."
    },
    {
      company: "Institutional Research, CSULB",
      role: "Software Engineer",
      date: "May 2025 - May 2026",
      desc: "Built backend data infrastructure in Go and Python. Containerized services with Docker/Kubernetes, instrumented with Prometheus and Grafana."
    },
    {
      company: "SettleMint India",
      role: "Software Engineer (Backend & Infra)",
      date: "Aug 2021 - Jan 2025",
      desc: "Designed distributed microservices in Go and Python for a national-scale regulated payments platform (100M+ DAU). Built API pipelines on Kafka and Redis."
    }
  ];

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (mediaQuery.matches || !containerRef.current) return;

    const ctx = gsap.context(() => {
      const cardEls = gsap.utils.toArray<HTMLElement>(".stack-card");
      cardEls.forEach((card, i) => {
        if (i === cardEls.length - 1) return;
        ScrollTrigger.create({
          trigger: card,
          start: "top top",
          endTrigger: cardEls[cardEls.length - 1],
          end: "top top",
          pin: true,
          pinSpacing: false,
          onEnter: () => window.dispatchEvent(new CustomEvent('network-burst')),
          onEnterBack: () => window.dispatchEvent(new CustomEvent('network-burst'))
        });
        
        gsap.to(card, {
          scale: 0.85,
          opacity: 0,
          y: -50,
          ease: "none",
          scrollTrigger: {
            trigger: cardEls[i + 1],
            start: "top bottom",
            end: "top top",
            scrub: true,
          },
        });
      });

      // trigger burst for the very last card
      ScrollTrigger.create({
        trigger: cardEls[cardEls.length - 1],
        start: "top top",
        onEnter: () => window.dispatchEvent(new CustomEvent('network-burst')),
        onEnterBack: () => window.dispatchEvent(new CustomEvent('network-burst'))
      });

    }, containerRef);

    return () => ctx.revert();
  }, []);

  return (
    <section id="experience" ref={containerRef} className="relative z-10 w-full pointer-events-none">
      {jobs.map((job, i) => (
        <div
          key={i}
          className="stack-card sticky top-0 min-h-[100dvh] flex flex-col justify-center px-8 md:px-16 lg:px-24 pointer-events-auto"
        >
          <div className="max-w-2xl bg-black/40 backdrop-blur-md border border-white/10 p-10 md:p-14 rounded-3xl shadow-[0_8px_32px_rgba(0,0,0,0.5)]">
            <p className="font-mono text-neon-cyan text-sm tracking-widest mb-4 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">{job.date}</p>
            <h3 className="text-4xl md:text-5xl font-medium text-white mb-2 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">{job.company}</h3>
            <h4 className="text-xl md:text-2xl text-white/60 mb-6 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">{job.role}</h4>
            <p className="text-lg text-white/90 leading-relaxed font-sans drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]">{job.desc}</p>
          </div>
        </div>
      ))}
    </section>
  );
}
