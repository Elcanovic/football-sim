export type { Competition, Country, Team } from "../data/index.ts";
import type { Country } from "../data/index.ts";
import type { PlayerAgent } from "./agents.ts";

export type OutfieldPosition = "LW" | "ST" | "RW" | "LM" | "CAM" | "RM" | "LB" | "CM" | "RB" | "CDM" | "CB";

export type GoalkeeperPosition = "GK";

export type Position = OutfieldPosition | GoalkeeperPosition;

export type RoleCategory = "attacker" | "creator" | "support" | "defensive" | "goalkeeper";

export type SquadRole = "crucial" | "important" | "rotation" | "backup" | "prospect" | "starter";

export type DevelopmentProfile = "early" | "normal" | "late";

export type GameMode = "long" | "normal" | "express";

export interface OutfieldAttributes {
  pace: number; // Sprint speed, acceleration (declines after 29)
  shooting: number; // Finishing, shot power, positioning
  passing: number; // Short/long pass, crossing, vision
  dribbling: number; // Agility, ball control, composure
  defending: number; // Tackling, interceptions, marking
  physical: number; // Stamina, strength, jumping
}

export interface GoalkeeperAttributes {
  diving: number;
  handling: number;
  kicking: number;
  reflexes: number;
  positioning: number;
  physical: number;
}

export type PlayerAttributes = OutfieldAttributes | GoalkeeperAttributes;

export interface Contract {
  clubId: string;
  yearsRemaining: number; // 1 - 5 seasons
  weeklyWage: number; // In EUR (e.g. 15,000 / week)
  annualSalary: number; // weeklyWage * 52
  releaseClause: number | null; // Buyout clause in EUR
  squadRole: SquadRole;
  squadStatus?: SquadStatus;
  releaseClauses?: {
    domestic?: number;
    continental?: number;
    relegation?: number;
    [key: string]: number | undefined;
  };
  goalBonus?: number;
  cleanSheetBonus?: number;
  appearanceFee?: number;
  signingBonus?: number;
  loyaltyBonus?: number;
}

// Display-facing squad-status naming used by contract negotiation. The engine's
// internal SquadRole is finer-grained; negotiationEngine maps between the two.
export type SquadStatus = "Crucial" | "Important" | "Squad Rotation" | "Prospect";

export type LoanType = "full_season" | "winter_six_month" | "multi_year_dev";

export interface LoanMandatoryTriggers {
  relegationSurvival?: boolean;
  promotion?: boolean;
  minAppearances?: number;
  buyFee: number;
}

export interface LoanDealParams {
  type: LoanType;
  parentClubId: string;
  loaningClubId: string;
  parentWageShare: number; // 0-100
  loaningWageShare: number; // 0-100, must sum to 100 with parentWageShare
  playerAge?: number;
  optionToBuyFee?: number;
  mandatoryTriggers?: LoanMandatoryTriggers;
  recallAllowed?: boolean;
  parentMatchRestricted?: boolean;
  seed?: string;
}

export interface LoanDeal {
  id: string; // deterministic: derived from params, never the clock
  type: LoanType;
  parentClubId: string;
  loaningClubId: string;
  seasonsRemaining: number; // full = 1, winter = 1 (half-season), multi_year_dev = 2
  parentWageShare: number;
  loaningWageShare: number;
  optionToBuyFee?: number;
  mandatoryTriggers?: LoanMandatoryTriggers;
  recallAllowed: boolean; // January window only
  parentMatchRestricted: boolean;
}

export interface Teammate {
  id: string;
  name: string;
  position: Position;
  overall: number;
  role: "star" | "rival" | "veteran" | "prospect";
}

export interface Injury {
  id: string;
  name: string; // e.g. "Hamstring Strain", "Torn Meniscus", "Ankle Sprain", "ACL Rupture"
  severity: "minor" | "moderate" | "severe"; // minor: 2-4 wks, moderate: 1-2 mos, severe: 4-8 mos
  gamesMissed: number; // reduces season apps
  paceImpact: number; // temporary/permanent hit
  seasonAge: number;
  recovered: boolean;
}

export interface LifestyleBuffs {
  injuryRiskReduction?: number; // e.g. 0.35 (35% lower risk)
  recoverySpeedBonus?: number;
  statBonus?: { attr: string; val: number };
  moraleBonus?: number;
  trustBonus?: number;
  followerMultiplier?: number;
  passiveIncomeAnnual?: number;
}

export interface LifestyleNerfs {
  trustPenalty?: number;
  staminaHit?: number;
  injuryRiskIncrease?: number;
}

export interface LifestyleChoice {
  id: string;
  name: string;
  icon: string;
  category: "fitness" | "luxury" | "business" | "social";
  costWeekly: number; // Wage deduction
  description: string;
  buffs: LifestyleBuffs;
  nerfs: LifestyleNerfs;
  active: boolean;
}

export interface SocialPlatform {
  platform: "instagram" | "tiktok" | "x";
  name: string;
  icon: string;
  color: string;
  active: boolean; // whether player signed up
  handle: string; // e.g. "@valente.10"
  followers: number; // live follower count
  verified: boolean;
  totalPosts: number;
}

export interface PlayerSocialMedia {
  instagram: SocialPlatform;
  tiktok: SocialPlatform;
  x: SocialPlatform;
  totalFollowers: number;
}

export interface NationalTeamStats {
  appearances: number;
  goals: number;
  assists: number;
  cleanSheets?: number;
  trophies: string[];
}

