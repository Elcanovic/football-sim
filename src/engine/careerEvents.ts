import { checkProbability, pickRandom, type PRNG } from "./prng.ts";
import type { Player, Team } from "./types.ts";
import type { PlayerAgent } from "./agents.ts";

export function generateClutchMoment(
  rng: PRNG,
  player: Player,
  _currentTeam: Team | null,
  targetTrophyName: string,
) {
  let curRng = rng;
  const pos = player.position || "ST";
  const isGk = pos === "GK";
  const isDefender = ["CB", "LB", "RB", "CDM"].includes(pos);
  const isMidfielder = ["CM", "CAM", "LM", "RM"].includes(pos);

  let clutchType: string;
  if (isGk) {
    const { rng: r1, item } = pickRandom(curRng, ["gk_penalty_save", "gk_1v1_breakaway", "gk_tipping_save"]);
    curRng = r1;
    clutchType = item;
  } else if (isDefender) {
    const { rng: r1, item } = pickRandom(curRng, ["defender_last_ditch_tackle", "defender_goal_line_clearance"]);
    curRng = r1;
    clutchType = item;
  } else if (isMidfielder) {
    const { rng: r1, item } = pickRandom(curRng, [
      "midfield_killer_throughball",
      "midfield_long_range_screamer",
      "clutch_free_kick",
    ]);
    curRng = r1;
    clutchType = item;
  } else {
    const { rng: r1, item } = pickRandom(curRng, [
      "attacker_decisive_penalty",
      "attacker_1v1_breakaway",
      "attacker_stoppage_header",
    ]);
    curRng = r1;
    clutchType = item;
  }

  const options: Array<{ id: string; type: string; optionKey: string; label: string; description: string }> = [];

  if (clutchType === "gk_penalty_save") {
    options.push(
      {
        id: "gk-pen-left",
        type: "clutch_action",
        optionKey: "dive_left",
        label: "Dive Left with Full Extension",
        description: "Anticipate the striker's power drive into the left side netting.",
      },
      {
        id: "gk-pen-right",
        type: "clutch_action",
        optionKey: "dive_right",
        label: "Dive Right & Protect Lower Post",
        description: "Read the plant foot and explode to your bottom right corner.",
      },
      {
        id: "gk-pen-center",
        type: "clutch_action",
        optionKey: "stand_center",
        label: "Hold Ground Center (Catch Panenka)",
        description: "Stand tall down the middle to catch an audacious chipped penalty.",
      },
    );
  } else if (clutchType === "gk_1v1_breakaway") {
    options.push(
      {
        id: "gk-1v1-rush",
        type: "clutch_action",
        optionKey: "rush_smother",
        label: "Aggressive Smother / Charge Out",
        description: "Charge off the line instantly to smother the ball at the striker's feet.",
      },
      {
        id: "gk-1v1-stay",
        type: "clutch_action",
        optionKey: "stay_react",
        label: "Hold Line & Pure Reaction",
        description: "Stay on your feet, narrow the shooting angle, and react with quick reflexes.",
      },
      {
        id: "gk-1v1-spread",
        type: "clutch_action",
        optionKey: "spread_wall",
        label: "German Spread / Star Technique",
        description: "Make yourself as wide as possible to block the low far-post shot.",
      },
    );
  } else if (clutchType === "gk_tipping_save") {
    options.push(
      {
        id: "gk-tip-bar",
        type: "clutch_action",
        optionKey: "fingertip_bar",
        label: "Fingertip Push Onto Crossbar",
        description: "Leap with trailing hand to tip the dipping 30-yard screamer over the woodwork.",
      },
      {
        id: "gk-tip-punch",
        type: "clutch_action",
        optionKey: "punch_safety",
        label: "Two-Handed Fist Punch Out",
        description: "Parry the swerving blast firmly away from incoming rebound poachers.",
      },
      {
        id: "gk-tip-catch",
        type: "clutch_action",
        optionKey: "catch_hold",
        label: "Hold & Kill the Clock",
        description: "High-risk attempt to cleanly catch the ball in mid-air to extinguish the attack.",
      },
    );
  } else if (clutchType === "defender_last_ditch_tackle") {
    options.push(
      {
        id: "def-slide",
        type: "clutch_action",
        optionKey: "sliding_hook",
        label: "Sliding Hook Tackle",
        description: "Time a desperate sliding hook right before the striker pulls the trigger.",
      },
      {
        id: "def-jockey",
        type: "clutch_action",
        optionKey: "jockey_stand",
        label: "Jockey & Stand Ground",
        description: "Cut off the passing lane and force a contested off-balance shot.",
      },
      {
        id: "def-foul",
        type: "clutch_action",
        optionKey: "tactical_foul",
        label: "Tactical Foul Outside Box",
        description: "Take the yellow card to halt the counter-attack and preserve the lead.",
      },
    );
  } else if (clutchType === "defender_goal_line_clearance") {
    options.push(
      {
        id: "def-hook",
        type: "clutch_action",
        optionKey: "overhead_hook",
        label: "Acrobatic Goal-Line Hook",
        description: "Hook the ball out of mid-air centimeters before it crosses the goal line.",
      },
      {
        id: "def-block",
        type: "clutch_action",
        optionKey: "body_block",
        label: "Full-Body Rebound Block",
        description: "Throw your chest and legs into the six-yard box melee to absorb the strike.",
      },
      {
        id: "def-header",
        type: "clutch_action",
        optionKey: "thump_header",
        label: "Thumping Aerial Header Over Bar",
        description: "Rise above the opposing attackers and power the header over your own bar.",
      },
    );
  } else if (clutchType === "midfield_killer_throughball") {
    options.push(
      {
        id: "mid-chip",
        type: "clutch_action",
        optionKey: "chipped_trivela",
        label: "Over-the-Top Chipped Trivela",
        description: "Delicate outside-of-the-boot scoop over the center-backs into the striker's stride.",
      },
      {
        id: "mid-ground",
        type: "clutch_action",
        optionKey: "ground_split",
        label: "Incisive Ground Needle Pass",
        description: "Thread a razor-sharp ground pass splitting both defenders at pace.",
      },
      {
        id: "mid-reverse",
        type: "clutch_action",
        optionKey: "no_look_reverse",
        label: "No-Look Reverse Pass to Winger",
        description: "Look left to freeze the full-back and reverse the pass right into space.",
      },
    );
  } else if (clutchType === "midfield_long_range_screamer") {
    options.push(
      {
        id: "mid-knuckle",
        type: "clutch_action",
        optionKey: "knuckleball_volley",
        label: "25-Yard Knuckleball Volley",
        description: "Strike with clean laces for unpredictable, erratic swerve that baffles the keeper.",
      },
      {
        id: "mid-curl",
        type: "clutch_action",
        optionKey: "curling_finesse",
        label: "Curling Top-Corner Finesse",
        description: "Open body and bend the ball into the top postage stamp with precision.",
      },
      {
        id: "mid-fake",
        type: "clutch_action",
        optionKey: "fake_and_burst",
        label: "Shot Fake & Penalty Box Burst",
        description: "Feint the long shot to send defenders sliding, then drive inside to shoot.",
      },
    );
  } else if (clutchType === "clutch_free_kick") {
    options.push(
      {
        id: "fk-curl",
        type: "clutch_action",
        optionKey: "curl",
        label: "Curl Top Corner",
        description: "Whip the ball up and over the jumping wall into the top corner.",
      },
      {
        id: "fk-power",
        type: "clutch_action",
        optionKey: "power",
        label: "Low Driven Blast Under Wall",
        description: "Hammer the ball along the turf assuming the opposing wall will jump.",
      },
      {
        id: "fk-cross",
        type: "clutch_action",
        optionKey: "cross",
        label: "Whip Inswinging Cross to Far Post",
        description: "Float a dangerous curling ball for an attacking header.",
      },
    );
  } else if (clutchType === "attacker_decisive_penalty") {
    options.push(
      {
        id: "att-pen-power",
        type: "clutch_action",
        optionKey: "power_bottom",
        label: "Bottom-Corner Power Strike",
        description: "Drive laces hard and low directly inside the side-netting.",
      },
      {
        id: "att-pen-top",
        type: "clutch_action",
        optionKey: "top_corner",
        label: "High Top-Corner Placement",
        description: "Place the penalty into the top corner where no goalkeeper can reach.",
      },
      {
        id: "att-pen-panenka",
        type: "clutch_action",
        optionKey: "panenka",
        label: "Audacious Panenka Chip",
        description: "Cheeky dink down the center of the net (High risk, immortal glory).",
      },
    );
  } else if (clutchType === "attacker_1v1_breakaway") {
    options.push(
      {
        id: "att-1v1-finesse",
        type: "clutch_action",
        optionKey: "far_finesse",
        label: "Far-Post Finesse Curl",
        description: "Open your hips and bend the shot cleanly past the goalie's trailing foot.",
      },
      {
        id: "att-1v1-round",
        type: "clutch_action",
        optionKey: "round_keeper",
        label: "Stepover & Round the Goalie",
        description: "Drop the shoulder, glide around the rushing keeper, and roll into open net.",
      },
      {
        id: "att-1v1-dink",
        type: "clutch_action",
        optionKey: "dink_chip",
        label: "Sublime Dink / Scoop",
        description: "Delicate dink over the keeper as they drop low to block.",
      },
    );
  } else {
    options.push(
      {
        id: "att-head-flick",
        type: "clutch_action",
        optionKey: "near_post_flick",
        label: "Near-Post Glancing Flick",
        description: "Dart across the front post to glance the corner kick across the face of goal.",
      },
      {
        id: "att-head-power",
        type: "clutch_action",
        optionKey: "power_header_down",
        label: "Downward Thumping Header",
        description: "Out-jump the center-backs and head down into the turf to bounce past the keeper.",
      },
      {
        id: "att-head-scissor",
        type: "clutch_action",
        optionKey: "scissor_volley",
        label: "Acrobatic Scissor Half-Volley",
        description: "Contort your body in mid-air to strike a stunning acrobatic scissor volley.",
      },
    );
  }

  return {
    rng: curRng,
    event: {
      id: `clutch-${player.age}-${clutchType}`,
      type: "clutch_moment",
      age: player.age,
      eventKey: `clutch_${clutchType}`,
      clutchType,
      targetTrophy: targetTrophyName,
      options,
    },
  };
}

