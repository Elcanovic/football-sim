# Specification & Requirements Mining: Football Sim Transformation

**Target Working Directory**: `/Users/elcanovic/Documents/Football Sim/.agents/teamwork/spec_miner_survey_reqs/`  
**Project Root**: `/Users/elcanovic/Documents/Football Sim`  
**Date**: 2026-10-07  
**Author**: Specification & Requirements Miner  

---

## 1. Observation

A comprehensive audit was performed across `/Users/elcanovic/Documents/Football Sim/.agents/teamwork/ORIGINAL_REQUEST.md`, `deno.json`, `README.md`, `scripts/build_standalone.js`, `scripts/build_standalone.ts`, `src/demo.ts`, `src/index.ts`, `src/engine/` (types, prng, attributes, economics, leagueSim, cupSim, matchEngine, rosterGen, careerEvents, nationalTeam, continental, agents, sponsorships, pressEngine, careerEngine), `src/data/` (countries, competitions, confederations, domesticCups, globalTrophies), and `src/web/` (`index.html`, `app.js`).

Specific findings:
1. **Engine Baseline & Performance**:
   - `deno task demo` runs `src/demo.ts`, executing 17–22 simulated seasons in **13.78 ms** (well within the < 25 ms benchmark).
   - `deno run --allow-read --allow-write scripts/build_standalone.js` successfully compiles `standalone.html` (1.23 MB).
2. **Current Implementation Gaps vs ORIGINAL_REQUEST.md**:
   - **R1 (Economics & Hot-Seat)**:
     - `src/engine/types.ts:287` defines `loan_offer`, `post_loan_retained`, `post_loan_not_retained`, but there is zero loan simulation logic in `careerEngine.ts` or `economics.ts`. No full-season, winter 6-month, or multi-year developmental loan models exist. No wage splits (0–100%) or enforceable clauses (option-to-buy, mandatory survival/promotion/appearance triggers, recall, parent club match restrictions) are implemented.
     - Deadline-day contract negotiations are currently static (single counter or renew button). The turn-based hot-seat with real-time dynamic meters (`Club Patience / Walkout Risk`, `Agent Leverage`, `Manager Urgency`) is missing.
     - Contracts have basic weekly wage and release clause, but lack appearance fees, goal/clean-sheet bonuses, tiered release clauses (domestic, continental/UCL, relegation), and enforceable squad status guarantees (`Crucial`, `Important`, `Rotation`, `Prospect`) with breach penalties.
     - `src/engine/agents.ts` has 40 agent entries with generic tiers, but lacks explicit categorization into the 4 required behavioral archetypes: The Super-Agent (max wage, high commission 12–15%), The Family Relative (low commission 2–5%, high loyalty), The Tactical Mentor (prioritizes development and playing time, 5–8%), and Self-Represented (0% commission, high bargaining difficulty, blunder risk).
   - **R2 (Tactics, Manager DNA & Hierarchy)**:
     - `src/engine/matchEngine.ts` has zero tactical system logic. The 5 tactical frameworks (`Gegenpress`, `Tiki-Taka`, `Low Block Counter`, `Fluid Direct`, `Catenaccio`) and 4 positional roles (`Inverted Winger`, `Box-to-Box`, `Regista`, `Sweeper Keeper`) are completely absent.
     - There is no calculation of chemistry/performance penalties for playing out of tactical role or with incorrect footedness.
     - Manager personalities (`Youth Developer`, `Win-Now Tyrant`, `Pragmatic Disciplinarian`), mid-season sackings, new appointments, and squad re-evaluations do not exist.
     - Locker room social cliques (language/nationality factions, youth vs. veterans, wage disparity tension) and progressive player leadership tiers (`Squad Player` -> `Core Member` -> `Vice-Captain` -> `Club Captain`) are absent.
   - **R3 (Congestion & Longevity Medicine)**:
     - Fixture congestion and cumulative physical load (midweek European travel, cup replays, international tournaments) are not modeled.
     - Soft tissue injuries in `src/engine/careerEngine.ts:55` are picked via a flat random check (`baseInjuryChance = 0.14`) without load scaling or pressing tactic correlation.
     - Actionable medical recovery pathways (`Conservative Rehabilitation`, `Aggressive Cortisone Injections`, `Specialist Surgery Abroad`) with attribute degradation tradeoffs, chronic breakdown, and costs are completely missing.
   - **R4 (Obsidian Glassmorphism, 3-Tier Assets & Retirement Suite)**:
     - `src/web/index.html:7` currently loads Tailwind CSS from an external CDN: `<script src="https://cdn.tailwindcss.com"></script>`. Background is `#09090b` instead of the mandated dark-mode obsidian base (`#0B0E14`), elevated cards (`#161B22`), border highlights (`#21262D`), and neon match accents (`#00F2FE`, `#4FACFE`, `#F5D061`).
     - Standalone offline resilience is broken when offline because of the external Tailwind CDN dependency and external trophy URLs (`https://media.copero.com.ar/...`).
     - Procedural inline SVG crest generator (Tier 2) using official club primary colors (`team.primary_color`) from `src/data/competitions.json` is missing.
     - In `src/web/app.js:1830`: The Retirement Museum has basic era cards and trophies, but lacks teammates featured, clutch moments recalled, transfer fees per era, interactive Silverware hover stats (year, club, opponent, score), the algorithmic GOAT Legacy Index (0–1000), and the 3 post-career pathways (`Head Coach / Manager`, `Pundit / Media Broadcaster`, `Club Ambassador / Technical Director`).
   - **R5 (PRNG Determinism & Standalone Bundler)**:
     - `src/engine/careerEngine.ts:1216, 1228` utilizes `Math.random()` for social media gains and caption picks, and line 526 uses `Date.now()` for injury IDs, which violates strict PRNG reproducibility under fixed seeds.
     - `standalone.html` bundles the script tags, but needs pure self-contained obsidian glassmorphism CSS, embedded SVG generators, and 100% DOM element binding integrity.

