// Career dashboard: renderState draws the HUD, shelves, national-team bar, standings and
// timeline from the current state and hands newly won titles to the celebration overlay.

import { buildCelebrationSlate } from "../celebration.js";
import { celebrationActive, deferTitlesHud, triggerTrophyCelebration } from "./celebration-overlay.js";
import { CALLUP_THRESHOLDS_UI, renderDecisionCard } from "./decision-card.js";
import {
  badgeOvr,
  btnOpenAgentModal,
  playerBadge,
  screenCareer,
  screenCreation,
  screenSummary,
  totalTrophies,
} from "./dom.js";
import { clearDilemmaOutcome, markSeasonsCelebrated } from "./engine-bridge.js";
import { animateValue, formatCurrency, getBadgeStyle } from "./format.js";
import {
  animateOvrChange,
  animateStatChanges,
  cancelOvrAnimation,
  flushHudProgression,
  getHudAttrValues,
  queueHudProgression,
} from "./hud-progression.js";
import { renderSocialBar, showSocialToast, updateNewsTicker } from "./social.js";
import { state } from "./store.js";
import { renderSummary } from "./summary-view.js";
import { collectSilverware, INDIVIDUAL_AWARD_KEYS, renderTrophyStack, resolveTrophy } from "./trophies.js";

const hudFlag = document.getElementById("hudFlag");
const hudSecondFlag = document.getElementById("hudSecondFlag");
const hudPlayerName = document.getElementById("hudPlayerName");
const hudPosBadge = document.getElementById("hudPosBadge");
const hudCaptainBadge = document.getElementById("hudCaptainBadge");
const hudClubCrest = document.getElementById("hudClubCrest");
const hudTeam = document.getElementById("hudTeam");
const hudAge = document.getElementById("hudAge");
const hudMarketValue = document.getElementById("hudMarketValue");
const hudWage = document.getElementById("hudWage");
const hudWatermarkLogo = document.getElementById("hudWatermarkLogo");
const hudBootLabel = document.getElementById("hudBootLabel");

const gaugeMorale = document.getElementById("gaugeMorale");
const txtMorale = document.getElementById("txtMorale");
const gaugeTrust = document.getElementById("gaugeTrust");
const txtTrust = document.getElementById("txtTrust");
const badgeTrustStatus = document.getElementById("badgeTrustStatus");

// Shelves in HUD
const countCollectiveTrophies = document.getElementById("countCollectiveTrophies");
const hudCollectiveShelf = document.getElementById("hudCollectiveShelf");
const countIndividualHonors = document.getElementById("countIndividualHonors");
const hudIndividualShelf = document.getElementById("hudIndividualShelf");

// National Team Bar
const natFlag = document.getElementById("natFlag");
const natCountryName = document.getElementById("natCountryName");
const natStatusBadge = document.getElementById("natStatusBadge");
const natApps = document.getElementById("natApps");
const natGoals = document.getElementById("natGoals");
const natAssists = document.getElementById("natAssists");
const natTrophiesContainer = document.getElementById("natTrophiesContainer");

// Health & Fitness HUD
const hudFitnessBadge = document.getElementById("hudFitnessBadge");
const dotFitness = document.getElementById("dotFitness");
const txtFitness = document.getElementById("txtFitness");

const lblAttr1 = document.getElementById("lblAttr1");
const lblAttr2 = document.getElementById("lblAttr2");
const lblAttr3 = document.getElementById("lblAttr3");
const lblAttr4 = document.getElementById("lblAttr4");
const lblAttr5 = document.getElementById("lblAttr5");
const lblAttr6 = document.getElementById("lblAttr6");

const hudAgentFlag = document.getElementById("hudAgentFlag");
const hudAgentName = document.getElementById("hudAgentName");

// Standings & Timeline
const activeLeagueName = document.getElementById("activeLeagueName");
const activeLeagueLogo = document.getElementById("activeLeagueLogo");
const tbodyLeagueStandings = document.getElementById("tbodyLeagueStandings");
const timelineList = document.getElementById("timelineList");

const totalGoals = document.getElementById("totalGoals");
const totalAssists = document.getElementById("totalAssists");
const totalWages = document.getElementById("totalWages");

let prevOvr = 50;
let prevMarketValue = 100000;
let prevAttrVals = null;
let lastCelebratedSeasonIndex = -1;

// Forget the HUD baselines and the celebration cursor when a new career starts
export function resetCareerView() {
  prevOvr = 50;
  prevMarketValue = 100000;
  prevAttrVals = null;
  lastCelebratedSeasonIndex = -1;
}

