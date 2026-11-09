import countriesData from "./countries.json" with { type: "json" };
import competitionsData from "./competitions.json" with { type: "json" };
import confederationsData from "./confederations.json" with { type: "json" };
import domesticCupsData from "./domesticCups.json" with { type: "json" };
import globalTrophiesData from "./globalTrophies.json" with { type: "json" };

export const CATALOG = {
  countries: countriesData,
  competitions: competitionsData,
  confederations: confederationsData,
  domestic_cups: domesticCupsData,
  global_national_trophies: {
    world_cup: globalTrophiesData.world_cup,
  },
  global_club_trophies: {
    club_world_cup: globalTrophiesData.club_world_cup,
  },
};

export class CatalogIndex {
  constructor(catalog) {
    this.teamById = new Map();
    this.competitionByTeamId = new Map();
    this.competitionsByCountry = new Map();
    this.competitionsByConfederation = new Map();
    this.countryByFifa = new Map();
    this.countryByIso = new Map();
    this.teamsByReputation = new Map();
    this.allTeamsList = [];

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
      this.competitionsByCountry.get(countryCode).push(comp);

      if (!this.competitionsByConfederation.has(confCode)) {
        this.competitionsByConfederation.set(confCode, []);
      }
      this.competitionsByConfederation.get(confCode).push(comp);

      for (const team of comp.teams) {
        this.teamById.set(team.id, team);
        this.competitionByTeamId.set(team.id, comp);
        this.allTeamsList.push(team);

        const rep = team.international_reputation;
        if (!this.teamsByReputation.has(rep)) {
          this.teamsByReputation.set(rep, []);
        }
        this.teamsByReputation.get(rep).push(team);
      }
    }
  }

  getTeam(id) {
    return this.teamById.get(id) || null;
  }

  getCompetition(teamId) {
    return this.competitionByTeamId.get(teamId) || null;
  }

  getCompetitionsByCountry(fifaCode) {
    return this.competitionsByCountry.get(fifaCode.toUpperCase()) || [];
  }

  getCompetitionsByConfederation(confed) {
    return this.competitionsByConfederation.get(confed.toUpperCase()) || [];
  }

  getCountryByFifa(fifaCode) {
    return this.countryByFifa.get(fifaCode.toUpperCase()) || null;
  }

  getCountryByIso(iso) {
    return this.countryByIso.get(iso.toUpperCase()) || null;
  }

  getTeamsByReputation(rep) {
    return this.teamsByReputation.get(rep) || [];
  }

  getAllTeams() {
    return this.allTeamsList;
  }

  getDomesticCup(cupId) {
    return CATALOG.domestic_cups[cupId] || null;
  }
}

export const catalogIndex = new CatalogIndex(CATALOG);
