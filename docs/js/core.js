'use strict';
// =====================================================================
//  Núcleo: lienzo, entrada, escenas, dibujo, puente con el motor Java y sprites
// =====================================================================
const W = 480, H = 320;
const cv = document.getElementById('screen');
const ctx = cv.getContext('2d');
cv.width = W * 2; cv.height = H * 2;
function fitCanvas() {
  const s = Math.min(window.innerWidth / W, window.innerHeight / H);
  cv.style.width = Math.floor(W * s) + 'px'; cv.style.height = Math.floor(H * s) + 'px';
}
window.addEventListener('resize', fitCanvas); fitCanvas();

const C = { bg: '#101428', panel: '#18203a', panel2: '#222c4c', border: '#ebebf5', gold: '#ffd24a', text: '#f2f2f8', dim: '#9aa3c0', green: '#50d25a', red: '#e6463c', yellow: '#f0c832', blue: '#68a0f0' };
const TYPE_COL = { Normal: '#a8a878', Fire: '#f08030', Water: '#6890f0', Electric: '#f8d030', Grass: '#78c850', Ice: '#98d8d8', Fighting: '#c03028', Poison: '#a040a0', Ground: '#e0c068', Flying: '#a890f0', Psychic: '#f85888', Bug: '#a8b820', Rock: '#b8a038', Ghost: '#705898', Dragon: '#7038f8', Dark: '#705848', Steel: '#b8b8d0', Fairy: '#ee99ac' };
const TYPE_ES = { Normal: 'Normal', Fire: 'Fuego', Water: 'Agua', Electric: 'Eléctrico', Grass: 'Planta', Ice: 'Hielo', Fighting: 'Lucha', Poison: 'Veneno', Ground: 'Tierra', Flying: 'Volador', Psychic: 'Psíquico', Bug: 'Bicho', Rock: 'Roca', Ghost: 'Fantasma', Dragon: 'Dragón', Dark: 'Siniestro', Steel: 'Acero', Fairy: 'Hada' };
const STATUS_ES = { brn: 'QUE', par: 'PAR', psn: 'ENV', tox: 'TOX', slp: 'DOR', frz: 'CON' };
const STATUS_COL = { brn: '#f06e28', par: '#ebc828', psn: '#aa46be', tox: '#aa46be', slp: '#828296', frz: '#78c8e6' };

// ---------- motor Java ----------
function E(method, ...args) {
  const raw = JavaCall(method, args.map(x => x === true ? '1' : x === false ? '0' : String(x)).join('\u0001'));
  let j; try { j = JSON.parse(raw); } catch (e) { console.error('JSON', method, raw); return null; }
  if (j && j.error) console.error(j.error);
  return j;
}

// ---------- dibujo ----------
function font(size, bold) { return (bold ? 'bold ' : '') + size + 'px "Segoe UI","Helvetica Neue",Arial,sans-serif'; }
function T(str, x, y, o) {
  o = o || {};
  ctx.font = font(o.s || 13, o.b); ctx.fillStyle = o.c || C.text; ctx.textAlign = o.a || 'left'; ctx.textBaseline = 'top';
  if (o.w) { const ls = wrap(str, o.w, o.s || 13, o.b); const lh = o.lh || (o.s || 13) + 3; ls.forEach((l, i) => ctx.fillText(l, x, y + i * lh)); return ls.length * lh; }
  ctx.fillText(str, x, y); return (o.s || 13) + 3;
}
const _wc = {};
function wrap(str, w, size, bold) {
  ctx.font = font(size || 13, bold);
  const out = [];
  for (const para of String(str).split('\n')) {
    let line = '';
    for (const word of para.split(' ')) {
      const t = line ? line + ' ' + word : word;
      if (ctx.measureText(t).width > w && line) { out.push(line); line = word; } else line = t;
    }
    out.push(line);
  }
  return out;
}
function panel(x, y, w, h, o) {
  o = o || {};
  ctx.fillStyle = o.fill || C.panel; ctx.strokeStyle = o.border || C.border; ctx.lineWidth = 2;
  rr(x, y, w, h, o.r || 6); ctx.fill(); ctx.stroke();
}
function rr(x, y, w, h, r) { ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); }
function selRow(x, y, w, h, sel) { ctx.fillStyle = sel ? 'rgba(255,210,74,.22)' : 'rgba(255,255,255,.05)'; rr(x, y, w, h, 4); ctx.fill(); if (sel) { ctx.strokeStyle = C.gold; ctx.lineWidth = 1.5; ctx.stroke(); } }
function bar(x, y, w, f, h) {
  h = h || 5; f = Math.max(0, Math.min(1, f));
  ctx.fillStyle = '#282c36'; rr(x, y, w, h, h / 2); ctx.fill();
  ctx.fillStyle = f > .5 ? C.green : f > .2 ? C.yellow : C.red;
  if (f > 0) { rr(x, y, Math.max(h, w * f), h, h / 2); ctx.fill(); }
}
function chip(type, x, y, w) {
  if (!type) return; w = w || 44;
  ctx.fillStyle = TYPE_COL[type] || '#777'; rr(x, y, w, 12, 6); ctx.fill();
  T(TYPE_ES[type] || type, x + w / 2, y + 0.5, { s: 9, c: '#fff', a: 'center', b: true });
}
function statusChip(st, x, y) {
  if (!st) return; ctx.fillStyle = STATUS_COL[st] || '#666'; rr(x, y, 24, 11, 4); ctx.fill();
  T(STATUS_ES[st] || st, x + 12, y, { s: 9, c: '#fff', a: 'center', b: true });
}

