/* ============================================================
   ConvNeXt presentation engine
   - stage scaling to fit any screen
   - slide + fragment navigation (keyboard / click / buttons)
   - per-slide animation triggers
   ============================================================ */
(() => {
  const stage    = document.getElementById('stage');
  const viewport = document.getElementById('viewport');
  const slides   = Array.from(document.querySelectorAll('.slide'));
  const progressBar = document.getElementById('progressBar');
  const curNum   = document.getElementById('curNum');
  const totalNum = document.getElementById('totalNum');

  let current = 0;          // current slide index
  let fragStep = 0;         // how many fragments revealed on current slide

  totalNum.textContent = slides.length;

  /* ---------- stage scaling ---------- */
  function fit(){
    const vp = viewport.getBoundingClientRect();
    const scale = Math.min(vp.width / 1280, vp.height / 720);
    stage.style.transform = `scale(${scale})`;
  }
  window.addEventListener('resize', fit);
  fit();

  /* ---------- fragments helper ---------- */
  function fragsOf(slide){ return Array.from(slide.querySelectorAll('.fragment')); }

  function showSlide(idx, {fromStart=true} = {}){
    idx = Math.max(0, Math.min(slides.length - 1, idx));
    const prev = slides[current];
    if (prev && prev !== slides[idx]) prev.classList.remove('active');

    current = idx;
    const slide = slides[current];
    slide.classList.add('active');

    const frags = fragsOf(slide);
    if (fromStart){
      frags.forEach(f => f.classList.remove('visible'));
      fragStep = 0;
    } else {
      // reveal all (when arriving by going backwards)
      frags.forEach(f => f.classList.add('visible'));
      fragStep = frags.length;
    }

    progressBar.style.width = ((current) / (slides.length - 1) * 100) + '%';
    curNum.textContent = current + 1;

    triggerAnim(slide, true);
    // stop animations on non-active slides
    slides.forEach((s,i) => { if (i !== current) triggerAnim(s, false); });
  }

  function next(){
    const slide = slides[current];
    const frags = fragsOf(slide);
    if (fragStep < frags.length){
      frags[fragStep].classList.add('visible');
      fragStep++;
      return;
    }
    if (current < slides.length - 1) showSlide(current + 1, {fromStart:true});
  }

  function prev(){
    const slide = slides[current];
    if (fragStep > 0){
      fragStep--;
      fragsOf(slide)[fragStep].classList.remove('visible');
      return;
    }
    if (current > 0) showSlide(current - 1, {fromStart:false});
  }

  /* ---------- input ---------- */
  document.addEventListener('keydown', (e) => {
    switch(e.key){
      case 'ArrowRight': case ' ': case 'PageDown': e.preventDefault(); next(); break;
      case 'ArrowLeft':  case 'PageUp':            e.preventDefault(); prev(); break;
      case 'Home': showSlide(0); break;
      case 'End':  showSlide(slides.length - 1, {fromStart:false}); break;
      case 'f': case 'F': toggleFullscreen(); break;
    }
  });
  document.getElementById('nextBtn').addEventListener('click', next);
  document.getElementById('prevBtn').addEventListener('click', prev);
  // click on stage advances (ignore clicks on buttons)
  viewport.addEventListener('click', (e) => {
    if (e.target.closest('.replay-btn, .nav-btn')) return;
    next();
  });

  function toggleFullscreen(){
    if (!document.fullscreenElement) document.documentElement.requestFullscreen?.();
    else document.exitFullscreen?.();
  }

  /* ---------- replay buttons ---------- */
  document.querySelectorAll('[data-replay]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const slide = btn.closest('.slide');
      triggerAnim(slide, false);
      // force reflow then re-run
      void slide.offsetWidth;
      triggerAnim(slide, true);
    });
  });

  /* ============================================================
     ANIMATIONS
     ============================================================ */
  const timers = [];
  function clearTimers(){ timers.forEach(t => clearTimeout(t)); timers.length = 0; }

  function triggerAnim(slide, on){
    const kind = slide.getAttribute('data-anim');
    if (!kind) return;
    if (!on){
      slide.classList.remove('anim-run');
      resetAnim(kind, slide);
      return;
    }
    clearTimers();
    slide.classList.add('anim-run');
    if (kind === 'roadmap')   runRoadmap();
    if (kind === 'depthwise') runDepthwise();
    if (kind === 'inverted')  runInverted(slide);
    if (kind === 'kernel')    runKernel();
    if (kind === 'recipebar') runRecipeBar();
    if (kind === 'stage')     runStage();
    if (kind === 'stem')      runStem();
    if (kind === 'summary')   runSummary();
  }

  function resetAnim(kind, slide){
    if (kind === 'roadmap')   resetRoadmap();
    if (kind === 'depthwise') resetDepthwise();
    if (kind === 'inverted')  resetInverted(slide);
    if (kind === 'kernel')    resetKernel();
    if (kind === 'recipebar') resetRecipeBar();
    if (kind === 'stage')     resetStage();
    if (kind === 'stem')      resetStem();
    if (kind === 'summary')   resetSummary();
  }

  /* ---------- MACRO SUMMARY chart ---------- */
  const SUM = [
    {n:'',  name:'ResNet-50<br>+ recipe',   acc:78.8, cls:'base'},
    {n:'1', name:'Stage<br>ratio',          acc:79.4, cls:''},
    {n:'2', name:'Patchify<br>stem',        acc:79.5, cls:''},
    {n:'3', name:'Depthwise<br>+ width',    acc:80.5, cls:'hot'},
    {n:'4', name:'Inverted<br>bottleneck',  acc:80.6, cls:''},
    {n:'5', name:'7×7<br>kernel',           acc:80.6, cls:''},
  ];
  const SUM_YMIN = 78, SUM_YMAX = 81.6, SUM_H = 268;
  function sumH(acc){ return (acc - SUM_YMIN) / (SUM_YMAX - SUM_YMIN) * SUM_H; }
  function buildSummary(){
    const chart = document.getElementById('summaryChart'); if (!chart) return;
    const plot = document.createElement('div'); plot.className = 'sum-plot'; plot.style.height = SUM_H + 'px';
    const labels = document.createElement('div'); labels.className = 'sum-labels';
    SUM.forEach(d => {
      const bar = document.createElement('div'); bar.className = 'sum-bar ' + d.cls;
      bar.dataset.h = sumH(d.acc);
      bar.innerHTML = `<span class="sum-val">${d.acc.toFixed(1)}</span>`;
      plot.appendChild(bar);
      const lab = document.createElement('div'); lab.className = 'sum-label ' + d.cls;
      lab.innerHTML = (d.n ? `<span class="sum-num">${d.n}</span><br>` : '') + d.name;
      labels.appendChild(lab);
    });
    const swin = document.createElement('div'); swin.className = 'sum-swin';
    swin.style.bottom = sumH(81.3) + 'px';
    swin.textContent = 'Swin-T 81.3';
    plot.appendChild(swin);
    chart.appendChild(plot); chart.appendChild(labels);
  }
  function resetSummary(){
    document.querySelectorAll('#summaryChart .sum-bar').forEach(b => { b.style.height='0'; b.querySelector('.sum-val').style.opacity='0'; });
    const s = document.querySelector('#summaryChart .sum-swin'); if (s) s.style.opacity='0';
  }
  function runSummary(){
    resetSummary();
    const bars = [...document.querySelectorAll('#summaryChart .sum-bar')];
    bars.forEach((b,i) => timers.push(setTimeout(() => {
      b.style.height = b.dataset.h + 'px';
      timers.push(setTimeout(() => b.querySelector('.sum-val').style.opacity='1', 600));
    }, 200 + i*240)));
    timers.push(setTimeout(() => { const s = document.querySelector('#summaryChart .sum-swin'); if (s) s.style.opacity='1'; }, 250 + bars.length*240));
  }

  const STEM_IMG = 'linear-gradient(135deg,#86b0d4 0%,#cfe3f0 34%,#e7c97f 52%,#b98c53 72%,#5e4b34 100%)';

  /* ---------- MACRO ① — stage ratio bars ---------- */
  function resetStage(){ document.querySelectorAll('#ratioBars .rseg').forEach(s => s.style.width = '0'); }
  function runStage(){
    resetStage();
    document.querySelectorAll('#ratioBars .ratio-bar').forEach(bar => {
      const segs = [...bar.querySelectorAll('.rseg')];
      const total = segs.reduce((a,s) => a + (+s.dataset.n), 0);
      segs.forEach(s => timers.push(setTimeout(() => { s.style.width = (+s.dataset.n/total*100) + '%'; }, 250)));
    });
  }

  /* ---------- MACRO ② — patchify stem ---------- */
  function buildStem(){
    const grid = document.getElementById('stemPatch');
    if (grid){
      for (let r=0;r<4;r++) for (let c=0;c<4;c++){
        const t=document.createElement('div'); t.className='pg-tile';
        t.style.backgroundImage=STEM_IMG; t.style.backgroundSize='400% 400%';
        t.style.backgroundPosition=`${c/3*100}% ${r/3*100}%`;
        grid.appendChild(t);
      }
    }
    const toks = document.getElementById('stemTokens');
    if (toks){
      for (let r=0;r<4;r++) for (let c=0;c<4;c++){
        const t=document.createElement('div'); t.className='tok';
        t.style.backgroundImage=STEM_IMG; t.style.backgroundSize='400% 400%';
        t.style.backgroundPosition=`${c/3*100}% ${r/3*100}%`;
        toks.appendChild(t);
      }
    }
  }
  function resetStem(){
    document.querySelectorAll('#stemPatch .pg-tile').forEach(t => t.classList.remove('show'));
    document.querySelectorAll('#stemTokens .tok').forEach(t => t.classList.remove('show'));
  }
  function runStem(){
    resetStem();
    const tiles = [...document.querySelectorAll('#stemPatch .pg-tile')];
    tiles.forEach((t,i) => timers.push(setTimeout(() => t.classList.add('show'), 300 + i*45)));
    const toks = [...document.querySelectorAll('#stemTokens .tok')];
    toks.forEach((t,i) => timers.push(setTimeout(() => t.classList.add('show'), 1200 + i*40)));
  }

  /* ---------- RECIPE COMPARISON BAR ---------- */
  const RB_MIN = 74, RB_MAX = 82;
  function rbPct(a){ return (a - RB_MIN) / (RB_MAX - RB_MIN) * 100; }
  function resetRecipeBar(){
    document.querySelectorAll('#recipeBar .rb-bar').forEach(b => b.style.width = '0');
  }
  function runRecipeBar(){
    resetRecipeBar();
    document.querySelectorAll('#recipeBar .rb-bar').forEach((b,i) => {
      timers.push(setTimeout(() => { b.style.width = rbPct(+b.dataset.acc) + '%'; }, 250 + i*260));
    });
  }

  /* ---------- ROADMAP ---------- */
  const ROADMAP = [
    {label:'ResNet-50 · modern recipe', acc:78.8, g:'recipe'},
    {label:'stage ratio (3,3,9,3)',     acc:79.4, g:'macro'},
    {label:'“patchify” stem',           acc:79.5, g:'macro'},
    {label:'depthwise + width↑',        acc:80.5, g:'block'},
    {label:'inverted bottleneck',       acc:80.6, g:'block'},
    {label:'move up depthwise',         acc:79.9, g:'block'},
    {label:'large kernel 7×7',          acc:80.6, g:'block'},
    {label:'ReLU→GELU, fewer act.',     acc:81.3, g:'micro'},
    {label:'fewer norms, BN→LN',        acc:81.5, g:'micro'},
    {label:'separate downsampling',     acc:82.0, g:'micro'},
  ];
  const RM_MIN = 78, RM_MAX = 82.5, SWIN = 81.3;
  function pct(acc){ return (acc - RM_MIN) / (RM_MAX - RM_MIN) * 100; }

  function buildRoadmap(){
    const chart = document.getElementById('roadmapChart');
    if (!chart) return;
    ROADMAP.forEach((d,i) => {
      const row = document.createElement('div'); row.className = 'rm-row';
      row.innerHTML = `<div class="rm-label">${d.label}</div>
        <div class="rm-track">
          <div class="rm-bar g-${d.g}" data-w="${pct(d.acc)}">
            <span class="rm-val">${d.acc.toFixed(1)}</span>
          </div>
        </div>`;
      chart.appendChild(row);
    });
    // Swin reference line + axis
    const swin = document.createElement('div');
    swin.className = 'rm-swin';
    swin.style.left = `calc(185px + (100% - 185px) * ${pct(SWIN)/100})`;
    swin.innerHTML = `<span class="rm-swin-label">Swin-T 81.3</span>`;
    chart.appendChild(swin);

    const axis = document.createElement('div'); axis.className = 'rm-axis';
    [78,79,80,81,82].forEach(t => {
      const tick = document.createElement('div'); tick.className = 'rm-tick';
      tick.style.left = pct(t) + '%'; tick.textContent = t;
      axis.appendChild(tick);
    });
    chart.appendChild(axis);
  }
  function resetRoadmap(){
    document.querySelectorAll('#roadmapChart .rm-bar').forEach(b => { b.style.width='0'; b.querySelector('.rm-val').style.opacity='0'; });
    const s = document.querySelector('#roadmapChart .rm-swin'); if (s) s.style.opacity='0';
  }
  function runRoadmap(){
    resetRoadmap();
    const bars = document.querySelectorAll('#roadmapChart .rm-bar');
    bars.forEach((b,i) => {
      timers.push(setTimeout(() => {
        b.style.width = b.dataset.w + '%';
        timers.push(setTimeout(() => b.querySelector('.rm-val').style.opacity='1', 650));
      }, 200 + i*230));
    });
    timers.push(setTimeout(() => {
      const s = document.querySelector('#roadmapChart .rm-swin'); if (s) s.style.opacity='1';
    }, 200 + bars.length*230));
  }

  /* ---------- DEPTHWISE ---------- */
  const DW_CHAN_COLORS = ['#6E5C8E','#5b8fb0','#5E7C58','#c8855a','#b98c53','#8e7658'];
  function buildDepthwise(){
    const grid = document.getElementById('dwGrid');
    if (grid){
      for (let i=0;i<25;i++){ const c=document.createElement('div'); c.className='dw-cell'; grid.appendChild(c); }
      const k = document.createElement('div'); k.className='dw-kernel'; grid.appendChild(k);
    }
    const stack = document.getElementById('dwStack');
    if (stack){
      DW_CHAN_COLORS.forEach(col => { const c=document.createElement('div'); c.className='dw-ch'; c.style.background=col; stack.appendChild(c); });
    }
  }
  // kernel slides over the 5x5 grid (positions of top-left of a 3x3 window)
  const DW_POS = [0,1,2,2,1,0,0,1,2];   // column index path
  const DW_ROW = [0,0,0,1,1,1,2,2,2];
  function resetDepthwise(){
    const k = document.querySelector('#dwGrid .dw-kernel');
    if (k) k.style.transform = 'translate(0,0)';
    document.querySelectorAll('#dwStack .dw-ch').forEach(c => c.classList.remove('active'));
    const out = document.getElementById('dwOut'); if (out){ out.classList.remove('flash'); out.style.background=''; }
  }
  function runDepthwise(){
    resetDepthwise();
    // depthwise: kernel slides over space
    const k = document.querySelector('#dwGrid .dw-kernel');
    const step = 38; // cell(34)+gap(4)
    let i = 0;
    const move = () => {
      if (!k) return;
      const col = DW_POS[i % DW_POS.length], row = DW_ROW[i % DW_ROW.length];
      k.style.transform = `translate(${col*step}px, ${row*step}px)`;
      i++;
      timers.push(setTimeout(move, 700));
    };
    move();
    // pointwise: channels light up one by one, then collapse into one output value
    const stack = [...document.querySelectorAll('#dwStack .dw-ch')];
    const out = document.getElementById('dwOut');
    const cycle = () => {
      stack.forEach((c,idx) => timers.push(setTimeout(() => c.classList.add('active'), idx*170)));
      timers.push(setTimeout(() => {
        if (out){ out.classList.add('flash'); out.style.background = DW_CHAN_COLORS[(Math.floor(i)) % DW_CHAN_COLORS.length]; }
      }, stack.length*170 + 120));
      timers.push(setTimeout(() => {
        stack.forEach(c => c.classList.remove('active'));
        if (out) out.classList.remove('flash');
        cycle();
      }, stack.length*170 + 900));
    };
    cycle();
  }

  /* ---------- INVERTED BOTTLENECK ---------- */
  // both blocks drawn; the inverted middle repeatedly expands to show "widen the middle"
  function ibWidth(b){ return b.classList.contains('wide') ? '172px' : '72px'; }
  function resetInverted(slide){
    slide.querySelectorAll('.ib-bar').forEach(b => { b.style.width = ibWidth(b); });
  }
  function runInverted(slide){
    resetInverted(slide);
    const mid = slide.querySelector('.ib-bar.mid');
    if (!mid) return;
    const loop = () => {
      timers.push(setTimeout(() => { mid.style.width = '200px'; }, 400));   // expand 4×
      timers.push(setTimeout(() => { mid.style.width = '72px'; }, 2100));   // contract
      timers.push(setTimeout(loop, 3000));
    };
    loop();
  }

  /* ---------- RECEPTIVE FIELD ---------- */
  function buildReceptiveField(){
    const grid = document.getElementById('rfGrid');
    if (!grid) return;
    for (let r=0;r<9;r++) for (let c=0;c<9;c++){
      const cell=document.createElement('div'); cell.className='rf-cell';
      cell.dataset.r=r; cell.dataset.c=c; grid.appendChild(cell);
    }
  }
  function litRegion(k){
    const grid = document.getElementById('rfGrid'); if (!grid) return;
    const half = (k-1)/2, mid = 4;
    grid.querySelectorAll('.rf-cell').forEach(cell => {
      const r=+cell.dataset.r, c=+cell.dataset.c;
      cell.classList.remove('lit','center');
      if (Math.abs(r-mid)<=half && Math.abs(c-mid)<=half) cell.classList.add('lit');
      if (r===mid && c===mid) cell.classList.add('center');
    });
    const ro = document.getElementById('rfReadout'); if (ro) ro.textContent = `${k}×${k}`;
  }
  function resetKernel(){ litRegion(3); }
  function runKernel(){
    const seq = [3,5,7,7,5,3];
    let i=0;
    const step = () => {
      litRegion(seq[i % seq.length]);
      i++;
      timers.push(setTimeout(step, 1100));
    };
    step();
  }

  /* ---------- MATH slide: patchify tile grid → token sequence ---------- */
  function buildMathPatch(){
    const tg = document.getElementById('mathPatch');
    const sq = document.getElementById('mathTokens');
    if (!tg || !sq) return;
    for (let r=0;r<4;r++) for (let c=0;c<4;c++){
      const t = (r+c)/6;                                 // 0..1 diagonal
      const R = Math.round(120 + t*130), G = Math.round(150 - t*40), B = Math.round(210 - t*150);
      const col = `rgb(${R},${G},${B})`;
      const d = document.createElement('div'); d.className='mtile'; d.style.background=col; tg.appendChild(d);
      const k = document.createElement('div'); k.className='mtok'; k.style.background=col; sq.appendChild(k);
    }
  }

  /* ---------- clone agenda cards into each tracker slide ---------- */
  function buildTrackers(){
    const src = document.querySelector('[data-agenda-src]');
    if (!src) return;
    document.querySelectorAll('.agenda[data-agenda]').forEach(a => { a.innerHTML = src.innerHTML; });
  }

  /* ---------- init ---------- */
  // Build static animation structures once (after their data consts exist)
  buildRoadmap();
  buildDepthwise();
  buildReceptiveField();
  buildStem();
  buildSummary();
  buildMathPatch();
  buildTrackers();
  showSlide(0);
})();
