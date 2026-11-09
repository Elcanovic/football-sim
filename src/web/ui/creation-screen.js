// Player creation screen: nationality picker (including dual nationality), position and
// foot selection, and starting a new career.

import { resetCareerView } from "./career-view.js";
import { screenCareer, screenCreation, screenSummary } from "./dom.js";
import { startCareer } from "./engine-bridge.js";
import { rerender } from "./store.js";

// Player Creation Elements
const inputLastName = document.getElementById("inputLastName");
const inputNumber = document.getElementById("inputNumber");
const selectMode = document.getElementById("selectMode");
const selectProfile = document.getElementById("selectProfile");
const btnStartCareer = document.getElementById("btnStartCareer");
const btnNewCareer = document.getElementById("btnNewCareer");
const btnPlayAgain = document.getElementById("btnPlayAgain");

// Country Modal Elements
const btnOpenCountryModal = document.getElementById("btnOpenCountryModal");
const btnCloseCountryModal = document.getElementById("btnCloseCountryModal");
const countryModal = document.getElementById("countryModal");
const inputSearchCountry = document.getElementById("inputSearchCountry");
const countryGrid = document.getElementById("countryGrid");
const selectedCountryFlag = document.getElementById("selectedCountryFlag");
const selectedCountryName = document.getElementById("selectedCountryName");
const topNavFlag = document.getElementById("topNavFlag");

// Dual Nationality Elements & State
const toggleDualNat = document.getElementById("toggleDualNat");
const rowSecondCountry = document.getElementById("rowSecondCountry");
const btnOpenSecondCountryModal = document.getElementById("btnOpenSecondCountryModal");
const selectedSecondCountryFlag = document.getElementById("selectedSecondCountryFlag");
const selectedSecondCountryName = document.getElementById("selectedSecondCountryName");
let isDualNatEnabled = false;
let selectedSecondCountryIso = "IT";
let countryPickerTarget = "primary"; // 'primary' or 'second'

// Local Selection
let selectedCountryIso = "AR";
let selectedPosition = "ST";
let selectedFoot = "right";

export function renderCountryGrid(filter) {
  if (typeof CATALOG === "undefined" || !CATALOG.countries) return;

  const countries = CATALOG.countries.filter((c) => {
    if (!c.iso_alpha2) return false;
    if (!filter) return true;
    return (
      c.name_en.toLowerCase().includes(filter) ||
      c.name_es.toLowerCase().includes(filter) ||
      c.fifa_code.toLowerCase().includes(filter)
    );
  });

  const priorityCodes = [
    "AR",
    "BR",
    "ES",
    "FR",
    "ENG",
    "DE",
    "IT",
    "PT",
    "NL",
    "UY",
    "CO",
    "MX",
    "US",
    "CL",
    "BE",
    "HR",
    "SN",
    "MA",
    "JP",
  ];
  countries.sort((a, b) => {
    if (!filter) {
      const aP = priorityCodes.indexOf(a.fifa_code);
      const bP = priorityCodes.indexOf(b.fifa_code);
      if (aP !== -1 && bP !== -1) return aP - bP;
      if (aP !== -1) return -1;
      if (bP !== -1) return 1;
    }
    return a.name_en.localeCompare(b.name_en);
  });

  const targetIso = countryPickerTarget === "second" ? selectedSecondCountryIso : selectedCountryIso;

  countryGrid.innerHTML = countries.map((c) => {
    const isSelected = c.iso_alpha2 === targetIso;
    return `
      <button type="button" data-iso="${c.iso_alpha2}" class="country-tile flex items-center gap-2.5 p-2 rounded-xl border transition-all text-left cursor-pointer ${
      isSelected
        ? "bg-emerald-500/20 border-emerald-500 text-white font-extrabold ring-1 ring-emerald-500"
        : "bg-zinc-950/70 border-zinc-800 text-zinc-300 hover:bg-zinc-800/80 hover:text-white"
    }">
        <img src="${c.flag_url}" class="w-7 h-5 object-cover rounded shadow-sm border border-zinc-700 shrink-0" alt="" loading="lazy">
        <div class="min-w-0 flex-1">
          <div class="text-xs truncate font-bold">${c.name_en}</div>
          <div class="text-[10px] text-zinc-400 font-mono">${c.fifa_code} • ${c.confederation}</div>
        </div>
      </button>
    `;
  }).join("");

  document.querySelectorAll(".country-tile").forEach((tile) => {
    tile.addEventListener("click", () => {
      const iso = tile.dataset.iso;
      const c = CATALOG.countries.find((x) => x.iso_alpha2 === iso);
      if (c) {
        if (countryPickerTarget === "second") {
          selectedSecondCountryIso = c.iso_alpha2;
          if (selectedSecondCountryFlag) selectedSecondCountryFlag.src = c.flag_url;
          if (selectedSecondCountryName) selectedSecondCountryName.textContent = `${c.name_en} (${c.fifa_code})`;
        } else {
          selectedCountryIso = c.iso_alpha2;
          selectedCountryFlag.src = c.flag_url;
          selectedCountryName.textContent = `${c.name_en} (${c.fifa_code})`;
          topNavFlag.src = c.flag_url;
        }
        countryModal.classList.add("hidden");
        countryModal.classList.remove("flex");
      }
    });
  });
}

