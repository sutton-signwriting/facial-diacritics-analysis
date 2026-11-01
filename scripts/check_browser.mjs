import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';
import assert from 'node:assert/strict';

const base = process.env.PREVIEW_URL || 'http://127.0.0.1:9123';
const launch = {headless:true};
if (process.env.CHROMIUM_PATH) launch.executablePath = process.env.CHROMIUM_PATH;
const browser = await chromium.launch(launch);
const page = await browser.newPage({viewport:{width:1440,height:1100}});
const errors = [];
page.on('pageerror', e => errors.push(e.message));
page.on('response', r => { if(r.status() >= 400) errors.push(`${r.status()} ${r.url()}`); });
await mkdir('artifacts', {recursive:true});
try {
  await page.goto(base + '/index.html');
  await page.waitForSelector('.collections tbody tr .file-link');
  const manifest = await (await fetch(base + '/data/manifest.json')).json();
  assert.equal(await page.locator('.collections tbody tr').count(), manifest.files.length);
  await page.screenshot({path:'artifacts/datasets-desktop.png',fullPage:false});
  await page.locator('#collection-search').fill('sgn105.spml');
  if (manifest.files.some(f=>f.id==='sgn105')) {
    assert.equal(await page.locator('.file-link').count(),1);
    await page.locator('.file-link').click();
  } else {
    await page.goto(base + '/files/sgn4.html');
  }
  await page.waitForSelector('.records tbody tr .sign-view svg');
  await page.evaluate(()=>scrollTo(0,0));
  assert.equal(await page.locator('.render-error').count(),0);
  assert.equal(await page.locator('.records tbody tr').count(),25);
  assert.ok(await page.locator('.unicode-view').first().textContent());
  await page.screenshot({path:'artifacts/records-desktop.png',fullPage:false});
  const options = await page.locator('#diacritics option').allTextContents();
  assert.ok(options.some(t=>t==='1 diacritic'));
  await page.locator('#diacritics').selectOption('1');
  assert.ok((await page.locator('.record-small').allTextContents()).every(t=>t==='1 diacritic'));
  assert.ok(page.url().includes('diacritics=1'));
  await page.locator('#heads').selectOption('inserted');
  assert.equal(await page.locator('.records tbody tr').count(),await page.locator('.records .tag').filter({hasText:'HEAD added'}).count());
  await page.locator('#heads').selectOption('all');
  await page.locator('#diacritics').selectOption('all');
  await page.locator('#next').click();
  assert.equal(await page.locator('.row-number').first().textContent(),'26');
  await page.locator('#previous').click();
  const csvUrl = await page.locator('[download]').getAttribute('href');
  const csv = await (await fetch(new URL(csvUrl,page.url()))).text();
  assert.ok(csv.startsWith('fsw,fsw-face,uni-face\n'));
  // Cross-check Python normalization against the independent browser library.
  const checks = await page.evaluate(async () => {
    const lib = await import('../assets/font-ttf.mjs');
    const id = document.body.dataset.file;
    const data = await (await fetch(`../data/files/${id}.json`)).json();
    const differences=[];
    for(const r of data.records.slice(0,500)) {
      const stripped = r.fsw.replace(/S([123][0-9a-f]{2})[0-5][0-9a-f][0-9]{3}x[0-9]{3}/g,
        (s,b)=>parseInt(b,16)>=0x2ff && parseInt(b,16)<=0x36c ? s : '');
      const expected=lib.signNormalize(stripped);
      if(expected!==r['fsw-face']) differences.push({source:r.fsw,expected,actual:r['fsw-face']});
    }
    return differences;
  });
  assert.deepEqual(checks,[],'Python/browser normalization differs');
  await page.setViewportSize({width:390,height:844});
  await page.evaluate(()=>scrollTo(0,0));
  await page.screenshot({path:'artifacts/records-mobile.png',fullPage:false});
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
  await page.goto(base + '/index.html');
  await page.waitForSelector('.collections');
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
  await page.screenshot({path:'artifacts/datasets-mobile.png',fullPage:false});
  const empty = manifest.files.find(file=>file.rows === 0);
  assert.ok(empty, 'Expected a zero-result collection for this snapshot');
  await page.goto(base + `/files/${empty.id}.html`);
  await page.waitForSelector('#record-status');
  assert.equal(await page.locator('#record-status').textContent(),'0 matching records');
  await page.goto(base + '/methods.html');
  await page.waitForSelector('#methods');
  assert.equal(errors.length,0,errors.join('\n'));
  console.log('PASS: dataset list, fonts, three views, counts, filters, pagination, CSV, empty dataset, methods, mobile widths; 500 normalization comparisons.');
} finally {
  await browser.close();
}
