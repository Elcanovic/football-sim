/**
 * Technical Boot Suppliers & Commercial Brand Sponsorship Engine (JS Version)
 * Covers boot deals (Nike, Adidas, Puma, Mizuno), custom signature colorways, and luxury sponsorships.
 */

export const BOOT_MODELS_CATALOG = [
  {
    id: "boot-nike-mercurial",
    brand: "Nike",
    modelName: "Air Zoom Mercurial Superfly Elite",
    tier: "Headline Pro",
    statBonus: { attr: "pace", val: 2 },
    colorway: "Metallic Volt / Glacier Blue",
    quote: "Explosive linear acceleration and ultra-lightweight carbon agility.",
  },
  {
    id: "boot-nike-phantom",
    brand: "Nike",
    modelName: "Phantom GX II Elite Gripknit",
    tier: "Headline Pro",
    statBonus: { attr: "dribbling", val: 2 },
    colorway: "Blackout / Hyper Crimson",
    quote: "Precision touch, lethal striking, and seamless weather grip.",
  },
  {
    id: "boot-adidas-predator",
    brand: "Adidas",
    modelName: "Predator Elite Fold-Over Tongue",
    tier: "Headline Pro",
    statBonus: { attr: "shooting", val: 2 },
    colorway: "Solar Red / Core Black / Lucid Lemon",
    quote: "Legendary swerve, pinpoint dipping shots, and iconic striking heritage.",
  },
  {
    id: "boot-adidas-f50",
    brand: "Adidas",
    modelName: "F50 Adizero Lightstrike",
    tier: "Headline Pro",
    statBonus: { attr: "pace", val: 2 },
    colorway: "Chameleon Purple / Lucid Cyan",
    quote: "Pure featherweight speed engineered for rapid winger breaks.",
  },
  {
    id: "boot-puma-future",
    brand: "Puma",
    modelName: "Future 7 Ultimate FUZIONFIT360",
    tier: "Headline Pro",
    statBonus: { attr: "passing", val: 2 },
    colorway: "Sunset Glow / Sun Stream",
    quote: "Dynamic playmaker freedom, 3D texturing, and adaptive midfoot lockdown.",
  },
  {
    id: "boot-mizuno-morelia",
    brand: "Mizuno",
    modelName: "Morelia Neo IV Beta Japan",
    tier: "Headline Pro",
    statBonus: { attr: "physical", val: 2 },
    colorway: "Pearl White / Origami Red",
    quote: "Artisanal handcrafted kangaroo leather delivering barefoot comfort.",
  },
];

export const BRAND_SPONSORSHIPS_CATALOG = [
  {
    id: "sponsor-hublot",
    brandName: "Hublot Luxury Timepieces",
    category: "luxury_watch",
    annualPay: 350000,
    reputationRequired: 74,
    active: false,
  },
  {
    id: "sponsor-louis-vuitton",
    brandName: "Louis Vuitton Horizon Travel",
    category: "fashion_house",
    annualPay: 650000,
    reputationRequired: 80,
    active: false,
  },
  {
    id: "sponsor-ea-sports",
    brandName: "EA Sports Global Ambassador",
    category: "gaming_cover",
    annualPay: 1200000,
    reputationRequired: 85,
    active: false,
  },
  {
    id: "sponsor-porsche",
    brandName: "Porsche Performance Campaign",
    category: "automotive",
    annualPay: 850000,
    reputationRequired: 88,
    active: false,
  },
];

export function getDefaultBootDeal(position) {
  const isSpeedPos = ["ST", "LW", "RW"].includes(position);
  const baseModel = isSpeedPos ? BOOT_MODELS_CATALOG[0] : BOOT_MODELS_CATALOG[2];
  return {
    ...baseModel,
    tier: "Academy",
    weeklyPay: 500,
    signatureBootUnlocked: false,
  };
}

