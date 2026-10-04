// Run the unbundled desktop app on Windows before building any installers.
const {_electron}=require('playwright');
const assert=require('node:assert/strict');
const path=require('node:path');
const fs=require('node:fs');
(async()=>{
  fs.mkdirSync('test-results',{recursive:true});
  const executablePath=require('../desktop/node_modules/electron');
  const app=await _electron.launch({executablePath,args:[path.resolve('desktop/main.js')],timeout:60000});
  try {
    const page=await app.firstWindow();const errors=[];
    page.on('pageerror',e=>errors.push(e.message));
    await page.waitForSelector('#load-state',{state:'hidden'});
    assert.equal(new URL(page.url()).protocol,'cellula:');
    assert.equal(new URL(page.url()).hostname,'app');
    assert.ok(!(await page.locator('#offline').isVisible()),'Desktop resources are already local');
    // All model data must work through the packaged app scheme without a server.
    await page.locator('[data-mode="molekuel"]').click();
    for(const key of ['dna','haemoglobin','insulin','antikoerper','atp-synthase']){
      // Große Modelle (ATP-Synthase) blockieren auf langsamen Runnern kurz die Seite.
      await page.locator(`[data-mol="${key}"]`).click({timeout:90000});await page.waitForSelector('#load-state',{state:'hidden',timeout:90000});
      await page.locator('[data-mmode="cartoon"]').click({timeout:90000});await page.waitForSelector('#load-state',{state:'hidden',timeout:90000});
    }
    await page.locator('#rotor').uncheck();
    await page.screenshot({path:'test-results/windows-desktop.png',timeout:90000});
    await page.locator('[data-mode="zelle"]').click();
    await page.locator('[data-tab="notes"]').click();await page.locator('#note').fill('Windows offline smoke test');
    await page.reload();await page.waitForSelector('#load-state',{state:'hidden'});
    await page.locator('[data-tab="notes"]').click();assert.equal(await page.locator('#note').inputValue(),'Windows offline smoke test');
    assert.deepEqual(errors,[],'Desktop rendering must have no errors before export');
    const exportPath=path.resolve('test-results/windows-export.png');
    await app.evaluate(({BrowserWindow},destination)=>{
      globalThis.__exportPromise=new Promise(resolve=>BrowserWindow.getAllWindows()[0].webContents.session.once('will-download',(event,item)=>{
        item.setSavePath(destination);item.once('done',(event,state)=>resolve(state));
      }));
    },exportPath);
    await page.locator('#insta').click();
    const exportState=await app.evaluate(()=>Promise.race([globalThis.__exportPromise,new Promise(resolve=>setTimeout(()=>resolve('timeout'),20000))]));
    assert.equal(exportState,'completed','Electron must save the PNG');
    assert.equal(fs.readFileSync(exportPath).subarray(0,8).toString('hex'),'89504e470d0a1a0a');
    assert.deepEqual(errors,[]);console.log('PASS Windows desktop protocol, models, notes and PNG export');
  } finally {await app.close();}
})().catch(e=>{console.error(e);process.exit(1)});
