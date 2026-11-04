import * as fsw from './font-ttf.mjs';

const app = document.querySelector('#app');
const prefix = document.body.dataset.prefix;
const eyeGaze = document.body.dataset.analysis === 'eye-gaze';
const analysisPath = eyeGaze ? 'eye-gaze/' : '';
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
  const response = await fetch(prefix + analysisPath + path);
  if (!response.ok) throw new Error(`Could not load ${path} (${response.status}).`);
  return response.json();
}

function tag(text, cls = '', title = '') { return `<span class="tag ${cls}"${title ? ` title="${esc(title)}"` : ''}>${esc(text)}</span>`; }
function mappingFlag(flag) {
  if (flag === 'multiple-heads') return tag('Multiple S2ff resources', 'amber', 'Counts explicit S2ff resources, not visually separate faces. Head-to-mark grouping has not been evaluated.');
  if (flag === 'also-other-gaze-fills') return tag('Other gaze fills present', 'amber');
  return tag(flag, 'amber');
}
function errorPanel(error) {
  app.setAttribute('aria-busy', 'false');
  app.innerHTML = `<div class="notice error"><h1>Unable to open this view</h1><p>${esc(error.message)}</p><p>Serve the site over HTTP; opening index.html as a local file will not load its data.</p></div>`;
}

