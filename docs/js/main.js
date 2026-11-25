'use strict';
// =====================================================================
//  Arranque y bucle principal
// =====================================================================
function boot() {
  main([]);                                                   // inicia el motor (TeaVM)
  const D = GAME_DATA;
  const r = E('init', D.species, D.moves, D.abilities, D.items, D.learnsets, D.types, D.es_moves, D.es_abilities, D.es_items);
  G.functional = r.functional; G.counts = r.species + ' especies/formas · ' + r.moves + ' movimientos · ' + r.abilities + ' habilidades · ' + r.items + ' objetos';
  Art.init();
  Sprites.init().then(() => {
    Scenes.push(new TitleScene());
    requestAnimationFrame(loop);
  });
}
let last = 0, acc = 0;
function loop(ts) {
  acc += Math.min(100, ts - last); last = ts;
  while (acc >= 1000 / 60) { acc -= 1000 / 60; const t = Scenes.top(); if (t) t.update(); }
  ctx.setTransform(2, 0, 0, 2, 0, 0); ctx.imageSmoothingEnabled = false;
  ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H);
  const st = Scenes.stack; let b = st.length - 1; while (b > 0 && !st[b].opaque()) b--;
  for (let i = Math.max(0, b); i < st.length; i++) st[i].draw();
  if (toastT > 0) { toastT--; ctx.font = font(12, true); const w = ctx.measureText(toastMsg).width + 24; ctx.fillStyle = 'rgba(0,0,0,.78)'; rr(W / 2 - w / 2, H - 112, w, 26, 8); ctx.fill(); T(toastMsg, W / 2, H - 106, { a: 'center', s: 12, b: true, c: '#ffe680' }); }
  requestAnimationFrame(loop);
}
window.addEventListener('load', boot);
