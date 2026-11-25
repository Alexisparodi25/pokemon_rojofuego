'use strict';
// =====================================================================
//  Mundo: mapa caminable, NPC, entrenadores, puertas, hierba, Centro Pokémon, tienda, laboratorio
// =====================================================================
const TS = 32;                         // tamaño de baldosa en pantalla (px lógicos)
const DIRV = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };
const OPP = { up: 'down', down: 'up', left: 'right', right: 'left' };

class Flash extends Scene {
  constructor(cb) { super(); this.t = 0; this.cb = cb; }
  opaque() { return false; }
  draw() { this.t++; const a = this.t < 20 ? (Math.floor(this.t / 3) % 2 ? .9 : .2) : Math.min(1, (this.t - 20) / 14); ctx.fillStyle = (this.t < 20 ? 'rgba(255,255,255,' : 'rgba(0,0,0,') + a + ')'; ctx.fillRect(0, 0, W, H); if (this.t > 36) { Scenes.pop(); this.cb(); } }
  key() {}
}
class GameOver extends Scene {
  draw() { ctx.fillStyle = '#100000'; ctx.fillRect(0, 0, W, H); T('FIN DE LA PARTIDA', W / 2, 60, { a: 'center', s: 32, b: true, c: '#d02828' }); T(G.info.nuz ? 'Tu Nuzlocke ha terminado.' : 'Has sido derrotado.', W / 2, 120, { a: 'center', s: 18 }); T('Combates ganados: ' + G.info.battlesWon + ' · Medallas: ' + G.info.badges + ' · Caídos: ' + G.info.deadSize, W / 2, 154, { a: 'center', s: 13, c: C.dim }); T('Pulsa Z para volver al título', W / 2, H - 40, { a: 'center', s: 12, c: C.dim }); }
  key(k) { if (k === 'a') { Scenes.replace(new TitleScene()); } }
}
class Victory extends Scene {
  constructor() { super(); this.p = E('party'); this.t = 0; }
  draw() {
    this.t++; ctx.fillStyle = '#140a28'; ctx.fillRect(0, 0, W, H);
    for (let i = 0; i < 50; i++) { ctx.fillStyle = 'rgba(255,' + (200 + (i * 7) % 55) + ',80,.6)'; ctx.fillRect((i * 131 + this.t * 2) % W, (i * 71 + this.t * (1 + i % 3)) % H, 3, 3); }
    T('¡' + G.info.player + ', CAMPEÓN DE LA LIGA POKÉMON!', W / 2, 20, { a: 'center', s: 18, b: true, c: C.gold });
    T(G.info.nuz ? '¡Nuzlocke completado!' : '¡Has completado el juego en dificultad ' + G.info.difficulty + '!', W / 2, 48, { a: 'center', s: 12 });
    this.p.forEach((m, i) => { const x = 80 + (i % 3) * 160, y = 90 + Math.floor(i / 3) * 100; drawMon(m.sk, m.num, false, x, y + 70, { scale: .6 }); T(m.name + ' Nv' + m.level, x, y + 76, { a: 'center', s: 11 }); });
    T('Combates: ' + G.info.battlesWon + ' · Bajas: ' + G.info.deadSize + ' · Pulsa Z para seguir jugando', W / 2, H - 18, { a: 'center', s: 11, c: C.dim });
  }
  key(k) { if (k === 'a') Scenes.pop(); }
}