// ---------- entrada ----------
const KEYMAP = { ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right', w: 'up', s: 'down', a: 'left', d: 'right', W: 'up', S: 'down', A: 'left', D: 'right',
  z: 'a', Z: 'a', ' ': 'a', Enter: 'a', x: 'b', X: 'b', Backspace: 'b', Escape: 'start', Tab: 'start' };
const Input = { held: {}, tick: 0 };
window.addEventListener('keydown', e => {
  const top = Scenes.top();
  if (top && top.raw && top.raw(e)) { e.preventDefault(); return; }
  const k = KEYMAP[e.key];
  if (!k) { if (top && top.char) top.char(e.key); return; }
  e.preventDefault();
  Input.held[k] = true;
  if (e.repeat && (k === 'a' || k === 'b' || k === 'start')) return;
  if (top) top.key(k === 'start' && !top.isWorld ? 'b' : k, e.repeat);
});
window.addEventListener('keyup', e => { const k = KEYMAP[e.key]; if (k) Input.held[k] = false; });
window.addEventListener('blur', () => { Input.held = {}; });
document.querySelectorAll('.tb').forEach(b => {
  const k = b.dataset.k;
  const down = ev => { ev.preventDefault(); Input.held[k] = true; const top = Scenes.top(); if (top) top.key(k === 'start' && !top.isWorld ? 'b' : k, false); };
  const up = ev => { ev.preventDefault(); Input.held[k] = false; };
  b.addEventListener('touchstart', down, { passive: false }); b.addEventListener('touchend', up); b.addEventListener('touchcancel', up);
  b.addEventListener('mousedown', down); b.addEventListener('mouseup', up);
});
if ('ontouchstart' in window) document.getElementById('touch').style.display = 'block';

// ---------- escenas ----------
class Scene { enter() {} update() {} draw() {} key(k) {} opaque() { return true; } }
const Scenes = {
  stack: [],
  push(s) { this.stack.push(s); if (s.enter) s.enter(); return s; },
  pop() { return this.stack.pop(); },
  clear() { this.stack.length = 0; },
  top() { return this.stack[this.stack.length - 1]; },
  replace(s) { this.stack.length = 0; return this.push(s); }
};
let toastMsg = '', toastT = 0;
function toast(m) { toastMsg = m; toastT = 160; }

// ---------- menú de lista ----------
class ListMenu {
  constructor(items, visible) { this.items = items || []; this.sel = 0; this.top = 0; this.visible = visible || 8; }
  set(items) { this.items = items; if (this.sel >= items.length) this.sel = Math.max(0, items.length - 1); this.fix(); }
  fix() { if (this.sel < this.top) this.top = this.sel; if (this.sel >= this.top + this.visible) this.top = this.sel - this.visible + 1; if (this.top < 0) this.top = 0; }
  move(k) { const n = this.items.length; if (!n) return false; if (k === 'up') this.sel = (this.sel + n - 1) % n; else if (k === 'down') this.sel = (this.sel + 1) % n; else return false; this.fix(); return true; }
  draw(x, y, w, lh, fn) {
    for (let i = 0; i < this.visible && this.top + i < this.items.length; i++) {
      const idx = this.top + i, it = this.items[idx], yy = y + i * lh;
      selRow(x, yy, w, lh - 2, idx === this.sel);
      if (fn) fn(it, x, yy, idx === this.sel, idx); else T(String(it), x + 8, yy + (lh - 16) / 2, { c: idx === this.sel ? C.gold : C.text });
    }
    ctx.fillStyle = C.gold;
    if (this.top > 0) { ctx.beginPath(); ctx.moveTo(x + w - 14, y - 3); ctx.lineTo(x + w - 6, y - 3); ctx.lineTo(x + w - 10, y - 9); ctx.fill(); }
    if (this.top + this.visible < this.items.length) { const yy = y + this.visible * lh + 1; ctx.beginPath(); ctx.moveTo(x + w - 14, yy); ctx.lineTo(x + w - 6, yy); ctx.lineTo(x + w - 10, yy + 6); ctx.fill(); }
  }
  get cur() { return this.items[this.sel]; }
}

