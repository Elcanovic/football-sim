import { randomGaussian } from "./prng.js";

export const POSITION_ROLES = {
  LW: "attacker",
  ST: "attacker",
  RW: "attacker",
  LM: "creator",
  CAM: "creator",
  RM: "creator",
  LB: "support",
  CM: "support",
  RB: "support",
  CDM: "defensive",
  CB: "defensive",
  GK: "goalkeeper",
};

export const POSITION_WEIGHTS = {
  ST: { shooting: 0.35, pace: 0.20, physical: 0.20, dribbling: 0.15, passing: 0.08, defending: 0.02 },
  LW: { pace: 0.30, dribbling: 0.25, shooting: 0.20, passing: 0.15, physical: 0.07, defending: 0.03 },
  RW: { pace: 0.30, dribbling: 0.25, shooting: 0.20, passing: 0.15, physical: 0.07, defending: 0.03 },
  CAM: { passing: 0.30, dribbling: 0.25, shooting: 0.20, pace: 0.10, physical: 0.10, defending: 0.05 },
  LM: { pace: 0.25, passing: 0.25, dribbling: 0.25, shooting: 0.12, physical: 0.08, defending: 0.05 },
  RM: { pace: 0.25, passing: 0.25, dribbling: 0.25, shooting: 0.12, physical: 0.08, defending: 0.05 },
  CM: { passing: 0.28, physical: 0.24, defending: 0.20, dribbling: 0.16, pace: 0.07, shooting: 0.05 },
  LB: { pace: 0.25, defending: 0.28, physical: 0.22, passing: 0.15, dribbling: 0.08, shooting: 0.02 },
  RB: { pace: 0.25, defending: 0.28, physical: 0.22, passing: 0.15, dribbling: 0.08, shooting: 0.02 },
  CDM: { defending: 0.38, physical: 0.28, passing: 0.20, pace: 0.06, dribbling: 0.06, shooting: 0.02 },
  CB: { defending: 0.45, physical: 0.35, pace: 0.10, passing: 0.08, dribbling: 0.01, shooting: 0.01 },
  GK: { reflexes: 0.32, diving: 0.26, positioning: 0.22, handling: 0.14, physical: 0.06 },
};

export function clampAttribute(val) {
  return Math.max(35, Math.min(99, Math.round(val)));
}

export function calculateOverall(position, attrs) {
  const weights = POSITION_WEIGHTS[position];
  if (position === "GK") {
    const ovr = (attrs.reflexes * (weights.reflexes || 0)) +
      (attrs.diving * (weights.diving || 0)) +
      (attrs.positioning * (weights.positioning || 0)) +
      (attrs.handling * (weights.handling || 0)) +
      (attrs.physical * (weights.physical || 0));
    return clampAttribute(ovr);
  } else {
    const ovr = (attrs.pace * (weights.pace || 0)) +
      (attrs.shooting * (weights.shooting || 0)) +
      (attrs.passing * (weights.passing || 0)) +
      (attrs.dribbling * (weights.dribbling || 0)) +
      (attrs.defending * (weights.defending || 0)) +
      (attrs.physical * (weights.physical || 0));
    return clampAttribute(ovr);
  }
}

export function createInitialAttributes(rng, position, targetOverall = 50) {
  let curRng = rng;
  const weights = POSITION_WEIGHTS[position];

  if (position === "GK") {
    const roll = (w) => {
      const g = randomGaussian(curRng, targetOverall + (w > 0.2 ? 2 : -2), 3);
      curRng = g.rng;
      return clampAttribute(g.value);
    };

    const attrs = {
      reflexes: roll(weights.reflexes || 0.2),
      diving: roll(weights.diving || 0.2),
      positioning: roll(weights.positioning || 0.2),
      handling: roll(weights.handling || 0.2),
      kicking: roll(weights.kicking || 0.1),
      physical: roll(weights.physical || 0.1),
    };
    return { rng: curRng, attributes: attrs };
  } else {
    const roll = (w) => {
      const bonus = w > 0.25 ? 4 : w > 0.15 ? 1 : -3;
      const g = randomGaussian(curRng, targetOverall + bonus, 4);
      curRng = g.rng;
      return clampAttribute(g.value);
    };

    const attrs = {
      pace: roll(weights.pace || 0.15),
      shooting: roll(weights.shooting || 0.15),
      passing: roll(weights.passing || 0.15),
      dribbling: roll(weights.dribbling || 0.15),
      defending: roll(weights.defending || 0.15),
      physical: roll(weights.physical || 0.15),
    };
    return { rng: curRng, attributes: attrs };
  }
}

export function evolveAttributes(
  rng,
  position,
  current,
  age,
  profile,
  playingRoleMultiplier = 1.0,
) {
  let curRng = rng;

  let growthScale = 0;
  if (age < 21) {
    growthScale = profile === "early" ? 5.5 : profile === "normal" ? 4.2 : 3.0;
  } else if (age < 24) {
    growthScale = profile === "early" ? 3.5 : profile === "normal" ? 3.8 : 4.5;
  } else if (age < 28) {
    growthScale = profile === "late" ? 2.5 : 1.2;
  } else if (age < 30) {
    growthScale = 0.2;
  } else if (age < 33) {
    growthScale = -1.2;
  } else {
    growthScale = -2.8;
  }

  const roleFactor = Math.max(0.2, playingRoleMultiplier);

  if (position === "GK") {
    const gkScale = age >= 28 && age <= 33 ? 0.8 : growthScale;

    const delta = (stat, baseMod) => {
      const g = randomGaussian(curRng, (gkScale + baseMod) * roleFactor, 1.2);
      curRng = g.rng;
      return clampAttribute(current[stat] + Math.round(g.value));
    };

    const newAttrs = {
      reflexes: delta("reflexes", age > 32 ? -1.5 : 0.5),
      diving: delta("diving", age > 32 ? -2.0 : 0.2),
      positioning: delta("positioning", age > 28 ? 1.0 : 0.0),
      handling: delta("handling", age > 28 ? 0.5 : 0.0),
      kicking: delta("kicking", 0.0),
      physical: delta("physical", age > 31 ? -1.5 : 0.0),
    };

    return {
      rng: curRng,
      attributes: newAttrs,
      newOverall: calculateOverall(position, newAttrs),
    };
  } else {
    const delta = (stat, isPhysical, isMentalTech) => {
      let statModifier = 0;
      if (age >= 29) {
        if (isPhysical) {
          statModifier = age >= 33 ? -3.5 : -1.8;
        } else if (isMentalTech) {
          statModifier = age <= 33 ? 1.2 : -0.5;
        }
      }

      const meanDelta = (growthScale + statModifier) * roleFactor;
      const g = randomGaussian(curRng, meanDelta, 1.2);
      curRng = g.rng;
      return clampAttribute(current[stat] + Math.round(g.value));
    };

    const newAttrs = {
      pace: delta("pace", true, false),
      shooting: delta("shooting", false, true),
      passing: delta("passing", false, true),
      dribbling: delta("dribbling", false, true),
      defending: delta("defending", false, false),
      physical: delta("physical", true, false),
    };

    return {
      rng: curRng,
      attributes: newAttrs,
      newOverall: calculateOverall(position, newAttrs),
    };
  }
}
