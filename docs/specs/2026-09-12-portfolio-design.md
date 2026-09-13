# Experimental WebGL Portfolio Implementation Plan

## Goal Description
Create a top-tier, highly creative portfolio for Kashif Manzer, a backend and infrastructure engineer with 4+ years of experience in distributed systems. The site will contrast his deep backend/infra expertise (Go, Python, Kubernetes, Kafka) with a stunning, high-end frontend experience using an "Experimental Canvas" approach. The project will be built with Next.js and React Three Fiber, and configured for static export to be hosted on GitHub Pages.

## Design Concept: "The Distributed Node Network"
Instead of generic floating shapes, the WebGL background will be a stylized 3D visualization of a distributed network. 
* **The Canvas**: Glowing nodes connected by data streams. As the user moves the mouse, the camera subtly pans and data streams light up, simulating network traffic and packet routing.
* **The UI**: Clean, mechanical typography (Industrial/Brutalist meets High-End Tech). Glassmorphic panels allow the 3D network to shine through.

### The Animation & Storytelling Flow (GSAP + WebGL)
Because static mockups can't show motion, here is exactly how the site will animate and tell your story:
1. **The Big Bang (Load)**: Screen starts black. A single 3D node appears and rapidly expands into the massive distributed network. The "Kashif Manzer" text aggressively scales and snaps into place.
2. **The Fly-Through (Scroll)**: As the user scrolls down, the WebGL camera physically *flies through* the 3D network using GSAP ScrollTrigger scrubbing. The network rotates and warps around the user.
3. **Routing the Timeline**: The vertical cyan timeline (seen in the mockup) literally "draws" itself down the screen like a data packet traveling through a wire. As it hits "Viasat" or "SettleMint", a cluster of 3D nodes in the background aggressively lights up to symbolize the scale of the systems you built there.
4. **The Project Dive**: When reaching the projects section, the camera dives *inside* one of the glowing nodes, transitioning into a sleek, high-tech bento grid for NetLink and OmniAgent.

## Architecture & Tech Stack
* **Framework**: Next.js 15 (App Router)
* **Deployment**: Static HTML Export (`output: 'export'`) for GitHub Pages
* **3D Rendering**: `@react-three/fiber` and `three`
* **Animations**: `gsap` (ScrollTrigger for UI elements)
* **Styling**: Tailwind CSS + `lucide-react` for minimalist icons

---

## Proposed Changes

### 1. Base Setup & Configuration
Initialize the Next.js environment and configure it for GitHub Pages deployment.
* **`next.config.js`**: Add `output: 'export'`, disable image optimization (required for GH pages), and set `basePath` if deploying to a project repo instead of a user repo.
* **`tailwind.config.ts`**: Define the dark, neon-accented color palette (deep slate background, glowing cyan/emerald accents for nodes).

### 2. The WebGL Canvas (Background)
* **`components/canvas/NetworkScene.tsx`**: The main R3F canvas setup.
* **`components/canvas/Nodes.tsx`**: Instanced meshes or particles representing microservices.
* **`components/canvas/Connections.tsx`**: Line geometries connecting the nodes, with a shader material that pulses based on a time uniform.

### 3. UI Overlay Components
* **`components/layout/Navbar.tsx`**: Fixed, glassmorphic header with links to sections, GitHub, and LinkedIn.
* **`components/sections/Hero.tsx`**: Massive, bold typography introducing Kashif as a Backend & Infra Engineer.
* **`components/sections/Experience.tsx`**: A vertical timeline mapping out SettleMint, CSULB, and Viasat, using GSAP to slide in on scroll.
* **`components/sections/Projects.tsx`**: A bento grid showcasing NetLink and OmniAgent. Hovering over a card triggers a micro-animation.
* **`components/sections/Skills.tsx`**: A continuous scrolling marquee of technologies (Go, Python, Terraform, Kubernetes, etc.).

---

## Board (Ticket System)

We will build this app one self-contained ticket at a time. Once a ticket is complete, we verify it and mark it done before moving to the next.

| Ticket | Depends on | Status | Summary |
|--------|-----------|--------|---------|
| `[T1]` | — | ⏳ todo | Setup Next.js, Tailwind, and GitHub Pages export config. Add basic layout structure. |
| `[T2]` | T1 | ⏳ todo | Build the WebGL Canvas: Setup React Three Fiber, create the interactive 3D node network background. |
| `[T3]` | T2 | ⏳ todo | Implement Hero & Navbar: Transparent navigation, bold typography, and initial GSAP load animations. |
| `[T4]` | T3 | ⏳ todo | Build Experience Section: Timeline mapping out Viasat, SettleMint, and CSULB with scroll-triggered GSAP reveals. |
| `[T5]` | T3 | ⏳ todo | Build Projects & Skills Sections: Bento grid for NetLink/OmniAgent and technical skills marquee. |

---

## User Review Required
> [!IMPORTANT]
> **GitHub Pages Repository Name**
> If your repository is named `KashifManzer.github.io`, the `basePath` in Next.js is `/`. If it's a project repo like `my-profile`, the `basePath` must be `/my-profile`. Please confirm your intended GitHub repository name so we can configure this correctly in T1.

## Open Questions
> [!NOTE]
> Are you happy with the "Distributed Node Network" visual concept for the WebGL canvas, or would you prefer something more abstract/minimal?

## Verification Plan
### Manual Verification
1. Run `npm run build` to ensure the static export succeeds without errors.
2. Serve the `out/` directory locally using `npx serve@latest out` to verify routing, GSAP animations, and WebGL performance.
3. Check responsive design on simulated mobile viewports.
