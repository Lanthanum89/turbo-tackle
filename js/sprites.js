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

export const ROCK_SPRITE = [
  "...rRRRRr...",
  ".rRRRRRRRRr.",
  ".rRRRRRRRRr.",
  "rRRRRRRRRRRr",
  "rRRRrrrrRRRr",
  "rRRrrrrrrRRr",
  "rRRrrrrrrRRr",
  "rRRRrrrrRRRr",
  "rRRRRRRRRRRr",
  ".rRRRRRRRRr.",
  ".rRRRRRRRRr.",
  "...rRRRRr...",
];

export function drawSprite(ctx, rows, colors, x, y, pixelSize) {
  for (let r = 0; r < rows.length; r++) {
    const row = rows[r];
    for (let c = 0; c < row.length; c++) {
      const ch = row[c];
      if (ch === ".") continue;
      ctx.fillStyle = colors[ch] || "#ff00ff";
      ctx.fillRect(
        Math.round(x + c * pixelSize),
        Math.round(y + r * pixelSize),
        Math.ceil(pixelSize),
        Math.ceil(pixelSize)
      );
    }
  }
}
