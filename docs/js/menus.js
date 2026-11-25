'use strict';
// =====================================================================
//  Menús: título, opciones/nueva partida, ayuda, START, equipo, mochila, tienda, PC, Pokédex...
// =====================================================================
const G = { info: null };      // resumen de la partida (se refresca con refreshGame())
function refreshGame() { G.info = E('game'); return G.info; }
const BADGES = ['Roca', 'Cascada', 'Trueno', 'Arcoíris', 'Alma', 'Pantano', 'Volcán', 'Tierra'];

// ---------- guardado ----------
const SaveSys = {
  has() { try { return !!localStorage.getItem('pf_save'); } catch (e) { return false; } },
  save() {
    try {
      const java = E('save');
      localStorage.setItem('pf_save', JSON.stringify({ java, world: World.saveState(), t: Date.now() }));
      return true;
    } catch (e) { console.error(e); return false; }
  },
  load() {
    try {
      const s = JSON.parse(localStorage.getItem('pf_save'));
      const r = E('load', s.java);
      if (r && r.error) return false;
      Maps.reset(); World.loadState(s.world); return true;
    } catch (e) { console.error(e); return false; }
  }
};

// ---------- opciones (nueva partida) ----------
class OptionsScene extends Scene {
  constructor(title, rows) { super(); this.title = title; this.rows = rows; this.sel = 0; this.top = 0; this.visible = 6; this.extra = null; }
  draw() {
    ctx.fillStyle = C.bg; ctx.fillRect(0, 0, W, H);
    T(this.title, 20, 12, { s: 20, b: true, c: C.gold });
    const pw = this.extra ? 300 : 440;
    panel(16, 44, pw, this.visible * 30 + 10);
    for (let i = 0; i < this.visible && this.top + i < this.rows.length; i++) {
      const idx = this.top + i, o = this.rows[idx], y = 49 + i * 30;
      selRow(22, y, pw - 12, 27, idx === this.sel);
      T(o.label, 30, y + 6, { c: idx === this.sel ? C.gold : C.text, s: 13 });
      let v = '', col = C.gold;
      if (o.vals) { const cv = Math.max(0, Math.min(o.vals.length - 1, o.get())); v = (idx === this.sel ? '◄ ' : '') + o.vals[cv] + (idx === this.sel ? ' ►' : ''); if (o.vals.length === 2) col = cv === 1 ? C.green : C.dim; }
      else if (o.display) v = o.display(); else if (o.action) v = '›';
      T(v, 16 + pw - 12, y + 6, { a: 'right', c: col, s: 13 });
    }
    if (this.extra) this.extra();
    const hy = 44 + this.visible * 30 + 16;
    panel(16, hy, 448, H - hy - 22);
    if (this.rows[this.sel]) T(this.rows[this.sel].help || '', 26, hy + 8, { s: 11, c: '#dde', w: 430, lh: 14 });
    T('↑↓ moverse · ←→ cambiar · Z aceptar · X volver', 20, H - 16, { s: 10, c: C.dim });
  }
  key(k) {
    const n = this.rows.length;
    if (k === 'up') this.sel = (this.sel + n - 1) % n; else if (k === 'down') this.sel = (this.sel + 1) % n;
    else if (k === 'b') { Scenes.pop(); if (this.onClose) this.onClose(); return; }
    else {
      const o = this.rows[this.sel];
      if (o.vals && (k === 'left' || k === 'right' || k === 'a')) { const cv = o.get(), m = o.vals.length; o.set(k === 'left' ? (cv + m - 1) % m : (cv + 1) % m); }
      else if (o.action && k === 'a') o.action();
    }
    if (this.sel < this.top) this.top = this.sel; if (this.sel >= this.top + this.visible) this.top = this.sel - this.visible + 1;
  }
}
const tog = (label, help, R, k) => ({ label, help, vals: ['No', 'Sí'], get: () => R[k], set: v => R[k] = v });
const cho = (label, help, vals, R, k) => ({ label, help, vals, get: () => R[k], set: v => R[k] = v });
const CAP_NAMES = ['Rojo', 'Azul', 'Verde', 'Amarillo', 'Morado', 'Naranja', 'Blanco', 'Negro'], HAIR_NAMES = ['Negro', 'Castaño', 'Rubio', 'Pelirrojo', 'Azul', 'Blanco', 'Verde', 'Rosa'];
const serializeRules = R => Object.keys(R).map(k => k + '=' + R[k]).join(',');