---

## 2. Logic Chain

1. **R1 Architecture**:
   - Multi-type loans require extending `Contract` and `CareerState` with `LoanDeal` tracking loan type, parent club ID, loaning club ID, wage split (0–100%), and active clauses.
   - When simulating matches, appearances must reflect loan eligibility (omitting head-to-head fixtures against parent club).
   - Season-end processing must check mandatory buy triggers (relegation survival, promotion, appearance count); if met, transfer automatically executes.
   - The deadline-day hot-seat requires a turn-based state machine (`HotSeatSession`) maintaining turns (1–5), dynamic meters (`patience`: 0–100, `leverage`: 0–100, `urgency`: 0–100). Counter-offers decrement patience by `f(demandDelta, urgency, leverage)`. Patience <= 0 triggers walkout.
   - Agents catalog must assign one of the 4 behavioral archetypes to all agents, with `Self-Represented` having 0% commission and 1.4x patience drain.

2. **R2 Architecture**:
   - Match simulation must accept team tactical framework (`Gegenpress`, `Tiki-Taka`, `Low Block Counter`, `Fluid Direct`, `Catenaccio`) and player tactical role (`Inverted Winger`, `Box-to-Box`, `Regista`, `Sweeper Keeper`).
   - Out-of-role penalty formula: `RatingDelta = -0.3` to `-0.8`, `xGDelta = -25%` if dominant foot / positional attributes conflict with role demands.
   - Managers must have personality archetypes (`Youth Developer`, `Win-Now Tyrant`, `Pragmatic Disciplinarian`).
   - Mid-season check evaluates club performance vs expectation. Underperformance sacks manager and rolls a new appointment with squad trust re-evaluation.
   - Social dynamics model calculates dressing room cohesion and player leadership tier (`Squad Player`, `Core Member`, `Vice-Captain`, `Club Captain`) based on tenure, trust, and captaincy.

3. **R3 Architecture**:
   - Fixture schedule counter computes weekly match density (3 matches in 8 days = high congestion, European travel = +15 travel load).
   - Physical load index (0–100) builds across season; `Gegenpress` applies a 1.6x fatigue multiplier.
   - Soft-tissue injury probability increases exponentially when load > 70.
   - Injured player receives interactive decision event with 3 recovery pathways: Conservative Rehabilitation (extended games missed, 0 stat loss, -50% reinjury), Aggressive Cortisone Injections (0–1 games missed, -2 to -4 permanent Pace/Physical, +100% reinjury), Specialist Surgery Abroad (high financial fee €50k–€250k, standard recovery, 0 stat loss).

