import { NetworkScene } from "@/components/canvas/NetworkScene";

export default function Home() {
  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden">
      <NetworkScene />
      {/* WebGL Canvas and UI overlays will go here in T2 and T3 */}
    </main>
  );
}