// ---------- cuadros de diálogo ----------
class Dialog extends Scene {
  constructor(lines, cb, opts) { super(); this.lines = Array.isArray(lines) ? lines : [lines]; this.cb = cb; this.i = 0; this.n = 0; this.o = opts || {}; this.wait = 0; }
  opaque() { return false; }
  update() { const s = this.lines[this.i] || ''; if (this.n < s.length) this.n += 1.4; }
  draw() {
    panel(8, H - 84, W - 16, 76, { fill: '#f4f4f8', border: '#37406a', r: 8 });
    const s = this.lines[this.i] || '';
    T(s.substring(0, Math.floor(this.n)), 22, H - 74, { s: 15, c: '#1c2038', w: W - 50, lh: 20 });
    if (this.n >= s.length && (Math.floor(performance.now() / 350) % 2)) { ctx.fillStyle = '#37406a'; ctx.beginPath(); ctx.moveTo(W - 30, H - 26); ctx.lineTo(W - 20, H - 26); ctx.lineTo(W - 25, H - 19); ctx.fill(); }
  }
  key(k) {
    if (k !== 'a' && k !== 'b') return;
    const s = this.lines[this.i] || '';
    if (this.n < s.length) { this.n = s.length; return; }
    this.i++; this.n = 0;
    if (this.i >= this.lines.length) { Scenes.pop(); if (this.cb) this.cb(); }
  }
}
function say(lines, cb) { Scenes.push(new Dialog(lines, cb)); }
// secuencia de acciones asíncronas simples
function chain(fns) { let i = 0; const next = () => { if (i < fns.length) fns[i++](next); }; next(); }

class Choice extends Scene {
  constructor(opts, cb, o) { super(); this.opts = opts; this.cb = cb; this.sel = 0; this.o = o || {}; }
  opaque() { return false; }
  draw() {
    const w = this.o.w || 150, h = this.opts.length * 24 + 14, x = this.o.x !== undefined ? this.o.x : W - w - 10, y = this.o.y !== undefined ? this.o.y : H - 90 - h;
    panel(x, y, w, h);
    this.opts.forEach((t, i) => { selRow(x + 6, y + 7 + i * 24, w - 12, 22, i === this.sel); T(t, x + 14, y + 11 + i * 24, { c: i === this.sel ? C.gold : C.text, s: 14 }); });
  }
  key(k) {
    if (k === 'up') this.sel = (this.sel + this.opts.length - 1) % this.opts.length;
    else if (k === 'down') this.sel = (this.sel + 1) % this.opts.length;
    else if (k === 'a') { Scenes.pop(); this.cb(this.sel); }
    else if (k === 'b') { Scenes.pop(); if (this.o.cancel !== false) this.cb(-1); }
  }
}
function confirmBox(q, yes, no) { say(q, () => Scenes.push(new Choice(['Sí', 'No'], i => { if (i === 0) yes && yes(); else no && no(); }, { w: 70, cancel: true }))); }

class TextInput extends Scene {
  constructor(prompt, initial, max, cb) { super(); this.prompt = prompt; this.text = initial || ''; this.max = max || 12; this.cb = cb; }
  opaque() { return false; }
  raw(e) {
    if (e.key === 'Enter') { Scenes.pop(); this.cb(this.text); return true; }
    if (e.key === 'Escape') { Scenes.pop(); this.cb(null); return true; }
    if (e.key === 'Backspace') { this.text = this.text.slice(0, -1); return true; }
    if (e.key.length === 1 && this.text.length < this.max && !e.ctrlKey && !e.metaKey) { this.text += e.key; return true; }
    return true;
  }
  key() {}
  draw() {
    ctx.fillStyle = 'rgba(0,0,0,.55)'; ctx.fillRect(0, 0, W, H);
    panel(50, 90, 380, 120);
    T(this.prompt, 66, 102, { c: C.gold, s: 14, b: true });
    ctx.fillStyle = '#0a0e1c'; rr(66, 134, 348, 32, 6); ctx.fill();
    T(this.text + (Math.floor(performance.now() / 400) % 2 ? '|' : ''), 76, 140, { s: 18, b: true });
    T('Enter: aceptar · Retroceso: borrar · Esc: cancelar', 66, 180, { s: 10, c: C.dim });
  }
}
function askNick(name, cb) {
  confirmBox('¿Quieres ponerle un apodo a ' + name + '?',
    () => Scenes.push(new TextInput('Apodo de ' + name, '', 12, t => cb(t && t.trim() ? t.trim() : null))),
    () => cb(null));
}

