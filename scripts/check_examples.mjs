import {chromium} from 'playwright';
import {mkdir} from 'node:fs/promises';
import assert from 'node:assert/strict';

const base=(process.env.PREVIEW_URL || 'http://127.0.0.1:9123').replace(/\/$/,'');
const launch={headless:true};
if(process.env.CHROMIUM_PATH) launch.executablePath=process.env.CHROMIUM_PATH;
const browser=await chromium.launch(launch);
const page=await browser.newPage({viewport:{width:1440,height:1100}});
const errors=[];
page.on('pageerror',e=>errors.push(e.message));
page.on('response',r=>{if(r.status()>=400) errors.push(`${r.status()} ${r.url()}`);});
await mkdir('artifacts',{recursive:true});
try {
  await page.goto(base+'/index.html');
  await page.getByRole('navigation').getByRole('link',{name:'Article examples'}).click();
  await page.waitForSelector('.examples tbody tr');
  const url=page.url();
  const response=await fetch(base+'/eye-gaze/data/examples.json');
  assert.equal(response.status,200);
  const data=await response.json();
  assert.deepEqual(data.counts,{total:24,single_gaze:21,two_gazes:3,collections:10,page_left:10,page_right:11});
  assert.equal(data.corpus_occurrences,632);
  assert.deepEqual(await page.locator('.examples tbody tr').evaluateAll(rows=>rows.map(r=>r.id)),data.cases.map(c=>c.case_id));
  assert.equal(await page.locator('.examples .sign-view svg').count(),48);
  assert.equal(await page.locator('.examples .unicode-view').count(),24);
  assert.equal(await page.locator('.render-error').count(),0);
  assert.equal(await page.locator('.pagination').count(),0);
  assert.equal(await page.locator('.examples tbody tr').first().getAttribute('id'),'A01');
  const collections=new Map();
  for(const c of data.cases) {
    if(!collections.has(c.collection)) {
      const r=await fetch(base+`/eye-gaze/data/files/${c.collection}.json`);
      assert.equal(r.status,200);
      collections.set(c.collection,await r.json());
    }
    const source=collections.get(c.collection).records[c.row-1];
    assert.equal(source.fsw,c.fsw,c.case_id);
    assert.equal(String(source.entry_id),String(c.entry_id),c.case_id);
    const row=page.locator('#'+c.case_id);
    const link=await row.getByRole('link',{name:'Full dataset record'}).getAttribute('href');
    assert.equal(new URL(link,url).pathname,new URL(base+`/eye-gaze/files/${c.collection}.html`).pathname);
    assert.equal(new URL(link,url).hash,`#row-${c.row}`);
    assert.equal(await row.locator('.unicode-view').textContent(),c['uni-face']);
  }
  const csv=await fetch(base+'/eye-gaze/data/examples.csv');
  assert.equal(csv.status,200);
  const lines=(await csv.text()).trim().split(/\r?\n/);
  assert.equal(lines.length,25);
  assert.deepEqual(lines.slice(1).map(line=>line.split(',')[0]),data.cases.map(c=>c.case_id));
  await page.screenshot({path:'artifacts/article-examples-desktop.png'});
  await page.goto(url+'#D07');
  await page.waitForSelector('#D07');
  await page.waitForFunction(()=>document.querySelector('#D07').getBoundingClientRect().top<innerHeight);
  assert.ok(await page.locator('#D07').evaluate(row=>row.classList.contains('linked-record')));
  await page.reload();
  await page.waitForFunction(()=>document.querySelector('#D07')?.getBoundingClientRect().top<innerHeight);
  await page.locator('#D07').getByRole('link',{name:'Full dataset record'}).click();
  const targetId=`row-${data.cases.find(c=>c.case_id==='D07').row}`;
  await page.waitForSelector('#'+targetId);
  await page.waitForFunction(id=>document.getElementById(id).getBoundingClientRect().top<innerHeight,targetId);
  assert.equal(await page.locator('.records tbody tr.linked-record').getAttribute('id'),targetId);
  await page.goBack();
  await page.waitForSelector('.examples tbody tr');
  assert.equal(new URL(page.url()).hash,'#D07');
  await page.goto(url);
  await page.waitForSelector('.examples tbody tr');
  for(const width of [760,390]) {
    await page.setViewportSize({width,height:844});
    assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),`Overflow at ${width}px`);
  }
  await page.screenshot({path:'artifacts/article-examples-mobile.png'});
  assert.deepEqual(errors,[]);
  console.log('PASS: all 24 examples presented equally; counts, source joins, 24 dataset links, CSV, rendering, anchors/reload/back, tablet and mobile widths.');
} finally {await browser.close();}
