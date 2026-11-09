// Procedural SVG shield and crest generator with 3-tier fallback resilience

export interface ClubShieldParams {
  primaryColor?: string | null;
  secondaryColor?: string | null;
  abbreviation?: string | null;
  name?: string | null;
  size?: number;
}

function escapeXml(unsafe: string): string {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function isValidHex(hex?: string | null): boolean {
  if (!hex || typeof hex !== "string") return false;
  return /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/.test(hex.trim());
}

/**
 * Returns dynamic CDN badge URL or null for local fallback.
 */
export function getClubCdnBadgeUrl(clubId: string): string | null {
  if (!clubId) return null;
  return `https://assets.football-sim.internal/badges/${encodeURIComponent(clubId)}.png`;
}

/**
 * Generates an inline procedural vector SVG shield with official club colors and typography initials.
 */
export function generateClubShieldSVG(params: ClubShieldParams = {}): string {
  const primary = isValidHex(params.primaryColor) ? (params.primaryColor as string).trim() : "#334155";
  const secondary = isValidHex(params.secondaryColor) ? (params.secondaryColor as string).trim() : "#FFFFFF";
  const rawAbbr = (params.abbreviation || params.name || "FC").substring(0, 4).toUpperCase();
  const abbr = escapeXml(rawAbbr);
  const size = params.size || 64;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="${size}" height="${size}">
  <defs>
    <linearGradient id="shieldGrad" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${primary}" stop-opacity="1"/>
      <stop offset="100%" stop-color="${primary}" stop-opacity="0.8"/>
    </linearGradient>
  </defs>
  <path d="M32 4 L56 12 C56 38 46 54 32 60 C18 54 8 38 8 12 Z" fill="url(#shieldGrad)" stroke="${secondary}" stroke-width="2.5" stroke-linejoin="round"/>
  <path d="M32 10 L50 16 C50 36 42 48 32 54 C22 48 14 36 14 16 Z" fill="none" stroke="${secondary}" stroke-width="1" stroke-opacity="0.35"/>
  <text x="32" y="38" text-anchor="middle" font-family="'Plus Jakarta Sans', system-ui, sans-serif" font-weight="900" font-size="16" fill="${secondary}" letter-spacing="0.5">${abbr}</text>
</svg>`;
}
