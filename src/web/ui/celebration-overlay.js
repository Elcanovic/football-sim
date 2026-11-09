// Trophy celebration overlay: the podium stage shown when titles are won. Takes a slate from
// buildCelebrationSlate (celebration.js) and holds until the player presses Continue.

import { totalTrophies } from "./dom.js";
import { animateValue, escapeHtmlText } from "./format.js";
import { flushHudProgression } from "./hud-progression.js";
import { resolveTrophy, TROPHY_ASSETS } from "./trophies.js";

// Celebration Overlay Elements
const celebrationOverlay = document.getElementById("celebrationOverlay");
const celebrationTrophiesContainer = document.getElementById("celebrationTrophiesContainer");
const celebrationTally = document.getElementById("celebrationTally");
const celebrationTallyStrip = document.getElementById("celebrationTallyStrip");
const celebrationSpanLabel = document.getElementById("celebrationSpanLabel");
const particleContainer = document.getElementById("particleContainer");
const celebrationContinue = document.getElementById("celebrationContinue");
const celebrationBoard = celebrationOverlay.querySelector(".celebration-board");

// Trophy celebration overlay
// Takes a slate from buildCelebrationSlate (celebration.js): one entry per title won since the
// last celebration, which spans 1–3 seasons depending on pacing. Every title gets its own podium
// cell inside its season's board. Cells enter 100ms apart, and the gold tally rolls up one step
// as each cell lands. Everything animates transform and opacity only. The stage holds still
// until the player presses Continue (or Escape); nothing dismisses it on a timer.
const CELEBRATION_STAGGER_MS = 100;
const CELEBRATION_ENTER_MS = 300;
let celebrationReturnFocus = null;
let celebrationTallyTimers = [];
let pendingTitlesHud = null;

// Hold the HUD title count at `from` until the overlay closes, then roll it to `to`
export function deferTitlesHud(from, to) {
  pendingTitlesHud = { from, to };
}

function celebrationBadgeLabel(entry) {
  if (entry.kind === "award") return "Award";
  if (entry.key === "world_cup" || entry.key.startsWith("national")) return "International";
  if (entry.key.startsWith("continental") || entry.key.includes("club_world")) return "Continental";
  if (entry.key.includes("cup")) return "Cup";
  if (entry.key.includes("league")) return "League";
  return "Title";
}

