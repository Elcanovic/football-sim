import type {
  DevelopmentProfile,
  GoalkeeperAttributes,
  OutfieldAttributes,
  PlayerAttributes,
  Position,
  RoleCategory,
} from "./types.ts";
import { PRNG, randomGaussian } from "./prng.ts";

export const POSITION_ROLES: Record<Position, RoleCategory> = {
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

export interface AttributeWeights {
  pace?: number;
  shooting?: number;
  passing?: number;
  dribbling?: number;
  defending?: number;
  physical?: number;
  // GK
  diving?: number;
  handling?: number;
  kicking?: number;
  reflexes?: number;
  positioning?: number;
}

export const POSITION_WEIGHTS: Record<Position, AttributeWeights> = {
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

export function clampAttribute(val: number): number {
  return Math.max(35, Math.min(99, Math.round(val)));
}

export function calculateOverall(position: Position, attrs: PlayerAttributes): number {
  const weights = POSITION_WEIGHTS[position];
  if (position === "GK") {
    const gk = attrs as GoalkeeperAttributes;
    const ovr = (gk.reflexes * (weights.reflexes ?? 0)) +
      (gk.diving * (weights.diving ?? 0)) +
      (gk.positioning * (weights.positioning ?? 0)) +
      (gk.handling * (weights.handling ?? 0)) +
      (gk.physical * (weights.physical ?? 0));
    return clampAttribute(ovr);
  } else {
    const out = attrs as OutfieldAttributes;
    const ovr = (out.pace * (weights.pace ?? 0)) +
      (out.shooting * (weights.shooting ?? 0)) +
      (out.passing * (weights.passing ?? 0)) +
      (out.dribbling * (weights.dribbling ?? 0)) +
      (out.defending * (weights.defending ?? 0)) +
      (out.physical * (weights.physical ?? 0));
    return clampAttribute(ovr);
  }
}

export function createInitialAttributes(
  rng: PRNG,
  position: Position,
  targetOverall = 50,
): { rng: PRNG; attributes: PlayerAttributes } {
  let curRng = rng;
  const weights = POSITION_WEIGHTS[position];

  if (position === "GK") {
    // Generate GK attributes with variance around targetOverall
    const roll = (w: number) => {
      const g = randomGaussian(curRng, targetOverall + (w > 0.2 ? 2 : -2), 3);
      curRng = g.rng;
      return clampAttribute(g.value);
    };

    const attrs: GoalkeeperAttributes = {
      reflexes: roll(weights.reflexes ?? 0.2),
      diving: roll(weights.diving ?? 0.2),
      positioning: roll(weights.positioning ?? 0.2),
      handling: roll(weights.handling ?? 0.2),
      kicking: roll(weights.kicking ?? 0.1),
      physical: roll(weights.physical ?? 0.1),
    };
    return { rng: curRng, attributes: attrs };
  } else {
    // Generate Outfield attributes
    const roll = (w: number) => {
      // Attributes with higher position weighting start slightly higher
      const bonus = w > 0.25 ? 4 : w > 0.15 ? 1 : -3;
      const g = randomGaussian(curRng, targetOverall + bonus, 4);
      curRng = g.rng;
      return clampAttribute(g.value);
    };

    const attrs: OutfieldAttributes = {
      pace: roll(weights.pace ?? 0.15),
      shooting: roll(weights.shooting ?? 0.15),
      passing: roll(weights.passing ?? 0.15),
      dribbling: roll(weights.dribbling ?? 0.15),
      defending: roll(weights.defending ?? 0.15),
      physical: roll(weights.physical ?? 0.15),
    };
    return { rng: curRng, attributes: attrs };
  }
}

/**
 * Asymmetric annual progression and aging:
 * - Age 16-23: Big growth across all stats (early, normal, late bloomers).
 * - Age 24-28: Prime peak stability, physicals maxed.
 * - Age 29-33: Physical decline begins (Pace/Stamina: -1 to -3/yr). Mental/Vision stays elite (+1/yr).
 * - Age 34+: Steeper physical decline (-2 to -5/yr), technical mastery retained.
 */
export function evolveAttributes(
  rng: PRNG,
  position: Position,
  current: PlayerAttributes,
  age: number,
  profile: DevelopmentProfile,
  playingRoleMultiplier = 1.0, // 1.0 for starter, 0.6 for sub, 0.0 for bench/suspended
): { rng: PRNG; attributes: PlayerAttributes; newOverall: number } {
  let curRng = rng;

  // Base growth scalar according to age & profile
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

  // Adjust for playing time
  const roleFactor = Math.max(0.2, playingRoleMultiplier);

  if (position === "GK") {
    const gk = current as GoalkeeperAttributes;
    // Goalkeepers age slower physically and peak later (27-33)
    const gkScale = age >= 28 && age <= 33 ? 0.8 : growthScale;

    const delta = (stat: keyof GoalkeeperAttributes, baseMod: number) => {
      const g = randomGaussian(curRng, (gkScale + baseMod) * roleFactor, 1.2);
      curRng = g.rng;
      return clampAttribute(gk[stat] + Math.round(g.value));
    };

    const newAttrs: GoalkeeperAttributes = {
      reflexes: delta("reflexes", age > 32 ? -1.5 : 0.5),
      diving: delta("diving", age > 32 ? -2.0 : 0.2),
      positioning: delta("positioning", age > 28 ? 1.0 : 0.0), // Peaks with experience
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
    const out = current as OutfieldAttributes;

    // Asymmetric adjustments per stat category based on age
    const delta = (stat: keyof OutfieldAttributes, isPhysical: boolean, isMentalTech: boolean) => {
      let statModifier = 0;
      if (age >= 29) {
        if (isPhysical) {
          // Accelerate physical decline
          statModifier = age >= 33 ? -3.5 : -1.8;
        } else if (isMentalTech) {
          // Wisdom & composure offset: slight buffer or even +1 in early 30s
          statModifier = age <= 33 ? 1.2 : -0.5;
        }
      }

      const meanDelta = (growthScale + statModifier) * roleFactor;
      const g = randomGaussian(curRng, meanDelta, 1.2);
      curRng = g.rng;
      return clampAttribute(out[stat] + Math.round(g.value));
    };

    const newAttrs: OutfieldAttributes = {
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