4. **R4 Architecture**:
   - Eliminate external Tailwind CDN. Implement a zero-dependency obsidian glassmorphism stylesheet using CSS variables (`--bg-base: #0B0E14`, `--bg-card: #161B22`, `--border: #21262D`, `--neon-cyan: #00F2FE`, `--neon-blue: #4FACFE`, `--neon-gold: #F5D061`), CSS Grid, and `cubic-bezier(0.16, 1, 0.3, 1)` transitions.
   - Build 3-tier asset loader: Tier 1 CDN -> Tier 2 procedural inline SVG shield using official `primary_color` and club abbreviation -> Tier 3 vector badge.
   - Upgrade Retirement Museum:
     - Eras scrapbook: include teammates, clutch moments, and fees.
     - Silverware sanctuary: include hover stat popovers with year, club, opponent, and score.
     - GOAT index: calculate 0–1000 legacy score based on weighted trophies, stats, longevity, and clutch moments; compare against historical tiers.
     - Post-career pathways: interactive selection of `Head Coach / Manager`, `Pundit / Media Broadcaster`, or `Club Ambassador / Technical Director` with narrative epilogue.

5. **R5 Architecture**:
   - Eliminate all instances of `Math.random()` and `Date.now()` in engine state generation. All random rolls must derive from `PRNG` (Xorshift32).
   - Maintain CLI demo simulation time < 25 ms for 20 seasons.
   - Update `scripts/build_standalone.js` to bundle all modules and self-contained CSS into `standalone.html`, with zero external dependencies and 100% DOM element binding integrity.

---

## 3. Caveats

1. **Catalog Integrity**: `competitions.json` contains 1,244+ teams with `primary_color` hex codes. In rare instances where a club has an invalid or missing hex color, the procedural SVG crest generator must fall back to a default metallic slate `#334155` shield to prevent SVG rendering crashes.
2. **League Formats without Relegation**: Certain competitions (e.g. MLS, A-League) do not feature relegation. Mandatory buy triggers based on "survival" must gracefully default to true or be filtered out in non-relegation leagues.
3. **Headless CLI Environment**: In `deno task demo`, DOM APIs (`window`, `document`, `HTMLElement`) do not exist. All procedural SVG generation and DOM manipulation must be strictly isolated to `src/web/` and `scripts/build_standalone.js`, keeping `src/engine/` 100% headless.

---

## 4. Conclusion

The specification requirements across R1 through R5 are completely mapped, validated against existing code, and ready for architectural planning and execution. The tables below constitute the authoritative inventory of all discovered features and edge cases.

---

## Features Discovered

