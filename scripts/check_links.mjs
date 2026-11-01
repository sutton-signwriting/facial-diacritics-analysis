import { chromium } from 'playwright';
import assert from 'node:assert/strict';

const base = process.env.PREVIEW_URL || 'http://127.0.0.1:9123';
const options = {headless:true};
if (process.env.CHROMIUM_PATH) options.executablePath = process.env.CHROMIUM_PATH;
const browser = await chromium.launch(options);
const page = await browser.newPage({viewport:{width:1440,height:1000}});
const errors = [];
page.on('pageerror', error => errors.push(error.message));
const dataset = `${base}/files/sgn104.html`;
const url = () => new URL(page.url());
const ready = async () => page.waitForSelector('#records tr .row-number');
const rowVisible = async row => {
  await page.waitForFunction(id => {
    const row = document.getElementById(id);
    if (!row) return false;
    const box = row.getBoundingClientRect();
    return box.top >= -1 && box.top < innerHeight;
  }, `row-${row}`);
};

try {
  // Exact URL reported by the user: the row still resolves without saved size.
  await page.goto(`${dataset}?page=2#row-199`);
  await ready();
  await rowVisible(199);
  assert.equal(url().searchParams.get('page'),'8');
  assert.equal(await page.locator('#page-size').inputValue(),'25');

  // A 100-row view retains its size in the record link and after reload.
  await page.goto(dataset);
  await ready();
  await page.locator('#page-size').selectOption('100');
  await page.locator('#next').click();
  assert.equal(await page.locator('#records tr').count(),100);
  const link = await page.locator('#row-199 .row-number').getAttribute('href');
  assert.equal(new URL(link).searchParams.get('rows'),'100');
  assert.equal(new URL(link).searchParams.get('page'),'2');
  await page.goto(link);
  await ready();
  await rowVisible(199);
  assert.equal(await page.locator('#page-size').inputValue(),'100');
  assert.equal(url().searchParams.get('page'),'2');
  await page.reload();
  await ready();
  await rowVisible(199);

  // Changing size keeps the selected record reachable; pagination clears stale anchors.
  await page.locator('#page-size').selectOption('50');
  await rowVisible(199);
  assert.equal(url().searchParams.get('page'),'4');
  await page.locator('#next').click();
  assert.equal(url().hash,'');
  assert.equal(await page.locator('.row-number').first().textContent(),'201');

  // Both filters and page size survive a fresh opening of a record link.
  await page.locator('#diacritics').selectOption('3');
  await page.locator('#heads').selectOption('inserted');
  const filteredLink = await page.locator('.row-number').first().getAttribute('href');
  await page.goto(filteredLink);
  await ready();
  assert.equal(await page.locator('#diacritics').inputValue(),'3');
  assert.equal(await page.locator('#heads').inputValue(),'inserted');
  assert.equal(await page.locator('#page-size').inputValue(),'50');

  // All matching rows are in the DOM; links and lazy FSW rendering work far down-page.
  await page.goto(`${dataset}?rows=all#row-199`);
  await ready();
  await rowVisible(199);
  const records = await (await fetch(`${base}/data/files/sgn104.json`)).json();
  assert.equal(await page.locator('#records tr').count(),records.records.length);
  assert.equal(await page.locator('#page-size').inputValue(),'all');
  assert.ok(await page.locator('#previous').isDisabled());
  assert.ok(await page.locator('#next').isDisabled());
  await page.locator('#row-199 .sign-view svg').first().waitFor();
  const last = records.records.length;
  await page.locator(`#row-${last}`).scrollIntoViewIfNeeded();
  await page.locator(`#row-${last} .sign-view svg`).first().waitFor();
  await page.locator(`#row-${last} .row-number`).click();
  await rowVisible(last);
  await page.goBack();
  await rowVisible(199);
  const allLink = await page.locator('#row-199 .row-number').getAttribute('href');
  assert.equal(new URL(allLink).searchParams.get('rows'),'all');

  // Invalid view parameters safely fall back, with the record remaining authoritative.
  const incompatibleCount = records.records[198].diacritics === 2 ? 3 : 2;
  await page.goto(`${dataset}?rows=invalid&page=Infinity&diacritics=${incompatibleCount}#row-199`);
  await ready();
  await rowVisible(199);
  assert.equal(await page.locator('#page-size').inputValue(),'25');
  assert.equal(await page.locator('#diacritics').inputValue(),'all');
  assert.deepEqual(errors,[]);
  console.log('PASS: reported row-199 link, saved sizes, reload, filters, size changes, pagination, All rows, lazy rendering, browser back, and invalid parameters.');
} finally {
  await browser.close();
}
