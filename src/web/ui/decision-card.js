// Decision card: renders the current career event and its options, and submits the chosen
// option (optionally after a hot-seat negotiation).

import { submitDecision } from "./engine-bridge.js";
import { openHotSeatModal } from "./hot-seat.js";
import { rerender, state } from "./store.js";

// Decision Card
const eventCategoryBadge = document.getElementById("eventCategoryBadge");
const contractCountdown = document.getElementById("contractCountdown");
const eventTitle = document.getElementById("eventTitle");
const eventDescription = document.getElementById("eventDescription");
const eventOptionsContainer = document.getElementById("eventOptionsContainer");

export const CALLUP_THRESHOLDS_UI = [55, 62, 70, 76, 80, 84];

// Render Decision Cards matching Copero's Qs visual style
export function renderDecisionCard() {
  const ev = state.currentEvent;
  if (!ev) return;

  eventCategoryBadge.textContent = ev.type.replace(/_/g, " ");
  const contractYears = state.player.contract?.yearsRemaining;
  contractCountdown.textContent = contractYears !== undefined
    ? `Contract: ${contractYears} season${contractYears === 1 ? "" : "s"} remaining`
    : "";

  if (ev.type === "academy_offer") {
    eventTitle.textContent = "Youth Academy Offers";
    eventDescription.textContent = "Three clubs want to add you to their youth setup. Select where your career starts:";
  } else if (ev.type === "contract_renewal") {
    eventTitle.textContent = "Contract Negotiations";
    eventDescription.textContent =
      "You have entered the final year of your contract. Extend your deal or prepare for a high-profile move:";
  } else if (ev.type === "contract_non_renewal") {
    eventTitle.textContent = "Bosman Free Agency";
    eventDescription.textContent =
      "Your contract has expired! Competing suitors are offering immediate signing bonuses and key roles:";
  } else if (ev.type === "clutch_moment") {
    eventTitle.textContent = "⚡ Clutch Match Decision";
    eventDescription.textContent = `The championship is on the line in stoppage time! Choose your tactical execution:`;
  } else if (ev.type === "dilemma_event") {
    eventTitle.textContent = "⚖️ High-Stakes Career Dilemma";
    eventDescription.textContent = ev.description ||
      "A pivotal crisis or opportunity demands your response. Each path carries decisive rewards and risks:";
  } else if (ev.type === "shirt_number_showdown") {
    eventTitle.textContent = "👕 Dressing Room Shirt Number Showdown";
    eventDescription.textContent = ev.description ||
      "A senior star has arrived and wants your shirt number! How do you handle this hierarchy showdown?";
  } else if (ev.type === "dual_nationality_declaration") {
    eventTitle.textContent = "🌍 International Allegiance Crossroads";
    eventDescription.textContent = ev.description ||
      "Both nations are scouting you for senior caps. Declare your permanent international allegiance:";
  } else {
    eventTitle.textContent = "Transfer Window Offers";
    eventDescription.textContent =
      "Offers have arrived after your latest performances. Sign with a new club or remain loyal:";
  }

  eventOptionsContainer.removeAttribute("aria-busy");
  eventOptionsContainer.innerHTML = ev.options.map((opt) => {
    const t = opt.teamId ? catalogIndex.getTeam(opt.teamId) : null;
    const comp = opt.teamId ? catalogIndex.getCompetition(opt.teamId) : null;
    const country = comp ? catalogIndex.getCountryByFifa(comp.country_fifa_code) : null;
    const primaryColor = t?.primary_color || "#10b981";

    // Clutch Moment Buttons
    if (opt.type === "clutch_action") {
      return `
        <button type="button" data-option-id="${opt.id}" class="btn-decision group p-4 rounded-2xl border border-amber-500/50 bg-gradient-to-br from-amber-500/10 to-zinc-950 hover:bg-amber-500/20 hover:border-amber-400 transition-all text-left flex flex-col justify-between cursor-pointer shadow-lg hover:scale-[1.02]">
          <div>
            <div class="text-[10px] font-extrabold uppercase tracking-widest text-amber-400 mb-1">Clutch Play</div>
            <div class="font-black text-base text-white group-hover:text-amber-300 transition-colors">${opt.label}</div>
            <div class="text-xs text-zinc-300 mt-1 leading-snug">${opt.description}</div>
          </div>
          <div class="mt-3 flex items-center justify-between text-[10px] font-black text-amber-400 uppercase tracking-wider">
            <span>Execute Move</span>
            <span>⚡</span>
          </div>
        </button>
      `;
    }

    // High-Stakes Career Dilemma Choice
    if (opt.type === "dilemma_choice") {
      return `
        <button type="button" data-option-id="${opt.id}" class="btn-decision group p-4 rounded-2xl border border-rose-500/50 bg-gradient-to-br from-rose-950/30 via-zinc-900 to-zinc-950 hover:bg-rose-950/50 hover:border-rose-400 transition-all text-left flex flex-col justify-between cursor-pointer shadow-lg hover:scale-[1.02]">
          <div>
            <div class="flex items-center justify-between mb-1.5">
              <span class="text-[10px] font-extrabold uppercase tracking-widest text-rose-400">Moral & Legal Crossroads</span>
              <span class="text-xs">⚖️</span>
            </div>
            <div class="font-black text-base text-white group-hover:text-rose-300 transition-colors">${opt.label}</div>
            <div class="text-xs text-zinc-300 mt-2 leading-relaxed">${opt.description}</div>
          </div>
          <div class="mt-4 pt-2 border-t border-rose-500/20 flex items-center justify-between text-[10px] font-black text-rose-400 uppercase tracking-wider">
            <span>Commit Decision</span>
            <span>→</span>
          </div>
        </button>
      `;
    }

    // Shirt Number Showdown Choice
    if (opt.type === "shirt_choice") {
      return `
        <button type="button" data-option-id="${opt.id}" class="btn-decision group p-4 rounded-2xl border border-indigo-500/50 bg-gradient-to-br from-indigo-950/30 via-zinc-900 to-zinc-950 hover:bg-indigo-950/60 hover:border-indigo-400 transition-all text-left flex flex-col justify-between cursor-pointer shadow-lg hover:scale-[1.02]">
          <div>
            <div class="flex items-center justify-between mb-1.5">
              <span class="text-[10px] font-extrabold uppercase tracking-widest text-indigo-400">Hierarchy & Number</span>
              <span class="text-xs">👕</span>
            </div>
            <div class="font-black text-base text-white group-hover:text-indigo-300 transition-colors">${opt.label}</div>
            <div class="text-xs text-zinc-300 mt-2 leading-relaxed">${opt.description}</div>
          </div>
          <div class="mt-4 pt-2 border-t border-indigo-500/20 flex items-center justify-between text-[10px] font-black text-indigo-400 uppercase tracking-wider">
            <span>Assert Position</span>
            <span>→</span>
          </div>
        </button>
      `;
    }

    // Dual Nationality Declaration Choice
    if (opt.type === "dual_nationality_choice") {
      const natCountry = opt.countryIso
        ? (typeof CATALOG !== "undefined" ? CATALOG.countries?.find((c) => c.iso_alpha2 === opt.countryIso) : null)
        : null;
      return `
        <button type="button" data-option-id="${opt.id}" class="btn-decision group p-4 rounded-2xl border border-sky-500/50 bg-gradient-to-br from-sky-950/30 via-zinc-900 to-zinc-950 hover:bg-sky-950/60 hover:border-sky-400 transition-all text-left flex flex-col justify-between cursor-pointer shadow-lg hover:scale-[1.02]">
          <div>
            <div class="flex items-center justify-between mb-1.5">
              <span class="text-[10px] font-extrabold uppercase tracking-widest text-sky-400">National Allegiance</span>
              ${
        natCountry
          ? `<img src="${natCountry.flag_url}" class="w-5 h-3.5 object-cover rounded shadow border border-zinc-700" alt="">`
          : `<span class="text-xs">🌍</span>`
      }
            </div>
            <div class="font-black text-base text-white group-hover:text-sky-300 transition-colors">${opt.label}</div>
            <div class="text-xs text-zinc-300 mt-2 leading-relaxed">${opt.description}</div>
          </div>
          <div class="mt-4 pt-2 border-t border-sky-500/20 flex items-center justify-between text-[10px] font-black text-sky-400 uppercase tracking-wider">
            <span>Confirm Allegiance</span>
            <span>→</span>
          </div>
        </button>
      `;
    }

    // Standard Club Offer / Decision Card
    const isNegotiable = ["renew_contract", "permanent_transfer", "join_club", "join_loan"].includes(opt.type);
    const primaryActionLabel = opt.type === "renew_contract"
      ? "Sign Extension"
      : opt.type === "join_loan"
      ? "Accept Loan"
      : (opt.type === "permanent_transfer" || opt.type === "join_club")
      ? "Sign Deal"
      : "Accept Offer";

    return `
      <div class="group relative p-4 border border-[#262A26] transition-colors text-left flex flex-col justify-between overflow-hidden duration-200 bg-[#111311] hover:bg-[#171A17]"
        style="border-top: 2px solid ${primaryColor};">
        
        <!-- Large Background Watermark -->
        ${
      t
        ? `<img src="${t.logo_url}" class="pointer-events-none absolute -end-6 -bottom-6 w-24 h-24 object-contain opacity-[0.04] grayscale group-hover:opacity-[0.08] transition-opacity" alt="">`
        : ""
    }

        <!-- Card Content -->
        <div class="relative z-10 w-full">
          <div class="flex items-center justify-between mb-2">
            <!-- League & Flag -->
            <div class="flex items-center gap-1.5 min-w-0">
              ${comp ? `<img src="${comp.logo_url}" class="w-3.5 h-3.5 object-contain shrink-0" alt="">` : ""}
              <span class="text-[11px] font-semibold text-zinc-400 leading-tight [overflow-wrap:break-word]">${
      comp ? comp.name : ""
    }</span>
            </div>
            ${
      country
        ? `<img src="${country.flag_url}" class="w-4 h-3 object-cover rounded shadow-sm shrink-0 border border-[#262A26]" alt="${country.fifa_code}" title="${country.name_en}">`
        : ""
    }
          </div>

          <!-- Team Crest in Center -->
          <div class="flex items-center justify-center my-3">
            ${
      t
        ? `<img src="${t.logo_url}" alt="${t.name}" class="h-14 w-14 object-contain drop-shadow-md group-hover:scale-105 transition-transform duration-200">`
        : `<div class="h-12 w-12 rounded-lg bg-[#171A17] border border-[#262A26] flex items-center justify-center font-black text-xs text-white">STAY</div>`
    }
          </div>

          <!-- Team Name & Offer Description -->
          <div class="text-center mb-2">
            <div class="font-black text-sm text-white group-hover:text-emerald-400 transition-colors [overflow-wrap:break-word] [text-wrap:balance]">${opt.label}</div>
            <div class="text-[11px] text-zinc-400 mt-1 leading-snug">${opt.description}</div>
          </div>
        </div>

        <!-- Embedded Interactive Actions Strip inside the offer card -->
        <div class="relative z-10 mt-3 pt-2.5 border-t border-[#262A26] flex flex-col gap-2">
          ${
      isNegotiable
        ? `
            <button type="button" data-option-id="${opt.id}" class="btn-decision w-full py-2 px-3 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs transition-all flex items-center justify-center gap-1.5 shadow-sm active:scale-[0.98] cursor-pointer">
              <span>${primaryActionLabel}</span>
              <span>→</span>
            </button>
            <button type="button" data-negotiate-id="${opt.id}" class="btn-open-hotseat w-full py-2 px-3 rounded-lg bg-[#171A17] hover:bg-[#1D201C] border border-amber-500/40 text-amber-300 hover:text-amber-200 font-extrabold text-[11px] transition-all flex items-center justify-center gap-1.5 shadow-sm active:scale-[0.98] cursor-pointer" title="Enter Turn-Based Deadline Day Bargaining Table">
              <span>💼</span>
              <span>Negotiate in Hot-Seat</span>
            </button>
          `
        : `
            <button type="button" data-option-id="${opt.id}" class="btn-decision w-full py-2 px-3 rounded-lg bg-[#171A17] hover:bg-[#262A26] border border-[#262A26] text-zinc-200 hover:text-white font-black text-xs transition-all flex items-center justify-center gap-1.5 shadow-sm active:scale-[0.98] cursor-pointer">
              <span>${opt.type === "stay" ? "Remain at Club" : opt.label}</span>
              <span>→</span>
            </button>
          `
    }
        </div>
      </div>
    `;
  }).join("");

  document.querySelectorAll(".btn-open-hotseat").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const optionId = btn.dataset.negotiateId;
      const opt = ev.options.find((o) => o.id === optionId);
      if (!opt) return;

      const baseWage = opt.contractOffer?.weeklyWage || Math.round((state.player?.marketValue || 1000000) * 0.008);
      openHotSeatModal({
        clubWageBudget: baseWage,
        clubWageCeiling: Math.round(baseWage * 1.35),
        deadlineHoursRemaining: 8,
      }, async (result) => {
        if (result && result.dealAgreed) {
          await submitDecision(optionId, { agreedWage: result.agreedWage });
          rerender(false);
        }
      });
    });
  });

  document.querySelectorAll(".btn-decision").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const optionId = btn.dataset.optionId;
      eventOptionsContainer.setAttribute("aria-busy", "true");
      eventOptionsContainer.innerHTML =
        `<div class="col-span-3 sim-status" role="status"><span class="pulse" aria-hidden="true"></span><span>Simulating fixtures, goals and standings…</span><span class="sim-scan" aria-hidden="true"></span></div>`;
      // Let the simulating state paint before the synchronous season run blocks the thread
      await new Promise((r) => requestAnimationFrame(() => setTimeout(r, 0)));

      try {
        await submitDecision(optionId);
        rerender(false);
      } catch (e) {
        console.error(e);
      }
    });
  });
}
