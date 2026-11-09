import { catalogIndex, executeDecisionAndSimulate, initPlayerCareer } from "./index.ts";

console.log("=================================================");
console.log("   ENHANCED HYBRID FOOTBALL CAREER SIMULATOR     ");
console.log("=================================================\n");

// 1. Initialize Player
const seed = Deno.args[0] || "career-benchmark-deterministic-2026";
let state = initPlayerCareer(
  seed,
  "long", // 1 season per decision
  "Valente",
  10,
  "right",
  "AR", // Argentina
  "ST",
  "normal",
);

if (state.player) {
  state.player.minRetirementAge = 36;
}

const attrs = state.player?.attributes as unknown as Record<string, number> | undefined;
const attrSummary = attrs
  ? `PAC ${attrs.pace} | SHO ${attrs.shooting} | PAS ${attrs.passing} | DRI ${attrs.dribbling} | DEF ${attrs.defending} | PHY ${attrs.physical}`
  : "";

console.log(`Starting Player: ${state.player?.lastName} (#${state.player?.preferredNumber})`);
console.log(`Nationality: ${state.player?.nationality.name_en} | Position: ${state.player?.position}`);
console.log(
  `Starting Overall: ${state.player?.overall} OVR | Market Value: €${state.player?.marketValue.toLocaleString()}`,
);
console.log(`Initial Attributes: ${attrSummary}`);
console.log("\nSimulating career progression...\n");

// 2. Play career until retirement
const simStartTime = performance.now();
let seasonCount = 0;
while (state.phase === "career" && state.player && state.player.age < 38) {
  seasonCount++;
  const event = state.currentEvent;
  if (!event || event.options.length === 0) break;

  // AI Decision Logic:
  // Prefer signing with highest reputation club or renewing contract
  let chosenOption = event.options[0];

  if (event.type === "academy_offer" || event.type === "transfer" || event.type === "contract_non_renewal") {
    // Pick the club with highest reputation among options
    let maxRep = -1;
    for (const opt of event.options) {
      if (opt.teamId) {
        const team = catalogIndex.getTeam(opt.teamId);
        if (team && team.international_reputation > maxRep) {
          maxRep = team.international_reputation;
          chosenOption = opt;
        }
      }
    }
  } else if (event.type === "contract_renewal") {
    // Renew if satisfied
    const renewOpt = event.options.find((o) => o.type === "renew_contract");
    if (renewOpt) chosenOption = renewOpt;
  } else if (event.type === "clutch_moment") {
    chosenOption = event.options[0];
  }

  state = executeDecisionAndSimulate(state, chosenOption.id);
}

const elapsedMs = (performance.now() - simStartTime).toFixed(2);

console.log("=================================================");
console.log(`CAREER TIMELINE (${state.seasons.length} Seasons simulated in ${elapsedMs} ms)`);
console.log("=================================================");

const lines: string[] = [];
lines.push(
  "Age | Team                 | Tier | OVR | PAC SHO PAS DRI DEF PHY | Apps | Gls | Ast | xG   | Rating | Pos  | Trophies & Awards",
);
lines.push("-".repeat(120));

for (const s of state.seasons) {
  const team = catalogIndex.getTeam(s.teamId);
  const teamName = (team?.short_name || team?.name || s.teamId).padEnd(20).slice(0, 20);
  const attrs = s.attributes as unknown as Record<string, number>;
  const attrStr = `${String(attrs.pace).padStart(2)}  ${String(attrs.shooting).padStart(2)}  ${
    String(attrs.passing).padStart(2)
  }  ${String(attrs.dribbling).padStart(2)}  ${String(attrs.defending).padStart(2)}  ${
    String(attrs.physical).padStart(2)
  }`;
  const trophiesStr = [...s.trophies, ...s.awards].join(", ") || "-";
  const posStr = `${s.leaguePosition}/${s.leagueTotalTeams}`.padEnd(5);

  lines.push(
    `${s.age}  | ${teamName} |  ${s.competitionTier}   | ${s.overall}  | ${attrStr} |  ${
      String(s.stats.appearances).padStart(2)
    }  | ${String(s.stats.goals).padStart(3)} | ${String(s.stats.assists).padStart(3)} | ${
      s.stats.xG.toFixed(1).padStart(4)
    } |  ${s.stats.averageRating.toFixed(2)}  | ${posStr} | ${trophiesStr}`,
  );
}

