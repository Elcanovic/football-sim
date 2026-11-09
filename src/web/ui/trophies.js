// Trophy artwork registry and silverware grouping: maps a trophy or award key to its image
// and display name, and renders stacked trophy shelves.

import { state } from "./store.js";

// Trophy URL Assets Registry
export const TROPHY_ASSETS = {
  world_cup: {
    name: "FIFA World Cup",
    url: "https://media.copero.com.ar/trophies/football/international/FIFA/world-cup.png",
  },
  club_world_cup: {
    name: "FIFA Club World Cup",
    url: "https://media.copero.com.ar/trophies/football/international/FIFA/club-world-cup.png",
  },
  national_continental: {
    name: "Continental Championship",
    url: "https://media.copero.com.ar/trophies/football/international/UEFA/euro.svg",
  },
  ballon_dor: {
    name: "Ballon d'Or",
    url: "https://media.copero.com.ar/trophies/football/international/FIFA/ballon-dor.png",
  },
  golden_boot: {
    name: "Golden Boot",
    url: "https://media.copero.com.ar/trophies/football/international/UEFA/golden-boot.png",
  },
  golden_glove: {
    name: "Golden Glove",
    url: "https://media.copero.com.ar/trophies/football/international/FIFA/golden-glove.png",
  },
  generic_league: { name: "League Trophy", url: "https://media.copero.com.ar/trophies/football/generic-league.svg" },
  generic_cup: { name: "Cup Trophy", url: "https://media.copero.com.ar/trophies/football/generic-cup.svg" },
};

const COPERO_INTL = "https://media.copero.com.ar/trophies/football/international";

// National-team continental championships, per confederation
const NATIONAL_CONTINENTAL_TROPHIES = {
  UEFA: { name: "UEFA European Championship", url: `${COPERO_INTL}/UEFA/euro.svg` },
  CONMEBOL: { name: "Copa América", url: `${COPERO_INTL}/CONMEBOL/copa-america.png` },
  CONCACAF: { name: "CONCACAF Gold Cup", url: `${COPERO_INTL}/CONCACAF/gold-cup.svg` },
  CAF: { name: "Africa Cup of Nations", url: `${COPERO_INTL}/CAF/afcon.svg` },
  AFC: { name: "AFC Asian Cup", url: `${COPERO_INTL}/AFC/asian-cup.svg` },
  OFC: { name: "OFC Nations Cup", url: `${COPERO_INTL}/OFC/nations-cup.png` },
};

// Club continental competitions, per confederation and tier
const CLUB_CONTINENTAL_TROPHIES = {
  continental_primary: {
    UEFA: { name: "UEFA Champions League", url: `${COPERO_INTL}/UEFA/champions-league.png` },
    CONMEBOL: { name: "Copa Libertadores", url: `${COPERO_INTL}/CONMEBOL/libertadores.png` },
    CONCACAF: { name: "CONCACAF Champions Cup", url: `${COPERO_INTL}/CONCACAF/concachampions.svg` },
    AFC: { name: "AFC Champions League Elite", url: `${COPERO_INTL}/AFC/champions-league-elite.png` },
    CAF: { name: "CAF Champions League", url: `${COPERO_INTL}/CAF/champions-league.png` },
    OFC: { name: "OFC Champions League", url: `${COPERO_INTL}/OFC/champions-league.png` },
  },
  continental_secondary: {
    UEFA: { name: "UEFA Europa League", url: `${COPERO_INTL}/UEFA/europa-league.png` },
    CONMEBOL: { name: "Copa Sudamericana", url: `${COPERO_INTL}/CONMEBOL/copa-sudamericana.png` },
    AFC: { name: "AFC Champions League Two", url: `${COPERO_INTL}/AFC/champions-league-two.png` },
    CAF: { name: "CAF Confederation Cup", url: `${COPERO_INTL}/CAF/confederation-cup.png` },
  },
};

/**
 * Resolves a trophy key + club into its specific competition identity.
 * Returns { name, url, groupId } — groupId is stable per real competition
 * (e.g. "league:premier-league", "cup:eng-fa-cup") so identical titles stack together.
 */
