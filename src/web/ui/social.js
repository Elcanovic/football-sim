// Social media bar, notification toasts and the broadcast news ticker.

import { formatSocialFollowers } from "./format.js";
import { state } from "./store.js";

const newsTickerTrack = document.getElementById("newsTickerTrack");

// Social Media Bar
const txtTotalFollowers = document.getElementById("txtTotalFollowers");
const instaHandle = document.getElementById("instaHandle");
const instaVerified = document.getElementById("instaVerified");
const instaFollowers = document.getElementById("instaFollowers");
const instaAction = document.getElementById("instaAction");
const tiktokHandle = document.getElementById("tiktokHandle");
const tiktokVerified = document.getElementById("tiktokVerified");
const tiktokFollowers = document.getElementById("tiktokFollowers");
const tiktokAction = document.getElementById("tiktokAction");
const xHandle = document.getElementById("xHandle");
const xVerified = document.getElementById("xVerified");
const xFollowers = document.getElementById("xFollowers");
const xAction = document.getElementById("xAction");

// Toast Notification
const socialToast = document.getElementById("socialToast");
const toastIcon = document.getElementById("toastIcon");
const toastTitle = document.getElementById("toastTitle");
const toastGain = document.getElementById("toastGain");
const toastMessage = document.getElementById("toastMessage");

let toastTimer = null;
export function showSocialToast(_platform, data) {
  if (!socialToast) return;
  if (toastTimer) clearTimeout(toastTimer);

  toastIcon.textContent = data.icon || "📱";
  toastTitle.textContent = data.title || "Social Alert";
  toastGain.textContent = data.gain || "";
  toastMessage.textContent = data.message || "";

  socialToast.classList.remove("hidden");
  setTimeout(() => {
    socialToast.classList.remove("translate-y-10", "opacity-0");
    socialToast.classList.add("translate-y-0", "opacity-100");
  }, 10);

  toastTimer = setTimeout(() => {
    socialToast.classList.remove("translate-y-0", "opacity-100");
    socialToast.classList.add("translate-y-10", "opacity-0");
    setTimeout(() => {
      socialToast.classList.add("hidden");
    }, 300);
  }, 3500);
}

export function renderSocialBar() {
  if (!state || !state.player) return;
  const sm = state.player.socialMedia;
  if (!sm) return;

  txtTotalFollowers.textContent = formatSocialFollowers(sm.totalFollowers || 0);

  // 1. Instagram
  const ig = sm.instagram;
  if (ig && ig.active) {
    instaHandle.textContent = ig.handle;
    instaFollowers.textContent = `${formatSocialFollowers(ig.followers)} fans`;
    if (ig.verified) instaVerified.classList.remove("hidden");
    else instaVerified.classList.add("hidden");
    instaAction.innerHTML =
      `<button type="button" class="btn-post-social text-[9px] font-black px-2 py-0.5 rounded-lg bg-pink-600 hover:bg-pink-500 text-white transition-all cursor-pointer active:scale-95 shadow-sm shadow-pink-500/30" data-platform="instagram">📸 Post</button>`;
  } else {
    instaHandle.textContent = "Instagram";
    instaFollowers.textContent = "Inactive";
    instaVerified.classList.add("hidden");
    instaAction.innerHTML =
      `<button type="button" class="btn-signup-social text-[9px] font-black px-2 py-0.5 rounded-lg bg-pink-600/40 hover:bg-pink-600 text-pink-200 border border-pink-500/40 transition-all cursor-pointer active:scale-95" data-platform="instagram">+ Sign Up</button>`;
  }

  // 2. TikTok
  const tt = sm.tiktok;
  if (tt && tt.active) {
    tiktokHandle.textContent = tt.handle;
    tiktokFollowers.textContent = `${formatSocialFollowers(tt.followers)} fans`;
    if (tt.verified) tiktokVerified.classList.remove("hidden");
    else tiktokVerified.classList.add("hidden");
    tiktokAction.innerHTML =
      `<button type="button" class="btn-post-social text-[9px] font-black px-2 py-0.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white transition-all cursor-pointer active:scale-95 shadow-sm shadow-cyan-500/30" data-platform="tiktok">🎵 Clip</button>`;
  } else {
    tiktokHandle.textContent = "TikTok";
    tiktokFollowers.textContent = "Inactive";
    tiktokVerified.classList.add("hidden");
    tiktokAction.innerHTML =
      `<button type="button" class="btn-signup-social text-[9px] font-black px-2 py-0.5 rounded-lg bg-cyan-600/40 hover:bg-cyan-600 text-cyan-200 border border-cyan-500/40 transition-all cursor-pointer active:scale-95" data-platform="tiktok">+ Sign Up</button>`;
  }

  // 3. X (Twitter)
  const x = sm.x;
  if (x && x.active) {
    xHandle.textContent = x.handle;
    xFollowers.textContent = `${formatSocialFollowers(x.followers)} fans`;
    if (x.verified) xVerified.classList.remove("hidden");
    else xVerified.classList.add("hidden");
    xAction.innerHTML =
      `<button type="button" class="btn-post-social text-[9px] font-black px-2 py-0.5 rounded-lg bg-zinc-700 hover:bg-zinc-600 text-white transition-all cursor-pointer active:scale-95 shadow-sm" data-platform="x">𝕏 Tweet</button>`;
  } else {
    xHandle.textContent = "X (Twitter)";
    xFollowers.textContent = "Inactive";
    xVerified.classList.add("hidden");
    xAction.innerHTML =
      `<button type="button" class="btn-signup-social text-[9px] font-black px-2 py-0.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-600 transition-all cursor-pointer active:scale-95" data-platform="x">+ Sign Up</button>`;
  }

  // Event handlers for signups
  document.querySelectorAll(".btn-signup-social").forEach((btn) => {
    btn.onclick = (e) => {
      e.stopPropagation();
      const platform = btn.dataset.platform;
      if (typeof activateSocialMediaAccount !== "undefined") {
        const acc = activateSocialMediaAccount(state.player, platform);
        showSocialToast(platform, {
          title: `${acc.name} Activated!`,
          gain: `+${formatSocialFollowers(acc.followers)} fans`,
          message: `Created official verified profile ${acc.handle}. Ready to build global hype!`,
          icon: acc.icon,
        });
        renderSocialBar();
      }
    };
  });

  // Event handlers for posts
  document.querySelectorAll(".btn-post-social").forEach((btn) => {
    btn.onclick = (e) => {
      e.stopPropagation();
      const platform = btn.dataset.platform;
      if (typeof postSocialMediaUpdate !== "undefined") {
        const res = postSocialMediaUpdate(state.player, platform);
        if (res.success) {
          const acc = state.player.socialMedia[platform];
          showSocialToast(platform, {
            title: `${acc.name} Viral Post!`,
            gain: `+${formatSocialFollowers(res.gain)} fans`,
            message: `"${res.caption}"`,
            icon: acc.icon,
          });
          renderSocialBar();
        }
      }
    };
  });
}