const World = {
  map: null, x: 0, y: 0, dir: 'down', moving: false, prog: 0, fromX: 0, fromY: 0, speed: 12, anim: 0, turnWait: 0,
  busy: false, flags: {}, banner: '', bannerT: 0, fade: 0, bubble: null, started: false,
  newGame() {
    this.flags = { starter: false };
    Maps.reset(); this.started = true;
    Scenes.replace(new WorldScene());
    this.loadMap('lab', 4, 7, 'up');
    this.busy = true;
    const n = G.info.player, r = G.info.rival;
    say(['¡Hola, ' + n + '! ¡Por fin llegas! Soy el Profesor Oak.', 'El mundo de los Pokémon está lleno de aventuras... y de peligros. Los entrenadores de Kanto son duros: ¡este viaje es ' + G.info.difficulty + '!',
      'Aquí, en la mesa, tienes tres Pokémon. Elige uno acercándote a la mesa y pulsando Z.', 'Y recuerda: sólo existen la Megaevolución (con su piedra) y el Dinamax. Duran todo el combate.'], () => { this.busy = false; });
  },
  saveState() { return { map: this.map.id, x: this.x, y: this.y, dir: this.dir, flags: this.flags }; },
  loadState(s) {
    this.flags = s.flags || {}; this.started = true; refreshGame();
    Scenes.replace(new WorldScene()); this.loadMap(s.map, s.x, s.y, s.dir, true); this.busy = false;
  },
  loadMap(id, x, y, dir, quiet) {
    this.map = Maps.get(id); this.x = x; this.y = y; this.dir = dir || 'down'; this.moving = false; this.prog = 0;
    E('setPlace', this.map.place); this.refreshInfo();
    this.banner = this.map.name; this.bannerT = quiet ? 0 : 150;
  },
  refreshInfo() {
    const m = this.map; this.pinfo = E('placeInfo', m.place);
    const p = this.pinfo;
    m.npcs.forEach(n => {
      if (n.trainer !== undefined) n.done = !!(p.trainers[n.trainer] && p.trainers[n.trainer].done);
      if (n.boss) {
        if (n.bossKey) { const c = (p.boss && p.chain || []).find(c => c.key === n.bossKey); n.done = !!(c && c.done); }
        else n.done = !!(p.boss && p.boss.done);
        if (n.type === 'rival' && n.done && !m.indoor) n.hidden = true;
        if (n.bossKey && n.done) n.hidden = true;
      }
    });
  },
  npcAt(x, y) { return this.map.npcs.find(n => !n.hidden && n.x === x && n.y === y); },
  solid(x, y) {
    const m = this.map;
    if (x < 0 || y < 0 || x >= m.w || y >= m.h) return true;
    if (SOLID.has(m.t[y * m.w + x])) return true;
    return !!this.npcAt(x, y);
  },
  // ---------------------------------------------------------------- transiciones
  warp(to, tx, ty, dir) {
    this.busy = true;
    this.fadeOut(() => { this.loadMap(to, tx, ty, dir); this.fadeIn(() => { this.busy = false; this.checkSight(); }); });
  },
  fadeOut(cb) { Scenes.push(new Fade(1, cb)); },
  fadeIn(cb) { Scenes.push(new Fade(-1, cb)); },
  tryExit(side) {
    const m = this.map, to = m.exits && m.exits[side];
    if (!to) { toast('No hay nada por ahí.'); return; }
    if (side === 'north') {
      const a = E('advanceInfo');
      if (!a.canAdvance) { this.busy = true; say(m.place === 0 ? ['¡Espera! No puedes irte sin haber hablado con el Profesor Oak ni haber combatido con tu rival.'] : ['No puedes avanzar todavía.', 'Antes debes derrotar a ' + a.boss + '.'], () => { this.busy = false; }); return; }
      if (m.place >= 17) return;
    }
    const tm = Maps.get(to);
    let nx = this.x, ny = side === 'north' ? tm.h - 1 : 0;
    for (let d = 0; d < 12; d++) { const c = nx + (d % 2 ? -((d + 1) >> 1) : (d >> 1)); if (c >= 0 && c < tm.w && !SOLID.has(tm.t[ny * tm.w + c])) { nx = c; break; } }
    this.warp(to, nx, ny, side === 'north' ? 'up' : 'down');
  },
  // ---------------------------------------------------------------- combates
  hasAlive() { return E('party').some(p => p.alive); },
  startBattle(kind, a, b, after) {
    if (!this.hasAlive()) { say('Ningún Pokémon puede luchar. ¡Cura a tu equipo!'); return false; }
    this.busy = true;
    Scenes.push(new Flash(() => {
      if (kind === 'wild') E('wildBattle'); else E('trainerBattle', a, b);
      Scenes.push(new BattleScene(r => this.afterBattle(r, after)));
    }));
    return true;
  },
  afterBattle(r, after) {
    refreshGame(); this.refreshInfo();
    if (r.gameOver) { Scenes.replace(new GameOver()); return; }
    if (r.lost) {
      this.busy = true; const p = G.info.placeIdx, cm = Maps.get('o' + p).doors.center ? 'c' + p : null;
      say('Corriste a toda prisa al Centro Pokémon...', () => { if (cm) this.warp(cm, 6, 7, 'up'); else this.warp('o' + p, 11, 9, 'down'); });
      return;
    }
    this.busy = false;
    if (r.champion && !this.flags.champion) { this.flags.champion = true; Scenes.push(new Victory()); }
    if (after) after(r);
    this.checkSight();
  },
  // ---------------------------------------------------------------- entrenadores
  checkSight() {
    if (this.busy || this.moving) return;
    const m = this.map;
    for (const n of m.npcs) {
      if (n.hidden || n.done || (n.trainer === undefined && !n.boss) || !n.sight) continue;
      const v = DIRV[n.dir]; let d = 0, hit = false;
      for (let k = 1; k <= n.sight; k++) { const tx = n.x + v[0] * k, ty = n.y + v[1] * k; if (tx === this.x && ty === this.y) { hit = true; d = k; break; } if (tx < 0 || ty < 0 || tx >= m.w || ty >= m.h || SOLID.has(m.t[ty * m.w + tx]) || this.npcAt(tx, ty)) break; }
      if (hit) { this.engage(n, d - 1); return; }
    }
  },
  engage(n, dist) {
    this.busy = true; this.bubble = { n, t: 0 };
    const walk = () => {
      if (dist > 0) { const v = DIRV[n.dir]; n.x += v[0]; n.y += v[1]; dist--; setTimeout(walk, 150); }
      else { this.bubble = null; this.dir = OPP[n.dir]; this.talk(n); }
    };
    setTimeout(() => { this.bubble = null; walk(); }, 650);
  },
  talk(n) {
    this.busy = true;
    n.dir = OPP[this.dir];
    const name = G.info.player;
    const pre = n.boss ? (n.type === 'leader' ? ['¡Soy ' + n.name + ', líder de este gimnasio!', '¡Veamos de qué eres capaz, ' + name + '!'] : n.type === 'rival' ? ['¡Eh, ' + name + '! ¡Te estaba esperando!', '¡Voy a demostrarte que soy mejor entrenador que tú!'] : ['Soy ' + n.name + '. ¡No será fácil pasar!']) : ['¡Te he visto! ¡Combatamos!'];
    const post = n.boss ? (n.type === 'leader' ? ['Has demostrado tu fuerza. ¡Sigue así!'] : ['Vaya... esta vez has ganado. ¡Pero me haré más fuerte!']) : ['Me has ganado... ¡Eres muy bueno!'];
    if (n.role === 'nurse') return this.nurse();
    if (n.role === 'clerk') { shopMenu(this.pinfo); this.busy = false; return; }
    if (n.role === 'oak') return this.oak();
    if (n.trainer !== undefined || n.boss) {
      if (n.done) { say(post, () => { this.busy = false; }); return; }
      say(pre, () => { const ok = n.boss ? this.startBattle('trainer', this.map.place, -1) : this.startBattle('trainer', this.map.place, n.trainer); if (!ok) this.busy = false; });
      return;
    }
    say(n.lines, () => { this.busy = false; });
  },
  nurse() {
    say(['¡Bienvenido al Centro Pokémon!', '¿Quieres que cure a tus Pokémon?'], () => Scenes.push(new Choice(['Sí', 'No'], i => {
      if (i === 0) { E('healAll'); say(['...', '¡Tus Pokémon están como nuevos!' + (G.info.nuz ? ' (los caídos no vuelven...)' : ''), '¡Esperamos verte pronto!'], () => { this.busy = false; }); }
      else { say('¡Vuelve cuando quieras!', () => { this.busy = false; }); }
    }, { w: 70, x: 200, y: 120 })));
  },
  oak() {
    if (!this.flags.starter) { say(['Elige uno de los tres Pokémon de la mesa, ' + G.info.player + '.'], () => { this.busy = false; }); return; }
    if (!this.flags.rivalDone) { say(['¡Tu rival te espera! Sal a combatir.'], () => { this.busy = false; }); return; }
    say(['¡Buen combate! Tienes mi bendición. ¡Ve a por las 8 medallas!', 'Recuerda: la taza de cada Centro Pokémon guarda un Caramelo Nivelador.'], () => { this.busy = false; });
  },
  // ---------------------------------------------------------------- objetos
  useObject(kind) {
    this.busy = true; const done = () => { this.busy = false; };
    if (kind === 'pc') { say(G.info.player + ' encendió el PC.', () => { Scenes.push(new PCScene()); done(); }); }
    else if (kind === 'heal') say('La máquina de curación de Pokémon.', done);
    else if (kind === 'cup') {
      const a = E('cupAvail');
      if (!a.avail) say('Una taza de la que sale un olor delicioso. Está vacía.... Dicen que se rellena cuando consigues una medalla nueva.', done);
      else say(['Hay una taza sobre la mesa. Dentro hay un caramelo brillante...'], () => { const r = E('cupTake'); refreshGame(); say(['¡' + G.info.player + ' recibió un Caramelo Nivelador!', 'Dáselo a un Pokémon desde la Mochila: lo sube hasta el nivel PROMEDIO de tu equipo (ahora ' + r.avg + ').'], done); });
    } else if (kind.startsWith('ball')) {
      if (this.flags.starter) { say('Ya has elegido a tu Pokémon.', done); return; }
      const st = E('starters'), s = st[+kind[4]];
      say('Es la Poké Ball de ' + s.name + '.', () => confirmBox('¿Quieres elegir a ' + s.name + '? (' + s.types.filter(Boolean).map(t => TYPE_ES[t]).join('/') + ' · Hab: ' + s.ability + ')', () => {
        E('chooseStarter', s.id); this.flags.starter = true; refreshGame();
        say(['¡' + G.info.player + ' eligió a ' + s.name + '!'], () => askNick(s.name, t => { if (t) E('nick', 0, t); this.rivalScene(); }));
      }, done));
    }
  },
  rivalScene() {
    const rv = G.info.rival, m = this.map;
    const n = { x: 6, y: 6, dir: 'up', type: 'rival', boss: true, name: rv, lines: [], sight: 0 }; m.npcs.push(n); m.rivalNpc = n;
    say(['¡Eh, ' + G.info.player + '! ¡Yo también quiero un Pokémon!', rv + ': ¡Voy a elegir el que gana al tuyo! ¡Combatamos ahora mismo!'], () => {
      this.dir = 'down'; this.startBattle('trainer', 0, -1, () => { this.flags.rivalDone = true; this.refreshInfo(); m.npcs.splice(m.npcs.indexOf(n), 1); say([rv + ': ¡Vaya! ¡Me has ganado!', 'Oak: ¡Muy bien! Ahora puedes viajar por Kanto. ¡Consigue las 8 medallas y vence a la Liga Pokémon!', 'Recibiste 5 Poké Balls y 3 Pociones del profesor.'], () => { this.busy = false; }); });
    });
  },
  interact() {
    if (this.busy || this.moving) return;
    const v = DIRV[this.dir], fx = this.x + v[0], fy = this.y + v[1], m = this.map;
    const n = this.npcAt(fx, fy);
    if (n) { this.talk(n); return; }
    const idx = fy * m.w + fx;
    if (m.signs[idx]) { this.busy = true; say(m.signs[idx], () => { this.busy = false; }); return; }
    if (m.objects && m.objects[idx]) { this.useObject(m.objects[idx]); return; }
    // mostrador: hablar con el NPC de detrás
    if (m.t[idx] === TL.COUNTER) { const b = this.npcAt(fx + v[0], fy + v[1]); if (b) { this.talk(b); return; } }
  },
  // ---------------------------------------------------------------- avance por baldosas
  update() {
    if (this.bannerT > 0) this.bannerT--;
    if (this.bubble) this.bubble.t++;
    if (this.moving) {
      this.prog += 1 / this.speed; this.anim++;
      if (this.prog >= 1) { this.prog = 0; this.moving = false; this.x = this.toX; this.y = this.toY; this.arrive(); }
      return;
    }
    if (this.busy) return;
    const held = Input.held, dirs = ['up', 'down', 'left', 'right'];
    const d = dirs.find(k => held[k]);
    if (!d) { this.turnWait = 0; return; }
    if (d !== this.dir) { this.dir = d; this.turnWait = 5; return; }
    if (this.turnWait > 0) { this.turnWait--; return; }
    const v = DIRV[d], nx = this.x + v[0], ny = this.y + v[1], m = this.map;
    if (ny < 0) { this.tryExit('north'); return; }
    if (ny >= m.h) { this.tryExit('south'); return; }
    if (nx < 0 || nx >= m.w) return;
    const t = m.t[ny * m.w + nx];
    if (SOLID.has(t) || this.npcAt(nx, ny)) return;
    this.speed = held.b ? 7 : 12;
    this.moving = true; this.prog = 0; this.fromX = this.x; this.fromY = this.y; this.toX = nx; this.toY = ny;
  },
  arrive() {
    const m = this.map, t = m.t[this.y * m.w + this.x];
    const w = m.warps.find(w => w.x === this.x && w.y === this.y);
    if (w) {
      if (m.id === 'lab' && !this.flags.starter) { this.busy = true; say('Oak: ¡Espera, ' + G.info.player + '! ¡Primero elige a tu Pokémon!', () => { this.busy = false; }); return; }
      if (m.id === 'lab' && !this.flags.rivalDone) { this.busy = true; say('Tu rival te espera para combatir.', () => { this.busy = false; }); return; }
      this.warp(w.to, w.tx, w.ty, w.dir); return;
    }
    if (m.enc && !m.indoor && ((m.enc === 'grass' && t === TL.TALL) || (m.enc === 'cave' && t === TL.CAVE)) && Math.random() < (m.enc === 'cave' ? .09 : .13)) {
      this.startBattle('wild'); return;
    }
    this.checkSight();
  }
};
class Fade extends Scene {
  constructor(dir, cb) { super(); this.dir = dir; this.t = 0; this.cb = cb; }
  opaque() { return false; }
  draw() { this.t += 1; const a = this.dir > 0 ? Math.min(1, this.t / 14) : Math.max(0, 1 - this.t / 14); ctx.fillStyle = 'rgba(0,0,0,' + a + ')'; ctx.fillRect(0, 0, W, H); if (this.t >= 14) { Scenes.pop(); this.cb(); } }
  key() {}
}

