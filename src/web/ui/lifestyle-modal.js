// Lifestyle modal: weekly-cost lifestyle perks the player can switch on and off.

import { ensureLifestyleChoices, toggleLifestyle } from "./engine-bridge.js";
import { showSocialToast } from "./social.js";
import { rerender, state } from "./store.js";

// Lifestyle Modal
const btnOpenLifestyle = document.getElementById("btnOpenLifestyle");
const btnOpenLifestyleNav = document.getElementById("btnOpenLifestyleNav");
const btnCloseLifestyle = document.getElementById("btnCloseLifestyle");
const btnDoneLifestyle = document.getElementById("btnDoneLifestyle");
const lifestyleModal = document.getElementById("lifestyleModal");
const lifestyleWeeklyCost = document.getElementById("lifestyleWeeklyCost");
const lifestyleAnnualDividends = document.getElementById("lifestyleAnnualDividends");
const lifestyleInjuryRiskMod = document.getElementById("lifestyleInjuryRiskMod");
const lifestyleChoicesList = document.getElementById("lifestyleChoicesList");

function renderLifestyleModal() {
  if (!state || !state.player) return;
  const p = state.player;
  ensureLifestyleChoices();

  let totalWeeklyCost = 0;
  let totalDividends = 0;
  let injuryRiskDelta = 0;

  p.lifestyleChoices.forEach((c) => {
    if (c.active) {
      totalWeeklyCost += c.costWeekly || 0;
      if (c.buffs?.passiveIncomeAnnual) totalDividends += c.buffs.passiveIncomeAnnual;
      if (c.buffs?.injuryRiskReduction) injuryRiskDelta -= c.buffs.injuryRiskReduction * 100;
      if (c.nerfs?.injuryRiskIncrease) injuryRiskDelta += c.nerfs.injuryRiskIncrease * 100;
    }
  });

  lifestyleWeeklyCost.textContent = `€${totalWeeklyCost.toLocaleString()}/wk`;
  lifestyleAnnualDividends.textContent = `+€${totalDividends.toLocaleString()}/yr`;
  if (injuryRiskDelta < 0) {
    lifestyleInjuryRiskMod.textContent = `${injuryRiskDelta.toFixed(0)}% Low Risk`;
    lifestyleInjuryRiskMod.className = "text-sm font-black text-emerald-400";
  } else if (injuryRiskDelta > 0) {
    lifestyleInjuryRiskMod.textContent = `+${injuryRiskDelta.toFixed(0)}% High Risk`;
    lifestyleInjuryRiskMod.className = "text-sm font-black text-rose-400";
  } else {
    lifestyleInjuryRiskMod.textContent = `0% Baseline`;
    lifestyleInjuryRiskMod.className = "text-sm font-black text-zinc-300";
  }

  lifestyleChoicesList.innerHTML = p.lifestyleChoices.map((c) => {
    const costText = c.costWeekly > 0
      ? `€${c.costWeekly.toLocaleString()}/week`
      : (c.buffs?.passiveIncomeAnnual ? `+€${(c.buffs.passiveIncomeAnnual / 1000).toFixed(0)}k/yr Dividends` : "Free");
    const costColor = c.costWeekly > 0 ? "text-rose-400" : "text-emerald-400";
    const categoryBadge = c.category === "fitness"
      ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
      : c.category === "luxury"
      ? "bg-amber-500/20 text-amber-400 border-amber-500/30"
      : c.category === "social"
      ? "bg-sky-500/20 text-sky-400 border-sky-500/30"
      : "bg-purple-500/20 text-purple-400 border-purple-500/30";

    const buffPills = [];
    if (c.buffs?.injuryRiskReduction) buffPills.push(`-${(c.buffs.injuryRiskReduction * 100).toFixed(0)}% Injury Risk`);
    if (c.buffs?.statBonus) buffPills.push(`+${c.buffs.statBonus.val} ${c.buffs.statBonus.attr.toUpperCase()}`);
    if (c.buffs?.moraleBonus) buffPills.push(`+${c.buffs.moraleBonus}% Morale`);
    if (c.buffs?.trustBonus) buffPills.push(`+${c.buffs.trustBonus} Coach Trust`);
    if (c.buffs?.followerMultiplier) {
      buffPills.push(`+${Math.round((c.buffs.followerMultiplier - 1) * 100)}% Viral Fame`);
    }

    const nerfPills = [];
    if (c.nerfs?.injuryRiskIncrease) nerfPills.push(`+${(c.nerfs.injuryRiskIncrease * 100).toFixed(0)}% Injury Risk`);
    if (c.nerfs?.trustPenalty) nerfPills.push(`-${c.nerfs.trustPenalty} Coach Trust`);
    if (c.nerfs?.staminaHit) nerfPills.push(`-${c.nerfs.staminaHit} Stamina`);

    const borderStyle = c.active
      ? "border-emerald-500/80 bg-zinc-900/90 shadow-md shadow-emerald-500/10"
      : "border-zinc-800 bg-zinc-950/60 hover:border-zinc-700";

    return `
      <div class="p-3.5 rounded-2xl border ${borderStyle} transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div class="flex items-start gap-3 min-w-0">
          <span class="text-2xl p-2 rounded-xl bg-zinc-800/80 shrink-0">${c.icon}</span>
          <div class="min-w-0">
            <div class="flex items-center gap-2 flex-wrap">
              <span class="text-sm font-extrabold text-white">${c.name}</span>
              <span class="text-[9px] font-black uppercase px-2 py-0.5 rounded-full border ${categoryBadge}">${c.category}</span>
              <span class="text-[10px] font-black ${costColor}">${costText}</span>
            </div>
            <p class="text-xs text-zinc-300 mt-1 leading-snug">${c.description}</p>
            <div class="flex flex-wrap gap-1.5 mt-2">
              ${
      buffPills.map((b) =>
        `<span class="text-[9px] font-black px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">${b}</span>`
      ).join("")
    }
              ${
      nerfPills.map((n) =>
        `<span class="text-[9px] font-black px-2 py-0.5 rounded-md bg-rose-500/15 text-rose-300 border border-rose-500/30">${n}</span>`
      ).join("")
    }
            </div>
          </div>
        </div>

        <button type="button" class="btn-toggle-lifestyle shrink-0 px-3.5 py-1.5 rounded-xl font-black text-xs transition-all cursor-pointer shadow-sm ${
      c.active ? "bg-emerald-500 hover:bg-emerald-400 text-zinc-950" : "bg-zinc-800 hover:bg-zinc-700 text-zinc-300"
    }" data-choice-id="${c.id}">
          ${c.active ? "✓ Active" : "+ Activate"}
        </button>
      </div>
    `;
  }).join("");

  document.querySelectorAll(".btn-toggle-lifestyle").forEach((btn) => {
    btn.onclick = () => {
      const choiceId = btn.dataset.choiceId;
      const toggled = toggleLifestyle(choiceId);
      if (toggled) {
        const { isNowActive, choice } = toggled;
        showSocialToast("lifestyle", {
          title: isNowActive ? `${choice.name} Activated!` : `${choice.name} Deactivated`,
          gain: isNowActive ? (choice.costWeekly > 0 ? `-€${choice.costWeekly}/wk` : "Perk Online") : "Perk Paused",
          message: choice.description,
          icon: choice.icon,
        });
        renderLifestyleModal();
        rerender(false);
      }
    };
  });
}

const openLifestyleHandler = () => {
  if (!state || !state.player) {
    alert("Please start a career first to configure lifestyle habits!");
    return;
  }
  lifestyleModal.classList.remove("hidden");
  lifestyleModal.classList.add("flex");
  renderLifestyleModal();
};

/** Attach this module's event listeners. Called once by app.js. */
export function initLifestyleModal() {
  if (btnOpenLifestyle) btnOpenLifestyle.addEventListener("click", openLifestyleHandler);

  if (btnOpenLifestyleNav) btnOpenLifestyleNav.addEventListener("click", openLifestyleHandler);

  btnCloseLifestyle.addEventListener("click", () => {
    lifestyleModal.classList.add("hidden");
    lifestyleModal.classList.remove("flex");
  });

  btnDoneLifestyle.addEventListener("click", () => {
    lifestyleModal.classList.add("hidden");
    lifestyleModal.classList.remove("flex");
  });
}
