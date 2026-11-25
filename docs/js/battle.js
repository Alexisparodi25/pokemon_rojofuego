'use strict';
// =====================================================================
//  Escena de combate (reproduce los eventos del motor Java)
//  M = Megaevolución · G = Dinamax/Gigamax (antes de elegir el movimiento)
// =====================================================================
class BattleScene extends Scene {
  constructor(onEnd) {
    super(); this.onEnd = onEnd; this.q = []; this.cur = null; this.last = null; this.chars = 0; this.hold = 0;
    this.phase = 'play'; this.menuSel = 0; this.moveSel = 0; this.wantMega = false; this.wantDyna = false;
    this.disp = [1, 1]; this.shake = [0, 0]; this.faint = [0, 0]; this.send = [0, 0]; this.flash = 0; this.lastSk = ['', '']; this.ended = false; this.t = 0;
    this.st = E('bState');
  }
  opaque() { return true; }
  enter() { this.enqueue(); }
  enqueue() { E('bEvents').forEach(e => this.q.push(e)); this.phase = 'play'; }
  next() {
    const e = this.q.shift();
    if (!e) { this.cur = null; return; }
    this.cur = e; this.last = e; this.chars = 0; this.hold = 0;
    if (e.hitSide >= 0) this.shake[e.hitSide] = 16;
    if (e.anim.startsWith('faint')) this.faint[+e.anim[5]] = 50;
    if (e.anim.startsWith('send')) this.send[+e.anim[4]] = 30;
    if (e.anim.startsWith('mega') || e.anim.startsWith('dmax')) this.flash = 26;
    for (let i = 0; i < 2; i++) if (e.sk[i] && e.sk[i] !== this.lastSk[i]) { this.disp[i] = e.maxHp[i] ? e.hp[i] / e.maxHp[i] : 0; this.lastSk[i] = e.sk[i]; }
  }
  update() {
    this.t++;
    if (this.phase === 'play') {
      if (!this.cur) { this.next(); if (!this.cur) this.afterPlay(); }
      else {
        const len = this.cur.msg.length;
        if (!len) { if (++this.hold > 22) this.cur = null; }
        else if (this.chars < len) this.chars = Math.min(len, this.chars + 1.6);
        else if (++this.hold > 50) this.cur = null;
      }
    }
    const v = this.cur || this.last;
    for (let i = 0; i < 2; i++) {
      if (v && v.maxHp[i] > 0) { const t = v.hp[i] / v.maxHp[i]; if (this.disp[i] > t) this.disp[i] = Math.max(t, this.disp[i] - 0.012); else if (this.disp[i] < t) this.disp[i] = Math.min(t, this.disp[i] + 0.012); }
      if (this.shake[i] > 0) this.shake[i]--; if (this.faint[i] > 0) this.faint[i]--; if (this.send[i] > 0) this.send[i]--;
    }
    if (this.flash > 0) this.flash--;
  }
  afterPlay() {
    if (this.ended) return;
    this.st = E('bState');
    if (this.st.over) { this.finish(); return; }
    if (this.st.needSwitch[1]) { E('bAiReplace'); this.enqueue(); return; }
    if (this.st.needSwitch[0]) {
      this.phase = 'wait';
      const act = this.st.sides[0].party.findIndex(p => p.active);
      Scenes.push(new PartyScene('pick', i => { E('bReplace', 0, i); this.enqueue(); }, { forced: true, activeIdx: -1 }));
      return;
    }
    if (E('bForced')) { this.submit(0, 0, false, false, ''); return; }
    this.phase = 'menu'; this.wantMega = false; this.wantDyna = false;
  }
  submit(type, idx, mega, dyna, item) {
    const r = E('bTurn', type, idx, mega, dyna, item || '');
    if (r && r.ok === false) { toast(r.msg); this.phase = 'menu'; return; }
    this.enqueue();
  }
  finish() {
    this.ended = true; this.phase = 'wait';
    const r = E('bFinish'); refreshGame();
    const msgs = r.msgs.slice();
    if (r.fled) msgs.unshift('Escapaste del combate.');
    else if (r.won && !r.captured) msgs.unshift(this.st.wild ? '¡Has ganado el combate!' : '¡Has derrotado a ' + this.st.sides[1].name + '!');
    if (G.info.nuz && r.won && !r.gameOver && /permadeath=1/.test(G.info.rules) && this.st.sides[0].party.some(p => !p.alive)) msgs.push('En Nuzlocke, los Pokémon debilitados han muerto para siempre...');
    const steps = [];
    if (/askNickname=1/.test(G.info.rules) && r.captured) steps.push(n => { const where = r.capturedIdx >= 0 ? [0, r.capturedIdx] : [1, r.capturedBoxIdx]; askNick(r.capturedName, t => { if (t) E('nickAny', where[0], where[1], t); n(); }); });
    r.learn.forEach(l => steps.push(n => learnMoveFlow(l[0], l[1], l[2], n)));
    r.evolve.forEach(e => steps.push(n => Scenes.push(new EvolutionScene(e[0], e[1], n))));
    chain([n => say(msgs, n)].concat(steps).concat([() => { Scenes.pop(); refreshGame(); this.onEnd && this.onEnd(r); }]));
  }
  // ------------------------------------------------------------ dibujo
  draw() {
    const v = this.cur || this.last;
    this.drawArena(v); if (v) this.drawHud(v); this.drawBottom(v);
    if (this.flash > 0) { ctx.fillStyle = 'rgba(255,255,255,' + this.flash / 30 + ')'; ctx.fillRect(0, 0, W, H); }
  }
  drawArena(v) {
    const g = ctx.createLinearGradient(0, 0, 0, 130); g.addColorStop(0, '#6eb4f0'); g.addColorStop(1, '#c8ebff'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, 130);
    ctx.fillStyle = '#60a858'; ctx.fillRect(0, 125, W, H - 125);
    ctx.fillStyle = '#54964c'; ctx.beginPath(); ctx.ellipse(355, 138, 100, 20, 0, 0, 7); ctx.fill(); ctx.beginPath(); ctx.ellipse(125, 212, 112, 24, 0, 0, 7); ctx.fill();
    const w = v ? v.weather : '';
    if (w === 'rain') { ctx.strokeStyle = 'rgba(80,120,220,.6)'; ctx.lineWidth = 1; for (let i = 0; i < 50; i++) { const x = (i * 53 + this.t * 6) % W, y = (i * 91 + this.t * 9) % 240; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - 4, y + 10); ctx.stroke(); } }
    else if (w === 'sun') { ctx.fillStyle = 'rgba(255,240,120,.18)'; ctx.fillRect(0, 0, W, H); ctx.fillStyle = 'rgba(255,230,80,.8)'; ctx.beginPath(); ctx.arc(450, 30, 20, 0, 7); ctx.fill(); }
    else if (w === 'sand') { ctx.fillStyle = 'rgba(214,180,110,.28)'; ctx.fillRect(0, 0, W, H); }
    else if (w === 'hail') { ctx.fillStyle = 'rgba(255,255,255,.85)'; for (let i = 0; i < 40; i++) ctx.fillRect((i * 67 + this.t * 2) % W, (i * 37 + this.t * 3) % 240, 3, 3); }
    if (!v) return;
    if (v.sk[1]) {
      const ox = this.shake[1] > 0 ? Math.sin(this.shake[1] * 1.7) * 5 : 0, oy = this.faint[1] > 0 ? (50 - this.faint[1]) * 2 : 0, slide = this.send[1] > 0 ? this.send[1] * 6 : 0;
      let al = this.faint[1] > 0 ? this.faint[1] / 50 : 1; if (v.hp[1] <= 0 && this.faint[1] === 0) al = 0;
      if (al > 0) this.mon(v.sk[1], v.num[1], false, 355 + ox + slide, 138 + oy, v.dyna[1], v.mega[1], al);
    }
    if (v.sk[0]) {
      const ox = this.shake[0] > 0 ? Math.sin(this.shake[0] * 1.7) * 5 : 0, oy = this.faint[0] > 0 ? (50 - this.faint[0]) * 2 : 0, slide = this.send[0] > 0 ? -this.send[0] * 6 : 0;
      let al = this.faint[0] > 0 ? this.faint[0] / 50 : 1; if (v.hp[0] <= 0 && this.faint[0] === 0) al = 0;
      if (al > 0) this.mon(v.sk[0], v.num[0], true, 125 + ox + slide, 222 + oy, v.dyna[0], v.mega[0], al);
    }
  }
  mon(sk, num, back, x, y, dyna, mega, alpha) {
    const sc = dyna ? 1.35 : 1;
    if (dyna) { for (let i = 0; i < 4; i++) { ctx.fillStyle = 'rgba(255,' + (40 + i * 10) + ',80,.12)'; ctx.beginPath(); ctx.arc(x, y - 50, 90 - i * 10, 0, 7); ctx.fill(); } }
    if (mega) { const p = .5 + .5 * Math.sin(this.t * .1); ctx.fillStyle = 'rgba(255,220,90,' + (.18 + .16 * p) + ')'; ctx.beginPath(); ctx.arc(x, y - 50, 80, 0, 7); ctx.fill(); ctx.strokeStyle = 'rgba(255,240,150,.7)'; ctx.lineWidth = 1.5; for (let i = 0; i < 6; i++) { const a = i * Math.PI / 3 + this.t * .02; ctx.beginPath(); ctx.moveTo(x + Math.cos(a) * 52, y - 50 + Math.sin(a) * 52); ctx.lineTo(x + Math.cos(a) * 78, y - 50 + Math.sin(a) * 78); ctx.stroke(); } }
    drawMon(sk, num, back, x, y, { scale: sc, alpha });
  }
  drawHud(v) {
    panel(10, 10, 196, 56); T(v.name[1], 18, 14, { s: 13, b: true }); T('Nv' + v.level[1], 198, 15, { a: 'right', s: 12, b: true }); statusChip(v.status[1], 18, 34);
    let tx = 48; if (v.mega[1]) { T('MEGA', tx, 33, { s: 10, b: true, c: C.gold }); tx += 34; } if (v.dyna[1]) T(v.sk[1].endsWith('gmax') ? 'GIGAMAX' : 'DINAMAX', tx, 33, { s: 10, b: true, c: '#ff7070' });
    bar(18, 44, 170, this.disp[1], 6);
    const s = this.st.sides[1]; if (!this.st.wild) { T(s.name, 198, 51, { a: 'right', s: 9, c: C.dim }); s.party.forEach((p, i) => { ctx.fillStyle = p.alive ? '#f05a50' : '#555'; ctx.beginPath(); ctx.arc(21 + i * 9, 58, 3, 0, 7); ctx.fill(); }); }
    const y = 148; panel(264, y, 206, 60); T(v.name[0], 272, y + 4, { s: 13, b: true }); T('Nv' + v.level[0], 462, y + 5, { a: 'right', s: 12, b: true }); statusChip(v.status[0], 272, y + 24);
    tx = 302; if (v.mega[0]) { T('MEGA', tx, y + 23, { s: 10, b: true, c: C.gold }); tx += 34; } if (v.dyna[0]) T(v.sk[0].endsWith('gmax') ? 'GIGAMAX' : 'DINAMAX', tx, y + 23, { s: 10, b: true, c: '#ff7070' });
    bar(272, y + 34, 180, this.disp[0], 6); T(Math.max(0, Math.round(this.disp[0] * v.maxHp[0])) + ' / ' + v.maxHp[0], 462, y + 43, { a: 'right', s: 10, c: C.dim });
    const lab = []; if (v.weather) lab.push({ rain: '☂ Lluvia', sun: '☀ Sol', sand: 'Tormenta de arena', hail: '❄ Granizo' }[v.weather]); if (v.terrain) lab.push('Campo ' + { electric: 'eléctrico', grassy: 'de hierba', misty: 'de niebla', psychic: 'psíquico' }[v.terrain]); if (this.st.trickRoom) lab.push('Espacio Raro');
    if (lab.length) T(lab.join(' · '), 470, 68, { a: 'right', s: 10, c: '#123', b: true });
    const hz = s => [s.rocks ? 'Rocas' : '', s.spikes ? 'Púas×' + s.spikes : '', s.tspikes ? 'Tóx' : '', s.web ? 'Red' : '', s.reflect ? 'Reflejo' : '', s.lscreen ? 'P.Luz' : '', s.veil ? 'V.Aurora' : '', s.tailwind ? 'Viento' : ''].filter(Boolean).join(' ');
    const a = hz(this.st.sides[0]), b = hz(s); if (a) T('Tu campo: ' + a, 10, 100, { s: 9, c: '#123' }); if (b) T('Campo rival: ' + b, 10, 112, { s: 9, c: '#123' });
  }
  drawBottom(v) {
    const st = this.st;
    panel(8, 240, W - 16, 72, { fill: '#f4f4f8', border: '#37406a' });
    if (this.phase === 'play' || this.phase === 'wait') {
      const msg = this.cur ? this.cur.msg.substring(0, Math.floor(this.chars)) : (this.last ? this.last.msg : '');
      T(msg, 22, 252, { s: 15, c: '#1c2038', w: W - 50, lh: 20 });
    } else if (this.phase === 'menu') {
      const u = st.sides[0].active;
      T('¿Qué debe hacer ' + u.name + '?', 22, 254, { s: 14, c: '#1c2038', w: 190 });
      panel(W - 220, 240, 212, 72); ['LUCHAR', 'MOCHILA', 'POKÉMON', st.wild ? 'HUIR' : '—'].forEach((t, i) => { const x = W - 212 + (i % 2) * 102, y = 247 + Math.floor(i / 2) * 31; selRow(x, y, 98, 27, i === this.menuSel); T(t, x + 10, y + 7, { s: 13, b: true, c: i === this.menuSel ? C.gold : C.text }); });
      let hint = ''; if (st.canMega) hint += '[M] Mega  '; if (st.canDyna) hint += '[G] Dinamax'; if (st.sides[0].transformed) hint = 'Transformación ya usada';
      T(hint, 22, 290, { s: 11, c: '#a06a10', b: true });
    } else if (this.phase === 'moves') {
      const mv = this.wantDyna ? st.maxMoves : st.moves;
      mv.forEach((m, i) => { const x = 16 + (i % 2) * 150, y = 246 + Math.floor(i / 2) * 31; selRow(x, y, 146, 28, i === this.moveSel); ctx.fillStyle = TYPE_COL[m.type]; ctx.fillRect(x + 4, y + 4, 4, 20); T(m.name, x + 13, y + 3, { s: 11, b: true, c: m.pp > 0 ? '#1c2038' : '#999' }); T('PP ' + m.pp + '/' + m.maxPp, x + 13, y + 16, { s: 9, c: m.pp ? '#555d7a' : C.red }); if (m.bp) T('' + m.bp, x + 140, y + 3, { a: 'right', s: 10, b: true, c: '#a06a10' }); });
      panel(W - 172, 240, 164, 72); const m = mv[this.moveSel]; if (m) { chip(m.type, W - 166, 245, 44); T((m.cat === 'P' ? 'Físico' : m.cat === 'S' ? 'Especial' : 'Estado') + (m.acc ? ' · Prec ' + m.acc : ''), W - 118, 246, { s: 9, c: C.dim }); T(m.desc, W - 166, 262, { s: 9, w: 154, lh: 11, c: '#ccd' }); }
      let t = ''; if (st.canMega) t += this.wantMega ? '[M] MEGA ✔  ' : '[M] Mega  '; if (st.canDyna) t += this.wantDyna ? '[G] DINAMAX ✔' : '[G] Dinamax'; T(t, 16, 230, { s: 10, b: true, c: '#a06a10' });
    }
  }
  // ------------------------------------------------------------ entrada
  char(c) {
    if (this.phase !== 'menu' && this.phase !== 'moves') return;
    if ((c === 'm' || c === 'M') && this.st.canMega) { this.wantMega = !this.wantMega; this.wantDyna = false; toast(this.wantMega ? 'Megaevolución activada: elige un movimiento' : 'Megaevolución cancelada'); }
    else if ((c === 'g' || c === 'G') && this.st.canDyna) { this.wantDyna = !this.wantDyna; this.wantMega = false; toast(this.wantDyna ? 'Dinamax activado: elige un movimiento' : 'Dinamax cancelado'); }
  }
  key(k) {
    if (this.phase === 'play') { if ((k === 'a' || k === 'b') && this.cur) { if (this.chars < this.cur.msg.length) this.chars = this.cur.msg.length; else this.cur = null; } return; }
    if (this.phase === 'menu') {
      if (k === 'left' || k === 'right') this.menuSel ^= 1; else if (k === 'up' || k === 'down') this.menuSel ^= 2;
      else if (k === 'a') {
        if (this.menuSel === 0) { this.phase = 'moves'; this.moveSel = 0; }
        else if (this.menuSel === 1) {
          if (!this.st.wild && !/battleItems=1/.test(G.info.rules)) { toast('Reglas: no se pueden usar objetos contra entrenadores.'); return; }
          Scenes.push(new BagScene({ battle: true, cb: r => { if (!r) return; if (r.type === 'ball') this.submit(4, 0, false, false, r.id); else this.submit(2, r.idx, false, false, r.id); } }));
        } else if (this.menuSel === 2) {
          Scenes.push(new PartyScene('pick', i => { if (i >= 0) this.submit(1, i, false, false, ''); }, { activeIdx: this.st.sides[0].party.findIndex(p => p.active) }));
        } else { if (!this.st.wild) { toast('¡No puedes huir de un combate contra un entrenador!'); return; } this.submit(3, 0, false, false, ''); }
      }
      return;
    }
    if (this.phase === 'moves') {
      if (k === 'left' || k === 'right') this.moveSel ^= 1; else if (k === 'up' || k === 'down') this.moveSel ^= 2; else if (k === 'b') this.phase = 'menu';
      else if (k === 'a') {
        const m = this.st.moves[this.moveSel]; if (!m) return;
        if (m.pp <= 0) { toast('¡No quedan PP para ese movimiento!'); return; }
        if (!m.usable) { toast('¡No puedes usar ese movimiento ahora!'); return; }
        this.submit(0, this.moveSel, this.wantMega, this.wantDyna, '');
      }
    }
  }
}
