"use client";
import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

const projects = [
  {
    name: "NetLink",
    subtitle: "Network Automation Framework",
    stack: ["Go", "Python", "Terraform", "AWS", "Prometheus"],
    desc: "Terraform-driven framework provisioning VPCs across 3 AWS regions. Go microservices apply configs and probe latency with drift detection."
  },
  {
    name: "OmniAgent",
    subtitle: "AI-Driven Governance Platform",
    stack: ["React", "Flask", "PostgreSQL", "LLMs", "Kubernetes"],
    desc: "Concurrency-safe job scheduling and caching for LLM-driven proposal evaluations. Full-stack end-to-end containerized on K8s."
  }
];

export function Projects() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (mediaQuery.matches || !containerRef.current) return;

    const ctx = gsap.context(() => {
      const cards = gsap.utils.toArray(".bento-card");
      gsap.fromTo(
        cards,
        { y: 100, opacity: 0, scale: 0.9 },
        {
          y: 0,
          opacity: 1,
          scale: 1,
          duration: 1,
          stagger: 0.2,
          ease: "expo.out",
          scrollTrigger: {
            trigger: containerRef.current,
            start: "top 60%",
          }
        }
      );
    }, containerRef);

    return () => ctx.revert();
  }, []);

  const handleHover = () => window.dispatchEvent(new CustomEvent('network-burst'));

  return (
    <section id="projects" ref={containerRef} className="relative z-10 w-full min-h-screen py-32 px-8 md:px-16 lg:px-24 pointer-events-none">
      <div className="max-w-6xl mx-auto pointer-events-auto">
        <h2 className="text-4xl md:text-5xl font-sans text-white mb-16 tracking-tight text-center drop-shadow-[0_4px_16px_rgba(0,0,0,0.8)]">Selected Projects</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {projects.map((project, i) => (
            <div 
              key={i} 
              onMouseEnter={handleHover}
              className="bento-card group relative p-10 md:p-14 rounded-3xl bg-black/40 backdrop-blur-xl border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.5)] hover:bg-black/60 hover:border-neon-cyan/50 transition-all duration-500 overflow-hidden cursor-pointer"
            >
              <div className="absolute -top-16 -right-16 w-48 h-48 bg-neon-cyan/10 blur-[60px] rounded-full group-hover:bg-neon-cyan/30 transition-colors duration-500"></div>
              
              <h3 className="text-3xl font-medium text-white mb-2 relative z-10">{project.name}</h3>
              <h4 className="text-neon-cyan font-mono text-sm tracking-widest uppercase mb-6 relative z-10">{project.subtitle}</h4>
              <p className="text-white/80 leading-relaxed font-sans mb-8 relative z-10">{project.desc}</p>
              
              <div className="flex flex-wrap gap-3 mt-auto relative z-10">
                {project.stack.map(tech => (
                  <span key={tech} className="px-4 py-2 rounded-full border border-white/20 text-white/90 text-xs font-mono group-hover:border-neon-cyan/50 transition-colors duration-500">
                    {tech}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
