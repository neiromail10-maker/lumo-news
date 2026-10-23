// Генерує collector/core.js з Lumo main.js: лише збір стрічок (FEEDS … collectShared) + isArticleUrl. Запуск: node collector/build-core.js /шлях/до/main.js
const fs = require('fs'), path = require('path');
const src = fs.readFileSync(process.argv[2], 'utf8');
const cut = (a, b) => { const i = src.indexOf(a), j = src.indexOf(b, i + 1); if (i < 0 || j < 0) throw new Error('marker: ' + a + ' / ' + b); return src.slice(i, j); };
const core = cut('function isArticleUrl(u)', '\nfunction ') + '\n' + cut('const FEEDS = [', 'const accWin = ');
if (/ipcMain|BrowserWindow|claude|spawn\(/.test(core)) throw new Error('core contains app/agent code');
const head = `// АВТОЗГЕНЕРОВАНО з Lumo main.js (${new Date().toISOString().slice(0, 10)}) — не редагувати вручну\n'use strict';\nconst path = require('path'), fs = require('fs'), https = require('https');\nconst OUT = process.env.LUMO_OUT || path.join(__dirname, '..', 'out');\nfunction dataDir() { return path.join(OUT, '_d'); }\nfunction agentsDir() { return OUT; }\nfunction newsLog(l) { console.log('[log] ' + l); }\n`;
const tail = `\naccPath = () => path.join(OUT, 'pool-accum.json');\nrelFile = () => path.join(OUT, 'released-history.json');\nmodule.exports = { collectShared, accLoad, relRead, FEEDS };\n`;
fs.writeFileSync(path.join(__dirname, 'core.js'), head + core + tail);
console.log('core.js', (head + core + tail).length, 'bytes');
