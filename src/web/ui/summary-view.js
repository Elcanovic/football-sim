// Retirement summary: career eras, silverware sanctuary, social legacy and the Prime Icon card.

import { screenCareer, screenCreation, screenSummary } from "./dom.js";
import { formatCurrency, formatSocialFollowers } from "./format.js";
import { state } from "./store.js";
import { collectSilverware, INDIVIDUAL_AWARD_KEYS, renderTrophyStack } from "./trophies.js";

// Museum Gallery Elements in Summary
const sumTabBtnEras = document.getElementById("sumTabBtnEras");
const sumTabBtnTrophies = document.getElementById("sumTabBtnTrophies");
const sumTabBtnSocial = document.getElementById("sumTabBtnSocial");
const sumTabBtnCard = document.getElementById("sumTabBtnCard");
const sumPaneEras = document.getElementById("sumPaneEras");
const sumPaneTrophies = document.getElementById("sumPaneTrophies");
const sumPaneSocial = document.getElementById("sumPaneSocial");
const sumPaneCard = document.getElementById("sumPaneCard");

// Prime Icon Card Labels
const cardLblPAC = document.getElementById("cardLblPAC");
const cardLblDRI = document.getElementById("cardLblDRI");
const cardLblSHO = document.getElementById("cardLblSHO");
const cardLblDEF = document.getElementById("cardLblDEF");
const cardLblPAS = document.getElementById("cardLblPAS");
const cardLblPHY = document.getElementById("cardLblPHY");