function newGameScene() {
  const R = { difficulty: 1, levelCap: 1, battleItems: 1, askNickname: 1, nuzlocke: 0, firstEncounterOnly: 1, dupesClause: 1, permadeath: 1, randomStarters: 0, randomWild: 0, randomTrainers: 0, similarBst: 1, abilities: 0, moves: 0, legendaries: 1 };
  const P = { name: 'Rojo', rival: 'Azul', look: [0, 0, 0] };
  const nuz = () => { const s = new OptionsScene('REGLAS NUZLOCKE', [
    tog('Sólo la primera captura de cada zona', 'Si lo desactivas puedes capturar todos los Pokémon que quieras.', R, 'firstEncounterOnly'),
    tog('Cláusula de duplicados', 'El primer encuentro de una zona nunca es una especie (o línea evolutiva) que ya tengas.', R, 'dupesClause'),
    tog('Los caídos mueren para siempre', 'Si lo desactivas los Pokémon debilitados se curan normalmente.', R, 'permadeath')]); Scenes.push(s); };
  const rnd = () => Scenes.push(new OptionsScene('PERSONALIZAR ALEATORIO', [
    tog('Iniciales aleatorios', 'Los tres Pokémon para elegir al empezar serán aleatorios.', R, 'randomStarters'),
    tog('Pokémon salvajes aleatorios', 'Cualquier especie de cualquier generación puede aparecer en la hierba.', R, 'randomWild'),
    tog('Entrenadores y jefes aleatorios', 'Los equipos de entrenadores, líderes, Alto Mando y rival se sustituyen por Pokémon aleatorios.', R, 'randomTrainers'),
    tog('Fuerza parecida a la original', 'Sí: el Pokémon aleatorio tiene una fuerza parecida a la del original o a la que toca por nivel. No: puede salir cualquier cosa.', R, 'similarBst'),
    cho('Habilidades', 'ORIGINALES: las de cada especie. ALEATORIAS (todas): una al azar de las 318. ALEATORIAS (con efecto): sólo las que tienen efecto en combate (' + G.functional + ').', ['Originales', 'Aleatorias (todas)', 'Aleatorias (con efecto)'], R, 'abilities'),
    cho('Movimientos', 'POR NIVEL: como el original. INTELIGENTES: aleatorios legales y bien elegidos. TOTALMENTE ALEATORIOS: 4 cualquiera (al menos uno de daño).', ['Por nivel', 'Aleatorios inteligentes', 'Totalmente aleatorios'], R, 'moves'),
    cho('Legendarios', 'NUNCA: no aparecen. SEGÚN NIVEL: sólo a partir de cierto nivel. SIEMPRE: en cualquier momento.', ['Nunca', 'Según nivel', 'Siempre'], R, 'legendaries')]));
  const gen = () => Scenes.push(new OptionsScene('REGLAS GENERALES', [
    tog('Tope de nivel', 'Tus Pokémon no ganan experiencia por encima del nivel del as del próximo jefe.', R, 'levelCap'),
    tog('Objetos en combates de entrenador', 'Si lo desactivas no puedes usar objetos de la mochila contra entrenadores.', R, 'battleItems'),
    tog('Preguntar apodo al capturar', 'Al conseguir un Pokémon te pregunta si quieres ponerle apodo.', R, 'askNickname')]));
  const chr = () => { const s = new OptionsScene('TU PERSONAJE', [
    { label: 'Tu nombre', help: 'Cómo te llamas.', display: () => P.name, action: () => Scenes.push(new TextInput('¿Cómo te llamas?', P.name, 10, t => { if (t && t.trim()) P.name = t.trim(); })) },
    { label: 'Nombre de tu rival', help: 'Cómo se llama tu rival.', display: () => P.rival, action: () => Scenes.push(new TextInput('¿Cómo se llama tu rival?', P.rival, 10, t => { if (t && t.trim()) P.rival = t.trim(); })) },
    { label: 'Gorra', help: 'Color de tu gorra.', vals: CAP_NAMES, get: () => P.look[0], set: v => P.look[0] = v },
    { label: 'Camiseta', help: 'Color de tu camiseta.', vals: CAP_NAMES, get: () => P.look[1], set: v => P.look[1] = v },
    { label: 'Pelo', help: 'Color de tu pelo.', vals: HAIR_NAMES, get: () => P.look[2], set: v => P.look[2] = v }]);
    s.visible = 5; s.extra = () => drawPlayerPreview(P, 392, 180); Scenes.push(s); };
  const root = new OptionsScene('NUEVA PARTIDA', [
    { label: 'Dificultad', help: 'NORMAL: IA sencilla, rivales más débiles. DIFÍCIL: IA que calcula daño y cambia a counters, jefes con Mega/Dinamax. EXTREMO: rivales +3 niveles, EVs al máximo, todos pueden transformarse, captura más difícil, sin tope de nivel.', vals: ['Normal', 'Difícil', 'Extremo'], get: () => R.difficulty, set: v => { R.difficulty = v; R.levelCap = v === 2 ? 0 : 1; } },
    tog('Modo Nuzlocke', 'Sólo capturas el primer Pokémon de cada zona y los que se debilitan mueren para siempre.', R, 'nuzlocke'),
    { label: '     Reglas Nuzlocke…', help: 'Elige qué reglas del Nuzlocke se aplican.', action: nuz },
    { label: 'Modo aleatorio (todo)', help: 'Activa o desactiva de golpe iniciales, salvajes y entrenadores aleatorios.', vals: ['No', 'Sí'], get: () => (R.randomStarters && R.randomWild && R.randomTrainers) ? 1 : 0, set: v => { R.randomStarters = R.randomWild = R.randomTrainers = v; } },
    { label: '     Personalizar aleatorio…', help: 'Habilidades, movimientos, legendarios, fuerza de los Pokémon...', action: rnd },
    { label: 'Reglas generales…', help: 'Tope de nivel, objetos en combate, apodos.', action: gen },
    { label: 'Personaje…', help: 'Tu nombre, el de tu rival y tu aspecto.', display: () => P.name + ' vs ' + P.rival, action: chr },
    { label: '¡COMENZAR!', help: 'Empieza la aventura con estas opciones.', action: () => { E('newGame', serializeRules(R), P.name, P.rival, P.look[0], P.look[1], P.look[2]); Maps.reset(); refreshGame(); World.newGame(); } }]);
  root.visible = 6; root.extra = () => drawPlayerPreview(P, 390, 150);
  return root;
}
function drawPlayerPreview(P, cx, by) {
  const ch = Art.player(P.look).down[0];
  ctx.imageSmoothingEnabled = false; ctx.drawImage(ch, cx - 40, by - 100, 80, 100);
  T(P.name, cx, by + 6, { a: 'center', c: C.gold, b: true, s: 14 });
}

// ---------- título ----------
class TitleScene extends Scene {
  constructor() { super(); this.m = new ListMenu([], 6); this.t = 0; }
  enter() { const it = ['Nueva partida']; if (SaveSys.has()) it.push('Continuar'); it.push('Importar sprites de tu ROM', 'Importar sprites de Pokémon Añil', 'Ayuda'); this.m.set(it); }
  draw() {
    this.t++;
    const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#3c0808'); g.addColorStop(1, '#f67814'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    for (let i = 0; i < 36; i++) { const x = (i * 97 + this.t * (0.5 + (i % 5) * 0.3)) % (W + 40) - 20, y = H - ((this.t * (0.4 + (i % 4) * 0.25) + i * 53) % (H + 30)); ctx.fillStyle = `rgba(255,${200 - (i % 5) * 30},40,.5)`; ctx.beginPath(); ctx.arc(x, y, 1.5 + i % 4, 0, 7); ctx.fill(); }
    T('POKÉMON', W / 2, 26, { a: 'center', s: 40, b: true, c: '#ffeea0' });
    T('ROJO FUEGO', W / 2, 66, { a: 'center', s: 40, b: true, c: '#fff' });
    T('EDICIÓN TOTAL', W / 2, 112, { a: 'center', s: 18, b: true, c: '#ffd070' });
    T('Todas las especies · Megas · Dinamax · Aleatorio · Nuzlocke', W / 2, 136, { a: 'center', s: 11, c: '#ffe8d0' });
    panel(W / 2 - 130, 160, 260, this.m.items.length * 26 + 14);
    this.m.draw(W / 2 - 122, 167, 244, 26);
    T(G.counts || '', W / 2, H - 18, { a: 'center', s: 10, c: '#ffe8d0' });
  }
  key(k) {
    if (this.m.move(k)) return;
    if (k !== 'a') return;
    const s = this.m.cur;
    if (s === 'Nueva partida') Scenes.push(newGameScene());
    else if (s === 'Continuar') { if (!SaveSys.load()) toast('No se pudo cargar la partida.'); }
    else if (s === 'Importar sprites de tu ROM') pickFile('.gba', false, f => importRom(f[0]));
    else if (s === 'Importar sprites de Pokémon Añil') pickFile('', true, f => importAnil(f));
    else if (s === 'Ayuda') Scenes.push(new HelpScene());
  }
}
function pickFile(accept, dir, cb) {
  const inp = document.createElement('input'); inp.type = 'file'; if (accept) inp.accept = accept; if (dir) { inp.webkitdirectory = true; inp.multiple = true; }
  inp.onchange = () => { if (inp.files && inp.files.length) cb(Array.from(inp.files)); };
  inp.click();
}

