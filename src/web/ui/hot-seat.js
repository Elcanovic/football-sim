// Deadline-day hot-seat negotiation modal: counter-offers against club patience and urgency.

import { closeNegotiation, counterOffer, openNegotiation } from "./engine-bridge.js";
import { state } from "./store.js";

// ==========================================
// DEADLINE DAY HOT-SEAT NEGOTIATIONS CONTROLLER
// ==========================================
let currentHotSeatSession = null;
let currentHotSeatCallback = null;

const hotSeatModal = document.getElementById("hotSeatModal");
const btnCloseHotSeatModal = document.getElementById("btnCloseHotSeatModal");
const hotSeatDeadlineBadge = document.getElementById("hotSeatDeadlineBadge");
const hotSeatPatienceVal = document.getElementById("hotSeatPatienceVal");
const hotSeatPatienceBar = document.getElementById("hotSeatPatienceBar");
const hotSeatWalkoutWarning = document.getElementById("hotSeatWalkoutWarning");
const hotSeatLeverageVal = document.getElementById("hotSeatLeverageVal");
const hotSeatLeverageBar = document.getElementById("hotSeatLeverageBar");
const hotSeatUrgencyVal = document.getElementById("hotSeatUrgencyVal");
const hotSeatUrgencyBar = document.getElementById("hotSeatUrgencyBar");
const hotSeatCurrentOfferWage = document.getElementById("hotSeatCurrentOfferWage");
const hotSeatDemandWage = document.getElementById("hotSeatDemandWage");
const hotSeatSquadStatus = document.getElementById("hotSeatSquadStatus");
const hotSeatAppearanceFee = document.getElementById("hotSeatAppearanceFee");
const hotSeatRoundLog = document.getElementById("hotSeatRoundLog");
const btnHotSeatWalkAway = document.getElementById("btnHotSeatWalkAway");
const btnHotSeatCounter = document.getElementById("btnHotSeatCounter");
const btnHotSeatAccept = document.getElementById("btnHotSeatAccept");

export function openHotSeatModal(params = {}, onComplete = null) {
  if (!hotSeatModal) return;
  currentHotSeatCallback = onComplete;

  currentHotSeatSession = openNegotiation({
    playerMarketValue: state?.player?.marketValue || 5000000,
    clubWageBudget: params.clubWageBudget || 30000,
    clubWageCeiling: params.clubWageCeiling || 45000,
    deadlineHoursRemaining: params.deadlineHoursRemaining || 12,
    playerForm: state?.player?.form || 50,
    contractYearsRemaining: state?.player?.contract?.yearsRemaining || 1,
    agentArchetype: state?.player?.agent?.archetype || "family_relative",
    seed: `hotseat-${Date.now()}`,
  });
  if (!currentHotSeatSession) {
    if (onComplete) onComplete(null);
    return;
  }

  renderHotSeatUI();
  hotSeatModal.classList.remove("hidden");
  hotSeatModal.classList.add("flex");
}