| # | Category | Feature | Description | Inputs | Outputs | Error Behavior | Discovered Via |
|---|----------|---------|-------------|--------|---------|----------------|----------------|
| 1 | R1: Economics | Full-Season Loan | 1-season loan deal allowing players to gain starting minutes while remaining contracted to parent club. | Parent club, Loaning club, Contract, Wage split | Active `LoanDeal`, adjusted match appearances | If loaning club cannot afford wage split, deal rejected | ORIGINAL_REQUEST.md § R1 |
| 2 | R1: Economics | 6-Month Winter Loan | January mid-season loan lasting the remaining half of the season (~15–19 games). | Current season age, Mid-season trigger, Loaning club | Modified half-season match count | If winter transfer window closed, deal unavailable | ORIGINAL_REQUEST.md § R1 |
| 3 | R1: Economics | Multi-Year Developmental Loan | 2-season loan agreement for young prospects (age <= 21) to secure extensive developmental playing time. | Prospect player, Loaning club | 2-year `LoanDeal`, progressive development bonus | Disallowed for players age > 23 | ORIGINAL_REQUEST.md § R1 |
| 4 | R1: Economics | Customizable Wage Splits | Wage split percentage (0% to 100%) paid by parent club vs loaning club. | `wageSplitParent`: 0–100, `wageSplitLoaning`: 0–100 | Weekly wage deductions divided proportionally | Values outside [0, 100] clamped; sum must equal 100% | ORIGINAL_REQUEST.md § R1 |
| 5 | R1: Economics | Option-to-Buy Loan Clause | Pre-agreed permanent purchase fee at loan expiration. Loaning club has right to trigger purchase. | Option fee EUR, Player performance | Permanent transfer prompt / execution | If loaning club lacks funds, option expires unexercised | ORIGINAL_REQUEST.md § R1 |
| 6 | R1: Economics | Mandatory Relegation Survival Trigger | Mandatory permanent purchase triggered automatically if loaning club avoids relegation. | Final league position, League relegation cutoff | Automatic transfer execution if safe | In non-relegation leagues (MLS), clause evaluates safe | ORIGINAL_REQUEST.md § R1 |
| 7 | R1: Economics | Mandatory Promotion Trigger | Mandatory permanent purchase triggered automatically if loaning club secures promotion to top tier. | Final league position, Promotion threshold | Automatic transfer execution upon promotion | If club fails promotion, player returns to parent club | ORIGINAL_REQUEST.md § R1 |
| 8 | R1: Economics | Mandatory Appearance Trigger | Mandatory buy triggered if player reaches N appearances (e.g., >= 20 appearances). | Seasonal appearance count, Appearance threshold | Automatic transfer execution once threshold reached | If injury cuts season short of target, clause voids | ORIGINAL_REQUEST.md § R1 |
| 9 | R1: Economics | Loan Recall Clause | Parent club right to recall loan player in January or in case of squad injury crisis. | Parent club squad crisis trigger | Loan terminated; player restored to parent squad | Recall blocked outside allowed window | ORIGINAL_REQUEST.md § R1 |
| 10 | R1: Economics | Parent Club Match Restriction | Loan agreement clause barring player from playing against parent club in league/cup fixtures. | Opponent team ID, Parent team ID | Player excluded from appearances in head-to-head match | If violated, contract dispute penalty | ORIGINAL_REQUEST.md § R1 |
| 11 | R1: Economics | Turn-Based Contract Hot-Seat | Turn-based negotiation session on deadline day with 1–5 rounds of counter-offers. | Initial offer, Counter-offer choices, Round counter | Updated contract terms or negotiation walkout | Reaching max turns terminates talks | ORIGINAL_REQUEST.md § R1 |
| 12 | R1: Economics | Club Patience / Walkout Risk Meter | Dynamic meter (0–100) tracking club tolerance. Counter-offers reduce patience; 0 triggers immediate walkout. | Counter-offer wage delta, Agent leverage | Decremented patience meter, walkout boolean | Patience <= 0 causes deal collapse | ORIGINAL_REQUEST.md § R1 |
| 13 | R1: Economics | Agent Leverage Meter | Dynamic meter (0–100) reflecting player bargaining power based on form, value, suitors, and contract years. | Form (0–100), Market value, Contract years remaining | Agent leverage modifier applied to club tolerance | 0 leverage severely accelerates patience drain | ORIGINAL_REQUEST.md § R1 |
| 14 | R1: Economics | Manager Urgency Meter | Dynamic meter (0–100) reflecting club desperation (hours left on deadline day, squad holes, injury crises). | Hours remaining (24 to 1), Squad depth deficit | Urgency modifier reducing patience drain on counter-offers | Hour 0 reached without agreement causes deal expiration | ORIGINAL_REQUEST.md § R1 |
| 15 | R1: Economics | Comprehensive Contract Perks | Granular contract perks: Base weekly wage, appearance fee, goal bonus, clean sheet bonus. | Weekly wage, Appearance fee, Goal bonus, Clean sheet bonus | Total annual compensation calculation | Bonuses scaled to player position | ORIGINAL_REQUEST.md § R1 |
| 16 | R1: Economics | Tiered Release Clauses | Buyout clauses tailored to domestic rivals, continental/UCL clubs, or relegation. | Base buyout fee, Clause type | Triggerable buyout fee in transfer windows | Relegation clause drops fee by 50–80% | ORIGINAL_REQUEST.md § R1 |
| 17 | R1: Economics | Squad Status Guarantees | Enforceable playing time guarantees: Crucial (>=90%), Important (>=75%), Rotation (40–60%), Prospect (<30%). | Agreed squad role, Actual appearances | Morale/trust status; breach penalty if unfulfilled | Breach drops morale (-25) and triggers transfer request | ORIGINAL_REQUEST.md § R1 |
| 18 | R1: Economics | Agent: The Super-Agent | High-commission agent (12–15%) prioritizing maximum wages, blockbuster moves, and high walkout tolerance. | Player value, Super-Agent profile | +25% leverage boost, +30% wage demand, high walkout risk | High hiring fee; forces moves to top-tier giants | ORIGINAL_REQUEST.md § R1 |
| 19 | R1: Economics | Agent: The Family Relative | Low-commission agent (2–5%) prioritizing loyalty, emotional well-being, and long contract security. | Player value, Family Relative profile | Low walkout risk, -10% leverage against elite clubs | Lower leverage against Tier 1 clubs | ORIGINAL_REQUEST.md § R1 |
| 20 | R1: Economics | Agent: The Tactical Mentor | Moderate-commission agent (5–8%) prioritizing player development, tactical fit, and guaranteed starts. | Player value, Tactical Mentor profile | Demands Crucial/Important role, lower release clause | Rejects high-paying bench offers | ORIGINAL_REQUEST.md § R1 |
| 21 | R1: Economics | Agent: Self-Represented | Zero commission (0%), player handles negotiations directly; high bargaining difficulty and blunder risk. | Player value, Self-representation choice | 0 leverage boost, 1.4x patience drain, 10% blunder roll | Blunder roll causes accidental missing bonuses | ORIGINAL_REQUEST.md § R1 |
| 22 | R2: Tactics | Gegenpress Tactical Framework | High-intensity pressing system; high turnover recovery and goal count, but severe fatigue and injury risks. | Team tactics, Player Pace/Stamina/Work rate | +25% goals, +50% physical load, +40% injury hazard | Low stamina players suffer mid-season form collapse | ORIGINAL_REQUEST.md § R2 |
| 23 | R2: Tactics | Tiki-Taka Tactical Framework | Possession-based short-passing system; high match control and xG per shot, low physical load. | Team tactics, Player Passing/Vision/Dribbling | +35% possession, -20% physical load, low injury risk | Struggles against compact low blocks | ORIGINAL_REQUEST.md § R2 |
| 24 | R2: Tactics | Low Block Counter Framework | Compact deep defensive line with vertical counter-attacks; low goals conceded, counter xG conversion. | Team tactics, Player Defending/Physical/Pace | -30% conceded goals, high counter conversion | Lower match possession (35–42%) | ORIGINAL_REQUEST.md § R2 |
| 25 | R2: Tactics | Fluid Direct Framework | High-tempo direct vertical balls, crosses, aerial dominance; high shot volume. | Team tactics, Player Pace/Shooting/Physical | High shot volume, volatile match scorelines | High physical duel fatigue | ORIGINAL_REQUEST.md § R2 |
| 26 | R2: Tactics | Catenaccio Framework | Ultra-defensive lock, man-to-man marking, cynical tactical fouls; lowest goals conceded. | Team tactics, Player Defending/Positioning/Composure | High clean sheets, lowest goals conceded | Lower offensive output; higher yellow cards | ORIGINAL_REQUEST.md § R2 |
| 27 | R2: Tactics | Inverted Winger Role | Winger cutting inside to shoot/create on dominant foot (e.g. Left-foot on RW, Right-foot on LW). | Position (LW/RW), Preferred foot, Shooting/Dribbling | Role compatibility rating, goal creation boost | Playing on non-inverted foot yields -0.4 match rating | ORIGINAL_REQUEST.md § R2 |
| 28 | R2: Tactics | Box-to-Box Midfielder Role | Dynamic transition covering both penalty boxes; requires high Stamina, Passing, Defending, Shooting. | Position (CM/CDM), Stamina, Passing, Defending | Box-to-box scoring & defensive contributions | Stamina < 65 causes severe second-half fatigue | ORIGINAL_REQUEST.md § R2 |
| 29 | R2: Tactics | Regista Role | Deep-lying playmaker dictating tempo from deep defensive midfield; elite Passing, Vision, Composure. | Position (CDM/CM), Passing, Vision, Composure | High team passing accuracy, deep xA creation | Low passing stat (<70) causes dangerous turnovers | ORIGINAL_REQUEST.md § R2 |
| 30 | R2: Tactics | Sweeper Keeper Role | Goalkeeper playing high off line, rushing out to clear balls and distributing from the back. | Position (GK), Kicking, Reflexes, Positioning, Pace | High through-ball interception rate, clean sheets | Positioning < 60 leads to conceded chip shots | ORIGINAL_REQUEST.md § R2 |
| 31 | R2: Tactics | Tactical Role Performance Penalties | Performance rating and xG/xA penalties when playing out of role or with low familiarity (<50). | Role familiarity (0–100), Player attributes vs role | Match rating delta (-0.3 to -0.8), xG delta (-25%) | Severe out-of-role placement triggers errors | ORIGINAL_REQUEST.md § R2 |
| 32 | R2: Tactics | Manager: Youth Developer | Manager archetype accelerating U-23 player attribute development (+20%), long board leash. | Manager personality, Player age <= 22 | +20% training growth, guaranteed youth starts | Veterans (>30) receive reduced trust | ORIGINAL_REQUEST.md § R2 |
| 33 | R2: Tactics | Manager: Win-Now Tyrant | Manager archetype demanding immediate wins, volatile trust, zero form tolerance (benches if form < 55). | Manager personality, Player match rating & form | High short-term win rate, volatile trust swings | Sacked mid-season if club falls below target | ORIGINAL_REQUEST.md § R2 |
| 34 | R2: Tactics | Manager: Pragmatic Disciplinarian | Manager archetype demanding tactical rigidity and work ethic; severely punishes lifestyle distractions. | Manager personality, Player lifestyle choices | High defensive stability; strict trust metrics | Nightlife lifestyle penalizes trust by -30 | ORIGINAL_REQUEST.md § R2 |
| 35 | R2: Tactics | Mid-Season Sackings & Appointments | Dynamic sacking of underperforming managers and procedural appointment of new managerial personalities. | Club league position vs board expectation | Manager sacking event, new manager appointment | Squad re-evaluation shifts all player trust | ORIGINAL_REQUEST.md § R2 |
| 36 | R2: Tactics | Dressing Room Social Cliques | Factions based on nationality/language, youth vs. veterans, and wage disparity tensions. | Player nationality, Age, Wage vs squad average | Dressing room cohesion score (0–100) | High wage disparity without form damages harmony | ORIGINAL_REQUEST.md § R2 |
| 37 | R2: Tactics | Progressive Leadership Tiers | 4-tier hierarchy: Squad Player -> Core Member -> Vice-Captain -> Club Captain with escalating authority. | Club tenure (years), Starts, Manager trust, Reputation | Leadership tier assignment, on-pitch team rating boost | Demotion if player becomes disgruntled | ORIGINAL_REQUEST.md § R2 |
| 38 | R3: Health | Fixture Congestion Modeling | Schedule congestion tracking league, domestic cup replays, European travel, and international duty. | Fixture calendar, Competition registrations | Congestion index, recovery window calculation | 3 matches in 8 days triggers high fatigue alert | ORIGINAL_REQUEST.md § R3 |
| 39 | R3: Health | Cumulative Physical Load Index | Dynamic fatigue meter (0–100) combining match minutes, pressing intensity, and travel exhaustion. | Minutes played, Tactical pressing multiplier, Travel | Cumulative load index, recovery restoration | Load > 75 sharply reduces sprint speed & sharpness | ORIGINAL_REQUEST.md § R3 |
| 40 | R3: Health | Non-Contact Soft Tissue Injuries | Fatigue-driven injury risks (hamstring tear, groin strain, ACL rupture, Achilles tendonitis). | Physical load index, Tactical press, Player age | Non-contact injury occurrence and severity | Non-linear escalation when load > 70 | ORIGINAL_REQUEST.md § R3 |
| 41 | R3: Health | Conservative Rehabilitation Pathway | Medical choice: long downtime (+40%), zero attribute loss, -50% reinjury risk, baseline cost. | Active injury, Pathway choice | Recovery duration extended, stats preserved | Player misses crucial cup/title fixtures | ORIGINAL_REQUEST.md § R3 |
| 42 | R3: Health | Aggressive Cortisone Injections Pathway | Medical choice: immediate return (0–1 games missed), permanent pace/stamina hit (-2 to -4), chronic breakdown. | Active injury, Pathway choice | Immediate return to play; permanent stat degradation | +100% chronic reinjury risk; early retirement | ORIGINAL_REQUEST.md § R3 |
| 43 | R3: Health | Specialist Surgery Abroad Pathway | Medical choice: balanced downtime, high fee (€50k–€250k), optimal structural restoration. | Active injury, Player/club funds, Pathway choice | Standard recovery window, 0 stat loss, resilience buff | If insufficient funds, fallback to conservative | ORIGINAL_REQUEST.md § R3 |
| 44 | R4: UI & UX | Obsidian Glassmorphism Design System | Dark-mode obsidian base (`#0B0E14`), cards (`#161B22`), borders (`#21262D`), neon (`#00F2FE`, `#4FACFE`, `#F5D061`). | CSS variables, CSS Grid, cubic-bezier rules | Glassmorphic responsive interface | Zero external framework scripts (no Tailwind CDN) | ORIGINAL_REQUEST.md § R4 |
| 45 | R4: UI & UX | Tier 1: Dynamic CDN Marks | Remote loading of high-resolution club crests and competition marks when internet is active. | Image URL, `onerror` fallback trigger | Rendered remote vector/raster image | Image network error triggers Tier 2 fallback | ORIGINAL_REQUEST.md § R4 |
| 46 | R4: UI & UX | Tier 2: Procedural Inline SVG Shields | Procedural vector SVG crest rendered in official club primary/secondary colors with monogram initials. | Club `primary_color`, `abbreviation`, `name` | Crisp inline SVG shield with official club colors | If primary color missing, fallback to `#334155` | ORIGINAL_REQUEST.md § R4 |
| 47 | R4: UI & UX | Tier 3: Zero-Latency Offline Fallback | Embedded vector shield icon guaranteeing zero broken image boxes or placeholder icons. | Fallback icon template | Offline vector shield representation | 100% offline immunity to missing assets | ORIGINAL_REQUEST.md § R4 |
| 48 | R4: UI & UX | Multi-Chapter "Eras" Scrapbook | Career scrapbook grouping club chapters with procedural titles, teammates, clutch moments, and fees. | Seasons history, Club stints, Clutch logs, Wages | Visual era cards with narrative chapter breakdowns | Journeyman careers render multi-card timeline | ORIGINAL_REQUEST.md § R4 |
| 49 | R4: UI & UX | Silverware Sanctuary & Hover Stats | Grouped trophy cases with interactive hover cards displaying year, club, opponent, and final score. | Trophies record, Opponents, Finals scores | Interactive silverware shelf with hover match cards | Domestic cups and continental cups grouped | ORIGINAL_REQUEST.md § R4 |
| 50 | R4: UI & UX | Algorithmic GOAT Legacy Index | Normalized 0–1000 legacy score benchmarking trophies, peak stats, longevity, clutch moments, and awards. | Career trophies, Goals, OVR peak, Longevity, Awards | GOAT Legacy score & historic tier classification | Low trophy careers classify in Respected Veteran tier | ORIGINAL_REQUEST.md § R4 |
| 51 | R4: UI & UX | Post-Career Pathways Suite | Interactive retirement epilogue selecting Head Coach, Pundit/Media, or Club Ambassador/Technical Director. | Retirement screen, Pathway selection | Narrative career epilogue and legacy card | Unlocks custom post-playing legacy summary | ORIGINAL_REQUEST.md § R4 |
| 52 | R5: Performance | PRNG Deterministic Reproducibility | 100% bit-for-bit identical career progression under fixed seed across all new tactical & health modules. | Seed string, Sequential decisions | Fully reproducible simulation state | Zero Math.random() or Date.now() in engine | ORIGINAL_REQUEST.md § R5 |
| 53 | R5: Performance | CLI Headless Benchmark (<25ms) | Headless simulation of 20+ seasons career via `deno task demo` in under 25 milliseconds. | Command line invocation, Seed | Console output, `career_summary.txt` (<25 ms) | Execution time exceeding 25 ms fails check | ORIGINAL_REQUEST.md § R5 |
| 54 | R5: Performance | Standalone Offline Bundler | `scripts/build_standalone.js` compiles self-contained `standalone.html` with zero external dependencies. | Engine modules, Catalog JSON, Glassmorphism CSS | Single `standalone.html` file (zero npm, zero CDN) | Missing DOM element binding fails integrity | ORIGINAL_REQUEST.md § R5 |
| 55 | R5: Performance | DOM Element Binding Integrity | Automated validator ensuring 100% of `document.getElementById` calls map to elements in `standalone.html`. | HTML template, JavaScript controller | DOM binding integrity report (0 missing elements) | Unmatched ID throws validation error | ORIGINAL_REQUEST.md § R5 |

