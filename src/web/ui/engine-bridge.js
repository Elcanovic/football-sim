// Engine bridge: every gameplay state transition the UI can request.
//
// The simulation lives in src/engine/ and owns all rules, randomness and state.rngState. In the
// standalone bundle its functions are page globals (scripts/build_standalone.js inlines them);
// on the dev server without the bundle they are reached over the /api routes in src/server.ts.
// View modules call these actions and redraw; none of them advances the simulation itself.
//
// Engine globals used here: initPlayerCareer, executeDecisionAndSimulate, hireNewAgent,
// fireCurrentAgent, renegotiateWageWithCurrentAgent, AGENTS_CATALOG, signBootDeal,
// signBrandSponsorship, toggleLifestyleChoice, DEFAULT_LIFESTYLE_CHOICES, generatePressConference,
// resolvePressAnswer, createPRNG, initHotSeatSession, submitCounterOffer, finalizeHotSeat.

import { setState, state } from "./store.js";

/** An engine function by name, or null when the page runs without the in-page engine. */
function engineFn(name) {
  const fn = globalThis[name];
  return typeof fn === "function" ? fn : null;
}

async function postJson(path, body) {
  const res = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`${path} failed with ${res.status}`);
  return res.json();
}

// ---------------------------------------------------------------- career lifecycle

/** Start a new career and make it the current state. */
export async function startCareer(opts) {
  const init = engineFn("initPlayerCareer");
  if (init) {
    return setState(init(
      "career-" + Date.now(),
      opts.mode,
      opts.lastName,
      opts.preferredNumber,
      opts.preferredFoot,
      opts.nationalityIso,
      opts.position,
      opts.developmentProfile,
      opts.secondNationalityIso,
    ));
  }
  return setState(await postJson("/api/start", opts));
}

/**
 * Resolve the current event with one option and simulate the season(s) that follow.
 * `agreedWage` carries a hot-seat negotiation result into the chosen contract offer.
 */
export async function submitDecision(optionId, { agreedWage } = {}) {
  if (agreedWage !== undefined) {
    const opt = state?.currentEvent?.options?.find((o) => o.id === optionId);
    if (opt?.contractOffer) opt.contractOffer.weeklyWage = agreedWage;
  }
  const exec = engineFn("executeDecisionAndSimulate");
  if (exec) return setState(exec(state, optionId));
  return setState(await postJson("/api/decision", { optionId }));
}

/** Record which season the trophy overlay has celebrated up to, so it never repeats one. */
export function markSeasonsCelebrated(seasonIndex) {
  if (state) state._lastCelebratedSeasonIndex = seasonIndex;
}

/** The dilemma result toast has been shown; drop it from state. */
export function clearDilemmaOutcome() {
  if (state) state.lastDilemmaOutcome = null;
}

// ---------------------------------------------------------------- agents

export function getAgentsCatalog() {
  if (typeof AGENTS_CATALOG !== "undefined" && Array.isArray(AGENTS_CATALOG)) return AGENTS_CATALOG;
  if (Array.isArray(globalThis.AGENTS_CATALOG)) return globalThis.AGENTS_CATALOG;
  return [];
}

export async function loadAgentsCatalog() {
  if (getAgentsCatalog().length > 0) return;
  try {
    const res = await fetch("/api/agents");
    if (res.ok) globalThis.AGENTS_CATALOG = await res.json();
  } catch (e) {
    console.error("Failed to load agents catalog", e);
  }
}

export async function hireAgent(agentId) {
  const hire = engineFn("hireNewAgent");
  if (hire) return setState(hire(state, agentId));
  return setState(await postJson("/api/agent/hire", { agentId }));
}

export async function fireAgent() {
  const fire = engineFn("fireCurrentAgent");
  if (fire) return setState(fire(state));
  return setState(await postJson("/api/agent/fire"));
}

/** Ask the current agent for a raise. Resolves to the engine's { success, raiseAmount, message }. */
export async function renegotiateWage() {
  const reneg = engineFn("renegotiateWageWithCurrentAgent");
  const result = reneg ? reneg(state) : await postJson("/api/agent/renegotiate");
  setState(result.state || result);
  return result;
}

// ---------------------------------------------------------------- sponsorships & lifestyle

/** Sign a boot supplier. Resolves to the engine result, or null without the engine. */
export function signBoot(modelId) {
  const sign = engineFn("signBootDeal");
  return sign ? sign(state.player, modelId) : null;
}

export function signBrand(brandId) {
  const sign = engineFn("signBrandSponsorship");
  return sign ? sign(state.player, brandId) : null;
}

/** Give the player the default lifestyle choices on first open of the lifestyle modal. */
export function ensureLifestyleChoices() {
  const p = state?.player;
  if (p && !p.lifestyleChoices && typeof DEFAULT_LIFESTYLE_CHOICES !== "undefined") {
    p.lifestyleChoices = JSON.parse(JSON.stringify(DEFAULT_LIFESTYLE_CHOICES));
  }
  return p?.lifestyleChoices ?? [];
}

/** Toggle one lifestyle choice. Resolves to { isNowActive, choice }, or null without the engine. */
export function toggleLifestyle(choiceId) {
  const toggle = engineFn("toggleLifestyleChoice");
  if (!toggle) return null;
  const isNowActive = toggle(state.player, choiceId);
  const choice = state.player.lifestyleChoices.find((c) => c.id === choiceId);
  return { isNowActive, choice };
}

// ---------------------------------------------------------------- press room

/** Draw this season's press conference, seeded from the career so a reload asks the same question. */
export function drawPressConference(teamName) {
  const generate = engineFn("generatePressConference");
  if (!generate) return null;
  const seasonIdx = (state.seasons || []).length + 1;
  const pressSeed = `${state.seed || "career"}-press-s${seasonIdx}`;
  const create = engineFn("createPRNG");
  const rng = create ? create(pressSeed) : { seed: pressSeed, state: 1 };
  return generate(rng, state.player, teamName, seasonIdx).conference;
}

export function answerPress(conference, answerId) {
  const resolve = engineFn("resolvePressAnswer");
  return resolve ? resolve(state.player, conference, answerId) : null;
}

// ---------------------------------------------------------------- deadline-day hot seat

export function openNegotiation(params) {
  const init = engineFn("initHotSeatSession");
  return init ? init(params) : null;
}

export function counterOffer(session, offer) {
  const counter = engineFn("submitCounterOffer");
  return counter ? counter(session, offer) : session;
}

export function closeNegotiation(session) {
  const finalize = engineFn("finalizeHotSeat");
  return finalize
    ? finalize(session, { forceAgreement: true })
    : { dealAgreed: true, agreedWage: session.offeredPerks.baseWeeklyWage };
}
