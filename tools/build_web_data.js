// Empaqueta pokefuego/data/*.tsv en docs/js/data.js (para que index.html funcione abriéndolo con doble clic).
const fs = require('fs'), path = require('path');
const dir = path.join(__dirname, '..', 'pokefuego', 'data');
const names = ['species', 'moves', 'abilities', 'items', 'learnsets', 'types', 'es_moves', 'es_abilities', 'es_items'];
const out = {};
for (const n of names) out[n] = fs.readFileSync(path.join(dir, n + '.tsv'), 'utf8');
fs.mkdirSync(path.join(__dirname, '..', 'docs', 'js'), {recursive: true});
fs.writeFileSync(path.join(__dirname, '..', 'docs', 'js', 'data.js'), 'window.GAME_DATA = ' + JSON.stringify(out) + ';\n');
console.log('docs/js/data.js', (fs.statSync(path.join(__dirname, '..', 'docs', 'js', 'data.js')).size / 1e6).toFixed(2) + ' MB');
