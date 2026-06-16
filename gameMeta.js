// gameMeta.js — colors, set sizes, and pure helpers that work on the
// redacted player views (these never need hidden information).

export const COLORS = {
  BROWN: { name: "Brown", setSize: 2, rent: [1, 2] },
  LIGHT_BLUE: { name: "Light Blue", setSize: 3, rent: [1, 2, 3] },
  PINK: { name: "Pink", setSize: 3, rent: [1, 2, 4] },
  ORANGE: { name: "Orange", setSize: 3, rent: [1, 3, 5] },
  RED: { name: "Red", setSize: 3, rent: [2, 3, 6] },
  YELLOW: { name: "Yellow", setSize: 3, rent: [2, 4, 6] },
  GREEN: { name: "Green", setSize: 3, rent: [2, 4, 7] },
  DARK_BLUE: { name: "Dark Blue", setSize: 2, rent: [3, 8] },
  RAILROAD: { name: "Railroad", setSize: 4, rent: [1, 2, 3, 4] },
  UTILITY: { name: "Utility", setSize: 2, rent: [1, 2] },
};

export const HEX = {
  BROWN: "#7B4B2A", LIGHT_BLUE: "#9CC7E0", PINK: "#C95C9B", ORANGE: "#E8862E",
  RED: "#D33A2C", YELLOW: "#E8C32E", GREEN: "#1E8A4C", DARK_BLUE: "#2A4B9B",
  RAILROAD: "#2B2B2B", UTILITY: "#9BA84A",
};

export const BUILDABLE = Object.keys(COLORS).filter((c) => c !== "RAILROAD" && c !== "UTILITY");

export const val = (c) => c.value || 0;

export function isComplete(player, color) {
  const g = player.properties[color];
  return !!g && g.cards.length >= COLORS[color].setSize;
}

export function rentFor(player, color, doubled = 0) {
  const g = player.properties[color];
  if (!g || g.cards.length === 0) return 0;
  const info = COLORS[color];
  let r = info.rent[Math.min(g.cards.length, info.setSize) - 1];
  for (const b of g.buildings) r += b.type === "HOUSE" ? 3 : 4;
  return r * Math.pow(2, doubled);
}

export function assets(player) {
  let t = player.bank.reduce((s, c) => s + val(c), 0);
  for (const g of Object.values(player.properties)) {
    t += g.cards.reduce((s, c) => s + val(c), 0);
    t += g.buildings.reduce((s, c) => s + val(c), 0);
  }
  return t;
}

export const S = {
  table: "#23282B", panel: "#2C3236", panelLite: "#343B40",
  stock: "#F6F1E5", ink: "#23282B", red: "#D6422F", gold: "#E8C32E",
  dim: "#9AA3A8", line: "#3D454A",
};

export const fontCss = `
@import url('https://fonts.googleapis.com/css2?family=Paytone+One&family=Space+Grotesk:wght@400;500;700&family=IBM+Plex+Mono:wght@500;700&display=swap');
.md-display { font-family: 'Paytone One', sans-serif; }
.md-body { font-family: 'Space Grotesk', sans-serif; }
.md-mono { font-family: 'IBM Plex Mono', monospace; }
.md-scroll::-webkit-scrollbar { height: 6px; }
.md-scroll::-webkit-scrollbar-thumb { background: ${S.line}; border-radius: 3px; }
@media (prefers-reduced-motion: reduce) { * { transition: none !important; animation: none !important; } }
button:focus-visible { outline: 2px solid ${S.gold}; outline-offset: 2px; }
input:focus-visible { outline: 2px solid ${S.gold}; outline-offset: 1px; }
`;
