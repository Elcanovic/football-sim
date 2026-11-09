// Retirement Museum: Career Eras Scrapbook, Silverware Sanctuary, GOAT Legacy Index, and Post-Playing Pathways

export interface CareerEraChapter {
  id: string;
  title: string;
  teamId: string;
  seasonIndices: number[];
  appearances: number;
  goals: number;
  assists: number;
  trophiesWon: number;
  keyTeammates: string[];
  clutchMoments: string[];
}

export interface SilverwareCard {
  trophyId: string;
  trophyName: string;
  year: number;
  club: string;
  finalOpponent: string;
  finalScore: string;
  playerContribution: string;
}

export interface GoatIndexResult {
  score: number; // 0 - 1000
  tierName: string;
  radarBreakdown: {
    silverware: number;
    individualDominance: number;
    longevity: number;
    bigGameClutch: number;
  };
}

export interface PostCareerEpilogue {
  pathway: string;
  startingTier: "elite" | "top_flight" | "lower_league" | "grassroots";
  roleTitle: string;
  narrative: string;
}

/** The season fields era segmentation reads. A SeasonSnapshot satisfies it. */
export interface EraSeasonInput {
  index: number;
  teamId: string;
  stats?: { appearances?: number; goals?: number; assists?: number };
  trophies?: string[];
}

/** One won trophy as the Silverware Sanctuary receives it. Missing fields get display defaults. */
export interface TrophyRecordInput {
  trophyId?: string;
  trophyName?: string;
  year?: number;
  club?: string;
  finalOpponent?: string;
  finalScore?: string;
  playerContribution?: string;
}

/**
 * Procedurally segments career seasons into narrative "Era" chapters based on club tenures.
 */
export function generateCareerEras(careerSnapshots: EraSeasonInput[]): CareerEraChapter[] {
  if (!careerSnapshots || careerSnapshots.length === 0) return [];

  const eras: CareerEraChapter[] = [];
  let curClub = careerSnapshots[0].teamId;
  let curEraSnaps: EraSeasonInput[] = [];

  for (const snap of careerSnapshots) {
    if (snap.teamId !== curClub) {
      if (curEraSnaps.length > 0) {
        eras.push(buildEraChapter(eras.length + 1, curClub, curEraSnaps));
      }
      curClub = snap.teamId;
      curEraSnaps = [snap];
    } else {
      curEraSnaps.push(snap);
    }
  }

  if (curEraSnaps.length > 0) {
    eras.push(buildEraChapter(eras.length + 1, curClub, curEraSnaps));
  }

  return eras;
}

function buildEraChapter(eraIndex: number, teamId: string, snaps: EraSeasonInput[]): CareerEraChapter {
  const appearances = snaps.reduce((sum, s) => sum + (s.stats?.appearances || 0), 0);
  const goals = snaps.reduce((sum, s) => sum + (s.stats?.goals || 0), 0);
  const assists = snaps.reduce((sum, s) => sum + (s.stats?.assists || 0), 0);
  const trophies = snaps.reduce((sum, s) => sum + (s.trophies?.length || 0), 0);

  const cleanTeam = teamId ? teamId.replace(/^team-[a-z]+-/, "").toUpperCase() : "PRODIGY";
  const titles = [
    `The ${cleanTeam} Genesis`,
    `Dominance at ${cleanTeam}`,
    `The ${cleanTeam} Masterclass`,
    `The Twilight Redemption at ${cleanTeam}`,
  ];
  const title = titles[(eraIndex - 1) % titles.length] || `The ${cleanTeam} Era`;

  return {
    id: `era-${eraIndex}-${teamId}`,
    title,
    teamId,
    seasonIndices: snaps.map((s) => s.index),
    appearances,
    goals,
    assists,
    trophiesWon: trophies,
    keyTeammates: ["Captain Hernandez", "Playmaker Silva", "Targetman Varga"],
    clutchMoments: goals > 20
      ? ["Stoppage-time derby winner", "Continental semi-final brace"]
      : ["Crucial defensive clearance"],
  };
}

/**
 * Compiles trophy achievements into interactive Silverware Sanctuary showcase cards.
 */
export function compileSilverwareSanctuary(trophyRecords: TrophyRecordInput[] = []): SilverwareCard[] {
  return trophyRecords.map((t, idx) => ({
    trophyId: t.trophyId || `trophy-${idx}`,
    trophyName: t.trophyName || "Major Championship",
    year: t.year || 2026 + idx,
    club: t.club || "Current Club",
    finalOpponent: t.finalOpponent || "Continental Rivals",
    finalScore: t.finalScore || "2-1",
    playerContribution: t.playerContribution || "Played full 90 minutes with decisive leadership",
  }));
}

