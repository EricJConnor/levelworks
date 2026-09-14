import { chromium } from 'playwright';
const S='/tmp/claude-0/-home-user/72100679-4ede-55e1-bd7a-b16a4452aba1/scratchpad/';
const B='http://127.0.0.1:5199';
const br=await chromium.launch({executablePath:'/opt/pw-browsers/chromium', args:['--ssl-version-max=tls1.2'], proxy:{server:process.env.HTTPS_PROXY, bypass:'<-loopback>,127.0.0.1,localhost'}});
const ctx=await br.newContext({viewport:{width:390,height:844},deviceScaleFactor:2,isMobile:true,hasTouch:true});
const p=await ctx.newPage();
process.on('uncaughtException',async e=>{console.log('FAIL',e.message.split('\n')[0]); try{await p.screenshot({path:S+'lp-fail.png',fullPage:true});}catch{} process.exit(1);});
p.on('pageerror',e=>console.log('pageerror',e.message));
await p.goto(B+'/app',{waitUntil:'domcontentloaded',timeout:60000});
await p.locator('.lv-btn.pri.wide').first().click({timeout:30000});
await p.waitForSelector('input[type=email]',{timeout:30000});
await p.fill('input[type=email]','demo.lw49@levelworks.org');
await p.fill('input[type=password]','Level-Demo-2026');
await p.click('button[type=submit]');
await p.waitForTimeout(8000);
await p.screenshot({path:S+'lp-0-app.png'});
// open a new estimate
await p.locator('button:visible:has-text("New estimate")').first().click({timeout:15000});
await p.waitForSelector('.eb-shell',{timeout:15000});
await p.fill('input[placeholder="Maria Keller"]','Sarah Klein');
await p.keyboard.press('Tab');
await p.fill('input[placeholder="Exterior repaint"]','Master bath remodel');
await p.keyboard.press('Tab');
const descs=p.locator('.eb-shell textarea');
await descs.nth(0).fill('Demo existing tile, shower pan and vanity');
// rate inputs
const rates=p.locator('.eb-shell input.lv-input.num');
console.log('num inputs', await rates.count());
// add two more lines
const add=p.locator('.eb-add').first(); await add.click(); await add.click();
await p.locator('.eb-shell textarea').nth(1).fill('Tile shower walls and floor, set new pan, glass door');
await p.locator('.eb-shell textarea').nth(2).fill('Vanity, faucet, toilet and finish plumbing');
// find rate inputs by aria/label: each item has Qty then Rate then line total; rate is the 2nd numeric input per item
const items=p.locator('.eb-item, .eb-line, [class*="eb-item"]');
console.log('items', await items.count());
const nums=p.locator('.eb-shell .lv-input.num');
console.log('nums', await nums.count());
// set rates on the last line only (lump sum): assume order qty,rate per item
const it=p.locator('.eb-item'); console.log('eb-items', await it.count());
await it.nth(2).locator('input.lv-input.num').nth(1).fill('8400');
await p.screenshot({path:S+'lp-1-builder.png',fullPage:true});
// switch
const sw=p.locator('.lv-switch'); console.log('switch', await sw.count(), await sw.first().getAttribute('aria-checked'));
await sw.first().scrollIntoViewIfNeeded(); await sw.first().click(); console.log('after', await sw.first().getAttribute('aria-checked'));
await p.screenshot({path:S+'lp-2-switch.png'});
await p.locator('button:has-text("Preview")').first().click();
await p.waitForTimeout(4000);
await p.screenshot({path:S+'lp-3-preview.png',fullPage:true});
console.log('url', p.url());
await br.close();