// ---------- sprites de Pokémon ----------
const Sprites = {
  mem: {}, loading: {}, db: null, count: 0,
  init() {
    return new Promise(res => {
      try {
        const r = indexedDB.open('pokefuego-sprites', 1);
        r.onupgradeneeded = () => r.result.createObjectStore('img');
        r.onsuccess = () => { this.db = r.result; this.preload().then(res); };
        r.onerror = () => res();
      } catch (e) { res(); }
    });
  },
  preload() {
    return new Promise(res => {
      if (!this.db) return res();
      const tx = this.db.transaction('img'), st = tx.objectStore('img'), q = st.openCursor();
      q.onsuccess = () => {
        const c = q.result;
        if (!c) { res(); return; }
        this.count++;
        const img = new Image(); img.src = URL.createObjectURL(c.value); this.mem[c.key] = img;
        c.continue();
      };
      q.onerror = () => res();
    });
  },
  put(key, blob) { if (!this.db) return; this.db.transaction('img', 'readwrite').objectStore('img').put(blob, key); const img = new Image(); img.src = URL.createObjectURL(blob); this.mem[key] = img; },
  clearRemote() { for (const k in this.mem) if (this.mem[k] === 'missing') delete this.mem[k]; },
  urls(key, num, back) {
    const u = 'https://play.pokemonshowdown.com/sprites/', l = [];
    const plain = !/-(mega|gmax|primal)/.test(key) && key.indexOf('-') < 0;
    if (num <= 386 && plain) l.push(u + (back ? 'gen3-back/' : 'gen3/') + key + '.png');
    l.push(u + (back ? 'gen5-back/' : 'gen5/') + key + '.png');
    if (!back) l.push(u + 'home/' + key + '.png');
    return l;
  },
  get(key, num, back) {
    if (!key) return null;
    const k = (back ? 'b_' : 'f_') + key;
    let v = this.mem[k];
    if (v && v !== 'missing') { if (v.complete && v.naturalWidth) return v; return null; }
    if (v === 'missing') return back ? this.get(key, num, false) : null;
    if (!this.loading[k]) { this.loading[k] = true; this.fetch(k, key, num || 999, back); }
    return back ? this.get(key, num, false) : null;
  },
  fetch(k, key, num, back) {
    const list = this.urls(key, num, back);
    const tryNext = i => {
      if (i >= list.length) { this.mem[k] = 'missing'; return; }
      const img = new Image();
      img.onload = () => { this.mem[k] = img; };
      img.onerror = () => tryNext(i + 1);
      img.src = list[i];
    };
    tryNext(0);
  }
};
// dibuja un Pokémon con los pies en (cx, gy); size = lado objetivo (px lógicos) para sprites de 64px
function drawMon(key, num, back, cx, gy, o) {
  o = o || {};
  const img = Sprites.get(key, num, back);
  const alpha = o.alpha === undefined ? 1 : o.alpha, sc = o.scale || 1;
  ctx.save(); ctx.globalAlpha = alpha;
  if (img) {
    const mx = Math.max(img.naturalWidth, img.naturalHeight);
    let z = mx <= 70 ? 2 : mx <= 125 ? 1.5 : 128 / mx;
    z *= sc;
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(img, cx - img.naturalWidth * z / 2, gy - img.naturalHeight * z, img.naturalWidth * z, img.naturalHeight * z);
  } else {
    const r = 26 * sc;
    ctx.fillStyle = 'rgba(0,0,0,.25)'; ctx.beginPath(); ctx.ellipse(cx, gy, r, r * .22, 0, 0, 7); ctx.fill();
    const cy = gy - r - 4 + Math.sin(performance.now() / 300 + num) * 2;
    ctx.fillStyle = '#e44'; ctx.beginPath(); ctx.arc(cx, cy, r, Math.PI, 0); ctx.fill();
    ctx.fillStyle = '#f4f4f4'; ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI); ctx.fill();
    ctx.strokeStyle = '#222'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(cx, cy, r, 0, 7); ctx.moveTo(cx - r, cy); ctx.lineTo(cx + r, cy); ctx.stroke();
    ctx.fillStyle = '#f4f4f4'; ctx.beginPath(); ctx.arc(cx, cy, r * .3, 0, 7); ctx.fill(); ctx.stroke();
  }
  ctx.restore();
}
function iconMon(key, num, cx, cy, size) {   // icono pequeño (menús): el sprite entero ajustado a size px
  const img = Sprites.get(key, num, false);
  if (!img) { ctx.fillStyle = '#e44'; ctx.beginPath(); ctx.arc(cx, cy, size / 3, Math.PI, 0); ctx.fill(); ctx.fillStyle = '#eee'; ctx.beginPath(); ctx.arc(cx, cy, size / 3, 0, Math.PI); ctx.fill(); return; }
  const z = size / Math.max(img.naturalWidth, img.naturalHeight);
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(img, cx - img.naturalWidth * z / 2, cy - img.naturalHeight * z / 2, img.naturalWidth * z, img.naturalHeight * z);
}
