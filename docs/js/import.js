'use strict';
// =====================================================================
//  Importar sprites oficiales: desde el ROM de Rojo Fuego/Verde Hoja (.gba) y desde una carpeta de Pokémon Essentials (Añil)
//  Todo ocurre en tu navegador: los archivos no se suben a ningún sitio. Los PNG se guardan en IndexedDB.
// =====================================================================
const HOENN = 'Treecko Grovyle Sceptile Torchic Combusken Blaziken Mudkip Marshtomp Swampert Poochyena Mightyena Zigzagoon Linoone Wurmple Silcoon Beautifly Cascoon Dustox Lotad Lombre Ludicolo Seedot Nuzleaf Shiftry Nincada Ninjask Shedinja Taillow Swellow Shroomish Breloom Spinda Wingull Pelipper Surskit Masquerain Wailmer Wailord Skitty Delcatty Kecleon Baltoy Claydol Nosepass Torkoal Sableye Barboach Whiscash Luvdisc Corphish Crawdaunt Feebas Milotic Carvanha Sharpedo Trapinch Vibrava Flygon Makuhita Hariyama Electrike Manectric Numel Camerupt Spheal Sealeo Walrein Cacnea Cacturne Snorunt Glalie Lunatone Solrock Azurill Spoink Grumpig Plusle Minun Mawile Meditite Medicham Swablu Altaria Wynaut Duskull Dusclops Roselia Slakoth Vigoroth Slaking Gulpin Swalot Tropius Whismur Loudred Exploud Clamperl Huntail Gorebyss Absol Shuppet Banette Seviper Zangoose Relicanth Aron Lairon Aggron Castform Volbeat Illumise Lileep Cradily Anorith Armaldo Ralts Kirlia Gardevoir Bagon Shelgon Salamence Beldum Metang Metagross Regirock Regice Registeel Kyogre Groudon Rayquaza Latias Latios Jirachi Deoxys Chimecho'.split(' ');

function lz77(rom, off) {
  if (off < 0 || off + 4 >= rom.length || rom[off] !== 0x10) return null;
  const size = rom[off + 1] | rom[off + 2] << 8 | rom[off + 3] << 16;
  if (size <= 0 || size > 1 << 20) return null;
  const out = new Uint8Array(size); let n = 0, p = off + 4;
  while (n < size) {
    const flags = rom[p++];
    for (let bit = 0; bit < 8 && n < size; bit++) {
      if (flags & (0x80 >> bit)) { const b1 = rom[p], b2 = rom[p + 1]; p += 2; const len = (b1 >> 4) + 3, disp = ((b1 & 15) << 8 | b2) + 1; for (let k = 0; k < len && n < size; k++) { out[n] = out[n - disp]; n++; } }
      else out[n++] = rom[p++];
    }
  }
  return out;
}
const u16 = (r, o) => r[o] | r[o + 1] << 8, u32 = (r, o) => (r[o] | r[o + 1] << 8 | r[o + 2] << 16 | r[o + 3] << 24) >>> 0;
function findTables(rom, images) {
  const found = [], n = rom.length;
  for (let i = 0; i + 8 * 400 < n; i += 4) {
    const ptr = u32(rom, i), a = u16(rom, i + 4), b = u16(rom, i + 6);
    if (ptr < 0x08000000 || ptr >= 0x08000000 + n) continue;
    if (images ? !(a === 0x800 && b === 0) : !(a === 0 && b === 0)) continue;
    let ok = true;
    for (let k = 1; k < 40 && ok; k++) { const p2 = u32(rom, i + 8 * k), x = u16(rom, i + 8 * k + 4), y = u16(rom, i + 8 * k + 6); if (p2 < 0x08000000 || p2 >= 0x08000000 + n) ok = false; else if (images ? !(x === 0x800 && y === k) : !(x === k && y === 0)) ok = false; }
    if (ok) { found.push(i); i += 8 * 400 - 4; }
  }
  return found;
}
function decodeRomSprite(tiles, pal) {
  const col = []; for (let i = 0; i < 16; i++) { const c = pal[2 * i] | pal[2 * i + 1] << 8; col.push([(c & 31) * 255 / 31 | 0, (c >> 5 & 31) * 255 / 31 | 0, (c >> 10 & 31) * 255 / 31 | 0, i ? 255 : 0]); }
  const cvs = document.createElement('canvas'); cvs.width = cvs.height = 64; const g = cvs.getContext('2d'), im = g.createImageData(64, 64);
  for (let t = 0; t < 64; t++) { const tx = (t % 8) * 8, ty = (t >> 3) * 8; for (let y = 0; y < 8; y++) for (let x = 0; x < 4; x++) { const by = tiles[t * 32 + y * 4 + x]; [by & 15, by >> 4].forEach((ci, h) => { const o = ((ty + y) * 64 + tx + x * 2 + h) * 4, c = col[ci]; im.data[o] = c[0]; im.data[o + 1] = c[1]; im.data[o + 2] = c[2]; im.data[o + 3] = c[3]; }); } }
  g.putImageData(im, 0, 0); return cvs;
}
const toBlob = c => new Promise(res => c.toBlob(res, 'image/png'));

