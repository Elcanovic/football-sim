// Celebration slate: the titles the trophy overlay shows after a decision.
// Bundled into standalone.html ahead of app.js (exports are stripped by the build).

const CELEBRATION_BASE_YEAR = 2026;

export function seasonSpanLabel(seasonIndex) {
  const start = CELEBRATION_BASE_YEAR + seasonIndex;
  return `${start}/${String((start + 1) % 100).padStart(2, "0")}`;
}

export function buildCelebrationSlate(seasons, lastCelebratedIndex) {
  const entries = [];
  for (let i = lastCelebratedIndex + 1; i < seasons.length; i++) {
    const s = seasons[i];
    for (const key of s.trophies) {
      entries.push({
        seasonIndex: i,
        seasonLabel: seasonSpanLabel(i),
        age: s.age,
        key,
        kind: "trophy",
        teamId: s.teamId,
      });
    }
    for (const key of s.awards || []) {
      entries.push({
        seasonIndex: i,
        seasonLabel: seasonSpanLabel(i),
        age: s.age,
        key,
        kind: "award",
        teamId: s.teamId,
      });
    }
  }
  let tallyBefore = 0;
  for (let i = 0; i <= lastCelebratedIndex && i < seasons.length; i++) {
    tallyBefore += seasons[i].trophies.length + (seasons[i].awards || []).length;
  }
  return { entries, tallyBefore, tallyAfter: tallyBefore + entries.length };
}
