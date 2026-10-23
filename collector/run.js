// Хмарний збирач Lumo: раз на годину читає стрічки й оновлює накопичувач (96 год) та історію «Вийшли дані».
'use strict';
const fs = require('fs'), path = require('path');
const OUT = process.env.LUMO_OUT || path.join(__dirname, '..', 'out'); fs.mkdirSync(OUT, { recursive: true });
const C = require('./core.js');
const WIN_H = 36;
(async () => {
  const t0 = Date.now();
  const r = await C.collectShared(WIN_H, 0);
  const A = r.acc || C.accLoad();
  const ok = r.feeds.filter(f => f.status === 'ok').length, warn = r.feeds.filter(f => f.status === 'warn').length, fail = r.feeds.filter(f => f.status === 'fail');
  const status = { updated: new Date().toISOString(), ms: Date.now() - t0, items: A.items.length, released: C.relRead().length,
    feeds: { total: r.feeds.length, ok, warn, fail: fail.map(f => f.name + ': ' + (f.why || '')) },
    perFeed: r.feeds.map(f => ({ id: f.id, status: f.status, kept: f.kept, why: f.why || '' })) };
  fs.writeFileSync(path.join(OUT, 'status.json'), JSON.stringify(status, null, 1));
  console.log('ok', ok, 'warn', warn, 'fail', fail.length, '· items', A.items.length, '·', Math.round(status.ms / 1000) + ' s');
  fail.forEach(f => console.log('  ✗', f.name, f.why));
  process.exit(0);
})().catch(e => { console.error('FATAL', e && e.stack || e); process.exit(1); });