function resetToCreation() {
  screenCreation.classList.remove("hidden");
  screenCareer.classList.add("hidden");
  screenSummary.classList.add("hidden");
  resetCareerView();
}

/** Attach this module's event listeners. Called once by app.js. */
export function initCreationScreen() {
  // Strict input clamping on preferred number (1 - 99)
  if (inputNumber) {
    inputNumber.addEventListener("input", () => {
      const val = parseInt(inputNumber.value, 10);
      if (isNaN(val)) return;
      if (val > 99) inputNumber.value = "99";
      if (val < 1) inputNumber.value = "1";
    });
    inputNumber.addEventListener("blur", () => {
      const val = parseInt(inputNumber.value, 10);
      if (isNaN(val) || val < 1) inputNumber.value = "1";
      else if (val > 99) inputNumber.value = "99";
    });
  }

  // Country Modal logic
  btnOpenCountryModal.addEventListener("click", () => {
    countryPickerTarget = "primary";
    countryModal.classList.remove("hidden");
    countryModal.classList.add("flex");
    inputSearchCountry.value = "";
    renderCountryGrid("");
    inputSearchCountry.focus();
  });

  if (btnOpenSecondCountryModal) {
    btnOpenSecondCountryModal.addEventListener("click", () => {
      countryPickerTarget = "second";
      countryModal.classList.remove("hidden");
      countryModal.classList.add("flex");
      inputSearchCountry.value = "";
      renderCountryGrid("");
      inputSearchCountry.focus();
    });
  }

  if (toggleDualNat) {
    toggleDualNat.addEventListener("change", () => {
      isDualNatEnabled = toggleDualNat.checked;
      if (rowSecondCountry) {
        if (isDualNatEnabled) {
          rowSecondCountry.classList.remove("hidden");
        } else {
          rowSecondCountry.classList.add("hidden");
        }
      }
    });
  }

  btnCloseCountryModal.addEventListener("click", () => {
    countryModal.classList.add("hidden");
    countryModal.classList.remove("flex");
  });

  countryModal.addEventListener("click", (e) => {
    if (e.target === countryModal) {
      countryModal.classList.add("hidden");
      countryModal.classList.remove("flex");
    }
  });

  inputSearchCountry.addEventListener("input", (e) => {
    renderCountryGrid(e.target.value.toLowerCase().trim());
  });

  // Setup Position buttons
  document.querySelectorAll(".btn-pos").forEach((btn) => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".btn-pos").forEach((b) => {
        b.classList.remove("border-emerald-500", "bg-emerald-500/20", "text-emerald-400");
        b.classList.add("border-zinc-800", "bg-zinc-950", "text-zinc-400");
        b.setAttribute("aria-pressed", "false");
      });
      btn.classList.remove("border-zinc-800", "bg-zinc-950", "text-zinc-400");
      btn.classList.add("border-emerald-500", "bg-emerald-500/20", "text-emerald-400");
      btn.setAttribute("aria-pressed", "true");
      selectedPosition = btn.dataset.pos;
    });
  });

  // Setup Foot buttons
  document.querySelectorAll(".btn-foot").forEach((btn) => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".btn-foot").forEach((b) => {
        b.classList.remove("border-emerald-500", "bg-emerald-500/20", "text-emerald-400");
        b.classList.add("border-zinc-800", "bg-zinc-950", "text-zinc-400");
        b.setAttribute("aria-pressed", "false");
      });
      btn.classList.remove("border-zinc-800", "bg-zinc-950", "text-zinc-400");
      btn.classList.add("border-emerald-500", "bg-emerald-500/20", "text-emerald-400");
      btn.setAttribute("aria-pressed", "true");
      selectedFoot = btn.dataset.foot;
    });
  });

  btnNewCareer.addEventListener("click", resetToCreation);

  btnPlayAgain.addEventListener("click", resetToCreation);

  // Start Career Button
  btnStartCareer.addEventListener("click", async () => {
    btnStartCareer.disabled = true;
    btnStartCareer.setAttribute("aria-busy", "true");
    btnStartCareer.innerHTML = '<span class="pulse" aria-hidden="true"></span><span>Scouting clubs…</span>';

    resetCareerView();

    try {
      await startCareer({
        lastName: inputLastName.value || "Valente",
        preferredNumber: Number(inputNumber.value) || 10,
        preferredFoot: selectedFoot,
        nationalityIso: selectedCountryIso,
        position: selectedPosition,
        mode: selectMode.value,
        developmentProfile: selectProfile.value,
        secondNationalityIso: isDualNatEnabled ? selectedSecondCountryIso : undefined,
      });
      rerender(true);
    } catch (err) {
      console.error("Error starting career:", err);
    } finally {
      btnStartCareer.disabled = false;
      btnStartCareer.removeAttribute("aria-busy");
      btnStartCareer.innerHTML = "<span>Start Career</span><span>→</span>";
    }
  });
}
