/* ═══ CIPHER ═══ */
const ALPHA = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
function buildGrid(key) {
  const seen = new Set(); const seq = [];
  const push = (ch) => { if (ch && !seen.has(ch)) { seen.add(ch); seq.push(ch); } };
  (key || '').toUpperCase().replace(/[^A-Z]/g, '').split('')
    .forEach((ch) => push(ch === 'J' ? 'I' : ch));
  for (const ch of ALPHA) if (ch !== 'J') push(ch);
  const grid = [];
  for (let r = 0; r < 5; r++) grid.push(seq.slice(r * 5, r * 5 + 5));
  return { grid, seq };
}
function posMap(grid) {
  const m = {};
  for (let r = 0; r < 5; r++) for (let c = 0; c < 5; c++) m[grid[r][c]] = [r, c];
  return m;
}
function toBigrams(text) {
  const clean = (text || '').toUpperCase().replace(/[^A-Z]/g, '').replace(/J/g, 'I');
  const out = []; let i = 0;
  while (i < clean.length) {
    const a = clean[i];
    if (i + 1 >= clean.length) { out.push([a, 'X']); i += 1; continue; }
    const b = clean[i + 1];
    if (a === b) { out.push([a, 'X']); i += 1; continue; }
    out.push([a, b]); i += 2;
  }
  return out;
}
function runCipher(text, key, mode) {
  const { grid } = buildGrid(key);
  const pos = posMap(grid);
  const dir = mode === 'encrypt' ? 1 : -1;
  const pairs = toBigrams(text);
  const steps = [], outChars = [];
  for (const [a, b] of pairs) {
    const [ra, ca] = pos[a]; const [rb, cb] = pos[b];
    let out, rule, wrap = null;
    if (ra === rb) {
      const c1 = (ca + dir + 5) % 5, c2 = (cb + dir + 5) % 5;
      out = [grid[ra][c1], grid[rb][c2]];
      rule = 'SAME ROW';
      if ((c1 === 0 && ca === 4) || (c2 === 0 && cb === 4)) wrap = 'row-right';
      if ((c1 === 4 && ca === 0) || (c2 === 4 && cb === 0)) wrap = 'row-left';
    } else if (ca === cb) {
      const r1 = (ra + dir + 5) % 5, r2 = (rb + dir + 5) % 5;
      out = [grid[r1][ca], grid[r2][cb]];
      rule = 'SAME COLUMN';
      if ((r1 === 0 && ra === 4) || (r2 === 0 && rb === 4)) wrap = 'col-down';
      if ((r1 === 4 && ra === 0) || (r2 === 4 && rb === 0)) wrap = 'col-up';
    } else {
      out = [grid[ra][cb], grid[rb][ca]];
      rule = 'RECTANGLE';
    }
    steps.push({
      inPair: [a, b], inPos: [[ra, ca], [rb, cb]],
      outPair: out, outPos: [pos[out[0]], pos[out[1]]],
      rule, wrap,
    });
    outChars.push(out[0], out[1]);
  }
  return { grid, steps, output: outChars.join('') };
}

export { buildGrid, runCipher, toBigrams };