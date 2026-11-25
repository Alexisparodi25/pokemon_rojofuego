'use strict';
// =====================================================================
//  Mapas de Kanto: generados por código (pueblos, rutas, bosque, cuevas, interiores)
//  Los 18 mapas exteriores (o0..o17) siguen el orden de las zonas del motor.
// =====================================================================
const MW = 24;                       // ancho de todos los mapas exteriores
const KIND = ['town', 'route', 'town', 'forest', 'town', 'cave', 'town', 'route', 'town', 'cave', 'town', 'town', 'town', 'town', 'town', 'town', 'cave', 'liga'];
const MAPNAME = ['Pueblo Paleta', 'Ruta 1', 'Ciudad Verde', 'Bosque Verde', 'Ciudad Plateada', 'Monte Luna', 'Ciudad Celeste', 'Ruta 5-8', 'Ciudad Carmín', 'Cueva Roca', 'Pueblo Lavanda', 'Ciudad Azulona', 'Ciudad Fucsia', 'Ciudad Azafrán', 'Isla Canela', 'Ciudad Verde (Gimnasio)', 'Calle Victoria', 'Liga Pokémon'];

function newMap(id, w, h, fill, extra) {
  return Object.assign({ id, w, h, t: new Uint8Array(w * h).fill(fill), npcs: [], warps: [], signs: {}, doors: {}, indoor: false, enc: null, place: 0, name: '' }, extra || {});
}
const setT = (m, x, y, t) => { if (x >= 0 && y >= 0 && x < m.w && y < m.h) m.t[y * m.w + x] = t; };
const getT = (m, x, y) => (x < 0 || y < 0 || x >= m.w || y >= m.h) ? TL.TREE : m.t[y * m.w + x];
function rect(m, x, y, w, h, t) { for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) setT(m, x + i, y + j, t); }
function addNpc(m, n) { m.npcs.push(Object.assign({ dir: 'down', type: 'villager', lines: ['...'] }, n)); return n; }

// edificio de w baldosas de ancho: 2 filas de tejado + 1 de pared con puerta en la mitad; devuelve la puerta
function building(m, x, y, w, roof, door, kind) {
  rect(m, x, y, w, 2, roof); rect(m, x, y + 2, w, 1, TL.WALL);
  for (let i = 1; i < w - 1; i += 2) if (x + i !== x + (w >> 1)) setT(m, x + i, y + 2, TL.WIN);
  const dx = x + (w >> 1), dy = y + 2; setT(m, dx, dy, TL.DOOR);
  m.doors[kind] = [dx, dy];
  if (door) m.warps.push(Object.assign({ x: dx, y: dy }, door));
  return [dx, dy];
}
function pathV(m, x, y0, y1) { for (let y = y0; y <= y1; y++) { setT(m, x, y, TL.PATH); } }
function pathH(m, y, x0, x1) { for (let x = Math.min(x0, x1); x <= Math.max(x0, x1); x++) setT(m, x, y, TL.PATH); }
function treeBorder(m, openTop, openBot) {
  for (let y = 0; y < m.h; y++) for (let x = 0; x < m.w; x++) {
    const edge = x < 2 || x >= m.w - 2 || y < 2 || y >= m.h - 2;
    if (!edge) continue;
    const open = x >= 10 && x <= 13 && ((y < 2 && openTop) || (y >= m.h - 2 && openBot));
    if (!open) setT(m, x, y, TL.TREE);
  }
}

