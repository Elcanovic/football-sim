// Tier 1 Feature Tests: Milestone 2 Agent Archetypes (Features 22–25)
// The Super-Agent, The Family Relative, The Tactical Mentor, Self-Represented

import { loadEngineModule, test } from "../helpers.ts";
import { assert, assertAlmostEquals, assertStrictEquals } from "../assert.ts";

// F22: Agent: The Super-Agent
test(1, "F22", "Super-Agent Archetype High Commission and Leverage Dynamics", async () => {
  const agentsModule = await loadEngineModule("../../src/engine/agents.ts", "F22");

  // Verify helper exists or archetypes catalog
  const archetype = agentsModule.getAgentArchetype ? agentsModule.getAgentArchetype("super_agent") : null;
  assert(archetype || agentsModule.AGENT_ARCHETYPES?.super_agent, "Super-agent archetype must be defined");

  const superAgent = archetype || agentsModule.AGENT_ARCHETYPES.super_agent;
  assert(
    superAgent.commissionRange[0] >= 12 && superAgent.commissionRange[1] <= 15,
    "Super-Agent commission must be between 12% and 15%",
  );
  assert(superAgent.leverageBoost >= 20, "Super-Agent must provide >= +20 leverage boost");
  assertStrictEquals(superAgent.priority, "maximum_wages");
});

// F23: Agent: The Family Relative
test(1, "F23", "Family Relative Archetype Low Commission and High Loyalty", async () => {
  const agentsModule = await loadEngineModule("../../src/engine/agents.ts", "F23");
  const relative = agentsModule.getAgentArchetype
    ? agentsModule.getAgentArchetype("family_relative")
    : agentsModule.AGENT_ARCHETYPES?.family_relative;
  assert(relative, "Family relative archetype must be defined");
  assert(
    relative.commissionRange[0] >= 2 && relative.commissionRange[1] <= 5,
    "Family relative commission must be 2% to 5%",
  );
  assertStrictEquals(relative.priority, "loyalty_and_stability");
  assert(relative.walkoutToleranceMultiplier > 1.0, "Family relative must have higher walkout patience tolerance");
});

// F24: Agent: The Tactical Mentor
test(1, "F24", "Tactical Mentor Archetype Playing Time and Development Priority", async () => {
  const agentsModule = await loadEngineModule("../../src/engine/agents.ts", "F24");
  const mentor = agentsModule.getAgentArchetype
    ? agentsModule.getAgentArchetype("tactical_mentor")
    : agentsModule.AGENT_ARCHETYPES?.tactical_mentor;
  assert(mentor, "Tactical mentor archetype must be defined");
  assert(
    mentor.commissionRange[0] >= 5 && mentor.commissionRange[1] <= 8,
    "Tactical mentor commission must be 5% to 8%",
  );
  assertStrictEquals(mentor.priority, "development_and_starts");
  assert(
    mentor.mandatorySquadStatusMin === "Important" || mentor.demandsPlayingTimeGuarantee,
    "Mentor must enforce squad status guarantee",
  );
});

// F25: Agent: Self-Represented
test(1, "F25", "Self-Represented Archetype 0% Commission and 1.4x Patience Drain", async () => {
  const agentsModule = await loadEngineModule("../../src/engine/agents.ts", "F25");
  const selfRep = agentsModule.getAgentArchetype
    ? agentsModule.getAgentArchetype("self_represented")
    : agentsModule.AGENT_ARCHETYPES?.self_represented;
  assert(selfRep, "Self-represented archetype must be defined");
  assertStrictEquals(selfRep.commission, 0, "Self-represented commission must be strictly 0%");
  assertAlmostEquals(
    selfRep.patienceDrainMultiplier,
    1.4,
    0.05,
    "Self-represented patience drain multiplier must be 1.4x",
  );
  assert(selfRep.blunderProbability >= 0.10, "Self-represented negotiation must carry at least 10% blunder risk");
});
