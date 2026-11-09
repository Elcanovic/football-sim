/**
 * Interactive Press Conference & Media Narratives Engine
 * Generates authentic post-match and derby press room questions with real front-page newspaper headlines.
 */

import type { Player } from "./types.ts";
import { pickRandom, PRNG } from "./prng.ts";

export interface MediaOutlet {
  id: string;
  name: string;
  country: string;
  tagline: string;
  badgeColor: string;
}

export const MEDIA_OUTLETS: MediaOutlet[] = [
  {
    id: "sky_sports",
    name: "Sky Sports News",
    country: "England",
    tagline: "Breaking Sports Coverage",
    badgeColor: "bg-red-600 text-white",
  },
  {
    id: "marca",
    name: "MARCA",
    country: "Spain",
    tagline: "Diario Deportivo Lider",
    badgeColor: "bg-amber-600 text-white",
  },
  {
    id: "lequipe",
    name: "L'Équipe",
    country: "France",
    tagline: "Le Quotidien du Sport",
    badgeColor: "bg-rose-700 text-white",
  },
  {
    id: "gazzetta",
    name: "La Gazzetta dello Sport",
    country: "Italy",
    tagline: "Tutto il Rosa della Vita",
    badgeColor: "bg-pink-600 text-white",
  },
  {
    id: "kicker",
    name: "kicker Sportmagazin",
    country: "Germany",
    tagline: "Fussball Pur",
    badgeColor: "bg-red-800 text-white",
  },
  {
    id: "fabrizio",
    name: "Fabrizio Romano • HERE WE GO",
    country: "Global",
    tagline: "Exclusive Transfer Intel",
    badgeColor: "bg-cyan-600 text-white",
  },
];

export interface PressAnswerOption {
  id: "humble" | "box_office" | "diplomatic";
  text: string;
  toneLabel: string;
  consequencesSummary: string;
  trustDelta: number;
  moraleDelta: number;
  followersGain: number;
  headlineTemplate: string;
  subheadTemplate: string;
}

export interface PressConference {
  id: string;
  outlet: MediaOutlet;
  journalistName: string;
  scenario: "derby" | "title_race" | "slump" | "transfer_rumor" | "ballon_dor";
  topicTitle: string;
  question: string;
  options: PressAnswerOption[];
}

export interface PressResolution {
  headline: string;
  subhead: string;
  outletName: string;
  journalistName: string;
  newspaperSnippet: string;
  trustDelta: number;
  moraleDelta: number;
  followersGain: number;
}

