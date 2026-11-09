import countriesData from "./countries.json" with { type: "json" };
import competitionsData from "./competitions.json" with { type: "json" };
import confederationsData from "./confederations.json" with { type: "json" };
import domesticCupsData from "./domesticCups.json" with { type: "json" };
import globalTrophiesData from "./globalTrophies.json" with { type: "json" };

export interface Country {
  name_en: string;
  name_es: string;
  name_pt: string;
  iso_alpha2: string | null;
  fifa_code: string;
  slug: string;
  flag_url: string;
  logo_url: string | null;
  confederation: string;
  continental_reputation: number;
  fifa_reputation: number;
  international_reputation: number;
  primary_color: string;
  kit_primary_color: string;
  kit_secondary_color: string;
  kit_tertiary_color: string | null;
  kit_type?: string;
}

export interface Team {
  id: string;
  name: string;
  short_name: string;
  abbreviation: string;
  logo_url: string;
  primary_color: string;
  domestic_reputation: number;
  continental_reputation: number;
  international_reputation: number;
}

export interface Competition {
  id: string;
  name: string;
  country_fifa_code: string;
  logo_url: string;
  league_trophy_url: string;
  confederation: string;
  tier: number;
  domestic_cup_id?: string;
  teams: Team[];
}

export interface TrophyInfo {
  name: string;
  trophy_url: string;
  logo_url?: string | null;
}

export interface DomesticCupInfo {
  name: string;
  country_fifa_code: string;
  trophy_url: string;
}

export interface Catalog {
  countries: Country[];
  competitions: Competition[];
  confederations: Record<string, any>;
  domestic_cups: Record<string, DomesticCupInfo>;
  global_national_trophies: Record<string, TrophyInfo>;
  global_club_trophies: Record<string, TrophyInfo>;
}

export const CATALOG: Catalog = {
  countries: countriesData as Country[],
  competitions: competitionsData as Competition[],
  confederations: confederationsData,
  domestic_cups: domesticCupsData as Record<string, DomesticCupInfo>,
  global_national_trophies: {
    world_cup: (globalTrophiesData as any).world_cup,
  },
  global_club_trophies: {
    club_world_cup: (globalTrophiesData as any).club_world_cup,
  },
};

// Fast lookup indexes
class CatalogIndex {
  private teamById = new Map<string, Team>();
  private competitionByTeamId = new Map<string, Competition>();
  private competitionsByCountry = new Map<string, Competition[]>();
  private competitionsByConfederation = new Map<string, Competition[]>();
  private countryByFifa = new Map<string, Country>();
  private countryByIso = new Map<string, Country>();
  private teamsByReputation = new Map<number, Team[]>();
  private allTeamsList: Team[] = [];

  constructor(catalog: Catalog) {
    for (const c of catalog.countries) {
      if (c.fifa_code) this.countryByFifa.set(c.fifa_code.toUpperCase(), c);
      if (c.iso_alpha2) this.countryByIso.set(c.iso_alpha2.toUpperCase(), c);
    }

    for (const comp of catalog.competitions) {
      const countryCode = comp.country_fifa_code.toUpperCase();
      const confCode = comp.confederation.toUpperCase();

      if (!this.competitionsByCountry.has(countryCode)) {
        this.competitionsByCountry.set(countryCode, []);
      }
      this.competitionsByCountry.get(countryCode)!.push(comp);

      if (!this.competitionsByConfederation.has(confCode)) {
        this.competitionsByConfederation.set(confCode, []);
      }
      this.competitionsByConfederation.get(confCode)!.push(comp);

      for (const team of comp.teams) {
        this.teamById.set(team.id, team);
        this.competitionByTeamId.set(team.id, comp);
        this.allTeamsList.push(team);

        const rep = team.international_reputation;
        if (!this.teamsByReputation.has(rep)) {
          this.teamsByReputation.set(rep, []);
        }
        this.teamsByReputation.get(rep)!.push(team);
      }
    }
  }

  getTeam(id: string): Team | null {
    return this.teamById.get(id) ?? null;
  }

  getCompetition(teamId: string): Competition | null {
    return this.competitionByTeamId.get(teamId) ?? null;
  }

  getCompetitionsByCountry(fifaCode: string): Competition[] {
    return this.competitionsByCountry.get(fifaCode.toUpperCase()) ?? [];
  }

  getCompetitionsByConfederation(confed: string): Competition[] {
    return this.competitionsByConfederation.get(confed.toUpperCase()) ?? [];
  }

  getCountryByFifa(fifaCode: string): Country | null {
    return this.countryByFifa.get(fifaCode.toUpperCase()) ?? null;
  }

  getCountryByIso(iso: string): Country | null {
    return this.countryByIso.get(iso.toUpperCase()) ?? null;
  }

  getTeamsByReputation(rep: number): Team[] {
    return this.teamsByReputation.get(rep) ?? [];
  }

  getAllTeams(): Team[] {
    return this.allTeamsList;
  }

  getDomesticCup(cupId: string): DomesticCupInfo | null {
    return CATALOG.domestic_cups[cupId] ?? null;
  }
}

export const catalogIndex = new CatalogIndex(CATALOG);
