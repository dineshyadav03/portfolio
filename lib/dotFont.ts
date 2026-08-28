// Minimal 5x5 dot-matrix font, used only for the decorative masthead
// wordmark (not for reading text — body copy stays in Geist Mono).

const GLYPHS: Record<string, string[]> = {
  A: [".###.", "#...#", "#####", "#...#", "#...#"],
  D: ["####.", "#...#", "#...#", "#...#", "####."],
  E: ["#####", "#....", "###..", "#....", "#####"],
  H: ["#...#", "#...#", "#####", "#...#", "#...#"],
  I: ["#####", "..#..", "..#..", "..#..", "#####"],
  N: ["#...#", "##..#", "#.#.#", "#..##", "#...#"],
  S: [".####", "#....", ".###.", "....#", "####."],
  V: ["#...#", "#...#", "#...#", ".#.#.", "..#.."],
  Y: ["#...#", ".#.#.", "..#..", "..#..", "..#.."],
  " ": [".", ".", ".", ".", "."],
};

export function textToDotBitmap(text: string): boolean[][] {
  const upper = text.toUpperCase();
  const glyphs = Array.from(upper).map((ch) => GLYPHS[ch] ?? GLYPHS[" "]);
  const rows = 5;
  const grid: boolean[][] = Array.from({ length: rows }, () => []);
  glyphs.forEach((glyph, i) => {
    for (let r = 0; r < rows; r++) {
      for (const ch of glyph[r]) {
        grid[r].push(ch === "#");
      }
      if (i < glyphs.length - 1) grid[r].push(false);
    }
  });
  return grid;
}
