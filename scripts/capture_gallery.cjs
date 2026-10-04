// Real product screenshots, captured independently of the regression suite.
const {chromium}=require('playwright');
const fs=require('node:fs');
const assert=require('node:assert/strict');
(async()=>{
 fs.mkdirSync('gallery-results',{recursive:true});
 const browser=await chromium.launch({args:['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 try{
  const page=await browser.newPage({viewport:{width:1800,height:1100},deviceScaleFactor:1});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  const range=async(id,value)=>page.locator(id).evaluate((el,value)=>{el.value=value;el.dispatchEvent(new Event('input',{bubbles:true}));},String(value));
  const ready=()=>page.waitForSelector('#load-state',{state:'hidden'});
  const dark=on=>page.locator('#studio-dark').setChecked(on);
  const shot=async(name,fullPage=false)=>{
   await page.mouse.move(2,2);
   if(await page.locator('#side-panel').isVisible()) await page.locator('#side-panel').evaluate(el=>el.scrollTop=0);
   await page.screenshot({path:`gallery-results/${name}.png`,fullPage,animations:'disabled',timeout:90000});
   console.log('CAPTURED',name);
  };
  await page.goto('http://127.0.0.1:8765');await ready();await page.locator('#quality').selectOption('high');
  await shot('01-zellatlas');
  await dark(true);await shot('02-studio');
  await page.locator('#organelle-list [data-part="zellkern"]').click();
  await page.locator('#isolate').check();await page.locator('#labels').uncheck();await page.locator('#focus-part').click();
  await shot('03-zellkern');
  await page.locator('#isolate').uncheck();await page.locator('#labels').check();await dark(false);
  await page.locator('[data-cell="pflanze"]').click();
  // Clear any previous organelle selection for the complete cell overview.
  await page.locator('#organelle-list [data-part="zellkern"]').click();
  await page.locator('#reset').click();await shot('04-pflanzenzelle');
  await page.locator('[data-mode="molekuel"]').click();
  await page.locator('[data-mol="antikoerper"]').click();await ready();await page.locator('[data-mmode="cartoon"]').click();await ready();
  await dark(true);await shot('05-antikoerper');
  await page.locator('[data-mol="atp-synthase"]').click();await ready();await page.locator('#rotor').uncheck();
  await page.locator('[data-mmode="cartoon"]').click();await ready();await shot('06-atp-synthase');
  await page.locator('[data-mol="dna"]').click();await ready();await page.locator('[data-mmode="band"]').click();await ready();
  await shot('07-dna');
  await dark(false);await page.locator('[data-mode="ablauf"]').click();
  for(const [key,step,name] of [['meiose',2,'08-meiose'],['proteinbiosynthese',5,'09-proteinbiosynthese'],['fotosynthese',5,'10-fotosynthese']]){
   await page.locator(`[data-proc="${key}"]`).click();await page.locator(`#step-list [data-step="${step}"]`).click();
   await page.locator('#follow').uncheck();await page.locator('[data-view="front"]').click();
   if(await page.locator('#p-play').getAttribute('aria-label')==='Pause')await page.locator('#p-play').click();
   await shot(name);
  }
  await page.locator('[data-mode="zelle"]').click();await page.locator('[data-cell="pflanze"]').click();
  await page.setViewportSize({width:430,height:932});await shot('11-mobil',true);
  assert.deepEqual(errors,[],'Gallery rendering errors');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1)});
