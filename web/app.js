import * as fsw from './font-ttf.mjs';

const app = document.querySelector('#app');
const prefix = document.body.dataset.prefix;
const fmt = n => Number(n).toLocaleString('en-US');
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let manifest;
let fontsReady;

function loadFonts() {
  return fontsReady ??= Promise.all([
    document.fonts.load('30px SuttonSignWritingLine', String.fromCodePoint(0xF0001)),
    document.fonts.load('30px SuttonSignWritingFill', String.fromCodePoint(0x100001)),
    document.fonts.load('72px NotoSignWriting', '\u{1D9FF}\u{1DA16}'),
  ]).then(loaded => {
    if (loaded.some(fonts => !fonts.length)) throw new Error('A required font did not load.');
  });
}

async function getJSON(path) {
  const response = await fetch(prefix + path);
  if (!response.ok) throw new Error(`Could not load ${path} (${response.status}).`);
  return response.json();
}

function tag(text, cls = '') { return `<span class="tag ${cls}">${esc(text)}</span>`; }
function errorPanel(error) {
  app.setAttribute('aria-busy', 'false');
  app.innerHTML = `<div class="notice error"><h1>Unable to open this view</h1><p>${esc(error.message)}</p><p>Serve the site over HTTP; opening index.html as a local file will not load its data.</p></div>`;
}

function home() {
  const {totals, files} = manifest;
  app.innerHTML = `<section class="hero"><p class="eyebrow">SIGNPUDDLE · FACIAL WRITING · EXPLORATORY DATA</p>
    <div class="hero-grid"><h1>Facial diacritics<br><em>in the record.</em></h1><div class="hero-copy"><p>Follow a written sign from its original composition to its facial symbols and a provisional Unicode sequence.</p><p class="muted">An inspection tool for asking what a representation keeps.</p></div></div>
    <div class="stats"><div><strong>${fmt(totals.rows)}</strong><span>facial sign occurrences</span></div><div><strong>${fmt(files.length)}</strong><span>source collections</span></div><div><strong>${fmt(totals.head_inserted)}</strong><span>HEADs prepended in Unicode</span></div><div><strong>3</strong><span>views of each record</span></div></div></section>
    <section class="collection-section"><div class="section-title"><div><p class="eyebrow">THE COLLECTIONS</p><h2>Choose a source file</h2></div><a class="text-link" href="methods.html">Read the method <span aria-hidden="true">↗</span></a></div>
    <div class="toolbar"><label class="search-label">Find a collection<input id="collection-search" type="search" placeholder="Search filename or collection title…"></label><label>Show<select id="collection-kind"><option value="all">All collections</option><option value="nonempty">With facial records</option><option value="review">Source review required</option></select></label><p id="collection-status" role="status"></p></div>
    <div class="table-wrap"><table class="collections"><thead><tr><th scope="col">Source file / collection</th><th scope="col">Facial signs</th><th scope="col">Diacritic counts</th><th scope="col"><span class="sr-only">Open</span></th></tr></thead><tbody id="collections"></tbody></table></div>
    <p class="fineprint">Counts are occurrences, including repeats. Signs containing only one S2ff resource are excluded. Unicode mapping: <code>${esc(manifest.profile)}</code>.</p></section>`;
  const search = document.querySelector('#collection-search');
  const kind = document.querySelector('#collection-kind');
  const render = () => {
    const query = search.value.trim().toLowerCase();
    const shown = files.filter(f => `${f.source_file} ${f.title ?? ''}`.toLowerCase().includes(query))
      .filter(f => kind.value === 'all' || (kind.value === 'nonempty' ? f.rows > 0 : f.publication_review_required));
    document.querySelector('#collection-status').textContent = `${fmt(shown.length)} collections`;
    document.querySelector('#collections').innerHTML = shown.length ? shown.map(f => {
      const counts = Object.keys(f.diacritics).map(Number).sort((a,b) => a-b);
      return `<tr><td><a class="file-link" href="files/${encodeURIComponent(f.id)}.html">${esc(f.source_file)}</a><span class="collection-name">${esc(f.title || 'Untitled collection')}</span>${f.publication_review_required ? tag('Source review required', 'amber') : ''}</td><td class="numeric">${fmt(f.rows)}</td><td>${counts.length ? counts.slice(0,7).map(n => tag(n)).join(' ') + (counts.length > 7 ? tag('…') : '') : '<span class="muted">—</span>'}</td><td><a class="open-link" href="files/${encodeURIComponent(f.id)}.html" aria-label="Open ${esc(f.source_file)}">↗</a></td></tr>`;
    }).join('') : '<tr><td colspan="4" class="empty">No collections match these filters.</td></tr>';
  };
  search.addEventListener('input', render);
  kind.addEventListener('change', render);
  render();
}

