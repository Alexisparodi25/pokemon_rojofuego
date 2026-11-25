'use strict';
// =====================================================================
//  Arte: baldosas y personajes pixelados dibujados por código (16x16 por baldosa)
// =====================================================================
const TL = { GRASS: 0, TALL: 1, PATH: 2, TREE: 3, WATER: 4, FLOWER: 5, FENCE: 6, SIGN: 7, ROOF_R: 8, ROOF_B: 9, ROOF_G: 10, ROOF_Y: 11, WALL: 12, WIN: 13, DOOR: 14,
  FLOOR: 15, CARPET: 16, COUNTER: 17, PC: 18, SHELF: 19, TABLE: 20, WALLI: 21, CAVE: 22, CAVEWALL: 23, ROCK: 24, GYMFLOOR: 25, STATUE: 26, BALLS: 27, PLANT: 28, CUP: 29,
  SAND: 30, MAT: 31, HEAL: 32, BOOKS: 33, ROOF_P: 34, WALL_D: 35, LEDGE: 36, BRIDGE: 37 };
const SOLID = new Set([TL.TREE, TL.WATER, TL.FENCE, TL.SIGN, TL.ROOF_R, TL.ROOF_B, TL.ROOF_G, TL.ROOF_Y, TL.ROOF_P, TL.WALL, TL.WIN, TL.COUNTER, TL.PC, TL.SHELF, TL.TABLE, TL.WALLI, TL.CAVEWALL,
  TL.ROCK, TL.STATUE, TL.BALLS, TL.PLANT, TL.CUP, TL.HEAL, TL.BOOKS, TL.WALL_D]);
const NTILES = 38;