export interface BootDeal {
  id: string;
  brand: "Nike" | "Adidas" | "Puma" | "Mizuno";
  modelName: string;
  tier: "Academy" | "Rising Star" | "Headline Pro" | "Signature Icon";
  weeklyPay: number;
  statBonus?: { attr: string; val: number };
  colorway: string;
  signatureBootUnlocked: boolean;
  signatureName?: string;
  quote: string;
}

export interface BrandSponsorship {
  id: string;
  brandName: string;
  category: "luxury_watch" | "fashion_house" | "gaming_cover" | "automotive";
  annualPay: number;
  reputationRequired: number;
  active: boolean;
}

export interface TopPlaymakerEntry {
  rank: number;
  playerName: string;
  teamId: string;
  assists: number;
  isUserPlayer: boolean;
}

export interface Player {
  id: string;
  lastName: string;
  preferredNumber: number;
  preferredFoot: "left" | "right";
  nationality: Country;
  secondNationality?: Country | null;
  capTiedNationality?: string | null;
  position: Position;
  roleCategory: RoleCategory;
  developmentProfile: DevelopmentProfile;
  age: number;
  overall: number;
  attributes: PlayerAttributes;
  marketValue: number;
  contract: Contract | null;
  currentTeamId: string | null;
  morale: number; // 0 - 100 (default 75)
  form: number; // 0 - 100 (50 is neutral, >70 is hot)
  managerTrust: number; // 0 - 100 (starts 60)
  careerTotals: CareerTotals;
  nationalTeamStats?: NationalTeamStats;
  activeInjury: Injury | null;
  injuryHistory: Injury[];
  lifestyleChoices: LifestyleChoice[];
  socialMedia: PlayerSocialMedia;
  agent?: PlayerAgent | null;
  bootDeal?: BootDeal | null;
  brandSponsorships?: BrandSponsorship[];
  captaincyStatus?: "none" | "vice_captain" | "captain" | "club_captain";
  minRetirementAge?: number;
  loanDeal?: LoanDeal | null;
}

export interface CareerTotals {
  appearances: number;
  goals: number;
  assists: number;
  cleanSheets: number;
  goalsConceded: number;
  trophies: number;
  awards: number;
  totalWagesEarned: number;
  totalTransferFeesGenerated: number;
  averageMatchRating: number;
}

export interface SeasonMatchStats {
  appearances: number;
  goals: number;
  assists: number;
  cleanSheets: number;
  goalsConceded: number;
  xG: number;
  xA: number;
  averageRating: number;
  minutesPlayed: number;
}

export interface LeagueTableEntry {
  rank: number;
  teamId: string;
  teamName: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
  form: ("W" | "D" | "L")[];
  status: "champion" | "champions_league" | "europa_league" | "safe" | "relegated";
}

export interface TopScorerEntry {
  rank: number;
  playerName: string;
  teamId: string;
  goals: number;
  isUserPlayer: boolean;
}

export interface SeasonSnapshot {
  id: string;
  index: number;
  periodIndex: number;
  age: number;
  teamId: string;
  competitionId: string;
  competitionTier: number;
  overall: number;
  attributes: PlayerAttributes;
  marketValue: number;
  wage: number;
  stats: SeasonMatchStats;
  leaguePosition: number;
  leagueTotalTeams: number;
  leaguePoints: number;
  leagueTable: LeagueTableEntry[];
  topScorers: TopScorerEntry[];
  topPlaymakers?: TopPlaymakerEntry[];
  trophies: string[];
  awards: string[];
  relegated: boolean;
  promoted: boolean;
  contractYearsRemaining: number;
  managerTrust: number;
  morale: number;
  injuryOccurred?: Injury | null;
  totalFollowers?: number;
}

export interface NationalTournament {
  trophy: "national_continental" | "world_cup";
  age: number;
  selectionQualified: boolean;
}

export interface NationalTeamPeriod {
  id: string;
  periodIndex: number;
  ageStart: number;
  ageEnd: number;
  nationalityFifaCode: string;
  overall: number;
  stats: SeasonMatchStats;
}

export type DecisionType =
  | "academy_offer"
  | "transfer"
  | "loan_offer"
  | "post_loan_retained"
  | "post_loan_not_retained"
  | "contract_non_renewal"
  | "contract_renewal"
  | "career_event"
  | "clutch_moment"
  | "dilemma_event"
  | "shirt_number_showdown"
  | "dual_nationality_declaration"
  | "no_offers_retirement";

export interface DecisionOption {
  id: string;
  type:
    | "join_club"
    | "join_loan"
    | "permanent_transfer"
    | "stay"
    | "renew_contract"
    | "career_choice"
    | "clutch_action"
    | "dilemma_choice"
    | "shirt_choice"
    | "dual_nationality_choice"
    | "retire";
  teamId?: string;
  eventKey?: string;
  optionKey?: string;
  dilemmaType?: string;
  label?: string;
  description?: string;
  alternativeNumber?: number;
  loanTerms?: Partial<LoanDealParams>;
  contractOffer?: {
    years: number;
    weeklyWage: number;
    squadRole: SquadRole;
    releaseClause?: number;
  };
}

export interface CareerEventChoice {
  id: string;
  type: DecisionType;
  age: number;
  eventKey: string;
  variantKey?: string;
  title?: string;
  description?: string;
  rivalTeamId?: string;
  targetTrophy?: string;
  alternativeNationalityFifaCode?: string;
  injuryType?: string;
  clutchType?: string;
  dilemmaType?: string;
  options: DecisionOption[];
}
