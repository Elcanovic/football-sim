// Boot deals and brand ambassador showroom.

import { signBoot, signBrand } from "./engine-bridge.js";
import { showSocialToast } from "./social.js";
import { rerender, state } from "./store.js";

const btnOpenBootModal = document.getElementById("btnOpenBootModal");

// Boot Deals & Brand Sponsorships Showroom Elements
const bootModal = document.getElementById("bootModal");
const btnCloseBootModal = document.getElementById("btnCloseBootModal");
const btnDoneBoot = document.getElementById("btnDoneBoot");
const currentBootSection = document.getElementById("currentBootSection");
const tabBootDeals = document.getElementById("tabBootDeals");
const tabBrandDeals = document.getElementById("tabBrandDeals");
const paneBootCatalog = document.getElementById("paneBootCatalog");
const paneBrandSponsorships = document.getElementById("paneBrandSponsorships");
const bootTotalWeeklyPay = document.getElementById("bootTotalWeeklyPay");

// ==========================================
// TECHNICAL BOOT DEALS & LUXURY BRAND AMBASSADORS
// ==========================================
function openBootModal() {
  if (!state || !state.player) {
    alert("Please start a career first to view commercial boot deals!");
    return;
  }
  bootModal.classList.remove("hidden");
  bootModal.classList.add("flex");
  renderBootModal();
}

function closeBootModal() {
  bootModal.classList.add("hidden");
  bootModal.classList.remove("flex");
}

function switchBootTab(tab) {
  if (tab === "boots") {
    tabBootDeals.className =
      "px-4 py-1.5 rounded-xl text-xs font-black bg-purple-600 text-white cursor-pointer transition-all shadow-md";
    tabBrandDeals.className =
      "px-4 py-1.5 rounded-xl text-xs font-black bg-zinc-800 hover:bg-zinc-700 text-zinc-300 cursor-pointer transition-all";
    paneBootCatalog.classList.remove("hidden");
    paneBrandSponsorships.classList.add("hidden");
  } else {
    tabBrandDeals.className =
      "px-4 py-1.5 rounded-xl text-xs font-black bg-purple-600 text-white cursor-pointer transition-all shadow-md";
    tabBootDeals.className =
      "px-4 py-1.5 rounded-xl text-xs font-black bg-zinc-800 hover:bg-zinc-700 text-zinc-300 cursor-pointer transition-all";
    paneBrandSponsorships.classList.remove("hidden");
    paneBootCatalog.classList.add("hidden");
  }
}

