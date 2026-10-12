import { createStage, type Stage } from "./core";
import { film, type Film } from "./film";
import { initScroll } from "./scroll";
import { planets } from "./planets";

const canvas = document.querySelector<HTMLCanvasElement>(".stage")!;
const home = canvas.parentElement!;
const dialog = document.querySelector<HTMLDialogElement>("#inspection")!;
const viewport = dialog.querySelector<HTMLElement>(".inspection-viewport")!;
const inspectButton = document.querySelector<HTMLButtonElement>("#inspect")!;
const motionButton = document.querySelector<HTMLButtonElement>("#motion")!;
const closeButton = dialog.querySelector<HTMLButtonElement>(".close-inspection")!;
const exploreButton = document.querySelector<HTMLButtonElement>("#explore")!;
const solarDialog = document.querySelector<HTMLDialogElement>("#solar-system")!;
const solarViewport = solarDialog.querySelector<HTMLElement>(".solar-viewport")!;
const solarClose = solarDialog.querySelector<HTMLButtonElement>(".solar-close")!;
const solarOverview = solarDialog.querySelector<HTMLButtonElement>(".solar-overview")!;
const solarMotion = solarDialog.querySelector<HTMLButtonElement>(".solar-motion")!;
const systemMotion = matchMedia("(prefers-reduced-motion: reduce)");
const scroll = initScroll();
const abort = new AbortController();
let stage: Stage | undefined;
let scene: Film | undefined;
let failed = false;
let reduced = systemMotion.matches;
let savedScroll = 0;

function setMotion(value: boolean) {
  reduced = value;
  motionButton.setAttribute("aria-pressed", String(reduced));
  motionButton.textContent = reduced ? "Motion off" : "Motion on";
  motionButton.setAttribute("aria-label", `${motionButton.textContent}. ${reduced ? "Enable" : "Pause"} scene animation`);
  scroll.setReducedMotion(reduced);
  scene?.setReducedMotion(reduced);
  solarMotion.textContent = reduced ? "Resume motion" : "Pause motion";
}
setMotion(reduced);
const syncSystemMotion = () => setMotion(systemMotion.matches);
systemMotion.addEventListener("change", syncSystemMotion);
motionButton.addEventListener("click", () => setMotion(!reduced));

function closeInspection() {
  if (!dialog.open) return;
  dialog.close();
  home.append(canvas);
  document.documentElement.classList.remove("inspecting");
  stage?.resize();
  scene?.inspect(false);
  scroll.resume();
  window.scrollTo(0, savedScroll);
  inspectButton.focus({ preventScroll: true });
}
inspectButton.addEventListener("click", () => {
  if (!scene || failed) return;
  savedScroll = window.scrollY;
  scroll.pause();
  document.documentElement.classList.add("inspecting");
  dialog.showModal();
  viewport.append(canvas);
  stage!.resize();
  scene.inspect(true);
  closeButton.focus();
});
closeButton.addEventListener("click", closeInspection);
dialog.addEventListener("cancel", (event) => { event.preventDefault(); closeInspection(); });
// Native modal inertness blocks the page; explicitly wrap Tab before browser chrome.
dialog.addEventListener("keydown", (event) => {
  if (event.key !== "Tab") return;
  const last = dialog.querySelector<HTMLButtonElement>('[data-action="reset"]')!;
  if (event.shiftKey && document.activeElement === closeButton) { event.preventDefault(); last.focus(); }
  else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); closeButton.focus(); }
});
dialog.addEventListener("click", (event) => {
  const action = (event.target as HTMLElement).closest<HTMLButtonElement>("[data-action]")?.dataset.action;
  if (action) scene?.control(action);
});

