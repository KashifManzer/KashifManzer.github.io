# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Delegated: Astro 7 static site, plain three.js (WebGPURenderer with automatic WebGL2 fallback, TSL shaders), GSAP ScrollTrigger, Lenis smooth scroll, plain CSS with tokens.
Chosen because the site is one page plus future markdown content (projects, writing), Astro ships static HTML with only the 3D script as JS, and plain three.js keeps one render loop with no framework in between.
Deployed as a static build to GitHub Pages (`KashifManzer.github.io`) via `withastro/action`.

## Users

Everyone who looks up Kashif: recruiters and hiring managers for backend, infrastructure, and distributed-systems roles; potential freelance or contract clients; other engineers.
They arrive from a resume, LinkedIn, GitHub, or a referral, usually on a laptop, sometimes on a phone.
They should be impressed within five seconds and understand who Kashif is and what he has built within thirty.

## Product Purpose

A personal portfolio for Kashif Manzer, a backend and infrastructure engineer.
Success: visitors remember the site, understand his experience, and reach out or open the resume.

## Positioning

A backend engineer whose work is invisible by nature (services, queues, pipelines) presenting it through a spatial, hand-built 3D experience.
The craft of the site itself is part of the proof.

## Capabilities and Constraints

- Static export only; no server.
- Must stay readable without WebGL and with reduced motion.
- All text must be real HTML (SEO, screen readers, copy-paste); the 3D layer is decorative.
- Must work on phones.

## Evidence on Hand

Real facts, carried over from the previous site:

- Name: Kashif Manzer. Role: Backend & Infrastructure Engineer, distributed systems.
- Viasat, Software Engineer Intern, May 2026 - Aug 2026: built a Python AI agent with the Google ADK to automate pre-warming of high-demand titles for in-flight entertainment, orchestrated on GCP Cloud Run.
- Institutional Research, CSULB, Software Engineer, May 2025 - May 2026: backend data infrastructure in Go and Python; containerized services with Docker/Kubernetes; instrumented with Prometheus and Grafana.
- SettleMint India, Software Engineer (Backend & Infra), Aug 2021 - Jan 2025: distributed microservices in Go and Python for a national-scale regulated payments platform (100M+ DAU); API pipelines on Kafka and Redis.
- Project NetLink (network automation framework): Terraform-driven, provisions VPCs across 3 AWS regions; Go microservices apply configs and probe latency with drift detection. Stack: Go, Python, Terraform, AWS, Prometheus.
- Project OmniAgent (AI-driven governance platform): concurrency-safe job scheduling and caching for LLM-driven proposal evaluations; full-stack, containerized on Kubernetes. Stack: React, Flask, PostgreSQL, LLMs, Kubernetes.
- Skills: Go, Python, Rust, Terraform, Kubernetes, Docker, AWS, GCP, Kafka, Redis, Prometheus, Grafana, PostgreSQL, Distributed Systems.

Not yet provided (to be added after the base is approved; never fabricate): resume PDF, email, GitHub URL, LinkedIn URL, project repos, demos, screenshots, portrait, writing, additional projects, testimonials.

## Product Principles

1. The work leads: every 3D moment should say something true about building systems.
2. Clarity survives spectacle: name, role, experience, and contact are always findable in seconds.
3. No invented claims: numbers and facts come only from the evidence above.
4. Performance is craft: smooth on a mid-range phone, graceful without WebGL.

## Accessibility & Inclusion

WCAG AA contrast, full keyboard navigation, visible focus, and a calm reduced-motion path.
