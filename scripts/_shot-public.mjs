import { chromium } from 'playwright';
import fs from 'fs';
const S='/tmp/claude-0/-home-user/72100679-4ede-55e1-bd7a-b16a4452aba1/scratchpad/';
const tok=fs.readFileSync(S+'lp-token.txt','utf8').trim();
const br=await chromium.launch({executablePath:'/opt/pw-browsers/chromium', args:['--ssl-version-max=tls1.2'], proxy:{server:process.env.HTTPS_PROXY, bypass:'<-loopback>,127.0.0.1,localhost'}});
for (const [lang,w] of [['en',390],['es',390],['en',1200]]) {
  const ctx=await br.newContext({viewport:{width:w,height:844},deviceScaleFactor:w<500?2:1,locale:lang==='es'?'es-MX':'en-US'});
  const p=await ctx.newPage();
  await p.goto(`http://127.0.0.1:5199/view-estimate/${tok}`,{waitUntil:'domcontentloaded',timeout:60000});
  await p.waitForTimeout(6000);
  await p.screenshot({path:S+`lp-pub-${lang}-${w}.png`,fullPage:true});
  const txt=await p.locator('body').innerText();
  console.log(lang,w,'has $0.00:',txt.includes('$0.00'),'has 8400:',txt.includes('8400'),'has Subtotal:',/subtotal/i.test(txt));
  await ctx.close();
}
await br.close();