function mkc(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; const x = c.getContext('2d'); x.imageSmoothingEnabled = false; return [c, x]; }
function hash(a, b, c) { let h = (a * 374761393 + b * 668265263 + (c || 0) * 2147483647) | 0; h = (h ^ (h >>> 13)) * 1274126177; return ((h ^ (h >>> 16)) >>> 0) / 4294967296; }
function mulberry(seed) { return function () { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

const Art = { tiles: [], water: [], chars: {}, ready: false };

function drawTile(id, g, frame) {
  const px = (x, y, w, h, c) => { g.fillStyle = c; g.fillRect(x, y, w, h); };
  const noise = (base, cols, n, seed) => { px(0, 0, 16, 16, base); for (let i = 0; i < n; i++) { const x = Math.floor(hash(i, seed, 1) * 16), y = Math.floor(hash(i, seed, 2) * 16); px(x, y, 1, 1, cols[i % cols.length]); } };
  switch (id) {
    case TL.GRASS: noise('#68b858', ['#5aa84c', '#78c868', '#62b052'], 14, 1); break;
    case TL.TALL: px(0, 0, 16, 16, '#3f8c3a'); for (let i = 0; i < 6; i++) { const x = (i % 3) * 5 + (i > 2 ? 2 : 0), y = i < 3 ? 1 : 8; px(x, y + 2, 1, 5, '#2c6e2c'); px(x + 2, y, 1, 7, '#58b050'); px(x + 4, y + 2, 1, 5, '#2c6e2c'); px(x + 1, y + 1, 1, 2, '#7ad068'); } break;
    case TL.PATH: noise('#d8c090', ['#c8b080', '#e4d0a4', '#cdb488'], 18, 2); break;
    case TL.SAND: noise('#ecd9a0', ['#dcc890', '#f4e8b8'], 12, 3); break;
    case TL.TREE: noise('#68b858', ['#5aa84c'], 8, 4); px(6, 11, 4, 5, '#7a4a28'); px(3, 2, 10, 10, '#2e7a34'); px(2, 4, 12, 6, '#2e7a34'); px(4, 1, 8, 2, '#3a9040'); px(4, 3, 3, 3, '#4cae52'); px(9, 6, 3, 2, '#256a2c'); px(5, 9, 6, 2, '#256a2c'); break;
    case TL.WATER: px(0, 0, 16, 16, '#4a86d8'); for (let i = 0; i < 4; i++) { const o = (frame * 3 + i * 5) % 16; px(o % 14, (i * 4 + 2) % 16, 3, 1, '#7ab0f4'); } px(0, 0, 16, 1, '#5a98e8'); break;
    case TL.FLOWER: noise('#68b858', ['#5aa84c', '#78c868'], 10, 5); px(3, 4, 2, 2, '#f4f4f4'); px(3, 3, 2, 1, '#f0d040'); px(10, 9, 2, 2, '#ee6a8a'); px(10, 8, 2, 1, '#f0d040'); px(6, 12, 2, 2, '#f4f4f4'); break;
    case TL.FENCE: noise('#68b858', ['#5aa84c'], 8, 6); px(0, 6, 16, 2, '#c8a070'); px(0, 11, 16, 2, '#c8a070'); px(1, 4, 2, 11, '#a07848'); px(13, 4, 2, 11, '#a07848'); px(7, 4, 2, 11, '#a07848'); break;
    case TL.SIGN: noise('#68b858', ['#5aa84c'], 8, 7); px(7, 9, 2, 6, '#7a4a28'); px(2, 2, 12, 8, '#d8a860'); px(2, 2, 12, 1, '#a07040'); px(4, 4, 8, 1, '#7a4a28'); px(4, 6, 6, 1, '#7a4a28'); break;
    case TL.ROOF_R: case TL.ROOF_B: case TL.ROOF_G: case TL.ROOF_Y: case TL.ROOF_P: {
      const col = { [TL.ROOF_R]: ['#d04a3a', '#a83228', '#e86a58'], [TL.ROOF_B]: ['#3a62c8', '#284a9c', '#6a8ce0'], [TL.ROOF_G]: ['#3aa05a', '#2a7c44', '#62c07a'], [TL.ROOF_Y]: ['#e0b830', '#b88c20', '#f4d868'], [TL.ROOF_P]: ['#9a62c8', '#7a46a0', '#b888e0'] }[id];
      px(0, 0, 16, 16, col[0]); for (let y = 0; y < 16; y += 4) px(0, y + 3, 16, 1, col[1]); for (let y = 0; y < 16; y += 4) for (let x = (y / 4 % 2) * 4; x < 16; x += 8) px(x, y, 1, 3, col[1]); px(0, 0, 16, 1, col[2]); break; }
    case TL.WALL: px(0, 0, 16, 16, '#f0e8d0'); px(0, 0, 16, 1, '#d8c8a8'); px(0, 15, 16, 1, '#b8a888'); for (let y = 4; y < 16; y += 5) px(0, y, 16, 1, '#e0d4b8'); break;
    case TL.WIN: px(0, 0, 16, 16, '#f0e8d0'); px(2, 2, 12, 10, '#37406a'); px(3, 3, 10, 8, '#8cc8f0'); px(3, 3, 4, 3, '#cfeaff'); px(7, 3, 1, 8, '#37406a'); px(3, 7, 10, 1, '#37406a'); px(1, 12, 14, 2, '#a89878'); break;
    case TL.DOOR: px(0, 0, 16, 16, '#f0e8d0'); px(3, 1, 10, 15, '#7a4a28'); px(4, 2, 8, 14, '#9a6234'); px(10, 9, 2, 2, '#f0d040'); px(3, 1, 10, 1, '#5a341c'); break;
    case TL.FLOOR: px(0, 0, 16, 16, '#e8d4a8'); px(0, 7, 16, 1, '#d4bc88'); px(0, 15, 16, 1, '#d4bc88'); px(7, 0, 1, 8, '#d4bc88'); px(15, 8, 1, 8, '#d4bc88'); break;
    case TL.CARPET: px(0, 0, 16, 16, '#d84a52'); px(0, 0, 16, 1, '#a8323a'); px(0, 15, 16, 1, '#a8323a'); px(1, 1, 14, 1, '#ec7078'); break;
    case TL.COUNTER: px(0, 0, 16, 16, '#e8d4a8'); px(0, 4, 16, 12, '#b0703c'); px(0, 4, 16, 2, '#d49a5c'); px(0, 14, 16, 2, '#7a4a28'); break;
    case TL.PC: px(0, 0, 16, 16, '#e8d4a8'); px(2, 1, 12, 9, '#3a4466'); px(3, 2, 10, 7, '#6ad0f0'); px(4, 3, 4, 2, '#cff4ff'); px(1, 10, 14, 5, '#8a92a8'); px(3, 12, 10, 1, '#5a6278'); break;
    case TL.SHELF: px(0, 0, 16, 16, '#9a6234'); px(0, 5, 16, 1, '#6a4020'); px(0, 11, 16, 1, '#6a4020'); [['#e44', 2, 1], ['#48e', 6, 1], ['#4c4', 10, 1], ['#ec4', 3, 7], ['#e8e', 8, 7], ['#4cc', 12, 7]].forEach(a => px(a[1], a[2] + (a[2] ? 0 : 1), 3, 4, a[0])); px(0, 14, 16, 2, '#6a4020'); break;
    case TL.TABLE: px(0, 0, 16, 16, '#e8d4a8'); px(1, 4, 14, 8, '#c4883c'); px(1, 4, 14, 2, '#e4a860'); px(2, 12, 2, 4, '#7a4a28'); px(12, 12, 2, 4, '#7a4a28'); break;
    case TL.WALLI: px(0, 0, 16, 16, '#6a78b0'); px(0, 12, 16, 4, '#4a5688'); px(0, 11, 16, 1, '#8a98d0'); for (let x = 0; x < 16; x += 8) px(x, 0, 1, 11, '#5a68a0'); break;
    case TL.WALL_D: px(0, 0, 16, 16, '#4a4a58'); px(0, 0, 16, 2, '#6a6a7c'); px(0, 8, 16, 1, '#3a3a46'); break;
    case TL.CAVE: noise('#8a7a64', ['#7a6a56', '#9a8a74', '#74644e'], 22, 8); break;
    case TL.CAVEWALL: px(0, 0, 16, 16, '#4a4036'); px(0, 0, 16, 5, '#5e5244'); for (let i = 0; i < 6; i++) px(Math.floor(hash(i, 3, 3) * 14), Math.floor(hash(i, 4, 3) * 14), 3, 2, '#3a322a'); px(0, 14, 16, 2, '#322a22'); break;
    case TL.ROCK: noise('#8a7a64', ['#7a6a56'], 8, 9); px(2, 5, 12, 9, '#6a6258'); px(3, 3, 9, 6, '#8a8276'); px(4, 4, 4, 2, '#a8a094'); px(2, 12, 12, 2, '#4a443c'); break;
    case TL.GYMFLOOR: px(0, 0, 16, 16, '#7a82a8'); px(0, 0, 8, 8, '#6a7298'); px(8, 8, 8, 8, '#6a7298'); break;
    case TL.STATUE: px(0, 0, 16, 16, '#7a82a8'); px(3, 12, 10, 3, '#a8a8b8'); px(5, 3, 6, 10, '#c8c8d8'); px(6, 1, 4, 4, '#d8d8e8'); px(7, 5, 2, 2, '#e0e0f0'); break;
    case TL.BALLS: px(0, 0, 16, 16, '#e8d4a8'); px(0, 8, 16, 8, '#b0703c'); px(0, 8, 16, 2, '#d49a5c'); [3, 8, 13].forEach(x => { px(x - 2, 3, 5, 3, '#e44'); px(x - 2, 6, 5, 3, '#f4f4f4'); px(x - 2, 5, 5, 1, '#222'); px(x, 5, 1, 2, '#222'); }); break;
    case TL.PLANT: px(0, 0, 16, 16, '#e8d4a8'); px(5, 9, 6, 6, '#c4683c'); px(3, 2, 10, 8, '#3aa05a'); px(5, 1, 6, 3, '#5ac07a'); px(2, 5, 3, 3, '#2a7c44'); break;
    case TL.CUP: px(0, 0, 16, 16, '#e8d4a8'); px(1, 8, 14, 7, '#c4883c'); px(1, 8, 14, 2, '#e4a860'); px(5, 2, 6, 7, '#f4f4f8'); px(5, 2, 6, 1, '#d0d0d8'); px(11, 4, 3, 3, '#f4f4f8'); px(12, 5, 1, 1, '#e8d4a8'); px(6, 3, 4, 1, '#9a6234'); px(7, 0, 1, 2, '#ddd'); px(9, 0, 1, 2, '#ddd'); break;
    case TL.MAT: px(0, 0, 16, 16, '#e8d4a8'); px(0, 4, 16, 8, '#d84a52'); px(0, 4, 16, 1, '#ec7078'); break;
    case TL.HEAL: px(0, 0, 16, 16, '#e8d4a8'); px(1, 5, 14, 10, '#8a92a8'); px(2, 3, 12, 4, '#cfd6e8'); [3, 6, 9, 12].forEach((x, i) => px(x, 4, 2, 2, (frame + i) % 4 === 0 ? '#f8e048' : '#e84a5a')); break;
    case TL.BOOKS: px(0, 0, 16, 16, '#7a4a28'); px(0, 5, 16, 1, '#5a341c'); px(0, 11, 16, 1, '#5a341c'); for (let r = 0; r < 3; r++) for (let x = 1; x < 15; x += 3) px(x, r * 5 + 1, 2, 4, ['#c44', '#44c', '#4a4', '#cc4'][(x + r) % 4]); break;
    case TL.LEDGE: noise('#68b858', ['#5aa84c'], 8, 11); px(0, 8, 16, 4, '#a8c878'); px(0, 11, 16, 1, '#6a8c48'); break;
    case TL.BRIDGE: px(0, 0, 16, 16, '#4a86d8'); px(0, 2, 16, 12, '#b88850'); for (let x = 0; x < 16; x += 4) px(x, 2, 1, 12, '#8a6234'); break;
    default: px(0, 0, 16, 16, '#f0f');
  }
}

// ---------- personajes (16x20 px) ----------
function drawChar(g, dir, frame, p) {
  const px = (x, y, w, h, c) => { g.fillStyle = c; g.fillRect(x, y, w, h); };
  const sk = p.skin || '#f5d0a8', hair = p.hair || '#3a2a20', shirt = p.shirt || '#c44', pants = p.pants || '#37406a', hat = p.hat, shoe = '#2a2a34';
  const step = frame === 1 ? 1 : frame === 2 ? -1 : 0;
  px(4, 18, 8, 1, 'rgba(0,0,0,.25)');
  if (dir === 'left' || dir === 'right') {
    const f = dir === 'right' ? 1 : -1, c = 8;
    px(c - 2, 14 + (step > 0 ? -1 : 0), 2, 4 - (step > 0 ? 0 : 0), pants); px(c, 14 + (step < 0 ? -1 : 0), 2, 4, pants);
    px(c - 2, 17, 2, 1, shoe); px(c, 17, 2, 1, shoe);
    px(c - 3, 8, 6, 7, shirt); if (p.coat) px(c - 3, 8, 6, 7, p.coat);
    px(c - 1 + f, 9, 2, 5, sk === shirt ? shirt : shirt); px(c - 1 + f, 12, 2, 2, sk);
    px(c - 3, 1, 6, 7, sk); px(c - 3 - (f > 0 ? 0 : 0), 1, 6, 3, hair); px(c - 3, 1, f > 0 ? 3 : 3, 6, hair); px(c + (f > 0 ? 1 : -2), 4, 1, 2, '#222');
    if (hat) { px(c - 4, 0, 8, 3, hat); px(c + (f > 0 ? 2 : -6), 2, 4, 1, hat); }
    return;
  }
  const lf = step > 0 ? 1 : 0, rt = step < 0 ? 1 : 0;
  px(5, 14 - lf, 3, 4 + lf, pants); px(8, 14 - rt, 3, 4 + rt, pants); px(5, 17, 3, 1, shoe); px(8, 17, 3, 1, shoe);
  px(4, 8, 8, 7, shirt); if (p.coat) { px(4, 8, 8, 7, p.coat); px(7, 8, 2, 7, shirt); }
  px(3, 9, 1, 4, shirt); px(12, 9, 1, 4, shirt); px(3, 13, 1, 1, sk); px(12, 13, 1, 1, sk);
  px(4, 1, 8, 7, sk);
  if (dir === 'down') {
    px(4, 1, 8, 3, hair); px(4, 3, 1, 3, hair); px(11, 3, 1, 3, hair); if (p.long) { px(3, 3, 1, 7, hair); px(12, 3, 1, 7, hair); }
    px(5, 5, 2, 2, '#fff'); px(9, 5, 2, 2, '#fff'); px(6, 5, 1, 2, '#222'); px(9, 5, 1, 2, '#222');
    if (hat) { px(3, 0, 10, 3, hat); px(3, 3, 10, 1, hat); px(5, 3, 6, 1, 'rgba(0,0,0,.25)'); }
  } else {
    px(4, 1, 8, 6, hair); if (p.long) { px(3, 2, 1, 8, hair); px(12, 2, 1, 8, hair); px(4, 7, 8, 3, hair); }
    if (hat) { px(3, 0, 10, 5, hat); }
  }
}
Art.charKey = p => JSON.stringify(p);
Art.char = function (p) {
  const key = Art.charKey(p);
  if (Art.chars[key]) return Art.chars[key];
  const out = {};
  for (const d of ['down', 'up', 'left', 'right']) { out[d] = []; for (let f = 0; f < 3; f++) { const [c, g] = mkc(16, 20); drawChar(g, d, f, p); out[d].push(c); } }
  Art.chars[key] = out; return out;
};
const SKINS = ['#f5d0a8', '#e8b88a', '#c98e62', '#f8dcc0'];
const HAIRC = ['#3a2a20', '#6a4228', '#d8b050', '#b84a28', '#2a3a8a', '#e8e8ec', '#3a8a4a', '#e888b0'];
const SHIRTC = ['#dc3232', '#3c64dc', '#3cb45a', '#f0d23c', '#9650c8', '#f08c28', '#f0f0f0', '#28282e'];
const NPC_STYLES = {
  villager: () => ({ shirt: '#5a9ad8', hair: '#5a4030', pants: '#6a5a40' }),
  kid: () => ({ shirt: '#f0c830', hair: '#a06030', pants: '#3a5aa0', hat: '#e84a3a' }),
  oldman: () => ({ shirt: '#8a7a68', hair: '#e8e8ec', pants: '#5a4a38' }),
  girl: () => ({ shirt: '#e868a0', hair: '#c88030', pants: '#8a4a8a', long: true }),
  nurse: () => ({ shirt: '#f8f0f4', hair: '#f08cb4', pants: '#f8f0f4', long: true, hat: '#f8f0f4' }),
  clerk: () => ({ shirt: '#3a62c8', hair: '#3a2a20', pants: '#2a3a6a', hat: '#3a62c8' }),
  oak: () => ({ shirt: '#e8e8ee', hair: '#a8a8b0', pants: '#6a5a40', coat: '#eeeef4' }),
  rival: () => ({ shirt: '#6a3ab8', hair: '#8a5a30', pants: '#2a2a4a' }),
  leader: () => ({ shirt: '#c85a30', hair: '#2a2018', pants: '#3a3028', coat: '#c85a30' }),
  e4: () => ({ shirt: '#38384c', hair: '#c8c8d8', pants: '#28283a', coat: '#4a3a7a' }),
  rocket: () => ({ shirt: '#26262e', hair: '#3a3a44', pants: '#26262e', hat: '#26262e' }),
  hiker: () => ({ shirt: '#a07a3a', hair: '#4a3020', pants: '#5a4a30', hat: '#c8a850' }),
  swimmer: () => ({ shirt: '#3ab0d8', hair: '#2a2a50', pants: '#3ab0d8' }),
  mystic: () => ({ shirt: '#6a3a8a', hair: '#e8e8f0', pants: '#4a2a6a', long: true }),
  scientist: () => ({ shirt: '#e8e8ee', hair: '#3a5a8a', pants: '#3a3a4a', coat: '#f0f0f6' }),
  ninja: () => ({ shirt: '#4a2a5a', hair: '#26202e', pants: '#4a2a5a', hat: '#4a2a5a' }),
  fighter: () => ({ shirt: '#f0f0f0', hair: '#2a2018', pants: '#e0e0e8' }),
  hero: () => ({ shirt: '#dc3232', hair: '#3a2a20', pants: '#37406a', hat: '#dc3232' })
};
Art.npc = type => Art.char((NPC_STYLES[type] || NPC_STYLES.villager)());
Art.player = look => Art.char({ shirt: SHIRTC[look[1] % 8], hair: HAIRC[look[2] % 8], pants: '#37406a', hat: SHIRTC[look[0] % 8] });

Art.init = function () {
  for (let i = 0; i < NTILES; i++) { const [c, g] = mkc(16, 16); drawTile(i, g, 0); Art.tiles[i] = c; }
  for (let f = 0; f < 4; f++) { const [c, g] = mkc(16, 16); drawTile(TL.WATER, g, f); Art.water[f] = c; }
  Art.heal = []; for (let f = 0; f < 4; f++) { const [c, g] = mkc(16, 16); drawTile(TL.HEAL, g, f); Art.heal[f] = c; }
  Art.ready = true;
};
Art.tile = function (id, frame) { if (id === TL.WATER) return Art.water[(frame >> 4) & 3]; return Art.tiles[id]; };