export function generatePressConference(
  rng: PRNG,
  player: Player,
  clubName: string = "Club",
  seasonIndex?: number,
): { rng: PRNG; conference: PressConference } {
  let curRng = rng;
  const { rng: rOutlet, item: outlet } = pickRandom(curRng, MEDIA_OUTLETS);
  curRng = rOutlet;

  const scenarios: PressConference["scenario"][] = ["derby", "title_race", "slump", "transfer_rumor", "ballon_dor"];
  const { rng: rScen, item: scenario } = pickRandom(curRng, scenarios);
  curRng = rScen;

  const journalistNames = [
    "Gianluca Di Marzio",
    "Henry Winter",
    "Guillem Balague",
    "David Ornstein",
    "Julien Laurens",
    "James Horncastle",
    "Martin Tyler",
    "Tancredi Palmeri",
  ];
  const { rng: rJourno, item: journalistName } = pickRandom(curRng, journalistNames);
  curRng = rJourno;

  let topicTitle = "Pre-Match Media Briefing";
  let question = "";
  let options: PressAnswerOption[] = [];

  const name = player.lastName.toUpperCase();

  if (scenario === "derby") {
    topicTitle = "High-Stakes Derby Press Conference";
    question =
      `"${name}, the city rivals claim you are mentally rattled ahead of the big derby. How do you respond to their manager's comments?"`;
    options = [
      {
        id: "humble",
        toneLabel: "Humble & Team-First",
        text:
          "“Talk is cheap. We let our football do the talking on the pitch. The three points for our fans are all that matters.”",
        consequencesSummary: "+8 Manager Trust • +5 Morale",
        trustDelta: 8,
        moraleDelta: 5,
        followersGain: 15000,
        headlineTemplate: `“OUR FOOTBALL DOES THE TALKING”: ${name} SHRUGS OFF DERBY PROVOCATIONS`,
        subheadTemplate: `Maturity and laser focus inside the ${clubName} camp ahead of the heated derby clash.`,
      },
      {
        id: "box_office",
        toneLabel: "Box Office & Provocative",
        text:
          "“They can put three defenders on me, they still won't stop me. We are superior in every position and we'll prove it.”",
        consequencesSummary: "+125,000 Social Followers • -6 Manager Trust",
        trustDelta: -6,
        moraleDelta: 8,
        followersGain: 125000,
        headlineTemplate: `EXPLOSIVE! ${name}: “THEY CANNOT TOUCH ME — WE ARE SUPERIOR”`,
        subheadTemplate: `The ${clubName} talisman lights the fuse before kickoff in a savage verbal retaliation!`,
      },
      {
        id: "diplomatic",
        toneLabel: "Strategic & Composed",
        text:
          "“Derbies are decided by composure and discipline. We respect them, but our preparation has been immaculate.”",
        consequencesSummary: "+4 Manager Trust • +30,000 Followers",
        trustDelta: 4,
        moraleDelta: 3,
        followersGain: 30000,
        headlineTemplate: `ICE COLD: ${name} CALLS FOR DISCIPLINE IN ELECTRIC DERBY PRELUDE`,
        subheadTemplate: `Calculated composure marks ${clubName}'s press conference leading into the weekend.`,
      },
    ];
  } else if (scenario === "transfer_rumor") {
    topicTitle = "Transfer Window Speculation";
    question =
      `"${name}, European giants are reportedly preparing a world-record €140M bid for your signature. Is your heart still in ${clubName}?"`;
    options = [
      {
        id: "humble",
        toneLabel: "Pledge Club Loyalty",
        text:
          "“I am 100% committed to this shirt and this project. As long as I wear this badge, I give my life for it.”",
        consequencesSummary: "+12 Manager Trust • Fans Ecstatic",
        trustDelta: 12,
        moraleDelta: 8,
        followersGain: 25000,
        headlineTemplate: `“MY LIFE FOR THIS BADGE”: ${name} PLEDGES TOTAL COMMITMENT TO ${clubName.toUpperCase()}`,
        subheadTemplate: `Supporters rejoice as the superstar emphatically shuts down transfer departure rumors.`,
      },
      {
        id: "box_office",
        toneLabel: "Keep Options Open (Provocative)",
        text:
          "“In modern football, you can never close any doors. I want to play at the very pinnacle and win the biggest trophies.”",
        consequencesSummary: "+200,000 Viral Followers • -10 Manager Trust",
        trustDelta: -10,
        moraleDelta: 2,
        followersGain: 200000,
        headlineTemplate: `BOMBSHELL! ${name} FLIRTS WITH MEGA-MOVE: “DOORS ARE NEVER CLOSED”`,
        subheadTemplate: `Transfer alarm bells ring across Europe as the talisman refuses to commit long-term future!`,
      },
      {
        id: "diplomatic",
        toneLabel: "Leave It to Agent",
        text:
          "“My representatives handle contractual matters behind the scenes. I only focus on training and winning on Saturday.”",
        consequencesSummary: "+2 Manager Trust • +45,000 Followers",
        trustDelta: 2,
        moraleDelta: 4,
        followersGain: 45000,
        headlineTemplate: `DIPLOMATIC SILENCE: ${name} DEFERS CONTRACT QUESTIONS TO REPRESENTATIVES`,
        subheadTemplate: `Cool and detached, the ${clubName} star lets agents navigate ongoing transfer noise.`,
      },
    ];
  } else {
    topicTitle = "Ballon d'Or & Global Prestige";
    question =
      `"${name}, with your current statistics, analysts are calling you a prime contender for the Ballon d'Or. Do you see yourself as the world's best?"`;
    options = [
      {
        id: "humble",
        toneLabel: "Team Glory First",
        text:
          "“Individual accolades are an afterthought. If we lift the trophies as a team, personal honors take care of themselves.”",
        consequencesSummary: "+6 Manager Trust • +8 Morale",
        trustDelta: 6,
        moraleDelta: 8,
        followersGain: 40000,
        headlineTemplate: `HUMBLE GENIUS: ${name} PRIORITIZES COLLECTIVE SILVERWARE OVER BALLON D'OR`,
        subheadTemplate: `A masterclass in leadership as ${clubName}'s star keeps squad goals paramount.`,
      },
      {
        id: "box_office",
        toneLabel: "Claim the Throne",
        text:
          "“Look at the numbers, look at the decisive games. Nobody in world football is performing at my level right now.”",
        consequencesSummary: "+250,000 TikTok/X Followers • Polarizes Pundits",
        trustDelta: -4,
        moraleDelta: 10,
        followersGain: 250000,
        headlineTemplate: `“NOBODY IS ON MY LEVEL”: ${name} CLAIMS FOOTBALL'S THRONE IN AUDACIOUS DECLARATION`,
        subheadTemplate: `Pundits and social media ignite after the superstar declares himself world number one!`,
      },
      {
        id: "diplomatic",
        toneLabel: "Let History Judge",
        text:
          "“It is an honor just to be in the conversation alongside legends. I just want to write my own chapter in football history.”",
        consequencesSummary: "+5 Manager Trust • +60,000 Followers",
        trustDelta: 5,
        moraleDelta: 6,
        followersGain: 60000,
        headlineTemplate: `LEGACY IN SIGHT: ${name} EYES FOOTBALL IMMORTALITY WITH TIMELESS CLASS`,
        subheadTemplate: `Respectful tribute to legends as ${name} builds an unassailable award resume.`,
      },
    ];
  }

  const sTag = seasonIndex !== undefined ? `s${seasonIndex}` : `${player.age}`;
  return {
    rng: curRng,
    conference: {
      id: `press-${curRng.seed}-${sTag}-${scenario}`,
      outlet,
      journalistName,
      scenario,
      topicTitle,
      question,
      options,
    },
  };
}

export function resolvePressAnswer(
  player: Player,
  conference: PressConference,
  answerId: string,
): PressResolution {
  const chosen = conference.options.find((opt) => opt.id === answerId) || conference.options[0];

  player.managerTrust = Math.max(0, Math.min(100, player.managerTrust + chosen.trustDelta));
  player.morale = Math.max(0, Math.min(100, player.morale + chosen.moraleDelta));
  if (player.socialMedia) {
    player.socialMedia.totalFollowers += chosen.followersGain;
  }

  const snippet =
    `${conference.outlet.name} • Special Correspondent ${conference.journalistName} reporting live from the press auditorium: ${chosen.subheadTemplate}`;

  return {
    headline: chosen.headlineTemplate,
    subhead: chosen.subheadTemplate,
    outletName: conference.outlet.name,
    journalistName: conference.journalistName,
    newspaperSnippet: snippet,
    trustDelta: chosen.trustDelta,
    moraleDelta: chosen.moraleDelta,
    followersGain: chosen.followersGain,
  };
}