// ---------- ayuda ----------
const HELP = [
  ['¿Cómo se juega?', 'Camina por Kanto con las flechas. En la hierba alta aparecen Pokémon salvajes; los entrenadores te desafían si te ven (o habla con ellos con Z). Derrota al líder de cada ciudad para poder avanzar. Reúne las 8 medallas, cruza la Calle Victoria y gana la Liga Pokémon.'],
  ['Controles', 'Flechas o W/A/S/D: moverte. Z, Espacio o Enter: aceptar / hablar. X o Retroceso: volver / correr (mantén). Esc o Tab: abrir el menú. En combate, M activa la Megaevolución y G el Dinamax antes de elegir el movimiento. En móvil hay botones en pantalla.'],
  ['Megaevolución', 'Tu Pokémon debe llevar su piedra mega equipada (Mochila → Dar al Pokémon). En combate pulsa M y elige un movimiento: se transforma y se queda así TODO el combate. Las piedras las dan los jefes, los entrenadores y la tienda de Ciudad Azulona. Sólo una transformación (Mega O Dinamax) por combate y por bando.'],
  ['Dinamax y Gigamax', 'Cualquier Pokémon (salvo excepciones) puede Dinamaxear: pulsa G antes de elegir movimiento. Sus PS se multiplican por 1,5 y sus movimientos se vuelven Movimientos Max (o G-Max en las especies Gigamax). Dura todo el combate, como la Mega.'],
  ['Captura', 'En combates salvajes abre la Mochila → Poké Balls. Cuanto menos PS tenga el Pokémon y si está dormido, paralizado, etc., más fácil. No se puede capturar a los Pokémon de otros entrenadores.'],
  ['Centro Pokémon, taza y PC', 'Habla con la enfermera para curar a tu equipo. La taza ☕ de la esquina te da un Caramelo Nivelador (una vez por Centro cada vez que consigues una medalla nueva): dáselo a un Pokémon desde la Mochila y subirá al nivel PROMEDIO de tu equipo. El PC guarda tus Pokémon.'],
  ['Nuzlocke', 'Sólo capturas el primer Pokémon de cada zona y los debilitados mueren para siempre (van al cementerio del PC). Si no queda ninguno vivo, termina la partida. Las reglas se ajustan al empezar.'],
  ['Modo aleatorio', 'Se puede aleatorizar por separado: iniciales, salvajes, entrenadores y jefes, habilidades (todas o sólo las que funcionan), movimientos y legendarios. «Fuerza parecida» mantiene el equilibrio.'],
  ['Dificultades', 'NORMAL: IA sencilla. DIFÍCIL: IA que calcula daño y cambia a counters, jefes con Mega/Dinamax. EXTREMO: rivales +3 niveles, EVs al máximo, todos pueden transformarse y sin tope de nivel.'],
  ['Tope de nivel', 'Tus Pokémon no ganan experiencia por encima del nivel del as del próximo jefe (se puede desactivar). El Caramelo Nivelador también lo respeta.'],
  ['Tienda y objetos', 'Las tiendas venden pociones, balls, piedras evolutivas y vitaminas (más según tus medallas). El Gran Almacén de Ciudad Azulona vende TODOS los objetos equipables y las piedras mega.'],
  ['Evolución', 'Los Pokémon evolucionan al nivel indicado. Las evoluciones por piedra se hacen desde la Mochila. Las de intercambio evolucionan al nivel 36, las de amistad al 26, las de condición especial al 32.'],
  ['Sprites oficiales', 'En el título elige «Importar sprites de tu ROM» y selecciona tu ROM de Pokémon Rojo Fuego o Verde Hoja (.gba): se importan los sprites de Gen 1-3 (se guardan en tu navegador, no se suben a ningún sitio). «Importar sprites de Pokémon Añil» (elige su carpeta) añade Gen 4+, megas y formas. Lo que falte se descarga de internet o muestra una Poké Ball.'],
  ['Guardado', 'Menú → Guardar. La partida se guarda en tu navegador (localStorage). Con «Continuar» en el título la recuperas, con todas tus reglas.']
];
class HelpScene extends Scene {
  constructor() { super(); this.m = new ListMenu(HELP.map(h => h[0]), 10); if (G.info) this.m.items.push('Tus reglas actuales'); }
  draw() {
    ctx.fillStyle = C.bg; ctx.fillRect(0, 0, W, H);
    T('Ayuda · Preguntas frecuentes', 16, 8, { s: 18, b: true, c: C.gold });
    panel(12, 36, 170, 272); this.m.draw(18, 43, 158, 26);
    panel(190, 36, 278, 272);
    const i = this.m.sel;
    if (i < HELP.length) { T(HELP[i][0], 202, 46, { s: 14, b: true, c: C.gold }); T(HELP[i][1], 202, 70, { s: 12, w: 256, lh: 16 }); }
    else { T('Tus reglas actuales', 202, 46, { s: 14, b: true, c: C.gold }); T(rulesSummary(), 202, 70, { s: 12, w: 256, lh: 16 }); }
  }
  key(k) { if (this.m.move(k)) return; if (k === 'b' || k === 'a') Scenes.pop(); }
}
function rulesSummary() {
  const r = {}; (G.info.rules || '').split(',').forEach(p => { const a = p.split('='); r[a[0]] = +a[1]; });
  const yn = v => v ? 'sí' : 'no';
  return 'Dificultad: ' + G.info.difficulty + '\nTope de nivel: ' + yn(r.levelCap) + ' · Objetos en combate de entrenador: ' + yn(r.battleItems) +
    '\nNuzlocke: ' + (r.nuzlocke ? 'sí (primera captura ' + yn(r.firstEncounterOnly) + ', duplicados ' + yn(r.dupesClause) + ', muerte permanente ' + yn(r.permadeath) + ')' : 'no') +
    '\nAleatorio — iniciales: ' + yn(r.randomStarters) + ', salvajes: ' + yn(r.randomWild) + ', entrenadores: ' + yn(r.randomTrainers) + ', fuerza parecida: ' + yn(r.similarBst) +
    '\nHabilidades: ' + ['originales', 'aleatorias (todas)', 'aleatorias (con efecto)'][r.abilities || 0] + '\nMovimientos: ' + ['por nivel', 'aleatorios inteligentes', 'totalmente aleatorios'][r.moves || 0] + '\nLegendarios: ' + ['nunca', 'según nivel', 'siempre'][r.legendaries === undefined ? 1 : r.legendaries];
}

