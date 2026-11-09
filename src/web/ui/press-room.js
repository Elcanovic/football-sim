// Press conferences: one seeded question per season and the resulting front page.

import { answerPress, drawPressConference } from "./engine-bridge.js";
import { formatSocialFollowers } from "./format.js";
import { showSocialToast } from "./social.js";
import { rerender, state } from "./store.js";

const btnOpenPressModal = document.getElementById("btnOpenPressModal");

// Press Conferences & Media Room Elements
const pressModal = document.getElementById("pressModal");
const btnClosePressModal = document.getElementById("btnClosePressModal");
const btnDonePress = document.getElementById("btnDonePress");
const pressOutletBadge = document.getElementById("pressOutletBadge");
const pressScenarioBadge = document.getElementById("pressScenarioBadge");
const pressQuestionText = document.getElementById("pressQuestionText");
const pressResponsesContainer = document.getElementById("pressResponsesContainer");
const pressHeadlinePreview = document.getElementById("pressHeadlinePreview");
const newsOutletHeader = document.getElementById("newsOutletHeader");
const newsHeadlineText = document.getElementById("newsHeadlineText");
const newsQuoteSnippet = document.getElementById("newsQuoteSnippet");
const newsImpactBadges = document.getElementById("newsImpactBadges");
let currentPressQuestion = null;

// ==========================================
// PRESS CONFERENCES & JOURNALISTIC NARRATIVES
// ==========================================
function openPressModal() {
  if (!state || !state.player) {
    alert("Please start a career first to hold a press conference!");
    return;
  }
  pressModal.classList.remove("hidden");
  pressModal.classList.add("flex");
  initPressConference();
}

function closePressModal() {
  pressModal.classList.add("hidden");
  pressModal.classList.remove("flex");
}

function initPressConference() {
  if (!state || !state.player) return;
  const p = state.player;
  const team = catalogIndex ? catalogIndex.getTeam(state.currentTeamId || p.currentTeamId) : null;
  const teamName = team ? (team.short_name || team.name) : "Club";

  currentPressQuestion = drawPressConference(teamName);
  if (currentPressQuestion) renderPressConference(currentPressQuestion);
}

function renderPressConference(conf) {
  if (!conf) return;

  pressOutletBadge.textContent = `${conf.outlet.name} (${conf.outlet.country})`;
  pressOutletBadge.className = `text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
    conf.outlet.badgeColor || "bg-sky-500/20 text-sky-300 border border-sky-500/30"
  }`;
  pressScenarioBadge.textContent = conf.topicTitle || "Media Interview";
  pressQuestionText.textContent = conf.question;

  // Hide breaking headline until answer is selected
  pressHeadlinePreview.classList.add("hidden");

  pressResponsesContainer.innerHTML = conf.options.map((opt) => {
    const toneBadge = opt.id === "humble"
      ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
      : opt.id === "box_office"
      ? "bg-rose-500/20 text-rose-400 border-rose-500/30"
      : "bg-sky-500/20 text-sky-400 border-sky-500/30";
    return `
      <button type="button" data-answer-id="${opt.id}" class="btn-press-answer w-full p-3.5 rounded-2xl border border-zinc-800 bg-zinc-950/70 hover:border-sky-500 hover:bg-zinc-900/90 transition-all text-left flex flex-col justify-between cursor-pointer group shadow-md hover:scale-[1.01]">
        <div>
          <div class="flex items-center justify-between mb-1.5">
            <span class="text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full border ${toneBadge}">${opt.toneLabel}</span>
            <span class="text-xs text-zinc-400 font-bold">${opt.consequencesSummary}</span>
          </div>
          <p class="text-xs sm:text-sm font-bold text-zinc-200 group-hover:text-white leading-relaxed">${opt.text}</p>
        </div>
        <div class="mt-2 text-[10px] font-black text-sky-400 uppercase tracking-wider flex items-center justify-end gap-1">
          <span>Deliver Statement</span>
          <span>→</span>
        </div>
      </button>
    `;
  }).join("");

  document.querySelectorAll(".btn-press-answer").forEach((btn) => {
    btn.addEventListener("click", () => {
      const answerId = btn.dataset.answerId;
      handleAnswerPress(answerId);
    });
  });
}

function handleAnswerPress(answerId) {
  if (!state || !state.player || !currentPressQuestion) return;

  const resolution = answerPress(currentPressQuestion, answerId);

  if (resolution) {
    newsOutletHeader.textContent = `${resolution.outletName.toUpperCase()} FRONT PAGE`;
    newsHeadlineText.textContent = resolution.headline;
    newsQuoteSnippet.textContent = resolution.newspaperSnippet;

    const badges = [];
    if (resolution.trustDelta !== 0) {
      const color = resolution.trustDelta > 0
        ? "text-emerald-400 bg-emerald-500/15 border-emerald-500/30"
        : "text-rose-400 bg-rose-500/15 border-rose-500/30";
      badges.push(
        `<span class="px-2 py-0.5 rounded-md border ${color}">${
          resolution.trustDelta > 0 ? "+" : ""
        }${resolution.trustDelta} Coach Trust</span>`,
      );
    }
    if (resolution.moraleDelta !== 0) {
      const color = resolution.moraleDelta > 0
        ? "text-emerald-400 bg-emerald-500/15 border-emerald-500/30"
        : "text-rose-400 bg-rose-500/15 border-rose-500/30";
      badges.push(
        `<span class="px-2 py-0.5 rounded-md border ${color}">${
          resolution.moraleDelta > 0 ? "+" : ""
        }${resolution.moraleDelta}% Morale</span>`,
      );
    }
    if (resolution.followersGain > 0) {
      badges.push(
        `<span class="px-2 py-0.5 rounded-md border text-sky-400 bg-sky-500/15 border-sky-500/30">+${
          formatSocialFollowers(resolution.followersGain)
        } Followers</span>`,
      );
    }
    newsImpactBadges.innerHTML = badges.join("");

    pressHeadlinePreview.classList.remove("hidden");

    document.querySelectorAll(".btn-press-answer").forEach((b) => {
      b.disabled = true;
      b.classList.add("opacity-50", "pointer-events-none");
    });

    showSocialToast("press", {
      title: `${resolution.outletName} Headline`,
      gain: `+${formatSocialFollowers(resolution.followersGain)} fans`,
      message: resolution.headline,
      icon: "🎙️",
    });

    rerender(false);
  }
}

/** Attach this module's event listeners. Called once by app.js. */
export function initPressRoom() {
  btnOpenPressModal?.addEventListener("click", openPressModal);

  btnClosePressModal?.addEventListener("click", closePressModal);

  btnDonePress?.addEventListener("click", closePressModal);

  pressModal?.addEventListener("click", (e) => {
    if (e.target === pressModal) closePressModal();
  });
}