const FLAVOR = [
  ['¡Bienvenido a {n}!', 'Dicen que los Pokémon se vuelven gigantes con el Dinamax.', 'Un Pokémon con su piedra mega equipada puede megaevolucionar.'],
  ['Mi Pokémon es muy fuerte. ¡Entrenamos todos los días!', 'En el Centro Pokémon hay una taza con caramelos... ¡no se lo digas a nadie!'],
  ['Cuidado con la hierba alta: ¡hay Pokémon salvajes!', 'Mira «Ayuda» en el menú si tienes dudas.', 'Los líderes de gimnasio son muy duros. ¡Prepara a tu equipo!'],
  ['Yo prefiero los Pokémon de tipo Agua.', 'Una vez vi un Pokémon Gigamax. ¡Era enorme!', 'El tope de nivel te impide subir más allá del as del próximo jefe.'],
  ['¿Has probado a poner apodos a tus Pokémon?', 'Los objetos equipados cambian mucho los combates.', 'No olvides guardar la partida desde el menú.']
];
function flavor(m, i, name) { const pool = FLAVOR[i % FLAVOR.length]; return pool.map(s => s.replace('{n}', name)); }

// ------------------------------------------------------------------ exteriores
function outdoor(i) {
  const info = E('placeInfo', i);
  const kind = KIND[i];
  const rnd = mulberry(1000 + i * 77);
  const m = newMap('o' + i, MW, kind === 'town' || i === 0 ? 20 : kind === 'liga' ? 46 : 38, TL.GRASS, { place: i, name: MAPNAME[i], info, kind });
  const trainers = info.trainers;
  if (i === 0) pallet(m, info);
  else if (kind === 'town') town(m, info, rnd);
  else if (kind === 'liga') liga(m, info, rnd);
  else wild(m, info, rnd, kind);
  // salidas
  m.exits = { north: i < 17 ? 'o' + (i + 1) : null, south: i > 0 ? 'o' + (i - 1) : null };
  // entrenadores de ruta
  const spots = m.trainerSpots || [];
  trainers.forEach((t, k) => { const s = spots[k]; if (s) addNpc(m, { x: s.x, y: s.y, dir: s.dir, type: trainerType(t.cls), trainer: t.i, name: t.name, sight: 4 }); });
  return m;
}
function trainerType(cls) {
  return ({ 'Cría': 'kid', 'Cazabichos': 'kid', 'Excursionista': 'hiker', 'Montañero': 'hiker', 'Nadadora': 'swimmer', 'Marinero': 'swimmer', 'Lanzador': 'villager', 'Mago': 'mystic', 'Médium': 'mystic',
    'Pícnic': 'girl', 'Chica': 'girl', 'Rocket': 'rocket', 'Científico': 'scientist', 'Ninja': 'ninja', 'Quemador': 'e4', 'Entrenador': 'fighter' })[cls] || 'villager';
}

