// Script to build standalone.html with embedded client-side hybrid engine

const countries = await Deno.readTextFile("src/data/countries.json");
const competitions = await Deno.readTextFile("src/data/competitions.json");
const confederations = await Deno.readTextFile("src/data/confederations.json");
const domesticCups = await Deno.readTextFile("src/data/domesticCups.json");
const globalTrophies = await Deno.readTextFile("src/data/globalTrophies.json");

const prngCode = await Deno.readTextFile("src/engine/prng.ts");
const attrsCode = await Deno.readTextFile("src/engine/attributes.ts");
const ecoCode = await Deno.readTextFile("src/engine/economics.ts");
const leagueCode = await Deno.readTextFile("src/engine/leagueSim.ts");
const cupCode = await Deno.readTextFile("src/engine/cupSim.ts");
const matchCode = await Deno.readTextFile("src/engine/matchEngine.ts");
const rosterCode = await Deno.readTextFile("src/engine/rosterGen.ts");
const eventsCode = await Deno.readTextFile("src/engine/careerEvents.ts");
const careerCode = await Deno.readTextFile("src/engine/careerEngine.ts");

// Clean TypeScript types/interfaces from code using simple regexes so it runs in pure standard browser JS
function stripTypeScript(tsCode: string): string {
  return tsCode
    .replace(/^import\s+type\s+.*?;?\s*$/gm, "")
    .replace(/^import\s+.*?;?\s*$/gm, "")
    .replace(/^export\s+interface\s+[\s\S]*?^}\s*$/gm, "")
    .replace(/^export\s+type\s+.*?;?\s*$/gm, "")
    .replace(/^interface\s+[\s\S]*?^}\s*$/gm, "")
    .replace(/^type\s+.*?;?\s*$/gm, "")
    .replace(/^export\s+/gm, "")
    .replace(/:\s*[A-Za-z0-9_<>\[\]|&]+(\s*=\s*[^,);]+)?(?=[,);])/g, (_match, def) => def || "")
    .replace(/as\s+[A-Za-z0-9_<>\[\]|&]+/g, "")
    .replace(/<[A-Za-z0-9_,\s]+>/g, "");
}

const htmlTemplate = await Deno.readTextFile("src/web/index.html");

const parsedGlobal = JSON.parse(globalTrophies);
const clientEngineScript = `
<script>
// Embedded Catalog
const CATALOG = {
  countries: ${countries},
  competitions: ${competitions},
  confederations: ${confederations},
  domestic_cups: ${domesticCups},
  global_national_trophies: ${JSON.stringify(parsedGlobal.world_cup)},
  global_club_trophies: ${JSON.stringify(parsedGlobal.club_world_cup)}
};


class CatalogIndex {
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

  getTeam(id) { return this.teamById.get(id) || null; }
  getCompetition(teamId) { return this.competitionByTeamId.get(teamId) || null; }
  getCompetitionsByCountry(fifaCode) { return this.competitionsByCountry.get(fifaCode.toUpperCase()) || []; }
  getCompetitionsByConfederation(confed) { return this.competitionsByConfederation.get(confed.toUpperCase()) || []; }
  getCountryByFifa(fifaCode) { return this.countryByFifa.get(fifaCode.toUpperCase()) || null; }
  getCountryByIso(iso) { return this.countryByIso.get(iso.toUpperCase()) || null; }
  getTeamsByReputation(rep) { return this.teamsByReputation.get(rep) || []; }
  getAllTeams() { return this.allTeamsList; }
}

const catalogIndex = new CatalogIndex(CATALOG);

// PRNG & UTILS
${stripTypeScript(prngCode)}

// ATTRIBUTES & AGING
${stripTypeScript(attrsCode)}

// ECONOMICS & WAGES
${stripTypeScript(ecoCode)}

// LEAGUE SIMULATOR
${stripTypeScript(leagueCode)}

// TOURNAMENT CUPS
${stripTypeScript(cupCode)}

// MATCH STATS
${stripTypeScript(matchCode)}

// ROSTER & RIVALS
${stripTypeScript(rosterCode)}

// CAREER EVENTS & CLUTCH MOMENTS
${stripTypeScript(eventsCode)}

// MASTER ENGINE
${stripTypeScript(careerCode)}
</script>
`;

// Replace script src with inline engine + client controller
let appJs = await Deno.readTextFile("src/web/app.js");

// Modify appJs to call local functions instead of fetch
appJs = appJs.replace(
  /const res = await fetch\('\/api\/start'[\s\S]*?state = await res\.json\(\);/,
  `state = initPlayerCareer(
      'career-' + Date.now(),
      selectMode.value,
      inputLastName.value || 'Valente',
      Number(inputNumber.value) || 10,
      selectedFoot,
      selectCountry.value,
      selectedPosition,
      selectProfile.value
    );`,
);

appJs = appJs.replace(
  /const res = await fetch\('\/api\/decision'[\s\S]*?state = await res\.json\(\);/,
  `state = executeDecisionAndSimulate(state, optionId);`,
);

const standaloneHtml = htmlTemplate.replace(
  '<script src="/app.js"></script>',
  `${clientEngineScript}\n<script>\n${appJs}\n</script>`,
);

await Deno.writeTextFile("standalone.html", standaloneHtml);
console.log("Successfully generated standalone.html!");
