import { chromium } from 'playwright';
const U='https://www.levelworks.org'; const EMAIL=`lw49.test.${Date.now()}@levelworks.org`; const PW='Test-Pass-2026!';
// Same session the app creates, with the CREW code pre-applied so the $0 path can be driven headless.
const form=new URLSearchParams({mode:'payment','line_items[0][price]':process.env.STRIPE_PRICE_ANNUAL_49,'line_items[0][quantity]':'1',locale:'en',customer_email:EMAIL,customer_creation:'always',
  'discounts[0][promotion_code]':'promo_1UDsNHCrlMKmuUj4uCxRbQk0',success_url:`${U}/annual/success?session_id={CHECKOUT_SESSION_ID}`,cancel_url:`${U}/annual`,
  'metadata[plan]':'annual_49','metadata[lang]':'en','metadata[utm_source]':'selftest','metadata[utm_content]':'newcust'});
const sr=await fetch('https://api.stripe.com/v1/checkout/sessions',{method:'POST',headers:{Authorization:'Basic '+Buffer.from(process.env.STRIPE_SECRET_KEY+':').toString('base64'),'Content-Type':'application/x-www-form-urlencoded'},body:form});
const sj=await sr.json(); const url=sj.url; console.log('session', sj.id, 'amount', sj.amount_total, 'email', EMAIL);
const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium', proxy:{server:process.env.HTTPS_PROXY, bypass:'<-loopback>,127.0.0.1,localhost'}, args:['--ssl-version-max=tls1.2']});
const c=await b.newContext({viewport:{width:390,height:844},ignoreHTTPSErrors:true, isMobile:true}); const p=await c.newPage();
await p.goto(url,{waitUntil:'domcontentloaded'}); await p.waitForTimeout(4000);
// promotion code
await p.screenshot({path:'/tmp/vid3/co1.png'});
const total=await p.locator('body').innerText(); console.log('has $0.00:', /\$0\.00/.test(total));
// name field may be required for $0
const name=p.locator('input[name="billingName"]'); if(await name.count()) await name.fill('Test Contractor');
const btn=p.locator('button[type="submit"], .SubmitButton').first(); await btn.click();
await p.waitForURL(/annual\/success/,{timeout:60000}); console.log('landed', p.url().split('?')[0]);
await p.waitForTimeout(6000); await p.screenshot({path:'/tmp/vid3/ok1.png'});
console.log('setup screen:', await p.getByText(/Create my login/).count());
await p.locator('input[type=password]').nth(0).fill(PW); await p.locator('input[type=password]').nth(1).fill(PW);
await p.getByRole('button',{name:/Create my login/}).click();
await p.waitForURL(/\/app/,{timeout:60000}); await p.waitForTimeout(5000); await p.screenshot({path:'/tmp/vid3/tour1.png'});
console.log('app url', p.url(), 'tour visible:', await p.locator('.lv-tour-card').count());
for (let i=0;i<3;i++){ await p.getByRole('button',{name:/^Next$/}).click(); await p.waitForTimeout(700); await p.screenshot({path:`/tmp/vid3/tour${i+2}.png`}); }
await p.getByRole('button',{name:/Start my first estimate/}).click(); await p.waitForTimeout(2500); await p.screenshot({path:'/tmp/vid3/est.png'});
console.log('estimate builder open:', await p.locator('.eb-shell').count());
await b.close(); console.log('TESTEMAIL', EMAIL);