export function renderSummary() {
  screenCreation.classList.add("hidden");
  screenCareer.classList.add("hidden");
  screenSummary.classList.remove("hidden");

  const p = state.player;
  const totals = p.careerTotals;

  // Peak Overall & Granular Best Stats across all snapshots
  let peakOverall = p.overall;
  let bestPac = p.attributes.pace || 50;
  let bestSho = p.attributes.shooting || 50;
  let bestPas = p.attributes.passing || 50;
  let bestDri = p.attributes.dribbling || 50;
  let bestDef = p.attributes.defending || 50;
  let bestPhy = p.attributes.physical || 50;

  let bestDiv = p.attributes.diving || 50;
  let bestHan = p.attributes.handling || 50;
  let bestKic = p.attributes.kicking || 50;
  let bestRef = p.attributes.reflexes || 50;
  let bestPos = p.attributes.positioning || 50;

  state.seasons.forEach((s) => {
    if (s.overall > peakOverall) peakOverall = s.overall;
    if (s.attributes) {
      if (s.attributes.pace > bestPac) bestPac = s.attributes.pace;
      if (s.attributes.shooting > bestSho) bestSho = s.attributes.shooting;
      if (s.attributes.passing > bestPas) bestPas = s.attributes.passing;
      if (s.attributes.dribbling > bestDri) bestDri = s.attributes.dribbling;
      if (s.attributes.defending > bestDef) bestDef = s.attributes.defending;
      if (s.attributes.physical > bestPhy) bestPhy = s.attributes.physical;

      if (s.attributes.diving > bestDiv) bestDiv = s.attributes.diving;
      if (s.attributes.handling > bestHan) bestHan = s.attributes.handling;
      if (s.attributes.kicking > bestKic) bestKic = s.attributes.kicking;
      if (s.attributes.reflexes > bestRef) bestRef = s.attributes.reflexes;
      if (s.attributes.positioning > bestPos) bestPos = s.attributes.positioning;
    }
  });

  // Calculate authentic career legacy title
  const allTrophies = state.seasons.flatMap((s) => s.trophies);
  const allAwards = state.seasons.flatMap((s) => s.awards);
  const hasWorldCup = allTrophies.includes("world_cup");
  const hasBallonDor = allAwards.includes("ballon_dor");
  const hasUcl = allTrophies.includes("continental_primary");

  let legacyTitle = "Distinguished Professional Footballer";
  if (hasWorldCup && hasBallonDor && totals.goals >= 300) {
    legacyTitle = "👑 Immortal Legend & GOAT Contender";
  } else if (hasBallonDor) {
    legacyTitle = "🥇 Global Superstar & Ballon d'Or Winner";
  } else if (hasWorldCup) {
    legacyTitle = "🌍 World Champion & National Hero";
  } else if (hasUcl) {
    legacyTitle = "🏆 European & Continental Champion";
  } else if (totals.trophies >= 8) {
    legacyTitle = "⭐ Serial Champion & Silverware Legend";
  } else if (totals.goals >= 250) {
    legacyTitle = "⚽ Prolific Goalscoring Phenom";
  }

  // Summary Top Cards
  document.getElementById("sumPlayerName").textContent = p.lastName;
  document.getElementById("sumPlayerFlag").src = p.nationality.flag_url;
  document.getElementById("sumPrimeRatingBadge").textContent = `${peakOverall} OVR`;
  document.getElementById("sumCareerTitle").textContent = legacyTitle;
  const retirementNoteEl = document.getElementById("sumRetirementNote");
  if (retirementNoteEl) {
    if (state.retirementReason) {
      retirementNoteEl.textContent = `Career Concluded at Age ${p.age}: ${state.retirementReason}`;
      retirementNoteEl.classList.remove("hidden");
    } else {
      retirementNoteEl.textContent = `Career Concluded at Age ${p.age}`;
    }
  }
  document.getElementById("sumApps").textContent = totals.appearances;
  document.getElementById("sumGoals").textContent = totals.goals;
  const sumAssistsEl = document.getElementById("sumAssists");
  if (sumAssistsEl) sumAssistsEl.textContent = totals.assists || 0;
  document.getElementById("sumTrophies").textContent = totals.trophies;
  document.getElementById("sumWages").textContent = formatCurrency(totals.totalWagesEarned);
  document.getElementById("sumFollowers").textContent = formatSocialFollowers(p.socialMedia?.totalFollowers || 0);

  // TAB 1: Chronological Club Eras Scrapbook (stacked trophies with hover flex)
  const eras = [];
  let currentEra = null;

  state.seasons.forEach((s) => {
    if (!currentEra || currentEra.teamId !== s.teamId) {
      if (currentEra) eras.push(currentEra);
      currentEra = {
        teamId: s.teamId,
        startAge: s.age,
        endAge: s.age,
        seasonsCount: 1,
        appearances: s.stats.appearances,
        goals: s.stats.goals,
        assists: s.stats.assists,
        trophies: [...s.trophies],
        awards: [...s.awards],
      };
    } else {
      currentEra.endAge = s.age;
      currentEra.seasonsCount += 1;
      currentEra.appearances += s.stats.appearances;
      currentEra.goals += s.stats.goals;
      currentEra.assists += s.stats.assists;
      currentEra.trophies.push(...s.trophies);
      currentEra.awards.push(...s.awards);
    }
  });
  if (currentEra) eras.push(currentEra);

  document.getElementById("sumErasCount").textContent = `${eras.length} Distinct Club Chapter${
    eras.length === 1 ? "" : "s"
  }`;
  const sumErasGrid = document.getElementById("sumErasGrid");
  sumErasGrid.innerHTML = eras.map((era, idx) => {
    const team = catalogIndex.getTeam(era.teamId);
    const comp = catalogIndex.getCompetition(era.teamId);
    const teamName = team ? (team.short_name || team.name) : era.teamId;
    const eraTitle = idx === 0
      ? "The Breakthrough Chapter"
      : (idx === eras.length - 1 ? "The Veteran Farewell" : "The Prime Dynasty");

    const eraSeasons = state.seasons.filter((s) =>
      s.teamId === era.teamId && s.age >= era.startAge && s.age <= era.endAge
    );
    const eraGroups = collectSilverware(eraSeasons, { trophies: true, awards: true });
    const silverwareHtml = eraGroups.length > 0 ? eraGroups.map((g) => renderTrophyStack(g, "sm")).join("") : "";

    return `
      <div class="relative overflow-hidden bg-zinc-950/80 border border-zinc-800/80 hover:border-zinc-700 rounded-2xl p-4 transition-all hover-lift">
        ${
      team
        ? `<img src="${team.logo_url}" class="pointer-events-none absolute -right-4 -bottom-4 w-28 h-28 object-contain opacity-5 grayscale" alt="">`
        : ""
    }
        <div class="relative z-10 flex items-start justify-between gap-3 mb-3">
          <div class="flex items-center gap-2.5">
            <img src="${team ? team.logo_url : ""}" class="w-10 h-10 object-contain drop-shadow shrink-0" alt="">
            <div>
              <span class="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">${eraTitle}</span>
              <h5 class="font-black text-white text-base mt-0.5">${teamName}</h5>
              <span class="text-[10px] text-zinc-400 font-bold">${
      comp?.name || "League"
    } • Age ${era.startAge} - ${era.endAge} (${era.seasonsCount} season${era.seasonsCount === 1 ? "" : "s"})</span>
            </div>
          </div>
        </div>
        <div class="relative z-10 grid grid-cols-3 gap-2 py-2 border-t border-b border-zinc-800/80 text-center text-xs">
          <div>
            <div class="text-[9px] uppercase font-bold text-zinc-400">Matches</div>
            <div class="font-black text-white text-sm">${era.appearances}</div>
          </div>
          <div>
            <div class="text-[9px] uppercase font-bold text-zinc-400">Goals</div>
            <div class="font-black text-emerald-400 text-sm">${era.goals}</div>
          </div>
          <div>
            <div class="text-[9px] uppercase font-bold text-zinc-400">Trophies</div>
            <div class="font-black text-amber-400 text-sm">${era.trophies.length + era.awards.length}</div>
          </div>
        </div>
        <div class="relative z-10 mt-3 pt-2.5 border-t border-zinc-800/80 flex items-center justify-between gap-2 text-xs">
          <span class="text-[10px] text-zinc-400 font-bold shrink-0">Era Silverware:</span>
          <div class="flex items-center gap-2 flex-wrap justify-end">
            ${silverwareHtml || `<span class="text-[10px] text-zinc-500 italic">No silverware in this era</span>`}
          </div>
        </div>
      </div>
    `;
  }).join("");

  // TAB 2: Silverware Cabinet (Specific titles, authentic stacking, five distinct zones)
  function renderCabinetShelf(containerId, groups, emptyMessage) {
    const cont = document.getElementById(containerId);
    if (!cont) return;
    if (!groups || groups.length === 0) {
      cont.innerHTML = `
        <div class="col-span-full py-4 px-3 text-center text-zinc-500 font-semibold text-xs italic bg-zinc-950/40 rounded-xl border border-zinc-800/50">
          ${emptyMessage}
        </div>`;
      return;
    }
    cont.innerHTML = groups.map((g) => {
      const stackHtml = renderTrophyStack(g, "lg");
      const clubBadgesHtml = g.teamIds.map((tId) => {
        const t = catalogIndex?.getTeam(tId);
        return t ? `<img src="${t.logo_url}" class="w-4 h-4 object-contain drop-shadow" title="${t.name}" alt="">` : "";
      }).filter(Boolean).join(" ");

      const isAward = INDIVIDUAL_AWARD_KEYS.includes(g.key);
      const winLabel = isAward ? `${g.count}× Recipient` : `${g.count}× Champion${g.count > 1 ? "s" : ""}`;
      const agesStr = g.ages.length ? `Won at age ${g.ages.join(", ")}` : "";

      return `
        <div class="relative overflow-hidden flex items-center justify-between gap-3 p-3.5 rounded-2xl border border-zinc-800/80 bg-zinc-950/90 shadow-md hover-lift transition-all hover:border-zinc-700">
          <div class="flex items-center gap-3.5 min-w-0">
            <div class="shrink-0 flex items-center">
              ${stackHtml}
            </div>
            <div class="min-w-0">
              <h5 class="font-black text-xs sm:text-sm text-white truncate" title="${g.name}">${g.name}</h5>
              <div class="flex items-center gap-2 mt-0.5 flex-wrap">
                <span class="text-[11px] text-amber-400 font-black">${winLabel}</span>
                ${clubBadgesHtml ? `<div class="flex items-center gap-1">${clubBadgesHtml}</div>` : ""}
              </div>
              ${
        agesStr ? `<span class="text-[10px] text-zinc-400 font-medium block truncate mt-0.5">${agesStr}</span>` : ""
      }
            </div>
          </div>
        </div>
      `;
    }).join("");
  }

  const intlGroups = collectSilverware(state.seasons, {
    trophies: true,
    awards: false,
    filter: (k) => k === "world_cup" || k === "national_continental",
  });
  const continentalGroups = collectSilverware(state.seasons, {
    trophies: true,
    awards: false,
    filter: (k) => k === "continental_primary" || k === "continental_secondary",
  });
  const leagueGroups = collectSilverware(state.seasons, {
    trophies: true,
    awards: false,
    filter: (k) => k === "league",
  });
  const cupGroups = collectSilverware(state.seasons, {
    trophies: true,
    awards: false,
    filter: (k) => k === "cup",
  });
  const awardGroups = collectSilverware(state.seasons, {
    trophies: false,
    awards: true,
  });

  renderCabinetShelf("sumShelfInternational", intlGroups, "No national team major silverware won.");
  renderCabinetShelf("sumShelfContinental", continentalGroups, "No continental club silverware won.");
  renderCabinetShelf("sumShelfLeagues", leagueGroups, "No domestic league championships won.");
  renderCabinetShelf("sumShelfCups", cupGroups, "No domestic knockout cups won.");
  renderCabinetShelf("sumShelfAwards", awardGroups, "No individual honors earned.");

  // TAB 3: Creator & Social Legacy
  const sm = p.socialMedia || { totalFollowers: 0, instagram: {}, tiktok: {}, x: {} };
  const tf = sm.totalFollowers || 0;

  const plaques = [
    { name: "Silver Creator Plaque", req: 100000, icon: "🥈", unlocked: tf >= 100000 },
    { name: "Gold Creator Plaque", req: 1000000, icon: "🥇", unlocked: tf >= 1000000 },
    { name: "Diamond Creator Plaque", req: 10000000, icon: "💎", unlocked: tf >= 10000000 },
    { name: "Red Diamond Global Icon", req: 50000000, icon: "👑", unlocked: tf >= 50000000 },
  ];
  document.getElementById("sumPlaquesContainer").innerHTML = plaques.map((pl) => `
    <div class="p-3 rounded-xl border text-center transition-all ${
    pl.unlocked
      ? "bg-amber-500/10 border-amber-500/40 text-white"
      : "bg-zinc-950/40 border-zinc-800/60 text-zinc-600 opacity-60"
  }">
      <span class="text-2xl">${pl.icon}</span>
      <div class="text-[10px] font-black uppercase tracking-wider mt-1">${pl.name}</div>
      <div class="text-[9px] font-bold ${pl.unlocked ? "text-amber-400" : "text-zinc-500"} mt-0.5">${
    pl.unlocked ? "UNLOCKED" : `${formatSocialFollowers(pl.req)} Req`
  }</div>
    </div>
  `).join("");

  const ig = sm.instagram || {};
  document.getElementById("sumInstaHandle").textContent = ig.handle || "@player";
  document.getElementById("sumInstaFollowers").textContent = formatSocialFollowers(ig.followers || 0);
  document.getElementById("sumInstaPosts").textContent = `${ig.totalPosts || 0} Posts shared`;
  document.getElementById("sumInstaStatus").textContent = ig.active
    ? (ig.verified ? "Verified ✓" : "Active")
    : "Inactive";

  const tt = sm.tiktok || {};
  document.getElementById("sumTikTokHandle").textContent = tt.handle || "@player";
  document.getElementById("sumTikTokFollowers").textContent = formatSocialFollowers(tt.followers || 0);
  document.getElementById("sumTikTokPosts").textContent = `${tt.totalPosts || 0} Clips posted`;
  document.getElementById("sumTikTokStatus").textContent = tt.active
    ? (tt.verified ? "Verified ✓" : "Active")
    : "Inactive";

  const xAcc = sm.x || {};
  document.getElementById("sumXHandle").textContent = xAcc.handle || "@player";
  document.getElementById("sumXFollowers").textContent = formatSocialFollowers(xAcc.followers || 0);
  document.getElementById("sumXPosts").textContent = `${xAcc.totalPosts || 0} Tweets posted`;
  document.getElementById("sumXStatus").textContent = xAcc.active
    ? (xAcc.verified ? "Verified ✓" : "Active")
    : "Inactive";

  const commercialVal = Math.round(tf * 2.2 + totals.trophies * 600000 + totals.goals * 30000);
  document.getElementById("sumCommercialValue").textContent = formatCurrency(commercialVal);

  const activeChoices = (p.lifestyleChoices || []).filter((c) => c.active);
  document.getElementById("sumActiveLifestyles").innerHTML = activeChoices.map((c) => `
    <span class="text-[10px] font-bold px-2.5 py-1 rounded-lg bg-zinc-900 border border-zinc-700 text-zinc-200 flex items-center gap-1.5" title="${c.description}">
      <span>${c.icon}</span>
      <span>${c.name}</span>
    </span>
  `).join("") || `<span class="text-xs text-zinc-500 italic">No commercial lifestyles active</span>`;

  // TAB 4: Prime Icon Card
  document.getElementById("cardPrimeOvr").textContent = peakOverall;
  document.getElementById("cardPrimePos").textContent = p.position;
  document.getElementById("cardPrimeFlag").src = p.nationality.flag_url;
  document.getElementById("cardPrimeName").textContent = p.lastName.toUpperCase();
  document.getElementById("cardPrimeLegacy").textContent = legacyTitle.replace(/^[^\s]+\s/, "");

  const isGk = p.position === "GK";
  if (isGk) {
    if (cardLblPAC) cardLblPAC.textContent = "DIV";
    if (cardLblDRI) cardLblDRI.textContent = "REF";
    if (cardLblSHO) cardLblSHO.textContent = "HAN";
    if (cardLblDEF) cardLblDEF.textContent = "POS";
    if (cardLblPAS) cardLblPAS.textContent = "KIC";
    if (cardLblPHY) cardLblPHY.textContent = "PHY";

    document.getElementById("cardPAC").textContent = bestDiv;
    document.getElementById("cardDRI").textContent = bestRef;
    document.getElementById("cardSHO").textContent = bestHan;
    document.getElementById("cardDEF").textContent = bestPos;
    document.getElementById("cardPAS").textContent = bestKic;
    document.getElementById("cardPHY").textContent = bestPhy;
  } else {
    if (cardLblPAC) cardLblPAC.textContent = "PAC";
    if (cardLblDRI) cardLblDRI.textContent = "DRI";
    if (cardLblSHO) cardLblSHO.textContent = "SHO";
    if (cardLblDEF) cardLblDEF.textContent = "DEF";
    if (cardLblPAS) cardLblPAS.textContent = "PAS";
    if (cardLblPHY) cardLblPHY.textContent = "PHY";

    document.getElementById("cardPAC").textContent = bestPac;
    document.getElementById("cardDRI").textContent = bestDri;
    document.getElementById("cardSHO").textContent = bestSho;
    document.getElementById("cardDEF").textContent = bestDef;
    document.getElementById("cardPAS").textContent = bestPas;
    document.getElementById("cardPHY").textContent = bestPhy;
  }

  const uniqueClubs = Array.from(new Set(state.seasons.map((s) => s.teamId)));
  document.getElementById("cardClubsStrip").innerHTML = uniqueClubs.map((tId) => {
    const t = catalogIndex.getTeam(tId);
    return t ? `<img src="${t.logo_url}" class="w-6 h-6 object-contain drop-shadow" title="${t.name}" alt="">` : "";
  }).join(" ");

  // Tab switching logic
  function switchSummaryTab(target) {
    const tabs = [
      { btn: sumTabBtnEras, pane: sumPaneEras, name: "eras" },
      { btn: sumTabBtnTrophies, pane: sumPaneTrophies, name: "trophies" },
      { btn: sumTabBtnSocial, pane: sumPaneSocial, name: "social" },
      { btn: sumTabBtnCard, pane: sumPaneCard, name: "card" },
    ];
    tabs.forEach((t) => {
      const on = t.name === target;
      t.pane.classList.toggle("hidden", !on);
      t.btn.className = "tab";
      t.btn.setAttribute("aria-selected", on ? "true" : "false");
      t.btn.tabIndex = on ? 0 : -1;
    });
    return tabs;
  }
  // Arrow keys move between summary tabs (ARIA tabs pattern)
  const sumTabList = sumTabBtnEras.parentElement;
  if (sumTabList && !sumTabList.dataset.keys) {
    sumTabList.dataset.keys = "1";
    sumTabList.addEventListener("keydown", (e) => {
      const btns = [...sumTabList.querySelectorAll('[role="tab"]')];
      const i = btns.indexOf(document.activeElement);
      if (i < 0) return;
      let j = null;
      if (e.key === "ArrowRight") j = (i + 1) % btns.length;
      else if (e.key === "ArrowLeft") j = (i - 1 + btns.length) % btns.length;
      else if (e.key === "Home") j = 0;
      else if (e.key === "End") j = btns.length - 1;
      if (j === null) return;
      e.preventDefault();
      btns[j].focus();
      btns[j].click();
    });
  }

  sumTabBtnEras.onclick = () => switchSummaryTab("eras");
  sumTabBtnTrophies.onclick = () => switchSummaryTab("trophies");
  sumTabBtnSocial.onclick = () => switchSummaryTab("social");
  sumTabBtnCard.onclick = () => switchSummaryTab("card");

  switchSummaryTab("eras");
}