function home() {
  const {totals, files} = manifest;
  const heading = eyeGaze ? 'Eye gaze<br><em>with fills 2 and 3.</em>' : 'Facial diacritics<br><em>in the record.</em>';
  const introduction = eyeGaze ? 'Signs containing at least one positioned S321–S329 symbol with fill 2 or 3. Every diacritic count is included.' : 'Compare original SignWriting compositions, their facial symbols, and a direct mapping to Unicode.';
  const scope = eyeGaze ? 'Selection uses the original source signbox, without a minimum diacritic count. The full sign and facial context are retained. Signs with both fill-2/3 gaze and other gaze fills are included and flagged.' : 'Only faces with at least two diacritics are included.';
  app.innerHTML = `<section class="hero"><p class="eyebrow">SIGNPUDDLE · FACIAL WRITING · EXPLORATORY DATA</p>
    <div class="hero-grid"><h1>${heading}</h1><div class="hero-copy"><p>${introduction}</p><p class="muted">${eyeGaze ? '<a href="data/all.csv" download>Download all matching signs as CSV ↓</a>' : 'An inspection tool for asking what a representation keeps.'}</p></div></div>
    <div class="stats"><div><strong>${fmt(totals.rows)}</strong><span>facial sign occurrences</span></div><div><strong>${fmt(files.length)}</strong><span>source collections</span></div><div><strong>${fmt(totals.head_inserted)}</strong><span>HEADs prepended in Unicode</span></div><div><strong>3</strong><span>views of each record</span></div></div></section>
    <section class="collection-section"><div class="section-title"><div><p class="eyebrow">THE COLLECTIONS</p><h2>Choose a source file</h2></div><a class="text-link" href="${prefix}methods.html${eyeGaze ? '#eye-gaze' : ''}">Read the method <span aria-hidden="true">↗</span></a></div>
    <div class="toolbar"><label class="search-label">Find a collection<input id="collection-search" type="search" placeholder="Search filename or collection title…"></label><label>Show<select id="collection-kind"><option value="nonempty">With facial records</option><option value="all">All collections</option></select></label><p id="collection-status" role="status"></p></div>
    <div class="table-wrap"><table class="collections"><thead><tr><th scope="col">Source file / collection</th><th scope="col">Facial signs</th><th scope="col">Diacritic counts</th><th scope="col"><span class="sr-only">Open</span></th></tr></thead><tbody id="collections"></tbody></table></div>
    <p class="fineprint">Counts are occurrences, including repeats. ${scope} Private collections are excluded. Unicode mapping: <code>${esc(manifest.profile)}</code>.</p></section>`;
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

async function articleExamples() {
  const [data] = await Promise.all([getJSON('data/examples.json'), loadFonts()]);
  const counts = data.counts;
  const contexts = {'gaze-with-eye-state':'One gaze + other eye-state mark',
    'gaze-without-eye-state':'One gaze, no other eye-state mark', 'two-gazes':'Two gaze marks'};
  const positions = {'page-left':'Page-left eye', 'page-right':'Page-right eye',
    'both eye positions':'Both eye positions'};
  app.innerHTML = `<a class="breadcrumb" href="../">← All ${fmt(data.corpus_occurrences)} eye-gaze records</a>
    <section class="hero examples-head"><p class="eyebrow">THE ARTICLE'S COMPLETE SELECTED EXAMPLE SET</p>
    <div class="hero-grid"><h1>Eye-gaze<br><em>examples.</em></h1><div class="hero-copy"><p>All ${counts.total} selected source compositions, shown with their facial subsets and direct Unicode mappings.</p><p class="muted">How can a writer specify which eye receives a single-eye gaze?</p></div></div>
    <div class="stats"><div><strong>${counts.total}</strong><span>selected signs</span></div><div><strong>${counts.single_gaze}</strong><span>with one gaze mark</span></div><div><strong>${counts.two_gazes}</strong><span>with two gaze marks</span></div><div><strong>${counts.collections}</strong><span>source collections</span></div></div></section>
    <section class="collection-section"><div class="section-title"><div><p class="eyebrow">ALL EXAMPLES · ONE LIST</p><h2>Inspect each composition</h2></div><a class="text-link" href="../data/examples.csv" download>Download ${counts.total} examples as CSV ↓</a></div>
    <p class="examples-intro">The ${counts.single_gaze} single-gaze signs include ${counts.page_left} page-left and ${counts.page_right} page-right assignments. These are selected examples, not a frequency estimate. <a href="../">Inspect the full ${fmt(data.corpus_occurrences)}-record selection ↗</a></p>
    <div class="mapping-note"><span class="status-dot"></span><p>The Unicode column uses the source symbol variants and the bundled Noto font. A display difference alone does not identify a mapping, font, or encoding limitation.</p><a href="${prefix}methods.html#mapping-limits">Mapping details ↗</a></div>
    <div class="table-wrap record-table-wrap"><table class="records examples"><thead><tr><th scope="col">Example / source</th><th scope="col">Original sign <span>FSW source signbox</span></th><th scope="col">Facial composition <span>Filtered &amp; normalized FSW</span></th><th scope="col">Direct Unicode mapping <span>Noto Sans SignWriting · source variants</span></th></tr></thead><tbody>
    ${data.cases.map(c => {
      const points = Array.from(c['uni-face'], x=>'U+'+x.codePointAt(0).toString(16).toUpperCase()).join(' ');
      return `<tr id="${esc(c.case_id)}"><th scope="row"><a class="row-number" href="#${esc(c.case_id)}" aria-label="Link to example ${esc(c.case_id)}">${esc(c.case_id)}</a><span class="record-small">${esc(c.collection)} · entry ${esc(c.entry_id)}</span>${tag(positions[c.eye_position])}<span class="record-small">${esc(contexts[c.context])}</span>${c.gaze_matches.map(g=>`<code class="gaze-key">${esc(g.key)}</code>`).join('')}${c.head_inserted ? tag('Default HEAD prepended') : ''}${c.flags.map(mappingFlag).join('')}<a class="source-link" href="${esc(c.dataset_url)}">Full dataset record ↗</a><a class="source-link" href="${esc(c.source_url)}" target="_blank" rel="noopener">Original SignPuddle entry ↗</a></th>
      <td><div class="sign-view" role="img" aria-label="Original sign for example ${esc(c.case_id)}">${svgFor(c.fsw)}</div>${details('FSW source', c.fsw)}</td>
      <td><div class="sign-view" role="img" aria-label="Facial composition for example ${esc(c.case_id)}">${svgFor(c['fsw-face'])}</div>${details('FSW face', c['fsw-face'])}</td>
      <td><div class="unicode-view" dir="ltr" lang="und" role="img" aria-label="Direct Unicode mapping for example ${esc(c.case_id)}">${esc(c['uni-face'])}</div>${details('Unicode code points', points)}${details('Unicode text', c['uni-face'])}</td></tr>`;
    }).join('')}</tbody></table></div>
    <p class="fineprint">Every example has a link for sharing. Page-left and page-right describe the written face as displayed, without assigning anatomical laterality. <a href="../data/examples.json">Download the examples and source provenance as JSON</a>. <a href="../data/all.csv" download>Download the full eye-gaze CSV</a>.</p></section>`;
  app.addEventListener('click', async event => {
    const button = event.target.closest('[data-copy]');
    if (!button) return;
    try { await navigator.clipboard.writeText(button.dataset.copy); button.textContent = 'Copied'; }
    catch { button.textContent = 'Select the text to copy'; }
  });
  function scrollToExample() {
    const id = location.hash.slice(1);
    document.querySelectorAll('.examples tbody tr').forEach(row=>row.classList.toggle('linked-record', row.id===id));
    if (/^[A-Z][0-9]{2}$/.test(id)) requestAnimationFrame(()=>document.getElementById(id)?.scrollIntoView({block:'start'}));
  }
  window.addEventListener('hashchange', scrollToExample);
  scrollToExample();
}

async function dataset(id) {
  const [{file, records}] = await Promise.all([getJSON(`data/files/${encodeURIComponent(id)}.json`), loadFonts()]);
  if (eyeGaze && records.some(record => !/S32[1-9][23][0-9a-f][0-9]{3}x[0-9]{3}/.test(record.fsw))) {
    throw new Error('The eye-gaze data contain a source sign without the required fill-2/3 symbol.');
  }
  records.forEach((record, i) => { record.row = i + 1; });
  let selected, headFilter, gazeFilter, pageNumber, pageSize;
  let renderedURL;
  let signObserver;
  const counts = Object.keys(file.diacritics).map(Number).sort((a,b)=>a-b);
  function readView() {
    const params = new URLSearchParams(location.search);
    selected = params.get('diacritics') || 'all';
    if (selected !== 'all' && !counts.includes(Number(selected))) selected = 'all';
    headFilter = params.get('heads') || 'all';
    if (!['all','inserted','existing','multiple'].includes(headFilter)) headFilter = 'all';
    gazeFilter = eyeGaze ? params.get('gaze') || 'any' : 'any';
    if (gazeFilter === 'nonzero') gazeFilter = 'selected';
    if (!['any','selected','mixed'].includes(gazeFilter)) gazeFilter = 'any';
    const size = params.get('rows');
    pageSize = size === 'all' ? 'all' : ['25','50','100'].includes(size) ? Number(size) : 25;
    const number = Number(params.get('page'));
    pageNumber = Number.isSafeInteger(number) && number > 0 ? number : 1;
  }
  function linkedRow() {
    const match = /^#row-([1-9][0-9]*)$/.exec(location.hash);
    const row = match ? Number(match[1]) : 0;
    return Number.isSafeInteger(row) && row <= records.length ? row : 0;
  }
  function viewURL(row = 0) {
    const url = new URL(location.href);
    for (const key of ['page','rows','diacritics','heads','gaze']) url.searchParams.delete(key);
    url.searchParams.set('rows', pageSize);
    if (pageNumber > 1) url.searchParams.set('page', pageNumber);
    if (selected !== 'all') url.searchParams.set('diacritics', selected);
    if (headFilter !== 'all') url.searchParams.set('heads', headFilter);
    if (gazeFilter !== 'any') url.searchParams.set('gaze', gazeFilter);
    url.hash = row ? `row-${row}` : '';
    return url;
  }
  readView();
  app.innerHTML = `<a class="breadcrumb" href="../index.html">← ${eyeGaze ? 'Eye gaze collections' : 'All collections'}</a><section class="dataset-head"><p class="eyebrow">${eyeGaze ? 'EYE GAZE · S321–S329 · FILLS 2 AND 3' : 'SOURCE COLLECTION'}</p><h1>${esc(file.source_file)}</h1><p class="dataset-title">${esc(file.title || 'Untitled collection')}</p><div class="dataset-meta"><span><b>${fmt(file.rows)}</b> ${eyeGaze ? 'matching gaze occurrences' : 'facial occurrences'}</span><span><b>${fmt(file.unique_fsw)}</b> unique source signboxes</span><span><b>${fmt(file.head_inserted)}</b> prepended HEADs</span><a href="../data/raw/${encodeURIComponent(id)}.csv" download>Download CSV ↓</a></div></section>
    ${file.publication_review_required ? '<div class="notice amber">This publicly downloadable source is labelled private. This local inspection copy awaits a publication decision.</div>' : ''}
    <div class="mapping-note"><span class="status-dot"></span><p><strong>About the Unicode comparison.</strong> Uses source symbol variants in source order, with the first S2ff resource moved to the front or a default HEAD prepended. The mapping does not separate faces, assign marks to individual heads, or search alternative fills. A display difference alone does not identify whether the cause is the mapping, font support, or information absent from the facial sequence.</p><a href="${prefix}methods.html#mapping-limits">Mapping details ↗</a></div>
    <section class="records-section"><div class="toolbar record-controls"><label>Number of diacritics<select id="diacritics"><option value="all">${eyeGaze ? 'All counts' : 'All counts (2+)'}</option>${counts.map(n=>`<option value="${n}">${n} ${n===1?'diacritic':'diacritics'}</option>`).join('')}</select></label><label>S2ff HEAD resources<select id="heads"><option value="all">All records</option><option value="inserted">Default HEAD prepended</option><option value="existing">With an S2ff resource</option><option value="multiple">Multiple S2ff resources</option></select></label><label>Rows per page<select id="page-size"><option>25</option><option>50</option><option>100</option><option value="all">All rows</option></select></label><p id="record-status" role="status" aria-live="polite"></p></div>
    <div class="table-wrap record-table-wrap"><table class="records"><thead><tr><th scope="col">Record</th><th scope="col">Original sign <span>FSW source signbox</span></th><th scope="col">Facial composition <span>Filtered &amp; normalized FSW</span></th><th scope="col">Direct Unicode mapping <span>Noto Sans SignWriting · source variants</span></th></tr></thead><tbody id="records"></tbody></table></div>
    <div class="pagination"><button id="previous" type="button">← Previous</button><span id="page-status"></span><button id="next" type="button">Next →</button></div><p class="fineprint">“Diacritics” counts retained non-S2ff resources, excluding fill and rotation modifiers. Air and breath symbols S337–S33a are excluded before counting. Each FSW view fits its own cell. Unicode uses the bundled Noto font; display does not establish equivalence.</p></section>`;
  const select = document.querySelector('#diacritics');
  const heads = document.querySelector('#heads');
  const sizeSelect = document.querySelector('#page-size');
  if (eyeGaze) {
    sizeSelect.closest('label').insertAdjacentHTML('beforebegin', '<label>Gaze fills<select id="gaze-fills"><option value="any">Any fill-2/3 gaze</option><option value="selected">Only gaze fills 2 and 3</option><option value="mixed">Also contains other fills</option></select></label>');
  }
  const gazeSelect = document.querySelector('#gaze-fills');
  function matches(r) {
    return (selected === 'all' || r.diacritics === Number(selected)) &&
      (headFilter === 'all' || (headFilter === 'inserted' ? r.head_inserted : headFilter === 'existing' ? !r.head_inserted : r.head_count > 1)) &&
      (gazeFilter === 'any' || (gazeFilter === 'mixed') === r.flags.includes('also-other-gaze-fills'));
  }
  function signView(sign, label) {
    if (!sign) return '<p class="muted">Facial normalization unavailable; source retained.</p>';
    return `<div class="sign-view" role="img" aria-label="${label}"${pageSize === 'all' ? ` data-fsw="${esc(sign)}"` : ''}>${pageSize === 'all' ? '' : svgFor(sign)}</div>`;
  }
  function render(targetRow = 0) {
    // A record permalink takes precedence over stale page numbers or filters.
    if (targetRow && !matches(records[targetRow - 1])) {
      selected = headFilter = 'all';
      gazeFilter = 'any';
    }
    const shown = records.filter(matches);
    const size = pageSize === 'all' ? Math.max(1, shown.length) : pageSize;
    if (targetRow) pageNumber = Math.floor(shown.findIndex(r => r.row === targetRow) / size) + 1;
    const pages = Math.max(1, Math.ceil(shown.length / size));
    pageNumber = Math.min(Math.max(1, pageNumber), pages);
    const start = (pageNumber-1)*size;
    const current = shown.slice(start, start + size);
    select.value = selected;
    heads.value = headFilter;
    sizeSelect.value = String(pageSize);
    if (gazeSelect) gazeSelect.value = gazeFilter;
    const url = viewURL(targetRow);
    renderedURL = url.href;
    history.replaceState(null, '', url);
    signObserver?.disconnect();
    document.querySelector('#record-status').textContent = `${fmt(shown.length)} matching records`;
    document.querySelector('#records').innerHTML = current.length ? current.map(r => {
      const sourceLink = /^sgn\d+$/.test(id) && r.entry_id ? `http://signbank.org/signpuddle2.0/canvas.php?ui=1&sgn=${id.slice(3)}&sid=${encodeURIComponent(r.entry_id)}` : '';
      const codepoints = Array.from(r['uni-face'], c => 'U+' + c.codePointAt(0).toString(16).toUpperCase()).join(' ');
      const gazeDetails = eyeGaze ? `<span class="record-small">Matched gaze</span>${r.gaze_matches.map(s=>`<code class="gaze-key">${esc(s.key)}<span>fill ${s.key[4]} · ${s.x}x${s.y}</span></code>`).join('')}${r.normalization_error ? details('Normalization error',r.normalization_error) : ''}` : '';
      return `<tr id="row-${r.row}"><th scope="row"><a class="row-number" href="${esc(viewURL(r.row).href)}">${fmt(r.row)}</a><span class="record-small">${r.diacritics} ${r.diacritics===1?'diacritic':'diacritics'}</span>${gazeDetails}${r.head_inserted ? tag('Default HEAD prepended', '', 'No S2ff resource was found. Other source symbols may already contain a head outline.') : ''}${r.flags.map(mappingFlag).join('')}${sourceLink ? `<a class="source-link" href="${sourceLink}" target="_blank" rel="noopener">Entry ${esc(r.entry_id)} ↗</a>` : ''}</th><td>${signView(r.fsw, 'Original SignWriting sign')}${details('FSW source',r.fsw)}</td><td>${signView(r['fsw-face'], 'Filtered facial SignWriting')}${details('FSW face',r['fsw-face'])}</td><td><div class="unicode-view" dir="ltr" lang="und" role="img" aria-label="Direct Unicode mapping rendered with Noto Sans SignWriting">${esc(r['uni-face'])}</div>${details('Unicode code points',codepoints)}${details('Unicode text',r['uni-face'])}</td></tr>`;
    }).join('') : '<tr><td class="empty" colspan="4">No records match these filters.</td></tr>';
    document.querySelector('#previous').disabled = pageNumber === 1;
    document.querySelector('#next').disabled = pageNumber >= pages;
    document.querySelector('#page-status').textContent = `${fmt(current.length ? start+1 : 0)}–${fmt(start+current.length)} of ${fmt(shown.length)} · ${pageSize === 'all' ? 'All rows' : `Page ${pageNumber} of ${pages}`}`;
    if (pageSize === 'all') {
      // Keep every row present while rendering FSW images as they enter view.
      signObserver = new IntersectionObserver(entries => {
        for (const {target, isIntersecting} of entries) if (isIntersecting) {
          target.innerHTML = svgFor(target.dataset.fsw);
          signObserver.unobserve(target);
        }
      }, {rootMargin:'400px'});
      document.querySelectorAll('[data-fsw]').forEach(view => signObserver.observe(view));
    }
    if (targetRow) {
      document.getElementById(`row-${targetRow}`)?.classList.add('linked-record');
      requestAnimationFrame(() => document.getElementById(`row-${targetRow}`)?.scrollIntoView({block:'start'}));
    }
  }
  select.addEventListener('change',()=>{selected=select.value;pageNumber=1;render();});
  heads.addEventListener('change',()=>{headFilter=heads.value;pageNumber=1;render();});
  sizeSelect.addEventListener('change',()=>{pageSize=sizeSelect.value === 'all' ? 'all' : Number(sizeSelect.value);pageNumber=1;render(linkedRow());});
  gazeSelect?.addEventListener('change',()=>{gazeFilter=gazeSelect.value;pageNumber=1;render();});
  document.querySelector('#previous').addEventListener('click',()=>{pageNumber--;render();});
  document.querySelector('#next').addEventListener('click',()=>{pageNumber++;render();});
  document.querySelector('#records').addEventListener('click', async e => {
    const button = e.target.closest('[data-copy]');
    if (!button) return;
    try { await navigator.clipboard.writeText(button.dataset.copy); button.textContent='Copied'; }
    catch { button.textContent='Select the text to copy'; }
  });
  function navigate() {
    if (location.href === renderedURL) return;
    readView();
    render(linkedRow());
  }
  window.addEventListener('hashchange', navigate);
  window.addEventListener('popstate', navigate);
  render(linkedRow());
}

if (app) {
  try {
    manifest = await getJSON('data/manifest.json');
    if (document.body.dataset.view === 'examples') await articleExamples();
    else if (document.body.dataset.file) await dataset(document.body.dataset.file);
    else home();
    app.setAttribute('aria-busy','false');
  } catch(error) { errorPanel(error); }
}
