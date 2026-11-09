## 2026-10-07T17:49:20Z
You are M2 Explorer 1 for Milestone 2 (Deep Economic Architecture & Transfer Market Hot-Seat).
Your assigned working directory is:
/Users/elcanovic/Documents/Football Sim/.agents/teamwork/explorer_m2_1/

The project root is:
/Users/elcanovic/Documents/Football Sim

You MUST read:
1. /Users/elcanovic/Documents/Football Sim/.agents/teamwork/ORIGINAL_REQUEST.md
2. /Users/elcanovic/Documents/Football Sim/PROJECT.md
3. Existing engine code in src/engine/ (types.ts, economics.ts/.js, careerEngine.ts/.js, matchEngine.ts/.js)
before starting work. Do not skip this.

Your mission:
Design the comprehensive Loan Architecture (Features 5–14 in PROJECT.md) to be implemented in `src/engine/loansEngine.ts` and `src/engine/loansEngine.js`:
1. Loan Types:
   - full-season loan (1 year)
   - 6-month winter loan (January window, half-season ~15-19 matches)
   - multi-year developmental loan (2 years, age <= 21)
2. Financial Mechanics:
   - customizable wage splits: parent club share (0-100%) and loaning club share (0-100%), summing to 100%
3. Enforceable Clauses:
   - option-to-buy clause (pre-agreed transfer fee)
   - mandatory purchase triggers:
     * relegation survival (automatic transfer if club avoids drop; handle non-relegation leagues like MLS gracefully)
     * promotion trigger (automatic transfer if promoted)
     * appearance trigger (automatic buy if appearances >= threshold)
   - loan recall clause (parent club recall rights)
   - parent club match restriction (ineligible to play against parent club in league/cup)
4. Integration with Career State & Match Engine:
   - How does `CareerState` track active loans?
   - How does `matchEngine` / `leagueSim` enforce parent club match exclusion?
   - How does end-of-season processing evaluate triggers and execute permanent transfers or returns?
5. Provide exact TypeScript interfaces, function signatures, and implementation blueprints for both `.ts` and `.js` files.

Deliverable:
Write your comprehensive analysis to:
/Users/elcanovic/Documents/Football Sim/.agents/teamwork/explorer_m2_1/handoff.md
Maintain progress.md with "Last visited" timestamps.
Send a brief message to orchestrator when complete.