function town(m, info, rnd) {
  const i = m.place, hasGym = info.boss && info.boss.badge, rival = info.boss && !info.boss.badge;
  treeBorder(m, true, true);
  // flores y detalles
  for (let k = 0; k < 26; k++) { const x = 2 + Math.floor(rnd() * 20), y = 2 + Math.floor(rnd() * 16); if (getT(m, x, y) === TL.GRASS) setT(m, x, y, TL.FLOWER); }
  pathV(m, 11, 0, 19); pathV(m, 12, 0, 19); pathH(m, 10, 3, 20); pathH(m, 16, 4, 20);
  const door = (to, tx, ty) => ({ to, tx, ty, dir: 'up' });
  // L1: gimnasio (o casa), R1: Centro Pokémon, R2: tienda, L2: casa
  let L1;
  if (hasGym) L1 = building(m, 2, 4, 7, TL.ROOF_Y, door('g' + i, 6, 12), 'gym'); else L1 = building(m, 3, 4, 5, TL.ROOF_P, null, 'house');
  pathV(m, L1[0], L1[1] + 1, 9);
  if (info.center) { const d = building(m, 15, 4, 5, TL.ROOF_R, door('c' + i, 6, 7), 'center'); pathV(m, d[0], d[1] + 1, 9); }
  else { const d = building(m, 15, 4, 5, TL.ROOF_G, null, 'house'); pathV(m, d[0], d[1] + 1, 9); }
  if (info.shop) { const d = building(m, 15, 12, 5, TL.ROOF_B, door('m' + i, 4, 5), 'mart'); pathV(m, d[0], d[1] + 1, 16); }
  else building(m, 15, 12, 5, TL.ROOF_P, null, 'house2');
  building(m, 3, 12, 5, TL.ROOF_R, null, 'house3'); pathV(m, 5, 15, 16);
  // cartel y adornos
  setT(m, 10, 12, TL.SIGN); m.signs[12 * m.w + 10] = MAPNAME[i] + ': ' + (info.desc || '');
  for (let x = 9; x <= 14; x++) if (getT(m, x, 18) === TL.GRASS) setT(m, x, 18, TL.FLOWER);
  rect(m, 9, 7, 2, 2, TL.FLOWER); rect(m, 13, 7, 2, 2, TL.FLOWER);
  m.trainerSpots = [{ x: 8, y: 11, dir: 'right' }, { x: 19, y: 11, dir: 'left' }, { x: 10, y: 15, dir: 'right' }];
  addNpc(m, { x: 13, y: 9, dir: 'left', type: 'villager', lines: flavor(m, i, MAPNAME[i]) });
  addNpc(m, { x: 9, y: 17, dir: 'right', type: i % 2 ? 'girl' : 'oldman', lines: flavor(m, i + 2, MAPNAME[i]) });
  if (rival) addNpc(m, { x: 11, y: 6, dir: 'down', type: 'rival', boss: true, name: info.boss.name, sight: 5 });
  if (info.encounter !== false) { /* los pueblos no tienen hierba: la hierba alta sólo en rutas */ }
  // un parche de hierba alta al lado del pueblo para poder combatir
  rect(m, 3, 17, 4, 1, TL.TALL); rect(m, 18, 17, 3, 1, TL.TALL);
  m.enc = 'grass';
}

function pallet(m, info) {
  treeBorder(m, true, false); rect(m, 0, 18, MW, 2, TL.WATER); rect(m, 2, 16, 20, 2, TL.SAND);
  for (let y = 16; y < 18; y++) for (let x = 2; x < 22; x++) setT(m, x, y, TL.SAND);
  pathV(m, 11, 0, 15); pathV(m, 12, 0, 15); pathH(m, 11, 4, 19);
  const L = building(m, 3, 6, 5, TL.ROOF_R, null, 'home'), R = building(m, 16, 6, 5, TL.ROOF_B, null, 'rivalhouse');
  const lab = building(m, 8, 12, 8, TL.ROOF_G, { to: 'lab', tx: 5, ty: 7, dir: 'up' }, 'lab');
  setT(m, 10, 15, TL.PATH); pathV(m, lab[0], lab[1] + 1, 15);
  pathV(m, L[0], L[1] + 1, 11); pathV(m, R[0], R[1] + 1, 11);
  setT(m, 9, 9, TL.SIGN); m.signs[9 * m.w + 9] = 'PUEBLO PALETA — Tu aventura comienza aquí.';
  setT(m, 14, 9, TL.SIGN); m.signs[9 * m.w + 14] = 'LABORATORIO DEL PROFESOR OAK (al sur).';
  for (let k = 0; k < 18; k++) { const x = 3 + (k * 7) % 18, y = 3 + (k * 5) % 10; if (getT(m, x, y) === TL.GRASS) setT(m, x, y, TL.FLOWER); }
  addNpc(m, { x: 10, y: 8, dir: 'right', type: 'girl', lines: ['¡Dicen que el Profesor Oak te espera en su laboratorio!', 'Sin un Pokémon no puedes salir del pueblo: la hierba alta es peligrosa.'] });
  m.trainerSpots = [];
  m.gateText = null; m.enc = null;
}

