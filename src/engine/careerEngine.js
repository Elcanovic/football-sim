import { CATALOG, catalogIndex } from "../data/index.js";
import { checkProbability, createPRNG, pickRandom } from "./prng.js";
import { calculateOverall, createInitialAttributes, evolveAttributes, POSITION_ROLES } from "./attributes.js";
import { calculateMarketValue, calculateTransferFee, calculateWeeklyWage } from "./economics.js";
import { simulateLeagueSeason } from "./leagueSim.js";
import { simulateCupTournament } from "./cupSim.js";
import { simulateSeasonPlayerStats } from "./matchEngine.js";
import {
  generateCareerDilemma,
  generateClutchMoment,
  resolveCareerDilemma,
  resolveClutchAction,
} from "./careerEvents.js";
import { calculateAgentNegotiatedWage, getAgentById, getDefaultAgentForNationality } from "./agents.js";
import { simulateNationalTeamSeason } from "./nationalTeam.js";
import {
  checkRetirement,
  estimateLeagueRank,
  getContinentalSlots,
  simulateContinentalCompetition,
} from "./continental.js";
import {
  calculateWeeklySponsorshipEarnings,
  getAvailableBootDeals,
  getAvailableBrandSponsorships,
  getDefaultBootDeal,
  signBootDeal,
  signBrandSponsorship,
} from "./sponsorships.js";
import { generatePressConference, resolvePressAnswer } from "./pressEngine.js";

export const INJURY_CATALOG = [
  { name: "Ankle Sprain", severity: "minor", gamesMissed: 3, paceImpact: 0 },
  { name: "Groin Strain", severity: "minor", gamesMissed: 4, paceImpact: 0 },
  { name: "Dead Leg Contusion", severity: "minor", gamesMissed: 2, paceImpact: 0 },
  { name: "Hamstring Tear", severity: "moderate", gamesMissed: 8, paceImpact: 0 },
  { name: "Fractured Metatarsal", severity: "moderate", gamesMissed: 11, paceImpact: 0 },
  { name: "MCL Knee Sprain", severity: "moderate", gamesMissed: 9, paceImpact: 0 },
  { name: "Torn Meniscus", severity: "severe", gamesMissed: 15, paceImpact: -1 },
  { name: "ACL Ligament Rupture", severity: "severe", gamesMissed: 24, paceImpact: -2 },
  { name: "Achilles Tendonitis", severity: "severe", gamesMissed: 18, paceImpact: -1 },
];

export const DEFAULT_LIFESTYLE_CHOICES = [
  {
    id: "private_chef",
    name: "Private Chef & Nutritionist",
    icon: "🥗",
    category: "fitness",
    costWeekly: 2500,
    description: "Custom macro meals & hydration plans. +3 Stamina, -30% Injury Risk, +5% Morale.",
    buffs: { injuryRiskReduction: 0.30, statBonus: { attr: "physical", val: 3 }, moraleBonus: 5 },
    nerfs: {},
    active: false,
  },
  {
    id: "cryo_physio",
    name: "Cryo Pod & Hyperbaric Physio",
    icon: "🧊",
    category: "fitness",
    costWeekly: 4000,
    description: "Sub-zero recovery chambers & personal physio. -45% Injury Risk, slows physical aging at 30+.",
    buffs: { injuryRiskReduction: 0.45, recoverySpeedBonus: 2 },
    nerfs: {},
    active: false,
  },
  {
    id: "sprint_coach",
    name: "Olympic Sprint & Biomechanics Coach",
    icon: "⚡",
    category: "fitness",
    costWeekly: 3500,
    description: "Private track trainer optimizing stride mechanics. +2 Pace, +2 Dribbling.",
    buffs: { statBonus: { attr: "pace", val: 2 } },
    nerfs: {},
    active: false,
  },
  {
    id: "vip_nightlife",
    name: "VIP Nightlife & Celebrity Parties",
    icon: "🍾",
    category: "luxury",
    costWeekly: 3000,
    description:
      "Red carpets, VIP clubs, and celebrity parties. +80% Viral Follower Surge, but -10 Coach Trust, +25% Injury Risk.",
    buffs: { followerMultiplier: 1.8 },
    nerfs: { trustPenalty: 10, injuryRiskIncrease: 0.25, staminaHit: 2 },
    active: false,
  },
  {
    id: "streaming_gaming",
    name: "Twitch Streaming & Esports Team",
    icon: "🎮",
    category: "social",
    costWeekly: 0,
    description: "Stream games late nights with fans. +50% TikTok/X Follower Growth, +€100k/yr sponsor deals.",
    buffs: { followerMultiplier: 1.5, passiveIncomeAnnual: 100000 },
    nerfs: { trustPenalty: 3 },
    active: false,
  },
  {
    id: "charity_foundation",
    name: "Youth Charity & Community Foundation",
    icon: "🤝",
    category: "social",
    costWeekly: 2000,
    description:
      "Building football pitches in underprivileged areas. +15 Coach Trust, +15 Morale, +40% Instagram Fan Surge.",
    buffs: { trustBonus: 15, moraleBonus: 15, followerMultiplier: 1.4 },
    nerfs: {},
    active: false,
  },
  {
    id: "real_estate",
    name: "Luxury Real Estate & Fashion Brand",
    icon: "🏢",
    category: "business",
    costWeekly: 0,
    description: "Invest career savings into luxury penthouses and fashion. +€250k annual dividend bonus, +20% fame.",
    buffs: { passiveIncomeAnnual: 250000, followerMultiplier: 1.2 },
    nerfs: {},
    active: false,
  },
];

/**
 * @param {string} seed
 * @param {string} [mode]
 * @param {string} [lastName]
 * @param {number} [preferredNumber]
 * @param {"left"|"right"} [preferredFoot]
 * @param {string} [nationalityIso]
 * @param {string} [position]
 * @param {string} [developmentProfile]
 * @param {string|null} [secondNationalityIso]
 * @param {{ minRetirementAge?: number }|null} [initOptions]
 */
