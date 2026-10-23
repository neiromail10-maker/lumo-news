const https=require('https');const d=new Date();const ymd=d.toISOString().slice(0,10);const y=new Date(d-86400e3).toISOString().slice(0,10);
const U=[
['fxstreet-cal',`https://calendar-api.fxstreet.com/en/api/v1/eventDates/${y}T00:00:00Z/${ymd}T23:59:59Z`],
['nasdaq',`https://api.nasdaq.com/api/calendar/economicevents?date=${y}`],
['tradingecon',`https://api.tradingeconomics.com/calendar?c=guest:guest&f=json`],
['investing-widget',`https://sslecal2.investing.com/?columns=exc_flags,exc_currency,exc_importance,exc_actual,exc_forecast,exc_previous&importance=2,3&calType=day&timeZone=55&lang=1`],
['myfxbook-rss','https://www.myfxbook.com/rss/forex-economic-calendar-events'],
['myfxbook-page','https://www.myfxbook.com/forex-economic-calendar'],
['ff-json','https://nfs.faireconomy.media/ff_calendar_thisweek.json'],
['investing-rss-cal','https://www.investing.com/rss/news_95.rss'],
['fxstreet-rss-cal','https://www.fxstreet.com/rss/economic-calendar'],
['marketwatch-cal','https://www.marketwatch.com/economy-politics/calendar'],
['econoday','https://us.econoday.com/byweek.asp?cust=us'],
['bls-rss','https://www.bls.gov/feed/bls_latest.rss'],
['ecb-rss','https://www.ecb.europa.eu/rss/press.html'],
['fred-api','https://api.stlouisfed.org/fred/releases/dates?api_key=x'],
['tradays','https://www.mql5.com/en/economic-calendar/content'],
['ft-calendar','https://www.ft.com/markets/economic-calendar'],
];
const H={'User-Agent':'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36','Accept':'application/json, text/html, */*','Accept-Language':'en-US,en;q=0.9','Origin':'https://www.fxstreet.com','Referer':'https://www.fxstreet.com/'};
const get=(u,n=0)=>new Promise(r=>{const q=https.get(u,{headers:H},s=>{if(s.statusCode>=300&&s.statusCode<400&&s.headers.location&&n<3){s.resume();return r(get(new URL(s.headers.location,u).href,n+1));}let b='';s.setEncoding('utf8');s.on('data',c=>{if(b.length<400000)b+=c});s.on('end',()=>r({st:s.statusCode,b}))});q.setTimeout(20000,()=>{q.destroy();r({st:'timeout',b:''})});q.on('error',e=>r({st:e.code,b:''}))});
(async()=>{const out={};for(const [k,u] of U){const x=await get(u);const b=x.b;out[k]={st:x.st,len:b.length,hasActual:/actual/i.test(b),sample:b.replace(/\s+/g,' ').slice(0,600)};console.log(k,x.st,b.length,/actual/i.test(b));}
require('fs').mkdirSync('out',{recursive:true});require('fs').writeFileSync('out/probe.json',JSON.stringify(out,null,1));})();
