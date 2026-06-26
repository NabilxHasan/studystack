// Synthwave palettes ported from the StudyStack app (src/App.js THEMES).
// Each one drives the canvas Background: sky gradient, sun/moon, neon grid, etc.
export const THEMES = {
  retrowave: {
    name: "RETROWAVE", icon: "🌆",
    accent: "#ff2d9b", accent2: "#c45bff", accent3: "#22e0ff", text: "#ffe8fb",
    sky: ["#10001f", "#2a0445", "#5e0a5e", "#a01070", "#e0316a", "#ff7a3d", "#ffc24d"],
    sun: ["#fff0a0", "#ffd24d", "#ff8c42", "#e0316a"],
    sunStripe: "#1a0030", grid: "#ff2d9b", star: "255,230,200", haze: "rgba(255,90,160,0.10)",
  },
  cyberpunk: {
    name: "CYBERPUNK", icon: "🏙️",
    accent: "#13f0ff", accent2: "#ff2e88", accent3: "#ffe138", text: "#e6f6ff",
    sky: ["#03060e", "#070f22", "#0a1838", "#10204a", "#1a1040", "#2a0a38"],
    sun: ["#9affff", "#13f0ff", "#0a90ff", "#ff2e88"],
    sunStripe: "#06101f", grid: "#13f0ff", star: "180,240,255", haze: "rgba(19,240,255,0.08)",
  },
  aurora: {
    name: "AURORA", icon: "🌌",
    accent: "#2bffc6", accent2: "#8a6bff", accent3: "#ff7ab5", text: "#e0fff5",
    sky: ["#01100f", "#042521", "#063a30", "#0a4a3a", "#10305a", "#1a1a55"],
    sun: ["#d6fff0", "#7affd6", "#2bffc6", "#8a6bff"],
    sunStripe: "#042018", grid: "#2bffc6", star: "200,255,230", haze: "rgba(43,255,198,0.10)",
  },
  inferno: {
    name: "INFERNO", icon: "🔥",
    accent: "#ff7a18", accent2: "#ff2d55", accent3: "#ffd23f", text: "#fff0e0",
    sky: ["#1a0500", "#3a0a00", "#6e1500", "#aa2400", "#e04010", "#ff7a18", "#ffc24d"],
    sun: ["#fff0a0", "#ffd23f", "#ff7a18", "#e04010"],
    sunStripe: "#2a0800", grid: "#ff7a18", star: "255,210,160", haze: "rgba(255,100,30,0.12)",
  },
  midnight: {
    name: "MIDNIGHT", icon: "🌙",
    accent: "#b89cff", accent2: "#6c52d6", accent3: "#ffd76a", text: "#f2ecff",
    sky: ["#070612", "#0f0a26", "#1a1040", "#241552", "#1a1040", "#0f0a26"],
    sun: ["#fffbe6", "#ffe9a0", "#ffd76a", "#c8a85a"],
    sunStripe: null, grid: "#b89cff", star: "230,220,255", haze: "rgba(184,156,255,0.08)", moon: true,
  },
};

export const THEME_ORDER = ["retrowave", "cyberpunk", "aurora", "inferno", "midnight"];

// ── color helpers (for smooth theme-to-theme blending) ──
function hexToRgb(hex) {
  const h = hex.replace("#", "");
  const n = parseInt(h.length === 3 ? h.split("").map((c) => c + c).join("") : h, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
function rgbToHex([r, g, b]) {
  return "#" + [r, g, b].map((v) => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, "0")).join("");
}
export function lerp(a, b, t) { return a + (b - a) * t; }
export function lerpColor(c1, c2, t) {
  const a = hexToRgb(c1), b = hexToRgb(c2);
  return rgbToHex([lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)]);
}
function lerpArr(a1, a2, t) {
  const n = Math.max(a1.length, a2.length);
  const out = [];
  for (let i = 0; i < n; i++) out.push(lerpColor(a1[Math.min(i, a1.length - 1)], a2[Math.min(i, a2.length - 1)], t));
  return out;
}
function parseRgbStr(s) { return s.split(",").map(Number); }
function lerpRgbStr(s1, s2, t) {
  const a = parseRgbStr(s1), b = parseRgbStr(s2);
  return [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)].map(Math.round).join(",");
}

// Blend two whole theme palettes by t (0..1). moon/sunStripe snap at the midpoint.
export function blendThemes(t1, t2, t) {
  return {
    accent: lerpColor(t1.accent, t2.accent, t),
    accent2: lerpColor(t1.accent2, t2.accent2, t),
    accent3: lerpColor(t1.accent3, t2.accent3, t),
    text: lerpColor(t1.text, t2.text, t),
    sky: lerpArr(t1.sky, t2.sky, t),
    sun: lerpArr(t1.sun, t2.sun, t),
    grid: lerpColor(t1.grid, t2.grid, t),
    star: lerpRgbStr(t1.star, t2.star, t),
    haze: t < 0.5 ? t1.haze : t2.haze,
    sunStripe: t < 0.5 ? t1.sunStripe : t2.sunStripe,
    moon: t < 0.5 ? t1.moon : t2.moon,
  };
}