export function initPlayerCareer(
  seed,
  mode = "normal",
  lastName = "Valente",
  preferredNumber = 10,
  preferredFoot = "right",
  nationalityIso = "AR",
  position = "ST",
  developmentProfile = "normal",
  secondNationalityIso = null,
  initOptions = null,
) {
  const rng = createPRNG(seed);
  const country = catalogIndex.getCountryByIso(nationalityIso) || CATALOG.countries[0];
  const secondCountry = secondNationalityIso && secondNationalityIso !== nationalityIso
    ? catalogIndex.getCountryByIso(secondNationalityIso)
    : null;
  const roleCategory = POSITION_ROLES[position] || "attacker";

  const { rng: r1, attributes } = createInitialAttributes(rng, position, 50);
  const overall = calculateOverall(position, attributes);
  const { rng: r2, marketValue } = calculateMarketValue(r1, overall, 16);

  const initialTotals = {
    appearances: 0,
    goals: 0,
    assists: 0,
    cleanSheets: 0,
    goalsConceded: 0,
    trophies: 0,
    awards: 0,
    totalWagesEarned: 0,
    totalTransferFeesGenerated: 0,
    averageMatchRating: 6.8,
  };

  const initialNationalStats = {
    appearances: 0,
    goals: 0,
    assists: 0,
    cleanSheets: 0,
    trophies: [],
  };

  const safeNumber = Math.max(1, Math.min(99, Math.round(Number(preferredNumber) || 10)));
  const agent = getDefaultAgentForNationality(country?.iso_alpha2);

  const player = {
    id: `player-${seed}`,
    lastName: (lastName || "Player").trim(),
    preferredNumber: safeNumber,
    preferredFoot,
    nationality: country,
    secondNationality: secondCountry,
    capTiedNationality: null,
    position,
    roleCategory,
    developmentProfile,
    age: 16,
    overall,
    attributes,
    marketValue,
    contract: null,
    currentTeamId: null,
    morale: 80,
    form: 50,
    managerTrust: 65,
    careerTotals: initialTotals,
    nationalTeamStats: initialNationalStats,
    activeInjury: null,
    injuryHistory: [],
    lifestyleChoices: JSON.parse(JSON.stringify(DEFAULT_LIFESTYLE_CHOICES)),
    agent,
    bootDeal: getDefaultBootDeal(position),
    brandSponsorships: [],
    captaincyStatus: "none",
    minRetirementAge: initOptions?.minRetirementAge,
    socialMedia: {
      instagram: {
        platform: "instagram",
        name: "Instagram",
        icon: "📸",
        color: "#E1306C",
        active: false,
        handle: `@${(lastName || "player").toLowerCase().replace(/[^a-z0-9]/g, "")}.${safeNumber}`,
        followers: 0,
        verified: false,
        totalPosts: 0,
      },
      tiktok: {
        platform: "tiktok",
        name: "TikTok",
        icon: "🎵",
        color: "#00F2FE",
        active: false,
        handle: `@${(lastName || "player").toLowerCase().replace(/[^a-z0-9]/g, "")}_official`,
        followers: 0,
        verified: false,
        totalPosts: 0,
      },
      x: {
        platform: "x",
        name: "X",
        icon: "🐦",
        color: "#FFFFFF",
        active: false,
        handle: `@${(lastName || "player").toLowerCase().replace(/[^a-z0-9]/g, "")}_football`,
        followers: 0,
        verified: false,
        totalPosts: 0,
      },
      totalFollowers: 0,
    },
  };

  let availableComps = catalogIndex.getCompetitionsByCountry(country.fifa_code);
  if (availableComps.length === 0) {
    availableComps = catalogIndex.getCompetitionsByConfederation(country.confederation);
  }
  if (availableComps.length === 0) {
    availableComps = CATALOG.competitions;
  }

  const allAvailableTeams = availableComps.flatMap((c) => c.teams);
  const pickedTeams = [];
  let curRng = r2;

  while (pickedTeams.length < 3 && allAvailableTeams.length > 0) {
    const { rng: nextRng, item } = pickRandom(curRng, allAvailableTeams);
    curRng = nextRng;
    if (!pickedTeams.some((t) => t.id === item.id)) {
      pickedTeams.push(item);
    }
  }

  const options = pickedTeams.map((team) => {
    const comp = catalogIndex.getCompetition(team.id);
    const baseWage = calculateWeeklyWage(marketValue, team.international_reputation, "prospect");
    const wage = calculateAgentNegotiatedWage(baseWage, agent);
    return {
      id: `academy-${team.id}`,
      type: "join_club",
      teamId: team.id,
      label: `Sign with ${team.short_name || team.name}`,
      description: `Join youth academy in ${comp?.name || "League"} (€${wage.toLocaleString()}/week)`,
      contractOffer: {
        years: 3,
        weeklyWage: wage,
        squadRole: "prospect",
      },
    };
  });

  const academyEvent = {
    id: `event-academy-16`,
    type: "academy_offer",
    age: 16,
    eventKey: "academy_offer",
    options,
  };

  return {
    seed,
    rngState: curRng.state,
    mode,
    step: 0,
    phase: "career",
    player,
    currentTeamId: null,
    currentCompetitionId: null,
    currentEvent: academyEvent,
    seasons: [],
    log: [{
      age: 16,
      type: "identity_created",
      description:
        `${player.lastName} (#${player.preferredNumber}, ${player.position}) starts career represented by ${agent.name} (${agent.agency}, ${agent.country}).`,
    }],
  };
}

