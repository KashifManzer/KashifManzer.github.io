import { NetworkScene } from "@/components/canvas/NetworkScene";
import { Navbar } from "@/components/layout/Navbar";
import { Hero } from "@/components/sections/Hero";
import { Experience } from "@/components/sections/Experience";
import { Projects } from "@/components/sections/Projects";
import { Skills } from "@/components/sections/Skills";

export default function Home() {
  return (
    <main className="relative flex min-h-screen flex-col bg-background overflow-hidden">
      <Navbar />
      <NetworkScene />
      <Hero />
      <Experience />
      <Projects />
      <Skills />
    </main>
  );
}
