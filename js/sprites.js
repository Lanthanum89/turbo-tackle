export const CAR_SPRITE = [
  "..........DG..........",
  ".........HCCH.........",
  "........HCCcCH........",
  ".......DCCCcCCD.......",
  ".......DCCCcCCD.......",
  "......DCCCCcCCCD......",
  ".....MCwwwwwwwwCM.....",
  "......DWWWWWWWWD......",
  "......DWWWWWWWWD......",
  ".....KkCCCCcCCCkK.....",
  "....KKkCCCCcCCCkKK....",
  "....KKkCCCCcCCCkKK....",
  "....KKkCCCCcCCCkKK....",
  ".....DCCCCCcCCCCD.....",
  ".....DCCCCCcCCCCD.....",
  "....KKkCCCCcCCCkKK....",
  ".....KkCCCCcCCCkKK....",
  ".....KKkCCCcCCCkK.....",
  ".....KKkCCCcCCkKK.....",
  "......DwwwwwwwwD......",
  "......DwwwwwwwwD......",
  "......DCwwwwwwCD......",
  ".......DCCCcCCD.......",
  ".......DCCCcCCD.......",
  "........DCCcCD........",
  "........DTCCTD........",
  ".........DTTD.........",
  "..........DD..........",
]; // 28 rows x 22 cols

export const STAR_SPRITE = [
  "......................",
  "..........O...........",
  ".........OSO..........",
  ".........OSW..........",
  "........OSSSO.........",
  ".......OSSSSSO........",
  "....OOOSSSSSSSOOO.....",
  ".OOOSSSSSSSSSssssOOO..",
  "..OSSSSSSSSSSsssssO...",
  "...OSSSSSSSSsssssO....",
  "...OSSSSSSSssssssO....",
  "....OSSSSSSsssssO.....",
  ".....OSSSSsssssO......",
  ".....OSSSSsssssO......",
  ".....OSSSssssssO......",
  ".....OSSsssssssO......",
  ".....OSOOOOOOOsO......",
  ".....OO.......OO......",
  "......................",
  "......................",
  "......................",
  "......................",
]; // 22 rows x 22 cols

export const ROCK_SPRITE = [
  "......................",
  "..........rrrr........",
  "........rrhhhhrr......",
  ".....rrrhhhhhhhRr.....",
  "....rhhhhhhhhhRRr.....",
  "...rhhhhhhhhhRRRr.....",
  "..rhhhhhhkhhRRRRr.....",
  "..rhhhhhhhkRRRRRRr....",
  ".rhhhhhhhhRkRRRRRRr...",
  ".rhhhhhhhRRRRRRRRrr...",
  "rhhhhhhhRRRRRRRRrrr...",
  ".rhhhhhRRRRRRRRrrrr...",
  "..rhhhRRRkRRRRrrrrr...",
  "...rhRRRkRRRRrrrrrr...",
  "....rRRkRRRRrrrrrrr...",
  "....rRRRRRRrrrrrrr....",
  "....rRRRRRrrrrrr......",
  ".....rrRRrrrrr........",
  ".......rrrrr..........",
  "......................",
  "......................",
  "......................",
]; // 22 rows x 22 cols

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