export function executeDecisionAndSimulate(state, optionId) {
  if (!state.player || !state.currentEvent) return state;

  const currentOption = state.currentEvent.options.find((opt) => opt.id === optionId);
  if (!currentOption) return state;

  let curRng = { seed: state.seed, state: state.rngState };
  const player = { ...state.player };
  let currentTeamId = state.currentTeamId;
  let currentCompId = state.currentCompetitionId;
  const newLog = [...state.log];

  if (currentOption.type === "retire") {
    newLog.push({
      age: player.age,
      type: "retired",
      description: `${player.lastName} has announced retirement at age ${player.age}.`,
    });
    return {
      ...state,
      phase: "summary",
      currentEvent: null,
      retirementReason: `Announced retirement at ${player.age}, leaving the game on his own terms.`,
      log: newLog,
    };
  }

  if (currentOption.type === "join_club" || currentOption.type === "permanent_transfer") {
    if (currentOption.teamId) {
      currentTeamId = currentOption.teamId;
      const comp = catalogIndex.getCompetition(currentTeamId);
      currentCompId = comp?.id || null;
      const team = catalogIndex.getTeam(currentTeamId);

      const baseWage = calculateWeeklyWage(player.marketValue, team?.international_reputation || 2, "rotation");
      const negotiatedWage = calculateAgentNegotiatedWage(baseWage, player.agent);
      const offer = currentOption.contractOffer || {
        years: 3,
        weeklyWage: negotiatedWage,
        squadRole: "rotation",
      };

      player.contract = {
        clubId: currentTeamId,
        yearsRemaining: offer.years,
        weeklyWage: offer.weeklyWage,
        annualSalary: offer.weeklyWage * 52,
        releaseClause: player.marketValue > 5000000 ? Math.round(player.marketValue * 1.8) : null,
        squadRole: offer.squadRole,
      };

      player.morale = Math.min(100, player.morale + 10);
      player.managerTrust = 65;

      const teamName = team?.short_name || team?.name || currentTeamId;
      newLog.push({
        age: player.age,
        type: "transfer",
        description: `Signed ${offer.years}-year contract with ${teamName} (€${offer.weeklyWage.toLocaleString()}/wk)${
          player.agent ? ` negotiated by ${player.agent.name}` : ""
        }.`,
      });
    }
  } else if (currentOption.type === "renew_contract") {
    if (player.contract) {
      player.contract.yearsRemaining += 3;
      const agentBonusPct = 0.20 + ((player.agent?.negotiation || 5) * 0.02);
      player.contract.weeklyWage = Math.round(player.contract.weeklyWage * (1 + agentBonusPct));
      player.contract.annualSalary = player.contract.weeklyWage * 52;
      player.morale = Math.min(100, player.morale + 15);
      newLog.push({
        age: player.age,
        type: "contract_renewal",
        description: `Extended contract with current club for 3 more seasons (+${
          Math.round(agentBonusPct * 100)
        }% wage bump negotiated by ${
          player.agent ? player.agent.name : "agent"
        } to €${player.contract.weeklyWage.toLocaleString()}/wk).`,
      });
    }
  }

  if (state.currentEvent.type === "clutch_moment" && currentOption.type === "clutch_action") {
    const outcome = resolveClutchAction(
      curRng,
      player,
      state.currentEvent.clutchType || "attacker_decisive_penalty",
      currentOption.optionKey || "power_bottom",
      state.currentEvent.targetTrophy,
    );
    curRng = outcome.rng;
    player.morale = Math.max(0, Math.min(100, player.morale + outcome.moraleDelta));
    player.managerTrust = Math.max(0, Math.min(100, player.managerTrust + outcome.managerTrustDelta));
    newLog.push({
      age: player.age,
      type: "clutch_moment",
      description: outcome.resultMessage,
    });
  }

  let lastDilemmaOutcome = null;
  if (state.currentEvent.type === "dilemma_event" && currentOption.type === "dilemma_choice") {
    const outcome = resolveCareerDilemma(
      curRng,
      player,
      player.agent,
      currentOption.dilemmaType || state.currentEvent.dilemmaType,
      currentOption.optionKey,
    );
    curRng = outcome.rng;
    lastDilemmaOutcome = outcome;
    player.morale = Math.max(0, Math.min(100, player.morale + outcome.moraleDelta));
    player.managerTrust = Math.max(0, Math.min(100, player.managerTrust + outcome.managerTrustDelta));
    if (outcome.ovrDelta !== 0) {
      Object.keys(player.attributes).forEach((attr) => {
        player.attributes[attr] = Math.max(35, Math.min(99, player.attributes[attr] + outcome.ovrDelta));
      });
      player.overall = calculateOverall(player.position, player.attributes);
    }
    if (outcome.cashDelta !== 0) {
      player.careerTotals.totalWagesEarned = Math.max(0, player.careerTotals.totalWagesEarned + outcome.cashDelta);
    }
    if (outcome.followersDelta !== 0 && player.socialMedia) {
      player.socialMedia.totalFollowers = Math.max(0, player.socialMedia.totalFollowers + outcome.followersDelta);
    }
    if (outcome.fireAgent) {
      player.agent = null;
    }
    if (outcome.wageBoostPct && player.contract) {
      player.contract.weeklyWage = Math.round(player.contract.weeklyWage * (1 + outcome.wageBoostPct));
      player.contract.annualSalary = player.contract.weeklyWage * 52;
    }
    newLog.push({
      age: player.age,
      type: "dilemma_decision",
      description: outcome.resultMessage,
    });
  }

  if (state.currentEvent?.type === "shirt_number_showdown" && currentOption.type === "shirt_choice") {
    if (currentOption.optionKey === "yield") {
      const altNum = currentOption.alternativeNumber || ((player.preferredNumber % 90) + 11);
      player.preferredNumber = altNum;
      player.managerTrust = Math.min(100, player.managerTrust + 8);
      player.morale = Math.min(100, player.morale + 5);
      newLog.push({
        age: player.age,
        type: "shirt_number_resolved",
        description:
          `Respectfully yielded squad number. Took #${altNum} instead. Praised by coach and teammates (+8 Trust).`,
      });
    } else if (currentOption.optionKey === "buy_watch") {
      player.careerTotals.totalWagesEarned = Math.max(0, player.careerTotals.totalWagesEarned - 30000);
      player.morale = Math.min(100, player.morale + 10);
      newLog.push({
        age: player.age,
        type: "shirt_number_resolved",
        description:
          `Gifted teammate a €30k custom Rolex to secure #${player.preferredNumber}. Teammates laughed it off and squad harmony remained stellar!`,
      });
    } else if (currentOption.optionKey === "demand") {
      player.managerTrust = Math.max(10, player.managerTrust - 8);
      player.morale = Math.max(20, player.morale - 5);
      newLog.push({
        age: player.age,
        type: "shirt_number_resolved",
        description:
          `Forced club hierarchy and your agent to strip #${player.preferredNumber} from your rival teammate. Secured the number, but created dressing room tension (-8 Trust).`,
      });
    }
  }

  if (state.currentEvent?.type === "dual_nationality_declaration" && currentOption.type === "dual_nationality_choice") {
    if (currentOption.optionKey === "commit_first") {
      player.capTiedNationality = player.nationality.fifa_code;
      newLog.push({
        age: player.age,
        type: "allegiance_pledged",
        description:
          `Officially pledged international allegiance to ${player.nationality.name_en} (${player.nationality.fifa_code}). Fully cap-tied!`,
      });
    } else if (currentOption.optionKey === "switch_second" && player.secondNationality) {
      const oldNat = player.nationality;
      player.nationality = player.secondNationality;
      player.secondNationality = oldNat;
      player.capTiedNationality = player.nationality.fifa_code;
      newLog.push({
        age: player.age,
        type: "allegiance_switched",
        description:
          `Made the seismic decision to switch international allegiance to ${player.nationality.name_en} (${player.nationality.fifa_code})! Front pages celebrate the switch.`,
      });
    } else if (currentOption.optionKey === "defer") {
      newLog.push({
        age: player.age,
        type: "allegiance_deferred",
        description: `Deferred international commitment between ${player.nationality.name_en} and ${
          player.secondNationality?.name_en || "second nation"
        } to focus on club development.`,
      });
    }
  }

  const seasonsToSimulate = state.mode === "long" ? 1 : state.mode === "express" ? 3 : 2;
  const newSeasons = [...state.seasons];
  let retirementReason = null;

  for (let s = 0; s < seasonsToSimulate; s++) {
    const currentSeasonAge = player.age;
    const team = currentTeamId ? catalogIndex.getTeam(currentTeamId) : null;
    const comp = currentTeamId ? catalogIndex.getCompetition(currentTeamId) : null;

    if (!team || !comp) break;

    // Lifestyle Perks Calculation
    let lifestyleInjuryRiskMod = 0;
    let lifestyleTrustBonus = 0;
    let lifestyleMoraleBonus = 0;
    let lifestyleFollowerMult = 1.0;
    let lifestylePassiveIncome = 0;
    let lifestyleWeeklyCost = 0;

    if (player.lifestyleChoices) {
      for (const perk of player.lifestyleChoices) {
        if (perk.active) {
          lifestyleWeeklyCost += perk.costWeekly || 0;
          if (perk.buffs.injuryRiskReduction) lifestyleInjuryRiskMod -= perk.buffs.injuryRiskReduction;
          if (perk.buffs.trustBonus) lifestyleTrustBonus += perk.buffs.trustBonus;
          if (perk.buffs.moraleBonus) lifestyleMoraleBonus += perk.buffs.moraleBonus;
          if (perk.buffs.followerMultiplier) lifestyleFollowerMult *= perk.buffs.followerMultiplier;
          if (perk.buffs.passiveIncomeAnnual) lifestylePassiveIncome += perk.buffs.passiveIncomeAnnual;
          if (perk.nerfs.injuryRiskIncrease) lifestyleInjuryRiskMod += perk.nerfs.injuryRiskIncrease;
          if (perk.nerfs.trustPenalty) lifestyleTrustBonus -= perk.nerfs.trustPenalty;
        }
      }
    }

    // Injury System Roll
    let seasonInjury = null;
    player.activeInjury = null;
    const baseInjuryChance = 0.14;
    const ageInjuryMod = currentSeasonAge > 28 ? (currentSeasonAge - 28) * 0.015 : 0;
    const physStat = player.attributes.physical || 50;
    const physInjuryMod = (50 - physStat) * 0.003;
    const totalInjuryRisk = Math.max(
      0.03,
      Math.min(0.48, (baseInjuryChance + ageInjuryMod + physInjuryMod) * (1 + lifestyleInjuryRiskMod)),
    );

    const { rng: rInjCheck, success: hadInjury } = checkProbability(curRng, totalInjuryRisk);
    curRng = rInjCheck;

    if (hadInjury) {
      const { rng: rPick, item: pickedInjury } = pickRandom(curRng, INJURY_CATALOG);
      curRng = rPick;
      const injuryIndex = (player.injuryHistory?.length || 0) + 1;
      seasonInjury = {
        id: `inj-${state.seed}-s${newSeasons.length + 1}-${injuryIndex}`,
        name: pickedInjury.name,
        severity: pickedInjury.severity,
        gamesMissed: pickedInjury.gamesMissed,
        paceImpact: pickedInjury.paceImpact,
        seasonAge: currentSeasonAge,
        recovered: false,
      };
      player.activeInjury = seasonInjury;
      if (!player.injuryHistory) player.injuryHistory = [];
      player.injuryHistory.push(seasonInjury);

      player.morale = Math.max(15, player.morale - seasonInjury.gamesMissed);
      if (seasonInjury.paceImpact < 0 && player.attributes.pace) {
        player.attributes.pace = Math.max(35, player.attributes.pace + seasonInjury.paceImpact);
      }
    }

    const {
      rng: rStats,
      stats: seasonStats,
      managerTrustDelta,
      moraleDelta,
    } = simulateSeasonPlayerStats(
      curRng,
      player,
      team,
      player.contract?.squadRole || "rotation",
    );
    curRng = rStats;

    player.managerTrust = Math.max(10, Math.min(100, player.managerTrust + managerTrustDelta + lifestyleTrustBonus));
    player.morale = Math.max(10, Math.min(100, player.morale + moraleDelta + lifestyleMoraleBonus));

    const leagueResult = simulateLeagueSeason(
      curRng,
      comp,
      team.id,
      player.overall,
      seasonStats.goals,
      player.lastName,
      seasonStats.assists,
    );
    curRng = leagueResult.rng;

    const trophiesWon = [];
    if (leagueResult.isChampion) {
      trophiesWon.push("league");
    }

    if (comp.domestic_cup_id) {
      const cupResult = simulateCupTournament(curRng, comp.domestic_cup_id, team, player.overall, 1.0);
      curRng = cupResult.rng;
      if (cupResult.wonCup) {
        trophiesWon.push("cup");
      }
    }

    // Continental qualification via league coefficient slots (based on last finish at this club)
    let continentalRun = null;
    const lastSnap = newSeasons[newSeasons.length - 1];
    const qualRank = lastSnap && lastSnap.teamId === team.id ? lastSnap.leaguePosition : estimateLeagueRank(team, comp);
    const slots = getContinentalSlots(comp);
    let contLevel = null;
    if (qualRank <= slots.primary) contLevel = "primary";
    else if (qualRank <= slots.primary + slots.secondary) contLevel = "secondary";

    if (contLevel) {
      const qualRounds = contLevel === "primary" ? slots.qualifierRounds : (slots.qualifierRounds > 0 ? 1 : 0);
      const contResult = simulateContinentalCompetition(curRng, team, comp, player.overall, contLevel, qualRounds);
      curRng = contResult.rng;
      continentalRun = { level: contLevel, roundEliminated: contResult.roundEliminated };
      if (contResult.wonCup) {
        trophiesWon.push(contLevel === "primary" ? "continental_primary" : "continental_secondary");
      }
    }

    // National Team Tournament & Season Matches
    const natResult = simulateNationalTeamSeason(curRng, player, currentSeasonAge);
    curRng = natResult.rng;

    if (natResult.calledUp) {
      if (!player.nationalTeamStats) {
        player.nationalTeamStats = { appearances: 0, goals: 0, assists: 0, cleanSheets: 0, trophies: [] };
      }
      player.nationalTeamStats.appearances += natResult.appearances;
      player.nationalTeamStats.goals += natResult.goals;
      player.nationalTeamStats.assists += natResult.assists;
      player.nationalTeamStats.cleanSheets += natResult.cleanSheets;

      player.careerTotals.appearances += natResult.appearances;
      player.careerTotals.goals += natResult.goals;
      player.careerTotals.assists += natResult.assists;
      player.careerTotals.cleanSheets += natResult.cleanSheets;

      if (natResult.trophyWon) {
        trophiesWon.push(natResult.trophyWon);
        player.nationalTeamStats.trophies.push(natResult.trophyWon);
      }
    }

    const awardsWon = [];
    const isTopScorer = leagueResult.topScorers[0]?.isUserPlayer;
    if (isTopScorer && player.position !== "GK") {
      awardsWon.push("golden_boot");
    }
    if (player.position === "GK" && seasonStats.cleanSheets >= 18) {
      awardsWon.push("golden_glove");
    }
    if (
      player.overall >= 88 &&
      (leagueResult.isChampion || trophiesWon.includes("continental_primary") || trophiesWon.includes("world_cup")) &&
      seasonStats.averageRating >= 7.6
    ) {
      const { rng: rBallon, success: wonBallon } = checkProbability(curRng, 0.45);
      curRng = rBallon;
      if (wonBallon) {
        awardsWon.push("ballon_dor");
      }
    }

    // Sponsorship & Boot Endorsements
    const sponsorshipWeekly = calculateWeeklySponsorshipEarnings(player);
    const sponsorshipAnnual = sponsorshipWeekly * 52;

    if (player.bootDeal && player.bootDeal.tier !== "Signature Icon") {
      if (player.overall >= 88 || awardsWon.includes("ballon_dor") || awardsWon.includes("golden_boot")) {
        player.bootDeal.tier = "Signature Icon";
        player.bootDeal.signatureBootUnlocked = true;
        player.bootDeal.colorway = player.bootDeal.signatureName || "Championship Gold & Chrome";
        newLog.push({
          age: player.age,
          type: "signature_boot_unlocked",
          description:
            `${player.bootDeal.brand} awarded you your own custom Signature Icon boot: '${player.bootDeal.modelName} - ${player.bootDeal.colorway}'!`,
        });
      }
    }

    // Dressing Room Captaincy
    if (player.age >= 24 && player.managerTrust >= 85 && player.captaincyStatus === "none") {
      player.captaincyStatus = "club_captain";
      player.morale = Math.min(100, player.morale + 10);
      newLog.push({
        age: player.age,
        type: "captaincy_awarded",
        description: `Chosen as Club Captain for ${
          team.short_name || team.name
        } due to commanding locker room presence and managerial trust!`,
      });
    }

    const rawWage = player.contract ? player.contract.annualSalary : 50000;
    const netWage = Math.max(0, rawWage - (lifestyleWeeklyCost * 52)) + lifestylePassiveIncome + sponsorshipAnnual;
    if (player.contract) {
      player.contract.yearsRemaining = Math.max(0, player.contract.yearsRemaining - 1);
    }

    // Social Media Follower Growth
    if (player.socialMedia) {
      const sm = player.socialMedia;
      if (sm.instagram && sm.instagram.active) {
        const baseGrowth = Math.round(Math.pow(player.overall / 10, 2) * 16000);
        const clubMult = 1 + (team.international_reputation || 1) * 0.45;
        let trophiesBonus = 0;
        if (trophiesWon.includes("league")) trophiesBonus += 750000;
        if (trophiesWon.includes("cup")) trophiesBonus += 350000;
        if (trophiesWon.includes("continental_primary")) trophiesBonus += 3800000;
        if (trophiesWon.includes("world_cup")) trophiesBonus += 10000000;
        if (awardsWon.includes("ballon_dor")) trophiesBonus += 18000000;
        if (awardsWon.includes("golden_boot")) trophiesBonus += 5000000;

        const seasonGain = Math.round((baseGrowth * clubMult + trophiesBonus) * lifestyleFollowerMult);
        sm.instagram.followers += seasonGain;
        if (sm.instagram.followers >= 100000) sm.instagram.verified = true;
        sm.instagram.totalPosts += 12;
      }

      if (sm.tiktok && sm.tiktok.active) {
        const goalsBonus = seasonStats.goals * 70000;
        const formBonus = player.form >= 70 ? 1000000 : 200000;
        const wonderkidBonus = (currentSeasonAge < 22 && player.overall >= 74) ? 1800000 : 0;
        const seasonGain = Math.round((goalsBonus + formBonus + wonderkidBonus) * lifestyleFollowerMult);
        sm.tiktok.followers += seasonGain;
        if (sm.tiktok.followers >= 100000) sm.tiktok.verified = true;
        sm.tiktok.totalPosts += 18;
      }

      if (sm.x && sm.x.active) {
        const baseGain = Math.max(50000, (player.overall - 45) * 12000);
        let awardsBonus = 0;
        if (awardsWon.includes("ballon_dor")) awardsBonus += 7000000;
        if (awardsWon.includes("golden_boot")) awardsBonus += 2000000;
        if (seasonStats.averageRating >= 7.4) awardsBonus += 400000;
        const seasonGain = Math.round((baseGain + awardsBonus) * lifestyleFollowerMult);
        sm.x.followers += seasonGain;
        if (sm.x.followers >= 100000) sm.x.verified = true;
        sm.x.totalPosts += 24;
      }

      sm.totalFollowers = (sm.instagram?.followers || 0) + (sm.tiktok?.followers || 0) + (sm.x?.followers || 0);
    }

    player.careerTotals.appearances += seasonStats.appearances;
    player.careerTotals.goals += seasonStats.goals;
    player.careerTotals.assists += seasonStats.assists;
    player.careerTotals.cleanSheets += seasonStats.cleanSheets;
    player.careerTotals.goalsConceded += seasonStats.goalsConceded;
    player.careerTotals.trophies += trophiesWon.length;
    player.careerTotals.awards += awardsWon.length;
    player.careerTotals.totalWagesEarned += netWage;

    const snapshot = {
      id: `season-${state.seed}-${newSeasons.length + 1}`,
      index: newSeasons.length + 1,
      periodIndex: Math.floor(newSeasons.length / seasonsToSimulate) + 1,
      age: currentSeasonAge,
      teamId: team.id,
      competitionId: comp.id,
      competitionTier: comp.tier,
      overall: player.overall,
      attributes: { ...player.attributes },
      marketValue: player.marketValue,
      wage: player.contract?.weeklyWage || 1000,
      stats: seasonStats,
      leaguePosition: leagueResult.playerRank,
      leagueTotalTeams: comp.teams.length,
      leaguePoints: leagueResult.playerPoints,
      leagueTable: leagueResult.table,
      topScorers: leagueResult.topScorers,
      topPlaymakers: leagueResult.topPlaymakers,
      trophies: trophiesWon,
      awards: awardsWon,
      relegated: leagueResult.isRelegated,
      promoted: false,
      contractYearsRemaining: player.contract?.yearsRemaining || 0,
      managerTrust: player.managerTrust,
      morale: player.morale,
      injuryOccurred: seasonInjury,
      totalFollowers: player.socialMedia?.totalFollowers || 0,
      continentalRun,
    };
    newSeasons.push(snapshot);

    const roleMult = currentSeasonAge < 20 ? 1.0 : seasonStats.appearances > 25 ? 1.0 : 0.8;
    const { rng: rEvolve, attributes: newAttrs, newOverall } = evolveAttributes(
      curRng,
      player.position,
      player.attributes,
      player.age,
      player.developmentProfile,
      roleMult,
    );
    curRng = rEvolve;

    player.attributes = newAttrs;
    player.overall = newOverall;
    player.age += 1;

    const { rng: rVal, marketValue: newMval } = calculateMarketValue(curRng, player.overall, player.age, player.form);
    curRng = rVal;
    player.marketValue = newMval;

    // Variable retirement: early exits (~31-33) through to iron-man careers (40+)
    const retireCheck = checkRetirement(curRng, player, seasonInjury, { minRetirementAge: player.minRetirementAge });
    curRng = retireCheck.rng;
    if (retireCheck.retire) {
      retirementReason = retireCheck.reason;
      break;
    }
  }

  if (retirementReason) {
    newLog.push({ age: player.age, type: "retired", description: `${player.lastName}: ${retirementReason}` });
    return {
      ...state,
      rngState: curRng.state,
      phase: "summary",
      player,
      currentTeamId,
      seasons: newSeasons,
      currentEvent: null,
      retirementReason,
      lastDilemmaOutcome,
      log: newLog,
    };
  }

  const nextEvent = generateNextCareerEvent(curRng, player, currentTeamId, newSeasons);
  curRng = nextEvent.rng;

  // Veterans can choose to walk away on their own terms
  if (player.age >= 32 && nextEvent.event && nextEvent.event.type !== "clutch_moment") {
    nextEvent.event.options.push({
      id: `retire-${player.age}`,
      type: "retire",
      label: "Announce Retirement",
      description: `Call time on your career at ${player.age} and enter the Hall of Fame.`,
    });
  }

  return {
    ...state,
    rngState: curRng.state,
    step: state.step + 1,
    player,
    currentTeamId,
    currentCompetitionId: currentCompId,
    currentEvent: nextEvent.event,
    seasons: newSeasons,
    lastDilemmaOutcome,
    log: newLog,
  };
}

