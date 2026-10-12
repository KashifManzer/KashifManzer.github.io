# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Astro 7 static site, plain Three.js (WebGPURenderer with automatic WebGL2 fallback, TSL shaders), native scrolling for the main journey, plain CSS with tokens. The retained observatory uses GSAP ScrollTrigger and Lenis.
Chosen because the site is one page plus future markdown content (projects, writing), Astro ships static HTML with only the 3D script as JS, and plain three.js keeps one render loop with no framework in between.
Configured for a static build to GitHub Pages (`KashifManzer.github.io`) via `withastro/action`; launch is explicitly authorized by the user on 2026-10-11.

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
- All text must be real HTML (SEO, screen readers, copy-paste); the main 3D scene is decorative. Optional satellite inspection lives in an accessible native dialog.
- Must work on phones.

## Approved Design Milestone

The replacement direction starts with the whole distant solar system, then moves continuously toward Earth on scroll. The complete cinematic journey spans nine screen heights; camera timeline values are independent of physical scroll distance. Earth arrival features a curved horizon, an original communications satellite, and the Moon farther away. One screen height descends through the atmosphere into a fictional cyberpunk technology city, from skyline to street.

Career chapters follow SettleMint → CSULB Institutional Research → Viasat, with camera travel between readable holds, then four social asteroid impacts and a settled contact clearing. The user rejected the box-building/text-billboard city and selected a cinematic technology district, physical brand sculptures, cinematic night lighting, and interactive logo inspection. The user subsequently rejected the overlapping logos, frames and labels as cluttered. Each stop now presents one main sculpture (Go, Kubernetes, Python), a quiet backdrop and a low plinth; the skyline has subdued windows. All nine official technology marks remain inspectable through HTML buttons: Go, Python, Kafka, Redis, Kubernetes, Docker, Prometheus, Grafana and Cloud Run. Inspection supports rotation/zoom/reset and restores scroll/focus on exit. Mobile retains the journey with fewer effects. Reduced motion and static content remain supported. Optional planet exploration returns after arrival.

The user rejected the static keyframe delivery as low quality and explicitly objected to its missing scrolling. That rejection supersedes the previous keyframe-review gate. The main route delivers the actual scrolling journey; `/direction/` preserves older links through a redirect. Complete the continuous approach, descent, career route, and social impact finale, then verify the experience with real scrolling.

Retain Astro, plain Three.js, GSAP, and Lenis. Use locally hosted NASA imagery, captured scene posters, and automatic WebGL fallback. The social asteroid update includes implementation and local verification; publishing is a separate step. Satellite geometry, city buildings, and communication links are visual metaphors, not live telemetry, real employer premises, or a claim of spacecraft engineering work. Solar sizes, distances, and speeds are artistic.

The previous Orbital Observatory is retained at `/observatory/` for satellite inspection and optional planet exploration. It includes slow Earth/satellite motion, a scroll pullback, satellite inspection, and an eight-planet explorer; duplicated professional content has been removed. The homepage is the replacement scroll journey.

## Evidence on Hand

Real facts, carried over from the previous site:

- Name: Kashif Manzer. Role: Backend & Infrastructure Engineer, distributed systems.
- Viasat, Software Engineer Intern, May 2026 - Aug 2026: built a Python AI agent with the Google ADK to automate pre-warming of high-demand titles for in-flight entertainment, orchestrated on GCP Cloud Run.
- Institutional Research, CSULB, Software Engineer, May 2025 - May 2026: backend data infrastructure in Go and Python; containerized services with Docker/Kubernetes; instrumented with Prometheus and Grafana.
- SettleMint India, Software Engineer (Backend & Infra), Aug 2021 - Jan 2025: distributed microservices in Go and Python for a national-scale regulated payments platform (100M+ DAU); API pipelines on Kafka and Redis.
- Skills: Go, Python, Rust, Terraform, Kubernetes, Docker, AWS, GCP, Kafka, Redis, Prometheus, Grafana, PostgreSQL, Distributed Systems.

Not yet provided (to be added after the base is approved; never fabricate): resume PDF, email, project repos, demos, screenshots, portrait, writing, additional projects, testimonials.

Confirmed public profiles: LinkedIn https://www.linkedin.com/in/kashif-manzer/; GitHub https://github.com/KashifManzer; Instagram https://www.instagram.com/tech.with.km/; X https://x.com/kashif_manzer. LinkedIn is the professional contact. Target organic discovery by recruiters and prospective clients; no paid advertising or tracking at launch.

## Product Principles

1. The work leads: every 3D moment should say something true about building systems.
2. Clarity survives spectacle: name, role, experience, and contact are always findable in seconds.
3. No invented claims: numbers and facts come only from the evidence above.
4. Performance is craft: smooth on a mid-range phone, graceful without WebGL.

## Accessibility & Inclusion

WCAG AA contrast, full keyboard navigation, visible focus, and a calm reduced-motion path.

## Social journey update

Remove both public project case studies. Preserve identity, career facts, technology inspection, observatory, and the original nine-screen route through timeline 18. Four fractured social asteroids descend toward Earth, heat during entry, and land at staggered times during a two-screen finale from 18–22. Permanent HTML social links use the confirmed destinations in `src/data/profile.ts`. Direct contact navigation opens the settled scene; reduced motion uses static imagery. Desktop wheel smoothing uses Lenis inside the renderer loop; native touch remains. Impacts are a cinematic illustration without sound or camera shake.


## Direct social finale and realism revision

The settled rocks themselves are the social link targets; remove the contact card and retain its section heading only for assistive technology. Use native anchors with projected bounds, new-tab announcements, hover names and visible keyboard focus. Preserve the same destinations in reduced-motion, no-JavaScript and graphics-fallback modes with captured asteroid images and plain-name recovery. Fixed resting poses, real rock material maps, original brand colors and shared planetary textures apply across the main journey and Observatory. Preserve career milestones, navigation, inspection restoration and quality tiers. Do not treat local measurements as physical-device performance proof. Publishing remains a separate task.
