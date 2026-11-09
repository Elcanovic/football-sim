// Script to build standalone.html with embedded client-side hybrid engine

const countries = await Deno.readTextFile("src/data/countries.json");
const competitions = await Deno.readTextFile("src/data/competitions.json");
const confederations = await Deno.readTextFile("src/data/confederations.json");
const domesticCups = await Deno.readTextFile("src/data/domesticCups.json");
const globalTrophies = JSON.parse(await Deno.readTextFile("src/data/globalTrophies.json"));

const prngCode = await Deno.readTextFile("src/engine/prng.js");
const attrsCode = await Deno.readTextFile("src/engine/attributes.js");
const ecoCode = await Deno.readTextFile("src/engine/economics.js");
const leagueCode = await Deno.readTextFile("src/engine/leagueSim.js");
const cupCode = await Deno.readTextFile("src/engine/cupSim.js");
const matchCode = await Deno.readTextFile("src/engine/matchEngine.js");
const rosterCode = await Deno.readTextFile("src/engine/rosterGen.js");
const eventsCode = await Deno.readTextFile("src/engine/careerEvents.js");
const nationalCode = await Deno.readTextFile("src/engine/nationalTeam.js");
const continentalCode = await Deno.readTextFile("src/engine/continental.js");
const agentsCode = await Deno.readTextFile("src/engine/agents.js");
const sponsorshipsCode = await Deno.readTextFile("src/engine/sponsorships.js");
const pressCode = await Deno.readTextFile("src/engine/pressEngine.js");
const loansCode = await Deno.readTextFile("src/engine/loansEngine.js");
const negoCode = await Deno.readTextFile("src/engine/negotiationEngine.js");
const svgCode = await Deno.readTextFile("src/engine/svgGenerator.js");
const museumCode = await Deno.readTextFile("src/engine/retirementMuseum.js");
const careerCode = await Deno.readTextFile("src/engine/careerEngine.js");

function stripImportsExports(code) {
  return code
    .replace(/import\s+(?:(?:\*[\s\S]*?|\{[\s\S]*?\}|[^\n;]+)\s+from\s+)?['"][^'"]+['"];?/g, "")
    .replace(/import\s+['"][^'"]+['"];?/g, "")
    .replace(/export\s+(async\s+function|function|const|let|var|class)\s+/g, "$1 ")
    .replace(/export\s+default\s+[\s\S]*?;/g, "")
    .replace(/export\s+\{[\s\S]*?\}(?:\s*from\s*['"][^'"]+['"])?;?/g, "");
}

const htmlTemplate = await Deno.readTextFile("src/web/index.template.html");

