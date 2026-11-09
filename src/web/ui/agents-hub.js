// Agents & representation hub: browse, hire and fire agents and request wage renegotiations.

import { btnOpenAgentModal } from "./dom.js";
import { fireAgent, getAgentsCatalog, hireAgent, loadAgentsCatalog, renegotiateWage } from "./engine-bridge.js";
import { formatCurrency } from "./format.js";
import { showSocialToast } from "./social.js";
import { rerender, state } from "./store.js";

const agentModal = document.getElementById("agentModal");
const btnCloseAgentModal = document.getElementById("btnCloseAgentModal");
const btnDoneAgent = document.getElementById("btnDoneAgent");
const currentAgentSection = document.getElementById("currentAgentSection");
const agentSearchInput = document.getElementById("agentSearchInput");
const agentMarketGrid = document.getElementById("agentMarketGrid");
const agentPlayerBalance = document.getElementById("agentPlayerBalance");

// ==========================================
// 40 GLOBAL PLAYER AGENTS & REPRESENTATION HUB
// ==========================================

let currentAgentFilterTier = "all";
let currentAgentSearchQuery = "";

async function openAgentModal() {
  if (!state || !state.player) {
    alert("Please start a career first to manage player agency!");
    return;
  }
  await loadAgentsCatalog();
  agentModal.classList.remove("hidden");
  agentModal.classList.add("flex");
  renderAgentModal();
}

function closeAgentModal() {
  agentModal.classList.add("hidden");
  agentModal.classList.remove("flex");
}

function renderAgentModal() {
  if (!state || !state.player) return;
  const p = state.player;
  const totalEarned = p.careerTotals?.totalWagesEarned || 0;
  if (agentPlayerBalance) {
    agentPlayerBalance.textContent = formatCurrency(totalEarned);
  }

  // 1. Current Agent Section
  if (p.agent) {
    const ag = p.agent;
    const flagUrl = ag.iso ? `https://media.copero.com.ar/flags/4x3/${ag.iso.toLowerCase()}.svg` : "";
    currentAgentSection.innerHTML = `
      <div class="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div class="flex items-start gap-3.5">
          <div class="relative shrink-0">
            <div class="w-14 h-14 rounded-2xl bg-amber-500/20 border-2 border-amber-500/40 flex items-center justify-center text-2xl shadow-md">
              💼
            </div>
            ${
      flagUrl
        ? `<img src="${flagUrl}" class="absolute -bottom-1 -right-1 w-6 h-4 object-cover rounded shadow border border-zinc-700" alt="">`
        : ""
    }
          </div>
          <div>
            <div class="flex items-center gap-2 flex-wrap">
              <h4 class="text-base font-black text-white">${ag.name}</h4>
              <span class="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">${ag.tier}</span>
              <span class="text-[10px] font-bold text-zinc-400">• ${ag.agency} (${ag.country})</span>
            </div>
            <p class="text-xs text-amber-200/90 italic mt-0.5">"${ag.quote}"</p>
            <div class="flex items-center gap-4 mt-2 text-xs font-semibold text-zinc-300 flex-wrap">
              <span>Negotiation: <strong class="text-emerald-400 font-black">${ag.negotiation}/10</strong> (+${
      Math.round(ag.negotiation * 3.5 + 5)
    }% wage boost)</span>
              <span>Leverage: <strong class="text-sky-400 font-black">${ag.transferLeverage}/10</strong></span>
              <span>PR Savvy: <strong class="text-purple-400 font-black">${ag.prSavvy}/10</strong></span>
              <span>Commission: <strong class="text-rose-400 font-black">${ag.commission}%</strong></span>
            </div>
          </div>
        </div>

        <div class="flex items-center gap-2 w-full md:w-auto justify-end">
          <button type="button" id="btnAgentRenegotiate" class="px-4 h-9 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs transition-all shadow-md shadow-emerald-600/20 flex items-center gap-1.5 cursor-pointer">
            <span>📈 Renegotiate Wage</span>
          </button>
          <button type="button" id="btnAgentFire" class="px-3.5 h-9 rounded-xl bg-zinc-800 hover:bg-rose-900/60 text-zinc-300 hover:text-rose-200 border border-zinc-700 hover:border-rose-500 font-black text-xs transition-all cursor-pointer">
            Fire Agent
          </button>
        </div>
      </div>
    `;

    document.getElementById("btnAgentRenegotiate")?.addEventListener("click", handleRenegotiateWage);
    document.getElementById("btnAgentFire")?.addEventListener("click", handleFireAgent);
  } else {
    currentAgentSection.innerHTML = `
      <div class="flex items-center justify-between p-2">
        <div class="flex items-center gap-3">
          <div class="w-12 h-12 rounded-xl bg-zinc-800 text-zinc-400 flex items-center justify-center text-xl">👤</div>
          <div>
            <h4 class="text-sm font-black text-white">Self-Represented (No Agent)</h4>
            <p class="text-xs text-zinc-400 mt-0.5">Hire a licensed agent below to negotiate wage premiums and open doors to premier international clubs.</p>
          </div>
        </div>
      </div>
    `;
  }

  // 2. Render 40 Agents Grid
  renderAgentMarket();
}

