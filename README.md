# Enhanced Football Career Simulator (Hybrid Realism Engine)

An enhanced, high-realism, fast-paced football career simulator evolved from the original turn-based game engine.

**▶ Play online: https://elcanovic.github.io/football-sim/** (rebuilt and redeployed on every push to `main`)

## 🚀 Key Realism Enhancements

1. **Granular Attribute Breakdown (Beyond Single OVR)**
   - Decomposed single OVR into **6 core attributes** per position:
     - Outfield: `Pace`, `Shooting`, `Passing`, `Dribbling`, `Defending`, `Physical`.
     - Goalkeepers: `Diving`, `Handling`, `Kicking`, `Reflexes`, `Positioning`, `Physical`.
   - **Asymmetric Aging Curves**: Physical attributes (Pace, Stamina) begin declining at age 29–30 (-2 to -4/yr), while Mental & Technical attributes (Passing, Vision, Composure) remain elite or grow (+1/yr) through age 34–35. Veterans can transition to deep playmakers or clinical poachers.

2. **Full League Standings & Expected Goals (xG) Engine**
   - In **< 2ms**, simulates full double round-robin 38-game league campaigns for 20 teams using an expected goals Poisson / Bradley-Terry algorithm.
   - Generates authentic **League Tables**: Rank, Pld, W, D, L, GF, GA, GD, Pts, Champions League spots, and Relegation zones.
   - Live **Golden Boot race** comparing your player's goal tally against top league stars.

3. **Multi-Year Contracts & Economic Market**
   - Realistic multi-year contracts (1–5 seasons) with weekly wages and release clauses.
   - **Bosman Free Agency**: When contracts expire (0 years left), multiple clubs submit competitive free transfer offers with sign-on bonuses.
   - **Transfer Window Bidding**: Transfer fees calculated dynamically based on player market value, contract length remaining, and buyer club wealth.
   - Career financial tracking: Total lifetime wages earned and total transfer fees generated.

4. **Dynamic Morale, Form & Coach Trust**
   - High manager trust (80%+) earns the player starting spots even when returning from injuries.
   - Strong performances trigger "On Fire" form streaks; benching damages morale.

5. **Procedural Teammate & Rival Ecosystem**
   - Generates contextual squad figures: **Star Playmaker**, **Positional Rival** (directly competing for your starting XI spot), and **Veteran Captain**.

6. **Interactive Clutch Match Moments**
   - Expanded beyond penalty kicks to include **Stoppage-Time Free Kicks** (Curl top corner vs Low driven power vs Inswinging cross), **1-on-1 Breakaways** (Chip vs Round keeper vs Far-post finesse), and **Last-Ditch Tackles**.

7. **Multi-Trophy Celebration System**
   - When winning multiple competitions in a single season (e.g., Domestic League + Domestic Cup + UEFA Champions League), trophies are displayed **side-by-side** in a celebratory modal with:
     - 28-ray radial particle bursts.
     - Ambient golden pulse glow.
     - Staggered drop-in pop animations with realistic drop-shadows.

8. **Dedicated Individual Honors Zone & Collective Silverware Shelves**
   - Silverware is organized into two distinct showcase areas:
     - **Collective Silverware Shelf**: Club titles, domestic cups, continental cups, and international cups with multiplier badges (`×N`).
     - **Individual Honors Zone**: Dedicated showcase for the **Ballon d'Or**, **Golden Boot**, and **Golden Glove**, styled with golden ambient gradients and count badges.

9. **National Team Career & International Tournaments**
   - Senior national team call-up threshold checks based on nationality reputation tier (55–84 OVR).
   - Simulates senior caps, international goals, and assists.
   - **Continental Championships** (Euro, Copa América, AFCON, AFC Asian Cup) every 4 years (ages 17, 21, 25, 29, 33, 37).
   - **FIFA World Cup** tournaments every 4 years (ages 19, 23, 27, 31, 35, 39).
   - Dedicated National Team card in the HUD displaying active squad status, caps, goals, assists, and international trophies won.