function choosePlanet(index: number) {
  const planet = planets[index];
  solarDialog.dataset.destination = planet?.name ?? "overview";
  solarDialog.querySelector(".planet-kind")!.textContent = planet?.kind ?? "The solar system";
  solarDialog.querySelector(".planet-name")!.textContent = planet?.name ?? "Eight worlds. One neighbourhood.";
  solarDialog.querySelector(".planet-description")!.textContent = planet?.line ?? "Choose a planet and take the long way home.";
  solarOverview.hidden = !planet;
  for (const button of solarDialog.querySelectorAll<HTMLButtonElement>("nav [data-planet]")) {
    button.setAttribute("aria-pressed", String(Number(button.dataset.planet) === index));
  }
  scene?.travel(index);
}
function closeSolar() {
  if (!solarDialog.open) return;
  solarDialog.close();
  home.append(canvas);
  document.documentElement.classList.remove("inspecting");
  stage?.resize();
  scene?.explore(false);
  scroll.resume();
  window.scrollTo(0, savedScroll);
  exploreButton.focus({ preventScroll: true });
}
exploreButton.addEventListener("click", () => {
  if (!scene || failed) return;
  savedScroll = window.scrollY;
  scroll.pause();
  document.documentElement.classList.add("inspecting");
  solarDialog.showModal();
  solarViewport.prepend(canvas);
  stage!.resize();
  scene.explore(true);
  choosePlanet(-1);
  solarClose.focus();
});
solarClose.addEventListener("click", closeSolar);
solarDialog.addEventListener("cancel", (event) => { event.preventDefault(); closeSolar(); });
solarDialog.addEventListener("keydown", (event) => {
  if (event.key !== "Tab") return;
  const controls = [...solarDialog.querySelectorAll<HTMLElement>("button, a")].filter(element => element.getClientRects().length);
  const first = controls[0], last = controls[controls.length - 1];
  if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
  else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
});
solarDialog.addEventListener("click", (event) => {
  const button = (event.target as HTMLElement).closest<HTMLButtonElement>("[data-planet]");
  if (!button) return;
  const index = Number(button.dataset.planet);
  choosePlanet(index);
  solarDialog.querySelector<HTMLButtonElement>(`nav [data-planet="${index}"]`)!.focus();
});
canvas.addEventListener("click", (event) => {
  if (!solarDialog.open) return;
  const index = scene?.pickPlanet(event.clientX, event.clientY);
  if (index !== undefined) {
    choosePlanet(index);
    solarDialog.querySelector<HTMLButtonElement>(`nav [data-planet="${index}"]`)!.focus();
  }
});
solarOverview.addEventListener("click", () => {
  choosePlanet(-1);
  solarDialog.querySelector<HTMLButtonElement>('nav [data-planet="2"]')!.focus();
});
solarMotion.addEventListener("click", () => setMotion(!reduced));

for (const link of document.querySelectorAll<HTMLAnchorElement>('a[href="#work"], a[href="#top"]')) {
  link.addEventListener("click", (event) => {
    const target = document.querySelector<HTMLElement>(link.hash)!;
    event.preventDefault();
    scroll.jump(target);
    scene?.snap();
    history.replaceState(null, "", link.hash);
    target.focus({ preventScroll: true });
  });
}

function fail(error: unknown) {
  if (failed) return;
  failed = true;
  console.warn("[orbital] Static scene retained:", error);
  closeInspection();
  closeSolar();
  document.documentElement.classList.remove("scene-ready");
  document.documentElement.dataset.scene = "fallback";
  inspectButton.hidden = motionButton.hidden = exploreButton.hidden = true;
  abort.abort();
  scene?.dispose();
  scene = undefined;
  stage?.dispose();
  scroll.setReducedMotion(true);
}

const timeout = window.setTimeout(() => fail(new Error("Graphics initialization timed out")), 15000);
async function boot() {
  try {
    stage = await createStage(canvas, fail);
    if (failed) { stage.dispose(); return; }
    scene = await film(stage, scroll, abort.signal);
    if (failed) { scene.dispose(); stage.dispose(); return; }
    setMotion(reduced);
    document.documentElement.classList.add("scene-ready");
    document.documentElement.dataset.scene = "ready";
    inspectButton.hidden = motionButton.hidden = exploreButton.hidden = false;
    if (location.hash === '#solar-system') exploreButton.click();
  } catch (error) { fail(error); }
  finally { clearTimeout(timeout); }
}
void boot();
window.addEventListener("pagehide", (event) => {
  if (event.persisted) { closeInspection(); closeSolar(); return; }
  clearTimeout(timeout);
  abort.abort();
  scene?.dispose();
  stage?.dispose();
  scroll.dispose();
  systemMotion.removeEventListener("change", syncSystemMotion);
});
