// Classification/order: https://science.nasa.gov/solar-system/planets/
// Scene radii, spacing, phases and speeds are deliberately illustrative.
export const planets = [
  { name: "Mercury", kind: "Terrestrial planet", line: "A small, rocky world closest to the Sun.", color: "#aaa39b", radius: 0.65, orbit: 9, phase: 2.5 },
  { name: "Venus", kind: "Terrestrial planet", line: "A rocky world wrapped in a thick veil of clouds.", color: "#e8c38e", radius: 1.1, orbit: 13, phase: 4.3 },
  { name: "Earth", kind: "Our home", line: "One blue world. Everything we build starts here.", color: "#83c9e8", radius: 1.2, orbit: 17, phase: 5.7 },
  { name: "Mars", kind: "Terrestrial planet", line: "The red planet, just beyond our home orbit.", color: "#d3835d", radius: 0.85, orbit: 21, phase: 1.1 },
  { name: "Jupiter", kind: "Gas giant", line: "The largest planet in our solar system.", color: "#d9b291", radius: 3.4, orbit: 28, phase: 3.6 },
  { name: "Saturn", kind: "Gas giant", line: "A world framed by spectacular icy rings.", color: "#e3d2a6", radius: 2.8, orbit: 36, phase: 0.4 },
  { name: "Uranus", kind: "Ice giant", line: "A pale blue world in the outer solar system.", color: "#a6dce0", radius: 1.8, orbit: 43, phase: 2.0 },
  { name: "Neptune", kind: "Ice giant", line: "The most distant planet, deep in the blue.", color: "#6f98e5", radius: 1.75, orbit: 50, phase: 5.0 },
] as const;