function renderHotSeatUI() {
  if (!currentHotSeatSession) return;
  const s = currentHotSeatSession;

  if (hotSeatDeadlineBadge) hotSeatDeadlineBadge.textContent = `${s.hoursRemaining}h Left`;
  if (hotSeatPatienceVal) hotSeatPatienceVal.textContent = `${s.clubPatience}%`;
  if (hotSeatPatienceBar) {
    hotSeatPatienceBar.style.width = `${s.clubPatience}%`;
    hotSeatPatienceBar.className = s.clubPatience < 25
      ? "h-full bg-rose-500 rounded-full transition-all duration-300"
      : s.clubPatience < 50
      ? "h-full bg-amber-500 rounded-full transition-all duration-300"
      : "h-full bg-emerald-500 rounded-full transition-all duration-300";
  }
  if (hotSeatWalkoutWarning) {
    hotSeatWalkoutWarning.textContent = s.clubPatience <= 0
      ? "CLUB HAS WALKED AWAY!"
      : s.clubPatience < 30
      ? "CRITICAL: High walkout risk!"
      : "Walkout risk: Low";
    hotSeatWalkoutWarning.className = s.clubPatience < 30
      ? "text-[10px] text-rose-400 font-black mt-1 block alert-flag"
      : "text-[10px] text-zinc-500 mt-1 block";
  }

  if (hotSeatLeverageVal) hotSeatLeverageVal.textContent = `${s.agentLeverage}%`;
  if (hotSeatLeverageBar) hotSeatLeverageBar.style.width = `${s.agentLeverage}%`;
  if (hotSeatUrgencyVal) hotSeatUrgencyVal.textContent = `${s.managerUrgency}%`;
  if (hotSeatUrgencyBar) hotSeatUrgencyBar.style.width = `${s.managerUrgency}%`;

  const off = s.offeredPerks;
  if (hotSeatCurrentOfferWage) {
    hotSeatCurrentOfferWage.textContent = `Club Offer: €${off.baseWeeklyWage.toLocaleString()} / wk`;
  }
  if (hotSeatDemandWage && !hotSeatDemandWage.value) {
    hotSeatDemandWage.value = Math.round(off.baseWeeklyWage * 1.15);
  }

  if (hotSeatRoundLog) {
    if (s.walkedAway) {
      hotSeatRoundLog.textContent =
        `The club felt insulted by your aggressive demands and abruptly walked out of the room. Talks collapsed.`;
      hotSeatRoundLog.className =
        "text-xs text-rose-400 bg-rose-950/40 border border-rose-500/40 rounded-xl p-3 font-bold";
    } else if (s.dealAgreed) {
      hotSeatRoundLog.textContent =
        `Handshake reached! Terms accepted at €${off.baseWeeklyWage.toLocaleString()}/wk with '${off.squadStatus}' status guarantee.`;
      hotSeatRoundLog.className =
        "text-xs text-emerald-400 bg-emerald-950/40 border border-emerald-500/40 rounded-xl p-3 font-bold";
    } else {
      hotSeatRoundLog.textContent =
        `Round ${s.currentRound} of ${s.maxRounds}: Club offers €${off.baseWeeklyWage.toLocaleString()}/wk. Make your move before deadline ticks away.`;
      hotSeatRoundLog.className = "text-xs text-zinc-400 bg-[#0A0B0A]/60 border border-[#262A26] rounded-xl p-3 italic";
    }
  }

  if (btnHotSeatCounter) btnHotSeatCounter.disabled = s.walkedAway || s.dealAgreed;
  if (btnHotSeatAccept) btnHotSeatAccept.disabled = s.walkedAway;
}

function closeHotSeatModal() {
  if (!hotSeatModal) return;
  hotSeatModal.classList.add("hidden");
  hotSeatModal.classList.remove("flex");
}

/** Attach this module's event listeners. Called once by app.js. */
export function initHotSeat() {
  btnHotSeatCounter?.addEventListener("click", () => {
    if (!currentHotSeatSession || currentHotSeatSession.walkedAway || currentHotSeatSession.dealAgreed) return;
    const demandedWage = Number(hotSeatDemandWage.value) || currentHotSeatSession.offeredPerks.baseWeeklyWage;
    const status = hotSeatSquadStatus?.value || "Important";
    const fee = Number(hotSeatAppearanceFee?.value) || 2500;

    currentHotSeatSession = counterOffer(currentHotSeatSession, {
      demandedWage,
      squadStatus: status,
      appearanceFee: fee,
    });

    renderHotSeatUI();
  });

  btnHotSeatAccept?.addEventListener("click", () => {
    if (!currentHotSeatSession) return;
    const result = closeNegotiation(currentHotSeatSession);

    closeHotSeatModal();
    if (currentHotSeatCallback) {
      currentHotSeatCallback(result);
    }
  });

  btnHotSeatWalkAway?.addEventListener("click", () => {
    closeHotSeatModal();
    if (currentHotSeatCallback) {
      currentHotSeatCallback({ dealAgreed: false, statusMessage: "club_walked_away" });
    }
  });

  btnCloseHotSeatModal?.addEventListener("click", closeHotSeatModal);
}