export function resolveClutchAction(
  rng: PRNG,
  player: Player,
  clutchType: string,
  optionKey: string,
  targetTrophy?: string,
) {
  let curRng = rng;
  let successChance = 0.50;
  const a = (player.attributes as unknown as Record<string, number>) || {};

  if (clutchType.startsWith("gk_")) {
    const reflexes = a.reflexes || 65;
    const diving = a.diving || 65;
    const positioning = a.positioning || 65;
    const handling = a.handling || 65;

    if (clutchType === "gk_penalty_save") {
      const base = (reflexes * 0.5 + diving * 0.5) / 100 * 0.72;
      successChance = optionKey === "stand_center" ? base * 0.88 : base;
    } else if (clutchType === "gk_1v1_breakaway") {
      const base = (positioning * 0.4 + reflexes * 0.4 + diving * 0.2) / 100 * 0.75;
      successChance = optionKey === "spread_wall" ? base * 1.05 : base;
    } else {
      const base = (diving * 0.6 + handling * 0.4) / 100 * 0.74;
      successChance = optionKey === "catch_hold" ? base * 0.80 : base;
    }
  } else if (clutchType.startsWith("defender_")) {
    const defending = a.defending || 65;
    const physical = a.physical || 65;
    const pace = a.pace || 65;

    if (clutchType === "defender_last_ditch_tackle") {
      if (optionKey === "tactical_foul") {
        successChance = 0.90;
      } else {
        successChance = (defending * 0.6 + pace * 0.2 + physical * 0.2) / 100 * 0.76;
      }
    } else {
      successChance = (defending * 0.5 + physical * 0.5) / 100 * 0.75;
    }
  } else if (clutchType.startsWith("midfield_") || clutchType === "clutch_free_kick") {
    const passing = a.passing || 65;
    const dribbling = a.dribbling || 65;
    const shooting = a.shooting || 65;

    if (clutchType === "midfield_killer_throughball") {
      successChance = (passing * 0.7 + dribbling * 0.3) / 100 * 0.78;
    } else if (clutchType === "midfield_long_range_screamer") {
      successChance = (shooting * 0.7 + (a.physical || 65) * 0.3) / 100 * 0.68;
    } else {
      successChance = (shooting * 0.5 + passing * 0.5) / 100 * 0.70;
    }
  } else {
    const shooting = a.shooting || 65;
    const dribbling = a.dribbling || 65;
    const pace = a.pace || 65;
    const physical = a.physical || 65;

    if (clutchType === "attacker_decisive_penalty") {
      const base = (shooting / 100) * 0.76;
      successChance = optionKey === "panenka" ? base * 0.82 : base;
    } else if (clutchType === "attacker_1v1_breakaway") {
      successChance = (shooting * 0.5 + dribbling * 0.3 + pace * 0.2) / 100 * 0.75;
    } else {
      successChance = (shooting * 0.4 + physical * 0.6) / 100 * 0.72;
    }
  }

  const { rng: r1, success } = checkProbability(curRng, Math.min(0.92, Math.max(0.25, successChance)));
  curRng = r1;

  if (success) {
    let msg =
      `Incredible! In the dying seconds, your clutch play paid off in spectacular fashion. You secured the silverware!`;
    if (clutchType.startsWith("gk_")) {
      msg =
        `ASTONISHING SAVE! You threw yourself across the goalmouth in stoppage time to deny a certain goal. The stadium erupts—you have won the title for your team!`;
    } else if (clutchType.startsWith("defender_")) {
      msg =
        `HERCULEAN DEFENDING! Your desperate intervention denied a guaranteed equalizer off the line. Championship secured!`;
    } else if (clutchType.startsWith("midfield_")) {
      msg =
        `GENIUS PLAYMAKING! Your clutch ball unlocked the defense with breathtaking vision to seal the championship!`;
    } else if (clutchType.startsWith("attacker_")) {
      msg = `GOAL! PURE ICE IN YOUR VEINS! You buried the winner in stoppage time to capture the glory!`;
    }

    return {
      rng: curRng,
      overallDelta: 0,
      moraleDelta: +15,
      managerTrustDelta: +15,
      suspended: false,
      injuryWeeks: 0,
      trophyWon: targetTrophy,
      resultMessage: msg,
    };
  } else {
    let msg =
      `Heartbreak! In the crucial dying moments, the play did not come off. The silverware slips through your fingers.`;
    if (clutchType.startsWith("gk_")) {
      msg =
        `Agonizing! You guessed the right direction, but the ball slips past your outstretched fingertips into the side netting.`;
    } else if (clutchType.startsWith("defender_")) {
      msg =
        `Cruel finish! Despite your sliding attempt, the striker manages to poke the ball past into the bottom corner.`;
    } else {
      msg = `Denied by the woodwork! The heroic effort ricochets agonizingly off the post as the final whistle blows.`;
    }

    return {
      rng: curRng,
      overallDelta: 0,
      moraleDelta: -10,
      managerTrustDelta: -5,
      suspended: false,
      injuryWeeks: 0,
      resultMessage: msg,
    };
  }
}