class WorldScene extends Scene {
  constructor() { super(); this.isWorld = true; }
  update() { World.update(); }
  key(k) {
    if (World.busy) return;
    if (k === 'a') World.interact();
    else if (k === 'start') { refreshGame(); Scenes.push(new StartMenu()); }
  }
  draw() {
    const w = World, m = w.map; if (!m) return;
    const px = (w.moving ? w.fromX + (w.toX - w.fromX) * w.prog : w.x) * TS, py = (w.moving ? w.fromY + (w.toY - w.fromY) * w.prog : w.y) * TS;
    let cx = px + TS / 2 - W / 2, cy = py + TS / 2 - H / 2;
    cx = m.w * TS <= W ? -(W - m.w * TS) / 2 : Math.max(0, Math.min(m.w * TS - W, cx));
    cy = m.h * TS <= H ? -(H - m.h * TS) / 2 : Math.max(0, Math.min(m.h * TS - H, cy));
    ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H);
    ctx.save(); ctx.translate(-Math.round(cx), -Math.round(cy)); ctx.imageSmoothingEnabled = false;
    const x0 = Math.max(0, Math.floor(cx / TS)), x1 = Math.min(m.w - 1, Math.floor((cx + W) / TS)), y0 = Math.max(0, Math.floor(cy / TS)), y1 = Math.min(m.h - 1, Math.floor((cy + H) / TS));
    const frame = Math.floor(performance.now() / 60);
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) { const t = m.t[y * m.w + x]; ctx.drawImage(t === TL.HEAL ? Art.heal[(frame >> 3) & 3] : Art.tile(t, frame), x * TS, y * TS, TS, TS); }
    // personajes ordenados por y
    const list = m.npcs.filter(n => !n.hidden).map(n => ({ y: n.y, draw: () => this.drawChar(Art.npc(n.type)[n.dir][0], n.x * TS, n.y * TS) }));
    const fr = w.moving ? (Math.floor(w.prog * 2) % 2 ? 1 : 2) : 0;
    list.push({ y: w.y + (w.moving ? (w.toY - w.y) * w.prog : 0), draw: () => this.drawChar(Art.player(G.info.look)[w.dir][fr], px, py) });
    list.sort((a, b) => a.y - b.y).forEach(o => o.draw());
    if (w.bubble) { const n = w.bubble.n; ctx.fillStyle = '#fff'; rr(n.x * TS + 6, n.y * TS - 28, 20, 24, 5); ctx.fill(); ctx.strokeStyle = '#222'; ctx.lineWidth = 2; ctx.stroke(); T('!', n.x * TS + 16, n.y * TS - 27, { a: 'center', s: 20, b: true, c: '#d02020' }); }
    ctx.restore();
    if (w.bannerT > 0) { const a = Math.min(1, w.bannerT / 20, (150 - w.bannerT) / 12 + .1); ctx.globalAlpha = Math.max(0, Math.min(1, a)); panel(W / 2 - 100, 10, 200, 30, { fill: '#1c2a48' }); T(w.banner, W / 2, 17, { a: 'center', s: 15, b: true }); ctx.globalAlpha = 1; }
  }
  drawChar(img, x, y) { ctx.drawImage(img, x, y + TS - 40 + 6, TS, 40); }
}