10. **Developer "God Mode" Menu**
    - Password-protected administrative control panel accessible via the **⚡ God Menu** button in the header.
    - **Developer Credentials**:
      - **Username**: `admin`
      - **Password**: `admin`
    - **Capabilities**:
      - Instant **"Max All to 99"** or fine-grained adjustment of all 6 attributes (`PAC`, `SHO`, `PAS`, `DRI`, `DEF`, `PHY` / GK stats).
      - Player age adjustment (16–40).
      - Weekly wage and market value manipulation.
      - Contract extension (1–5 seasons).
      - Instant 100% Morale and 100% Manager Trust boosts.
      - **1-Click Club Teleportation**: Instant transfer to any of the **1,244+ clubs** across all competitions in the database.
      - **Silverware Spawner**: Instantly award World Cups, Champions Leagues, League titles, Domestic Cups, Ballon d'Ors, or Golden Boots.

11. **Azerbaijani Football Ecosystem (Misli Premyer Liqası & Milli Kubok)**
    - **Full 10-Club 2024–25 Premyer Liqa**:
      - `Qarabağ FK`, `Neftçi PFK`, `Sabah FK`, `Zirə FK`, `Sumqayıt FK`, `Turan Tovuz İK`, `Araz-Naxçıvan PFK`, `Kəpəz PFK`, `Şamaxı FK`, and `Səbail FK`.
      - Official club logos fetched directly from **Transfermarkt**.
      - Authentic primary colors, domestic and continental reputation ratings.
    - **Authentic Silverware Visuals**:
      - **Misli Premyer Liqası Trophy** (League Trophy with silver handles, map of Azerbaijan, national tricolor flag, and AFFA PL crest).
      - **Azərbaycan Kuboku / Milli Kubok AFFA** (National Cup with golden soccer ball and base).
      - Both trophies rendered with transparent alpha backgrounds in the multi-trophy celebration popup, timeline, and silverware shelves.
    - **Authentic 36-Match Campaign & UEFA Qualifications**:
      - Simulates 4 rounds of round-robin fixtures (36 games).
      - Champions League spot for 1st place, Conference/Europa League spots for 2nd–4th, relegation for 10th.

12. **Injury & Physical Conditioning System**
    - Realistic injury model with 9 authentic injury types categorized into **Minor**, **Moderate**, and **Severe**:
      - Minor (2–4 games): Ankle Sprain, Groin Strain, Dead Leg Contusion.
      - Moderate (8–11 games): Hamstring Tear, Fractured Metatarsal, MCL Knee Sprain.
      - Severe (15–24 games): Torn Meniscus, ACL Ligament Rupture (-2 Pace), Achilles Tendonitis (-1 Pace).
    - Deducts seasonal appearances, impacts match sharpness, and damages seasonal morale.
    - Real-time **HUD Health & Fitness Badge**: Displays `🟢 100% Fit` or `🔴 Injured: [Name] (Xg)` with live medical alert notifications.

13. **Lifestyle Choices & Trade-off System**
    - 7 distinct personal lifestyle investments and habits accessible via the **🥗 Lifestyle** header button:
      - **Private Chef & Nutritionist**: +3 Stamina, -30% Injury Risk, +5% Morale (€2.5k/wk).
      - **Cryo Pod & Hyperbaric Physio**: -45% Injury Risk, slows physical aging at 30+ (€4k/wk).
      - **Olympic Sprint Coach**: +2 Pace, +2 Dribbling (€3.5k/wk).
      - **VIP Nightlife & Celebrity Parties**: +80% Viral Follower Surge, but -10 Coach Trust, +25% Injury Risk (€3k/wk).
      - **Twitch Streaming & Esports Team**: +50% TikTok/X Follower Growth, +€100k/yr sponsor deals, -3 Coach Trust.
      - **Youth Charity & Community Foundation**: +15 Coach Trust, +15 Morale, +40% Instagram Surge (€2k/wk).
      - **Luxury Real Estate & Fashion Brand**: +€250k annual dividend payouts, +20% fame.
    - Live financial & risk overview: displays total weekly overhead, annual dividend payouts, and net injury risk modifier.

14. **Player Social Media & Creator Economy Hub**
    - Dedicated social media strip for **Instagram**, **TikTok**, and **X (Twitter)**:
      - **Optional Sign-Up**: Start as an offline athlete or click "+ Sign Up" to launch custom profiles (`@lastname.10`, `@lastname_official`, `@lastname_football`).
      - **Authentic Follower Growth**: Scales organically with goalscoring streaks, trophy triumphs, Ballon d'Or honors, and lifestyle multipliers.
      - **Official Verification**: Crossing **100,000 followers** unlocks verified badges (`✓`).
      - **Interactive Posting**: Share updates (`📸 Post`, `🎵 Clip`, `𝕏 Tweet`) with real-time viral engagement rolls and toast feedback.

