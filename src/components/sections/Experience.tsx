"use client";
import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

export function Experience() {
  const containerRef = useRef<HTMLDivElement>(null);
  const lineRef = useRef<HTMLDivElement>(null);

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
      // Draw the timeline line
      gsap.fromTo(
        lineRef.current,
        { scaleY: 0 },
        {
          scaleY: 1,
          ease: "none",
          scrollTrigger: {
            trigger: containerRef.current,
            start: "top center",
            end: "bottom center",
            scrub: true,
          }
        }
      );

      // Reveal jobs and trigger 3D WebGL burst
      const jobEls = gsap.utils.toArray(".job-card");
      jobEls.forEach((el: any) => {
        gsap.fromTo(
          el,
          { opacity: 0, x: -30 },
          {
            opacity: 1,
            x: 0,
            duration: 0.8,
            ease: "power3.out",
            scrollTrigger: {
              trigger: el,
              start: "top 70%",
              onEnter: () => {
                // PONYTAIL: Dispatch native event to WebGL canvas
                window.dispatchEvent(new CustomEvent('network-burst'));
              }
            }
          }
        );
      });
    }, containerRef);

    return () => ctx.revert();
  }, []);

  return (
    <section id="experience" ref={containerRef} className="relative z-10 w-full min-h-[100dvh] pt-32 pb-48 px-8 md:px-16 lg:px-24 pointer-events-none">
      <div className="relative max-w-2xl pointer-events-auto">
        <h2 className="text-3xl font-sans text-white mb-16 tracking-tight drop-shadow-[0_4px_16px_rgba(0,0,0,0.8)]">Experience</h2>
        
        <div className="relative border-l border-white/10 pl-8 md:pl-12 ml-4">
          {/* The animated cyan line */}
          <div ref={lineRef} className="absolute top-0 left-[-1px] w-[2px] h-full bg-neon-cyan origin-top shadow-[0_0_10px_rgba(34,211,238,0.5)]"></div>
          
          <div className="flex flex-col gap-24">
            {jobs.map((job, i) => (
              <div key={i} className="job-card relative">
                {/* Timeline dot */}
                <div className="absolute left-[-41px] md:left-[-57px] top-1 w-4 h-4 rounded-full bg-background border-2 border-neon-cyan shadow-[0_0_10px_rgba(34,211,238,0.8)]"></div>
                
                <p className="font-mono text-neon-cyan text-sm tracking-widest mb-2 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">{job.date}</p>
                <h3 className="text-2xl font-medium text-white mb-1 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">{job.company}</h3>
                <h4 className="text-white/60 mb-4 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">{job.role}</h4>
                <p className="text-white/90 leading-relaxed font-sans drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]">{job.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
