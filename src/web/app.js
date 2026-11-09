// BallSim web UI entry point.
//
// Wires the view modules in src/web/ui/ together and attaches their listeners once. The
// simulation itself lives in src/engine/ and is reached only through ui/engine-bridge.js.
// scripts/build_standalone.js follows this file's imports to bundle the UI.

import { initAgentsHub } from "./ui/agents-hub.js";
import { initBootsModal } from "./ui/boots-modal.js";
import { renderState } from "./ui/career-view.js";
import { initCelebrationOverlay } from "./ui/celebration-overlay.js";
import { initCreationScreen, renderCountryGrid } from "./ui/creation-screen.js";
import { initGodMenu } from "./ui/god-menu.js";
import { initHotSeat } from "./ui/hot-seat.js";
import { initLifestyleModal } from "./ui/lifestyle-modal.js";
import { initPressRoom } from "./ui/press-room.js";
import { setRenderer, setState, state } from "./ui/store.js";

setRenderer(renderState);

initCreationScreen();
initCelebrationOverlay();
initLifestyleModal();
initGodMenu();
initAgentsHub();
initBootsModal();
initPressRoom();
initHotSeat();

// Console hooks for debugging a live career: getState(), setState(next), renderState()
if (typeof document !== "undefined") {
  globalThis.getState = () => state;
  globalThis.setState = (next) => {
    setState(next);
    renderState(false);
  };
  globalThis.renderState = renderState;
}

// Initial load
if (typeof CATALOG !== "undefined") {
  renderCountryGrid("");
}