function wild(m, info, rnd, kind) {
  const H = m.h, cave = kind === 'cave', forest = kind === 'forest';
  m.fillAll = cave ? TL.CAVE : TL.GRASS; m.t.fill(cave ? TL.CAVE : TL.GRASS);
  const ph = rnd() * 6;
  const cx = y => { const env = Math.min(1, y / 5, (H - 1 - y) / 5); return 11 + Math.round(Math.sin(y * 0.33 + ph) * 4 * Math.max(0, env)); };
  if (cave) {
    for (let y = 0; y < H; y++) for (let x = 0; x < m.w; x++) { const edge = x < 3 || x >= m.w - 3 || y < 2 || y >= H - 2; if (edge && !(x >= 10 && x <= 13 && (y < 2 || y >= H - 2))) setT(m, x, y, TL.CAVEWALL); }
    for (let k = 0; k < 60; k++) { const x = 3 + Math.floor(rnd() * 18), y = 3 + Math.floor(rnd() * (H - 6)); if (Math.abs(x - cx(y)) > 2) { setT(m, x, y, TL.ROCK); if (rnd() < .5) setT(m, x + 1, y, TL.ROCK); } }
  } else {
    treeBorder(m, true, true);
    const dens = forest ? .42 : .1;
    for (let y = 2; y < H - 2; y++) for (let x = 2; x < m.w - 2; x++) if (Math.abs(x - cx(y)) > (forest ? 2 : 3) && rnd() < dens) setT(m, x, y, TL.TREE);
    for (let k = 0; k < (forest ? 16 : 9); k++) { const w = 4 + Math.floor(rnd() * 4), h = 3 + Math.floor(rnd() * 3), x = 2 + Math.floor(rnd() * (m.w - 4 - w)), y = 3 + Math.floor(rnd() * (H - 8)); if (Math.abs(x + w / 2 - cx(y)) < 12) rect(m, x, y, w, h, TL.TALL); }
    if (!forest && kind === 'route') { const wy = 8 + Math.floor(rnd() * (H - 16)), wx = cx(wy) > 11 ? 3 : 17; rect(m, wx, wy, 4, 3, TL.WATER); }
    for (let k = 0; k < 14; k++) { const x = 2 + Math.floor(rnd() * 20), y = 2 + Math.floor(rnd() * (H - 4)); if (getT(m, x, y) === TL.GRASS) setT(m, x, y, TL.FLOWER); }
  }
  for (let y = 0; y < H; y++) { const a = cx(y), b = cx(Math.min(H - 1, y + 1)); for (let x = Math.min(a, b); x <= Math.max(a, b) + 1; x++) setT(m, x, y, cave ? TL.CAVE : TL.PATH); }
  if (cave) { for (let y = 0; y < H; y++) { setT(m, cx(y) - 1, y, TL.CAVE); setT(m, cx(y) + 2, y, TL.CAVE); } }
  // carteles en los extremos
  const sy = H - 4; if (!cave) { setT(m, cx(sy) - 2, sy, TL.SIGN); m.signs[sy * m.w + cx(sy) - 2] = MAPNAME[m.place] + ' — ' + (info.desc || ''); }
  // puestos de entrenadores a ambos lados del camino
  const spots = []; const n = 3;
  for (let k = 0; k < n; k++) { const y = 7 + Math.floor((H - 14) * (k + .5) / n); const side = k % 2 ? 1 : -1; let x = cx(y) + (side > 0 ? 5 : -4); x = Math.max(3, Math.min(m.w - 4, x)); setT(m, x, y, cave ? TL.CAVE : TL.GRASS); spots.push({ x, y, dir: side > 0 ? 'left' : 'right' }); }
  m.trainerSpots = spots;
  m.enc = cave ? 'cave' : 'grass';
  m.cx = cx;
  if (info.boss && !info.boss.badge) { const by = Math.floor(H * 0.3); addNpc(m, { x: cx(by), y: by, dir: 'down', type: 'rival', boss: true, name: info.boss.name, sight: 5 }); setT(m, cx(by), by, cave ? TL.CAVE : TL.PATH); }
}

