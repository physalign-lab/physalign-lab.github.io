/* PhysAlign static site. No framework, tracking, keys, or remote runtime dependencies. */
(() => {
  'use strict';
  const $ = (id) => document.getElementById(id);
  const MAIN = [
    {key:'gacc_all', label:'GAcc ↑', sub:'All · G', pool:'G', tip:'Overall grounding. Paper snapshot: 986 parents / 3,341 probes.'},
    {key:'cacc', label:'CAcc ↑', sub:'Joint · L', pool:'L', tip:'Content recognition on independent reading targets. Paper snapshot: 311 / 412.'},
    {key:'jacc', label:'JAcc ↑', sub:'Joint · L', pool:'L', tip:'Recognition AND grounding correct on the same probe; not a product of marginal accuracies.'},
    {key:'gacc_joint', label:'GAccL ↑', sub:'Joint · L', pool:'L', tip:'Grounding on the joint set, not conditioned on a correct reading.'},
    {key:'solveacc', label:'SolveAcc ↑', sub:'986 parents¹', pool:'solve', tip:'Mean normalized original-problem credit, including partial credit. Not binary solution accuracy.'}
  ];
  const PAIRED = [
    {key:'base',label:'Base ↑',sub:'GAcc · Pm'}, {key:'gt',label:'+GT ↑',sub:'GAcc · Pm'},
    {key:'delta_pp',label:'ΔG',sub:'percentage points'}, {key:'parents',label:'Parents',sub:'observed N'},
    {key:'probes',label:'Probes',sub:'observed n'}, {key:'ci95_pp',label:'95% CI of Δ',sub:'if available'}
  ];
  const DIAGNOSTIC = [
    {key:'cacc',label:'CAcc',sub:'Joint · L'}, {key:'jacc',label:'C+ G+',sub:'joint share'},
    {key:'q10',label:'C+ G−',sub:'joint share'}, {key:'q01',label:'C− G+',sub:'joint share'},
    {key:'q00',label:'C− G−',sub:'joint share'}, {key:'gerr',label:'GErr | C',sub:'conditional error'}
  ];
  let config, results;
  let state = {view:'main', metric:'gacc_all', direction:'desc', search:'', access:'all', track:''};
  let shownRows = [], shownColumns = [], rankMap = new Map();
  const trusted = (m) => ['paper-reported','maintainer-verified'].includes(m.status);
  const finite = (n) => typeof n === 'number' && Number.isFinite(n);
  const fmt = (n, digits=2) => finite(n) ? n.toFixed(digits) : '—';
  const text = (tag, value, className) => {
    const el = document.createElement(tag); el.textContent = value;
    if (className) el.className = className; return el;
  };
  function safeURL(value, allowMail=false) {
    if (!value || typeof value !== 'string') return null;
    try {
      const u = new URL(value);
      if (['https:','http:'].includes(u.protocol) || (allowMail && u.protocol === 'mailto:')) return u.href;
    } catch (_) { /* Unconfigured or malformed values are not turned into links. */ }
    return null;
  }
  function makeLink(label, url) {
    const a = text('a',label); a.href = url;
    if (!url.startsWith('mailto:')) {a.target='_blank';a.rel='noopener noreferrer';} return a;
  }
  async function readJSON(path) {
    const response = await fetch(path, {cache:'no-cache'});
    if (!response.ok) throw new Error(`${path}: HTTP ${response.status}`);
    return response.json();
  }
  function configureSite() {
    $('project-name').textContent = config.project_name;
    $('paper-title').textContent = config.subtitle;
    $('tagline').textContent = config.tagline;
    $('footer-note').textContent = config.footer_note;
    document.title = `${config.project_name} — Evidence-Grounded Physics Reasoning`;
    document.querySelectorAll('[data-resource]').forEach(a => {
      const key = a.dataset.resource, url = safeURL(config.links?.[key], key==='contact');
      if (url) { a.href=url; a.removeAttribute('aria-disabled'); a.querySelector('small')?.remove();
        if (!url.startsWith('mailto:')) {a.target='_blank';a.rel='noopener noreferrer';}
      }
    });
    if (config.authors?.length) {
      $('author-block').hidden = false;
      const authorLine=$('authors');
      config.authors.forEach((author,index) => {
        const u=safeURL(author.url), node=u?makeLink(author.name,u):text('span',author.name);
        node.classList.add('author-name');
        if (author.affiliations?.length || author.note) node.append(text('sup',(author.affiliations||[]).join(',')+(author.note||'')));
        authorLine.append(node);
        if(index<config.authors.length-1) authorLine.append(document.createTextNode(index===config.authors.length-2?' and ':', '));
      });
      const affiliationLine=$('affiliations');
      (config.affiliations||[]).forEach(a=>{
        const item=text('span',a.name);item.prepend(text('sup',a.id));affiliationLine.append(item);
      });
      const noteLine=$('author-note');noteLine.textContent=config.author_note||'';
      const contact=safeURL(config.links?.contact,true);
      if(contact?.startsWith('mailto:')){noteLine.append(document.createTextNode(' · '),makeLink(contact.slice(7),contact));}
    }
    if (config.bibtex?.trim()) { $('bibtex').textContent=config.bibtex.trim(); $('copy-bibtex').disabled=false; }
  }
  function track() {return results.tracks.find(t=>t.id===state.track);}
  function trackRows() {return results.models.filter(m=>m.track_id===state.track && trusted(m));}
  function supportMatches(model, metric) {
    const col = MAIN.find(c=>c.key===metric), t=track();
    const required=t?.pools?.[col?.pool], actual=model.support?.[col?.pool];
    return model.benchmark_id===t?.benchmark_id && model.protocol_id===t?.protocol_id &&
      !!required && !!actual && actual.parents===required.parents &&
      (required.probes===undefined || required.probes===actual.probes) &&
      (!t.dataset_revision || model.dataset_revision===t.dataset_revision) &&
      (!t.evaluator_commit || model.evaluator_commit===t.evaluator_commit) &&
      (!t.membership_sha256 || model.membership_sha256===t.membership_sha256);
  }
  function rankValue(m) {return supportMatches(m,state.metric) && finite(m.metrics?.[state.metric]) ? m.metrics[state.metric] : null;}
  function establishRanks(rows) {
    rankMap = new Map();
    const ranked=rows.filter(m=>rankValue(m)!==null).sort((a,b)=>rankValue(b)-rankValue(a)||a.name.localeCompare(b.name));
    let previous=null, rank=0;
    ranked.forEach((m,i)=>{const value=rankValue(m);if (value!==previous) rank=i+1;rankMap.set(m.id,rank);previous=value;});
  }
  function rowSort(a,b) {
    if (state.view!=='main') return a.name.localeCompare(b.name);
    const av=rankValue(a),bv=rankValue(b);
    if(av===null && bv===null) return a.name.localeCompare(b.name);
    if(av===null) return 1;if(bv===null) return -1;
    return (state.direction==='desc'?bv-av:av-bv)||a.name.localeCompare(b.name);
  }
  function valueFor(m,key) {
    if(state.view==='main') return m.metrics?.[key];
    if(state.view==='paired') return m.paired?.[key];
    if(key==='cacc') return m.metrics?.cacc;
    if(key==='jacc') return m.diagnostics?.joint_quadrants?.[0];
    if(key==='q10') return m.diagnostics?.joint_quadrants?.[1];
    if(key==='q01') return m.diagnostics?.joint_quadrants?.[2];
    if(key==='q00') return m.diagnostics?.joint_quadrants?.[3];
    if(key==='gerr') return m.diagnostics?.grounding_error_given_correct_reading;
    return null;
  }
  function displayValue(m,key) {
    const v=valueFor(m,key);
    if(key==='ci95_pp') return Array.isArray(v)&&v.length===2?`[${fmt(v[0])}, ${fmt(v[1])}]`:'—';
    if(['parents','probes'].includes(key)) return finite(v)?v.toLocaleString('en-US'):'—';
    if(key==='delta_pp') return finite(v)?`${v>0?'+':''}${fmt(v)}`:'—';
    return fmt(v);
  }
  function updateViewText() {
    const t=track();
    $('track-description').textContent=t.description;
    $('updated-label').textContent=`Site snapshot updated ${results.updated}`;
    $('updated-label').title=results.updated_note||'Website update date; not evaluation completion date.';
    $('metric-label').hidden=state.view!=='main';
    $('diagnostic-figure').hidden=state.view!=='diagnostic' || state.track!=='paper-2026-09-26';
    const descriptions={
      main:'Default order: overall GAcc on G. Select a metric or click its column header. Ranks are computed within the full selected track before search/access filtering; ties share a rank. Click a model to inspect its settings.',
      paired:'Descriptive comparison only—no cross-model ranks. Base and +GT share support within each model; the paper has 412 observed pairs for open-weight models and 397 for API models, not all 553 eligible pairs. Δ is reported independently of rounded endpoint scores.',
      diagnostic:'No ranking in this view. C/G denote content/grounding correctness. Four joint shares use the same L and weights. GErr | C conditions on each model’s correctly read subset; report it with CAcc, not as a standalone model ranking.'
    };
    $('view-description').textContent=descriptions[state.view];
    $('ranking-note').textContent=state.view==='main'?
      'Point-estimate ranks are not significance claims or equal-compute comparisons. ¹ SolveAcc includes partial credit. † A cell with different support is descriptive and is excluded from ranking by that metric. Missing scores are —, never zero.':
      state.view==='paired'?'Positive changes are descriptive, not significance claims. Most paper confidence intervals include zero. “—” indicates unavailable numerical interval endpoints. +GT does not supply perfect perception, establish an upper bound, or isolate a pure OCR effect.':
      'Joint outcome shares are diagnostic, not a model-quality ordering. Percentages may not sum to exactly 100 after rounding. Conditional ratios are reproduced from Table 9, not recalculated from rounded CAcc/JAcc.';
    $('results-panel').setAttribute('aria-labelledby',`tab-${state.view}`);
    $('table-caption').textContent=`${t.label} — ${state.view==='main'?'Main model results':state.view==='paired'?'Paired reading controls':'Recognition–grounding error diagnostics'}`;
  }
  function render() {
    updateViewText();
    const all=trackRows(); establishRanks(all);
    shownRows=all.filter(m=>(state.access==='all'||m.access===state.access) &&
      `${m.name} ${m.family}`.toLowerCase().includes(state.search.toLowerCase())).sort(rowSort);
    shownColumns=state.view==='main'?MAIN:state.view==='paired'?PAIRED:DIAGNOSTIC;
    const head=text('tr','');
    if(state.view==='main'){const th=text('th','#');th.scope='col';head.append(th);}
    const mh=text('th','Model','model-column');mh.scope='col';head.append(mh);
    shownColumns.forEach(c=>{
      const th=document.createElement('th');th.scope='col';if(c.tip) th.title=c.tip;
      if(state.view==='main') {
        const sorted=state.metric===c.key;th.setAttribute('aria-sort',sorted?(state.direction==='desc'?'descending':'ascending'):'none');
        if(sorted) th.classList.add('sorted');
        const b=text('button',c.label,'sort-button');b.type='button';b.title=c.tip;
        b.append(text('small', c.key==='solveacc'?`${track().pools.solve.parents.toLocaleString('en-US')} parents¹`:c.sub));
        b.addEventListener('click',()=>{if(state.metric===c.key) state.direction=state.direction==='desc'?'asc':'desc';else{state.metric=c.key;state.direction='desc';}$('metric-select').value=state.metric;render();});
        th.append(b);
      } else {th.append(document.createTextNode(c.label),text('small',c.sub));}
      head.append(th);
    });
    $('results-head').replaceChildren(head);
    const fragment=document.createDocumentFragment();
    shownRows.forEach(m=>{
      const row=document.createElement('tr');row.dataset.model=m.id;
      if(state.view==='main') {
        const rank=rankMap.get(m.id),td=text('td','','rank');
        td.append(text('span',rank??'—',rank&&rank<=3?'rank-badge':''));row.append(td);
      }
      const modelCell=text('td','','model-cell'), modelButton=text('button',m.name,'model-button');modelButton.type='button';modelButton.addEventListener('click',()=>showModel(m));
      const meta=text('span','','model-meta');meta.append(text('span','',`access-dot ${m.access==='api'?'api':''}`));
      meta.append(document.createTextNode(`${m.access==='open'?'Open weights':'API'} · ${m.config?.reasoning||'Settings not supplied'}`));modelCell.append(modelButton,meta);row.append(modelCell);
      shownColumns.forEach(c=>{
        const td=text('td',displayValue(m,c.key));
        if(state.view==='main' && state.metric===c.key) td.classList.add('key-score');
        if(state.view==='main' && finite(m.metrics?.[c.key]) && !supportMatches(m,c.key)) {td.append(text('sup','†'));td.title='Different or incomplete support/protocol; excluded from ranking by this metric.';}
        if(c.key==='delta_pp' && finite(m.paired?.delta_pp)) td.classList.add(m.paired.delta_pp>=0?'positive':'negative');
        row.append(td);
      });fragment.append(row);
    });
    if(!shownRows.length){const row=text('tr',''),cell=text('td','No matching, reviewed results in this track.','empty-row');cell.colSpan=shownColumns.length+(state.view==='main'?2:1);row.append(cell);fragment.append(row);}
    $('results-body').replaceChildren(fragment);
    const pending=results.models.filter(m=>m.track_id===state.track&&!trusted(m)).length;
    $('result-count').textContent=`${shownRows.length} of ${all.length} reviewed model results · ${track().label}${pending?` · ${pending} unverified record(s) excluded`:''}`;
    $('export-csv').disabled=!shownRows.length;
  }
  function showModel(m) {
    $('detail-title').textContent=m.name;
    const dl=document.createElement('dl');
    const add=(k,v)=>{dl.append(text('dt',k),text('dd',v===null||v===undefined||v===''?'Not supplied':String(v)));};
    add('Result status',m.status);add('Source',m.result_source);add('Track',track().label);
    add('Checkpoint / API alias',m.config?.checkpoint_or_alias);add('Model access',m.access==='open'?'Open weights':'API');
    add('Parameters',finite(m.parameters_b)?`${m.parameters_b} B`:'Not disclosed in the supplied record');
    add('Reasoning',m.config?.reasoning);add('Sampling',m.config?.sampling);add('Requested output cap',m.config?.output_cap);
    add('Image policy',m.config?.image_policy);add('Run created (UTC)',m.run_created_utc?`${m.run_created_utc} — not completion date`:null);
    for(const p of ['G','L','solve']) {const s=m.support?.[p];add(`${p} support`,s?`${s.parents} parents${s.probes!==undefined?` / ${s.probes} probes`:''}`:null);}
    add('Observed paired support',m.paired?`${m.paired.parents} parents / ${m.paired.probes} probes`:null);
    add('Benchmark record ID',m.benchmark_id);add('Protocol record ID',m.protocol_id);
    add('Dataset revision',m.dataset_revision);add('Evaluator commit',m.evaluator_commit);add('Membership SHA-256',m.membership_sha256);
    add('Paired membership SHA-256',m.paired?.membership_sha256);
    const content=$('detail-content');content.replaceChildren(dl,text('p',m.notes||''));
    const artifact=safeURL(m.artifact_url);if(artifact) content.append(makeLink('Inspect result artifact ↗',artifact));
    const model=safeURL(m.model_url);if(model) content.append(makeLink('Model documentation ↗',model));
    $('detail-dialog').showModal();
  }
  function csvCell(value) {
    let s=String(value??'');
    // Prevent spreadsheet formula execution in user-supplied text fields.
    if(/^[=+@\-\t\r]/.test(s) && !/^[+-]?\d+(\.\d+)?$/.test(s)) s="'"+s;
    return `"${s.replaceAll('"','""')}"`;
  }
  function exportCSV() {
    const header=[...(state.view==='main'?['rank_in_full_track']:[]),'model','access','track','benchmark_id','protocol_id',...shownColumns.map(c=>c.key),'source'];
    const lines=[header.map(csvCell).join(',')];
    for(const m of shownRows) lines.push([
      ...(state.view==='main'?[rankMap.get(m.id)??'']:[]),m.name,m.access,m.track_id,m.benchmark_id,m.protocol_id,
      ...shownColumns.map(c=>displayValue(m,c.key)==='—'?'':displayValue(m,c.key)),m.result_source
    ].map(csvCell).join(','));
    const blob=new Blob(['\uFEFF'+lines.join('\r\n')],{type:'text/csv;charset=utf-8;'}),u=URL.createObjectURL(blob),a=document.createElement('a');
    a.href=u;a.download=`physalign-${state.track}-${state.view}.csv`;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(u),1000);
  }
  function events() {
    $('model-search').addEventListener('input',e=>{state.search=e.target.value.trim();render();});
    $('access-filter').addEventListener('change',e=>{state.access=e.target.value;render();});
    $('track-select').addEventListener('change',e=>{state.track=e.target.value;render();});
    $('metric-select').addEventListener('change',e=>{state.metric=e.target.value;state.direction='desc';render();});
    $('export-csv').addEventListener('click',exportCSV);
    const tabs=[...document.querySelectorAll('[data-view]')];
    const selectTab=b=>{state.view=b.dataset.view;tabs.forEach(x=>{const chosen=x===b;x.setAttribute('aria-selected',String(chosen));x.tabIndex=chosen?0:-1;});render();};
    tabs.forEach((b,i)=>{b.addEventListener('click',()=>selectTab(b));b.addEventListener('keydown',e=>{
      let target=null;if(e.key==='ArrowRight')target=(i+1)%tabs.length;if(e.key==='ArrowLeft')target=(i+tabs.length-1)%tabs.length;if(e.key==='Home')target=0;if(e.key==='End')target=tabs.length-1;
      if(target!==null){e.preventDefault();tabs[target].focus();selectTab(tabs[target]);}
    });});
    $('copy-bibtex').addEventListener('click',async()=>{
      try{await navigator.clipboard.writeText(config.bibtex.trim());$('copy-status').textContent='BibTeX copied.';}
      catch(_){const range=document.createRange();range.selectNodeContents($('bibtex'));const sel=window.getSelection();sel.removeAllRanges();sel.addRange(range);$('copy-status').textContent='Clipboard unavailable. The BibTeX is selected; press Ctrl+C or Cmd+C.';}
    });
  }
  function staticEvents() {
    document.documentElement.classList.add('js-ready');
    const menu=document.querySelector('.nav-toggle'),nav=$('navigation');
    menu.addEventListener('click',()=>{const open=menu.getAttribute('aria-expanded')!=='true';menu.setAttribute('aria-expanded',String(open));nav.classList.toggle('open',open);});
    nav.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>{menu.setAttribute('aria-expanded','false');nav.classList.remove('open');}));
    document.addEventListener('keydown',e=>{if(e.key==='Escape'&&nav.classList.contains('open')){menu.setAttribute('aria-expanded','false');nav.classList.remove('open');menu.focus();}});
    document.querySelectorAll('dialog').forEach(d=>{
      d.querySelector('.dialog-close').addEventListener('click',()=>d.close());
      d.addEventListener('click',e=>{const r=d.getBoundingClientRect();if(e.target===d&&(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom))d.close();});
    });
    document.querySelectorAll('[data-zoom]').forEach(b=>b.addEventListener('click',()=>{
      $('zoomed-image').src=b.dataset.zoom;$('zoomed-image').alt=b.querySelector('img').alt;$('image-dialog-caption').textContent=b.dataset.caption;$('image-dialog').showModal();
    }));
    const reveals=[...document.querySelectorAll('.reveal')];
    if('IntersectionObserver' in window) {
      const revealObserver=new IntersectionObserver(entries=>entries.forEach(entry=>{
        if(entry.isIntersecting){entry.target.classList.add('is-visible');revealObserver.unobserve(entry.target);}
      }),{rootMargin:'0px 0px -8% 0px',threshold:.08});
      reveals.forEach(el=>revealObserver.observe(el));
    } else reveals.forEach(el=>el.classList.add('is-visible'));
    const progress=$('scroll-progress-bar');
    const updateProgress=()=>{const range=document.documentElement.scrollHeight-window.innerHeight;progress.style.width=`${range>0?Math.min(100,Math.max(0,window.scrollY/range*100)):0}%`;};
    updateProgress();window.addEventListener('scroll',updateProgress,{passive:true});window.addEventListener('resize',updateProgress,{passive:true});
    if('IntersectionObserver' in window) {
      const links=[...nav.querySelectorAll('a[href^="#"]')],byId=new Map(links.map(a=>[a.getAttribute('href').slice(1),a]));
      const sectionObserver=new IntersectionObserver(entries=>entries.forEach(entry=>{
        if(entry.isIntersecting){links.forEach(a=>a.classList.remove('active'));const active=byId.get(entry.target.id);if(active)active.classList.add('active');}
      }),{rootMargin:'-25% 0px -64% 0px',threshold:0});
      byId.forEach((_,id)=>{const section=$(id);if(section)sectionObserver.observe(section);});
    }
  }
  async function init() {
    staticEvents();
    try {
      [config,results]=await Promise.all([readJSON('./data/site.json'),readJSON('./data/leaderboard.json')]);
      if(!Array.isArray(results.models)||!results.tracks?.length) throw new Error('The leaderboard requires models[] and at least one track.');
      configureSite();
      state.metric=MAIN.some(c=>c.key===config.default_metric)?config.default_metric:'gacc_all';
      state.track=results.tracks.some(t=>t.id===config.default_track)?config.default_track:results.tracks[0].id;
      for(const t of results.tracks){const opt=text('option',t.label);opt.value=t.id;$('track-select').append(opt);}
      $('track-select').value=state.track;$('metric-select').value=state.metric;
      events();render();
    } catch(error) {
      $('load-error').hidden=false;
      $('load-error').textContent=`Could not load the site configuration or results. Serve this folder over HTTP (python -m http.server 8000), check data/*.json, and run scripts/validate.py. ${error.message}`;
      $('result-count').textContent='Results unavailable—see the loading message above.';
      console.error(error);
    }
  }
  init();
})();
