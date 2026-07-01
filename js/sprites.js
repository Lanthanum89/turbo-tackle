export const CAR_SPRITE = [
  "..HccHHccH..",
  ".HcWWccWWcH.",
  "McWwwWWwwWcM",
  ".DDDDDDDDDD.",
  ".CcccCCcccC.",
  "KCCGCCCCGCCK",
  "KCCCCCCCCCCK",
  "KDCCCDDCCCDK",
  "KCCCCCCCCCCK",
  "kKCCCCCCCCKk",
  "KKCCCCCCCCKK",
  ".DwwwDDwwwD.",
  ".CCCCCCCCCC.",
  "kKCCCCCCCCKk",
  ".TDDDTTDDDT.",
  "..DDDDDDDD..",
];

export const CAR_COLORS = {
  C: "#e5484d",
  c: "#ff7a7e",
  D: "#a3232f",
  W: "#cdf3ff",
  w: "#6fbfdc",
  H: "#ffe9a8",
  K: "#14151a",
  k: "#4a4f58",
  M: "#2a2d34",
  G: "#23262b",
  T: "#ff9466",
};

export const FOOTBALL_SPRITE = [
  "..eWWWWe..",
  ".eWWBBWWe.",
  "eWBWWWWBWe",
  "WWWBBBBWWW",
  "WBWWWWWWBW",
  "WBWWWWWWBW",
  "WWWBBBBWWW",
  "eWBWWWWBWe",
  ".eWWBBWWe.",
  "..eWWWWe..",
];

export const FOOTBALL_COLORS = {
  W: "#f4f1e8",
  e: "#cdbfa0",
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
