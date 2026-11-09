// Career state store: the single state object the UI renders.
//
// Only engine-bridge.js (gameplay) and dev-tools.js (God Menu) replace or change it. Views read
// `state` through this module's live binding and ask for a redraw with rerender(), so no view
// module needs to import the dashboard renderer directly.

export let state = null;

export function setState(next) {
  state = next;
  return state;
}

let renderer = null;

/** Registered once by app.js: the dashboard renderer (career-view.js renderState). */
export function setRenderer(fn) {
  renderer = fn;
}

/** Redraw the career dashboard from the current state. */
export function rerender(isInitial = false) {
  if (renderer) renderer(isInitial);
}

export function hasCareer() {
  return Boolean(state && state.player);
}
