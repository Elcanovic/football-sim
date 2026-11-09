# BRIEFING — 2026-10-07T16:58:30Z

## Mission
Extract and document exhaustive specification requirements, acceptance criteria, constraints, and edge cases for the Football Sim transformation project across R1 through R5.

## 🔒 My Identity
- Archetype: Specification Miner
- Roles: Requirements extraction, behavioral probing, edge case enumeration, feature inventory
- Working directory: /Users/elcanovic/Documents/Football Sim/.agents/teamwork/spec_miner_survey_reqs
- Original parent: 34225fa2-4900-4a1a-bad4-c01d8be1f52e
- Milestone: Survey & Specification Mining

## 🔒 Key Constraints
- Read ORIGINAL_REQUEST.md before starting work.
- Mine all specifications, acceptance criteria, constraints, and edge cases from ORIGINAL_REQUEST.md and existing codebase/schemas/tests.
- Do NOT implement anything — read-only specification miner role.
- Output handoff report to `.agents/teamwork/spec_miner_survey_reqs/handoff.md` with required tables: Features Discovered and Edge Cases.
- Maintain progress.md with regular "Last visited" timestamps.
- Communicate completion to orchestrator via send_message.

## Current Parent
- Conversation ID: 34225fa2-4900-4a1a-bad4-c01d8be1f52e
- Updated: 2026-10-07T16:58:30Z

## Task Summary
- **What to build**: Comprehensive specification and feature breakdown across R1 (Economics/Loans/Hot-Seat/Agents), R2 (Tactics/Roles/Managers/Cliques/Leadership), R3 (Congestion/Fatigue/Injuries/Medical), R4 (UI Obsidian Glassmorphism/Asset Pipeline/Retirement Museum), and R5 (PRNG Determinism/CLI Demo Performance/Bundler Integrity).
- **Success criteria**: Exhaustive, fine-grained inventory with explicit inputs, outputs, thresholds, formulas, error behaviors, and edge cases.
- **Interface contracts**: ORIGINAL_REQUEST.md, codebase types and exports in `src/`.
- **Code layout**: Analysis and handoff in `.agents/teamwork/spec_miner_survey_reqs/`.

## Key Decisions Made
- Audited current codebase: `deno task demo` runs in ~13ms for 17 seasons.
- Identified critical gaps vs ORIGINAL_REQUEST.md:
  - R1: Multi-type loans, wage splits, buy triggers, deadline turn-based hot-seat, 4 agent archetypes need full implementation.
  - R2: 5 tactical frameworks, 4 positional roles with out-of-role penalties, 3 manager archetypes with sackings/trust, dressing room cliques & 4 leadership tiers need implementation.
  - R3: Congestion fixture schedule, cumulative physical load, high-press soft tissue injury risks, 3 medical recovery pathways (Conservative, Injections, Surgery) need implementation.
  - R4: Interface needs obsidian glassmorphism (`#0B0E14`, `#161B22`, `#21262D`, `#00F2FE`, `#4FACFE`, `#F5D061`, CSS Grid, cubic-bezier, zero npm/framework). Currently loads CDN Tailwind (`https://cdn.tailwindcss.com`). 3-tier asset pipeline (CDN, inline procedural SVG crests with club colors, offline fallback) needed. Retirement Museum needs Eras scrapbook (teammates, clutch moments, fees), Silverware Sanctuary (hover stats with year, club, opponent, score), algorithmic GOAT index, and 3 post-career pathways.
  - R5: Discovered unseeded `Math.random()` in `careerEngine.ts` (social posts) and `Date.now()` in injury IDs; must be pure PRNG. Standalone bundler must bundle all modules with zero external dependencies and 100% DOM element binding integrity.

## Artifact Index
- `.agents/teamwork/spec_miner_survey_reqs/DISPATCH.md` — Original assignment
- `.agents/teamwork/spec_miner_survey_reqs/progress.md` — Liveness & status tracking
- `.agents/teamwork/spec_miner_survey_reqs/handoff.md` — Deliverable handoff report
