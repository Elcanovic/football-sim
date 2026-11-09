import { pickRandom } from "./prng.js";

const FIRST_NAMES_BY_REGION = {
  latin: [
    "Mateo",
    "Santiago",
    "Lucas",
    "Julian",
    "Enzo",
    "Federico",
    "Agustin",
    "Rodrigo",
    "Thiago",
    "Gabriel",
    "Bruno",
    "Felipe",
    "Diego",
    "Alejandro",
  ],
  anglo: [
    "Jack",
    "Harry",
    "Mason",
    "Oliver",
    "George",
    "Declan",
    "Cole",
    "Jude",
    "Marcus",
    "James",
    "Callum",
    "Connor",
  ],
  germanic: ["Lukas", "Leon", "Florian", "Maximilian", "Kai", "Felix", "Niklas", "Jonas", "Robin", "Joshua"],
  french: ["Theo", "Lucas", "Antoine", "Jules", "Adrien", "Kylian", "Aurelien", "Eduardo", "Randal", "Brice"],
  italian: ["Federico", "Nicolo", "Lorenzo", "Alessandro", "Gianluca", "Giacomo", "Matteo", "Davide"],
  general: ["Luka", "Milan", "Tariq", "Kenji", "Hassan", "Ahmed", "Viktor", "Igor", "Min-jae", "Daichi"],
};

const LAST_NAMES_BY_REGION = {
  latin: [
    "Silva",
    "Rodriguez",
    "Fernandez",
    "Gonzalez",
    "Martinez",
    "Lopez",
    "Perez",
    "Gomez",
    "Romero",
    "Alvarez",
    "Castillo",
    "Santos",
    "Oliveira",
  ],
  anglo: ["Smith", "Jones", "Walker", "Rice", "Foden", "Bellingham", "Sterling", "Shaw", "Trippier", "White", "Palmer"],
  germanic: ["Muller", "Schmidt", "Schneider", "Fischer", "Weber", "Meyer", "Wagner", "Becker", "Hoffmann"],
  french: ["Dupont", "Moreau", "Laurent", "Simon", "Michel", "Lefebvre", "Roux", "Giroud", "Camavinga"],
  italian: ["Rossi", "Ferrari", "Esposito", "Bianchi", "Romano", "Colombo", "Ricci", "Barella", "Bastoni"],
  general: ["Modric", "Petrovic", "Tanaka", "Sato", "Kim", "Park", "Al-Dawsari", "Diallo", "Mane", "Koulibaly"],
};

function getRegionFromFifa(fifaCode) {
  const code = (fifaCode || "").toUpperCase();
  if (["ARG", "BRA", "URU", "COL", "CHI", "ESP", "MEX", "POR", "PER", "ECU"].includes(code)) return "latin";
  if (["ENG", "SCO", "WAL", "NIR", "USA", "AUS", "CAN", "NZL"].includes(code)) return "anglo";
  if (["GER", "AUT", "SUI", "NED", "DEN", "SWE", "NOR"].includes(code)) return "germanic";
  if (["FRA", "BEL", "SEN", "CIV", "CMR"].includes(code)) return "french";
  if (["ITA"].includes(code)) return "italian";
  return "general";
}

export function generateSquadContext(
  rng,
  team,
  countryFifa,
  playerPosition,
  playerOvr,
) {
  let curRng = rng;
  const region = getRegionFromFifa(countryFifa);
  const firsts = FIRST_NAMES_BY_REGION[region] || FIRST_NAMES_BY_REGION.general;
  const lasts = LAST_NAMES_BY_REGION[region] || LAST_NAMES_BY_REGION.general;

  const benchmarkOvr = 52 + team.international_reputation * 7;

  const makePlayer = (pos, ovrOffset, role) => {
    const f = pickRandom(curRng, firsts);
    curRng = f.rng;
    const l = pickRandom(curRng, lasts);
    curRng = l.rng;
    const ovr = Math.max(45, Math.min(96, Math.round(benchmarkOvr + ovrOffset)));
    return {
      id: `tm-${team.id}-${pos}-${l.item}`,
      name: `${f.item[0]}. ${l.item}`,
      position: pos,
      overall: ovr,
      role,
    };
  };

  const rivalOffset = playerOvr > benchmarkOvr ? -2 : 2;
  const positionalRival = makePlayer(playerPosition, rivalOffset, "rival");

  const starPos = playerPosition === "ST" ? "CAM" : playerPosition === "CB" ? "GK" : "ST";
  const star = makePlayer(starPos, 4, "star");

  const vetPos = playerPosition === "CM" ? "CB" : "CM";
  const veteran = makePlayer(vetPos, 1, "veteran");

  return {
    rng: curRng,
    teammates: [positionalRival, star, veteran],
    positionalRival,
  };
}