export function resolveTrophy(trophyKey, teamId) {
  const hasCatalog = typeof catalogIndex !== "undefined";
  const comp = hasCatalog && teamId ? catalogIndex.getCompetition(teamId) : null;

  if (trophyKey === "national_continental") {
    const confed = state?.player?.nationality?.confederation || "UEFA";
    const t = NATIONAL_CONTINENTAL_TROPHIES[confed] || NATIONAL_CONTINENTAL_TROPHIES.UEFA;
    return { ...t, groupId: `national_continental:${confed}` };
  }

  if (TROPHY_ASSETS[trophyKey]) {
    return { ...TROPHY_ASSETS[trophyKey], groupId: trophyKey };
  }

  if (trophyKey === "league") {
    if (comp) {
      return {
        name: comp.name,
        url: comp.league_trophy_url || TROPHY_ASSETS.generic_league.url,
        groupId: `league:${comp.id}`,
      };
    }
    return { ...TROPHY_ASSETS.generic_league, groupId: "league:unknown" };
  }

  if (trophyKey === "cup") {
    if (comp && hasCatalog) {
      if (comp.domestic_cup_id) {
        const cup = catalogIndex.getDomesticCup(comp.domestic_cup_id);
        if (cup) {
          return {
            name: cup.name,
            url: cup.trophy_url || TROPHY_ASSETS.generic_cup.url,
            groupId: `cup:${comp.domestic_cup_id}`,
          };
        }
      }
      return {
        name: `${comp.name} Cup`,
        url: comp.cup_trophy_url || TROPHY_ASSETS.generic_cup.url,
        groupId: `cup:${comp.id}`,
      };
    }
    return { ...TROPHY_ASSETS.generic_cup, groupId: "cup:unknown" };
  }

  if (trophyKey === "continental_primary" || trophyKey === "continental_secondary") {
    const confed = comp?.confederation || "UEFA";
    const table = CLUB_CONTINENTAL_TROPHIES[trophyKey];
    const t = table[confed] || table.UEFA;
    return { ...t, groupId: `${trophyKey}:${confed}` };
  }

  return { name: trophyKey.replace(/_/g, " "), url: TROPHY_ASSETS.generic_cup.url, groupId: trophyKey };
}

export const INDIVIDUAL_AWARD_KEYS = ["ballon_dor", "golden_boot", "golden_glove"];

/**
 * Groups silverware across seasons by specific competition.
 * Each group: { key, groupId, name, url, count, ages[], teamIds[] }
 */
export function collectSilverware(seasons, { trophies = true, awards = false, filter = null } = {}) {
  const groups = new Map();
  (seasons || []).forEach((s) => {
    const keys = [...(trophies ? (s.trophies || []) : []), ...(awards ? (s.awards || []) : [])];
    keys.forEach((k) => {
      if (filter && !filter(k)) return;
      const item = resolveTrophy(k, s.teamId);
      if (!groups.has(item.groupId)) {
        groups.set(item.groupId, {
          key: k,
          groupId: item.groupId,
          name: item.name,
          url: item.url,
          count: 0,
          ages: [],
          teamIds: [],
        });
      }
      const g = groups.get(item.groupId);
      g.count += 1;
      g.ages.push(s.age);
      if (!g.teamIds.includes(s.teamId)) g.teamIds.push(s.teamId);
    });
  });
  return [...groups.values()].sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
}

/** Renders identical trophies overlapped side by side; they fan out on hover. */
export function renderTrophyStack(group, size = "md", maxVisible = 6) {
  const n = Math.min(group.count, maxVisible);
  const mid = (n - 1) / 2;
  const sizeCls = size === "sm" ? "ts-sm" : size === "lg" ? "ts-lg" : "";
  const imgs = Array.from({ length: n }, (_, i) => `
    <img src="${group.url}" class="trophy-stack-item" style="--i:${i}; z-index:${n - i};" alt="" title="${group.name}${
    group.ages[i] !== undefined ? ` (Age ${group.ages[i]})` : ""
  }" onerror="this.src='${TROPHY_ASSETS.generic_cup.url}'">
  `).join("");
  return `
    <div class="trophy-stack ${sizeCls}" style="--mid:${mid}" title="${group.count}× ${group.name}">
      ${imgs}
      ${group.count > 1 ? `<span class="trophy-stack-count">×${group.count}</span>` : ""}
    </div>
  `;
}