/**
 * Algorithmic GOAT Legacy Index normalized to 0 - 1000 scale.
 */
export function calculateGoatLegacyIndex(career: {
  totalTrophies?: number;
  peakOVR?: number;
  careerAppearances?: number;
  careerGoals?: number;
  ballonDorCount?: number;
  clutchMomentsCount?: number;
}): GoatIndexResult {
  const trophies = career.totalTrophies || 0;
  const peak = career.peakOVR || 70;
  const apps = career.careerAppearances || 0;
  const goals = career.careerGoals || 0;
  const ballon = career.ballonDorCount || 0;
  const clutch = career.clutchMomentsCount || 0;

  // 1. Silverware (max 350 pts)
  const silverware = Math.min(350, trophies * 25 + ballon * 40);

  // 2. Individual Dominance (max 250 pts)
  const ovrBonus = Math.max(0, (peak - 70) * 10);
  const goalBonus = Math.min(100, Math.round(goals * 0.18));
  const individualDominance = Math.min(250, ovrBonus + goalBonus);

  // 3. Longevity (max 250 pts)
  const longevity = Math.min(250, Math.round(apps * 0.35));

  // 4. Big Game Clutch (max 150 pts)
  const bigGameClutch = Math.min(150, clutch * 10);

  const rawScore = silverware + individualDominance + longevity + bigGameClutch;
  const score = Math.max(0, Math.min(1000, Math.round(rawScore)));

  let tierName = "Journeyman Professional";
  if (score >= 850) {
    tierName = "Immortal Legend";
  } else if (score >= 700) {
    tierName = "Continental Icon";
  } else if (score >= 500) {
    tierName = "Club Legend";
  } else if (score >= 300) {
    tierName = "Respected Top-Flight Stalwart";
  }

  return {
    score,
    tierName,
    radarBreakdown: {
      silverware,
      individualDominance,
      longevity,
      bigGameClutch,
    },
  };
}

/**
 * Returns available post-career transition options.
 */
export function getAvailablePostCareerPathways(): string[] {
  return ["Head Coach", "Pundit", "Club Ambassador"];
}

/**
 * Generates procedural post-career epilogue narrative based on pathway and player pedigree.
 */
export function generatePostCareerEpilogue(params: {
  pathway: string;
  goatScore?: number;
  lastClubId?: string;
  player?: {
    totalTrophies?: number;
    peakOVR?: number;
    careerAppearances?: number;
    careerGoals?: number;
  };
}): PostCareerEpilogue {
  const pathway = params.pathway || "Head Coach";
  const trophies = params.player?.totalTrophies ?? (params.goatScore && params.goatScore > 500 ? 5 : 0);
  const score = params.goatScore ?? (trophies * 40 + (params.player?.peakOVR ?? 75) * 5);

  let startingTier: "elite" | "top_flight" | "lower_league" | "grassroots" = "lower_league";
  let roleTitle = "Academy Coach";
  let narrative = "";

  if (
    pathway === "Head Coach" || pathway.toLowerCase().includes("coach") || pathway.toLowerCase().includes("manager")
  ) {
    if (trophies === 0 || score < 500) {
      startingTier = "lower_league";
      roleTitle = "Lower-League Head Coach";
      narrative =
        "Having retired without major silverware, you earned your UEFA coaching badges the hard way. A gritty lower-league club appointed you as their head coach, challenging you to build a resilient squad from the grassroots up.";
    } else if (score >= 850) {
      startingTier = "elite";
      roleTitle = "Elite Club Manager";
      narrative =
        "Your legendary status as an all-time football icon immediately opened the doors to Europe's elite dugouts. Appointed manager at a continental giant, expectations are nothing short of Champions League silverware.";
    } else {
      startingTier = "top_flight";
      roleTitle = "Top-Flight Head Coach";
      narrative =
        "Leveraging your solid top-flight playing reputation and tactical acumen, a mid-table first division club offered you their managerial reins to guide their youth renaissance.";
    }
  } else if (
    pathway === "Pundit" || pathway.toLowerCase().includes("pundit") || pathway.toLowerCase().includes("broadcaster")
  ) {
    startingTier = "top_flight";
    roleTitle = "Lead Television Pundit";
    narrative =
      "Signing a high-profile broadcasting deal with major sports television, your candid tactical breakdowns and unfiltered dressing-room anecdotes quickly turned you into the country's most quoted media personality.";
  } else {
    startingTier = "top_flight";
    roleTitle = "Global Club Ambassador & Technical Director";
    narrative =
      "Appointed as official Club Ambassador and technical recruitment advisor, you travel the world representing the badge, mentoring promising academy wonderkids, and opening international commercial partnerships.";
  }

  return {
    pathway,
    startingTier,
    roleTitle,
    narrative,
  };
}
