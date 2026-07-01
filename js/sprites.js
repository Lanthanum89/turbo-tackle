export const CAR_SPRITE = [
  ".HCCCCH.",
  ".CWWWWC.",
  "MCWWWWCM",
  ".DDDDDD.",
  "KCCCCCCK",
  "KCLCCLCK",
  "KCCCCCCK",
  "KCCCCCCK",
  "KKCCCCKK",
  "KKCCCCKK",
  ".TDDDDT.",
  "..DDDD..",
];

export const CAR_COLORS = {
  C: "#e8384f",
  D: "#a11f30",
  W: "#8fe8ff",
  H: "#fff275",
  K: "#141414",
  M: "#2b2b2b",
  L: "#c22f42",
  T: "#ff7043",
};

export const FOOTBALL_SPRITE = [
  "..WBBW..",
  ".WBWWBW.",
  "WBWBBWBW",
  "BWBBBBWB",
  "BWBBBBWB",
  "WBWBBWBW",
  ".WBWWBW.",
  "..WBBW..",
];

export const FOOTBALL_COLORS = {
  W: "#f4f1e8",
  B: "#1a1a1a",
};

export function drawSprite(ctx, rows, colors, x, y, pixelSize, overrideColor) {
  for (let r = 0; r < rows.length; r++) {
    const row = rows[r];
    for (let c = 0; c < row.length; c++) {
      const ch = row[c];
      if (ch === ".") continue;
      ctx.fillStyle = overrideColor || colors[ch];
      ctx.fillRect(
        Math.round(x + c * pixelSize),
        Math.round(y + r * pixelSize),
        Math.ceil(pixelSize),
        Math.ceil(pixelSize)
      );
    }
  }
}