const clientEngineCode = `
// Embedded Catalog
const CATALOG = {
  countries: ${countries},
  competitions: ${competitions},
  confederations: ${confederations},
  domestic_cups: ${domesticCups},
  global_national_trophies: ${JSON.stringify(globalTrophies.world_cup)},
  global_club_trophies: ${JSON.stringify(globalTrophies.club_world_cup)}
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
  getDomesticCup(cupId) { return CATALOG.domestic_cups[cupId] || null; }
}

const catalogIndex = new CatalogIndex(CATALOG);

// PRNG & UTILS
${stripImportsExports(prngCode)}

// ATTRIBUTES & AGING
${stripImportsExports(attrsCode)}

// ECONOMICS & WAGES
${stripImportsExports(ecoCode)}

// LEAGUE SIMULATOR
${stripImportsExports(leagueCode)}

// TOURNAMENT CUPS
${stripImportsExports(cupCode)}

// MATCH STATS
${stripImportsExports(matchCode)}

// ROSTER & RIVALS
${stripImportsExports(rosterCode)}

// CAREER EVENTS & CLUTCH MOMENTS
${stripImportsExports(eventsCode)}

// NATIONAL TEAM & TOURNAMENTS
${stripImportsExports(nationalCode)}

// LEAGUE PRESTIGE, CONTINENTAL CUPS & RETIREMENT
${stripImportsExports(continentalCode)}

// 40 GLOBAL PLAYER AGENTS
${stripImportsExports(agentsCode)}

// BOOT CONTRACTS & BRAND SPONSORSHIPS
${stripImportsExports(sponsorshipsCode)}

// PRESS CONFERENCES & JOURNALISTIC NARRATIVES
${stripImportsExports(pressCode)}

// MULTI-TYPE LOANS ENGINE
${stripImportsExports(loansCode)}

// NEGOTIATION HOT-SEAT ENGINE
${stripImportsExports(negoCode)}

// PROCEDURAL SVG SHIELDS & ASSET PIPELINE
${stripImportsExports(svgCode)}

// RETIREMENT MUSEUM & LEGACY ARCHIVE
${stripImportsExports(museumCode)}

// MASTER ENGINE
${stripImportsExports(careerCode)}

// GLOBAL WINDOW ATTACHMENTS FOR SEAMLESS CLIENT EXECUTION
if (typeof window !== 'undefined') {
  window.CATALOG = typeof CATALOG !== 'undefined' ? CATALOG : null;
  window.catalogIndex = typeof catalogIndex !== 'undefined' ? catalogIndex : null;
  window.AGENTS_CATALOG = typeof AGENTS_CATALOG !== 'undefined' ? AGENTS_CATALOG : null;
  window.initPlayerCareer = typeof initPlayerCareer !== 'undefined' ? initPlayerCareer : null;
  window.executeDecisionAndSimulate = typeof executeDecisionAndSimulate !== 'undefined' ? executeDecisionAndSimulate : null;
  window.hireNewAgent = typeof hireNewAgent !== 'undefined' ? hireNewAgent : null;
  window.fireCurrentAgent = typeof fireCurrentAgent !== 'undefined' ? fireCurrentAgent : null;
  window.renegotiateWageWithCurrentAgent = typeof renegotiateWageWithCurrentAgent !== 'undefined' ? renegotiateWageWithCurrentAgent : null;
  window.initHotSeatSession = typeof initHotSeatSession !== 'undefined' ? initHotSeatSession : null;
  window.submitCounterOffer = typeof submitCounterOffer !== 'undefined' ? submitCounterOffer : null;
  window.finalizeHotSeat = typeof finalizeHotSeat !== 'undefined' ? finalizeHotSeat : null;
  window.calculateAnnualPerkValue = typeof calculateAnnualPerkValue !== 'undefined' ? calculateAnnualPerkValue : null;
  window.getApplicableBuyoutFee = typeof getApplicableBuyoutFee !== 'undefined' ? getApplicableBuyoutFee : null;
  window.getActiveReleaseClause = typeof getActiveReleaseClause !== 'undefined' ? getActiveReleaseClause : null;
  window.evaluateSquadStatusFulfillment = typeof evaluateSquadStatusFulfillment !== 'undefined' ? evaluateSquadStatusFulfillment : null;
  window.createLoanDeal = typeof createLoanDeal !== 'undefined' ? createLoanDeal : null;
  window.isEligibleForMatch = typeof isEligibleForMatch !== 'undefined' ? isEligibleForMatch : null;
  window.generateClubShieldSVG = typeof generateClubShieldSVG !== 'undefined' ? generateClubShieldSVG : null;
  window.getClubCdnBadgeUrl = typeof getClubCdnBadgeUrl !== 'undefined' ? getClubCdnBadgeUrl : null;
  window.generateCareerEras = typeof generateCareerEras !== 'undefined' ? generateCareerEras : null;
  window.compileSilverwareSanctuary = typeof compileSilverwareSanctuary !== 'undefined' ? compileSilverwareSanctuary : null;
  window.calculateGoatLegacyIndex = typeof calculateGoatLegacyIndex !== 'undefined' ? calculateGoatLegacyIndex : null;
  window.generatePostCareerEpilogue = typeof generatePostCareerEpilogue !== 'undefined' ? generatePostCareerEpilogue : null;
  window.getAvailablePostCareerPathways = typeof getAvailablePostCareerPathways !== 'undefined' ? getAvailablePostCareerPathways : null;
}
`;

// Web UI: src/web/app.js and the ES modules it imports (src/web/ui/, src/web/celebration.js).
// Modules are emitted dependency-first, each once, with their import lines and `export`
// keywords removed, inside one function scope so no UI name leaks onto the page's globals.
// A circular import fails the build.
async function bundleWebUi(entryPath) {
  const status = new Map(); // path -> "visiting" | "done"
  const ordered = [];
  async function visit(path, chain) {
    if (status.get(path) === "done") return;
    if (status.get(path) === "visiting") {
      throw new Error(`Circular import in the web UI: ${[...chain, path].join(" -> ")}`);
    }
    status.set(path, "visiting");
    const source = await Deno.readTextFile(path);
    for (const m of source.matchAll(/^import\s[^;]*?\sfrom\s+["'](\.{1,2}\/[^"']+)["'];?$/gm)) {
      const dep = new URL(m[1], new URL(path, "file:///")).pathname.slice(1);
      await visit(dep, [...chain, path]);
    }
    status.set(path, "done");
    ordered.push({ path, source });
  }
  await visit(entryPath, []);
  const body = ordered.map(({ path, source }) => {
    const stripped = source
      .replace(/^import\s[^;]*?\sfrom\s+["'][^"']+["'];?[ \t]*\n/gm, "")
      .replace(/^export\s+(?=(?:async\s+)?function\b|const\b|let\b|class\b)/gm, "");
    return `// ---- ${path}\n${stripped}`;
  }).join("\n");
  return `(() => {\n"use strict";\n${body}\n})();`;
}

const webUiJs = await bundleWebUi("src/web/app.js");

const standaloneHtml = htmlTemplate.replace(
  '<script type="module" src="/app.js"></script>',
  `<script>\n${clientEngineCode}\n</script>\n<script>\n${webUiJs}\n</script>`,
);
if (standaloneHtml === htmlTemplate) {
  throw new Error('index.template.html is missing <script type="module" src="/app.js"></script>');
}

await Deno.writeTextFile("standalone.html", standaloneHtml);
await Deno.writeTextFile("index.html", standaloneHtml);
await Deno.writeTextFile("src/web/index.html", standaloneHtml);
console.log("Successfully built standalone.html, index.html, and src/web/index.html!");
