// HUD progression animation: the OVR roll, delta chip and attribute flashes that play after
// a season, queued so they run only once the trophy overlay has closed.

import { badgeOvr, playerBadge } from "./dom.js";
import { animateValue, getBadgeStyle } from "./format.js";

// Attributes & Dynamic Position Labels
const statPAC = document.getElementById("statPAC");
const statSHO = document.getElementById("statSHO");
const statPAS = document.getElementById("statPAS");
const statDRI = document.getElementById("statDRI");
const statDEF = document.getElementById("statDEF");
const statPHY = document.getElementById("statPHY");

// -------------------------------------------------------------
// HUD PROGRESSION (OVR rolling counter, glow, delta chip, stat flashes)
// -------------------------------------------------------------
let pendingHudProgression = null;
let ovrAnimToken = 0;

// Abandon any OVR roll in flight (a newer render owns the badge now)
export function cancelOvrAnimation() {
  ovrAnimToken++;
}

export function queueHudProgression(fn) {
  pendingHudProgression = fn;
}

export function flushHudProgression(delay = 0) {
  const fn = pendingHudProgression;
  pendingHudProgression = null;
  if (fn) setTimeout(fn, delay);
}

function rollOvrDigit(val, up) {
  badgeOvr.textContent = val;
  badgeOvr.classList.remove("ovr-roll-up", "ovr-roll-down");
  void badgeOvr.offsetWidth; // restart keyframes
  badgeOvr.classList.add(up ? "ovr-roll-up" : "ovr-roll-down");
}

function showOvrDeltaChip(delta) {
  playerBadge.querySelectorAll(".ovr-delta-chip").forEach((el) => el.remove());
  const chip = document.createElement("span");
  chip.className = `ovr-delta-chip ${delta > 0 ? "up" : "down"}`;
  chip.textContent = delta > 0 ? `▲ +${delta}` : `▼ ${delta}`;
  playerBadge.appendChild(chip);
  setTimeout(() => chip.remove(), 2500);
}

/**
 * Smoothly interpolates the OVR badge from -> to.
 * Each integer step rolls in (up from below on gains, down from above on drops),
 * paced with an ease-out curve so it accelerates then settles on the final value.
 */
export function animateOvrChange(from, to) {
  const token = ++ovrAnimToken;
  const delta = to - from;
  if (delta === 0) {
    badgeOvr.textContent = to;
    playerBadge.className = `ovr-plate border select-none transition-all duration-700 ${getBadgeStyle(to)}`;
    return;
  }

  const up = delta > 0;
  const steps = Math.abs(delta);
  const duration = Math.min(2400, 700 + steps * 230);

  playerBadge.style.setProperty("--ovr-dur", `${duration + 500}ms`);
  playerBadge.classList.remove("ovr-glow-up", "ovr-glow-down");
  void playerBadge.offsetWidth;
  playerBadge.classList.add(up ? "ovr-glow-up" : "ovr-glow-down");
  showOvrDeltaChip(delta);

  const start = performance.now();
  let shown = from;
  const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);

  function frame(now) {
    if (token !== ovrAnimToken) return;
    const t = Math.min(1, (now - start) / duration);
    const val = Math.round(from + delta * easeOutCubic(t));
    if (val !== shown) {
      shown = val;
      rollOvrDigit(val, up);
      // Immediately morph badge tier color dynamically as it counts through thresholds (e.g. crossing 70 -> silver, 80 -> gold, 90 -> icon)
      playerBadge.className = `ovr-plate border select-none transition-colors duration-300 ${getBadgeStyle(val)}`;
    }
    if (t < 1) {
      requestAnimationFrame(frame);
    } else {
      if (shown !== to) rollOvrDigit(to, up);
      // Final badge tier with pulse glow
      const glowCls = up ? "ovr-glow-up" : "ovr-glow-down";
      playerBadge.className = `ovr-plate border select-none transition-all duration-700 ${
        getBadgeStyle(to)
      } ${glowCls}`;
    }
  }
  requestAnimationFrame(frame);
}

export function getHudAttrValues(a, pos) {
  if (pos === "GK") {
    return [
      a.diving || 50,
      a.handling || 50,
      a.kicking || 50,
      a.reflexes || 50,
      a.positioning || 50,
      a.physical || 50,
    ];
  }
  return [
    a.pace || 50,
    a.shooting || 50,
    a.passing || 50,
    a.dribbling || 50,
    a.defending || 50,
    a.physical || 50,
  ];
}

export function animateStatChanges(fromVals, toVals) {
  const els = [statPAC, statSHO, statPAS, statDRI, statDEF, statPHY];
  els.forEach((el, i) => {
    const from = fromVals ? fromVals[i] : toVals[i];
    const to = toVals[i];
    el.classList.remove("stat-flash-up", "stat-flash-down");
    if (from !== to) {
      void el.offsetWidth;
      el.classList.add(to > from ? "stat-flash-up" : "stat-flash-down");
      animateValue(el, from, to, 900 + i * 60);
    } else {
      el.textContent = to;
    }
  });
}