function liga(m, info, rnd) {
  const H = m.h; m.t.fill(TL.GYMFLOOR);
  for (let y = 0; y < H; y++) for (let x = 0; x < m.w; x++) if (x < 7 || x >= m.w - 7 || y < 2) setT(m, x, y, TL.WALL_D);
  for (let y = 0; y < H; y++) { setT(m, 7, y, TL.WALL_D); setT(m, m.w - 8, y, TL.WALL_D); }
  rect(m, 9, 0, 6, H, TL.CARPET);
  for (let k = 0; k < 5; k++) { const y = 6 + k * 8; rect(m, 8, y - 1, 8, 1, TL.STATUE); setT(m, 11, y - 1, TL.CARPET); setT(m, 12, y - 1, TL.CARPET); setT(m, 8, y + 2, TL.STATUE); setT(m, 15, y + 2, TL.STATUE); }
  m.t.fill(TL.GYMFLOOR, 0, 0);
  // reconstrucción limpia: pasillo central de 6 de ancho entre muros
  m.t.fill(TL.WALL_D);
  rect(m, 9, 0, 6, H, TL.GYMFLOOR); rect(m, 11, 0, 2, H, TL.CARPET);
  for (let k = 0; k < 5; k++) { const y = 5 + k * 8; rect(m, 9, y, 2, 1, TL.STATUE); rect(m, 13, y, 2, 1, TL.STATUE); }
  setT(m, 11, H - 1, TL.CARPET); setT(m, 12, H - 1, TL.CARPET);
  const keys = info.chain || [];
  keys.forEach((c, k) => addNpc(m, { x: 11, y: 8 + k * 8 - 2 + 0, dir: 'down', type: k < 4 ? 'e4' : 'rival', boss: true, bossKey: c.key, name: c.name, sight: 4 }));
  // el último (campeón) arriba; los NPC de boss se colocan cada 8 filas empezando desde abajo
  m.npcs.forEach((n, k) => { n.y = H - 6 - k * 8; });
  m.trainerSpots = [];
  m.enc = null;
  // sin hierba; entrada por abajo
}