// ---------- menú START ----------
class StartMenu extends Scene {
  constructor() { super(); this.m = new ListMenu(['Pokédex', 'Pokémon', 'Mochila', G.info.player, 'Guardar', 'Ayuda', 'Cerrar'], 7); }
  opaque() { return false; }
  draw() {
    const x = W - 138, h = this.m.items.length * 28 + 14;
    panel(x, 8, 130, h);
    this.m.draw(x + 6, 15, 118, 28);
    T('$' + G.info.money, x + 4, h + 14, { s: 12, c: C.gold, b: true });
    T('Medallas: ' + G.info.badges + '/8 · Tope nv ' + G.info.levelCap, x - 20, h + 30, { s: 10, c: C.dim });
  }
  key(k) {
    if (this.m.move(k)) return;
    if (k === 'b' || k === 'start') { Scenes.pop(); return; }
    if (k !== 'a') return;
    const s = this.m.cur;
    if (s === 'Pokédex') Scenes.push(new DexScene());
    else if (s === 'Pokémon') Scenes.push(new PartyScene('menu'));
    else if (s === 'Mochila') Scenes.push(new BagScene());
    else if (s === G.info.player) Scenes.push(new TrainerCard());
    else if (s === 'Guardar') confirmBox('¿Quieres guardar la partida?', () => say(SaveSys.save() ? 'Partida guardada.' : 'No se pudo guardar.'));
    else if (s === 'Ayuda') Scenes.push(new HelpScene());
    else Scenes.pop();
  }
}
class TrainerCard extends Scene {
  draw() {
    refreshGame(); const g = G.info;
    ctx.fillStyle = C.bg; ctx.fillRect(0, 0, W, H);
    panel(14, 14, 452, 292, { fill: '#e8d070', border: '#7a5a1a' });
    T('TARJETA DE ENTRENADOR', 28, 24, { s: 16, b: true, c: '#5a3a0a' });
    const ch = Art.player(g.look).down[0]; ctx.imageSmoothingEnabled = false; ctx.drawImage(ch, 366, 52, 80, 100);
    [['NOMBRE', g.player], ['DINERO', '$' + g.money], ['POKÉDEX', 'Capturados ' + g.caught + ' · Vistos ' + g.seen], ['COMBATES', g.battlesWon + ' ganados'], ['DIFICULTAD', g.difficulty + (g.nuz ? ' · NUZLOCKE' : '') + (g.isRandom ? ' · ALEATORIO' : '')], ['TOPE DE NIVEL', '' + g.levelCap], ['RIVAL', g.rival]].forEach((r, i) => { T(r[0], 28, 56 + i * 22, { s: 11, c: '#7a5a1a', b: true }); T(r[1], 128, 55 + i * 22, { s: 13, c: '#2a1a0a' }); });
    T('MEDALLAS', 28, 220, { s: 11, b: true, c: '#7a5a1a' });
    for (let i = 0; i < 8; i++) { const x = 40 + i * 52, has = i < g.badges; ctx.fillStyle = has ? '#f4c430' : '#a89868'; ctx.beginPath(); ctx.arc(x, 252, 18, 0, 7); ctx.fill(); ctx.strokeStyle = '#5a3a0a'; ctx.lineWidth = 2; ctx.stroke(); T(has ? '★' : '·', x, 244, { a: 'center', s: 16, c: has ? '#fff' : '#7a6a3a' }); T(BADGES[i], x, 274, { a: 'center', s: 9, c: '#5a3a0a' }); }
  }
  key() { Scenes.pop(); }
}

// ---------- equipo ----------
class PartyScene extends Scene {
  // mode: 'menu' (gestionar), 'pick' (elegir para combate/cambiar), 'target' (aplicar objeto)
  constructor(mode, cb, opts) { super(); this.mode = mode; this.cb = cb; this.o = opts || {}; this.sel = 0; this.party = E('party'); }
  refresh() { this.party = E('party'); }
  draw() {
    ctx.fillStyle = C.bg; ctx.fillRect(0, 0, W, H);
    T(this.mode === 'pick' ? '¿A qué Pokémon enviar?' : this.mode === 'target' ? '¿A qué Pokémon?' : 'Tu equipo', 16, 8, { s: 17, b: true, c: C.gold });
    for (let i = 0; i < 6; i++) {
      const x = 12 + (i % 2) * 232, y = 36 + Math.floor(i / 2) * 88, m = this.party[i];
      selRow(x, y, 224, 82, i === this.sel);
      if (!m) continue;
      iconMon(m.sk, m.num, x + 32, y + 40, 52);
      T(m.name + (m.dead ? ' †' : ''), x + 66, y + 6, { s: 14, b: true, c: m.alive ? C.text : C.dim });
      T('Nv' + m.level, x + 66, y + 24, { s: 11, c: C.dim }); statusChip(m.status, x + 108, y + 26);
      chip(m.types[0], x + 66, y + 40, 40); if (m.types[1]) chip(m.types[1], x + 110, y + 40, 40);
      bar(x + 66, y + 58, 120, m.hp / m.maxHp, 6); T(m.hp + '/' + m.maxHp, x + 190, y + 55, { s: 10, c: C.dim });
      T(m.item ? m.item.name : '—', x + 66, y + 66, { s: 9, c: '#9cc0ff' });
      if (m.mega) T('★ MEGA', x + 172, y + 6, { s: 10, c: C.gold, b: true }); else if (m.canDmax) T('◆ DMAX', x + 172, y + 6, { s: 10, c: '#ff8080', b: true });
    }
    T('Z: elegir · X: volver', 16, H - 16, { s: 10, c: C.dim });
  }
  key(k) {
    if (k === 'up') this.sel = (this.sel + 4) % 6; else if (k === 'down') this.sel = (this.sel + 2) % 6; else if (k === 'left' || k === 'right') this.sel ^= 1;
    else if (k === 'b') { if (this.o.forced) return; Scenes.pop(); if (this.cb && this.mode !== 'menu') this.cb(-1); }
    else if (k === 'a') {
      const m = this.party[this.sel]; if (!m) return;
      if (this.mode === 'pick') {
        if (!m.alive) { toast(m.name + ' no puede luchar.'); return; }
        if (this.o.activeIdx === this.sel) { toast(m.name + ' ya está en combate.'); return; }
        Scenes.pop(); this.cb(this.sel);
      } else if (this.mode === 'target') { Scenes.pop(); this.cb(this.sel); }
      else this.actions(m);
    }
  }
  actions(m) {
    const i = this.sel;
    Scenes.push(new Choice(['Resumen', 'Subir en la lista', 'Dar objeto', 'Quitar objeto', 'Poner apodo', 'Mover a la caja', 'Cancelar'], c => {
      if (c === 0) Scenes.push(new SummaryScene(this.party, i));
      else if (c === 1) { if (i > 0) { E('swapParty', i, i - 1); this.sel = i - 1; this.refresh(); } }
      else if (c === 2) Scenes.push(new BagScene({ give: i, onDone: () => this.refresh() }));
      else if (c === 3) { E('take', i); this.refresh(); }
      else if (c === 4) Scenes.push(new TextInput('Apodo de ' + m.species + ' (vacío = quitar)', m.nick, 12, t => { if (t !== null) { E('nick', i, t); this.refresh(); } }));
      else if (c === 5) { const r = E('toBox', i); if (r && r.ok === false) toast(r.msg); else { this.refresh(); this.sel = 0; } }
    }, { w: 150 }));
  }
}

