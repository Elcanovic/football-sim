import type { Competition, Team } from "../data/index.ts";
import type { LeagueTableEntry, TopPlaymakerEntry, TopScorerEntry } from "./types.ts";
import { PRNG, randomFloat, randomInt } from "./prng.ts";

export interface LeagueSimResult {
  rng: PRNG;
  table: LeagueTableEntry[];
  playerRank: number;
  playerPoints: number;
  isChampion: boolean;
  isRelegated: boolean;
  topScorers: TopScorerEntry[];
  topPlaymakers: TopPlaymakerEntry[];
}

// Quick Poisson random generator for football scores
function samplePoisson(rng: PRNG, lambda: number): { rng: PRNG; goals: number } {
  let curRng = rng;
  const L = Math.exp(-lambda);
  let k = 0;
  let p = 1;
  do {
    k++;
    const next = randomFloat(curRng, 0, 1);
    curRng = next.rng;
    p *= next.value;
  } while (p > L && k < 12);
  return { rng: curRng, goals: Math.max(0, k - 1) };
}

/**
 * Fast-Paced League Standings Simulator:
 * Simulates all 380 matchdays in ~1.5ms using expected goals & Poisson match distribution.
 */
export function simulateLeagueSeason(
  rng: PRNG,
  competition: Competition,
  playerTeamId: string | null,
  playerOvr: number,
  playerSeasonGoals: number,
  playerLastName: string,
  playerSeasonAssists: number = 0,
): LeagueSimResult {
  let curRng = rng;
  const teams = competition.teams;
  const n = teams.length;

  // Base ratings for each team
  interface TeamStats {
    team: Team;
    attack: number;
    defense: number;
    played: number;
    won: number;
    drawn: number;
    lost: number;
    gf: number;
    ga: number;
    pts: number;
    recentForm: ("W" | "D" | "L")[];
  }

  const teamStatsMap = new Map<string, TeamStats>();

  for (const t of teams) {
    // Reputation 0-5 mapped to rating 1.0 - 2.5
    let attack = 1.0 + (t.domestic_reputation * 0.22) + (t.continental_reputation * 0.12);
    let defense = 1.0 + (t.domestic_reputation * 0.20) + (t.continental_reputation * 0.10);

    // If this is the user player's team, boost based on player's overall
    if (t.id === playerTeamId) {
      const benchmarkOvr = 50 + t.international_reputation * 8;
      const ovrDelta = playerOvr - benchmarkOvr;
      if (ovrDelta > 0) {
        attack += ovrDelta * 0.02;
        defense += ovrDelta * 0.015;
      }
    }

    teamStatsMap.set(t.id, {
      team: t,
      attack,
      defense,
      played: 0,
      won: 0,
      drawn: 0,
      lost: 0,
      gf: 0,
      ga: 0,
      pts: 0,
      recentForm: [],
    });
  }

  // Simulate round-robin (Home & Away, 4 rounds for <=10 teams, 2 rounds for >10 teams)
  const HOME_ADVANTAGE = 0.28;
  const numCycles = n <= 10 ? 2 : 1;

  for (let cycle = 0; cycle < numCycles; cycle++) {
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        if (i === j) continue;
        const home = teamStatsMap.get(teams[i].id)!;
        const away = teamStatsMap.get(teams[j].id)!;

        // Calculate lambda goals
        const homeLambda = Math.max(0.4, Math.min(3.8, (home.attack / Math.max(0.6, away.defense)) + HOME_ADVANTAGE));
        const awayLambda = Math.max(0.3, Math.min(3.2, away.attack / Math.max(0.6, home.defense)));

        const homeRes = samplePoisson(curRng, homeLambda);
        curRng = homeRes.rng;
        const awayRes = samplePoisson(curRng, awayLambda);
        curRng = awayRes.rng;

        const hg = homeRes.goals;
        const ag = awayRes.goals;

        home.played++;
        away.played++;
        home.gf += hg;
        home.ga += ag;
        away.gf += ag;
        away.ga += hg;

        if (hg > ag) {
          home.won++;
          home.pts += 3;
          away.lost++;
          home.recentForm.push("W");
          away.recentForm.push("L");
        } else if (hg === ag) {
          home.drawn++;
          away.drawn++;
          home.pts += 1;
          away.pts += 1;
          home.recentForm.push("D");
          away.recentForm.push("D");
        } else {
          away.won++;
          away.pts += 3;
          home.lost++;
          home.recentForm.push("L");
          away.recentForm.push("W");
        }
      }
    }
  }

  // Sort by Points, then Goal Difference, then Goals For
  const sorted = Array.from(teamStatsMap.values()).sort((a, b) => {
    if (b.pts !== a.pts) return b.pts - a.pts;
    const gdA = a.gf - a.ga;
    const gdB = b.gf - b.ga;
    if (gdB !== gdA) return gdB - gdA;
    return b.gf - a.gf;
  });

  const table: LeagueTableEntry[] = sorted.map((s, index) => {
    const rank = index + 1;
    let status: LeagueTableEntry["status"] = "safe";

    if (rank === 1) {
      status = "champion";
    } else if (rank <= (n <= 10 ? 2 : 4) && competition.tier === 1) {
      status = "champions_league";
    } else if (rank <= (n <= 10 ? 4 : 6) && competition.tier === 1) {
      status = "europa_league";
    } else if (rank > n - (n <= 10 ? 1 : n <= 12 ? 2 : 3) && competition.tier < 3) {
      status = "relegated";
    }

    return {
      rank,
      teamId: s.team.id,
      teamName: s.team.short_name || s.team.name,
      played: s.played,
      won: s.won,
      drawn: s.drawn,
      lost: s.lost,
      goalsFor: s.gf,
      goalsAgainst: s.ga,
      goalDifference: s.gf - s.ga,
      points: s.pts,
      form: s.recentForm.slice(-5),
      status,
    };
  });

  const playerEntry = table.find((t) => t.teamId === playerTeamId);
  const playerRank = playerEntry?.rank ?? Math.round(n / 2);
  const playerPoints = playerEntry?.points ?? 0;
  const isChampion = playerRank === 1;
  const isRelegated = playerEntry?.status === "relegated";

  // Generate Top 5 Scorers Table
  const topScorers: TopScorerEntry[] = [];
  const topTeams = sorted.slice(0, 5);

  const starNames = [
    "V. Osimhen",
    "K. Mbappe",
    "E. Haaland",
    "H. Kane",
    "L. Martinez",
    "R. Lewandowski",
    "V. Junior",
    "M. Salah",
    "J. Alvarez",
    "C. Palmer",
    "A. Isak",
    "M. Thuram",
    "L. Diaz",
    "F. Chiesa",
    "B. Sesko",
  ];

  for (let i = 0; i < 4; i++) {
    const { rng: r1, value: nameIdx } = randomInt(curRng, 0, starNames.length - 1);
    const { rng: r2, value: goalCount } = randomInt(r1, 16 + (4 - i) * 3, 24 + (4 - i) * 4);
    curRng = r2;
    topScorers.push({
      rank: 0,
      playerName: starNames[nameIdx],
      teamId: topTeams[i % topTeams.length].team.id,
      goals: goalCount,
      isUserPlayer: false,
    });
  }

  // Insert player
  topScorers.push({
    rank: 0,
    playerName: playerLastName ? `${playerLastName[0]}. ${playerLastName}` : "You",
    teamId: playerTeamId ?? "",
    goals: playerSeasonGoals,
    isUserPlayer: true,
  });

  topScorers.sort((a, b) => b.goals - a.goals);
  topScorers.forEach((entry, idx) => {
    entry.rank = idx + 1;
  });

  // Generate Top 5 Playmakers (Assists) Table
  const topPlaymakers: TopPlaymakerEntry[] = [];
  const playmakerStars = [
    "K. De Bruyne",
    "L. Messi",
    "B. Fernandes",
    "M. Odegaard",
    "F. Wirtz",
    "J. Musiala",
    "Pedri",
    "T. Alexander-Arnold",
    "B. Saka",
    "L. Yamal",
    "J. Maddison",
    "H. Calhanoglu",
    "Lucas Paqueta",
    "G. Xhaka",
    "L. Modric",
  ];

  for (let i = 0; i < 4; i++) {
    const { rng: r1, value: nameIdx } = randomInt(curRng, 0, playmakerStars.length - 1);
    const { rng: r2, value: assistCount } = randomInt(r1, 10 + (4 - i) * 2, 16 + (4 - i) * 2);
    curRng = r2;
    topPlaymakers.push({
      rank: 0,
      playerName: playmakerStars[nameIdx],
      teamId: topTeams[(i + 1) % topTeams.length].team.id,
      assists: assistCount,
      isUserPlayer: false,
    });
  }

  // Insert player assists
  topPlaymakers.push({
    rank: 0,
    playerName: playerLastName ? `${playerLastName[0]}. ${playerLastName}` : "You",
    teamId: playerTeamId ?? "",
    assists: playerSeasonAssists,
    isUserPlayer: true,
  });

  topPlaymakers.sort((a, b) => b.assists - a.assists);
  topPlaymakers.forEach((entry, idx) => {
    entry.rank = idx + 1;
  });

  return {
    rng: curRng,
    table,
    playerRank,
    playerPoints,
    isChampion,
    isRelegated,
    topScorers: topScorers.slice(0, 5),
    topPlaymakers: topPlaymakers.slice(0, 5),
  };
}