// ------------------------------------------------------------------ interiores
function interiorCenter(i) {
  const o = Maps.get('o' + i), m = newMap('c' + i, 12, 9, TL.FLOOR, { indoor: true, place: i, name: 'Centro Pokémon' });
  rect(m, 0, 0, 12, 2, TL.WALLI);
  rect(m, 3, 3, 6, 1, TL.COUNTER); setT(m, 10, 1, TL.PC); setT(m, 2, 2, TL.CUP); setT(m, 1, 7, TL.PLANT); setT(m, 10, 7, TL.PLANT);
  rect(m, 5, 4, 2, 4, TL.CARPET); setT(m, 5, 8, TL.MAT); setT(m, 6, 8, TL.MAT);
  setT(m, 8, 2, TL.HEAL);
  const d = o.doors.center;
  m.warps.push({ x: 5, y: 8, to: 'o' + i, tx: d[0], ty: d[1] + 1, dir: 'down' }, { x: 6, y: 8, to: 'o' + i, tx: d[0], ty: d[1] + 1, dir: 'down' });
  addNpc(m, { x: 5, y: 2, dir: 'down', type: 'nurse', role: 'nurse', name: 'Enfermera Joy', lines: [] });
  m.objects = { [2 + 2 * 12]: 'cup', [10 + 1 * 12]: 'pc', [8 + 2 * 12]: 'heal' };
  m.spawn = [6, 7];
  addNpc(m, { x: 9, y: 5, dir: 'left', type: 'kid', lines: ['El PC guarda a tus Pokémon de la caja. ¡Y el cementerio, si juegas Nuzlocke!', 'La taza de la esquina siempre tiene algo rico...'] });
  return m;
}
function interiorMart(i) {
  const o = Maps.get('o' + i), m = newMap('m' + i, 9, 7, TL.FLOOR, { indoor: true, place: i, name: 'Tienda Pokémon' });
  rect(m, 0, 0, 9, 1, TL.WALLI); rect(m, 0, 1, 2, 4, TL.SHELF); rect(m, 7, 1, 2, 4, TL.SHELF); rect(m, 3, 2, 3, 1, TL.COUNTER);
  rect(m, 4, 3, 1, 3, TL.CARPET); setT(m, 4, 6, TL.MAT);
  const d = o.doors.mart; m.warps.push({ x: 4, y: 6, to: 'o' + i, tx: d[0], ty: d[1] + 1, dir: 'down' });
  addNpc(m, { x: 4, y: 1, dir: 'down', type: 'clerk', role: 'clerk', name: 'Dependiente', lines: [] });
  m.spawn = [4, 5]; return m;
}
function interiorGym(i) {
  const o = Maps.get('o' + i), info = o.info, m = newMap('g' + i, 13, 14, TL.GYMFLOOR, { indoor: true, place: i, name: 'Gimnasio' });
  rect(m, 0, 0, 13, 2, TL.WALL_D); rect(m, 5, 2, 3, 11, TL.CARPET); setT(m, 5, 13, TL.MAT); setT(m, 6, 13, TL.MAT); setT(m, 7, 13, TL.MAT);
  [[2, 5], [10, 5], [2, 9], [10, 9], [2, 2], [10, 2]].forEach(a => setT(m, a[0], a[1], TL.STATUE));
  const d = o.doors.gym; [5, 6, 7].forEach(x => m.warps.push({ x, y: 13, to: 'o' + i, tx: d[0], ty: d[1] + 1, dir: 'down' }));
  addNpc(m, { x: 6, y: 3, dir: 'down', type: 'leader', boss: true, name: info.boss.name, sight: 5 });
  addNpc(m, { x: 8, y: 11, dir: 'left', type: 'villager', lines: ['¡Ánimo, aspirante! El líder te espera al fondo.', 'Consejo: revisa los tipos de tu equipo antes de entrar.'] });
  m.spawn = [6, 12]; return m;
}
function interiorLab() {
  const o = Maps.get('o0'), m = newMap('lab', 10, 9, TL.FLOOR, { indoor: true, place: 0, name: 'Laboratorio del Prof. Oak' });
  rect(m, 0, 0, 10, 2, TL.WALLI); rect(m, 0, 2, 1, 1, TL.BOOKS); rect(m, 9, 2, 1, 1, TL.BOOKS); rect(m, 1, 1, 2, 1, TL.BOOKS); rect(m, 7, 1, 2, 1, TL.BOOKS);
  rect(m, 3, 3, 4, 1, TL.BALLS); rect(m, 4, 5, 2, 3, TL.CARPET); setT(m, 4, 8, TL.MAT); setT(m, 5, 8, TL.MAT);
  const d = o.doors.lab; [4, 5].forEach(x => m.warps.push({ x, y: 8, to: 'o0', tx: d[0], ty: d[1] + 1, dir: 'down' }));
  setT(m, 1, 6, TL.PLANT); setT(m, 8, 6, TL.PLANT);
  addNpc(m, { x: 5, y: 2, dir: 'down', type: 'oak', role: 'oak', name: 'Prof. Oak', lines: [] });
  m.objects = { [3 + 3 * 10]: 'ball0', [4 + 3 * 10]: 'ball0', [5 + 3 * 10]: 'ball1', [6 + 3 * 10]: 'ball2' };
  m.spawn = [4, 7]; return m;
}

const Maps = {
  cache: {},
  reset() { this.cache = {}; },
  get(id) {
    if (this.cache[id]) return this.cache[id];
    let m;
    if (id === 'lab') m = interiorLab();
    else if (id[0] === 'o') m = outdoor(parseInt(id.slice(1), 10));
    else if (id[0] === 'c') m = interiorCenter(parseInt(id.slice(1), 10));
    else if (id[0] === 'm') m = interiorMart(parseInt(id.slice(1), 10));
    else if (id[0] === 'g') m = interiorGym(parseInt(id.slice(1), 10));
    this.cache[id] = m; return m;
  }
};
