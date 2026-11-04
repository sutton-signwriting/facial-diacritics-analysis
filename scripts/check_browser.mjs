import { chromium } from 'playwright';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
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
  assert.equal(manifest.selection.min_diacritics,2);
  assert.deepEqual(manifest.selection.excluded_face_bases,['S337','S338','S339','S33a']);
  assert.ok(manifest.files.every(file=>!['sgn97','sgn103','sgn105'].includes(file.id)));
  assert.ok(Object.keys(manifest.histogram).every(count=>Number(count)>=2));
  assert.equal(await page.locator('#collection-kind').inputValue(),'nonempty');
  assert.equal(await page.locator('.collections tbody tr').count(),manifest.files.filter(file=>file.rows>0).length);
  await page.locator('#collection-kind').selectOption('all');
  assert.equal(await page.locator('.collections tbody tr').count(),manifest.files.length);
  await page.locator('#collection-kind').selectOption('nonempty');
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
  assert.ok(!options.some(t=>t==='0 diacritics' || t==='1 diacritic'));
  assert.ok(options.some(t=>t==='2 diacritics'));
  await page.locator('#diacritics').selectOption('2');
  assert.ok((await page.locator('.record-small').allTextContents()).every(t=>t==='2 diacritics'));
  assert.ok(page.url().includes('diacritics=2'));
  await page.locator('#heads').selectOption('inserted');
  assert.equal(await page.locator('.records tbody tr').count(),await page.locator('.records .tag').filter({hasText:'Default HEAD prepended'}).count());
  await page.locator('#heads').selectOption('all');
  await page.locator('#diacritics').selectOption('all');
  await page.locator('#next').click();
  assert.equal(await page.locator('.row-number').first().textContent(),'26');
  await page.locator('#previous').click();
  const csvUrl = await page.locator('[download]').getAttribute('href');
  const csv = await (await fetch(new URL(csvUrl,page.url()))).text();
  assert.ok(csv.startsWith('fsw,fsw-face,uni-face\n'));
  // Check canonical geometry against archived metrics. The independent library
  // measures glyphs on a live canvas, so its metric-dependent result is reported
  // separately rather than being treated as the archived table's specification.
  const sizeBytes = await readFile('assets/symbol-sizes.json');
  const pinnedSizes = JSON.parse(sizeBytes);
  const checks = await page.evaluate(async sizes => {
    const lib = await import('../assets/font-ttf.mjs');
    const id = document.body.dataset.file;
    const data = await (await fetch(`../data/files/${id}.json`)).json();
    const parse = sign => [...sign.matchAll(/(S[123][0-9a-f]{2}[0-5][0-9a-f])([0-9]{3})x([0-9]{3})/g)]
      .map(m=>({key:m[1],x:Number(m[2]),y:Number(m[3])}));
    const geometryErrors=[], differences=[], unexplained=[];
    for (const r of data.records.slice(0,500)) {
      const stripped = r.fsw.replace(/S([123][0-9a-f]{2})[0-5][0-9a-f][0-9]{3}x[0-9]{3}/g,
        (s,b)=>{
          const base = parseInt(b,16);
          return base>=0x2ff && base<=0x36c && !(base>=0x337 && base<=0x33a) ? s : '';
        });
      const original = parse(stripped), face = parse(r['fsw-face']);
      const sameKeys = original.length===face.length && original.every((s,i)=>s.key===face[i].key);
      const dx=original[0].x-face[0].x, dy=original[0].y-face[0].y;
      const rigid = sameKeys && original.every((s,i)=>s.x-face[i].x===dx && s.y-face[i].y===dy);
      const right=Math.max(...face.map(s=>s.x+sizes[s.key][0]));
      const bottom=Math.max(...face.map(s=>s.y+sizes[s.key][1]));
      const header=/^[BLMR]([0-9]{3})x([0-9]{3})/.exec(r['fsw-face']);
      const bounds = header && Number(header[1])===right && Number(header[2])===bottom;
      const centered = Math.trunc((Math.min(...face.map(s=>s.x))+right)/2)===500 &&
        Math.trunc((Math.min(...face.map(s=>s.y))+bottom)/2)===500;
      if (!rigid || !bounds || !centered || r.fsw[0]!==r['fsw-face'][0]) {
        geometryErrors.push({source:r.fsw,rigid,bounds,centered});
      }
      const expected=lib.signNormalize(stripped);
      if (expected!==r['fsw-face']) {
        const metrics=[...new Set(original.map(s=>s.key))].map(key=>({key,pinned:sizes[key],browser:lib.symbolSize(key)}))
          .filter(m=>JSON.stringify(m.pinned)!==JSON.stringify(m.browser));
        const item={source:r.fsw,library_normalization:expected,archived_normalization:r['fsw-face'],metrics};
        differences.push(item);
        if (!metrics.length) unexplained.push(item);
      }
    }
    return {source_file:id+'.spml',source_sha256:data.file.source_sha256,
      tested:Math.min(500,data.records.length),geometry_errors:geometryErrors,
      live_normalization_differences:differences,unexplained_differences:unexplained};
  }, pinnedSizes);
  const normalizationReport = {
    ...checks,chromium:browser.version(),font_ttf:'1.6.0',
    canonical_metric_source:'assets/symbol-sizes.json',
    canonical_metrics_sha256:createHash('sha256').update(sizeBytes).digest('hex'),
    source_files_sha256:manifest.source_files_sha256,
    interpretation:'Canonical geometry is checked against the pinned size table. The library comparison uses live canvas metrics; differences are retained as diagnostics, not face-fidelity judgments.'
  };
  await writeFile('artifacts/browser-normalization-check.json',JSON.stringify(normalizationReport,null,2)+'\n');
  assert.deepEqual(checks.geometry_errors,[],'Archived normalization violates its pinned geometry contract');
  assert.deepEqual(checks.unexplained_differences,[],'Library disagreement without a measured metric difference');
  console.log(`Independent live-metric comparison: ${checks.live_normalization_differences.length}/${checks.tested} normalization differences recorded; canonical geometry checked separately.`);
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
  assert.ok((await page.locator('#mapping-limits').textContent()).includes('Reading a display difference'));
  await page.locator('footer a').filter({hasText:'Data & licenses'}).click();
  await page.waitForSelector('#methods');
  assert.ok((await page.locator('#methods').textContent()).includes('CC BY 4.0'));
  for (const asset of ['/licenses/MIT.txt','/licenses/CC-BY-4.0.txt','/data/rights.json']) {
    assert.equal((await fetch(base+asset)).status,200);
  }
  assert.equal(errors.length,0,errors.join('\n'));
  console.log(`PASS: dataset list, fonts, three views, counts, filters, pagination, CSV, empty dataset, methods, mobile widths; ${checks.tested} normalization comparisons.`);
} finally {
  await browser.close();
}
