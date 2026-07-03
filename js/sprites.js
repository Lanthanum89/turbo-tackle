export const CAR_SPRITE = [
  "...HcccCCcccH...",
  "..HcWWWccWWWcH..",
  "McWwWWWccWWWwWcM",
  ".DDDDDDDDDDDDDD.",
  ".CcccccCCcccccC.",
  "KCCGCCCCCCCCGCCK",
  "KCCCCCCCCCCCCCCK",
  "KDCCCCDCCDCCCCDK",
  "KCCCCCCCCCCCCCCK",
  "KCCCCCCCCCCCCCCK",
  "KDCCCCDCCDCCCCDK",
  "kKCCCCCCCCCCCCKk",
  "KKCCCCCCCCCCCCKK",
  ".DwwwwwDDwwwwwD.",
  ".CCCCCCCCCCCCCC.",
  "KKCCCCCCCCCCCCKK",
  ".TDDDDDTTDDDDDT.",
  "..DDDDDDDDDDDD..",
  "...DDDDDDDDDD...",
];

export const ROCK_SPRITE = [
  "......rRRr......",
  "....rRRRRRRr....",
  "..rRRRRRRRRRRr..",
  ".rRRRRRRRRRRRRr.",
  "rRhhhhhRRRRRRRRr",
  "rRRhhhhRRRRRRRRr",
  "rRRRRRRRRrrrrrRr",
  "rRRRRRRRrrrrrrrr",
  "rRRRRRRRrrrrrrrr",
  "rRRRRRRRRrrrrrRr",
  "rRRhhhhRRRRRRRRr",
  "rRhhhhhRRRRRRRRr",
  ".rRRRRRRRRRRRRr.",
  "..rRRRRRRRRRRr..",
  "....rRRRRRRr....",
  "......rRRr......",
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