function generateNewsHeadlines(p, team, comp, lastSeason) {
  const headlines = [];
  const teamName = team ? (team.short_name || team.name) : "Free Agent Market";
  const natName = p.nationality ? p.nationality.name_en : "National Team";
  const isGk = p.position === "GK";

  // 1. Performance / Form headline
  if (isGk) {
    if (p.overall >= 88) {
      headlines.push({
        tag: "WORLD CLASS GOALKEEPER",
        text: `${p.lastName} hailed by European coaches as an insurmountable wall between the posts for ${teamName}.`,
      });
    } else if (lastSeason && lastSeason.appearances > 25) {
      headlines.push({
        tag: "CLEAN SHEET SPECIALIST",
        text: `${p.lastName} posts impressive shot-stopping figures as ${teamName}'s defensive anchor.`,
      });
    } else {
      headlines.push({
        tag: "GOALKEEPING FOCUS",
        text: `Goalkeeping staff commend ${p.lastName}'s reflex agility and commanding penalty-box presence.`,
      });
    }
  } else {
    if (lastSeason && lastSeason.goals >= 25) {
      headlines.push({
        tag: "GOLDEN BOOT FORM",
        text: `${p.lastName} sets Europe alight with a sensational ${lastSeason.goals}-goal campaign for ${teamName}.`,
      });
    } else if (lastSeason && lastSeason.assists >= 12) {
      headlines.push({
        tag: "PLAYMAKING GENIUS",
        text: `${p.lastName} tops creative charts with ${lastSeason.assists} assists, orchestrating decisive attacks.`,
      });
    } else if (p.overall >= 90) {
      headlines.push({
        tag: "BALLON D'OR FRONTRUNNER",
        text: `Leading football journalists position ${p.lastName} as the premier candidate for the Ballon d'Or.`,
      });
    } else if (p.overall >= 82) {
      headlines.push({
        tag: "TACTICAL MASTERCLASS",
        text:
          `Pundits break down ${p.lastName}'s decisive role and tactical maturity in ${teamName}'s winning blueprint.`,
      });
    } else if (p.age <= 21) {
      headlines.push({
        tag: "CONTINENTAL WONDERKID",
        text:
          `Scouts across Europe's top five leagues identify ${p.lastName} as one of the elite prospects of his generation.`,
      });
    } else {
      headlines.push({
        tag: "MATCHDAY FOCUS",
        text: `${p.lastName} primed for high-stakes clash as ${teamName} prepare for the upcoming matchday.`,
      });
    }
  }

  // 2. Transfer / Contract / Agent
  if (p.contract && p.contract.yearsRemaining <= 1) {
    headlines.push({
      tag: "CONTRACT SAGA",
      text:
        `${p.lastName} enters the final months of contract at ${teamName} — European powerhouses prepare blockbuster bids.`,
    });
  } else if (p.agent) {
    headlines.push({
      tag: "TRANSFER RADAR",
      text:
        `Agent ${p.agent.name} (${p.agent.agency}) reportedly fielding formal inquiries from premier European clubs for ${p.lastName}.`,
    });
  } else {
    headlines.push({
      tag: "MARKET VALUE SURGE",
      text: `${p.lastName}'s valuation escalates to €${
        (p.marketValue / 1000000).toFixed(1)
      }M as top representation agencies vie to sign the star.`,
    });
  }

  // 3. Manager & Squad Standing
  if (p.managerTrust >= 85) {
    headlines.push({
      tag: "MANAGER PRAISE",
      text:
        `"An indispensable cornerstone of our project" — ${teamName} manager reaffirms absolute trust in ${p.lastName}.`,
    });
  } else if (p.managerTrust <= 40) {
    headlines.push({
      tag: "SQUAD SCRUTINY",
      text:
        `Press speculate on tactical friction as ${p.lastName} pushes for guaranteed starting minutes at ${teamName}.`,
    });
  } else {
    headlines.push({
      tag: "DRESSING ROOM",
      text:
        `Positive vibes inside ${teamName}'s camp with ${p.lastName} leading by example during tactical training sessions.`,
    });
  }

  // 4. Physical / Fitness / Injury
  if (p.activeInjury) {
    headlines.push({
      tag: "MEDICAL WIRE",
      text:
        `${p.lastName} undergoes intensive rehabilitation for ${p.activeInjury.name} — medical staff target return in ${p.activeInjury.gamesMissed} matches.`,
    });
  } else if (p.fitness && p.fitness < 75) {
    headlines.push({
      tag: "LOAD MANAGEMENT",
      text: `Sports science staff tailor recovery regime for ${p.lastName} following demanding back-to-back fixtures.`,
    });
  } else {
    headlines.push({
      tag: "PEAK BIOMETRICS",
      text: `Performance metrics confirm ${p.lastName} is operating at 100% physical capacity and top sprinting speed.`,
    });
  }

  // 5. International Stage / Dual Nationality
  if (p.nationalTeamStats && p.nationalTeamStats.appearances > 0) {
    headlines.push({
      tag: "INTERNATIONAL PULSE",
      text: `${natName} national team manager affirms ${p.lastName} will feature prominently in upcoming qualifiers.`,
    });
  } else if (p.secondNationality) {
    headlines.push({
      tag: "DUAL NATIONALITY",
      text:
        `International tug-of-war brewing between ${natName} and ${p.secondNationality.name_en} over ${p.lastName}'s sporting allegiance.`,
    });
  } else {
    headlines.push({
      tag: "SCOUTING WIRE",
      text:
        `${natName} technical committee actively monitoring ${p.lastName} ahead of the forthcoming international call-ups.`,
    });
  }

  // 6. Commercial / Boots / Lifestyle / Social Media
  if (p.bootDeal) {
    headlines.push({
      tag: "COMMERCIAL HIT",
      text:
        `${p.bootDeal.brand} reports unprecedented global retail demand for the signature ${p.bootDeal.modelName} worn by ${p.lastName}.`,
    });
  } else if (p.socialMedia && p.socialMedia.totalFollowers > 200000) {
    headlines.push({
      tag: "VIRAL DIGITAL REACH",
      text: `${p.lastName}'s official social footprint crosses ${
        formatSocialFollowers(p.socialMedia.totalFollowers)
      } followers after viral training clips.`,
    });
  } else {
    headlines.push({
      tag: "BRAND SHOWCASE",
      text: `Leading sportswear manufacturers formulate multi-million endorsement proposals for ${p.lastName}.`,
    });
  }

  // 7. League & Trophy Race
  if (comp) {
    if (comp.id === "aze_pl") {
      headlines.push({
        tag: "AZERBAIJAN PREMYER LIQASI",
        text:
          `Fierce domestic battle unfolds as ${teamName} strive to conquer the Premyer Liqası and secure European qualification.`,
      });
    } else {
      headlines.push({
        tag: `${comp.name.toUpperCase()}`,
        text:
          `High-voltage action continues across ${comp.name} with ${teamName} locked in an electrifying title pursuit.`,
      });
    }
  } else {
    headlines.push({
      tag: "CONTINENTAL GLORY",
      text: `Europe's elite clubs gear up for decisive knockout ties under the bright lights of the Champions League.`,
    });
  }

  return headlines;
}

export function updateNewsTicker() {
  if (!newsTickerTrack || !state || !state.player) return;
  const p = state.player;
  const lastSeason = state.seasons && state.seasons.length > 0 ? state.seasons[state.seasons.length - 1] : null;
  const team = lastSeason
    ? catalogIndex.getTeam(lastSeason.teamId)
    : (state.currentTeamId ? catalogIndex.getTeam(state.currentTeamId) : null);
  const comp = team ? catalogIndex.getCompetition(team.id) : null;

  const headlines = generateNewsHeadlines(p, team, comp, lastSeason);
  const renderItem = (item) => `
    <span class="ticker-item">
      <span class="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-zinc-800/90 text-amber-400 border border-amber-500/25 shadow-sm">${item.tag}</span>
      <span class="text-zinc-200 text-xs font-semibold">${item.text}</span>
    </span>
  `;

  // Duplicate the array so translateX(-50%) to translateX(0%) loops seamlessly forever
  newsTickerTrack.innerHTML = [...headlines, ...headlines].map(renderItem).join("");
}
