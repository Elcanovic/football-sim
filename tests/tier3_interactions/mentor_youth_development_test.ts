// Tier 3 Interaction Tests: Tactical Mentor Starts + Youth Developer Manager Growth
// Validates compounding development acceleration when agent secures starts under youth developer

import { createMockPlayer, loadEngineModule, test } from "../helpers.ts";
import { assert } from "../assert.ts";

test(3, "I05", "Tactical Mentor Guaranteed Starts Compounded with Youth Developer Manager Growth", async () => {
  const agentsModule = await loadEngineModule("../../src/engine/agents.ts", "I05_agents");
  const managerDNA = await loadEngineModule("../../src/engine/managerDNA.ts", "I05_manager");

  const mentor = agentsModule.getAgentArchetype
    ? agentsModule.getAgentArchetype("tactical_mentor")
    : agentsModule.AGENT_ARCHETYPES.tactical_mentor;
  const youthDev = managerDNA.createManager({
    personality: "Youth Developer",
  });

  const prospect = createMockPlayer({
    age: 18,
    overall: 65,
    agent: mentor,
  });

  // Evaluate starts allocation: Tactical mentor contract demands starting minutes
  const startsAllocated = managerDNA.calculateSeasonStartsAllocation(youthDev, prospect, {
    squadStatusGuarantee: "Important",
  });

  assert(startsAllocated.guaranteedStarts >= 25, "Youth Developer + Mentor must guarantee >= 25 starts");

  // Compound growth bonus: Youth developer base (+20%) + Match experience bonus (+15%)
  const growthRate = managerDNA.calculateCompoundSeasonGrowth(youthDev, prospect, {
    actualStarts: startsAllocated.guaranteedStarts,
  });

  assert(growthRate.multiplier >= 1.30, `Compounded growth rate must be >= 1.30x (+30%), got ${growthRate.multiplier}`);
});
