const {chromium} = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
(async () => {
  fs.mkdirSync('test-results', {recursive:true});
  const browser = await chromium.launch({args:['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
  const page = await browser.newPage({viewport:{width:1512,height:982}});
  const errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  page.on('console',m=>{if (m.type()==='error') errors.push(m.text())});
  const range = (id, value) => page.locator(id).evaluate((el, v) => { el.value = v; el.dispatchEvent(new Event('input', {bubbles:true})); }, String(value));
  await page.goto('http://127.0.0.1:8765');
  await page.waitForSelector('#load-state', {state:'hidden'});
  await page.waitForSelector('.tag3d');
  await page.locator('#quality').selectOption('high');
  await page.screenshot({path:'test-results/01-tierzelle.png',timeout:90000});
  const overlap = await page.evaluate(() => {
    const control=document.querySelector('.orientation').getBoundingClientRect();
    return [...document.querySelectorAll('.tag3d')].filter(el=>el.offsetWidth && getComputedStyle(el).display!=='none').some(el=>{const r=el.getBoundingClientRect();return r.left<control.right && r.right>control.left && r.top<control.bottom && r.bottom>control.top;});
  });
  assert.ok(!overlap, 'Labels must not overlap zoom controls');
  await page.locator('[data-part="mitochondrium"]').first().click();
  await page.locator('#focus-part').click();
  assert.match(await page.locator('#detail-title').innerText(),/Mitochondrium/);
  await page.locator('#reset').click();
  await page.locator('[data-axis="y"]').click();
  await range('#clip-position',35);
  await page.locator('#clip-flip').check();
  await page.screenshot({path:'test-results/02-section.png',timeout:90000});
  await page.locator('[data-axis="off"]').click();
  await page.locator('#studio-dark').check();
  await page.screenshot({path:'test-results/02-studio-dark.png',timeout:90000});
  await page.locator('#studio-dark').uncheck();
  await page.locator('[data-cell="pflanze"]').click();
  await range('#explode',100);
  await page.locator('[data-view="top"]').click();
  await page.screenshot({path:'test-results/03-pflanzenzelle.png',timeout:90000});
  await range('#explode',0);
  await page.locator('[data-mode="ablauf"]').click();
  for (const key of ['mitose','meiose','proteinbiosynthese','zellatmung','fotosynthese']) {
    await page.locator(`[data-proc="${key}"]`).click();
    const steps=page.locator('#step-list button');
    for (let i=0;i<await steps.count();i++) await steps.nth(i).click();
    const total=await steps.count();
    await page.locator('#p-prev').click();
    assert.equal(await page.locator('#p-count').innerText(),`Schritt ${Math.max(1,total-1)} von ${total}`);
    await page.locator('#p-next').click();
    assert.equal(await page.locator('#p-count').innerText(),`Schritt ${total} von ${total}`);
    if(await page.locator('#p-play').getAttribute('aria-label')==='Pause') await page.locator('#p-play').click();
    assert.equal(await page.locator('#p-play').getAttribute('aria-label'),'Abspielen','Manual step choice must respect pause');
    await page.locator('[data-view="front"]').click();
    await page.locator('#side-panel').evaluate(el=>el.scrollTop=0);
    await page.mouse.move(10,10);
    assert.ok(!(await page.locator('#label-lines').isVisible()), 'Cell leaders must disappear outside cell mode');
    await page.screenshot({path:`test-results/process-${key}.png`, animations:'disabled', timeout:90000});
  }
  await page.locator('[data-mode="molekuel"]').click();
  for (const key of ['haemoglobin','dna','insulin','antikoerper','atp-synthase']) {
    await page.locator(`[data-mol="${key}"]`).click();
    await page.waitForSelector('#load-state', {state:'hidden'});
    for (const mode of ['kalotte','cartoon','band','stab']) {
      await page.locator(`[data-mmode="${mode}"]`).click();
      await page.waitForSelector('#load-state', {state:'hidden'});
      await page.locator('[data-axis="x"]').click();
      await page.locator('[data-axis="off"]').click();
    }
    await page.locator(`[data-mmode="${['antikoerper','atp-synthase'].includes(key)?'cartoon':'kalotte'}"]`).click();
    await page.waitForSelector('#load-state', {state:'hidden'});
    if (key === 'atp-synthase') await page.locator('#rotor').uncheck();
    await page.locator('#side-panel').evaluate(el=>el.scrollTop=0);
    await page.mouse.move(10,10);
    await page.screenshot({path:`test-results/molecule-${key}.png`,timeout:90000});
  }
  await page.locator('[data-mode="zelle"]').click();
  for(const quality of ['low','high','auto']) {await page.locator('#quality').selectOption(quality);assert.match(await page.locator('#quality-status').innerText(),/Renderauflösung/);}
  await page.locator('#quiz').click();
  assert.ok(await page.locator('#quiz-panel').isVisible());
  await page.locator('#quiz-close').click();
  await page.locator('[data-tab="notes"]').click();
  await page.locator('#note').fill('CELLULA regression check');
  await page.locator('[data-tab="text"]').click();
  // Software-Rendering auf GitHub-Runnern braucht für den 4:5-Export teils weit über 30 s.
  const downloadPromise=page.waitForEvent('download',{timeout:120000});
  await page.locator('#insta').click();
  await (await downloadPromise).saveAs('test-results/export-4x5.png');
  await page.setViewportSize({width:390,height:844});
  await page.screenshot({path:'test-results/mobile.png',fullPage:true,animations:'disabled',timeout:90000});
  assert.ok(!(await page.locator('#side-panel').isVisible()), 'Mobile menu starts closed');
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'Mobile horizontal overflow');
  assert.ok(await page.locator('.tag3d:visible').count()<=4,'Mobile must show at most four priority labels');
  await page.locator('#open-side').click();
  await page.locator('#close-side').click();
  await page.setViewportSize({width:1512,height:982});
  await page.evaluate(()=>navigator.serviceWorker.ready);
  await page.locator('#offline').click();
  await page.waitForFunction(()=>document.querySelector('#offline-status').textContent.includes('jetzt offline'),{},{timeout:90000});
  await page.context().setOffline(true);
  await page.reload();await page.waitForSelector('#load-state',{state:'hidden'});
  await page.locator('[data-mode="molekuel"]').click();
  for(const key of ['dna','haemoglobin','insulin','antikoerper','atp-synthase']){
    await page.locator(`[data-mol="${key}"]`).click();await page.waitForSelector('#load-state',{state:'hidden'});
    assert.ok(!(await page.locator('#load-state').isVisible()),'Cached molecule must load offline');
  }
  await page.context().setOffline(false);
  assert.deepEqual(errors,[],'Browser / shader errors');
  await browser.close();
  console.log('PASS desktop/mobile, all models, clipping, quiz, notes and export');
})().catch(e=>{console.error(e);process.exit(1)});