export function generateCareerDilemma(
  rng: PRNG,
  player: Player,
  agent: PlayerAgent | null,
  currentTeam: Team | null,
) {
  let curRng = rng;
  const dilemmaTypes = [
    "club_vs_country",
    "pr_scandal",
    "agent_clash",
    "banned_supplement",
    "locker_room_civil_war",
    "offshore_sponsor_conflict",
  ];

  const { rng: r1, item: dilemmaType } = pickRandom(curRng, dilemmaTypes);
  curRng = r1;

  const agentName = agent?.name || "Your Agent";
  const teamName = currentTeam?.short_name || currentTeam?.name || "your club";
  const natName = player.nationality?.name_en || "your country";

  const options: Array<
    { id: string; type: string; dilemmaType: string; optionKey: string; label: string; description: string }
  > = [];

  if (dilemmaType === "club_vs_country") {
    options.push(
      {
        id: "dilemma-nat-honor",
        type: "dilemma_choice",
        dilemmaType,
        optionKey: "honor_nation",
        label: `Report to ${natName} Squad (Honor the Flag)`,
        description:
          `Fly out to represent your country in the high-stakes tournament. Boosts national hero status, but manager at ${teamName} warns you will be benched on return.`,
      },
      {
        id: "dilemma-club-loyalty",
        type: "dilemma_choice",
        dilemmaType,
        optionKey: "club_above_all",
        label: `Withdraw from International Duty (Club Above All)`,
        description:
          `Cite 'muscle fatigue' to stay and lead ${teamName}. Manager is thrilled, but national team coach drops you and fans back home erupt in fury.`,
      },
      {
        id: "dilemma-red-eye",
        type: "dilemma_choice",
        dilemmaType,
        optionKey: "red_eye_compromise",
        label: `Play Both via Private Jet (The Grueling Compromise)`,
        description:
          `Charter a private flight to play both matches in 72 hours. Huge media respect & viral admiration (+50k followers), but severe physical fatigue toll.`,
      },
    );
  } else if (dilemmaType === "pr_scandal") {
    options.push(
      {
        id: "dilemma-apology",
        type: "dilemma_choice",
        dilemmaType,
        optionKey: "humble_apology",
        label: "Humble Public Apology & Accept Club Fine",
        description:
          "Admit your lapse in judgment, pay an internal club fine (€25,000), and stay late for extra training. Protects manager trust and restores locker room respect.",
      },
      {
        id: "dilemma-defend-pr",
        type: "dilemma_choice",
        dilemmaType,
        optionKey: "defend_personal_pr",
        label: "Defend Personal Brand & Blame Paparazzi",
        description:
          "Release a fiery PR statement condemning invasive media harassment. Fans on TikTok love your rebellious swagger (+100k followers), but manager issues 1-game suspension.",
      },
      {
        id: "dilemma-agent-lawsuit",
        type: "dilemma_choice",
        dilemmaType,
        optionKey: "agent_legal_threat",
        label: `Let ${agentName} Suppress the Story Legally`,
        description:
          `Spend €40,000 for ${agentName}'s legal fixers to issue cease-and-desist gag orders. High chance story vanishes; if it leaks anyway, triggers severe viral backlash.`,
      },
    );
  } else if (dilemmaType === "agent_clash") {
    options.push(
      {
        id: "dilemma-agent-comply",
        type: "dilemma_choice",
        dilemmaType,
        optionKey: "comply_agent",
        label: `Comply with ${agentName}: Hand in Transfer Request`,
        description:
          `Force a blockbuster move. Agent secures an upfront signing bonus (+€30,000), but ${teamName} supporters burn your jersey and brand you a traitor.`,
      },
      {
        id: "dilemma-agent-defy",
        type: "dilemma_choice",
        dilemmaType,
        optionKey: "defy_sack_agent",
        label: `Defy & Fire ${agentName} on the Spot!`,
        description:
          `Publicly condemn your agent's greed and pledge undying loyalty to ${teamName}. You become an instant club legend (+30 Trust), and must hire a new representative.`,
      },
      {
        id: "dilemma-agent-middle",
        type: "dilemma_choice",
        dilemmaType,
        optionKey: "enforce_middle_ground",
        label: `Demand Respectful & Quiet Contract Negotiations`,
        description:
          `Order ${agentName} to drop the drama and quietly negotiate a standard wage improvement without public ultimatums.`,
      },
    );
  } else if (dilemmaType === "banned_supplement") {
    options.push(
      {
        id: "dilemma-reject-doping",
        type: "dilemma_choice",
        dilemmaType,
        optionKey: "strictly_reject",
        label: "Strictly Reject & Dismiss Rogue Trainer",
        description:
          "Refuse any dubious recovery cocktails. Uphold 100% natural professionalism and earn unconditional trust from the medical staff.",
      },
      {
        id: "dilemma-take-booster",
        type: "dilemma_choice",
        dilemmaType,
        optionKey: "underground_boost",
        label: "Take the Underground Bio-Booster (Extreme Risk / Reward)",
        description:
          "Inject the experimental muscle repair formula. 78% chance of escaping undetected with an immediate +3 OVR permanent boost; 22% chance of a catastrophic 12-month ban!",
      },
    );
  } else if (dilemmaType === "locker_room_civil_war") {
    options.push(
      {
        id: "dilemma-side-manager",
        type: "dilemma_choice",
        dilemmaType,
        optionKey: "back_manager",
        label: "Back the Manager in the Feud",
        description:
          "Support managerial authority against disgruntled veterans. Earns an unshakeable starting role (+20 Trust), but teammates alienate you in the locker room.",
      },
      {
        id: "dilemma-side-captain",
        type: "dilemma_choice",
        dilemmaType,
        optionKey: "back_squad",
        label: "Stand in Solidarity with the Team Captain",
        description:
          "Back your fellow players against the strict regime. Squad morale reaches fever pitch (+15 Morale), but the furious manager sidelines you for 2 fixtures.",
      },
      {
        id: "dilemma-neutral",
        type: "dilemma_choice",
        dilemmaType,
        optionKey: "neutral_focus",
        label: "Stay Out of the Drama & Do Extra Gym Work",
        description:
          "Keep headphones on and focus entirely on your craft. Zero locker room fallout, plus a +1 focus boost to your core attributes.",
      },
    );
  } else {
    options.push(
      {
        id: "dilemma-sign-offshore",
        type: "dilemma_choice",
        dilemmaType,
        optionKey: "secret_offshore_deal",
        label: "Sign Covert Personal Sponsorship (+€350,000 Cash)",
        description:
          "Secretly endorse a rival luxury brand via an offshore account. Enormous immediate financial payday, but 30% risk of club discovering it and issuing a massive fine.",
      },
      {
        id: "dilemma-clean-sponsor",
        type: "dilemma_choice",
        dilemmaType,
        optionKey: "club_harmony",
        label: "Decline & Maintain Club Integrity",
        description:
          "Respect club exclusive partnership guidelines. Manager commends your ethical standards (+10 Trust), keeping your career spotless.",
      },
    );
  }

  return {
    rng: curRng,
    event: {
      id: `dilemma-${player.age}-${dilemmaType}`,
      type: "dilemma_event",
      age: player.age,
      eventKey: `dilemma_${dilemmaType}`,
      dilemmaType,
      options,
    },
  };
}