class SummaryScene extends Scene {
  constructor(list, i) { super(); this.list = list; this.i = i; this.page = 0; }
  draw() {
    const m = this.list[this.i];
    ctx.fillStyle = C.bg; ctx.fillRect(0, 0, W, H);
    panel(10, 10, 460, 300);
    drawMon(m.sk, m.num, false, 90, 130, { scale: 0.9 });
    T(m.name + '  Nv ' + m.level, 150, 16, { s: 18, b: true, c: C.gold });
    T('#' + m.num + ' ' + m.species, 150, 40, { s: 11, c: C.dim }); chip(m.types[0], 150, 56); if (m.types[1]) chip(m.types[1], 198, 56);
    T('Naturaleza: ' + m.nature, 24, 148, { s: 12 });
    T('Habilidad: ' + m.ability.name, 24, 166, { s: 12, b: true, c: C.gold }); T(m.ability.desc, 24, 182, { s: 10, w: 200, lh: 12, c: '#ccd' });
    T('Objeto: ' + (m.item ? m.item.name : 'ninguno'), 24, 226, { s: 12, b: true, c: '#9cc0ff' }); if (m.item) T(m.item.desc, 24, 242, { s: 10, w: 200, lh: 12, c: '#ccd' });
    T('PS ' + m.hp + '/' + m.maxHp, 24, 272, { s: 12 }); bar(80, 276, 130, m.hp / m.maxHp, 6);
    if (this.page === 0) {
      const nm = ['PS', 'Ataque', 'Defensa', 'At. Esp.', 'Def. Esp.', 'Velocidad'];
      nm.forEach((n, k) => { const y = 78 + k * 24; T(n, 250, y, { s: 12 }); T('' + m.stats[k], 320, y, { s: 12, b: true }); ctx.fillStyle = '#323a58'; ctx.fillRect(356, y + 4, 100, 7); ctx.fillStyle = TYPE_COL[m.types[k % 2 && m.types[1] ? 1 : 0]] || '#aaa'; ctx.fillRect(356, y + 4, Math.min(100, m.base[k] / 255 * 100), 7); });
      T('Total base ' + m.base.reduce((a, b) => a + b, 0) + ' · EXP ' + m.exp + ' (próx. nv: ' + Math.max(0, m.expNext - m.exp) + ')', 250, 228, { s: 10, c: C.dim });
      T('Origen: ' + (m.origin || 'Pueblo Paleta'), 250, 242, { s: 10, c: C.dim });
      if (m.mega) T('★ Puede Megaevolucionar a ' + m.mega, 250, 258, { s: 10, c: C.gold }); if (m.canDmax) T(m.gmax ? '◆ Puede Gigamaxizarse' : '◆ Puede Dinamaxizarse', 250, 272, { s: 10, c: '#ff8080' });
    } else {
      m.moves.forEach((mv, k) => { const y = 66 + k * 58; selRow(244, y, 218, 54, false); T(mv.name, 252, y + 4, { s: 13, b: true }); chip(mv.type, 252, y + 22); T((mv.cat === 'P' ? 'Físico' : mv.cat === 'S' ? 'Especial' : 'Estado') + (mv.bp ? ' · Pot ' + mv.bp : '') + (mv.acc ? ' · Prec ' + mv.acc : ''), 300, y + 22, { s: 10, c: C.dim }); T('PP ' + mv.pp + '/' + mv.maxPp, 420, y + 5, { s: 10, c: C.gold }); T(mv.desc, 252, y + 36, { s: 9, w: 204, lh: 10, c: '#ccd' }); });
    }
    T('←→ página · ↑↓ cambiar de Pokémon · X volver', 24, 294, { s: 10, c: C.dim });
  }
  key(k) { if (k === 'left' || k === 'right') this.page ^= 1; else if (k === 'up') this.i = (this.i + this.list.length - 1) % this.list.length; else if (k === 'down') this.i = (this.i + 1) % this.list.length; else if (k === 'b' || k === 'a') Scenes.pop(); }
}