function generateNextCareerEvent(
  rng,
  player,
  currentTeamId,
  _seasons,
) {
  let curRng = rng;
  const currentTeam = currentTeamId ? catalogIndex.getTeam(currentTeamId) : null;
  const comp = currentTeamId ? catalogIndex.getCompetition(currentTeamId) : null;

  const contractYears = player.contract?.yearsRemaining ?? 0;

  if (contractYears === 0) {
    const targetRep = Math.max(0, Math.min(5, Math.floor((player.overall - 50) / 8)));
    const candidateTeams = catalogIndex.getTeamsByReputation(targetRep).filter((t) => t.id !== currentTeamId);

    const picked = [];
    while (picked.length < 3 && candidateTeams.length > 0) {
      const { rng: r, item } = pickRandom(curRng, candidateTeams);
      curRng = r;
      if (!picked.some((t) => t.id === item.id)) picked.push(item);
    }

    const options = picked.map((t) => {
      const wage = calculateWeeklyWage(player.marketValue, t.international_reputation, "starter");
      return {
        id: `bosman-${t.id}`,
        type: "join_club",
        teamId: t.id,
        label: `Free Transfer to ${t.short_name || t.name}`,
        description: `Contract expired. 3-yr deal at €${wage.toLocaleString()}/wk with signing bonus.`,
        contractOffer: {
          years: 3,
          weeklyWage: wage,
          squadRole: "starter",
        },
      };
    });

    if (currentTeam) {
      const stayWage = calculateWeeklyWage(player.marketValue, currentTeam.international_reputation, "rotation");
      options.push({
        id: `stay-renew-${currentTeam.id}`,
        type: "renew_contract",
        teamId: currentTeam.id,
        label: `Re-sign with ${currentTeam.short_name || currentTeam.name}`,
        description: `Sign a 3-year extension at €${stayWage.toLocaleString()}/wk.`,
      });
    }

    return {
      rng: curRng,
      event: {
        id: `event-free-agency-${player.age}`,
        type: "contract_non_renewal",
        age: player.age,
        eventKey: "contract_expired",
        options,
      },
    };
  }

  if (contractYears === 1 && currentTeam) {
    const renewalWage = Math.round((player.contract?.weeklyWage || 10000) * 1.25);
    const targetRep = Math.max(0, Math.min(5, Math.floor((player.overall - 50) / 8)));
    const buyers = catalogIndex.getTeamsByReputation(targetRep).filter((t) => t.id !== currentTeamId);

    const buyer = buyers.length > 0 ? pickRandom(curRng, buyers) : null;
    if (buyer) curRng = buyer.rng;

    const options = [
      {
        id: `renew-${currentTeam.id}`,
        type: "renew_contract",
        teamId: currentTeam.id,
        label: `Extend with ${currentTeam.short_name || currentTeam.name}`,
        description: `Sign 3-year extension with 25% wage increase (€${renewalWage.toLocaleString()}/wk).`,
      },
    ];

    if (buyer) {
      const fee = calculateTransferFee(player.marketValue, 1, buyer.item.international_reputation);
      const buyerWage = calculateWeeklyWage(player.marketValue, buyer.item.international_reputation, "starter");
      options.push({
        id: `transfer-${buyer.item.id}`,
        type: "permanent_transfer",
        teamId: buyer.item.id,
        label: `Move to ${buyer.item.short_name || buyer.item.name}`,
        description: `Bidded €${(fee / 1000000).toFixed(1)}M transfer fee. Offer: €${buyerWage.toLocaleString()}/wk.`,
        contractOffer: {
          years: 4,
          weeklyWage: buyerWage,
          squadRole: "starter",
        },
      });
    }

    options.push({
      id: `stay-current-${currentTeam.id}`,
      type: "stay",
      teamId: currentTeam.id,
      label: `Play Out Final Year`,
      description: `Run down your contract and leave on a free transfer next summer.`,
    });

    return {
      rng: curRng,
      event: {
        id: `event-contract-final-year-${player.age}`,
        type: "contract_renewal",
        age: player.age,
        eventKey: "contract_final_year",
        options,
      },
    };
  }

  // Case 2.5: International Allegiance Crossroads (Dual Nationality)
  if (player.secondNationality && !player.capTiedNationality && player.age >= 18 && player.age <= 22) {
    const { rng: rDual, success: triggerDual } = checkProbability(curRng, 0.40);
    curRng = rDual;
    if (triggerDual) {
      const nat1 = player.nationality;
      const nat2 = player.secondNationality;
      return {
        rng: curRng,
        event: {
          id: `event-dual-nat-${player.age}`,
          type: "dual_nationality_declaration",
          age: player.age,
          eventKey: "international_crossroads",
          title: "🌍 International Allegiance Crossroads",
          description:
            `Both ${nat1.name_en} and ${nat2.name_en} national team scouts have made direct contact ahead of the upcoming qualification cycle. You hold dual citizenship—where does your heart lie?`,
          options: [
            {
              id: `dual-commit-${nat1.fifa_code}`,
              type: "dual_nationality_choice",
              optionKey: "commit_first",
              label: `Pledge Allegiance to ${nat1.name_en}`,
              description:
                `Commit permanently to ${nat1.name_en}. Become cap-tied and secure your place in their national squad.`,
            },
            {
              id: `dual-switch-${nat2.fifa_code}`,
              type: "dual_nationality_choice",
              optionKey: "switch_second",
              label: `Switch Allegiance to ${nat2.name_en}`,
              description:
                `File formal paperwork with FIFA to switch allegiance to ${nat2.name_en}. An emotional turning point.`,
            },
            {
              id: `dual-defer`,
              type: "dual_nationality_choice",
              optionKey: "defer",
              label: `Defer Decision for Now`,
              description:
                `Tell both federations you want to concentrate on club football before committing your international career.`,
            },
          ],
        },
      };
    }
  }

  // Case 2.6: Dressing Room Hierarchy & Shirt Number Battle (15% chance)
  if (player.age <= 28 && currentTeam) {
    const { rng: rShirt, success: triggerShirt } = checkProbability(curRng, 0.15);
    curRng = rShirt;
    if (triggerShirt) {
      const prefNum = player.preferredNumber;
      const altNum = prefNum === 10
        ? 11
        : prefNum === 7
        ? 17
        : prefNum === 9
        ? 19
        : prefNum === 1
        ? 13
        : ((prefNum % 89) + 10);
      return {
        rng: curRng,
        event: {
          id: `event-shirt-showdown-${player.age}`,
          type: "shirt_number_showdown",
          age: player.age,
          eventKey: "locker_room_number_battle",
          title: `👕 Squad Number Clash: Who Gets #${prefNum}?`,
          description:
            `Senior teammate and dressing room heavyweight also lays claim to shirt #${prefNum}. How will you handle the locker room hierarchy?`,
          options: [
            {
              id: `shirt-yield`,
              type: "shirt_choice",
              optionKey: "yield",
              alternativeNumber: altNum,
              label: `Yield Graciously & Take #${altNum}`,
              description:
                `Respect locker room seniority and take #${altNum}. Wins over teammates and manager trust (+8 Trust).`,
            },
            {
              id: `shirt-buy`,
              type: "shirt_choice",
              optionKey: "buy_watch",
              label: `Bribe Teammate with a Luxury Rolex (€30k)`,
              description:
                `Smooth things over by gifting your teammate a custom diamond Rolex in exchange for #${prefNum}.`,
            },
            {
              id: `shirt-demand`,
              type: "shirt_choice",
              optionKey: "demand",
              label: `Demand #${prefNum} Through Board & Agent`,
              description:
                `Assert your star power. Club hierarchy orders the number handed to you, but creates dressing room tension (-8 Trust).`,
            },
          ],
        },
      };
    }
  }

  // 2. High-Stakes Career Dilemma (30% chance)
  const { rng: rDilemma, success: triggerDilemma } = checkProbability(curRng, 0.30);
  curRng = rDilemma;
  if (triggerDilemma && currentTeam) {
    const dilemma = generateCareerDilemma(curRng, player, player.agent, currentTeam);
    return dilemma;
  }

  // 3. Position-Specific Clutch Moment (25% chance)
  const { rng: rClutch, success: triggerClutch } = checkProbability(curRng, 0.25);
  curRng = rClutch;
  if (triggerClutch && currentTeam) {
    const clutch = generateClutchMoment(curRng, player, currentTeam, comp?.name || "Championship");
    return clutch;
  }

  // 4. Transfer Market Window (Agent leverage boosts access to top tier clubs)
  const agentLeverage = player.agent?.transferLeverage || 5;
  const targetRep = Math.max(0, Math.min(5, Math.floor((player.overall - 48) / 8) + (agentLeverage >= 8 ? 1 : 0)));
  const candidates = catalogIndex.getTeamsByReputation(targetRep).filter((t) => t.id !== currentTeamId);

  const picked = [];
  while (picked.length < 2 && candidates.length > 0) {
    const { rng: r, item } = pickRandom(curRng, candidates);
    curRng = r;
    if (!picked.some((t) => t.id === item.id)) picked.push(item);
  }

  const options = picked.map((t) => {
    const baseWage = calculateWeeklyWage(player.marketValue, t.international_reputation, "starter");
    const wage = calculateAgentNegotiatedWage(baseWage, player.agent);
    const fee = calculateTransferFee(player.marketValue, contractYears, t.international_reputation);
    return {
      id: `transfer-${t.id}`,
      type: "join_club",
      teamId: t.id,
      label: `Transfer to ${t.short_name || t.name}`,
      description: `Fee: €${(fee / 1000000).toFixed(1)}M. Contract: 3 yrs at €${wage.toLocaleString()}/wk${
        player.agent ? ` (${player.agent.name})` : ""
      }.`,
      contractOffer: {
        years: 3,
        weeklyWage: wage,
        squadRole: "starter",
      },
    };
  });

  if (currentTeam) {
    options.push({
      id: `stay-${currentTeam.id}`,
      type: "stay",
      teamId: currentTeam.id,
      label: `Stay at ${currentTeam.short_name || currentTeam.name}`,
      description: `Continue in your current role (${contractYears} yrs remaining).`,
    });
  }

  return {
    rng: curRng,
    event: {
      id: `event-transfer-${player.age}`,
      type: "transfer",
      age: player.age,
      eventKey: "transfer_market",
      options,
    },
  };
}

