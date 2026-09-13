import { NetworkScene } from "@/components/canvas/NetworkScene";
import { Navbar } from "@/components/layout/Navbar";
import { Hero } from "@/components/sections/Hero";
import { Experience } from "@/components/sections/Experience";

export default function Home() {
  return (
    <main className="relative flex min-h-screen flex-col bg-background overflow-hidden">
      <Navbar />
      <NetworkScene />
      <Hero />
      <Experience />
    </main>
  );
}
