// Display formatting shared across views: currency, follower counts, OVR badge colours,
// HTML escaping and the eased number counter.

// Number Counter Easing Animation
export function animateValue(element, start, end, duration = 600, formatter = (v) => v) {
  if (start === end) {
    element.textContent = formatter(end);
    return;
  }
  const startTime = performance.now();
  function update(currentTime) {
    const elapsed = currentTime - startTime;
    const progress = Math.min(1, elapsed / duration);
    const ease = 1 - Math.pow(1 - progress, 3);
    const current = Math.round(start + (end - start) * ease);
    element.textContent = formatter(current);
    if (progress < 1) {
      requestAnimationFrame(update);
    } else {
      element.textContent = formatter(end);
    }
  }
  requestAnimationFrame(update);
}

export function escapeHtmlText(v) {
  return String(v).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
}

export function getBadgeStyle(ovr) {
  // Flat scoreboard tiers: gold plate > chalk plate > yellow rule > steel rule > graphite
  if (ovr >= 95) return "bg-[#F6C516] text-[#171200] border-[#F6C516]";
  if (ovr >= 90) return "bg-[#ECEAE2] text-[#0A0B0A] border-[#ECEAE2]";
  if (ovr >= 80) return "bg-[#171A17] text-[#F6C516] border-2 border-[#F6C516]";
  if (ovr >= 70) return "bg-[#171A17] text-[#ECEAE2] border-2 border-[#6FB8DA]";
  if (ovr >= 60) return "bg-[#111311] text-zinc-200 border-[#3A3F39]";
  return "bg-[#111311] text-zinc-400 border-[#262A26]";
}

export function formatSocialFollowers(val) {
  if (!val) return "0";
  if (val >= 1000000) return `${(val / 1000000).toFixed(1)}M`;
  if (val >= 1000) return `${(val / 1000).toFixed(1)}K`;
  return `${val}`;
}

export function formatCurrency(val) {
  if (val >= 1000000) {
    return `€${(val / 1000000).toFixed(1)}M`;
  } else if (val >= 1000) {
    return `€${Math.round(val / 1000)}K`;
  }
  return `€${val}`;
}