export function resolveCareerDilemma(
  rng: PRNG,
  _player: Player,
  agent: PlayerAgent | null,
  dilemmaType: string,
  optionKey: string,
) {
  let curRng = rng;

  if (dilemmaType === "club_vs_country") {
    if (optionKey === "honor_nation") {
      return {
        rng: curRng,
        moraleDelta: +10,
        managerTrustDelta: -18,
        ovrDelta: 0,
        cashDelta: 0,
        followersDelta: +15000,
        suspendedMatches: 1,
        fireAgent: false,
        resultMessage:
          `You proudly wore your national colors and inspired the homeland, but returned to find your club manager cold and furious. You were benched for the subsequent match.`,
      };
    } else if (optionKey === "club_above_all") {
      return {
        rng: curRng,
        moraleDelta: -5,
        managerTrustDelta: +20,
        ovrDelta: 0,
        cashDelta: 0,
        followersDelta: -12000,
        suspendedMatches: 0,
        fireAgent: false,
        resultMessage:
          `Your club manager lauded your ironclad loyalty as you led the team to victory. However, national newspapers slammed your absence, and national supporters unleashed fury online.`,
      };
    } else {
      return {
        rng: curRng,
        moraleDelta: +12,
        managerTrustDelta: +10,
        ovrDelta: -1,
        cashDelta: -15000,
        followersDelta: +55000,
        suspendedMatches: 0,
        fireAgent: false,
        resultMessage:
          `Iron Man! You jetted across time zones and played heroically for both club and country within 72 hours. Fans worldwide were in awe (+55k followers), though physical exhaustion took a slight toll.`,
      };
    }
  } else if (dilemmaType === "pr_scandal") {
    if (optionKey === "humble_apology") {
      return {
        rng: curRng,
        moraleDelta: +5,
        managerTrustDelta: +15,
        ovrDelta: 0,
        cashDelta: -25000,
        followersDelta: +2000,
        suspendedMatches: 0,
        fireAgent: false,
        resultMessage:
          `Your heartfelt public apology and prompt payment of the internal fine restored respect in the dressing room. The manager appreciated your humility and kept you in the lineup.`,
      };
    } else if (optionKey === "defend_personal_pr") {
      return {
        rng: curRng,
        moraleDelta: -5,
        managerTrustDelta: -20,
        ovrDelta: 0,
        cashDelta: 0,
        followersDelta: +95000,
        suspendedMatches: 1,
        fireAgent: false,
        resultMessage:
          `Your fiery attack on paparazzi privacy invasion went massively viral (+95,000 TikTok followers). However, the club board was appalled by the negative press and suspended you for 1 game.`,
      };
    } else {
      const { rng: r1, success: suppressed } = checkProbability(curRng, 0.78);
      curRng = r1;
      if (suppressed) {
        return {
          rng: curRng,
          moraleDelta: +8,
          managerTrustDelta: +5,
          ovrDelta: 0,
          cashDelta: -40000,
          followersDelta: 0,
          suspendedMatches: 0,
          fireAgent: false,
          resultMessage:
            `Masterclass in PR control! Your agent's legal squad served swift injunctions, wiping the photos from the web. The scandal died before it could even start.`,
        };
      } else {
        return {
          rng: curRng,
          moraleDelta: -15,
          managerTrustDelta: -15,
          ovrDelta: -1,
          cashDelta: -40000,
          followersDelta: +25000,
          suspendedMatches: 2,
          fireAgent: false,
          resultMessage:
            `DISASTER! The legal cease-and-desist letter leaked online, causing the story to blow up into a worldwide circus. The club issued a 2-game ban for the embarrassment.`,
        };
      }
    }
  } else if (dilemmaType === "agent_clash") {
    if (optionKey === "comply_agent") {
      return {
        rng: curRng,
        moraleDelta: -10,
        managerTrustDelta: -25,
        ovrDelta: 0,
        cashDelta: +30000,
        followersDelta: -20000,
        suspendedMatches: 0,
        fireAgent: false,
        transferOfferBoost: true,
        resultMessage:
          `You handed in the transfer request as instructed. Your agent wired your advance commission cut (+€30,000), but angry fans stormed your social comments and manager trust evaporated.`,
      };
    } else if (optionKey === "defy_sack_agent") {
      return {
        rng: curRng,
        moraleDelta: +20,
        managerTrustDelta: +30,
        ovrDelta: 0,
        cashDelta: 0,
        followersDelta: +40000,
        suspendedMatches: 0,
        fireAgent: true,
        resultMessage:
          `LEGENDARY STAND! You publicly sacked your agent for prioritizing greed over the club. The home fans gave you a standing ovation, your manager crowned you a future captain, and you are now free to hire a new representative!`,
      };
    } else {
      const agentNeg = agent?.negotiation || 6;
      return {
        rng: curRng,
        moraleDelta: +8,
        managerTrustDelta: +8,
        ovrDelta: 0,
        cashDelta: 0,
        followersDelta: +5000,
        suspendedMatches: 0,
        fireAgent: false,
        wageBoostPct: 0.12 + (agentNeg * 0.015),
        resultMessage:
          `Maturity prevailed. You forced your agent to conduct civilized discussions behind closed doors. The club agreed to reward your quiet professionalism with a contract bump!`,
      };
    }
  } else if (dilemmaType === "banned_supplement") {
    if (optionKey === "strictly_reject") {
      return {
        rng: curRng,
        moraleDelta: +10,
        managerTrustDelta: +12,
        ovrDelta: 0,
        cashDelta: 0,
        followersDelta: +5000,
        suspendedMatches: 0,
        fireAgent: false,
        resultMessage:
          `You dismissed the rogue trainer with indignation. Upholding clean sportsmanship strengthened your reputation as a consummately professional role model.`,
      };
    } else {
      const { rng: r1, success: undetected } = checkProbability(curRng, 0.78);
      curRng = r1;
      if (undetected) {
        return {
          rng: curRng,
          moraleDelta: +20,
          managerTrustDelta: +15,
          ovrDelta: +3,
          cashDelta: -25000,
          followersDelta: +30000,
          suspendedMatches: 0,
          fireAgent: false,
          resultMessage:
            `HIGH-STAKES GAMBLE PAYS OFF! The underground recovery formula transformed your stamina and power (+3 OVR BOOST across PAC, PHY & SHO!). Standard anti-doping tests came back completely negative!`,
        };
      } else {
        return {
          rng: curRng,
          moraleDelta: -30,
          managerTrustDelta: -50,
          ovrDelta: -3,
          cashDelta: -100000,
          followersDelta: -80000,
          suspendedMatches: 10,
          bannedSeason: true,
          fireAgent: false,
          resultMessage:
            `CATASTROPHE! Surprise testing by UEFA / WADA detected synthetic peptide metabolites! You have been hit with a crushing multi-month suspension and massive €100,000 fine!`,
        };
      }
    }
  } else if (dilemmaType === "locker_room_civil_war") {
    if (optionKey === "back_manager") {
      return {
        rng: curRng,
        moraleDelta: -8,
        managerTrustDelta: +25,
        ovrDelta: 0,
        cashDelta: 0,
        followersDelta: 0,
        suspendedMatches: 0,
        fireAgent: false,
        resultMessage:
          `You publicly sided with the manager. He rewarded you with guaranteed starts and tactical freedom, though veteran teammates now keep their distance in the dressing room.`,
      };
    } else if (optionKey === "back_squad") {
      return {
        rng: curRng,
        moraleDelta: +18,
        managerTrustDelta: -22,
        ovrDelta: 0,
        cashDelta: 0,
        followersDelta: +10000,
        suspendedMatches: 2,
        fireAgent: false,
        resultMessage:
          `You stood shoulder-to-shoulder with the squad. The team spirit surged (+18 Morale), but the enraged manager banished you to the bench for the next 2 matches.`,
      };
    } else {
      return {
        rng: curRng,
        moraleDelta: +5,
        managerTrustDelta: +5,
        ovrDelta: +1,
        cashDelta: 0,
        followersDelta: 0,
        suspendedMatches: 0,
        fireAgent: false,
        resultMessage:
          `You kept your head down, stayed away from club politics, and channeled your energy into individual finishing and fitness drills (+1 OVR focus).`,
      };
    }
  } else {
    if (optionKey === "secret_offshore_deal") {
      const { rng: r1, success: audited } = checkProbability(curRng, 0.32);
      curRng = r1;
      if (audited) {
        return {
          rng: curRng,
          moraleDelta: -10,
          managerTrustDelta: -18,
          ovrDelta: 0,
          cashDelta: +250000,
          followersDelta: +15000,
          suspendedMatches: 1,
          fireAgent: false,
          resultMessage:
            `You cashed the offshore sponsorship payment, but club auditors discovered the image rights breach. The club slapped you with a €100,000 fine and 1-game benching, though you still kept €250,000 profit.`,
        };
      } else {
        return {
          rng: curRng,
          moraleDelta: +15,
          managerTrustDelta: 0,
          ovrDelta: 0,
          cashDelta: +350000,
          followersDelta: +35000,
          suspendedMatches: 0,
          fireAgent: false,
          resultMessage:
            `JACKPOT! The offshore endorsement was wired seamlessly into your holding company (+€350,000!). The club never suspected a thing.`,
        };
      }
    } else {
      return {
        rng: curRng,
        moraleDelta: +5,
        managerTrustDelta: +12,
        ovrDelta: 0,
        cashDelta: 0,
        followersDelta: +3000,
        suspendedMatches: 0,
        fireAgent: false,
        resultMessage:
          `You politely declined the rival brand. The club's commercial director praised your loyalty and arranged an approved personal sponsor shoot instead.`,
      };
    }
  }
}