15. **End-of-Career Museum & Progression Gallery**
    - Replaces generic summary screen with a multi-tab interactive career museum:
      - **Tab 1: 📖 Club Eras Scrapbook**: Chronological visual cards grouping consecutive seasons per club with era titles ("Breakthrough", "Prime Dynasty", "Veteran Farewell"), crests, match stats, goals, and silverware won per chapter.
      - **Tab 2: 🏆 Silverware Cabinet**: Categorized showcase for International (World Cup, Euros/Copa), Club (UCL, League, Cups), and Individual awards (Ballon d'Or, Golden Boot, Golden Glove) with counts and gold glow.
      - **Tab 3: 📱 Creator & Social Legacy**: Silver (100k), Gold (1M), Diamond (10M), and Red Diamond (50M+) creator plaques, lifetime brand deal valuations, and lifestyle portfolio summary.
      - **Tab 4: 🎴 Ultimate Prime Icon Card**: EA FC-style Prime Icon card displaying peak overall, nationality flag, peak granular attributes (`PAC`, `SHO`, `PAS`, `DRI`, `DEF`, `PHY`), and mini-crests of all clubs represented.

16. **Enhanced Transitions & Polish**
    - Smooth CSS bezier curves, `@keyframes fadeInSlideUp`, gold shimmers, and interactive hover-lift effects.

---

## 📂 Project Architecture

```
Football Sim/
├── standalone.html          # 🌟 Self-contained, zero-dependency browser game (Open in any browser!)
├── deno.json                # Project configuration & tasks
├── career_summary.txt       # Sample 22-season career output simulation log
├── src/
│   ├── data/                # Full authentic database (211 countries, 73 competitions, trophies)
│   │   ├── countries.json
│   │   ├── competitions.json
│   │   ├── confederations.json
│   │   ├── domesticCups.json
│   │   ├── globalTrophies.json
│   │   └── index.js
│   ├── engine/              # Pure JS/TS simulation engine modules
│   │   ├── types.ts         # Complete TypeScript definitions
│   │   ├── prng.js          # Seeded deterministic PRNG (reproducible careers)
│   │   ├── attributes.js    # Granular stats, position weights, asymmetric aging
│   │   ├── economics.js     # Market values, wages, contracts, transfer fees
│   │   ├── leagueSim.js     # Fast Poisson 38-game league standings & top scorers
│   │   ├── cupSim.js        # Domestic cups, Champions League, World Cup knockout brackets
│   │   ├── matchEngine.js   # Match appearances, xG, xA, goals, ratings
│   │   ├── rosterGen.js     # Procedural teammates & positional rivals
│   │   ├── careerEvents.js  # Dilemmas & clutch match choices
│   │   └── careerEngine.js  # Master career state machine
│   ├── web/                 # Interactive Web UI
│   │   ├── index.template.html  # Markup + styles (bundled into standalone.html)
│   │   ├── app.js           # UI entry: wires the view modules
│   │   ├── celebration.js   # Celebration slate (titles to show after a decision)
│   │   └── ui/              # One ES module per view, plus store, engine bridge and God Menu tools
│   ├── demo.ts              # Automated CLI simulation test
│   └── server.ts            # Local web server (optional)
└── scripts/
    └── build_standalone.js  # Generator for standalone.html
```

---

## 🎮 How to Play & Test

### Option A: Play in Your Browser Instantly (Recommended)
Simply double-click or open **`standalone.html`** in Safari, Chrome, Edge, or Firefox.
* Works **100% offline**, zero dependencies, zero installation required.
* Create your player, choose a league, and simulate seasons with instant zero-latency feedback.

### Option B: Run the CLI Simulation Demo
```bash
deno task demo
```
* Simulates an entire 22-year career in **~12 milliseconds**.
* Prints season-by-season attributes, league standings, Golden Boot race, trophies, and career earnings to `career_summary.txt`.

### Option C: Run Local Web Server
```bash
deno task serve
```
* Serves the application at `http://localhost:8000`.
