// Prueba de humo del juego web (Playwright): gimnasio, Mega, medalla y guardado/carga.
// Uso: NODE_PATH=$(npm root -g) node tools/web_smoke_test.js   (necesita: npm i -g playwright)
const { chromium } = require('playwright');
const out = require('os').tmpdir() + '/';
(async () => {
  const b = await chromium.launch(); const ctxb = await b.newContext({ viewport: { width: 960, height: 640 } }); const p = await ctxb.newPage();
  const errs = []; p.on('pageerror', e => errs.push('PAGEERR ' + e.message)); p.on('console', m => { if (m.type() === 'error') errs.push('CONSOLE ' + m.text()); });
  await p.goto('file://' + require('path').resolve(__dirname, '..', 'docs', 'index.html') + ''); await p.waitForTimeout(2000);
  await p.evaluate(() => { E('newGame', 'difficulty=0,askNickname=0', 'Ash', 'Gary', 1, 2, 3); refreshGame(); E('chooseStarter', 'charmander'); E('dbgMon', 'charizard', 50, 'charizarditey'); E('swapParty', 1, 0); E('dbgBag', 'potion', 3); refreshGame();
    World.flags = { starter: true, rivalDone: true }; Scenes.replace(new WorldScene()); });
  const key = async (k, n = 1, w = 140) => { for (let i = 0; i < n; i++) { await p.keyboard.press(k); await p.waitForTimeout(w); } };
  const shot = async n => { await p.waitForTimeout(300); await p.screenshot({ path: out + n + '.png' }); };
  const scenes = () => p.evaluate(() => Scenes.stack.map(s => s.constructor.name).join('>'));
  const stand = (id, x, y, dir) => p.evaluate(([id, x, y, d]) => { World.busy = false; World.loadMap(id, x, y, d); World.bannerT = 0; }, [id, x, y, dir]);
  // bloqueo del líder
  await stand('o4', 11, 0, 'up'); await key('ArrowUp', 1, 100); await p.keyboard.down('ArrowUp'); await p.waitForTimeout(500); await p.keyboard.up('ArrowUp'); await p.waitForTimeout(300);
  console.log('bloqueo', await scenes()); await shot('60_gate_blocked'); await key('z', 6, 250);
  // gimnasio: Brock te ve
  await stand('g4', 6, 8, 'up'); await p.evaluate(() => World.checkSight()); await p.waitForTimeout(2000); await key('z', 4, 300); await p.waitForTimeout(2800);
  console.log('combate de gimnasio', await scenes());
  // Mega con M
  for (let i = 0; i < 12; i++) { const ph = await p.evaluate(() => Scenes.stack.find(x => x.constructor.name === 'BattleScene').phase); if (ph === 'menu') break; await key('z', 1, 200); }
  await key('m', 1, 200); await shot('61_mega_armed'); await key('Enter', 1, 200); await key('Enter', 1, 200);
  await p.waitForTimeout(1500); await key('z', 4, 250); await shot('62_mega_active');
  console.log('mega:', await p.evaluate(() => { const s = E('bState'); return s.sides[0].active.name + ' mega=' + s.sides[0].active.mega + ' sk=' + s.sides[0].active.sk; }));
  // terminar combate
  let t = 0; while (t++ < 250) { const s = await scenes(); if (!s.includes('BattleScene')) break; const ph = await p.evaluate(() => Scenes.stack.find(x => x.constructor.name === 'BattleScene').phase); if (ph === 'menu') { await key('Enter', 1, 150); await key('Enter', 1, 150); } else if (ph === 'moves') await key('Enter', 1, 150); else await key('z', 1, 120); }
  await key('z', 8, 250); console.log('fin', await scenes(), 'medallas', await p.evaluate(() => (refreshGame(), G.info.badges + ' dinero ' + G.info.money)));
  // avanzar ahora
  await stand('o4', 11, 0, 'up'); await p.keyboard.down('ArrowUp'); await p.waitForTimeout(700); await p.keyboard.up('ArrowUp'); await p.waitForTimeout(900);
  console.log('tras ganar, mapa:', await p.evaluate(() => World.map.id));
  // guardar y recargar
  await p.evaluate(() => SaveSys.save()); await p.reload(); await p.waitForTimeout(2000);
  await p.screenshot({ path: out + '63_title_continue.png' }); await key('ArrowDown'); await key('Enter', 1, 600);
  console.log('cargado:', await p.evaluate(() => ({ map: World.map && World.map.id, party: E('party').map(m => m.name + ' Nv' + m.level).join(','), badges: G.info.badges })));
  console.log(errs.join('\n') || 'sin errores');
  await b.close();
})();
