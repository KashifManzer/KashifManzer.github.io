"use client";

const skills = [
  "Go", "Python", "Rust", "Terraform", "Kubernetes", "Docker", "AWS", "GCP", 
  "Kafka", "Redis", "Prometheus", "Grafana", "PostgreSQL", "Distributed Systems"
];

export function Skills() {
  return (
    <section className="relative z-10 w-full py-24 bg-black/60 backdrop-blur-md border-t border-white/10 overflow-hidden pointer-events-auto">
      <div className="flex whitespace-nowrap animate-marquee w-max">
        {/* Duplicate the array 4 times for seamless infinite scroll (CSS translates -50%) */}
        {[...skills, ...skills, ...skills, ...skills].map((skill, i) => (
          <div key={i} className="flex items-center">
            <span className="text-4xl md:text-6xl lg:text-7xl font-sans font-bold text-white/20 uppercase tracking-tighter px-8 hover:text-neon-cyan transition-colors duration-300">
              {skill}
            </span>
            <span className="text-neon-cyan text-4xl">•</span>
          </div>
        ))}
      </div>
    </section>
  );
}