function renderAgentMarket() {
  const agents = getAgentsCatalog();
  const filterTier = currentAgentFilterTier;
  const q = currentAgentSearchQuery.toLowerCase().trim();

  const filtered = agents.filter((ag) => {
    if (filterTier === "S" && ag.tier !== "World-Class") return false;
    if (filterTier === "A" && ag.tier !== "Elite") return false;
    if (filterTier === "B" && ag.tier !== "Established") return false;
    if (filterTier === "C" && ag.tier !== "Specialist") return false;

    if (q) {
      const match = ag.name.toLowerCase().includes(q) ||
        ag.country.toLowerCase().includes(q) ||
        ag.countryFifa.toLowerCase().includes(q) ||
        ag.agency.toLowerCase().includes(q) ||
        ag.personality.toLowerCase().includes(q) ||
        ag.agenda.toLowerCase().includes(q);
      if (!match) return false;
    }
    return true;
  });

  const p = state?.player;
  const currentAgentId = p?.agent?.id;

  agentMarketGrid.innerHTML = `
    <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
      ${
    filtered.map((ag) => {
      const isCurrent = currentAgentId === ag.id;
      const flagUrl = ag.iso ? `https://media.copero.com.ar/flags/4x3/${ag.iso.toLowerCase()}.svg` : "";
      const tierBadgeColor = ag.tier === "World-Class"
        ? "bg-amber-500/20 text-amber-300 border-amber-500/30"
        : ag.tier === "Elite"
        ? "bg-sky-500/20 text-sky-300 border-sky-500/30"
        : ag.tier === "Established"
        ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
        : "bg-zinc-800 text-zinc-300 border-zinc-700";

      return `
          <div class="relative p-3.5 rounded-2xl border ${
        isCurrent
          ? "border-amber-500/60 bg-amber-950/20 ring-1 ring-amber-500/40"
          : "border-zinc-800/80 bg-zinc-950/70 hover:border-zinc-700"
      } transition-all flex flex-col justify-between">
            <div>
              <div class="flex items-start justify-between gap-2 mb-2">
                <div class="flex items-center gap-2.5 min-w-0">
                  ${
        flagUrl
          ? `<img src="${flagUrl}" class="w-6 h-4 object-cover rounded shadow border border-zinc-700 shrink-0" alt="">`
          : ""
      }
                  <div class="min-w-0">
                    <h5 class="text-sm font-black text-white truncate">${ag.name}</h5>
                    <div class="text-[10px] text-zinc-400 truncate">${ag.agency} • ${ag.country} (${ag.countryFifa})</div>
                  </div>
                </div>
                <span class="text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full border shrink-0 ${tierBadgeColor}">${ag.tier}</span>
              </div>

              <div class="text-[11px] font-bold text-amber-400/90 mb-1.5">${ag.personality}</div>
              <p class="text-[11px] text-zinc-300 italic mb-2 line-clamp-2">"${ag.quote}"</p>

              <!-- Attributes Bar -->
              <div class="grid grid-cols-4 gap-1 py-1.5 px-2 rounded-xl bg-zinc-900/80 border border-zinc-800/80 text-center mb-2.5">
                <div>
                  <div class="text-[9px] text-zinc-400 font-bold uppercase">Negotiation</div>
                  <div class="text-xs font-black text-emerald-400">${ag.negotiation}/10</div>
                </div>
                <div>
                  <div class="text-[9px] text-zinc-400 font-bold uppercase">Leverage</div>
                  <div class="text-xs font-black text-sky-400">${ag.transferLeverage}/10</div>
                </div>
                <div>
                  <div class="text-[9px] text-zinc-400 font-bold uppercase">PR Savvy</div>
                  <div class="text-xs font-black text-purple-400">${ag.prSavvy}/10</div>
                </div>
                <div>
                  <div class="text-[9px] text-zinc-400 font-bold uppercase">Comm.</div>
                  <div class="text-xs font-black text-rose-400">${ag.commission}%</div>
                </div>
              </div>

              <div class="text-[10px] text-zinc-400 font-medium mb-3">
                <strong class="text-zinc-300 font-bold">Agenda:</strong> ${ag.agenda}
              </div>
            </div>

            <div class="flex items-center justify-between pt-2 border-t border-zinc-800/80">
              <div class="text-xs">
                <span class="text-zinc-500 text-[10px] block uppercase font-bold">Signing Fee</span>
                <strong class="text-white font-extrabold">${
        ag.hiringFee > 0 ? formatCurrency(ag.hiringFee) : "Free"
      }</strong>
              </div>

              ${
        isCurrent
          ? `
                <span class="px-3 py-1.5 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[11px] font-black">
                  ✓ Current Agent
                </span>
              `
          : `
                <button type="button" data-agent-id="${ag.id}" class="btn-hire-agent px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 text-[11px] font-black transition-all shadow-md shadow-amber-500/20 active:scale-95 cursor-pointer">
                  Hire Agent
                </button>
              `
      }
            </div>
          </div>
        `;
    }).join("")
  }
    </div>
  `;

  document.querySelectorAll(".btn-hire-agent").forEach((btn) => {
    btn.addEventListener("click", () => {
      const agentId = btn.dataset.agentId;
      handleHireAgent(agentId);
    });
  });
}

async function handleHireAgent(agentId) {
  if (!state || !state.player) return;

  try {
    await hireAgent(agentId);
    rerender(false);
    renderAgentModal();
    showSocialToast("agent", {
      title: "💼 Agency Contract Signed",
      gain: state.player.agent?.name || "Agent",
      message: `Representation agreement finalized with ${state.player.agent?.agency}.`,
      icon: "🤝",
    });
  } catch (e) {
    console.error(e);
  }
}

async function handleFireAgent() {
  if (!state || !state.player || !state.player.agent) return;

  const oldAgentName = state.player.agent.name;
  try {
    await fireAgent();
    rerender(false);
    renderAgentModal();
    showSocialToast("agent", {
      title: "📄 Representation Terminated",
      gain: "Free Agent",
      message: `Severed ties with ${oldAgentName}. You are now self-represented.`,
      icon: "✂️",
    });
  } catch (e) {
    console.error(e);
  }
}

async function handleRenegotiateWage() {
  if (!state || !state.player || !state.player.agent) return;

  try {
    const result = await renegotiateWage();
    rerender(false);
    renderAgentModal();
    showSocialToast("wage", {
      title: result.success ? "💰 Pay Raise Secured!" : "Negotiation Stalled",
      gain: result.success ? `+€${result.raiseAmount.toLocaleString()}/wk` : "No increase",
      message: result.message,
      icon: result.success ? "📈" : "⚠️",
    });
  } catch (e) {
    console.error(e);
  }
}

/** Attach this module's event listeners. Called once by app.js. */
export function initAgentsHub() {
  // Event Listeners for Agent Modal
  btnOpenAgentModal?.addEventListener("click", openAgentModal);

  btnCloseAgentModal?.addEventListener("click", closeAgentModal);

  btnDoneAgent?.addEventListener("click", closeAgentModal);

  agentModal?.addEventListener("click", (e) => {
    if (e.target === agentModal) closeAgentModal();
  });

  agentSearchInput?.addEventListener("input", (e) => {
    currentAgentSearchQuery = e.target.value;
    renderAgentMarket();
  });

  document.querySelectorAll(".btn-agent-filter").forEach((btn) => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".btn-agent-filter").forEach((b) => {
        b.className =
          "btn-agent-filter px-3 py-1.5 rounded-lg text-[11px] font-extrabold bg-zinc-800 hover:bg-zinc-700 text-zinc-300 cursor-pointer";
        b.setAttribute("aria-pressed", "false");
      });
      btn.className =
        "btn-agent-filter px-3 py-1.5 rounded-lg text-[11px] font-extrabold bg-amber-500 text-zinc-950 cursor-pointer";
      btn.setAttribute("aria-pressed", "true");
      currentAgentFilterTier = btn.dataset.tier;
      renderAgentMarket();
    });
  });
}