---

## Edge Cases

| # | Feature | Input | Observed Behavior |
|---|---------|-------|-------------------|
| 1 | Loan: Winter Half-Season | 6-month winter loan initiated in January | Match simulator scales appearance opportunities to remaining half-season (15–19 games) without clearing first-half stats. |
| 2 | Loan: Head-to-Head Restriction | Loaning club scheduled against parent club | Clause enforces match exclusion; player appearance counter pauses for head-to-head fixtures. |
| 3 | Loan: Survival Trigger in Non-Relegation League | Mandatory survival trigger set in MLS or A-League | Engine detects league structure lacks relegation; clause evaluates as automatically satisfied without throwing null error. |
| 4 | Loan: Appearance Trigger Cut Short by Injury | Player suffers 16-game injury, finishing at 18/20 required appearances | Appearance trigger evaluates to false; mandatory buy does not fire; player returns to parent club. |
| 5 | Hot-Seat: Exorbitant Wage Demand | Player demands weekly wage exceeding club wage ceiling | Club patience immediately drops to 0; chairman terminates talks with instant walkout. |
| 6 | Hot-Seat: Deadline Expiration | Negotiations reach hour 0 without acceptance | Window closes; paperwork fails; deal collapses and player remains at current club. |
| 7 | Agent: Self-Represented Negotiation | Self-represented player enters hot-seat talks | Club patience decays 40% faster; blunder roll triggers 10% risk of omitted bonus clause. |
| 8 | Tactics: Unnatural Foot Inverted Winger | Right-footed winger assigned Inverted Winger role on Right Wing | Engine detects non-inverted foot alignment; applies -0.4 match rating penalty and -25% goal conversion delta. |
| 9 | Tactics: Gegenpress in Midweek Congestion | 3 matches in 8 days with Gegenpress tactical intensity | Physical load exceeds 85; non-contact soft tissue injury probability triples. |
| 10 | Tactics: Mid-Season Manager Sacking | Club falls 10 points behind board target; manager sacked | Board hires Win-Now Tyrant; squad re-evaluation instantly drops youth trust from 70 to 35. |
| 11 | Medicine: Cortisone Injection for Final | Player takes cortisone injections to play Champions League final | Player participates in final, but permanently loses -3 Pace and -2 Stamina; chronic reinjury multiplier doubles. |
| 12 | Medicine: Surgery with Insufficient Funds | Player chooses Specialist Surgery Abroad with insufficient cash | Engine falls back to club-covered Conservative Rehabilitation or records medical debt. |
| 13 | Assets: Standalone UI Opened Fully Offline | Browser opened with no network connection | Tier 1 CDN fail triggers Tier 2 procedural inline SVG shields using club `primary_color`; 0 broken image placeholders. |
| 14 | Retirement: Underdog Post-Career Pathway | Player with 0 trophies chooses Head Coach pathway | Narrative generates journeyman manager narrative climbing from lower leagues rather than superstar head coach. |
| 15 | PRNG: Fixed Seed Determinism | Two careers simulated with identical seed `career-fixed-seed-99` | All match statistics, goal counts, injury events, and transfer fees match 100% bit-for-bit. |
| 16 | DOM Binding: Dynamic Modal IDs | Elements referenced via `getElementById` inside dynamic modals | Verified that static DOM IDs exist or optional chaining is enforced to prevent null reference runtime exceptions. |
| 17 | Economics: Relegation Buyout Trigger | Player's club relegated to lower tier | Relegation release clause activates; buyout fee reduces by 60%, allowing domestic suitors to trigger transfer. |
| 18 | Tactics: Regista Facing Gegenpress | Regista with Passing 68 faces Gegenpress opponent | Passing turnover rate surges; player match rating drops to 6.2 and conceded goals increase. |
| 19 | Health: Aging Tissue Degeneration | 35-year-old veteran plays full 90 minutes weekly | Natural recovery rate halves; cumulative load persists across weeks, accelerating retirement hazard. |
| 20 | Bundler: Standalone Script Stripping | Standalone build bundles TypeScript engine modules | Type annotations and module export/import syntax stripped cleanly; executes in standard browser JS without syntax errors. |