export function calculateBootDealWeeklyPay(tier, playerOverall, followers = 0) {
  const ovrMultiplier = Math.max(1, (playerOverall - 60) * 0.15);
  const followersBonus = Math.floor(followers / 200000) * 1500;

  switch (tier) {
    case "Academy":
      return Math.round(500 * ovrMultiplier);
    case "Rising Star":
      return Math.round((2500 + followersBonus) * ovrMultiplier);
    case "Headline Pro":
      return Math.round((12000 + followersBonus * 1.5) * ovrMultiplier);
    case "Signature Icon":
      return Math.round((55000 + followersBonus * 2.2) * ovrMultiplier);
    default:
      return 1000;
  }
}

export function getAvailableBootDeals(player) {
  const followers = player.socialMedia?.totalFollowers || 0;
  const ovr = player.overall;

  let currentTier = "Academy";
  if (ovr >= 87 || followers >= 2000000) {
    currentTier = "Signature Icon";
  } else if (ovr >= 80 || followers >= 400000) {
    currentTier = "Headline Pro";
  } else if (ovr >= 70 || followers >= 50000) {
    currentTier = "Rising Star";
  }

  const isSignatureReady = ovr >= 88 || (player.careerTotals && player.careerTotals.awards > 0);

  return BOOT_MODELS_CATALOG.map((model) => {
    const weeklyPay = calculateBootDealWeeklyPay(currentTier, ovr, followers);
    return {
      ...model,
      tier: currentTier,
      weeklyPay,
      signatureBootUnlocked: isSignatureReady,
      signatureName: isSignatureReady ? `${player.lastName} × ${model.brand} Signature Edition` : undefined,
    };
  });
}

export function signBootDeal(player, modelId) {
  const available = getAvailableBootDeals(player);
  const target = available.find((d) => d.id === modelId) || available[0];

  player.bootDeal = target;

  const msg = target.signatureBootUnlocked
    ? `HISTORIC PARTNERSHIP! Signed signature boot contract with ${target.brand} (${target.modelName}) paying €${target.weeklyPay.toLocaleString()}/wk with a custom signature colorway!`
    : `Signed boot endorsement deal with ${target.brand} (${target.modelName}) paying €${target.weeklyPay.toLocaleString()}/week.`;

  return {
    success: true,
    deal: target,
    message: msg,
  };
}

export function getAvailableBrandSponsorships(player) {
  return BRAND_SPONSORSHIPS_CATALOG.map((sponsor) => {
    const isSigned = (player.brandSponsorships || []).some((s) => s.id === sponsor.id && s.active);
    return {
      ...sponsor,
      active: isSigned,
    };
  });
}

export function signBrandSponsorship(player, sponsorId) {
  const sponsor = BRAND_SPONSORSHIPS_CATALOG.find((s) => s.id === sponsorId);
  if (!sponsor) return { success: false, sponsorship: null, message: "Sponsor not found." };

  if (player.overall < sponsor.reputationRequired) {
    return {
      success: false,
      sponsorship: null,
      message: `Requires ${sponsor.reputationRequired} OVR to qualify for ${sponsor.brandName}.`,
    };
  }

  if (!player.brandSponsorships) player.brandSponsorships = [];
  const existing = player.brandSponsorships.find((s) => s.id === sponsorId);
  if (existing) {
    existing.active = true;
  } else {
    player.brandSponsorships.push({ ...sponsor, active: true });
  }

  if (player.socialMedia) {
    player.socialMedia.totalFollowers += 80000;
  }

  return {
    success: true,
    sponsorship: sponsor,
    message:
      `Signed global ambassador contract with ${sponsor.brandName}! Adds €${sponsor.annualPay.toLocaleString()}/year in commercial endorsements.`,
  };
}

export function calculateWeeklySponsorshipEarnings(player) {
  let total = 0;
  if (player.bootDeal) {
    total += player.bootDeal.weeklyPay;
  }
  if (player.brandSponsorships) {
    player.brandSponsorships.forEach((s) => {
      if (s.active) {
        total += Math.round(s.annualPay / 52);
      }
    });
  }
  return total;
}