function svgFor(sign) {
  try {
    const markup = fsw.signSvg(sign);
    if (!markup) throw new Error('No SVG returned');
    return markup;
  } catch (error) {
    return `<span class="render-error">FSW rendering unavailable</span>`;
  }
}

function details(label, text) {
  return `<details class="code-details"><summary>${esc(label)}</summary><code>${esc(text)}</code><button class="copy" type="button" data-copy="${esc(text)}">Copy</button></details>`;
}

async function dataset(id) {
  const [{file, records}] = await Promise.all([getJSON(`data/files/${encodeURIComponent(id)}.json`), loadFonts()]);
  records.forEach((record, i) => { record.row = i + 1; });
  const params = new URLSearchParams(location.search);
  let selected = params.get('diacritics') || 'all';
  let pageNumber = Math.max(1, Number(params.get('page')) || 1);
  let pageSize = 25;
  const counts = Object.keys(file.diacritics).map(Number).sort((a,b)=>a-b);
  if (selected !== 'all' && !counts.includes(Number(selected))) selected = 'all';
  app.innerHTML = `<a class="breadcrumb" href="../index.html">← All collections</a><section class="dataset-head"><p class="eyebrow">SOURCE COLLECTION</p><h1>${esc(file.source_file)}</h1><p class="dataset-title">${esc(file.title || 'Untitled collection')}</p><div class="dataset-meta"><span><b>${fmt(file.rows)}</b> facial occurrences</span><span><b>${fmt(file.unique_fsw)}</b> unique source signboxes</span><span><b>${fmt(file.head_inserted)}</b> prepended HEADs</span><a href="../data/raw/${encodeURIComponent(id)}.csv" download>Download CSV ↓</a></div></section>
    ${file.publication_review_required ? '<div class="notice amber">This publicly downloadable source is labelled private. This local inspection copy awaits a publication decision.</div>' : ''}
    <div class="mapping-note"><span class="status-dot"></span><p><strong>Provisional Unicode mapping.</strong> The first S2ff resource is moved to the front, or a default HEAD is prepended. Other resources retain source order. Geometry is not transferred.</p><a href="../methods.html">Mapping details ↗</a></div>
    <section class="records-section"><div class="toolbar record-controls"><label>Number of diacritics<select id="diacritics"><option value="all">All counts</option>${counts.map(n=>`<option value="${n}">${n} ${n===1?'diacritic':'diacritics'}</option>`).join('')}</select></label><label>Unicode HEAD<select id="heads"><option value="all">All records</option><option value="inserted">Prepended HEAD</option><option value="existing">Existing HEAD</option><option value="multiple">Multiple HEADs</option></select></label><label>Rows per page<select id="page-size"><option>25</option><option>50</option><option>100</option></select></label><p id="record-status" role="status" aria-live="polite"></p></div>
    <div class="table-wrap record-table-wrap"><table class="records"><thead><tr><th scope="col">Record</th><th scope="col">Original sign <span>FSW source signbox</span></th><th scope="col">Facial composition <span>Filtered &amp; normalized FSW</span></th><th scope="col">Unicode face <span>Noto Sans SignWriting</span></th></tr></thead><tbody id="records"></tbody></table></div>
    <div class="pagination"><button id="previous" type="button">← Previous</button><span id="page-status"></span><button id="next" type="button">Next →</button></div><p class="fineprint">“Diacritics” counts retained non-S2ff resources, excluding fill and rotation modifiers. Some resources are spacing characters; those rows are flagged. Each FSW view fits its own cell. Unicode uses the bundled Noto font; display does not establish equivalence.</p></section>`;
  const select = document.querySelector('#diacritics');
  const heads = document.querySelector('#heads');
  select.value = selected;
  function render() {
    const shown = records.filter(r => (selected === 'all' || r.diacritics === Number(selected)) &&
      (heads.value === 'all' || (heads.value === 'inserted' ? r.head_inserted : heads.value === 'existing' ? !r.head_inserted : r.head_count > 1)));
    const pages = Math.max(1, Math.ceil(shown.length / pageSize));
    pageNumber = Math.min(Math.max(1, pageNumber), pages);
    const start = (pageNumber-1)*pageSize;
    const current = shown.slice(start, start + pageSize);
    document.querySelector('#record-status').textContent = `${fmt(shown.length)} matching records`;
    document.querySelector('#records').innerHTML = current.length ? current.map(r => {
      const sourceLink = /^sgn\d+$/.test(id) && r.entry_id ? `http://signbank.org/signpuddle2.0/canvas.php?ui=1&sgn=${id.slice(3)}&sid=${encodeURIComponent(r.entry_id)}` : '';
      const codepoints = Array.from(r['uni-face'], c => 'U+' + c.codePointAt(0).toString(16).toUpperCase()).join(' ');
      return `<tr id="row-${r.row}"><th scope="row"><a class="row-number" href="#row-${r.row}">${fmt(r.row)}</a><span class="record-small">${r.diacritics} ${r.diacritics===1?'diacritic':'diacritics'}</span>${r.head_inserted ? tag('HEAD added') : ''}${r.flags.map(f=>tag(f,'amber')).join('')}${sourceLink ? `<a class="source-link" href="${sourceLink}" target="_blank" rel="noopener">Entry ${esc(r.entry_id)} ↗</a>` : ''}</th><td><div class="sign-view" role="img" aria-label="Original SignWriting sign">${svgFor(r.fsw)}</div>${details('FSW source',r.fsw)}</td><td><div class="sign-view" role="img" aria-label="Filtered facial SignWriting">${svgFor(r['fsw-face'])}</div>${details('FSW face',r['fsw-face'])}</td><td><div class="unicode-view" dir="ltr" lang="und" role="img" aria-label="Provisional Unicode facial rendering">${esc(r['uni-face'])}</div>${details('Unicode code points',codepoints)}${details('Unicode text',r['uni-face'])}</td></tr>`;
    }).join('') : '<tr><td class="empty" colspan="4">No records match these filters.</td></tr>';
    document.querySelector('#previous').disabled = pageNumber === 1;
    document.querySelector('#next').disabled = pageNumber >= pages;
    document.querySelector('#page-status').textContent = `${fmt(current.length ? start+1 : 0)}–${fmt(start+current.length)} of ${fmt(shown.length)} · Page ${pageNumber} of ${pages}`;
    const url = new URL(location.href);
    url.searchParams.delete('page'); url.searchParams.delete('diacritics');
    if (pageNumber > 1) url.searchParams.set('page',pageNumber);
    if (selected !== 'all') url.searchParams.set('diacritics',selected);
    history.replaceState(null,'',url);
  }
  select.addEventListener('change',()=>{selected=select.value;pageNumber=1;render();});
  heads.addEventListener('change',()=>{pageNumber=1;render();});
  document.querySelector('#page-size').addEventListener('change',e=>{pageSize=Number(e.target.value);pageNumber=1;render();});
  document.querySelector('#previous').addEventListener('click',()=>{pageNumber--;render();});
  document.querySelector('#next').addEventListener('click',()=>{pageNumber++;render();});
  document.querySelector('#records').addEventListener('click', async e => {
    const button = e.target.closest('[data-copy]');
    if (!button) return;
    try { await navigator.clipboard.writeText(button.dataset.copy); button.textContent='Copied'; }
    catch { button.textContent='Select the text to copy'; }
  });
  render();
}

if (app) {
  try {
    manifest = await getJSON('data/manifest.json');
    if (document.body.dataset.file) await dataset(document.body.dataset.file);
    else home();
    app.setAttribute('aria-busy','false');
  } catch(error) { errorPanel(error); }
}