async function importRom(file) {
  toast('Leyendo el ROM...');
  try {
    const rom = new Uint8Array(await file.arrayBuffer());
    if (rom.length < 0x400000) throw new Error('El archivo no parece un ROM de GBA.');
    const img = findTables(rom, true); let pals = findTables(rom, false).filter(p => { const d = lz77(rom, u32(rom, p) - 0x08000000); return d && d.length === 32; });
    if (img.length < 2 || !pals.length) throw new Error('No encontré las tablas de sprites. Hace falta un ROM de Pokémon Rojo Fuego o Verde Hoja sin modificar.');
    const keys = E('spriteKeys');                                  // [num, clave, id]
    const byNum = {}, byId = {}; keys.forEach(k => { byNum[k[0]] = k[1]; byId[k[2]] = k[1]; });
    const internal = {}; for (let i = 1; i <= 251; i++) if (byNum[i]) internal[i] = byNum[i];
    HOENN.forEach((h, k) => { const key = byId[h.toLowerCase()]; if (key) internal[277 + k] = key; });
    let done = 0; const romKeys = [];
    for (const idx of Object.keys(internal)) {
      const pd = lz77(rom, u32(rom, pals[0] + 8 * idx) - 0x08000000); if (!pd || pd.length < 32) continue;
      for (let t = 0; t < 2; t++) {
        const tiles = lz77(rom, u32(rom, img[t] + 8 * idx) - 0x08000000); if (!tiles || tiles.length < 2048) continue;
        const blob = await toBlob(decodeRomSprite(tiles.slice(0, 2048), pd.slice(0, 32)));
        Sprites.put((t ? 'b_' : 'f_') + internal[idx], blob); romKeys.push((t ? 'b_' : 'f_') + internal[idx]);
      }
      if (++done % 40 === 0) toast('Importando... ' + done + '/' + Object.keys(internal).length);
    }
    try { localStorage.setItem('pf_romkeys', JSON.stringify(romKeys)); } catch (e) { }
    toast('¡Listo! ' + done + ' Pokémon importados del ROM (frente y espalda).');
  } catch (e) { toast('No se pudo importar: ' + e.message); console.error(e); }
}

async function importAnil(files) {
  toast('Leyendo la carpeta...');
  try {
    const rel = f => (f.webkitRelativePath || f.name).replace(/\\/g, '/');
    const formsFile = files.find(f => /\/PBS\/pokemon_forms\.txt$/i.test(rel(f)) || /\/PBS\/pokemonforms\.txt$/i.test(rel(f)));
    const forms = {};
    if (formsFile) {
      let key = null;
      (await formsFile.text()).split(/\r?\n/).forEach(l => { l = l.trim(); const m = l.match(/^\[([A-Za-z0-9_]+)\s*,\s*(\d+)\]/); if (m) { key = m[1].toUpperCase() + '#' + m[2]; forms[key] = {}; } else if (key && !l.startsWith('#')) { const eq = l.indexOf('='); if (eq > 0) forms[key][l.slice(0, eq).trim()] = l.slice(eq + 1).trim(); } });
    }
    let romKeys = new Set(); try { romKeys = new Set(JSON.parse(localStorage.getItem('pf_romkeys') || '[]')); } catch (e) { }
    const pat = /\/Graphics\/Pokemon\/(Front|Back)\/([A-Za-z0-9]+?)(?:_(\d+))?(_female)?\.png$/i;
    const todo = files.map(f => ({ f, m: rel(f).match(pat) })).filter(o => o.m && !o.m[4]);
    let n = 0, seen = new Set();
    for (const o of todo) {
      const side = o.m[1].toLowerCase() === 'front' ? 'f_' : 'b_', name = o.m[2], num = o.m[3] ? +o.m[3] : 0, fi = forms[name.toUpperCase() + '#' + num] || {};
      const key = E('formKey', name, num, fi.FormName || '', fi.MegaStone || '', fi.MegaMove || '');
      if (!key || seen.has(side + key)) continue;
      if (romKeys.has(side + key)) continue;                      // no pisar los oficiales del ROM
      seen.add(side + key);
      const bmp = await createImageBitmap(o.f), w = bmp.width, h = bmp.height, fw = (w >= 2 * h && w % h === 0) ? h : w;   // primer cuadro de las tiras animadas
      const c = document.createElement('canvas'); c.width = fw; c.height = h; c.getContext('2d').drawImage(bmp, 0, 0, fw, h, 0, 0, fw, h);
      Sprites.put(side + key, await toBlob(c)); n++;
      if (n % 100 === 0) toast('Importando... ' + n + ' sprites');
    }
    Sprites.clearRemote();
    toast(n ? '¡Listo! ' + n + ' sprites importados (con megas y formas).' : 'No encontré sprites en esa carpeta (elige la que contiene Graphics y PBS).');
  } catch (e) { toast('No se pudo importar: ' + e.message); console.error(e); }
}