export function triggerTrophyCelebration(slate) {
  if (!slate || !slate.entries || slate.entries.length === 0) return;
  const { entries, tallyBefore, tallyAfter } = slate;

  celebrationTallyTimers.forEach(clearTimeout);
  celebrationTallyTimers = [];

  // Particle burst
  particleContainer.innerHTML = "";
  const colors = ["#F6C516", "#FFDB5C", "#ECEAE2", "#2FA84F", "#6FB8DA", "#F26B1D"];
  for (let i = 0; i < 28; i++) {
    const p = document.createElement("span");
    p.className = "celebration-particle";
    p.style.setProperty("--burst-angle", `${i * (360 / 28)}deg`);
    p.style.setProperty("--burst-dist", `${130 + (i % 3) * 35}px`);
    p.style.setProperty("--burst-delay", `${(i % 4) * 0.04}s`);
    p.style.setProperty("--burst-color", colors[i % colors.length]);
    particleContainer.appendChild(p);
  }

  // One sub-board per season, in slate order. Two seasons sit side by side; three sit two
  // over one (see .podium-seasons). Cells keep one global stagger index across seasons.
  const seasonGroups = [];
  for (const entry of entries) {
    const last = seasonGroups[seasonGroups.length - 1];
    if (last && last.seasonIndex === entry.seasonIndex) last.entries.push(entry);
    else {seasonGroups.push({
        seasonIndex: entry.seasonIndex,
        seasonLabel: entry.seasonLabel,
        age: entry.age,
        entries: [entry],
      });}
  }
  const seasonsInSpan = seasonGroups.length;
  const isSingle = entries.length === 1;
  const renderCell = (entry, idx) => {
    const trophy = resolveTrophy(entry.key, entry.teamId);
    return `
      <div class="podium-cell" style="--i:${idx}">
        <div class="podium-head">
          <span class="podium-badge podium-badge-${entry.kind}">${celebrationBadgeLabel(entry)}</span>
        </div>
        <img src="${trophy.url}" alt="" class="podium-img" onerror="this.src='${TROPHY_ASSETS.generic_cup.url}'">
        <div class="podium-name">${escapeHtmlText(trophy.name)}</div>
      </div>
    `;
  };
  let cellIdx = 0;
  celebrationTrophiesContainer.className = `podium-seasons is-${seasonsInSpan}-seasons${isSingle ? " is-single" : ""}`;
  celebrationTrophiesContainer.innerHTML = seasonGroups.map((group) => `
    <section class="podium-season-group" aria-label="${group.seasonLabel} season">
      <header class="podium-season-head">
        <span class="podium-season">${group.seasonLabel}</span>
        <span class="podium-age">Age ${group.age} · ${group.entries.length} ${
    group.entries.length === 1 ? "title" : "titles"
  }</span>
      </header>
      <div class="podium-grid${isSingle ? " is-single" : ""}">
        ${group.entries.map((entry) => renderCell(entry, cellIdx++)).join("")}
      </div>
    </section>
  `).join("");

  // Gold tally: an odometer strip of every value from before to after. Each step is a
  // transform on one composited layer, so no text swap, no reflow and no flash.
  const digits = String(tallyAfter).length;
  const values = [];
  for (let v = tallyBefore; v <= tallyAfter; v++) values.push(v);
  celebrationTally.style.setProperty("--tally-ch", `${digits}ch`);
  celebrationTallyStrip.innerHTML = values.map((v) => `<span>${v}</span>`).join("");
  celebrationTallyStrip.style.setProperty("--tally-step", 0);
  celebrationTally.setAttribute("aria-label", `${tallyAfter} pieces of career silverware`);
  celebrationSpanLabel.textContent = seasonsInSpan > 1
    ? `${entries.length} titles · ${seasonsInSpan} seasons`
    : `${entries.length} ${entries.length === 1 ? "title" : "titles"} · ${entries[0].seasonLabel}`;

  // Continue is the last chunk of the staged entrance, after the final cell
  celebrationContinue.style.setProperty("--i", entries.length);

  if (!celebrationActive) celebrationReturnFocus = document.activeElement;
  celebrationOverlay.classList.remove("hidden", "is-leaving");
  celebrationOverlay.classList.add("flex");
  celebrationActive = true;
  celebrationTrophiesContainer.scrollTop = 0;
  requestAnimationFrame(updateCelebrationScrollCue);
  celebrationContinue.focus({ preventScroll: true });

  // One tally step per cell, timed to the moment that cell finishes entering
  entries.forEach((_, idx) => {
    celebrationTallyTimers.push(setTimeout(() => {
      celebrationTallyStrip.style.setProperty("--tally-step", idx + 1);
    }, idx * CELEBRATION_STAGGER_MS + CELEBRATION_ENTER_MS));
  });

  // Free the compositor layers once the staggered entrance has finished
  celebrationTallyTimers.push(setTimeout(() => {
    celebrationTrophiesContainer.classList.add("is-settled");
  }, (entries.length - 1) * CELEBRATION_STAGGER_MS + CELEBRATION_ENTER_MS + 50));
}

// Fade over the bottom edge while trophies remain below the fold
function updateCelebrationScrollCue() {
  const el = celebrationTrophiesContainer;
  celebrationBoard.classList.toggle("has-more", el.scrollTop + el.clientHeight < el.scrollHeight - 2);
}

function dismissCelebration() {
  celebrationTallyTimers.forEach(clearTimeout);
  celebrationTallyTimers = [];
  if (!celebrationActive) {
    celebrationOverlay.classList.add("hidden");
    celebrationOverlay.classList.remove("flex");
    return;
  }
  celebrationActive = false;
  if (celebrationReturnFocus && document.contains(celebrationReturnFocus)) {
    celebrationReturnFocus.focus({ preventScroll: true });
  }
  celebrationReturnFocus = null;
  celebrationOverlay.classList.add("is-leaving");
  setTimeout(() => {
    celebrationOverlay.classList.add("hidden");
    celebrationOverlay.classList.remove("flex", "is-leaving");
    celebrationTrophiesContainer.classList.remove("is-settled");
  }, 150);
  // The HUD title count catches up only after the overlay is gone, so it never jumps behind it
  if (pendingTitlesHud) {
    const { from, to } = pendingTitlesHud;
    pendingTitlesHud = null;
    animateValue(totalTrophies, from, to, 600);
  }
  // Play the season's OVR / attribute progression only once the popup is gone
  flushHudProgression(320);
}
export let celebrationActive = false;

/** Attach this module's event listeners. Called once by app.js. */
export function initCelebrationOverlay() {
  celebrationTrophiesContainer.addEventListener("scroll", updateCelebrationScrollCue, { passive: true });

  globalThis.addEventListener("resize", () => {
    if (celebrationActive) updateCelebrationScrollCue();
  });

  celebrationContinue.addEventListener("click", () => dismissCelebration());

  document.addEventListener("keydown", (e) => {
    if (celebrationActive && e.key === "Escape") {
      e.preventDefault();
      dismissCelebration();
    }
  });
}
