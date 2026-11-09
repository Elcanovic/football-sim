// Developer God Menu panel (login, stat overrides, transfers, title grants). The state changes
// it makes go through dev-tools.js.

import { triggerTrophyCelebration } from "./celebration-overlay.js";
import { devApplyOverrides, devGrantTitle, devMaxMorale, devMaxTrust, devTransfer } from "./dev-tools.js";
import { rerender, state } from "./store.js";

let isGodAuthenticated = false;

// God Menu Elements
const btnOpenGodMenu = document.getElementById("btnOpenGodMenu");
const godLoginModal = document.getElementById("godLoginModal");
const godUsername = document.getElementById("godUsername");
const godPassword = document.getElementById("godPassword");
const godLoginError = document.getElementById("godLoginError");
const btnCancelGodLogin = document.getElementById("btnCancelGodLogin");
const btnSubmitGodLogin = document.getElementById("btnSubmitGodLogin");
const godPanelModal = document.getElementById("godPanelModal");
const btnCloseGodPanel = document.getElementById("btnCloseGodPanel");
const godPace = document.getElementById("godPace");
const godShooting = document.getElementById("godShooting");
const godPassing = document.getElementById("godPassing");
const godDribbling = document.getElementById("godDribbling");
const godDefending = document.getElementById("godDefending");
const godPhysical = document.getElementById("godPhysical");
const godAge = document.getElementById("godAge");
const godWage = document.getElementById("godWage");
const godMarketValue = document.getElementById("godMarketValue");
const godContractYears = document.getElementById("godContractYears");
const godSelectClub = document.getElementById("godSelectClub");
const btnGodMaxStats = document.getElementById("btnGodMaxStats");
const btnGodMaxMorale = document.getElementById("btnGodMaxMorale");
const btnGodMaxTrust = document.getElementById("btnGodMaxTrust");
const btnGodTransfer = document.getElementById("btnGodTransfer");
const btnGodApply = document.getElementById("btnGodApply");

function openGodPanel() {
  if (!state || !state.player) {
    alert("Please start a career first before using God Mode!");
    return;
  }

  godPanelModal.classList.remove("hidden");
  godPanelModal.classList.add("flex");

  const p = state.player;
  const a = p.attributes;

  godPace.value = a.pace || a.diving || 90;
  godShooting.value = a.shooting || a.handling || 90;
  godPassing.value = a.passing || a.kicking || 90;
  godDribbling.value = a.dribbling || a.reflexes || 90;
  godDefending.value = a.defending || a.positioning || 90;
  godPhysical.value = a.physical || 90;

  godAge.value = p.age;
  godWage.value = p.contract?.weeklyWage || 150000;
  godMarketValue.value = p.marketValue;
  godContractYears.value = p.contract?.yearsRemaining || 4;

  // Populate club select with all 1,244 clubs
  if (typeof catalogIndex !== "undefined") {
    const allTeams = catalogIndex.getAllTeams();
    allTeams.sort((x, y) => x.name.localeCompare(y.name));
    godSelectClub.innerHTML = allTeams.map((t) => {
      const c = catalogIndex.getCompetition(t.id);
      return `<option value="${t.id}" ${t.id === state.currentTeamId ? "selected" : ""}>${t.name} (${
        c?.name || "League"
      })</option>`;
    }).join("");
  }
}

/** Attach this module's event listeners. Called once by app.js. */
export function initGodMenu() {
  // -------------------------------------------------------------
  // DEVELOPER GOD MENU SYSTEM (Username: admin, Password: admin)
  // -------------------------------------------------------------
  btnOpenGodMenu.addEventListener("click", () => {
    if (isGodAuthenticated) {
      openGodPanel();
    } else {
      godLoginModal.classList.remove("hidden");
      godLoginModal.classList.add("flex");
      godUsername.value = "";
      godPassword.value = "";
      godLoginError.classList.add("hidden");
      godUsername.focus();
    }
  });

  btnCancelGodLogin.addEventListener("click", () => {
    godLoginModal.classList.add("hidden");
    godLoginModal.classList.remove("flex");
  });

  btnSubmitGodLogin.addEventListener("click", () => {
    const u = godUsername.value.trim();
    const p = godPassword.value.trim();

    if (u === "admin" && p === "admin") {
      isGodAuthenticated = true;
      godLoginModal.classList.add("hidden");
      godLoginModal.classList.remove("flex");
      openGodPanel();
    } else {
      godLoginError.classList.remove("hidden");
    }
  });

  btnCloseGodPanel.addEventListener("click", () => {
    godPanelModal.classList.add("hidden");
    godPanelModal.classList.remove("flex");
  });

  btnGodMaxStats.addEventListener("click", () => {
    godPace.value = 99;
    godShooting.value = 99;
    godPassing.value = 99;
    godDribbling.value = 99;
    godDefending.value = 99;
    godPhysical.value = 99;
  });

  btnGodMaxMorale.addEventListener("click", () => {
    if (state && state.player) {
      devMaxMorale();
      alert("Morale boosted to 100%!");
    }
  });

  btnGodMaxTrust.addEventListener("click", () => {
    if (state && state.player) {
      devMaxTrust();
      alert("Coach Trust boosted to 100%!");
    }
  });

  btnGodTransfer.addEventListener("click", () => {
    if (!state || !state.player) return;
    const team = devTransfer(godSelectClub.value, {
      weeklyWage: Number(godWage.value) || 250000,
      years: Number(godContractYears.value) || 4,
    });

    alert(`Teleported to ${team?.name || godSelectClub.value}!`);
    rerender(false);
  });

  // Grant titles: the overlay previews each one, exactly as a won title is celebrated
  document.querySelectorAll(".btn-god-trophy").forEach((btn) => {
    btn.addEventListener("click", () => {
      if (!state || !state.player) return;
      triggerTrophyCelebration(devGrantTitle(btn.dataset.trophy, "trophy"));
      rerender(false);
    });
  });

  document.querySelectorAll(".btn-god-award").forEach((btn) => {
    btn.addEventListener("click", () => {
      if (!state || !state.player) return;
      triggerTrophyCelebration(devGrantTitle(btn.dataset.award, "award"));
      rerender(false);
    });
  });

  btnGodApply.addEventListener("click", () => {
    if (!state || !state.player) return;
    devApplyOverrides({
      six: [godPace, godShooting, godPassing, godDribbling, godDefending, godPhysical].map((el) => Number(el.value)),
      age: Number(godAge.value),
      marketValue: Number(godMarketValue.value),
      weeklyWage: Number(godWage.value),
      contractYears: Number(godContractYears.value),
    });

    godPanelModal.classList.add("hidden");
    godPanelModal.classList.remove("flex");

    alert("God Mode buffs successfully applied!");
    rerender(false);
  });
}