export function hireNewAgent(state, agentId) {
  if (!state.player) return state;
  const newAgent = getAgentById(agentId);
  const player = { ...state.player, agent: newAgent };
  const newLog = [...state.log, {
    age: player.age,
    type: "agent_hired",
    description: `Hired ${newAgent.name} from ${newAgent.agency} (${newAgent.country}) as personal representative.`,
  }];
  return { ...state, player, log: newLog };
}

export function fireCurrentAgent(state) {
  if (!state.player || !state.player.agent) return state;
  const oldAgentName = state.player.agent.name;
  const player = { ...state.player, agent: null };
  const newLog = [...state.log, {
    age: player.age,
    type: "agent_fired",
    description: `Terminated representation contract with ${oldAgentName}. Currently self-represented.`,
  }];
  return { ...state, player, log: newLog };
}

export function renegotiateWageWithCurrentAgent(state) {
  if (!state.player || !state.player.contract) {
    return { state, success: false, message: "No active club contract to renegotiate." };
  }
  const agent = state.player.agent;
  const neg = agent?.negotiation || 4;
  const successChance = 0.40 + (neg * 0.05);
  const curRng = { seed: state.seed, state: state.rngState };
  const { rng: nextRng, success } = checkProbability(curRng, successChance);

  const player = { ...state.player, contract: { ...state.player.contract } };
  const newLog = [...state.log];
  if (success) {
    const boostPct = 0.10 + (neg * 0.02);
    player.contract.weeklyWage = Math.round(player.contract.weeklyWage * (1 + boostPct));
    player.contract.annualSalary = player.contract.weeklyWage * 52;
    player.morale = Math.min(100, player.morale + 10);
    const msg = `Success! ${
      agent ? agent.name : "You"
    } successfully renegotiated with club leadership, boosting weekly wage to €${player.contract.weeklyWage.toLocaleString()}/wk (+${
      Math.round(boostPct * 100)
    }%)!`;
    newLog.push({ age: player.age, type: "contract_renegotiated", description: msg });
    return { state: { ...state, rngState: nextRng.state, player, log: newLog }, success: true, message: msg };
  } else {
    player.managerTrust = Math.max(0, player.managerTrust - 6);
    const msg =
      `The club board rejected the wage demands. The manager expressed frustration with mid-season contract demands (-6 Trust).`;
    newLog.push({ age: player.age, type: "contract_renegotiation_failed", description: msg });
    return { state: { ...state, rngState: nextRng.state, player, log: newLog }, success: false, message: msg };
  }
}