// ---------- mochila ----------
const BAG_TABS = [['med', 'Médico'], ['ball', 'Poké Balls'], ['held', 'Equipables'], ['upgrade', 'Mejoras'], ['mega', 'Mega']];
class BagScene extends Scene {
  // opts: {battle:true, cb(id,type)} para combate; {give:idx, onDone} para equipar
  constructor(o) { super(); this.o = o || {}; this.tab = this.o.battle ? 0 : this.o.give !== undefined ? 2 : 0; this.m = new ListMenu([], 9); }
  enter() { this.build(); }
  build() { this.all = E('bag'); this.m.items = this.all.filter(i => i.tab === BAG_TABS[this.tab][0]); this.m.sel = Math.min(this.m.sel, Math.max(0, this.m.items.length - 1)); this.m.fix(); }
  draw() {
    ctx.fillStyle = C.bg; ctx.fillRect(0, 0, W, H);
    T('Mochila', 14, 6, { s: 17, b: true, c: C.gold }); T('$' + G.info.money, W - 14, 8, { a: 'right', s: 13, b: true, c: C.gold });
    BAG_TABS.forEach((t, i) => { const x = 12 + i * 92; selRow(x, 30, 88, 20, i === this.tab); T(t[1], x + 44, 34, { a: 'center', s: 11, c: i === this.tab ? C.gold : C.dim }); });
    panel(10, 56, 250, 250); this.m.items.length ? this.m.draw(16, 62, 238, 26, (it, x, y, sel) => { T(it.name, x + 8, y + 5, { s: 12, c: sel ? C.gold : C.text }); T('×' + it.count, x + 232, y + 5, { a: 'right', s: 12, c: C.dim }); }) : T('(vacío)', 24, 70, { c: C.dim });
    panel(268, 56, 202, 250); const it = this.m.cur;
    if (it) { T(it.name, 278, 64, { s: 14, b: true, c: C.gold }); T(it.desc, 278, 86, { s: 11, w: 184, lh: 14 }); if (it.price) T('Valor: $' + it.price, 278, 284, { s: 10, c: C.dim }); }
    T('←→ bolsillo · Z usar · X volver', 14, H - 14, { s: 10, c: C.dim });
  }
  key(k) {
    if (this.m.move(k)) return;
    if (k === 'left') { this.tab = (this.tab + 4) % 5; this.m.sel = 0; this.m.top = 0; this.build(); }
    else if (k === 'right') { this.tab = (this.tab + 1) % 5; this.m.sel = 0; this.m.top = 0; this.build(); }
    else if (k === 'b') { Scenes.pop(); if (this.o.battle) this.o.cb(null); if (this.o.onDone) this.o.onDone(); }
    else if (k === 'a') this.use(this.m.cur);
  }
  use(it) {
    if (!it) return;
    const o = this.o;
    if (o.give !== undefined) { if (it.tab === 'ball') return toast('Las balls no se equipan.'); const r = E('give', o.give, it.id); if (r && r.ok === false) toast(r.msg); else { toast(it.name + ' equipado.'); this.build(); if (o.onDone) o.onDone(); } return; }
    if (o.battle) {
      if (it.ball) { Scenes.pop(); o.cb({ type: 'ball', id: it.id }); return; }
      if (!it.battle) return toast('No se puede usar en combate.');
      Scenes.push(new PartyScene('target', i => { if (i >= 0) { Scenes.pop(); o.cb({ type: 'item', id: it.id, idx: i }); } })); return;
    }
    if (it.ball) return toast('Las Poké Balls se usan en combate.');
    if (it.tab === 'held' || it.tab === 'mega') { Scenes.push(new PartyScene('target', i => { if (i < 0) return; const r = E('give', i, it.id); if (r && r.ok === false) toast(r.msg); else toast('Equipado.'); this.build(); })); return; }
    Scenes.push(new PartyScene('target', i => {
      if (i < 0) return;
      const r = E('useItem', it.id, i);
      this.build(); refreshGame();
      handleUse(r);
    }));
  }
}
// resultado de usar un objeto / caramelo: mensaje, movimientos nuevos y evoluciones
function handleUse(r, after) {
  if (!r) return;
  if (r.ok === false) { toast(r.msg); if (after) after(); return; }
  const steps = [next => say(r.msg, next)];
  (r.learn || []).forEach(l => steps.push(next => learnMoveFlow(l[0], l[1], l[2], next)));
  (r.evolve || []).forEach(e => steps.push(next => Scenes.push(new EvolutionScene(e[0], e[1], next))));
  chain(steps.concat([() => { refreshGame(); if (after) after(); }]));
}
function learnMoveFlow(idx, moveId, moveName, done) {
  const m = E('party')[idx];
  if (m.moves.length < 4) { E('learn', idx, moveId, m.moves.length); say(m.name + ' aprendió ' + moveName + '.', done); return; }
  say(m.name + ' quiere aprender ' + moveName + '.', () => Scenes.push(new LearnMove(idx, m, moveId, moveName, done)));
}
class LearnMove extends Scene {
  constructor(idx, m, id, name, done) { super(); this.idx = idx; this.m = m; this.id = id; this.name = name; this.done = done; this.sel = 0; }
  opaque() { return false; }
  draw() {
    panel(40, 30, 400, 230);
    T('¿Qué movimiento debe olvidar ' + this.m.name + '?', 54, 40, { s: 13, b: true, c: C.gold });
    for (let i = 0; i < 5; i++) { const mv = i < 4 ? this.m.moves[i] : { name: this.name + ' (nuevo)', type: '', cat: '', bp: 0 }; const y = 66 + i * 38; selRow(54, y, 372, 34, i === this.sel); T(mv.name, 64, y + 9, { s: 13, c: i === this.sel ? C.gold : C.text }); if (mv.type) chip(mv.type, 270, y + 11); if (mv.bp) T('Pot ' + mv.bp, 330, y + 11, { s: 10, c: C.dim }); }
    T('Z: olvidar ese · elige el nuevo para no aprenderlo', 54, 246, { s: 10, c: C.dim });
  }
  key(k) {
    if (k === 'up') this.sel = (this.sel + 4) % 5; else if (k === 'down') this.sel = (this.sel + 1) % 5;
    else if (k === 'a') { Scenes.pop(); if (this.sel < 4) { E('learn', this.idx, this.id, this.sel); say('Olvidó ' + this.m.moves[this.sel].name + ' y aprendió ' + this.name + '.', this.done); } else say(this.m.name + ' no aprendió ' + this.name + '.', this.done); }
  }
}
class EvolutionScene extends Scene {
  constructor(idx, toId, done) { super(); this.idx = idx; this.to = E('dexDetail', toId); this.m = E('party')[idx]; this.fromName = this.m.nick || this.m.species; this.done = done; this.t = 0; this.state = 0; }
  draw() {
    ctx.fillStyle = '#0a0c18'; ctx.fillRect(0, 0, W, H); this.t++;
    if (this.state === 0 && this.t > 150) { this.m = E('evolve', this.idx, this.to.id); this.state = 1; this.t = 0; }
    const showTo = this.state === 1 || (this.t % 24 >= 12 && this.t > 40);
    const g = ctx.createRadialGradient(W / 2, 130, 10, W / 2, 130, 110); g.addColorStop(0, 'rgba(255,255,255,' + (0.3 + 0.2 * Math.sin(this.t * .3)) + ')'); g.addColorStop(1, 'rgba(255,255,255,0)'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    const sk = this.state === 1 ? this.m.sk : (showTo ? this.to.sk : this.m.sk), num = this.state === 1 ? this.m.num : (showTo ? this.to.num : this.m.num);
    drawMon(sk, num, false, W / 2, 190, { scale: 1.2 });
    panel(10, H - 70, W - 20, 60, { fill: '#f4f4f8', border: '#37406a' });
    T(this.state === 0 ? '¡¿' + this.m.name + ' está evolucionando?! (X para cancelar)' : '¡Felicidades! ¡Tu ' + this.fromName + ' evolucionó en ' + this.to.name + '!', 24, H - 56, { s: 14, c: '#1c2038', w: W - 50 });
  }
  key(k) {
    if (this.state === 0 && k === 'b') { this.state = 2; this.t = 0; }
    else if (this.state === 2 && k) { Scenes.pop(); this.done && this.done(); }
    else if (this.state === 1 && k === 'a') { Scenes.pop(); this.done && this.done(); }
  }
}

// ---------- tienda ----------
function shopMenu(place) {
  const opts = [['Médico y Poké Balls', 0], ['Piedras evolutivas y mejoras', 1]];
  if (place.bigShop) opts.push(['Gran Almacén: TODOS los objetos', 2]);
  if (place.megaShop) opts.push(['Piedras Mega y Orbes', 3]);
  opts.push(['Salir', -1]);
  say('¡Bienvenido! ¿Qué desea?', () => Scenes.push(new Choice(opts.map(o => o[0]), i => { if (i < 0 || opts[i][1] < 0) return; Scenes.push(new ShopScene(opts[i][1])); }, { w: 210, x: 14, y: 40 })));
}
class ShopScene extends Scene {
  constructor(kind) { super(); this.kind = kind; this.m = new ListMenu(E('shopStock', kind), 9); this.qty = 1; }
  draw() {
    ctx.fillStyle = C.bg; ctx.fillRect(0, 0, W, H);
    T('Tienda', 14, 6, { s: 17, b: true, c: C.gold }); T('$' + G.info.money, W - 14, 8, { a: 'right', s: 14, b: true, c: C.gold });
    panel(10, 34, 262, 270); this.m.draw(16, 40, 250, 28, (it, x, y, sel) => { T(it.name, x + 8, y + 6, { s: 12, c: sel ? C.gold : C.text }); T('$' + it.price, x + 244, y + 6, { a: 'right', s: 12, c: C.dim }); });
    panel(280, 34, 190, 270); const it = this.m.cur;
    if (it) { T(it.name, 290, 42, { s: 13, b: true, c: C.gold }); T(it.desc, 290, 62, { s: 11, w: 172, lh: 14 }); T('Tienes: ' + it.count, 290, 230, { s: 11, c: C.dim }); T('Cantidad: ◄ ' + this.qty + ' ►', 290, 248, { s: 12 }); T('Total $' + it.price * this.qty, 290, 266, { s: 13, b: true, c: C.gold }); }
    T('Z: comprar · ←→ cantidad · X: volver', 14, H - 14, { s: 10, c: C.dim });
  }
  key(k) {
    if (this.m.move(k)) { this.qty = 1; return; }
    if (k === 'left') this.qty = Math.max(1, this.qty - 1); else if (k === 'right') this.qty = Math.min(99, this.qty + 1);
    else if (k === 'b') Scenes.pop();
    else if (k === 'a' && this.m.cur) { const it = this.m.cur, r = E('buy', it.id, this.qty); refreshGame(); if (r.ok) { toast('Compraste ' + this.qty + ' × ' + it.name); this.m.set(E('shopStock', this.kind)); } else toast('No tienes suficiente dinero.'); }
  }
}

// ---------- PC (cajas y cementerio) ----------
class PCScene extends Scene {
  constructor() { super(); this.view = 0; this.m = new ListMenu([], 9); this.party = []; }
  enter() { this.refresh(); }
  refresh() { this.party = E('party'); this.box = E('box'); this.dead = E('graveyard'); this.m.items = this.view === 0 ? this.box : this.dead; this.m.fix(); if (this.m.sel >= this.m.items.length) this.m.sel = Math.max(0, this.m.items.length - 1); }
  draw() {
    ctx.fillStyle = C.bg; ctx.fillRect(0, 0, W, H);
    T(this.view === 0 ? 'PC · Caja de Pokémon' : 'PC · Cementerio', 14, 6, { s: 17, b: true, c: C.gold });
    if (G.info.nuz) T('←→: caja / cementerio', W - 14, 10, { a: 'right', s: 10, c: C.dim });
    panel(10, 34, 250, 270); this.m.items.length ? this.m.draw(16, 40, 238, 26, (m, x, y, sel) => { iconMon(m.sk, m.num, x + 16, y + 12, 24); T(m.name + '  Nv' + m.level, x + 34, y + 5, { s: 12, c: sel ? C.gold : (m.alive ? C.text : C.dim) }); }) : T(this.view === 0 ? '(la caja está vacía)' : '(nadie ha muerto... todavía)', 24, 48, { c: C.dim });
    panel(268, 34, 202, 270); const m = this.m.cur;
    if (m) { drawMon(m.sk, m.num, false, 369, 140, { scale: .8, alpha: this.view ? .6 : 1 }); T(m.name + '  Nv ' + m.level, 278, 150, { s: 13, b: true }); chip(m.types[0], 278, 170); if (m.types[1]) chip(m.types[1], 326, 170); T('Hab: ' + m.ability.name, 278, 190, { s: 11, c: C.dim }); T('Obj: ' + (m.item ? m.item.name : '-'), 278, 206, { s: 11, c: C.dim }); if (this.view === 0) T('Z: sacar al equipo', 278, 270, { s: 10, c: C.gold }); }
    T('Equipo: ' + this.party.length + '/6 · X: salir · Z en el equipo (←): guardar', 14, H - 14, { s: 10, c: C.dim });
  }
  key(k) {
    if (this.m.move(k)) return;
    if ((k === 'left' || k === 'right') && G.info.nuz) { this.view ^= 1; this.m.sel = 0; this.m.top = 0; this.refresh(); }
    else if (k === 'b') Scenes.pop();
    else if (k === 'a' && this.view === 0) {
      if (this.party.length < 6 && this.m.items.length) { const r = E('fromBox', this.m.sel); if (r.ok === false) toast(r.msg); else toast('Sacaste a ' + this.m.cur.name); this.refresh(); }
      else if (this.m.items.length) Scenes.push(new PartyScene('target', i => { if (i >= 0) { E('swapBox', i, this.m.sel); this.refresh(); } }));
    }
  }
}

// ---------- Pokédex ----------
class DexScene extends Scene {
  constructor() { super(); this.list = E('dexList'); this.m = new ListMenu(this.list, 11); }
  draw() {
    ctx.fillStyle = C.bg; ctx.fillRect(0, 0, W, H);
    T('Pokédex — vistos ' + G.info.seen + ' · capturados ' + G.info.caught + '   (★ capturado ● visto)', 12, 6, { s: 14, b: true, c: C.gold });
    panel(8, 30, 230, 280); this.m.draw(14, 36, 218, 24, (d, x, y, sel) => { const k = d[4] ? '★' : d[3] ? '●' : '○'; T(k + ' ' + String(d[1]).padStart(4, '0') + '  ' + (d[3] || d[4] ? d[2] : '???'), x + 6, y + 4, { s: 12, c: sel ? C.gold : (d[3] || d[4] ? C.text : C.dim) }); });
    panel(244, 30, 228, 280); const d = this.m.cur;
    if (d) { const known = d[3] || d[4]; if (known) drawMon(d[5], d[1], false, 358, 130, { scale: .8 }); else drawMon('', d[1], false, 358, 130, { scale: .8 }); T(known ? d[2] : '???', 358, 140, { a: 'center', s: 16, b: true }); T(d[4] ? 'Z: ver todos los datos' : 'Captúralo para ver todos sus datos', 358, 270, { a: 'center', s: 10, c: C.gold }); }
  }
  key(k) {
    if (k === 'left') { for (let i = 0; i < 10; i++) this.m.move('up'); return; } if (k === 'right') { for (let i = 0; i < 10; i++) this.m.move('down'); return; }
    if (this.m.move(k)) return;
    if (k === 'b') Scenes.pop(); else if (k === 'a') Scenes.push(new DexDetail(this.m.cur[0]));
  }
}
function evoText(e) {
  let t;
  if (e.type === 'useItem') t = 'con ' + e.itemName; else if (e.type === 'trade') t = 'por intercambio' + (e.itemName ? ' con ' + e.itemName : ''); else if (e.type === 'levelFriendship') t = 'con amistad alta'; else t = e.level > 0 ? 'al nivel ' + e.level : '';
  if (e.cond) t += (t ? ' · ' : '') + e.cond; if (e.move) t += (t ? ' · ' : '') + 'conociendo ' + e.move;
  return t || '(condición especial)';
}
class DexDetail extends Scene {
  constructor(id) { super(); this.d = E('dexDetail', id); this.page = 0; this.scroll = 0; }
  draw() {
    const d = this.d; ctx.fillStyle = C.bg; ctx.fillRect(0, 0, W, H); panel(8, 8, 464, 304);
    drawMon(d.sk, d.num, false, 66, 98, { scale: .6, alpha: d.known ? 1 : .3 });
    T('#' + String(d.num).padStart(4, '0') + '  ' + (d.known ? d.name : '???'), 124, 14, { s: 18, b: true, c: C.gold });
    if (d.known) { chip(d.types[0], 124, 40); if (d.types[1]) chip(d.types[1], 172, 40); }
    const names = ['Datos', 'Movimientos por nivel', 'Otros movimientos', 'Evolución y formas'];
    T(d.known ? names[this.page] : 'Pokémon no capturado', 124, 58, { s: 12, c: '#9cc0ff' });
    for (let i = 0; i < 4; i++) { ctx.fillStyle = i === this.page ? C.gold : '#555'; ctx.beginPath(); ctx.arc(400 + i * 14, 20, 4, 0, 7); ctx.fill(); }
    if (!d.known) { T('Captura este Pokémon (o su forma base) para ver todos sus datos.', 24, 140, { s: 13, c: C.dim, w: 420 }); }
    else if (this.page === 0) {
      ['PS', 'Ataque', 'Defensa', 'At. Esp.', 'Def. Esp.', 'Velocidad'].forEach((n, i) => { const y = 84 + i * 20; T(n, 24, y, { s: 12 }); T('' + d.stats[i], 100, y, { s: 12, b: true }); ctx.fillStyle = '#323a58'; ctx.fillRect(140, y + 4, 140, 7); ctx.fillStyle = TYPE_COL[d.types[i % 2 && d.types[1] ? 1 : 0]]; ctx.fillRect(140, y + 4, Math.min(140, d.stats[i] / 255 * 140), 7); });
      T('Total base: ' + d.bst + '    Peso: ' + d.weight + ' kg', 24, 210, { s: 12, c: C.dim });
      const fl = (d.mega ? 'Megaevolución. ' : '') + (d.primal ? 'Regresión primigenia. ' : '') + (d.gmax ? 'Forma Gigamax. ' : '') + (d.noDmax ? 'No puede Dinamaxear. ' : '') + (d.legendary ? 'Legendario/singular. ' : ''); T(fl, 24, 226, { s: 11, c: C.gold });
      (d.abilities || []).forEach((a, i) => { const y = 244 + i * 22; T((a.hidden ? 'Oculta: ' : 'Habilidad: ') + a.name, 24, y, { s: 11, b: true, c: C.gold }); T(a.desc, 200, y, { s: 9, w: 262, lh: 10, c: '#ccd' }); });
    } else if (this.page === 1) {
      const rows = 11, n = d.level.length; this.scroll = Math.max(0, Math.min(this.scroll, n - rows));
      ['Nv', 'Movimiento', 'Tipo', 'Clase', 'Pot', 'Prec'].forEach((h, i) => T(h, [24, 54, 200, 262, 336, 378][i], 78, { s: 10, c: C.dim }));
      for (let i = 0; i < rows && this.scroll + i < n; i++) { const r = d.level[this.scroll + i], y = 94 + i * 19; T(r[0] === 0 ? '—' : '' + r[0], 24, y, { s: 11, c: C.gold }); T(r[1], 54, y, { s: 11, c: r[6] ? C.text : C.dim }); chip(r[2], 200, y + 1, 50); T(r[3] === 'P' ? 'Físico' : r[3] === 'S' ? 'Especial' : 'Estado', 262, y, { s: 10 }); T(r[4] ? '' + r[4] : '—', 336, y, { s: 10 }); T(r[5] ? '' + r[5] : '—', 378, y, { s: 10 }); }
      if (!n) T('No aprende movimientos por nivel.', 24, 96, { c: C.dim }); T(n ? (this.scroll + 1) + '–' + Math.min(n, this.scroll + rows) + ' / ' + n : '', 460, 58, { a: 'right', s: 10, c: C.dim });
    } else if (this.page === 2) {
      const cols = 3, rows = 12, n = d.other.length; this.scroll = Math.max(0, Math.min(this.scroll, Math.ceil(n / cols) - rows));
      T('MT, tutores, huevo y otros (gris: sin efecto en este juego)', 24, 76, { s: 10, c: C.dim });
      for (let i = 0; i < rows * cols; i++) { const idx = this.scroll * cols + i; if (idx >= n) break; const r = d.other[idx], x = 22 + (i % cols) * 148, y = 92 + Math.floor(i / cols) * 17; ctx.fillStyle = TYPE_COL[r[1]]; ctx.fillRect(x, y + 2, 3, 12); T(r[0], x + 8, y, { s: 10, c: r[2] ? C.text : C.dim }); }
    } else {
      let y = 84; if (d.prevo) { T('Evoluciona de: ' + d.prevo, 24, y, { s: 12 }); y += 20; }
      d.evos.forEach(e => { T('→ ' + e.to + '  ' + evoText(e), 24, y, { s: 12, c: C.green }); y += 20; });
      if (!d.prevo && !d.evos.length) { T('No evoluciona.', 24, y, { s: 12, c: C.dim }); y += 20; }
      y += 8; T('Formas relacionadas', 24, y, { s: 13, b: true, c: C.gold }); y += 20;
      d.forms.forEach(f => { if (y < 290) { T('• ' + f.name + (f.kind === 'mega' ? '  (Mega' + (f.stone ? ', con ' + f.stone : '') + ')' : f.kind === 'gmax' ? '  (Gigamax)' : f.kind === 'primal' ? '  (Primigenia)' : f.kind === 'battle' ? '  (en combate)' : ''), 30, y, { s: 11 }); y += 16; } });
    }
    T('←→ página · ↑↓ desplazar · X volver', 16, H - 14, { s: 10, c: C.dim });
  }
  key(k) { if (k === 'left') { this.page = (this.page + 3) % 4; this.scroll = 0; } else if (k === 'right') { this.page = (this.page + 1) % 4; this.scroll = 0; } else if (k === 'up') this.scroll = Math.max(0, this.scroll - 1); else if (k === 'down') this.scroll++; else if (k === 'b') Scenes.pop(); }
}
