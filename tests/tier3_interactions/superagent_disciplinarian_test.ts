// Tier 3 Interaction Tests: Super-Agent Demands vs Disciplinarian Manager Culture Friction
// Validates clash between aggressive agent posturing and strict disciplinarian trust metrics

import { createMockPlayer, loadEngineModule, test } from "../helpers.ts";
import { assert, assertStrictEquals } from "../assert.ts";

test(3, "I04", "Super-Agent Aggressive Demands Clash with Pragmatic Disciplinarian Culture", async () => {
  const agentsModule = await loadEngineModule("../../src/engine/agents.ts", "I04_agents");
  const managerDNA = await loadEngineModule("../../src/engine/managerDNA.ts", "I04_manager");

  const superAgent = agentsModule.getAgentArchetype
    ? agentsModule.getAgentArchetype("super_agent")
    : agentsModule.AGENT_ARCHETYPES.super_agent;
  assert(superAgent !== undefined, "Super-agent profile must exist");
  const disciplinarian = managerDNA.createManager({
    name: "Diego Simeone",
    personality: "Pragmatic Disciplinarian",
  });

  const player = createMockPlayer({
    managerTrust: 70,
    agent: { archetype: "super_agent", transferLeverage: 10 },
  });

  // Disciplinarian evaluates player whose agent demands public wage hike during season
  const frictionEval = managerDNA.evaluateAgentManagerFriction(disciplinarian, player, {
    agentPublicDemand: true,
  });

  assert(frictionEval.trustPenalty <= -15, "Disciplinarian must penalize trust on public agent demands");
  assertStrictEquals(frictionEval.disciplinaryWarningIssued, true);
});