export function toggleLifestyleChoice(player, choiceId) {
  if (!player.lifestyleChoices) {
    player.lifestyleChoices = JSON.parse(JSON.stringify(DEFAULT_LIFESTYLE_CHOICES));
  }
  const choice = player.lifestyleChoices.find((c) => c.id === choiceId);
  if (!choice) return false;
  choice.active = !choice.active;
  if (choice.active) {
    if (choice.buffs.moraleBonus) player.morale = Math.min(100, player.morale + choice.buffs.moraleBonus);
    if (choice.buffs.trustBonus) player.managerTrust = Math.min(100, player.managerTrust + choice.buffs.trustBonus);
    if (choice.nerfs.trustPenalty) player.managerTrust = Math.max(10, player.managerTrust - choice.nerfs.trustPenalty);
  }
  return choice.active;
}

export function activateSocialMediaAccount(player, platform) {
  if (!player.socialMedia) {
    const cleanHandle = (player.lastName || "player").toLowerCase().replace(/[^a-z0-9]/g, "");
    player.socialMedia = {
      instagram: {
        platform: "instagram",
        name: "Instagram",
        icon: "📸",
        color: "#E1306C",
        active: false,
        handle: `@${cleanHandle}.${player.preferredNumber || 10}`,
        followers: 0,
        verified: false,
        totalPosts: 0,
      },
      tiktok: {
        platform: "tiktok",
        name: "TikTok",
        icon: "🎵",
        color: "#00F2FE",
        active: false,
        handle: `@${cleanHandle}_official`,
        followers: 0,
        verified: false,
        totalPosts: 0,
      },
      x: {
        platform: "x",
        name: "X",
        icon: "🐦",
        color: "#FFFFFF",
        active: false,
        handle: `@${cleanHandle}_football`,
        followers: 0,
        verified: false,
        totalPosts: 0,
      },
      totalFollowers: 0,
    };
  }
  const account = player.socialMedia[platform];
  if (!account) return null;
  account.active = true;
  const initialBase = player.age <= 17 ? 4500 : Math.round(Math.pow(player.overall / 10, 2) * 5000);
  account.followers = Math.max(account.followers, initialBase);
  account.totalPosts = Math.max(account.totalPosts, 1);
  player.socialMedia.totalFollowers = (player.socialMedia.instagram?.followers || 0) +
    (player.socialMedia.tiktok?.followers || 0) + (player.socialMedia.x?.followers || 0);
  return account;
}

