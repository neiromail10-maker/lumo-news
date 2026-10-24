// АВТОЗГЕНЕРОВАНО з Lumo main.js (2026-10-24) — не редагувати вручну
'use strict';
const path = require('path'), fs = require('fs'), https = require('https');
const OUT = process.env.LUMO_OUT || path.join(__dirname, '..', 'out');
function dataDir() { return path.join(OUT, '_d'); }
function agentsDir() { return OUT; }
function newsLog(l) { console.log('[log] ' + l); }
function isArticleUrl(u) { // v56: головна сторінка, розділ чи канал — не стаття
  try { const x = new URL(u); if (x.protocol !== 'https:' || String(u).length > 600) return false;
    const seg = x.pathname.split('/').filter(Boolean);
    if (/(^|\.)t\.me$/.test(x.hostname)) return seg.length >= 2 && /^\d+$/.test(seg[seg.length - 1]);
    if (/[?&](id|p|v|story|article|newsid|news_id|item)=[\w-]{3,}/i.test(x.search)) return true;
    if (!seg.length) return false;
    if (seg.length <= 2 && /^(tag|tags|category|categories|topic|topics|section|sections|r|author|authors|search|hub|rubric)$/i.test(seg[0])) return false;
    if (seg.length === 2 && !/\d/.test(x.pathname) && /\/$/.test(x.pathname)) return false; // типу /world/middle-east/ — розділ, не стаття
    const L = seg[seg.length - 1];
    return seg.length >= 2 ? seg.slice(1).some(x => x.length >= 8 || /\d/.test(x) || x.includes('-')) : (L.length >= 10 && /[-_\d]/.test(L));
  } catch (e) { return false; }
}
const FEEDS = [
  // [id, назва, тема, тип, url, норма свіжості в год (рідкі стрічки — більше), основне|кандидат|підказка]
  ['ki', 'Kyiv Independent', 'Україна', 'rss', ['https://kyivindependent.com/rss/', 'https://kyivindependent.com/feed', 'html:https://kyivindependent.com/news-archive/', 'gnews:kyivindependent.com'], 6, 'main'],
  ['up', 'Українська правда (англ.)', 'Україна', 'rss', 'https://www.pravda.com.ua/eng/rss/', 6, 'main', 'pravda.com.ua/eng'],
  ['ukrinform', 'Укрінформ', 'Україна', 'rss', 'https://www.ukrinform.net/rss/block-lastnews', 6, 'main'],
  ['deepstate', 'DeepState (Telegram)', 'Україна', 'tg', 'https://t.me/s/DeepStateUA', 24, 'main'],
    ['euronews', 'Euronews', 'Європа', 'rss', ['https://www.euronews.com/rss', 'https://www.euronews.com/rss?format=mrss&level=theme&name=news', 'gnews:euronews.com'], 6, 'main'],
  ['aljazeera', 'Al Jazeera', 'Світ', 'rss', 'https://www.aljazeera.com/xml/rss/all.xml', 6, 'main'],
  ['npr', 'NPR World', 'Світ', 'rss', 'https://feeds.npr.org/1004/rss.xml', 24, 'main'],
  ['mt', 'The Moscow Times', 'Росія', 'rss', 'https://www.themoscowtimes.com/rss/news', 12, 'main'],
  ['oilprice', 'OilPrice', 'Енергетика і сировина', 'rss', 'https://oilprice.com/rss/main', 12, 'main'],
  ['africanews', 'Africanews', 'Африка', 'rss', 'https://www.africanews.com/feed/rss', 24, 'main'],
  ['mercopress', 'MercoPress', 'Лат. Америка', 'rss', 'https://en.mercopress.com/rss', 48, 'main'],
  ['fxstreet', 'FXStreet', 'Ринки і макро', 'rss', ['https://www.fxstreet.com/rss/news', 'gnews:fxstreet.com'], 6, 'main'], // v79: сервери GitHub отримують 403 → запасний Google News
  ['investing', 'Investing.com', 'Ринки і макро', 'rss', 'https://www.investing.com/rss/news.rss', 12, 'main'],
  ['fed', 'ФРС (прес-релізи)', 'Ринки і макро', 'rss', 'https://www.federalreserve.gov/feeds/press_all.xml', 240, 'main'],
  ['ecb', 'ЄЦБ (прес-релізи)', 'Ринки і макро', 'rss', 'https://www.ecb.europa.eu/rss/press.html', 240, 'main'],
  ['ffcal', 'ForexFactory (календар)', 'Календар', 'ff', 'https://nfs.faireconomy.media/ff_calendar_thisweek.xml', 0, 'main'],
  ['fxcal', 'FXStreet (факти даних)', 'Календар', 'fxcal', 'https://calendar-api.fxstreet.com/en/api/v1/eventDates/{FROM}/{TO}', 0, 'main'], // v80: факт / прогноз / було за 48 год; відкривається і з Mac, і з GitHub (Myfxbook блокує хмару) // v78: що ВЖЕ вийшло (факт / прогноз / було) — лише сьогоднішні події, тож пишемо в історію
  ['gdacs', 'GDACS (катастрофи)', 'Катастрофи', 'gdacs', 'https://www.gdacs.org/xml/rss.xml', 0, 'main'],
  ['usgs', 'USGS (землетруси)', 'Катастрофи', 'rss', 'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/significant_week.atom', 0, 'main'],
  ['coindesk', 'CoinDesk', 'Крипто', 'rss', 'https://www.coindesk.com/arc/outboundfeeds/rss/', 12, 'main'],
  ['theblock', 'The Block', 'Крипто', 'rss', 'https://www.theblock.co/rss.xml', 24, 'main'],
  ['decrypt', 'Decrypt', 'Крипто', 'rss', 'https://decrypt.co/feed', 24, 'main'],
  ['cointelegraph', 'Cointelegraph', 'Крипто', 'rss', 'https://cointelegraph.com/rss', 12, 'main'],
  ['techcrunch', 'TechCrunch AI', 'AI/техно', 'rss', 'https://techcrunch.com/category/artificial-intelligence/feed/', 24, 'main'],
  ['rigzone', 'Rigzone (нафта й газ)', 'Енергетика і сировина', 'rss', 'https://www.rigzone.com/news/rss/rigzone_latest.aspx', 12, 'main'],
  ['mee', 'Middle East Eye', 'Близький Схід', 'rss', ['https://www.middleeasteye.net/rss', 'gnews:middleeasteye.net'], 12, 'main'],
  ['almonitor', 'Al-Monitor', 'Близький Схід', 'rss', 'https://www.al-monitor.com/rss', 12, 'main'],
  ['markettwits', 'MarketTwits (Telegram, підказка)', 'Підказка', 'tg', 'https://t.me/s/markettwits', 6, 'hint'],
  // після перевірки з Mac 19.10 22:16: 'main' — основні, 'extra' — додаткові (працюють, але дають мало або дублюють)
  ['ap', 'AP News', 'Світ', 'rss', ['gnews:apnews.com'], 6, 'main'], // v81 (аудит v2, Д): AP і Reuters — лише через Google News
  ['reuters', 'Reuters', 'Світ', 'rss', ['gnews:reuters.com'], 6, 'main'],
  ['bbc', 'BBC World', 'Світ', 'rss', 'https://feeds.bbci.co.uk/news/world/rss.xml', 6, 'main'],
  ['guardian', 'The Guardian World', 'Світ', 'rss', 'https://www.theguardian.com/world/rss', 6, 'main'],
  ['dw', 'DW', 'Європа', 'rss', 'https://rss.dw.com/rdf/rss-en-all', 6, 'main'],
  ['politico', 'Politico Europe', 'Європа', 'rss', 'https://www.politico.eu/feed/', 12, 'extra'],
  ['france24', 'France24', 'Світ', 'rss', 'https://www.france24.com/en/rss', 6, 'extra'],
  ['toi', 'Times of Israel', 'Близький Схід', 'rss', ['https://www.timesofisrael.com/feed/', 'gnews:timesofisrael.com'], 6, 'extra'], // v79: 403 із хмари → Google News
  ['scmp', 'South China Morning Post', 'Азія', 'rss', 'https://www.scmp.com/rss/91/feed', 12, 'main'],
  ['cna', 'CNA (Сінгапур)', 'Азія', 'rss', 'https://www.channelnewsasia.com/rssfeeds/8395986', 12, 'extra'],
  ['japantimes', 'The Japan Times', 'Азія', 'rss', 'https://www.japantimes.co.jp/feed/', 12, 'main'],
  ['taipeitimes', 'Taipei Times', 'Азія', 'rss', ['gnews:taipeitimes.com'], 24, 'extra'], // 20.10: у власній стрічці дати «в майбутньому» (часовий пояс) → лише Google News
  ['straitstimes', 'The Straits Times (Азія)', 'Азія', 'rss', 'https://www.straitstimes.com/news/asia/rss.xml', 12, 'main'],
  ['hindustan', 'Hindustan Times (світ)', 'Світ', 'rss', 'https://www.hindustantimes.com/feeds/rss/world-news/rssfeed.xml', 12, 'extra'], // 21.10 аудит: це здебільшого США/таблоїд, не Азія
  ['nprus', 'NPR (США)', 'Пн. Америка', 'rss', 'https://feeds.npr.org/1003/rss.xml', 24, 'main'], // 21.10: «Пн. Америка» не мала жодної стрічки
  ['cnbc', 'CNBC (ринки)', 'Ринки і макро', 'rss', 'https://www.cnbc.com/id/100003114/device/rss/rss.html', 12, 'main'],
  ['marketwatch', 'MarketWatch', 'Ринки і макро', 'rss', 'https://feeds.marketwatch.com/marketwatch/topstories/', 12, 'extra']
];
function fetchFeedText(url, cb, depth, plain) { // як fetchText, але з «браузерним» UA і Accept для RSS; v67: 403/406 → ще раз із простими заголовками
  if (!plain) { const cb0 = cb; cb = (d, st) => { if (!d && (st === 406 || st === 403 || st === 415)) return fetchFeedText(url, cb0, depth, true); cb0(d, st); }; }
  let called = false; const done = (d, st) => { if (called) return; called = true; try { cb(d, st || 0); } catch (e) {} };
  if ((depth || 0) > 4) return done(null, 'redirect');
  let req;
  try {
    req = https.get(url, { headers: Object.assign(/^https:\/\/calendar-api\.fxstreet\.com\//.test(url) ? { 'Origin': 'https://www.fxstreet.com', 'Referer': 'https://www.fxstreet.com/' } : {}, plain ? { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36', 'Accept': '*/*' } : { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/537.36 (KHTML, like Gecko) Lumo/64 RSS-reader', 'Accept': 'application/rss+xml, application/atom+xml, application/xml;q=0.9, text/xml;q=0.9, text/html;q=0.8, */*;q=0.5', 'Accept-Language': 'en,uk;q=0.8' }) }, res => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        res.resume(); let next = ''; try { next = new URL(res.headers.location, url).href; } catch (e) {}
        if (!/^https:\/\//.test(next)) return done(null, res.statusCode);
        return fetchFeedText(next, done, (depth || 0) + 1, true);
      }
      if (res.statusCode !== 200) { res.resume(); return done(null, res.statusCode); }
      const chunks = []; let size = 0;
      res.on('data', c => { size += c.length; if (size > 6e6) { try { req.destroy(); } catch (e) {} return done(null, 'too_big'); } chunks.push(c); });
      res.on('end', () => done(Buffer.concat(chunks).toString('utf8'), 200));
      res.on('error', () => done(null, 'error')); res.on('aborted', () => done(null, 'aborted'));
    });
    req.setTimeout(15000, () => { try { req.destroy(); } catch (e) {} done(null, 'timeout'); });
    const hard = setTimeout(() => { try { req.destroy(); } catch (e) {} done(null, 'timeout'); }, 20000); req.on('close', () => clearTimeout(hard));
    req.on('error', er => done(null, String((er && er.code) || 'error')));
  } catch (e) { done(null, 'error'); }
}
function decodeEnt(s, k) { if (!k) return decodeEnt(decodeEnt(s, 1), 1); // 23.10: подвійне кодування (&amp;#038;)
  return String(s || '').replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/&#x([0-9a-f]+);/gi, (m, h) => { try { return String.fromCodePoint(parseInt(h, 16)); } catch (e) { return ''; } })
    .replace(/&#(\d+);/g, (m, d) => { try { return String.fromCodePoint(+d); } catch (e) { return ''; } })
    .replace(/&quot;/g, '"').replace(/&apos;|&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&');
}
function stripTags(s) { return decodeEnt(String(s || '').replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim(); }
function tagVal(block, names) { for (const n of names) { const m = block.match(new RegExp('<' + n + '(?:\\s[^>]*)?>([\\s\\S]*?)</' + n + '>', 'i')); if (m) return m[1]; } return ''; }
function cleanUrl(u) { try { const x = new URL(decodeEnt(String(u || '').trim())); if (x.protocol !== 'https:' && x.protocol !== 'http:') return '';
  [...x.searchParams.keys()].forEach(k => { if (/^(utm_|traffic_source|ref$|cmpid|ito$|at_medium|at_campaign|fbclid|gclid|mc_)/i.test(k)) x.searchParams.delete(k); });
  x.hash = ''; if (x.protocol === 'http:') x.protocol = 'https:'; return x.href; } catch (e) { return ''; } }
function nyOffsetH(utcGuess) { try { const s = new Date(utcGuess).toLocaleString('en-US', { timeZone: 'America/New_York', hour12: false, timeZoneName: 'short' }); return /EDT/.test(s) ? 4 : 5; } catch (e) { return 4; } } // ET → UTC
const dgKyivF = t => { try { return new Date(t).toLocaleString('uk-UA', { timeZone: 'Europe/Kiev', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }); } catch (e) { return ''; } };
function parseFeed(text, type, baseUrl) {
  const out = [];
  if (type === 'html') { // запасний шлях: сторінка-архів сайту (статті з датою з <time datetime>)
    let host = ''; try { host = new URL(baseUrl).hostname; } catch (e) {}
    const blocks = String(text).split(/<article[\s>]/i).slice(1);
    const src = blocks.length ? blocks : String(text).split(/<\/a>/i);
    const seen = new Set();
    src.forEach(b => { const m = b.match(/<a[^>]+href="([^"#]+)"[^>]*>([\s\S]*?)<\/a>/i) || b.match(/href="([^"#]+)"[^>]*>([\s\S]*)$/i); if (!m) return;
      let u = ''; try { u = new URL(decodeEnt(m[1]), baseUrl).href; } catch (e) { return; }
      let uh = ''; try { uh = new URL(u).hostname; } catch (e) {} if (host && uh !== host) return;
      const seg = new URL(u).pathname.split('/').filter(Boolean); if (!seg.length || seg.length > 3 || /^(tag|author|category|news-archive|page|about|newsletter|membership|subscribe)$/i.test(seg[0])) return;
      const title = stripTags(m[2]).slice(0, 300); if (title.length < 25 || seen.has(u)) return; seen.add(u);
      const dt = (b.match(/datetime="([^"]+)"/i) || [])[1];
      out.push({ title, desc: '', url: u, t: dt ? Date.parse(dt) : NaN });
    });
    return out;
  }
  if (type === 'tg') {
    String(text).split('tgme_widget_message_wrap').slice(1).forEach(b => {
      const post = (b.match(/data-post="([^"]+)"/) || [])[1]; const dt = (b.match(/datetime="([^"]+)"/) || [])[1];
      const tx = stripTags((b.match(/class="tgme_widget_message_text[^"]*"[^>]*>([\s\S]*?)<\/div>/) || [])[1] || '');
      if (post && tx) out.push({ title: tx.slice(0, 220), desc: tx.slice(0, 600), url: 'https://t.me/' + post, t: dt ? Date.parse(dt) : NaN });
    });
    return out;
  }
  if (type === 'fxcal') { // v80: FXStreet calendar API (JSON): actual / consensus / previous, volatility HIGH|MEDIUM|LOW
    let arr = null; try { arr = JSON.parse(String(text)); } catch (e) { return out; } if (!Array.isArray(arr)) return out;
    const CC = { RU: 'Russia', US: 'United States', EMU: 'Euro Area', EU: 'European Union', DE: 'Germany', UK: 'United Kingdom', GB: 'United Kingdom', FR: 'France', IT: 'Italy', ES: 'Spain', JP: 'Japan', CN: 'China', CA: 'Canada', AU: 'Australia', NZ: 'New Zealand', CH: 'Switzerland', IN: 'India', KR: 'South Korea', TR: 'Turkey', PL: 'Poland', UA: 'Ukraine', BR: 'Brazil', MX: 'Mexico', NO: 'Norway', SE: 'Sweden' };
    const fmt = (v, u) => v == null || v === '' || !isFinite(+v) ? '' : String(+(+v).toFixed(3)) + (u ? (u === '%' ? '%' : ' ' + u) : '');
    arr.slice(0, 3000).forEach(e => { if (!e || typeof e !== 'object') return; const vol = String(e.volatility || '').toUpperCase(); if (vol !== 'HIGH' && vol !== 'MEDIUM') return;
      const t = Date.parse(e.dateUtc); if (!isFinite(t)) return; const ctry = CC[String(e.countryCode || '').toUpperCase()] || String(e.countryCode || ''); const name = String(e.name || '').slice(0, 160); if (!name) return;
      const u = String(e.unit || '').slice(0, 6); const rel = { actual: fmt(e.actual, u), consensus: fmt(e.consensus, u), previous: fmt(e.previous, u) }; // v81: «було» — як оприлюднено (не переглянуте)
      out.push({ title: (ctry ? ctry + ' ' : '') + name, desc: dgKyivF(t) + ' за Києвом · факт ' + (rel.actual || '—') + ' · прогноз ' + (rel.consensus || '—') + ' · було ' + (rel.previous || '—'), url: 'https://www.fxstreet.com/economic-calendar#' + String(e.id || e.eventId || t).replace(/[^\w-]/g, '').slice(0, 60), t, impact: vol === 'HIGH' ? 'High' : 'Medium', cal: true, rel }); });
    return out;
  }
  if (type === 'mfx') { // v78: Myfxbook RSS — таблиця Previous / Consensus / Actual у description (HTML-екрановано)
    (String(text).match(/<item[\s>][\s\S]*?<\/item>/gi) || []).forEach(b => {
      const title = stripTags(tagVal(b, ['title'])); const t = Date.parse(stripTags(tagVal(b, ['pubDate'])));
      const h = decodeEnt(tagVal(b, ['description'])); const imp = ((h.match(/sprite-(no|low|medium|high)-impact/i) || [])[1] || '').toLowerCase();
      if (imp !== 'high' && imp !== 'medium') return;
      const th = [...h.matchAll(/<th[^>]*>([\s\S]*?)<\/th>/gi)].map(m => stripTags(m[1]).toLowerCase()); const td = [...h.matchAll(/<td[^>]*>([\s\S]*?)<\/td>/gi)].map(m => stripTags(m[1]));
      const v = n => { const i = th.indexOf(n); return i >= 0 && td[i] != null ? td[i].trim() : ''; };
      const rel = { actual: v('actual'), consensus: v('consensus'), previous: v('previous') };
      if (!title || !isFinite(t)) return;
      out.push({ title, desc: dgKyivF(t) + ' за Києвом · факт ' + (rel.actual || '—') + ' · прогноз ' + (rel.consensus || '—') + ' · було ' + (rel.previous || '—'), url: stripTags(tagVal(b, ['link'])) || 'https://www.myfxbook.com/forex-economic-calendar', t, impact: imp === 'high' ? 'High' : 'Medium', cal: true, rel });
    });
    return out;
  }
  if (type === 'ff') {
    (String(text).match(/<event>[\s\S]*?<\/event>/g) || []).forEach(b => {
      const g = n => stripTags(tagVal(b, [n]));
      const imp = g('impact'); if (!/High|Medium/i.test(imp)) return;
      const d = g('date'), tm = g('time'); const m = d.match(/(\d{2})-(\d{2})-(\d{4})/);
      let t = NaN; if (m) { const hm = (tm.match(/(\d{1,2}):(\d{2})(am|pm)/i)); let h = 0, mi = 0; if (hm) { h = (+hm[1]) % 12 + (/pm/i.test(hm[3]) ? 12 : 0); mi = +hm[2]; } t = Date.UTC(+m[3], +m[1] - 1, +m[2], h, mi); } // 22.10 аудит-2: стрічка FF уже в UTC (зсув ET давав +4 год) // час як у стрічці FF (часовий пояс стрічки не гарантований) — сирий час додаємо в опис
      out.push({ title: g('country') + ' · ' + g('title'), desc: (isFinite(t) ? (/\d:\d\d/.test(tm) ? dgKyivF(t) + ' за Києвом' : dgKyivF(t).slice(0, 5) + ', ' + (/all day/i.test(tm) || !tm ? 'весь день' : /tentative/i.test(tm) ? 'час уточнюється' : tm)) : d + ' ' + tm) + ' · прогноз ' + (g('forecast') || '—') + ' · було ' + (g('previous') || '—') + (g('actual') ? ' · факт ' + g('actual') : ''), url: 'https://www.forexfactory.com/calendar', t, impact: imp, cal: true });
    });
    return out;
  }
  const blocks = String(text).match(/<item[\s>][\s\S]*?<\/item>|<entry[\s>][\s\S]*?<\/entry>/gi) || [];
  blocks.forEach(b => {
    const title = stripTags(tagVal(b, ['title']));
    let link = stripTags(tagVal(b, ['link'])); if (!/^https?:/.test(link)) { const m = b.match(/<link[^>]*href="([^"]+)"[^>]*>/i); link = m ? m[1] : (stripTags(tagVal(b, ['guid'])) || ''); }
    const d = stripTags(tagVal(b, ['pubDate', 'published', 'updated', 'dc:date']));
    const desc = stripTags(tagVal(b, ['description', 'summary', 'content:encoded', 'content'])).slice(0, 600);
    const lvl = stripTags(tagVal(b, ['gdacs:alertlevel']));
    const gsrc = stripTags(tagVal(b, ['source']));
    if (title && link) out.push({ title: title.slice(0, 300), desc, url: link, t: d ? Date.parse(d) : NaN, level: lvl || '', gsrc });
  });
  return out;
}
const JUNK_URL = /\/(sport|sports|football|soccer|video|videos|gallery|galleries|photos?|podcasts?|lifestyle|culture|travel|entertainment|sponsored|newsletters?|quiz|horoscope|recipes?|weather-forecast)(\/|$)/i;
const JUNK_TITLE = /^(latest news bulletin|news bulletin|watch:|listen:|podcast|quiz|newsletter|photos?:|in pictures|untitled$|commentary:|opinion:|editorial( cartoon)?\b|daily briefing|morning update|pix of the day|the blogs:|video\.)|^live:?\s*$|\bhoroscope\b|\b(kpop|k-pop)\b|\bcelebrit\w*\b(?=.*\b(wedding|marri\w*|divorce|dating|red carpet|fashion|outfit|baby)\b)|stock (rises|falls|gains|drops|underperforms|outperforms)\b.*\b(market|competitors)\b|stock (price|quote)\b|^why is .{2,60} stock (climbing|surging|falling|sinking|down|up|rising) today|earnings call transcript|price forecast:|\bprice prediction|price today\b|gold price in india|^.{2,80} at .{2,60} conference:|may move \d|\|\s*topics\s*(\||$)|oil price chart|\| guide$|latest news, videos and opinion| - page \d+$/i; // 22.10 аудит А: спорт/«live»/«roundup»/«By Investing.com» більше не викидають новини — хвости зрізає cleanTitle
const SPORT_RE = /\b(football|soccer|cup final|nba|nfl|nhl|mlb|premier league|champions league|la liga|serie a|bundesliga|formula 1|f1|grand prix|rugby|table tennis|cricket|golf|tennis|wimbledon|world cup|olympic\w*|para games|asian games|marathon)\b/i, SPORT_CTX = /\b(beat|beats|win|wins|won|score\w*|match|title|cup|season|coach|draw|defeat\w*|final|fixture|transfer|goal\w*|striker|semi-final|quarter-final)\b/i, HARD_NEWS = /\b(war|petition|sudan|strikes?|attack\w*|kill\w*|dead|deaths?|sanction\w*|bans?|banned|barred|protest\w*|boycott|government|minister|president|missile\w*|drones?|charged|arrest\w*|police|court|antisemit\w*|racis\w*|suspend\w*)\b/i;
const MOVE_RE = /\b(fall|falls|fell|drop\w*|plung\w*|tumbl\w*|slump\w*|sink\w*|sank|crash\w*|surg\w*|soar\w*|jump\w*|spik\w*|rall\w*|slid\w*|slides?)\b.{0,25}\d+(?:[.,]\d+)?\s?(%|percent)/i;
const isJunk = t => { if (MOVE_RE.test(t) || /\b(killed|dead|missile|blast|explosion|breach|hack\w*|cyber\w*)\b/i.test(t)) return /^(latest news bulletin|watch:|listen:|podcast|quiz|newsletter)/i.test(t); return JUNK_TITLE.test(t) || /\s[–-]\s*podcast$/i.test(t) || (SPORT_RE.test(t) && SPORT_CTX.test(t) && !HARD_NEWS.test(t)); }; // 23.10 аудит-3: «BTC falls 12%» більше не сміття
const PUBS = ['Al-Monitor', 'Al Jazeera', 'Middle East Eye', 'MEE', 'The Kyiv Independent', 'Kyiv Independent', 'POLITICO', 'politico.eu', 'Politico Europe', 'Reuters', 'Bloomberg', 'Taipei Times', 'CNA', 'The Straits Times', 'Straits Times', 'South China Morning Post', 'SCMP', 'Euronews', 'euronews', 'DW', 'France 24', 'FRANCE 24', 'MarketWatch', 'Investing.com', 'The Times of Israel', 'Times of Israel', 'OilPrice.com', 'Hindustan Times', 'Ukrinform', 'Ukrainska Pravda', 'The Japan Times', 'Japan Times', 'FXStreet', 'CoinDesk', 'Cointelegraph', 'Decrypt', 'The Block', 'TechCrunch', 'BBC', 'The Guardian', 'NPR', 'Rigzone', 'MercoPress', 'Africanews', 'CNBC', 'Across the world'];
function cleanTitle(t) { t = String(t || '').trim().replace(/^[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\s]+/u, ''); // хвости й префікси, що не є частиною новини
  for (let k = 0; k < 2; k++) t = t.replace(/^(live updates?|live|video|watch)\s*[:.]\s+/i, '');
  t = t.replace(/\s*\[(Africanews Today|Business Africa)\]\s*/gi, ' ').replace(/\s*:\s*SCMP's \d+ highlights$/i, '').trim();
  t = t.replace(/\s+By (Investing\.com|Reuters|AFP|Bloomberg|AP)$/i, '').replace(/^(live updates?|live|video|watch)\s*[:.]\s+/i, '').replace(/\s*\[Africanews Today\]\s*/i, ' ').replace(/\s+[-–|]\s+(photos?|video|photo, video|watch)$/i, '').replace(/^🔴\s*/, '').replace(/\s+[–-]\s+(as it happened|us politics live|live)$/i, '').replace(/\s+-\s+\w+ Roundup$/i, '');
  for (let k = 0; k < 2; k++) { const m = t.match(/\s+[-–—|]\s+([^–—|]{2,40})$/); if (m && PUBS.some(p => m[1].trim().toLowerCase() === p.toLowerCase())) t = t.slice(0, m.index).trim(); else break; }
  return t; }
const STOPW = new Set('with from that this after over into about says said will have amid their they were been more than what when where which would could news latest report reports update first last also just year years week says amid during'.split(' '));
const normT = s => String(s || '').toLowerCase().replace(/u\.s\./g, 'us').replace(/zelenskyy/g, 'zelensky').replace(/türkiye/g, 'turkiye').replace(/[^\p{L}\p{N} ]/gu, ' ').replace(/\s+/g, ' ').trim();
const DEMONYM = { russian: 'russia', ukrainian: 'ukraine', chinese: 'china', israeli: 'israel', indian: 'india', iranian: 'iran', indonesian: 'indonesia', american: 'america', european: 'europe', german: 'germany', french: 'france', british: 'britain', japanese: 'japan', korean: 'korea', turkish: 'turkey', syrian: 'syria', lebanese: 'lebanon', palestinian: 'palestine', pakistani: 'pakistan', afghan: 'afghanistan', iraqi: 'iraq', egyptian: 'egypt', nigerian: 'nigeria', polish: 'poland', italian: 'italy', spanish: 'spain', mexican: 'mexico', canadian: 'canada', brazilian: 'brazil', venezuelan: 'venezuela', cuban: 'cuba', taiwanese: 'taiwan', vietnamese: 'vietnam', thai: 'thailand', filipino: 'philippines', sudanese: 'sudan', ethiopian: 'ethiopia', kenyan: 'kenya', somali: 'somalia', yemeni: 'yemen', jordanian: 'jordan', qatari: 'qatar', emirati: 'uae', belarusian: 'belarus', moldovan: 'moldova', romanian: 'romania', hungarian: 'hungary', serbian: 'serbia', georgian: 'georgia', armenian: 'armenia', finnish: 'finland', swedish: 'sweden', norwegian: 'norway', danish: 'denmark', dutch: 'netherlands', swiss: 'switzerland', austrian: 'austria', greek: 'greece', czech: 'czechia', lithuanian: 'lithuania', latvian: 'latvia', estonian: 'estonia', saudis: 'saudi', tehran: 'iran' };
const stem = w => { const d = DEMONYM[w] || DEMONYM[w.replace(/s$/, '')]; if (d) return d; if (w.length > 4 && /s$/.test(w) && !/(ss|us|is|ys)$/.test(w)) return w.slice(0, -1); return w; }; // v83 (аудит v2 р2, А/Г): демоніми словником + однина/множина; без хибних crime/crimea, niger/nigeria // 23.10 аудит-3: indonesia/indonesian, russian/russians
const _tokC = new Map(); const tokens = s => { s = String(s || ''); let v = _tokC.get(s); if (!v) { v = new Set(normT(s).split(' ').filter(w => w.length > 3 && !STOPW.has(w)).map(stem)); if (_tokC.size > 20000) _tokC.clear(); _tokC.set(s, v); } return v; }; // 22.10 аудит Г: кеш — без нього дедуп 2500 новин підвішував Lumo
const PLACE_RE = () => new RegExp(REGION_KW.map(r => r[1].source.slice(3, -3)).join('|'), 'i');
const NOT_PLACE = /^(trump|putin|kremlin|zelensk\w*|netanyahu|erdogan|macron|merz|starmer|meloni|orban|modi|lula|milei|maduro|carney|hegseth|vance|rubio|lavrov|peskov|medvedev|gantz|lapid|white|house|congress|senate|pentagon|idf|ccp|boe|washington|french|german\w*|british|polish|spanish|dutch|danish|greek|finnish|swiss|irish|chinese|american\w*|russian\w*|ukrainian\w*|israeli\w*|iranian\w*|indian\w*|japanese|korean\w*|european\w*|african\w*|asian)$/i;
let _placeRe = null; const isPlace = w => { if (NOT_PLACE.test(w)) return false; if (!_placeRe) _placeRe = new RegExp('^(' + REGION_KW.map(r => r[1].source.slice(3, -3)).join('|') + ')$', 'i'); return _placeRe.test(w) || /^(odesa|odessa|lviv|kyiv|kharkiv|kramatorsk|sumy|dnipro|kherson|poltava|zhytomyr|rivne|ternopil|vinnytsia|cherkasy|chernivtsi|uzhhorod|lutsk|mykolaiv|zaporizhzhia|belgorod|kursk|bryansk|tambov|crimea)$/i.test(w); };
const abbrOf = s => new Set((String(s).match(/\b[A-Z]{2,5}\b|\b(Fed|BoE|BoJ|Opec)\b/g) || []).map(w => w.toUpperCase()));
const numsOf = s => new Set((String(s).match(/\d+(?:[.,]\d+)?/g) || []).map(x => String(parseFloat(x.replace(',', '.'))))); // 7.0 = 7
function similar(a, b, thr) { const A = tokens(a), B = tokens(b); if (A.size < 3 || B.size < 3) return false; let n = 0; A.forEach(w => { if (B.has(w)) n++; }); if (n < 4 && n < Math.min(A.size, B.size)) return false;
  if (n / Math.min(A.size, B.size) < (thr || 0.7)) return false; const jac = n / (A.size + B.size - n); if (Math.min(A.size, B.size) <= 3 && jac < 0.6) return false; // 22.10 аудит-2: 3 спільні слова — ще не та сама подія
  const ab = abbrOf(a), bb = abbrOf(b); if (ab.size && bb.size && ![...ab].some(x => bb.has(x)) && [...ab].concat([...bb]).some(x => !/^(US|UK|EU|UN)$/.test(x))) return false; // Fed ≠ ECB
  const da = String(a).toLowerCase().split(/[^\p{L}]+/u).filter(isPlace).map(stem), db = String(b).toLowerCase().split(/[^\p{L}]+/u).filter(isPlace).map(stem); if (da.some(x => !db.includes(x)) && db.some(x => !da.includes(x))) return false; // Одеса ≠ Харків (різні місця в обох)
  const NA = numsOf(a), NB = numsOf(b); if (NA.size && NB.size && ![...NA].some(x => NB.has(x)) && jac < 0.9) return false; // різні числа — різні події, крім оновлення того самого заголовка (58 → 73)
  const dA = [...A].filter(w => !B.has(w)), dB = [...B].filter(w => !A.has(w)); if (dA.length && dB.length && dA.some(w => /^[a-zа-яіїєґ]/.test(w) && w.length > 5) && dB.some(w => w.length > 5) && n / Math.max(A.size, B.size) < 0.5) return false; return true; }
function gnClean(x) { let t = String(x.title || ''); const g = String(x.gsrc || '').trim(); // назву джерела — точно з <source>, не регуляркою
  for (let k = 0; k < 2; k++) { if (g && (t.endsWith(' - ' + g) || t.endsWith(' – ' + g) || t.endsWith(' — ' + g))) t = t.slice(0, -(g.length + 3)).trim(); else if (!g) { t = t.replace(/\s+-\s+[^-]{2,40}$/, ''); break; } else break; }
  return cleanTitle(t); }
/* 21.10: класифікатор регіону за заголовком (стрічка «Азія» несе й США, «Світ» — Європу тощо) */
const REGION_KW = [['Україна', /\b(kramatorsk|zhytomyr|poltava|rivne|sumy|chernihiv|kherson|mykolaiv|dnipro|kryvyi rih|lviv|vinnytsia|khmelnytskyi|ternopil|lutsk|uzhhorod|ivano-frankivsk|chernivtsi|cherkasy|kropyvnytskyi|pokrovsk|kupiansk|sloviansk|izium|nikopol|zaporizhzhia|oleshky|ukrain\w*|kyiv|kiev|zelensk\w*|kharkiv|odesa|odessa|zaporizh\w*|donetsk|donbas|dnipro|lviv|sumy|chernihiv|kherson)\b/],
  ['Росія', /\b(russia\w*|kremlin|putin|moscow|lavrov|peskov|medvedev)\b/],
  ['Близький Схід', /\b(israel\w*|gaza|hamas|hezbollah|lebanon|iran\w*|tehran|hormuz|houthi\w*|yemen\w*|saudi|riyadh|qatar\w*|doha|uae|emirat\w*|dubai|iraq\w*|baghdad|syria\w*|damascus|jordan|egypt\w*|cairo|oman|kuwait|bahrain|turkey|turkiye|erdogan|netanyahu|palestin\w*|west bank|red sea|gantz|idf|lapid|persian gulf|ben gurion|haredi\w*)\b/],
  ['Європа', /\b(boe|uk|england|scotland|wales|europe\w*|eu|nato|german\w*|berlin|merz|france|french|paris|macron|britain|british|london|starmer|poland|polish|warsaw|ital\w*|rome|meloni|spain|spanish|madrid|netherlands|dutch|belgi\w*|brussels|hungar\w*|orban|austria\w*|swed\w*|norw\w*|finland|finnish|denmark|danish|greece|greek|romania\w*|bulgaria\w*|czech|slovak\w*|serbia\w*|albania\w*|moldova\w*|baltic|lithuania\w*|latvia\w*|estonia\w*|portug\w*|ireland|irish|switzerland|swiss)\b/],
  ['Азія', /\b(china|chinese|beijing|taiwan\w*|taipei|japan\w*|tokyo|korea\w*|seoul|pyongyang|india|indian|indians|delhi|mumbai|modi|osaka|busan|taoyuan|ccp|pakistan\w*|afghan\w*|bangladesh\w*|vietnam\w*|thai\w*|indonesia\w*|philippin\w*|malaysia\w*|singapore\w*|myanmar|hong kong|cambodia\w*|sri lanka|nepal|kazakh\w*|mongolia\w*)\b/],
  ['Африка', /\b(africa\w*|nigeria\w*|kenya\w*|sudan\w*|ethiopia\w*|somalia\w*|congo\w*|drc|ghana|uganda\w*|rwanda\w*|mali|niger|sahel|libya\w*|tunisia\w*|algeria\w*|morocc\w*|senegal\w*|cameroon|mozambique|zimbabwe|tanzania\w*|angola\w*|chad|burkina)\b/],
  ['Лат. Америка', /\b(south america|brazil\w*|lula|argentin\w*|milei|mexico|mexican\w*|venezuela\w*|maduro|colombia\w*|chile\w*|peru\w*|ecuador\w*|bolivia\w*|cuba\w*|haiti\w*|panama|latin america|uruguay|paraguay|guatemala)\b/],
  ['Пн. Америка', /\b(trump|white house|washington|congress|senate|united states|americans?|canada|canadian|ottawa|carney|pentagon|california|new york|florida|texas|ohio|illinois|indiana|chicago|los angeles|michigan|georgia state|arizona|nevada|alberta|quebec|nm state|atlanta|louisiana|hegseth|vance|rubio)\b/],
  ['Світ', /\b(australia\w*|new zealand|vanuatu|fiji|papua|un general assembly|g20|g7)\b/]];
function regionOf(title) { const t = normT(title).replace(/\bnew mexico\b/g, 'nm state').replace(/\b(south|latin) america\b/g, 'latin america'); const raw = String(title || ''); const hits = []; // 22.10 аудит А: перший згаданий топонім важливіший; Україна/Росія — над згадками Трампа
  REGION_KW.forEach(([r, re]) => { const g = new RegExp(re.source, 'g'); let m, k = 0, first = 1e9; while ((m = g.exec(t))) { k++; if (m.index < first) first = m.index; } if (r === 'Пн. Америка' && /\bU\.?S\.?\b(?!\$)/.test(raw)) { k++; first = Math.min(first, 500); } if (k) hits.push({ r, k, first }); });
  if (!hits.length) return ''; if (hits.length > 1) { const ua = hits.find(h => h.r === 'Україна'), ru = hits.find(h => h.r === 'Росія'); if (ua && ru) return 'Україна'; // удари Росії по Україні — це Україна
    const ur = ua || ru, na = hits.find(h => h.r === 'Пн. Америка'); if (ur && na) return ur.first <= na.first ? ur.r : na.r; }
  hits.sort((a, b) => (b.k - a.k) || (a.first - b.first)); return hits[0].r; }
/* 21.10: відбір пулу з квотами (замість «найновіші 1600»): ≤ 60 на стрічку, рівномірно по добах вікна */
const WEIGHT_RE = /\b(kill\w*|dead|deaths?|casualt\w*|strike|attack\w*|missile\w*|drones?|explosion|blast|blackout|outage|power cut|ebola|outbreak|epidemic|crash\w*|plung\w*|tumbl\w*|slump\w*|default\w*|bankrupt\w*|hack\w*|exploit|sanction\w*|ceasefire|truce|earthquake|storm|flood\w*|wildfire|evacuat\w*|blockade|mines?)\b/i;
const weightOf = x => (x.also ? x.also.length * 3 : 0) + (WEIGHT_RE.test(String(x.title || '') + ' ' + String(x.desc || '').slice(0, 200)) ? 2 : 0) + (x.role === 'main' ? 1 : 0);
function selectPool(items, cap, nowMs, winH) { const PERR = { main: 50, cand: 40, extra: 25 }; /* 22.10 аудит-2: ліміт за роллю стрічки */ const blocks = Math.max(1, Math.ceil(winH / 12)) + 1; const tOf = x => x.t || x.seen || nowMs; const nb = Math.floor(nowMs / 43200000); const blk = x => Math.min(blocks - 1, Math.max(0, nb - Math.floor(tOf(x) / 43200000))); // v81 (аудит v2, Ж): блоки прив'язані до 00/12 UTC — стабільніше між прогонами
  const byFeed = new Map(); items.forEach(x => { const a = byFeed.get(x.src) || []; a.push(x); byFeed.set(x.src, a); });
  let pre = []; const rest = []; byFeed.forEach(a => { const PER = PERR[a[0].role] || 40; const B = Array.from({ length: blocks }, () => []); a.forEach(x => B[blk(x)].push(x)); B.forEach(b => b.sort((x, y) => (weightOf(y) - weightOf(x)) || (tOf(y) - tOf(x)))); // спершу вагоміші
    const take = []; let k = 0; while (take.length < PER && B.some(b => b.length)) { const b = B[k % blocks]; if (b.length) take.push(b.shift()); k++; } pre = pre.concat(take); rest.push(B.flat()); }); // по черзі з кожного 12-год блоку
  { let room = Math.min(cap, 1400) - pre.length; const ls = rest.map(a => a.sort((x, y) => (weightOf(y) - weightOf(x)) || (tOf(y) - tOf(x)))).filter(a => a.length); let k = 0; // v81 (аудит v2, А): є місце — добираємо зрізане по черзі зі стрічок, вагоміші першими
    while (room > 0 && ls.some(a => a.length)) { const a = ls[k % ls.length]; if (a.length) { pre.push(a.shift()); room--; } k++; } }
  { const inPre = new Set(pre); const rescue = items.filter(x => !inPre.has(x) && weightOf(x) >= 2 && regionOf(x.title) && !pre.some(p => similar(p.title, x.title))).sort((a, b) => weightOf(b) - weightOf(a)).slice(0, 60); pre = pre.concat(rescue); } // 23.10 аудит-3: «Iran struck 4 oil ships» не мала замінника
  const perFeedCut = items.length - pre.length;
  if (pre.length <= cap) return { list: pre.sort((a, b) => tOf(b) - tOf(a)), cut: perFeedCut, capHit: false, perFeedCut };
  const days = Math.max(1, Math.ceil(winH / 24)); const B = Array.from({ length: days }, () => []);
  pre.forEach(x => { const d = Math.min(days - 1, Math.max(0, Math.floor((nowMs - (x.t || x.seen || nowMs)) / 86400000))); B[d].push(x); });
  const out = []; let left = cap; const quota = Math.floor(cap / days);
  B.forEach((b, i) => { const rr = new Map(); b.forEach(x => { const a = rr.get(x.src) || []; a.push(x); rr.set(x.src, a); }); // по черзі зі стрічок
    const lists = [...rr.values()].map(a => a.sort((x, y) => (y.t || y.seen || 0) - (x.t || x.seen || 0))); const take = []; let k = 0;
    while (take.length < quota && lists.some(l => l.length)) { const l = lists[k % lists.length]; if (l.length) take.push(l.shift()); k++; }
    B[i] = lists.flat(); out.push(...take); left -= take.length; });
  B.flat().sort((a, b) => (b.t || b.seen || 0) - (a.t || a.seen || 0)).slice(0, Math.max(0, left)).forEach(x => out.push(x));
  return { list: out.sort((a, b) => tOf(b) - tOf(a)), cut: items.length - out.length, capHit: true, perFeedCut };
}
// v78 (23.10): «Вийшли дані» — історія фактичних значень (Myfxbook). Файл Новини/дані/історія-даних.json, найновіші 4000.
const REL_C = { 'Russia': 'Росія', 'United States': 'США', 'Euro Area': 'Єврозона', 'European Union': 'ЄС', 'Germany': 'Німеччина', 'United Kingdom': 'Британія', 'France': 'Франція', 'Italy': 'Італія', 'Spain': 'Іспанія', 'Japan': 'Японія', 'China': 'Китай', 'Canada': 'Канада', 'Australia': 'Австралія', 'New Zealand': 'Нова Зеландія', 'Switzerland': 'Швейцарія', 'India': 'Індія', 'South Korea': 'Пд. Корея', 'Turkey': 'Туреччина', 'Poland': 'Польща', 'Ukraine': 'Україна', 'Brazil': 'Бразилія', 'Mexico': 'Мексика', 'Norway': 'Норвегія', 'Sweden': 'Швеція' };
function relFile() { return path.join(dataDir(), '..', 'Новини', 'дані', 'історія-даних.json'); }
function relRead() { try { const j = JSON.parse(fs.readFileSync(relFile(), 'utf8')); return Array.isArray(j.items) ? j.items : []; } catch (e) { return []; } }
function relSplit(title) { const k = Object.keys(REL_C).sort((a, b) => b.length - a.length).find(c => title.startsWith(c + ' ')); return k ? { country: k, what: title.slice(k.length + 1) } : { country: '', what: title }; }
function relSave(kept) { const add = kept.filter(x => x.rel && x.rel.actual && x.t); if (!add.length) return;
  const items = relRead(); const byK = new Map(items.map(x => [x.key, x]));
  add.forEach(x => { const sp = relSplit(x.title); const key = x.title + '|' + new Date(x.t).toISOString().slice(0, 16); const o = byK.get(key) || {};
    byK.set(key, Object.assign(o, { key, t: x.t, country: sp.country, what: sp.what, impact: x.impact, actual: x.rel.actual, consensus: x.rel.consensus, previous: x.rel.previous, url: x.url, seen: o.seen || Date.now() })); });
  const out = [...byK.values()].sort((a, b) => b.t - a.t).slice(0, 4000);
  const fp = relFile(); fs.mkdirSync(path.dirname(fp), { recursive: true }); fs.writeFileSync(fp + '.tmp', JSON.stringify({ updated: new Date().toISOString(), source: 'FXStreet calendar (з 23.10.2026; раніше Myfxbook)', items: out })); fs.renameSync(fp + '.tmp', fp); }
const REL_UA = [[/Non-Manufacturing PMI/i, 'PMI невиробничої сфери'], [/ex Food,? Energy/i, 'без їжі й енергії'], [/Consumer Price Index/i, 'Індекс споживчих цін (інфляція)'], [/Gross Domestic Product/i, 'ВВП'], [/\bHICP\b/, 'HICP (інфляція ЄС)'], [/Producer Price Index/i, 'Ціни виробників (PPI)'], [/Harmonized Index of Consumer Prices/i, 'Інфляція ЄС (HICP)'], [/National CPI ex Fresh Food, Energy/i, 'Базова інфляція без свіжих продуктів і енергії'], [/National CPI ex Fresh Food/i, 'Базова інфляція без свіжих продуктів'], [/National Consumer Price Index/i, 'Інфляція'], [/Michigan Consumer Sentiment Index/i, 'Настрої споживачів Мічигану'], [/Michigan Consumer Expectations Index/i, 'Очікування споживачів Мічигану'], [/Michigan Current Conditions Index/i, 'Поточні умови (Мічиган)'], [/UoM (\d+)-year Consumer Inflation Expectations?/i, 'Інфляційні очікування на $1 р. (Мічиган)'], [/Retail Sales ex[- ]Fuel/i, 'Роздрібні продажі без пального'], [/S&P Global (Manufacturing|Services|Composite) PMI/i, 'S&P Global $1 PMI'], [/HCOB (Manufacturing|Services|Composite) PMI/i, 'HCOB $1 PMI'], [/Jibun Bank (Manufacturing|Services|Composite) PMI/i, 'Jibun Bank $1 PMI'], [/Jobless Claims 4-week average/i, 'Заявки з безробіття (середнє за 4 тижні)'], [/Interest Rate Decision/i, 'Рішення щодо ставки'], [/Gfk Consumer Confidence/i, 'Споживча довіра GfK'], [/Consumer Confidence/i, 'Споживча довіра'],
[/Non ?Farm Payrolls/i, 'Нові робочі місця (NFP)'], [/Initial Jobless Claims/i, 'Нові заявки на допомогу з безробіття'], [/Continuing Jobless Claims/i, 'Повторні заявки з безробіття'], [/Unemployment Rate/i, 'Безробіття'], [/Interest Rate Decision/i, 'Рішення щодо ставки'], [/Michigan Consumer Sentiment/i, 'Настрої споживачів Мічигану'], [/Michigan (\d+)-Year Inflation Expectations/i, 'Інфляційні очікування Мічигану на $1 р.'], [/Consumer Confidence/i, 'Споживча довіра'], [/Retail Sales/i, 'Роздрібні продажі'], [/Durable Goods Orders/i, 'Замовлення товарів тривалого користування'], [/Industrial Production/i, 'Промвиробництво'], [/Trade Balance/i, 'Торговий баланс'], [/Existing Home Sales/i, 'Продажі вторинного житла'], [/New Home Sales/i, 'Продажі нового житла'], [/Building Permits/i, 'Дозволи на будівництво'], [/Housing Starts/i, 'Закладки житла'], [/Ifo Business Climate/i, 'Бізнес-клімат Ifo'], [/ZEW Economic Sentiment/i, 'Настрої ZEW'], [/Core Inflation Rate/i, 'Базова інфляція'], [/Inflation Rate/i, 'Інфляція'], [/\bCore PCE Price Index\b/i, 'Базовий PCE (інфляція)'], [/\bPCE Price Index\b/i, 'PCE (інфляція)'], [/\bGDP Growth Rate\b/i, 'Зростання ВВП'], [/\bGDP\b/, 'ВВП'], [/\bCPI\b/, 'CPI (інфляція)'], [/\bPPI\b/, 'PPI (ціни виробників)'], [/Manufacturing PMI/i, 'PMI промисловості'], [/Services PMI/i, 'PMI послуг'], [/Composite PMI/i, 'PMI загальний'], [/\bFlash\b|\bPrel(im)?\b/gi, 'попер.'], [/\bMoM\b/g, 'м/м'], [/\bYoY\b/g, 'р/р'], [/\bQoQ\b/g, 'кв/кв']];
function relUa(w) { let s0 = String(w || ''); REL_UA.forEach(([r, v]) => { s0 = s0.replace(r, v); }); return s0.replace(/\s+/g, ' ').trim(); }
function relNum(v) { const m = String(v || '').replace(/,/g, '.').match(/-?\d+(?:\.\d+)?/); return m ? parseFloat(m[0]) : NaN; }
function relForDigest(fromMs, toMs) { // лише великі економіки (або High), найважливіші першими в межах доби
  return relRead().filter(x => x.t >= fromMs && x.t <= toMs && (REL_C[x.country] || x.impact === 'High') && (x.impact === 'High' || ['United States', 'Euro Area', 'Germany', 'United Kingdom', 'China', 'Japan'].includes(x.country)))
    .sort((a, b) => ((b.impact === 'High') - (a.impact === 'High')) || (b.t - a.t)).slice(0, 30).sort((a, b) => a.t - b.t).map(x => { const a = relNum(x.actual), c = relNum(x.consensus), p = relNum(x.previous); const base = isFinite(c) ? c : p;
      const dir = isFinite(a) && isFinite(base) ? (isFinite(c) ? (a > c ? 'вище' : a < c ? 'нижче' : 'на рівні') + ' прогнозу' : '') : '';
      return { when: dgKyivF(x.t) + ' за Києвом', country: REL_C[x.country] || x.country || '', what: dgS(relUa(x.what), 120), orig: dgS(x.what, 120), actual: dgS(x.actual, 20), consensus: dgS(x.consensus, 20), previous: dgS(x.previous, 20), impact: x.impact, dir }; }); }
function collectFeeds(nowMs, winH, onlyIds, covHopt, opts) {
  opts = opts || {}; const accOld = opts.accOld || {}, accNew = opts.accNew || {}; const gDays = Math.min(4, Math.max(1, Math.ceil(winH / 24)));
  const covH = covHopt || 25; // покриття рахуємо від стандартної доби (25 год), навіть коли вікно ширше
  const fromMs = nowMs - winH * 3600000;
  const list = FEEDS.filter(f => !onlyIds || onlyIds.includes(f[0]));
  return Promise.all(list.map(f => new Promise(res0 => { let resolved = false; const res = v => { if (resolved) return; resolved = true; clearTimeout(hardT); res0(v); };
    const hardT = setTimeout(() => res({ rep: { id: f[0], name: f[1], topic: f[2], type: f[3], role: f[6], url: Array.isArray(f[4]) ? f[4][0] : f[4], status: 'fail', why: 'завис понад 150 с' }, items: [] }), 150000);
    const [id, name, topic, type, url, normH, role] = f; const t0 = Date.now();
    const finish = (rep, items) => res({ rep: Object.assign({ id, name, topic, type, role, url: Array.isArray(url) ? url[0] : url, ms: Date.now() - t0 }, rep), items: items || [] });
    const urls = Array.isArray(url) ? url : [url];
    let usedHtml = false, usedG = false; const getText = (i, cb) => { const isH = /^html:/.test(urls[i]), isG = /^gnews:/.test(urls[i]);
      const fxI = t => new Date(t).toISOString().slice(0, 19) + 'Z'; const u = isG ? 'https://news.google.com/rss/search?q=site:' + urls[i].slice(6) + '+when:' + gDays + 'd&hl=en-US&gl=US&ceid=US:en' : urls[i].replace(/^html:/, '').replace('{FROM}', fxI(nowMs - 48 * 3600000)).replace('{TO}', fxI(nowMs + 7 * 86400000));
      fetchFeedText(u, (t, s) => { let good = t && (isH || /<(item|entry)[\s>]/i.test(t));
        if (good && isH) { try { good = parseFeed(t, 'html', u).length > 0; } catch (e) { good = false; } } // сторінка без статей (захист від ботів) → далі
        if (good) { usedHtml = isH; usedG = isG; return cb(t, s, u); } if (i + 1 >= urls.length) return cb(t && !isH ? t : null, s, u); getText(i + 1, cb); }); };
    const getTg = cb => { let acc = '', pages = 0, firstSt = 0; const step = u => fetchFeedText(u, (t, s) => { if (!pages) firstSt = s; pages++; if (!t) return cb(acc || null, firstSt, urls[0]); acc += t;
        const ids = [...t.matchAll(/data-post="[^"\/]+\/(\d+)"/g)].map(m => +m[1]); const dts = [...t.matchAll(/datetime="([^"]+)"/g)].map(m => Date.parse(m[1])).filter(isFinite);
        const min = ids.length ? Math.min(...ids) : 0; const oldest = dts.length ? Math.min(...dts) : 0;
        if (pages >= 10 || !min || !oldest || oldest <= fromMs) return cb(acc, 200, urls[0]); step(urls[0] + '?before=' + min); }); step(urls[0]); };
    (type === 'tg' ? getTg : cb => getText(0, cb))((txt, st, usedUrl) => {
      if (!txt) return finish({ status: 'fail', why: 'не відкрилась (' + st + ')' });
      let items = []; try { items = parseFeed(txt, usedHtml ? 'html' : type === 'gdacs' ? 'rss' : type, usedHtml ? (usedUrl || '') : ''); } catch (e) {}
      if (usedG) items.forEach(x => { x.title = gnClean(x); x.desc = ''; });
      if (!items.length) return finish({ status: 'fail', why: /<html/i.test(txt.slice(0, 2000)) ? 'замість стрічки — сторінка сайту (можливо, захист від ботів)' : 'не вдалося розібрати', total: 0 });
      let gFail = '';
      const proc = (items, gAdd) => {
      const dated = items.filter(x => isFinite(x.t) && (x.cal || x.t <= nowMs + 3600000));
      const newest = dated.length ? Math.max(...dated.map(x => x.t)) : NaN, oldest = dated.length ? Math.min(...dated.map(x => x.t)) : NaN;
      let junk = 0, old = 0, noDate = items.length - dated.length, future = 0, lowAlert = 0; const junkEx = [];
      const kept = [];
      items.forEach(x => {
        const u = cleanUrl(x.url); if (!u) { junk++; return; }
        x.title = cleanTitle(x.title); if (JUNK_URL.test(u) || isJunk(x.title)) { junk++; if (junkEx.length < 8) junkEx.push(x.title.slice(0, 120)); return; }
        if (type === 'gdacs' && !/orange|red/i.test(x.level || '')) { lowAlert++; return; }
        if (x.cal) { if (!isFinite(x.t) || x.t < fromMs - 24 * 3600000 || x.t > nowMs + 8 * 86400000) { old++; return; } }
        else if (isFinite(x.t)) { const dOnly = id === 'taipeitimes' && x.t % 86400000 === 57600000; if ((dOnly ? x.t + 86400000 : x.t) < fromMs) { old++; return; } if (x.t > nowMs + 3600000) { future++; x.t = NaN; } }
        kept.push({ src: id, srcName: name, topic, role, title: x.title, desc: x.desc, url: u, t: isFinite(x.t) ? x.t : null, cal: !!x.cal, impact: x.impact || '', level: x.level || '', rel: x.rel || undefined });
      });
      if (type === 'mfx' || type === 'fxcal') try { relSave(kept); } catch (e) {} // v78: історія вийшлих даних
      const ageH = isFinite(newest) ? (nowMs - newest) / 3600000 : null;
      const covFrom = nowMs - covH * 3600000; const cover = !dated.length ? null : (oldest <= covFrom ? 100 : Math.max(0, Math.round((nowMs - oldest) / (covH * 3600000) * 100)));
      let status = 'ok', why = [];
      if (normH && ageH != null && ageH > normH) { status = 'warn'; why.push('найсвіжіша — ' + Math.round(ageH) + ' год тому (норма ≤ ' + normH + ')'); }
      if (normH && cover != null && cover < 60 && type !== 'ff' && type !== 'mfx' && type !== 'fxcal') { status = 'warn'; why.push('покриває лише ' + cover + '% доби'); }
      if (usedHtml) why.push('взято зі сторінки сайту (стрічка недоступна)');
      if (usedG) why.push('через Google News (стрічка сайту недоступна)');
      if (gAdd) why.push('добрано з Google News: ' + gAdd + ' (стрічка коротка)'); if (gFail) why.push(gFail);
      if (future) why.push(future + ' з датою «в майбутньому» (часовий пояс) — дату не враховано');
      if (lowAlert) why.push('зелених тривог відсіяно: ' + lowAlert + ' (беремо лише 🟠/🔴)');
      if (noDate > items.length / 2) { status = 'warn'; why.push('у більшості новин нема дати'); }
      if (old > 0 && dated.length && type !== 'ff' && type !== 'mfx' && type !== 'fxcal' && old >= items.length * 0.5 && ageH != null && ageH > (normH || 24) * 4) { status = 'warn'; why.push('стрічка застигла: ' + old + ' старих новин'); }
      finish({ status, why: why.join('; '), total: items.length, kept: kept.length, junk, junkEx, old, noDate, future, lowAlert, newestAgeH: ageH == null ? null : Math.round(ageH * 10) / 10, cover }, kept);
      };
      // v67: «добір». Стрічка коротка (тримає < 60% доби), а Lumo могла бути закрита → старшу частину доби добираємо з Google News по цьому сайту
      const dts0 = items.filter(x => isFinite(x.t) && x.t <= nowMs + 3600000).map(x => x.t); const old0 = dts0.length ? Math.min(...dts0) : NaN;
      const gapFrom = Math.max(fromMs, accNew[id] || 0); // 23.10 аудит-3: діра = від найновішої новини стрічки в накопичувачі (або початку вікна) до найстарішої у свіжій стрічці
      const knownOld = Math.min(isFinite(old0) ? old0 : Infinity, accOld[id] || Infinity);
      if (type === 'rss' && !usedG && !usedHtml && role !== 'hint' && isFinite(old0) && old0 - gapFrom > 2 * 3600000) {
        let gd = f[7] || ''; if (!gd) { try { gd = new URL(usedUrl || urls[0]).hostname.replace(/^(www|feeds|rss)\./, ''); } catch (e) {} }
        const days = gDays;
        return fetchFeedText('https://news.google.com/rss/search?q=site:' + gd + '+when:' + days + 'd&hl=en-US&gl=US&ceid=US:en', (t2, st2) => { let add = []; if (!t2) gFail = 'Google News не відповів (' + st2 + ')';
          try { add = parseFeed(t2 || '', 'rss', '').filter(x => isFinite(x.t) && x.t < old0 && x.t >= gapFrom - 3600000).map(x => Object.assign(x, { title: gnClean(x), desc: '' })).sort((a, b) => b.t - a.t); } catch (e) {}
          const have = items.map(x => x.title); const seenT = new Set(); add = add.filter(x => { const k = normT(x.title); if (seenT.has(k)) return false; seenT.add(k); return !have.some(h => similar(h, x.title)); }).slice(0, 40);
          proc(items.concat(add), add.length); });
      }
      proc(items, 0);
    });
  }))).then(rs => {
    const all = []; rs.forEach(r => r.items.forEach(x => all.push(x)));
    all.sort((a, b) => (b.t || 0) - (a.t || 0));
    const seen = new Map(), pool = []; let dupes = 0;
    const seenT = new Map(), tIdx = new Map();
    all.forEach(x => { const k = x.url.replace(/^https:\/\/(www\.)?/, '').replace(/\/$/, '') + (x.cal ? '#' + x.t + '|' + x.title : '');
      if (seen.has(k)) { dupes++; return; }
      const tk = x.cal ? '' : normT(x.title); const tw0 = tk && seenT.get(tk); seen.set(k, 1);
      if (tw0) { if (tw0.src !== x.src) (tw0.also || (tw0.also = [])).push({ src: x.src, srcName: x.srcName, url: x.url }); dupes++; return; }
      let twin = null; if (!x.cal) { const cand = new Set(); tokens(x.title).forEach(w => (tIdx.get(w) || []).forEach(p => cand.add(p))); for (const p of cand) { if (Math.abs((p.t || 0) - (x.t || 0)) < 36 * 3600000 && similar(p.title, x.title)) { twin = p; break; } } }
      if (twin) { if (twin.src !== x.src) (twin.also || (twin.also = [])).push({ src: x.src, srcName: x.srcName, url: x.url }); dupes++; return; }
      pool.push(x); if (tk) seenT.set(tk, x); if (!x.cal) tokens(x.title).forEach(w => { const l = tIdx.get(w) || []; l.push(x); tIdx.set(w, l); }); });
    const topics = {}; rs.forEach(r => { const f = r.rep; if (f.role === 'hint' || f.type === 'ff' || f.type === 'mfx' || f.type === 'fxcal' || f.topic === 'Катастрофи') return; const T = topics[f.topic] || (topics[f.topic] = { topic: f.topic, feeds: 0, ok: 0, best: 0, items: 0 });
      T.feeds++; if (f.status !== 'fail') { T.ok++; T.best = Math.max(T.best, f.cover || 0); } T.items += f.kept || 0; });
    return { at: new Date(nowMs).toISOString(), windowH: winH, covH, feeds: rs.map(r => r.rep), topics: Object.values(topics), pool, stats: { raw: all.length, kept: pool.length, dupes } };
  });
}
/* v67 (20.10.2026): НАКОПИЧУВАЧ. Багато стрічок тримають лише 7–10 год новин, а збір раз на добу втратив би решту.
   Тому Збирач (лише код, без AI і без ліміту Claude) тихо читає стрічки при відкритті Lumo й далі кожні 2 год, складаючи все в pool-accum.json (96 год, без дублів).
   Вартовий/Укладач візьмуть саме цей пул. */
let _accBusy = false;
function accPath() { return path.join(agentsDir(), 'pool-accum.json'); }
function accLoad() { const f = accPath(); if (!fs.existsSync(f)) return { items: [], runs: [] };
  try { return JSON.parse(fs.readFileSync(f, 'utf8')); } catch (e) { try { fs.renameSync(f, f + '.bad-' + Date.now()); newsLog('⚠ накопичувач пошкоджений — збережено як .bad, починаю новий'); } catch (x) {} return { items: [], runs: [] }; } }
function accMerge(r) {
  const A = accLoad(); const now = Date.parse(r.at) || Date.now(); const keep = now - 96 * 3600000;
  const key0 = u => String(u || '').replace(/^https:\/\/(www\.)?/, '').replace(/\/$/, ''); const key = (u, x) => key0(u) + (x && x.cal ? '#' + x.t + '|' + x.title : '');
  const m = new Map(), byT = new Map(), alias = new Set(), tokIdx = new Map(); const idx = x => { if (x.cal) return; [...tokens(x.title)].forEach(w => { const a = tokIdx.get(w) || []; a.push(x); tokIdx.set(w, a); }); };
  const FMAP = new Map(FEEDS.map(f => [f[0], f]));
  (A.items || []).forEach(x => { if ((x.t || x.seen || 0) < keep) return; const fd = FMAP.get(x.src); if (fd) { x.topic = fd[2]; x.role = fd[6]; } if (!x.cal) { x.title = cleanTitle(x.title); if (isJunk(x.title || '')) return; }
    if (!x.cal && !byT.has(normT(x.title))) { const cand = new Set(); [...tokens(x.title)].forEach(w => (tokIdx.get(w) || []).forEach(y => cand.add(y))); for (const y of cand) { if (Math.abs((y.t || y.seen || 0) - (x.t || x.seen || 0)) < 36 * 3600000 && similar(y.title, x.title)) { if (y.src !== x.src) (y.also || (y.also = [])).push({ src: x.src, srcName: x.srcName, url: x.url }); alias.add(key(x.url)); return; } } } if (x.src === 'taipeitimes' && !x.t) return;
    const k = key(x.url, x); if (m.has(k) || alias.has(k)) return; const tk = x.cal ? '' : normT(x.title); if (tk && byT.has(tk)) return;
    m.set(k, x); if (tk) byT.set(tk, x); idx(x); (x.also || []).forEach(a => alias.add(key(a.url))); });
  const add = x => { const k = key(x.url, x); if (m.has(k) || alias.has(k)) return; const tk = x.cal ? '' : normT(x.title);
    let tw = tk && byT.get(tk);
    if (!tw && tk && !x.cal) { const tx = x.t || now; const cand = new Set(); [...tokens(x.title)].forEach(w => (tokIdx.get(w) || []).forEach(y => cand.add(y))); // 22.10 аудит А: схожі заголовки між зборами
      for (const y of cand) { if (Math.abs((y.t || y.seen || now) - tx) < 36 * 3600000 && similar(y.title, x.title)) { tw = y; break; } } }
    if (tw) { if (tw.src !== x.src) { if (!(tw.also || []).some(a => a.src === x.src)) (tw.also || (tw.also = [])).push({ src: x.src, srcName: x.srcName, url: x.url }); }
      else if ((x.t || 0) > (tw.t || 0)) { const oldU = tw.url; Object.assign(tw, { title: x.title, desc: x.desc || tw.desc, t: x.t, url: x.url }); alias.add(key(oldU)); } // 23.10 аудит-3: нові цифри жертв не губляться
      alias.add(k); return; }
    const y = Object.assign({}, x, { seen: now }); m.set(k, y); if (tk) byT.set(tk, y); idx(y); (x.also || []).forEach(a => alias.add(key(a.url))); };
  (r.pool || []).forEach(add);
  const runs = (A.runs || []).filter(t => t >= keep); runs.push(now);
  const items = [...m.values()].sort((a, b) => (b.t || b.seen || 0) - (a.t || a.seen || 0));
  try { fs.mkdirSync(agentsDir(), { recursive: true }); const tmp = accPath() + '.tmp'; fs.writeFileSync(tmp, JSON.stringify({ at: r.at, runs, items })); fs.renameSync(tmp, accPath()); } catch (e) { try { newsLog('⚠ накопичувач не записався: ' + String(e.message || e).slice(0, 120)); } catch (x) {} }
  return { runs, items };
}
function accCover(A, src, nowMs, covH) { // покриття доби з урахуванням накопичення (якщо Lumo була відкрита між зборами)
  const from = nowMs - covH * 3600000; const ts = A.items.filter(x => x.src === src && x.t).map(x => x.t); if (!ts.length) return null;
  const oldest = Math.min(...ts); return oldest <= from ? 100 : Math.max(0, Math.round((nowMs - oldest) / (covH * 3600000) * 100));
}
function accOldest() { const o = {}; try { accLoad().items.forEach(x => { if (x.t && (!o[x.src] || x.t < o[x.src])) o[x.src] = x.t; }); } catch (e) {} return o; }
function accNewest() { const o = {}; try { accLoad().items.forEach(x => { if (x.t && (!o[x.src] || x.t > o[x.src])) o[x.src] = x.t; }); } catch (e) {} return o; } // 23.10 аудит-3: для пошуку діри після паузи
let _colP = null, _colLast = null;
// v79 (23.10.2026): ХМАРНИЙ ЗБИРАЧ — GitHub Actions щогодини збирає ті самі стрічки в гілку data сховища lumo-news.
// Lumo лише ЧИТАЄ ці файли; кожен запис перевіряється (відома стрічка, https, довжини, час); нічого звідти не виконується.
const CLOUD_RAW = 'https://raw.githubusercontent.com/neiromail10-maker/lumo-news/data/';
let _cloudLast = 0, _cloudInfo = null, _cloudP = null;
const cS = (v, n) => typeof v === 'string' ? v.slice(0, n) : '';
function cloudGet(name) { return new Promise(res => fetchFeedText(CLOUD_RAW + name + '?t=' + Date.now(), (t, st) => res(t ? { ok: true, t } : { ok: false, st }), 0, true)); }
const hostOf = u => { try { return new URL(u).hostname.replace(/^www\./, '').toLowerCase(); } catch (e) { return ''; } };
function cloudDomains() { const M = new Map(); const add = (id, h) => { if (!h) return; const a = M.get(id) || new Set(); a.add(h); M.set(id, a); };
  FEEDS.forEach(f => { (Array.isArray(f[4]) ? f[4] : [f[4]]).forEach(u => { if (/^gnews:/.test(u)) { add(f[0], u.slice(6)); add(f[0], 'news.google.com'); } else add(f[0], hostOf(String(u).replace(/^html:/, ''))); }); if (f[3] === 'tg') add(f[0], 't.me'); if (f[3] === 'ff') add(f[0], 'forexfactory.com'); if (f[3] === 'rss') add(f[0], 'news.google.com'); if (f[0] === 'bbc') { add(f[0], 'bbc.com'); add(f[0], 'bbc.co.uk'); } }); // v83: хмара добирає Google News для будь-якої rss
  try { accLoad().items.forEach(x => add(x.src, hostOf(x.url))); } catch (e) {} return M; } // v81 (аудит v2, Г): для кожної стрічки — лише її домени
const domIn = (h, set) => !!h && !!set && [...set].some(d => h === d || h.endsWith('.' + d) || (h.split('.').length >= 2 && !/^(com|co\.uk|org|net|gov)$/.test(h) && d.endsWith('.' + h)));
function cloudItem(x, nowMs, FID, DOM) { if (!x || typeof x !== 'object') return null; const fd = FID.get(x.src); if (!fd) return null;
  const url = cleanUrl(x.url); if (!/^https:\/\//.test(url) || /@/.test(url.split('/')[2] || '') || url.length > 600) return null; if (DOM && !domIn(hostOf(url), DOM.get(fd[0]))) return null; const title = cS(x.title, 400).trim(); if (!title) return null;
  const t = Number.isFinite(x.t) ? x.t : null; const cal = x.cal === true;
  if (!t) return null; if (t < nowMs - 100 * 3600000 || t > nowMs + (cal ? 9 * 86400000 : 3600000)) return null;
  const o = { src: fd[0], srcName: fd[1], topic: fd[2], role: fd[6], title, desc: cS(x.desc, 700), url, t, cal, impact: /^(High|Medium|Low)$/.test(x.impact || '') ? x.impact : '', level: cS(x.level, 20) };
  if (x.rel && typeof x.rel === 'object') o.rel = { actual: cS(x.rel.actual, 30), consensus: cS(x.rel.consensus, 30), previous: cS(x.rel.previous, 30) };
  if (Array.isArray(x.also)) { const al = x.also.slice(0, 20).map(a => { const f2 = a && FID.get(a.src); const u2 = f2 && cleanUrl(a.url); return f2 && /^https:\/\//.test(u2) && u2.length <= 600 && (!DOM || domIn(hostOf(u2), DOM.get(f2[0]))) ? { src: f2[0], srcName: f2[1], url: u2 } : null; }).filter(Boolean); if (al.length) o.also = al; }
  return o; }
function relMergeCloud(arr) { const items = relRead(); const byK = new Map(items.map(x => [x.key, x])); let n = 0;
  const nowR = Date.now(); arr.slice(0, 4000).forEach(x => { if (!x || typeof x !== 'object' || typeof x.key !== 'string' || !Number.isFinite(x.t) || x.t < nowR - 400 * 86400000 || x.t > nowR + 2 * 86400000 || typeof x.actual !== 'string' || !x.actual) return; // v81: час у розумних межах
    if (x.url && !/^https:\/\/(www\.)?(fxstreet|myfxbook|forexfactory)\.com\//.test(String(x.url))) return; const k = cS(x.key, 200); if (byK.has(k)) return;
    byK.set(k, { key: k, t: x.t, country: cS(x.country, 40), what: cS(x.what, 160), impact: x.impact === 'High' ? 'High' : 'Medium', actual: cS(x.actual, 30), consensus: cS(x.consensus, 30), previous: cS(x.previous, 30), url: /^https:\/\//.test(String(x.url || '')) ? cS(x.url, 300) : '', seen: Date.now(), cloud: true }); n++; });
  if (!n) return 0; const out = [...byK.values()].sort((a, b) => b.t - a.t).slice(0, 4000);
  const fp = relFile(); fs.mkdirSync(path.dirname(fp), { recursive: true }); fs.writeFileSync(fp + '.tmp', JSON.stringify({ updated: new Date().toISOString(), source: 'FXStreet calendar (з 23.10.2026; раніше Myfxbook)', items: out })); fs.renameSync(fp + '.tmp', fp); return n; }
function cloudPull(force) { if (_cloudP) return _cloudP; if (!force && Date.now() - _cloudLast < 20 * 60000) return Promise.resolve(_cloudInfo);
  _cloudLast = Date.now();
  _cloudP = (async () => { const info = { at: new Date().toISOString(), ok: false };
    try { const nowMs = Date.now(); const FID = new Map(FEEDS.map(f => [f[0], f]));
      const st = await cloudGet('status.json'); if (st.ok) { try { const j = JSON.parse(st.t); info.updated = cS(j.updated, 40); info.feedsOk = +((j.feeds || {}).ok) || 0; info.feedsTotal = +((j.feeds || {}).total) || 0; } catch (e) {} }
      const p = await cloudGet('pool-accum.json');
      if (!p.ok) info.error = 'файл не відкрився (' + p.st + ')';
      else { let j = null; try { j = JSON.parse(p.t); } catch (e) {}
        if (!j || !Array.isArray(j.items)) info.error = 'файл пошкоджений';
        else { const DOM = cloudDomains(); const items = j.items.slice(0, 8000).map(x => cloudItem(x, nowMs, FID, DOM)).filter(Boolean); const before = accLoad().items.length;
          const A = accMerge({ at: new Date().toISOString(), pool: items }); info.ok = true; info.got = items.length; info.added = Math.max(0, A.items.length - before); info.dropped = j.items.length - items.length; } }
      const h = await cloudGet('released-history.json'); if (h.ok) { try { const j = JSON.parse(h.t); info.released = relMergeCloud(Array.isArray(j.items) ? j.items.slice(0, 5000) : []); } catch (e) {} }
    } catch (e) { info.error = String(e && e.message || e).slice(0, 120); }
    _cloudInfo = info; _colLast = null;
    try { newsLog('☁️ Хмарний збирач: ' + (info.ok ? 'отримано ' + info.got + ', нових у накопичувачі ' + info.added + (info.released ? ', нових даних ' + info.released : '') + (info.updated ? ' · останній збір у хмарі ' + dgKyivF(Date.parse(info.updated)) : '') : 'збій — ' + (info.error || '?'))); } catch (e) {}
    return info; })().finally(() => { _cloudP = null; });
  return _cloudP; }
const cloudWait = ms => Promise.race([cloudPull(true).catch(() => null), new Promise(r => setTimeout(() => r(null), ms))]);

function collectShared(winH, maxAgeMs) { // 22.10 аудит Г: хто прийшов другим — чекає першого; свіжий (≤ maxAge) результат — повторно
  if (_colP) return _colP; if (_colLast && Date.now() - _colLast.ms < (maxAgeMs || 0) && _colLast.winH >= winH) return Promise.resolve(_colLast.r);
  const now = Date.now(); _colP = collectFeeds(now, winH, null, 25, { accOld: accOldest(), accNew: accNewest() }).then(r => { let A = null; try { A = accMerge(r); } catch (e) { newsLog('⚠ накопичувач: ' + String(e.message || e).slice(0, 120)); } r.acc = A; _colLast = { ms: Date.now(), winH, r }; return r; }).finally(() => { _colP = null; });
  return _colP; }

accPath = () => path.join(OUT, 'pool-accum.json');
relFile = () => path.join(OUT, 'released-history.json');
module.exports = { collectShared, accLoad, relRead, FEEDS };
