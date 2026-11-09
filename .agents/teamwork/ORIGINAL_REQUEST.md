# Original User Request

## Initial Request — 2026-10-07T16:47:41Z

Transform the football simulation into an industry-grade, ultra-realistic Football Career Simulator featuring deep economic negotiations, tactical systems, dressing room dynamics, physical load modeling, and an immersive minimalist UI/UX with an interactive retirement museum.

Working directory: `/Users/elcanovic/Documents/Football Sim`
Integrity mode: demo

## Requirements

### R1. Deep Economic Architecture & Transfer Market Hot-Seat
- Implement multi-type loan structures (full-season, 6-month winter, multi-year developmental) with customizable wage splits (0–100%) and enforceable clauses (option-to-buy, mandatory triggers on survival/promotion/appearances, recall clauses, parent club match restrictions).
- Build a turn-based deadline-day contract negotiation hot-seat featuring real-time dynamic meters: Club Patience / Walkout Risk, Agent Leverage, and Manager Urgency.
- Support comprehensive contract perks: base weekly wage, appearance fees, goal/clean-sheet bonuses, release clauses (domestic, continental, relegation), and squad status guarantees (Crucial, Important, Rotation, Prospect).
- Expand agent representation across 4 behavioral archetypes: The Super-Agent (max wage, high fee cut), The Family Relative (low commission, high loyalty), The Tactical Mentor (prioritizes development and playing time), and Self-Represented (zero commission, high bargaining difficulty).

### R2. Tactical Systems, Manager DNA & Dressing Room Hierarchy
- Apply tactical frameworks to match simulation (Gegenpress, Tiki-Taka, Low Block Counter, Fluid Direct, Catenaccio) with positional tactical roles (Inverted Winger, Box-to-Box, Regista, Sweeper Keeper) and chemistry/performance penalties for playing out of role.
- Implement procedural manager personalities (Youth Developer, Win-Now Tyrant, Pragmatic Disciplinarian) capable of mid-season sackings, appointments, and squad re-evaluations.
- Simulate locker room social cliques (language/nationality factions, youth vs. veterans, wage disparity tension) and progressive player leadership tiers (Squad Player -> Core Member -> Vice-Captain -> Club Captain).

### R3. Cumulative Fatigue, Congestion & Longevity Medicine
- Model fixture congestion and cumulative physical load (midweek European travel, cup replays, international tournaments) driving non-contact soft tissue injury risks (hamstring, groin, ACL) under high-pressing tactics.
- Implement actionable medical recovery pathways with lasting consequences:
  - Conservative Rehabilitation (long recovery, zero attribute loss, low reinjury risk).
  - Aggressive Cortisone Injections (play through finals, severe risk of chronic breakdown and permanent pace/stamina degradation).
  - Specialist Surgery Abroad (high financial cost, balanced recovery, optimal restoration).

### R4. Minimalist UI/UX, Dynamic Asset Loader & Post-Career Retirement Suite
- Redesign the interface with an obsidian glassmorphism visual language: dark-mode obsidian base (`#0B0E14`), elevated cards (`#161B22`), border highlights (`#21262D`), neon match accents (`#00F2FE`, `#4FACFE`, gold `#F5D061`), custom CSS variables, CSS Grid layouts, and smooth cubic-bezier micro-interactions without external runtime frameworks/npm dependencies.
- Implement a 3-tier resilient asset pipeline: Tier 1 dynamic CDN marks, Tier 2 procedural inline SVG shields/crests rendered in official club colors, Tier 3 zero-latency offline fallback.
- Build an interactive Post-Career Retirement Suite & Legacy Museum:
  - Multi-chapter "Eras" Scrapbook with procedurally generated narrative titles, teammates, clutch moments, and fees.
  - Silverware Sanctuary with grouped trophy cases, hover stats (year, club, opponent, score), and algorithmic GOAT Legacy Index.
  - Post-playing career pathways (Head Coach / Manager, Pundit / Media Broadcaster, Club Ambassador / Technical Director).

### R5. Deterministic Engine, CLI Performance & Standalone Bundler
- Guarantee PRNG deterministic reproducibility across all new systems under fixed seeds.
- Preserve headless CLI execution: `deno task demo` must simulate a 20+ season career in under 25 milliseconds without runtime warnings or unhandled exceptions.
- Update `scripts/build_standalone.js` so that `standalone.html` bundles all modules, SVG generators, and state logic into a completely self-contained offline application with zero external runtime dependencies.

## Acceptance Criteria

### Engine & Economics
- [ ] Multi-type loan deals simulate with accurate wage splits and buy triggers that execute automatically when conditions are met.
- [ ] Interactive deadline-day contract table handles turn-based counter-offers, dynamically modifying club patience and walking away if pushed past threshold.
- [ ] 4 agent archetypes enforce distinct negotiation behaviors, commission cuts, and contract perk priorities.

### Tactics, Chemistry & Health
- [ ] Tactical systems and player role familiarities produce measurable rating, goal, and match outcome deltas.
- [ ] Manager appointments and sackings occur dynamically based on board expectations and alter player trust accordingly.
- [ ] Midweek congestion builds fatigue; playing through high exhaustion spikes soft-tissue injury probabilities.
- [ ] All 3 medical recovery choices produce their documented attribute and downtime effects.

### UI, Assets & Retirement Suite
- [ ] Standalone UI renders dark-mode obsidian glassmorphism with custom CSS variables, CSS Grid, and cubic-bezier transitions with zero npm/runtime framework dependencies.
- [ ] Missing CDN images gracefully render vector SVG crests with club colors and typography initials without broken image placeholders.
- [ ] Retirement screen unlocks the multi-chapter Eras scrapbook, interactive Silverware Sanctuary, GOAT index comparison, and post-career pathway selection.

### Performance & Build Verification
- [ ] `deno task demo` runs a 20-season career in < 25ms.
- [ ] `deno run --allow-read --allow-write scripts/build_standalone.js` successfully compiles `standalone.html`.
- [ ] `standalone.html` parses and executes cleanly with 0 syntax errors and 100% DOM element binding integrity.

## Verification Resources
- `deno task demo` (CLI headless multi-decade benchmark test)
- `deno run --allow-read --allow-write scripts/build_standalone.js` (Standalone offline bundler)
- Syntax and DOM ID verification script (`scripts/` / scratch automated validators)