export function renderState(isInitial = false) {
  if (!state || !state.player) return;

  if (state.phase === "summary") {
    renderSummary();
    return;
  }

  screenCreation.classList.add("hidden");
  screenSummary.classList.add("hidden");
  screenCareer.classList.remove("hidden");

  const p = state.player;
  const lastSeason = state.seasons[state.seasons.length - 1];
  const team = lastSeason
    ? catalogIndex.getTeam(lastSeason.teamId)
    : (state.currentTeamId ? catalogIndex.getTeam(state.currentTeamId) : null);
  const comp = team ? catalogIndex.getCompetition(team.id) : null;

  // OVR / Attribute / Value progression — queued so it plays AFTER any trophy popup closes
  const a = p.attributes;
  const isGk = p.position === "GK";
  if (lblAttr1) lblAttr1.textContent = isGk ? "DIV" : "PAC";
  if (lblAttr2) lblAttr2.textContent = isGk ? "HAN" : "SHO";
  if (lblAttr3) lblAttr3.textContent = isGk ? "KIC" : "PAS";
  if (lblAttr4) lblAttr4.textContent = isGk ? "REF" : "DRI";
  if (lblAttr5) lblAttr5.textContent = isGk ? "POS" : "DEF";
  if (lblAttr6) lblAttr6.textContent = "PHY";

  const newAttrVals = getHudAttrValues(a, p.position);
  if (!isInitial) {
    const ovrFrom = prevOvr;
    const ovrTo = p.overall;
    const attrsFrom = prevAttrVals;
    const mvFrom = prevMarketValue;
    const mvTo = p.marketValue;
    queueHudProgression(() => {
      animateOvrChange(ovrFrom, ovrTo);
      animateStatChanges(attrsFrom, newAttrVals);
      animateValue(hudMarketValue, mvFrom, mvTo, 1100, formatCurrency);
    });
  } else {
    cancelOvrAnimation();
    badgeOvr.textContent = p.overall;
    hudMarketValue.textContent = formatCurrency(p.marketValue);
    playerBadge.className = `ovr-plate border select-none transition-all duration-700 ${getBadgeStyle(p.overall)}`;
    animateStatChanges(null, newAttrVals);
  }
  prevOvr = p.overall;
  prevMarketValue = p.marketValue;
  prevAttrVals = newAttrVals;

  // HUD Card
  hudFlag.src = p.nationality.flag_url;
  hudPlayerName.textContent = p.lastName;
  hudPosBadge.textContent = `#${p.preferredNumber} ${p.position}`;
  hudAge.textContent = p.age;
  hudWage.textContent = p.contract ? `€${p.contract.weeklyWage.toLocaleString()}/wk` : "Unsigned";

  // Dual Nationality HUD flag
  if (hudSecondFlag) {
    if (p.secondNationality) {
      hudSecondFlag.src = p.secondNationality.flag_url;
      hudSecondFlag.title = `Dual Nationality: ${p.secondNationality.name_en} (${p.secondNationality.fifa_code})`;
      hudSecondFlag.classList.remove("hidden");
    } else {
      hudSecondFlag.classList.add("hidden");
    }
  }

  // Captaincy Badge
  if (hudCaptainBadge) {
    if (p.captaincyStatus && p.captaincyStatus !== "none") {
      hudCaptainBadge.classList.remove("hidden");
      if (p.captaincyStatus === "club_captain") hudCaptainBadge.textContent = "© Club Captain";
      else if (p.captaincyStatus === "captain") hudCaptainBadge.textContent = "© Captain";
      else if (p.captaincyStatus === "vice_captain") hudCaptainBadge.textContent = "© Vice Captain";
    } else {
      hudCaptainBadge.classList.add("hidden");
    }
  }

  // Technical Boot Endorsement Label
  if (hudBootLabel) {
    if (p.bootDeal) {
      hudBootLabel.textContent = `${p.bootDeal.brand} ${p.bootDeal.modelName.split(" ")[0]}`;
    } else {
      hudBootLabel.textContent = "Boots";
    }
  }

  // Agent HUD Representation
  if (p.agent) {
    if (hudAgentName) hudAgentName.textContent = `${p.agent.name.split(" ")[0]} (${p.agent.countryFifa})`;
    if (hudAgentFlag && p.agent.iso) {
      hudAgentFlag.src = `https://media.copero.com.ar/flags/4x3/${p.agent.iso.toLowerCase()}.svg`;
      hudAgentFlag.classList.remove("hidden");
    }
    if (btnOpenAgentModal) {
      btnOpenAgentModal.title =
        `Agent: ${p.agent.name} (${p.agent.agency}) • Tier: ${p.agent.tier} • Commission: ${p.agent.commission}%`;
    }
  } else {
    if (hudAgentName) hudAgentName.textContent = "No Agent";
    if (hudAgentFlag) hudAgentFlag.classList.add("hidden");
    if (btnOpenAgentModal) btnOpenAgentModal.title = "Hire representation from 40 global agents";
  }

  if (team) {
    hudTeam.textContent = team.short_name || team.name;
    hudClubCrest.src = team.logo_url;
    hudClubCrest.classList.remove("hidden");
    hudWatermarkLogo.src = team.logo_url;
    hudWatermarkLogo.classList.remove("hidden");
  } else {
    hudTeam.textContent = "Academy Free Agent";
    hudClubCrest.classList.add("hidden");
    hudWatermarkLogo.classList.add("hidden");
  }

  // Morale & Trust
  gaugeMorale.style.width = `${p.morale}%`;
  txtMorale.textContent = `${p.morale}%`;
  gaugeTrust.style.width = `${p.managerTrust}%`;
  txtTrust.textContent = `${p.managerTrust}%`;
  if (badgeTrustStatus) {
    if (p.managerTrust >= 85) {
      badgeTrustStatus.textContent = "👑 Undisputed Starter";
      badgeTrustStatus.className =
        "text-[11px] font-extrabold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20";
    } else if (p.managerTrust >= 70) {
      badgeTrustStatus.textContent = "⭐ Key Player";
      badgeTrustStatus.className =
        "text-[11px] font-extrabold text-sky-400 bg-sky-500/10 px-2 py-0.5 rounded-full border border-sky-500/20";
    } else if (p.managerTrust >= 50) {
      badgeTrustStatus.textContent = "⚡ Squad Rotation";
      badgeTrustStatus.className =
        "text-[11px] font-extrabold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20";
    } else if (p.managerTrust >= 30) {
      badgeTrustStatus.textContent = "⚠️ Fringe Option";
      badgeTrustStatus.className =
        "text-[11px] font-extrabold text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20";
    } else {
      badgeTrustStatus.textContent = "❌ Frozen Out";
      badgeTrustStatus.className =
        "text-[11px] font-extrabold text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded-full border border-rose-500/20";
    }
  }

  // Career Totals
  const t = p.careerTotals;
  const titlesOnScreen = Number(totalTrophies.textContent) || 0;
  totalTrophies.textContent = t.trophies;
  totalGoals.textContent = t.goals;
  if (totalAssists) totalAssists.textContent = t.assists || 0;
  totalWages.textContent = formatCurrency(t.totalWagesEarned);

  // 1. COLLECTIVE SILVERWARE ZONE — grouped per specific competition, identical titles stacked
  const collectiveGroups = collectSilverware(state.seasons, {
    trophies: true,
    filter: (k) => !INDIVIDUAL_AWARD_KEYS.includes(k),
  });
  const collectiveTotal = collectiveGroups.reduce((sum, g) => sum + g.count, 0);
  countCollectiveTrophies.textContent = `${collectiveTotal} Title${collectiveTotal === 1 ? "" : "s"}`;
  hudCollectiveShelf.innerHTML = collectiveGroups.map((g) => renderTrophyStack(g, "sm", 5)).join("") ||
    `<span class="text-[10px] text-zinc-500 font-medium italic">No collective titles yet.</span>`;

  // 2. INDIVIDUAL HONORS ZONE (Ballon d'Or, Golden Boot, Golden Glove)
  const awardGroups = collectSilverware(state.seasons, { trophies: false, awards: true });
  const awardTotal = awardGroups.reduce((sum, g) => sum + g.count, 0);
  countIndividualHonors.textContent = `${awardTotal} Award${awardTotal === 1 ? "" : "s"}`;
  hudIndividualShelf.innerHTML = awardGroups.map((g) => renderTrophyStack(g, "sm", 5)).join("") ||
    `<span class="text-[10px] text-zinc-500 font-medium italic">Ballon d'Or & Golden Boot showcase</span>`;

  // 3. NATIONAL TEAM CARD & STATS
  const nat = p.nationalTeamStats || { appearances: 0, goals: 0, assists: 0, trophies: [] };
  natFlag.src = p.nationality.flag_url;
  natCountryName.textContent = `${p.nationality.name_en} (${p.nationality.fifa_code})`;
  natApps.textContent = nat.appearances;
  natGoals.textContent = nat.goals;
  natAssists.textContent = nat.assists;

  const isCalledUp = nat.appearances > 0 ||
    p.overall >= (CALLUP_THRESHOLDS_UI[p.nationality.international_reputation || 0] || 75);
  if (isCalledUp) {
    natStatusBadge.textContent = "Active International";
    natStatusBadge.className =
      "text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30";
  } else {
    const reqOvr = CALLUP_THRESHOLDS_UI[p.nationality.international_reputation || 0] || 75;
    natStatusBadge.textContent = `Uncapped (Req: ${reqOvr} OVR)`;
    natStatusBadge.className =
      "text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400 border border-zinc-700";
  }

  // National Trophies Won (World Cup, Euro/Copa América)
  const natTrophiesCounts = {};
  nat.trophies.forEach((tKey) => {
    natTrophiesCounts[tKey] = (natTrophiesCounts[tKey] || 0) + 1;
  });
  natTrophiesContainer.innerHTML = Object.entries(natTrophiesCounts).map(([key, count]) => {
    const item = resolveTrophy(key);
    return `
      <div class="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-zinc-950 border border-amber-500/40 text-[11px] font-black text-amber-400" title="${item.name}">
        <img src="${item.url}" class="w-4 h-4 object-contain" alt="">
        <span>×${count}</span>
      </div>
    `;
  }).join("");

  // 4. Fitness & Injury Status
  renderFitnessBadge();

  // 5. Social Media Bar (Instagram, TikTok, X)
  renderSocialBar();

  // 6. Live Breaking Wire News Ticker
  updateNewsTicker();

  // Standings Tab with Club Logos
  if (lastSeason && lastSeason.leagueTable && comp) {
    activeLeagueName.textContent = comp.name;
    activeLeagueLogo.src = comp.logo_url;
    activeLeagueLogo.classList.remove("hidden");

    tbodyLeagueStandings.innerHTML = lastSeason.leagueTable.map((entry) => {
      const isPlayer = entry.teamId === lastSeason.teamId;
      const tData = catalogIndex.getTeam(entry.teamId);
      const rowBg = isPlayer
        ? "bg-emerald-500/10 text-emerald-300 font-bold border-l-2 border-emerald-400"
        : "hover:bg-[#171A17]/60 text-zinc-300 transition-colors";
      const statusColor = entry.status === "champion"
        ? "text-amber-400 font-black"
        : entry.status === "relegated"
        ? "text-rose-400 font-bold"
        : "text-zinc-400";

      return `
        <tr class="${rowBg}">
          <td class="py-2 ps-3 w-8 ${statusColor}">
            ${entry.rank === 1 ? "🥇" : entry.rank}
          </td>
          <td>
            <div class="club-cell">
              <img src="${
        tData ? tData.logo_url : ""
      }" class="w-4 h-4 object-contain shrink-0" alt="" onerror="this.style.display='none'">
              <span>${
        isPlayer ? "★ " : ""
      }${entry.teamName}<span class="club-wdl" title="Won–drawn–lost">${entry.won}–${entry.drawn}–${entry.lost}</span></span>
            </div>
          </td>
          <td class="py-2 text-center w-8 text-zinc-400 font-mono">${entry.played}</td>
          <td class="col-wdl py-2 text-center w-8 text-zinc-400 font-mono">${entry.won}</td>
          <td class="col-wdl py-2 text-center w-8 text-zinc-400 font-mono">${entry.drawn}</td>
          <td class="col-wdl py-2 text-center w-8 text-zinc-400 font-mono">${entry.lost}</td>
          <td class="py-2 text-center w-10 font-bold font-mono ${
        entry.goalDifference >= 0 ? "text-emerald-400" : "text-rose-400"
      }">${entry.goalDifference >= 0 ? "+" : ""}${entry.goalDifference}</td>
          <td class="py-2 pe-1 text-center w-10 font-black text-white font-mono">${entry.points}</td>
        </tr>
      `;
    }).join("");
  } else {
    tbodyLeagueStandings.innerHTML =
      `<tr><td colspan="8" class="text-center py-10 text-zinc-500 font-semibold">Join an academy to play your opening campaign.</td></tr>`;
  }

  // Render Timeline with Crests and Trophies
  timelineList.innerHTML = state.seasons.slice().reverse().map((s) => {
    const sTeam = catalogIndex.getTeam(s.teamId);
    const trophiesHtml = s.trophies.map((tr) => {
      const tInfo = resolveTrophy(tr, s.teamId);
      return `<img src="${tInfo.url}" class="w-4 h-4 object-contain inline-block drop-shadow" title="${tInfo.name}" alt="">`;
    }).join(" ");

    const awardsHtml = s.awards.map((aw) => {
      const aInfo = resolveTrophy(aw, s.teamId);
      return `<img src="${aInfo.url}" class="w-4 h-4 object-contain inline-block drop-shadow" title="${aInfo.name}" alt="">`;
    }).join(" ");

    return `
      <div class="log-row">
        <span class="log-age" title="Age">${s.age}</span>
        <img src="${sTeam ? sTeam.logo_url : ""}" class="log-crest" alt="">
        <div class="log-club">
          <div class="log-name">${sTeam ? (sTeam.short_name || sTeam.name) : s.teamId}</div>
          <div class="log-meta">#${s.leaguePosition} in league · Tier ${s.competitionTier}</div>
        </div>
        <div class="log-silver">${trophiesHtml}${awardsHtml}</div>
        <div class="log-stats">
          <div>${s.stats.appearances} apps · ${s.stats.goals} G · ${s.stats.assists || 0} A</div>
          <div class="log-rating">Rating ${s.stats.averageRating.toFixed(2)}</div>
        </div>
        <span class="log-ovr" title="Overall">${s.overall}</span>
      </div>
    `;
  }).join("");

  renderDecisionCard();

  // Multi-trophy celebration check on latest season - triggers strictly ONCE per newly simulated season
  const currentSeasonIndex = state.seasons ? state.seasons.length - 1 : -1;
  const isNewSimulatedSeason = !isInitial && lastSeason && currentSeasonIndex >= 0 &&
    currentSeasonIndex !== lastCelebratedSeasonIndex &&
    currentSeasonIndex !== state._lastCelebratedSeasonIndex;

  if (isInitial && currentSeasonIndex >= 0) {
    // Seasons already on the record when a career loads are never re-celebrated
    lastCelebratedSeasonIndex = currentSeasonIndex;
    markSeasonsCelebrated(currentSeasonIndex);
  }

  if (isNewSimulatedSeason) {
    // Every season simulated since the last celebration, not just the latest (2–3 per decision on faster pacing)
    const fromIndex = Math.max(lastCelebratedSeasonIndex, state._lastCelebratedSeasonIndex ?? -1);
    const slate = buildCelebrationSlate(state.seasons, fromIndex);
    lastCelebratedSeasonIndex = currentSeasonIndex;
    markSeasonsCelebrated(currentSeasonIndex);
    if (slate.entries.length > 0) {
      if (t.trophies !== titlesOnScreen) {
        totalTrophies.textContent = titlesOnScreen;
        deferTitlesHud(titlesOnScreen, t.trophies);
      }
      triggerTrophyCelebration(slate);
    } else {
      flushHudProgression(50);
    }
    if (lastSeason.injuryOccurred) {
      showSocialToast("injury", {
        title: "⚠️ Medical Alert",
        gain: `Out for ~${lastSeason.injuryOccurred.gamesMissed} games`,
        message:
          `Suffered ${lastSeason.injuryOccurred.name} (${lastSeason.injuryOccurred.severity}). Dedicated rehab initiated.`,
        icon: "🩺",
      });
    }
    if (state.lastDilemmaOutcome) {
      const d = state.lastDilemmaOutcome;
      const gainText = d.ovrDelta !== 0
        ? `${d.ovrDelta > 0 ? "+" : ""}${d.ovrDelta} OVR`
        : (d.cashDelta ? `€${d.cashDelta.toLocaleString()}` : "");
      showSocialToast("dilemma", {
        title: "⚖️ Dilemma Resolution",
        gain: gainText,
        message: d.resultMessage,
        icon: "⚖️",
      });
      clearDilemmaOutcome();
    }
  } else if (!celebrationActive) {
    flushHudProgression(50);
  }
}

function renderFitnessBadge() {
  if (!state || !state.player) return;
  const p = state.player;
  const inj = p.activeInjury;

  if (inj) {
    hudFitnessBadge.className =
      "flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-rose-500/20 text-rose-300 border border-rose-500/40 shadow-sm";
    dotFitness.className = "pulse pulse-sm text-rose-400";
    txtFitness.textContent = `Injured: ${inj.name} (${inj.gamesMissed}g)`;
    hudFitnessBadge.title = `${inj.name} (${inj.severity}) - Missing ~${inj.gamesMissed} matches this campaign`;
  } else {
    hudFitnessBadge.className =
      "flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shadow-sm";
    dotFitness.className = "w-1.5 h-1.5 bg-emerald-400";
    txtFitness.textContent = "100% Fit";
    hudFitnessBadge.title = "Full Match Fitness - Peak physical condition";
  }
}