export function postSocialMediaUpdate(player, platform, seedOrRng) {
  if (!player.socialMedia || !player.socialMedia[platform] || !player.socialMedia[platform].active) {
    return { success: false, message: "Account not active." };
  }
  const acc = player.socialMedia[platform];
  acc.totalPosts += 1;

  let curRng;
  if (typeof seedOrRng === "object" && seedOrRng && "state" in seedOrRng) {
    curRng = seedOrRng;
  } else if (typeof seedOrRng === "string" && seedOrRng.length > 0) {
    curRng = createPRNG(`${seedOrRng}-social-${platform}-${acc.totalPosts}`);
  } else {
    curRng = createPRNG(`${player.id || "player"}-social-${platform}-${acc.totalPosts}`);
  }

  const { rng: r1, value: randFactor } = randomFloat(curRng, 0, 1);
  const gain = Math.round(15000 + (player.overall * 800) + randFactor * 25000);
  acc.followers += gain;
  if (acc.followers >= 100000) acc.verified = true;
  player.socialMedia.totalFollowers = (player.socialMedia.instagram?.followers || 0) +
    (player.socialMedia.tiktok?.followers || 0) +
    (player.socialMedia.x?.followers || 0);

  const sampleCaptions = [
    "Three points in the bag! Focused on next week 🔥⚽",
    "Honored to wear this jersey every weekend. Thank you fans! 🙌",
    "Recovery session done. Locked in on next match 🧊💪",
    "Dream big, work in silence, let success make the noise ⚡",
    "Big performance from the boys today. We keep pushing 🚀",
  ];
  const { item: caption } = pickRandom(r1, sampleCaptions);
  return { success: true, gain, caption, followers: acc.followers };
}

export {
  calculateWeeklySponsorshipEarnings,
  generatePressConference,
  getAvailableBootDeals,
  getAvailableBrandSponsorships,
  resolvePressAnswer,
  signBootDeal,
  signBrandSponsorship,
};