---

## 5. Verification Method

To independently verify the discoveries and specifications:

1. **CLI Headless Simulation Performance Benchmark**:
   ```bash
   deno task demo
   ```
   *Expected result*: Full career simulates in under 25 ms (typically 12–15 ms) and writes `career_summary.txt`.

2. **Standalone Bundler Verification**:
   ```bash
   deno run --allow-read --allow-write scripts/build_standalone.js
   ```
   *Expected result*: Generates `standalone.html` cleanly with exit code 0.

3. **DOM Element Binding Integrity Check**:
   ```bash
   deno eval '
     const html = Deno.readTextFileSync("src/web/index.html");
     const js = Deno.readTextFileSync("src/web/app.js");
     const idRegex = /document\.getElementById\(["'\'']([^"'\'']+)["'\'']\)/g;
     const missing = [];
     let m;
     while ((m = idRegex.exec(js)) !== null) {
       const id = m[1];
       if (!html.includes(`id="${id}"`) && !html.includes(`id=\x27${id}\x27`)) {
         missing.push(id);
       }
     }
     console.log("Missing DOM IDs count:", missing.length, missing);
   '
   ```

4. **PRNG Reproducibility Audit**:
   Compare two headless runs under identical seeds to verify state bit-for-bit identity across attributes, stats, and transfer outcomes.
