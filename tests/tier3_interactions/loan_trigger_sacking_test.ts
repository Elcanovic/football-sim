// Tier 3 Interaction Tests: Loan Mandatory Trigger + Mid-Season Manager Sacking
// Validates interaction between loan buy triggers and dynamic manager replacement

import { createMockPlayer, loadEngineModule, test } from "../helpers.ts";
import { assertStrictEquals } from "../assert.ts";

test(3, "I02", "Loan Mandatory Appearance Trigger Intersects with Mid-Season Manager Sacking", async () => {
  const loansEngine = await loadEngineModule("../../src/engine/loansEngine.ts", "I02_loans");
  const managerDNA = await loadEngineModule("../../src/engine/managerDNA.ts", "I02_manager");

  // Step 1: Player loaned to struggling club with 20-appearance buy trigger
  const loanDeal = loansEngine.createLoanDeal({
    type: "full_season",
    parentClubId: "team-eng-chelsea",
    loaningClubId: "team-eng-leeds",
    parentWageShare: 50,
    loaningWageShare: 50,
    mandatoryTriggers: {
      minAppearances: 20,
      buyFee: 15_000_000,
    },
  });

  // Step 2: Under first manager (Youth Developer), player makes 12 starts in 18 matches
  let currentAppearances = 12;

  // Step 3: Club underperforms; board sacks Youth Developer and hires Win-Now Tyrant
  const sackedManager = managerDNA.createManager({ personality: "Youth Developer", boardExpectation: "mid_table" });
  const midSeasonEval = managerDNA.evaluateMidSeasonTenure(sackedManager, {
    currentLeaguePosition: 18,
    matchesPlayed: 18,
    points: 14,
  });
  assertStrictEquals(midSeasonEval.sacked, true);

  const tyrant = managerDNA.createManager({ personality: "Win-Now Tyrant", boardExpectation: "survive" });

  // Step 4: Tyrant re-evaluates player; player form is 50 -> tyrant benches player
  const player = createMockPlayer({ form: 50, managerTrust: 65 });
  const selection = managerDNA.evaluateSquadSelection(tyrant, player);
  assertStrictEquals(selection.startingStatus, "benched");

  // Player only gets 4 sporadic substitute appearances in second half (total 16/20)
  currentAppearances += 4;
  assertStrictEquals(currentAppearances, 16);

  // Step 5: Loan trigger evaluated at season end -> fails due to tyrant benching!
  const triggerResult = loansEngine.evaluateMandatoryTriggers(loanDeal, { appearances: currentAppearances });
  assertStrictEquals(
    triggerResult.mustExecuteBuy,
    false,
    "Trigger must not execute due to falling short of 20 appearances",
  );
  assertStrictEquals(triggerResult.returnToParentClub, true, "Player returns to parent club");
});