function renderBootModal() {
  if (!state || !state.player) return;
  const p = state.player;

  // Total weekly pay from boots + sponsorships
  let totalWeekly = 0;
  if (typeof calculateWeeklySponsorshipEarnings !== "undefined") {
    totalWeekly = calculateWeeklySponsorshipEarnings(p);
  } else {
    if (p.bootDeal) totalWeekly += p.bootDeal.weeklyPay || 0;
    (p.brandSponsorships || []).forEach((b) => {
      if (b.active) totalWeekly += Math.round(b.annualPay / 52);
    });
  }
  if (bootTotalWeeklyPay) {
    bootTotalWeeklyPay.textContent = `€${totalWeekly.toLocaleString()}/wk`;
  }

  // 1. Current Active Boot Deal
  if (p.bootDeal) {
    const bd = p.bootDeal;
    const isSig = bd.signatureBootUnlocked;
    const bonusAttr = bd.statBonus ? `+${bd.statBonus.val} ${bd.statBonus.attr.toUpperCase()}` : "";
    currentBootSection.innerHTML = `
      <div class="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div class="flex items-start gap-3.5">
          <div class="relative shrink-0">
            <div class="w-14 h-14 rounded-2xl bg-purple-500/20 border-2 border-purple-500/40 flex items-center justify-center text-3xl shadow-md">
              👟
            </div>
            ${
      isSig ? `<span class="absolute -top-1.5 -right-1.5 text-xs" title="Signature Edition Unlocked">✨</span>` : ""
    }
          </div>
          <div>
            <div class="flex items-center gap-2 flex-wrap">
              <h4 class="text-base font-black text-white">${bd.brand} ${bd.modelName}</h4>
              <span class="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">${bd.tier}</span>
              ${
      isSig
        ? `<span class="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40">👑 Custom Signature Line</span>`
        : ""
    }
            </div>
            <div class="text-xs text-purple-200/90 font-medium mt-0.5">Colorway: <strong class="text-white">${bd.colorway}</strong></div>
            <div class="flex items-center gap-4 mt-2 text-xs font-semibold text-zinc-300 flex-wrap">
              <span>Weekly Endorsement: <strong class="text-emerald-400 font-black">€${bd.weeklyPay.toLocaleString()}/wk</strong></span>
              ${
      bonusAttr ? `<span>Performance Bonus: <strong class="text-sky-400 font-black">${bonusAttr}</strong></span>` : ""
    }
              <span class="text-zinc-400 italic font-normal">"${bd.quote}"</span>
            </div>
          </div>
        </div>
      </div>
    `;
  } else {
    currentBootSection.innerHTML = `
      <div class="flex items-center gap-3 p-2">
        <div class="w-12 h-12 rounded-xl bg-zinc-800 text-zinc-400 flex items-center justify-center text-xl">👟</div>
        <div>
          <h4 class="text-sm font-black text-white">No Technical Boot Deal Active</h4>
          <p class="text-xs text-zinc-400 mt-0.5">Sign an endorsement with Nike, Adidas, Puma, or Mizuno to unlock stat bonuses and weekly sponsorship revenue.</p>
        </div>
      </div>
    `;
  }

  // 2. Technical Boots Catalog
  const availableDeals = typeof getAvailableBootDeals !== "undefined" ? getAvailableBootDeals(p) : [];
  paneBootCatalog.innerHTML = availableDeals.map((d) => {
    const isCurrent = p.bootDeal && p.bootDeal.id === d.id;
    const bonusAttr = d.statBonus ? `+${d.statBonus.val} ${d.statBonus.attr.toUpperCase()}` : "";
    const tierBadge = d.tier === "Signature Icon"
      ? "bg-amber-500/20 text-amber-300 border-amber-500/40"
      : d.tier === "Headline Pro"
      ? "bg-purple-500/20 text-purple-300 border-purple-500/40"
      : d.tier === "Rising Star"
      ? "bg-sky-500/20 text-sky-300 border-sky-500/40"
      : "bg-zinc-800 text-zinc-400 border-zinc-700";

    return `
      <div class="relative p-3.5 rounded-2xl border ${
      isCurrent
        ? "border-purple-500 bg-purple-950/20 ring-1 ring-purple-500/40"
        : "border-zinc-800 bg-zinc-950/70 hover:border-zinc-700"
    } transition-all flex flex-col justify-between">
        <div>
          <div class="flex items-start justify-between gap-2 mb-2">
            <div>
              <span class="text-[9px] font-black uppercase tracking-wider text-purple-400">${d.brand}</span>
              <h5 class="text-sm font-black text-white leading-tight">${d.modelName}</h5>
            </div>
            <span class="text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full border shrink-0 ${tierBadge}">${d.tier}</span>
          </div>

          <div class="text-[11px] text-zinc-400 mb-1">Color: <span class="text-zinc-200 font-bold">${d.colorway}</span></div>
          <p class="text-[11px] text-zinc-400 italic mb-2.5 leading-snug line-clamp-2">"${d.quote}"</p>

          <div class="flex items-center justify-between py-1.5 px-2.5 rounded-xl bg-zinc-900/80 border border-zinc-800/80 mb-3 text-xs">
            <span class="text-zinc-400 font-bold text-[10px] uppercase">Attribute Perk</span>
            <span class="font-black text-sky-400">${bonusAttr || "None"}</span>
          </div>
        </div>

        <div class="flex items-center justify-between pt-2 border-t border-zinc-800/80">
          <div>
            <span class="text-zinc-500 text-[9px] block uppercase font-bold">Endorsement Pay</span>
            <strong class="text-emerald-400 font-black text-xs">€${d.weeklyPay.toLocaleString()}/wk</strong>
          </div>

          ${
      isCurrent
        ? `
            <span class="px-3 py-1 rounded-xl bg-purple-500/20 text-purple-300 border border-purple-500/40 text-[11px] font-black">
              ✓ Active
            </span>
          `
        : `
            <button type="button" data-boot-id="${d.id}" class="btn-sign-boot px-3.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-[11px] font-black transition-all shadow-md shadow-purple-600/20 active:scale-95 cursor-pointer">
              Sign Boot
            </button>
          `
    }
        </div>
      </div>
    `;
  }).join("");

  document.querySelectorAll(".btn-sign-boot").forEach((btn) => {
    btn.addEventListener("click", () => {
      const bootId = btn.dataset.bootId;
      handleSignBoot(bootId);
    });
  });

  // 3. Luxury Brand Ambassadors Catalog
  const brandList = typeof getAvailableBrandSponsorships !== "undefined" ? getAvailableBrandSponsorships(p) : [];
  paneBrandSponsorships.innerHTML = brandList.map((b) => {
    const isSigned = b.active;
    const qualifies = p.overall >= b.reputationRequired;
    const catIcons = { luxury_watch: "⌚", fashion_house: "👜", gaming_cover: "🎮", automotive: "🏎️" };
    const icon = catIcons[b.category] || "💎";

    return `
      <div class="relative p-4 rounded-2xl border ${
      isSigned
        ? "border-amber-500/70 bg-amber-950/20 ring-1 ring-amber-500/40"
        : "border-zinc-800 bg-zinc-950/70 hover:border-zinc-700"
    } transition-all flex flex-col justify-between">
        <div>
          <div class="flex items-start justify-between gap-2 mb-2">
            <div class="flex items-center gap-2.5">
              <span class="text-2xl">${icon}</span>
              <div>
                <h5 class="text-sm font-black text-white">${b.brandName}</h5>
                <span class="text-[10px] text-zinc-400 capitalize font-bold">${b.category.replace(/_/g, " ")}</span>
              </div>
            </div>
            <span class="text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full border ${
      qualifies
        ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
        : "bg-zinc-800 text-zinc-400 border-zinc-700"
    }">
              ${qualifies ? "Qualified" : `Req: ${b.reputationRequired} OVR`}
            </span>
          </div>

          <div class="grid grid-cols-2 gap-2 my-3 p-2 rounded-xl bg-zinc-900/80 border border-zinc-800/80 text-center">
            <div>
              <div class="text-[9px] uppercase font-bold text-zinc-400">Annual Dividend</div>
              <div class="text-xs font-black text-emerald-400">€${b.annualPay.toLocaleString()}/yr</div>
            </div>
            <div>
              <div class="text-[9px] uppercase font-bold text-zinc-400">Weekly Payout</div>
              <div class="text-xs font-black text-purple-400">+€${
      Math.round(b.annualPay / 52).toLocaleString()
    }/wk</div>
            </div>
          </div>
        </div>

        <div class="flex items-center justify-between pt-2 border-t border-zinc-800/80">
          <span class="text-[10px] text-zinc-400">Global Campaign Signing Bonus: <strong class="text-white">+80K fans</strong></span>
          ${
      isSigned
        ? `
            <span class="px-3 py-1 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[11px] font-black">
              ✓ Active Ambassador
            </span>
          `
        : qualifies
        ? `
            <button type="button" data-brand-id="${b.id}" class="btn-sign-brand px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-zinc-950 text-[11px] font-black transition-all shadow-md shadow-amber-500/20 active:scale-95 cursor-pointer">
              Sign Ambassador
            </button>
          `
        : `
            <button disabled class="px-3.5 py-1.5 rounded-xl bg-zinc-800 text-zinc-500 text-[11px] font-bold cursor-not-allowed">
              Locked (${b.reputationRequired} OVR)
            </button>
          `
    }
        </div>
      </div>
    `;
  }).join("");

  document.querySelectorAll(".btn-sign-brand").forEach((btn) => {
    btn.addEventListener("click", () => {
      const brandId = btn.dataset.brandId;
      handleSignBrand(brandId);
    });
  });
}