// Display one detailed league table from peak season (around age 26-28)
const peakSeason = state.seasons.find((s) => s.age === 27) ?? state.seasons[Math.floor(state.seasons.length / 2)];
if (peakSeason && peakSeason.leagueTable.length > 0) {
  const comp = catalogIndex.getCompetition(peakSeason.teamId);
  lines.push("\n=================================================");
  lines.push(`FULL LEAGUE TABLE AT AGE ${peakSeason.age} (${comp?.name ?? "League"})`);
  lines.push("=================================================");
  lines.push("Pos | Team                 | Pld |  W  |  D  |  L  |  GF  |  GA  |  GD  | Pts | Status");
  lines.push("-".repeat(85));

  for (const t of peakSeason.leagueTable) {
    const isPlayerTeam = t.teamId === peakSeason.teamId;
    const marker = isPlayerTeam ? "★ " : "  ";
    const name = (marker + t.teamName).padEnd(20).slice(0, 20);
    const gd = (t.goalDifference >= 0 ? `+${t.goalDifference}` : `${t.goalDifference}`).padStart(4);
    lines.push(
      `${String(t.rank).padStart(2)}  | ${name} | ${t.played}  | ${String(t.won).padStart(2)}  | ${
        String(t.drawn).padStart(2)
      }  | ${String(t.lost).padStart(2)}  | ${String(t.goalsFor).padStart(3)}  | ${
        String(t.goalsAgainst).padStart(3)
      }  | ${gd} | ${String(t.points).padStart(3)} | ${t.status}`,
    );
  }

  lines.push("\nTop Scorers in League:");
  for (const sc of peakSeason.topScorers) {
    const star = sc.isUserPlayer ? "★ (YOU)" : "";
    lines.push(`  #${sc.rank} ${sc.playerName.padEnd(18)} - ${sc.goals} goals ${star}`);
  }
}

lines.push("\n=================================================");
lines.push("               CAREER TOTALS & FINANCES          ");
lines.push("=================================================");
const totals = state.player?.careerTotals;
const nat = state.player?.nationalTeamStats;
lines.push(`Total Appearances:   ${totals?.appearances}`);
lines.push(`Total Goals:         ${totals?.goals}`);
lines.push(`Total Assists:       ${totals?.assists}`);
lines.push(`Total Trophies:      ${totals?.trophies}`);
lines.push(`Individual Awards:   ${totals?.awards}`);
lines.push(`Total Wages Earned:  €${totals?.totalWagesEarned.toLocaleString()}`);
lines.push(`Peak Market Value:   €${Math.max(...state.seasons.map((s) => s.marketValue)).toLocaleString()}`);
lines.push(`Peak Overall:        ${Math.max(...state.seasons.map((s) => s.overall))} OVR`);
lines.push(`\n--- NATIONAL TEAM STATS (${state.player?.nationality.name_en}) ---`);
lines.push(`International Caps:  ${nat?.appearances || 0}`);
lines.push(`International Goals: ${nat?.goals || 0}`);
lines.push(`International Asts:  ${nat?.assists || 0}`);
lines.push(`National Trophies:   ${nat?.trophies.join(", ") || "None"}`);
lines.push("=================================================\n");

const fullReport = lines.join("\n");
Deno.writeTextFileSync("career_summary.txt", fullReport);

console.log(`\nSimulation complete! Full season-by-season log saved to career_summary.txt`);
console.log(
  `Peak OVR: ${Math.max(...state.seasons.map((s) => s.overall))} | Peak Market Value: €${
    Math.max(...state.seasons.map((s) => s.marketValue)).toLocaleString()
  }`,
);
console.log(
  `Club + National Totals: ${totals?.appearances} Apps | ${totals?.goals} Goals | ${totals?.assists} Assists | ${totals?.trophies} Trophies`,
);
console.log(
  `National Team: ${nat?.appearances || 0} Caps | ${nat?.goals || 0} Int. Goals | ${
    nat?.trophies.length || 0
  } Int. Trophies`,
);
console.log(`Total Wages: €${totals?.totalWagesEarned.toLocaleString()}`);