function handleSignBoot(modelId) {
  if (!state || !state.player) return;
  const res = signBoot(modelId);
  if (res) {
    showSocialToast("sponsorship", {
      title: "👟 Boot Supplier Signed",
      gain: `€${res.deal.weeklyPay.toLocaleString()}/wk`,
      message: res.message,
      icon: "👟",
    });
    renderBootModal();
    rerender(false);
  }
}

function handleSignBrand(brandId) {
  if (!state || !state.player) return;
  const res = signBrand(brandId);
  if (res) {
    if (res.success) {
      showSocialToast("sponsorship", {
        title: "💎 Brand Ambassador Deal",
        gain: `+€${res.sponsorship?.annualPay.toLocaleString()}/yr`,
        message: res.message,
        icon: "💎",
      });
      renderBootModal();
      rerender(false);
    } else {
      alert(res.message);
    }
  }
}

/** Attach this module's event listeners. Called once by app.js. */
export function initBootsModal() {
  btnOpenBootModal?.addEventListener("click", openBootModal);

  btnCloseBootModal?.addEventListener("click", closeBootModal);

  btnDoneBoot?.addEventListener("click", closeBootModal);

  bootModal?.addEventListener("click", (e) => {
    if (e.target === bootModal) closeBootModal();
  });

  tabBootDeals?.addEventListener("click", () => switchBootTab("boots"));

  tabBrandDeals?.addEventListener("click", () => switchBootTab("brands"));
}
