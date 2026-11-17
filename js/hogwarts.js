/* Second theme: Gryffindor on parchment.
   Theme switch (Sorting Hat) + map-unfold transition, text swaps, acceptance-letter
   intro, staircase progress, ambient magic (candles, owls, wand light, stag patronus),
   moving portraits, footprint map trail, owl post, house points and an original
   music-box tune. Unofficial fan theme: all art and music here are original. */
(() => {
  const root = document.documentElement;
  const isHP = () => root.dataset.theme === 'hogwarts';
  const $ = id => document.getElementById(id);
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = matchMedia('(pointer: fine)').matches;
  const ls = { get(k) { try { return localStorage.getItem(k); } catch { return null; } }, set(k, v) { try { localStorage.setItem(k, v); } catch {} } };
  const ss = { get(k) { try { return sessionStorage.getItem(k); } catch { return null; } }, set(k, v) { try { sessionStorage.setItem(k, v); } catch {} } };
  const listeners = [];
  const onTheme = fn => listeners.push(fn);

  /* ---------------- text swaps ---------------- */
  const FLOORS = [
    ['Great Hall', 'Ground floor', 'Candles float overhead. Raise your wand and look around.'],
    ['Entrance hall', 'Floor 1', 'Who I am, in one paragraph.'],
    ['The workshop', 'Floor 2', 'What I am building right now at Armatrix.'],
    ['The library', 'Floor 3', 'Every project, reported in the Workshop Gazette.'],
    ['Quidditch pitch', 'Floor 4', 'Seeker trials are open. Mind the Bludgers.'],
    ['The map room', 'Floor 5', 'Follow the footprints through my journey.'],
    ['The wand shop', 'Floor 6', 'Every tool I use, boxed and shelved.'],
    ['Restricted section', 'Floor 7', 'Code merged into other people’s spellbooks.'],
    ['Trophy room', 'Floor 8', 'Leadership and honours.'],
    ['The owlery', 'Floor 9', 'Send an owl. I answer them all.']
  ];
  const secs = [...document.querySelectorAll('main section[data-depth]')];
  function applyTexts() {
    const hp = isHP();
    document.querySelectorAll('[data-hp]').forEach(el => {
      if (el._sea == null) el._sea = el.innerHTML;
      const want = hp ? el.dataset.hp : el._sea;
      if (el.innerHTML !== want) el.innerHTML = want;
    });
    document.querySelectorAll('.depth-rule span').forEach(sp => {
      if (sp._sea == null) sp._sea = sp.textContent;
      const i = secs.indexOf(sp.closest('section'));
      sp.textContent = hp && i >= 0 ? `${FLOORS[i][1]} · ${FLOORS[i][0]}` : sp._sea;
    });
    const hint = $('torchHint');
    if (hint) {
      if (hint._sea == null) hint._sea = hint.textContent;
      hint.textContent = hp ? (fine ? 'Your cursor is a wand. Lumos: move it to reveal the hidden ink.' : 'The wand drifts on its own. Watch the hidden ink appear.') : hint._sea;
    }
    const btn = $('themeBtn'); if (btn) btn.setAttribute('aria-label', hp ? 'Switch back to the ocean theme' : 'Switch to the Gryffindor theme');
    const meta = document.querySelector('meta[name="theme-color"]'); if (meta) meta.content = hp ? '#efe2c1' : '#020812';
  }
  let vol = 26;
  document.querySelectorAll('.case').forEach(c => {
    const org = c.querySelector('.org'); vol++;
    c.dataset.issue = `Vol. ${vol} · ${org ? org.textContent.split('·').slice(0, 2).join('·').trim() : ''} · Price: one knut`;
  });

  /* ---------------- house points ---------------- */
  const ptsEl = $('housePts');
  let points = +ls.get('hp_points') || 0;
  const showPts = () => { if (ptsEl) ptsEl.querySelector('b').textContent = points; };
  showPts();
  function award(n, x, y) {
    if (!isHP()) return;
    points += n; ls.set('hp_points', points); showPts();
    if (ptsEl) { ptsEl.classList.remove('bump'); void ptsEl.offsetWidth; ptsEl.classList.add('bump'); }
    if (x != null && !reduced) { const f = document.createElement('span'); f.className = 'pts-float'; f.textContent = `+${n} Gryffindor`; f.style.left = x + 'px'; f.style.top = y + 'px'; document.body.appendChild(f); setTimeout(() => f.remove(), 1300); }
  }
  addEventListener('hp:points', e => award(e.detail.n, e.detail.x, e.detail.y));

  /* ---------------- theme switch: Sorting Hat + unfolding map ---------------- */
  const btn = $('themeBtn'), say = $('hatSay'), fold = $('mapFold');
  let busy = false;
  function setTheme(t) {
    if (t === 'hogwarts') root.dataset.theme = 'hogwarts'; else delete root.dataset.theme;
    ls.set('theme', t);
    applyTexts();
    listeners.forEach(f => f(t));
    dispatchEvent(new Event('resize'));
    dispatchEvent(new Event('scroll'));
  }
  function transition(t) {
    if (reduced || !fold) { setTheme(t); busy = false; return; }
    fold.classList.remove('closing'); fold.classList.add('open');
    setTimeout(() => {
      setTheme(t);
      fold.classList.remove('open'); fold.classList.add('closing');
      setTimeout(() => { fold.classList.remove('closing'); busy = false; }, 800);
    }, 900);
  }
  btn && btn.addEventListener('click', () => {
    if (busy) return; busy = true;
    const toHP = !isHP();
    if (toHP) {
      say.innerHTML = 'Hmm… curious… brave, certainly…';
      say.classList.add('on'); btn.classList.add('talk');
      setTimeout(() => { say.innerHTML = 'Better be… <b>GRYFFINDOR!</b>'; }, reduced ? 0 : 950);
      setTimeout(() => { btn.classList.remove('talk'); transition('hogwarts'); }, reduced ? 300 : 1700);
      setTimeout(() => say.classList.remove('on'), reduced ? 1200 : 3000);
    } else {
      say.innerHTML = 'Back to the deep, then.'; say.classList.add('on');
      setTimeout(() => transition('sea'), reduced ? 0 : 500);
      setTimeout(() => say.classList.remove('on'), 1600);
    }
  });

  /* ---------------- acceptance letter (first HP visit per session) ---------------- */
  const letter = $('letter');
  if (letter && isHP() && !ss.get('letter') && !reduced && !location.hash) {
    letter.hidden = false; root.classList.add('locked');
    let done = false;
    const close = () => { if (done) return; done = true; ss.set('letter', 1); letter.classList.add('gone'); root.classList.remove('locked'); setTimeout(() => letter.remove(), 900); };
    const open = () => { if (done || letter.classList.contains('open')) return; letter.classList.add('open'); award(10); setTimeout(close, 3600); };
    $('letterSeal').addEventListener('click', open);
    $('letterSkip').addEventListener('click', close);
    addEventListener('keydown', e => { if (e.key === 'Escape') close(); else if (e.key === 'Enter' || e.key === ' ') open(); });
  } else if (letter) letter.remove();

  /* ---------------- staircase progress + floor banners ---------------- */
  const stairs = $('stairs');
  if (stairs) {
    stairs.innerHTML = FLOORS.map((f, i) => `<div class="fl" data-i="${i}"><i class="flight"></i><i class="land"></i><b>${i ? i : 'G'}</b></div>`).join('') ;
    const nm = document.createElement('div'); nm.className = 'stairs-name'; stairs.prepend(nm);
  }
  const fls = stairs ? [...stairs.querySelectorAll('.fl')] : [];
  const zb = $('zoneBanner');
  let cur = -1, maxSeen = -1, bootT = performance.now(), zbT;
  const visited = new Set((ss.get('hp_floors') || '').split(',').filter(Boolean).map(Number));
  function floorBanner(i) {
    if (!zb || reduced) return;
    const g = document.getElementById('qgame'), r = g && g.getBoundingClientRect();
    if (r && r.top < innerHeight * .7 && r.bottom > innerHeight * .3) return;
    $('zbKick').textContent = FLOORS[i][1]; $('zbName').textContent = FLOORS[i][0]; $('zbFact').textContent = FLOORS[i][2];
    zb.classList.remove('on'); void zb.offsetWidth; zb.classList.add('on');
    clearTimeout(zbT); zbT = setTimeout(() => zb.classList.remove('on'), 2600);
  }
  function onScroll() {
    if (!isHP()) return;
    const y = scrollY + innerHeight * .4;
    let i = 0; secs.forEach((s, k) => { if (s.offsetTop <= y) i = k; });
    if (scrollY + innerHeight >= document.documentElement.scrollHeight - 4) i = secs.length - 1;
    if (i === cur) return;
    const prev = cur; cur = i;
    fls.forEach((f, k) => f.classList.toggle('on', k === i));
    if (stairs) stairs.querySelector('.stairs-name').textContent = FLOORS[i][0];
    // the staircases move when you change floors
    if (prev >= 0 && !reduced) fls.forEach((f, k) => { if ((k + i) % 3 === 0) { f.classList.add('swing'); setTimeout(() => f.classList.remove('swing'), 900); } });
    const booted = performance.now() - bootT > 1500;
    if (booted && i > maxSeen && i > 0) floorBanner(i);
    if (booted && !visited.has(i)) { visited.add(i); ss.set('hp_floors', [...visited].join(',')); if (i > 0) award(5); }
    if (!booted) visited.add(i);
    maxSeen = Math.max(maxSeen, i);
  }
  addEventListener('scroll', onScroll, { passive: true });
  onTheme(t => { cur = -1; bootT = performance.now() - 1500; maxSeen = 99; onScroll(); setTimeout(() => { maxSeen = cur; }, 50); });

  /* ---------------- ambient magic canvas ---------------- */
  const cv = $('magic'), g = cv.getContext('2d');
  let W = 0, H = 0, DPR = 1;
  const candles = [], owls = [], sparks = [];
  function fit() {
    DPR = Math.min(devicePixelRatio || 1, 1.75); W = innerWidth; H = innerHeight;
    cv.width = W * DPR; cv.height = H * DPR; g.setTransform(DPR, 0, 0, DPR, 0, 0);
    candles.length = 0;
    const n = Math.round(Math.min(18, Math.max(7, W / 85)));
    for (let i = 0; i < n; i++) {
      const edge = W < 700 ? Math.random() : (i % 2 ? .02 + Math.random() * .2 : .78 + Math.random() * .2);
      candles.push({ x: edge, y: Math.random() * 1.6, z: .55 + Math.random() * .6, ph: Math.random() * 6.28, fl: Math.random() * 6.28 });
    }
  }
  addEventListener('resize', fit); fit();
  let nextOwl = performance.now() + 4000;

  function drawCandle(c, t, sy) {
    const s = c.z, x = c.x * W + Math.sin(t * .0006 + c.ph) * 10;
    let y = ((c.y * H * 1.6 - sy * .25 * s) % (H * 1.6) + H * 1.6) % (H * 1.6) - H * .3 + Math.sin(t * .0011 + c.ph) * 8;
    const h = 34 * s, w = 7 * s;
    const fl = 1 + .12 * Math.sin(t * .02 + c.fl) + .08 * Math.sin(t * .053 + c.fl * 2);
    // halo
    const hg = g.createRadialGradient(x, y - h / 2 - 6 * s, 0, x, y - h / 2 - 6 * s, 46 * s * fl);
    hg.addColorStop(0, 'rgba(255,214,120,.38)'); hg.addColorStop(1, 'rgba(255,214,120,0)');
    g.fillStyle = hg; g.beginPath(); g.arc(x, y - h / 2 - 6 * s, 46 * s * fl, 0, 6.283); g.fill();
    // wax
    const wg = g.createLinearGradient(x - w / 2, 0, x + w / 2, 0); wg.addColorStop(0, '#d9c9a0'); wg.addColorStop(.5, '#fbf3dc'); wg.addColorStop(1, '#cbb88a');
    g.fillStyle = wg; g.beginPath(); g.roundRect(x - w / 2, y - h / 2, w, h, 2 * s); g.fill();
    g.fillStyle = '#f6ecd2'; g.beginPath(); g.ellipse(x + w * .25, y - h / 2 + 7 * s, 1.4 * s, 5 * s, 0, 0, 6.283); g.fill();
    // wick + flame
    g.strokeStyle = '#2b1a0e'; g.lineWidth = 1; g.beginPath(); g.moveTo(x, y - h / 2); g.lineTo(x, y - h / 2 - 3 * s); g.stroke();
    const fy = y - h / 2 - 3 * s, fh = 11 * s * fl, sway = Math.sin(t * .01 + c.fl) * 1.2 * s;
    const fg = g.createLinearGradient(0, fy, 0, fy - fh); fg.addColorStop(0, '#ff9a2e'); fg.addColorStop(.5, '#ffd36a'); fg.addColorStop(1, 'rgba(255,245,200,.9)');
    g.fillStyle = fg; g.beginPath(); g.moveTo(x - 3 * s, fy); g.quadraticCurveTo(x - 3.5 * s, fy - fh * .5, x + sway, fy - fh); g.quadraticCurveTo(x + 3.5 * s, fy - fh * .5, x + 3 * s, fy); g.closePath(); g.fill();
  }
  function drawOwl(o, t) {
    const flap = Math.sin(t * .018 + o.ph), s = o.s;
    g.save(); g.translate(o.x, o.y); g.scale(o.dir * s, s);
    g.fillStyle = '#6b4a2b';
    // wings
    g.beginPath(); g.moveTo(-4, -2); g.quadraticCurveTo(-18, -26 * flap - 4, -36, -14 * flap); g.quadraticCurveTo(-20, 2, -4, 6); g.fill();
    g.beginPath(); g.moveTo(4, -2); g.quadraticCurveTo(14, -24 * flap - 4, 30, -12 * flap - 2); g.quadraticCurveTo(16, 4, 4, 6); g.fill();
    // body, head, ears, face
    g.fillStyle = '#7d5634'; g.beginPath(); g.ellipse(0, 4, 10, 13, 0, 0, 6.283); g.fill();
    g.fillStyle = '#e9d6b0'; g.beginPath(); g.ellipse(1, 7, 6, 8, 0, 0, 6.283); g.fill();
    g.fillStyle = '#7d5634'; g.beginPath(); g.arc(4, -10, 8, 0, 6.283); g.fill();
    g.beginPath(); g.moveTo(-1, -16); g.lineTo(-3, -22); g.lineTo(2, -17); g.moveTo(8, -16); g.lineTo(11, -22); g.lineTo(10, -15); g.fill();
    g.fillStyle = '#f3e3c0'; g.beginPath(); g.arc(1.5, -10, 3, 0, 6.283); g.arc(7.5, -10, 3, 0, 6.283); g.fill();
    g.fillStyle = '#1f140b'; g.beginPath(); g.arc(2, -10, 1.4, 0, 6.283); g.arc(8, -10, 1.4, 0, 6.283); g.fill();
    g.fillStyle = '#d3a625'; g.beginPath(); g.moveTo(4.5, -8); g.lineTo(6.5, -8); g.lineTo(5.5, -5); g.fill();
    // letter in talons
    if (o.letter) { g.fillStyle = '#fbf2dc'; g.strokeStyle = '#8a6a50'; g.lineWidth = .8; g.save(); g.translate(2, 22); g.rotate(.15); g.fillRect(-9, -5, 18, 11); g.strokeRect(-9, -5, 18, 11); g.beginPath(); g.moveTo(-9, -5); g.lineTo(0, 1); g.lineTo(9, -5); g.stroke(); g.fillStyle = '#7f0909'; g.beginPath(); g.arc(0, 1, 2, 0, 6.283); g.fill(); g.restore(); }
    g.restore();
  }
  // stag patronus, silvery blue, procedural
  const stag = { x: -.2, ph: 0 };
  function drawStag(t, alpha) {
    const s = Math.min(1.1, W / 900), bx = stag.x * W, by = H - 70 * s;
    g.save(); g.globalAlpha = alpha; g.translate(bx, by); g.scale(s, s);
    g.shadowColor = 'rgba(120,180,255,.9)'; g.shadowBlur = 22;
    g.strokeStyle = 'rgba(170,210,255,.9)'; g.fillStyle = 'rgba(190,220,255,.55)'; g.lineWidth = 3; g.lineCap = 'round';
    const step = t * .006 + stag.ph;
    // legs
    const legs = [[-38, 0], [-30, Math.PI], [26, Math.PI], [34, 0]];
    for (const [lx, p] of legs) { const a = Math.sin(step + p) * .35; g.beginPath(); g.moveTo(lx, -40); g.lineTo(lx + Math.sin(a) * 20, -20); g.lineTo(lx + Math.sin(a) * 30 - 4, 0); g.stroke(); }
    // body
    g.beginPath(); g.ellipse(-4, -52, 48, 18, 0, 0, 6.283); g.fill(); g.stroke();
    // neck + head
    g.beginPath(); g.moveTo(32, -62); g.quadraticCurveTo(44, -86, 52, -100); g.lineTo(62, -96); g.quadraticCurveTo(52, -80, 44, -54); g.closePath(); g.fill(); g.stroke();
    g.beginPath(); g.ellipse(64, -100, 15, 7, .35, 0, 6.283); g.fill(); g.stroke();
    // tail
    g.beginPath(); g.moveTo(-50, -60); g.quadraticCurveTo(-60, -66, -58, -56); g.stroke();
    // antlers
    g.lineWidth = 2.2;
    const ant = (sx, dir) => { g.beginPath(); g.moveTo(56, -106); g.quadraticCurveTo(50 + sx, -128, 44 + sx * 1.6, -146); g.moveTo(52 + sx * .3, -122); g.lineTo(62 + sx * .2 + dir * 10, -132); g.moveTo(48 + sx * 1.1, -134); g.lineTo(40 + sx, -142 - dir * 2); g.moveTo(47 + sx * 1.3, -138); g.lineTo(58 + sx, -150); g.stroke(); };
    ant(0, 1); ant(-12, -1);
    g.restore();
    // wisps
    if (!reduced && Math.random() < .5) sparks.push({ x: bx + (Math.random() - .5) * 90 * s, y: by - Math.random() * 120 * s, vx: -.4 - Math.random() * .5, vy: -.3 - Math.random() * .4, l: 1, c: '170,210,255' });
  }
  function wand(t) {
    const T = window.DIVE && window.DIVE.torch; if (!T || !T.on) return;
    const hero = $('top'), r = hero.getBoundingClientRect(); if (r.bottom < 0) return;
    const tx = T.x, ty = T.y, hx = tx + 70, hy = ty + 96;
    g.save(); g.lineCap = 'round';
    g.strokeStyle = '#3a2312'; g.lineWidth = 6; g.beginPath(); g.moveTo(hx + 18, hy + 25); g.lineTo(hx, hy); g.stroke();
    g.strokeStyle = '#5a3b22'; g.lineWidth = 3.5; g.beginPath(); g.moveTo(hx, hy); g.lineTo(tx, ty); g.stroke();
    g.strokeStyle = '#8a6040'; g.lineWidth = 1; g.beginPath(); g.moveTo(hx - 1, hy - 2); g.lineTo(tx + 1, ty + 1); g.stroke();
    const glow = g.createRadialGradient(tx, ty, 0, tx, ty, 26); glow.addColorStop(0, 'rgba(255,255,240,1)'); glow.addColorStop(.3, 'rgba(255,236,170,.75)'); glow.addColorStop(1, 'rgba(255,220,140,0)');
    g.fillStyle = glow; g.beginPath(); g.arc(tx, ty, 26 + Math.sin(t * .01) * 3, 0, 6.283); g.fill();
    g.restore();
    if (!reduced && Math.random() < .55) sparks.push({ x: tx, y: ty, vx: (Math.random() - .5) * 1.6, vy: (Math.random() - .3) * 1.4, l: 1, c: '210,160,40' });
  }
  let last = performance.now(), contactVis = false, heroVis = true;
  new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting && !contactVis && (stag.x < 0 || stag.x > 1)) stag.x = .08; contactVis = e.isIntersecting; }), { threshold: .25 }).observe($('contact'));
  function frame(now) {
    requestAnimationFrame(frame);
    if (!isHP()) return;
    const dt = Math.min(50, now - last) / 16.67; last = now;
    g.clearRect(0, 0, W, H);
    const sy = scrollY;
    for (const c of candles) drawCandle(c, reduced ? 0 : now, sy);
    // owls
    if (!reduced && now > nextOwl && owls.length < 2) {
      const dir = Math.random() < .5 ? 1 : -1;
      owls.push({ x: dir > 0 ? -60 : W + 60, y: H * (.15 + Math.random() * .5), dir, s: .8 + Math.random() * .5, ph: Math.random() * 6, letter: Math.random() < .7, vy: (Math.random() - .5) * .4 });
      nextOwl = now + 9000 + Math.random() * 9000;
    }
    for (let i = owls.length - 1; i >= 0; i--) {
      const o = owls[i]; o.x += o.dir * 2.4 * dt; o.y += (o.vy + Math.sin(now * .003 + o.ph) * .5) * dt;
      if (o.x < -100 || o.x > W + 100) { owls.splice(i, 1); continue; }
      drawOwl(o, now);
    }
    if (contactVis) { if (!reduced) stag.x += .0011 * dt; if (stag.x > 1.25) stag.x = -.25; drawStag(now, .9); }
    wand(now);
    for (let i = sparks.length - 1; i >= 0; i--) {
      const p = sparks[i]; p.x += p.vx * dt; p.y += p.vy * dt; p.vy += .02 * dt; p.l -= .025 * dt;
      if (p.l <= 0) { sparks.splice(i, 1); continue; }
      g.fillStyle = `rgba(${p.c},${p.l})`; g.beginPath(); g.arc(p.x, p.y, 1.6 + p.l * 1.4, 0, 6.283); g.fill();
    }
  }
  requestAnimationFrame(frame);

  /* ---------------- moving portraits ---------------- */
  const LINES = {
    headmaster: ['Ah, a visitor. The Quidditch pitch is just down the stairs.', 'Do try the Lumos charm at the top of the page.', 'The wand shop is on the sixth floor. The boxes slide out if you hover.'],
    witch: ['The photographs in the Gazette move. Click the buttons beneath them.', 'That agentic pipeline mends its own cauldrons.', 'SeamFinder finds a weld seam faster than I find newt eyes.'],
    ghost: ['Follow the footprints. They know the way.', 'Every milestone on the map opens if you click it.', 'I have haunted this map since 2023.']
  };
  document.querySelectorAll('.portrait').forEach(fig => {
    const who = fig.dataset.who, c = fig.querySelector('canvas'), x = c.getContext('2d');
    const d = Math.min(devicePixelRatio || 1, 2); c.width = 130 * d; c.height = 170 * d; x.scale(d, d);
    const bub = document.createElement('div'); bub.className = 'say'; fig.appendChild(bub);
    let vis = false, k = 0, away = 0, blinkAt = 2000, clicked = false;
    new IntersectionObserver(es => { vis = es[0].isIntersecting; }).observe(fig);
    fig.addEventListener('click', e => {
      bub.textContent = LINES[who][k++ % 3]; bub.classList.add('on');
      clearTimeout(bub._t); bub._t = setTimeout(() => bub.classList.remove('on'), 4200);
      if (!clicked) { clicked = true; award(1, e.clientX, e.clientY); }
    });
    const bg = () => { const gr = x.createLinearGradient(0, 0, 0, 170); gr.addColorStop(0, '#3b2c22'); gr.addColorStop(1, '#1e1610'); x.fillStyle = gr; x.fillRect(0, 0, 130, 170);
      x.fillStyle = 'rgba(255,220,150,.08)'; x.beginPath(); x.moveTo(20, 170); x.lineTo(20, 60); x.quadraticCurveTo(65, 10, 110, 60); x.lineTo(110, 170); x.fill(); };
    function draw(t) {
      bg();
      // occasionally the sitter wanders out of frame and back
      const cyc = (t / 1000 + who.length * 7) % 40, off = cyc > 30 ? (cyc < 32 ? (cyc - 30) / 2 : cyc < 37 ? 1 : 1 - (cyc - 37) / 3) : 0;
      x.save(); x.translate(off * 150 * (who === 'witch' ? -1 : 1), 0);
      const blink = (t % 4200) < 140;
      if (who === 'headmaster') {
        x.fillStyle = '#4b2a6b'; x.beginPath(); x.moveTo(15, 170); x.quadraticCurveTo(65, 95, 115, 170); x.fill();
        x.fillStyle = '#e9c9a6'; x.beginPath(); x.ellipse(65, 82, 17, 21, 0, 0, 6.283); x.fill();
        const sw = Math.sin(t * .0015) * 3;
        x.fillStyle = '#f2efe8'; x.beginPath(); x.moveTo(49, 88); x.quadraticCurveTo(52, 140 + sw, 65 + sw, 152); x.quadraticCurveTo(78 + sw, 140, 81, 88); x.quadraticCurveTo(65, 100, 49, 88); x.fill();
        x.fillStyle = '#4b2a6b'; x.beginPath(); x.moveTo(40, 66); x.lineTo(90, 66); x.lineTo(72 + Math.sin(t * .001) * 4, 14); x.closePath(); x.fill();
        x.fillStyle = '#d3a625'; [[60, 40], [70, 52], [64, 28]].forEach(([a, b]) => { x.beginPath(); x.arc(a, b, 1.6, 0, 6.283); x.fill(); });
        x.strokeStyle = '#c9a24a'; x.lineWidth = 1.2; x.beginPath(); x.arc(58, 82, 5, 0, Math.PI); x.moveTo(77, 82); x.arc(72, 82, 5, 0, Math.PI); x.stroke();
        x.fillStyle = '#2b1a0e'; if (!blink) { x.fillRect(56, 79, 3, 2.5); x.fillRect(70, 79, 3, 2.5); } else { x.fillRect(55, 80, 5, 1); x.fillRect(69, 80, 5, 1); }
        if ((t % 6000) < 400) { x.fillStyle = 'rgba(255,255,255,.9)'; x.beginPath(); x.arc(76, 80, 1.6, 0, 6.283); x.fill(); }
      } else if (who === 'witch') {
        x.fillStyle = '#1f4a34'; x.beginPath(); x.moveTo(12, 170); x.quadraticCurveTo(62, 98, 112, 170); x.fill();
        x.fillStyle = '#ead1b4'; x.beginPath(); x.ellipse(62, 86, 15, 19, 0, 0, 6.283); x.fill();
        x.fillStyle = '#2b2b2b'; x.beginPath(); x.ellipse(62, 70, 30, 6, 0, 0, 6.283); x.fill(); x.beginPath(); x.moveTo(46, 70); x.lineTo(78, 70); x.lineTo(70, 30); x.lineTo(80, 22); x.lineTo(64, 28); x.closePath(); x.fill();
        x.fillStyle = '#2b1a0e'; if (!blink) { x.fillRect(55, 84, 3, 2.5); x.fillRect(66, 84, 3, 2.5); } else { x.fillRect(54, 85, 5, 1); x.fillRect(65, 85, 5, 1); }
        // cat on the shoulder
        x.fillStyle = '#111'; x.beginPath(); x.ellipse(92, 118, 13, 9, 0, 0, 6.283); x.fill(); x.beginPath(); x.arc(100, 106, 7, 0, 6.283); x.fill();
        x.beginPath(); x.moveTo(95, 101); x.lineTo(96, 94); x.lineTo(99, 100); x.moveTo(102, 100); x.lineTo(106, 94); x.lineTo(106, 102); x.fill();
        x.fillStyle = '#d3e640'; x.beginPath(); x.arc(98, 106, 1.3, 0, 6.283); x.arc(103, 106, 1.3, 0, 6.283); x.fill();
        x.strokeStyle = '#111'; x.lineWidth = 3; x.lineCap = 'round'; x.beginPath(); x.moveTo(80, 120); x.quadraticCurveTo(70 + Math.sin(t * .004) * 8, 140, 76 + Math.sin(t * .004 + 1) * 10, 152); x.stroke();
        // cauldron with bubbles
        x.fillStyle = '#222'; x.beginPath(); x.ellipse(40, 160, 22, 12, 0, 0, Math.PI); x.fill(); x.fillStyle = '#4caf50'; x.beginPath(); x.ellipse(40, 158, 20, 4, 0, 0, 6.283); x.fill();
        for (let i = 0; i < 3; i++) { const by = 152 - ((t * .02 + i * 9) % 26); x.strokeStyle = `rgba(140,230,140,${(by - 126) / 26})`; x.lineWidth = 1; x.beginPath(); x.arc(34 + i * 6, by, 2, 0, 6.283); x.stroke(); }
      } else {
        const fy = Math.sin(t * .0012) * 6;
        x.globalAlpha = .62 + .12 * Math.sin(t * .002);
        x.fillStyle = '#c9d6e3'; x.beginPath(); x.moveTo(30, 170); x.quadraticCurveTo(62, 90 + fy, 98, 170); x.fill();
        x.beginPath(); x.roundRect(46, 54 + fy, 34, 40, 10); x.fill();
        x.fillStyle = '#1e1610'; x.fillRect(50, 70 + fy, 26, 4);
        x.fillStyle = '#e6eef6'; x.beginPath(); x.moveTo(62, 54 + fy); x.quadraticCurveTo(70, 36 + fy, 82, 38 + fy); x.quadraticCurveTo(72, 46 + fy, 66, 56 + fy); x.fill();
        x.strokeStyle = '#e6eef6'; x.lineWidth = 3; x.beginPath(); x.moveTo(98, 150); x.lineTo(104, 100 + fy); x.stroke();
        x.globalAlpha = 1;
      }
      x.restore();
      // varnish
      const v = x.createRadialGradient(65, 70, 20, 65, 85, 110); v.addColorStop(0, 'rgba(255,230,170,.06)'); v.addColorStop(1, 'rgba(0,0,0,.45)');
      x.fillStyle = v; x.fillRect(0, 0, 130, 170);
    }
    const loop = t => { requestAnimationFrame(loop); if (vis && isHP()) draw(reduced ? 3000 : t); };
    requestAnimationFrame(loop);
  });

  /* ---------------- map trail: footprints walk the journey ---------------- */
  const term = document.querySelector('#journey .term');
  if (term) {
    const tc = document.createElement('canvas'); tc.className = 'trail hp-only'; term.appendChild(tc);
    const tg = tc.getContext('2d'); let tv = false;
    new IntersectionObserver(es => { tv = es[0].isIntersecting; }).observe(term);
    const foot = (x, y, ang, left, a) => {
      tg.save(); tg.translate(x, y); tg.rotate(ang + Math.PI / 2); tg.translate(left ? -4 : 4, 0);
      tg.fillStyle = `rgba(74,44,18,${a})`;
      tg.beginPath(); tg.ellipse(0, 2, 2.6, 4.2, 0, 0, 6.283); tg.fill();
      tg.beginPath(); tg.ellipse(0, -4.5, 2, 2.4, 0, 0, 6.283); tg.fill();
      tg.restore();
    };
    const loop = t => {
      requestAnimationFrame(loop);
      if (!tv || !isHP()) return;
      const r = term.getBoundingClientRect(), d = Math.min(devicePixelRatio || 1, 2);
      if (tc.width !== Math.round(r.width * d) || tc.height !== Math.round(r.height * d)) { tc.width = r.width * d; tc.height = r.height * d; tc.style.width = r.width + 'px'; tc.style.height = r.height + 'px'; }
      tg.setTransform(d, 0, 0, d, 0, 0); tg.clearRect(0, 0, r.width, r.height);
      const pts = [...term.querySelectorAll('.commit:not(.dim) .nd')].map(n => { const b = n.getBoundingClientRect(); return [b.left - r.left + b.width / 2, b.top - r.top + b.height / 2]; });
      if (pts.length < 2) return;
      const segs = []; let L = 0;
      for (let i = 1; i < pts.length; i++) { const l = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); segs.push(l); L += l; }
      const p = Math.max(0, Math.min(1, (innerHeight * .7 - r.top) / r.height));
      const head = p * L, stride = 13;
      let walked = 0, n = 0, hx = pts[0][0], hy = pts[0][1], ha = Math.PI / 2;
      for (let i = 0; i < segs.length; i++) {
        const [ax, ay] = pts[i], [bx, by] = pts[i + 1], ang = Math.atan2(by - ay, bx - ax);
        for (let s = (stride - (walked % stride)) % stride; s < segs[i]; s += stride) {
          const at = walked + s; if (at > head) break;
          const fx = ax + (bx - ax) * s / segs[i], fy = ay + (by - ay) * s / segs[i];
          const age = (head - at) / 260; foot(fx, fy, ang, n++ % 2 === 0, Math.max(.1, .8 - age));
          hx = fx; hy = fy; ha = ang;
        }
        walked += segs[i]; if (walked > head) break;
      }
      // name tag following the newest footprint
      tg.font = "italic 13px 'IM Fell English', serif";
      const label = 'Suyash Kumar', w = tg.measureText(label).width + 14, lx = hx + 14, ly = hy - 10;
      tg.fillStyle = 'rgba(251,242,220,.95)'; tg.strokeStyle = 'rgba(74,44,18,.7)'; tg.lineWidth = 1;
      tg.beginPath(); tg.roundRect(lx, ly, w, 20, 3); tg.fill(); tg.stroke();
      tg.fillStyle = '#4a2c12'; tg.fillText(label, lx + 7, ly + 14);
    };
    requestAnimationFrame(loop);
  }

  /* ---------------- owl post ---------------- */
  const op = $('owlPost');
  if (op) {
    $('opOwl').innerHTML = '<svg viewBox="0 0 90 70" width="90" height="70"><g fill="#6b4a2b"><path d="M40 30 Q20 0 0 18 Q18 30 40 40z"/><path d="M50 30 Q70 0 90 18 Q72 30 50 40z"/></g><ellipse cx="45" cy="40" rx="11" ry="14" fill="#7d5634"/><ellipse cx="45" cy="43" rx="6" ry="8" fill="#e9d6b0"/><circle cx="45" cy="26" r="9" fill="#7d5634"/><circle cx="41" cy="26" r="3" fill="#f3e3c0"/><circle cx="49" cy="26" r="3" fill="#f3e3c0"/><circle cx="41" cy="26" r="1.4" fill="#1f140b"/><circle cx="49" cy="26" r="1.4" fill="#1f140b"/><path d="M44 29h2l-1 3z" fill="#d3a625"/><rect x="37" y="54" width="16" height="10" fill="#fbf2dc" stroke="#8a6a50"/><circle cx="45" cy="59" r="2" fill="#7f0909"/></svg>';
    const err = $('opErr');
    [$('opName'), $('opMsg')].forEach(i => i.addEventListener('input', () => { err.textContent = ''; }));
    op.addEventListener('submit', e => {
      e.preventDefault();
      const name = $('opName').value.trim(), msg = $('opMsg').value.trim();
      if (!name) { err.textContent = 'Add your name so I know who sent the owl.'; $('opName').focus(); return; }
      if (msg.length < 5) { err.textContent = 'Write a few words for the owl to carry.'; $('opMsg').focus(); return; }
      op.classList.add('sent');
      const r = op.getBoundingClientRect(); award(20, r.left + r.width / 2, r.top);
      const url = `mailto:k.suyashc@gmail.com?subject=${encodeURIComponent('An owl from ' + name)}&body=${encodeURIComponent(msg + '\n\n— ' + name)}`;
      setTimeout(() => {
        location.href = url;
        const m = document.createElement('p'); m.className = 'op-sent-msg'; m.textContent = 'Your owl is on its way. If your email app did not open, write to k.suyashc@gmail.com.';
        op.after(m);
      }, reduced ? 200 : 1700);
    });
  }

  /* ---------------- music box (original tune, Web Audio) ---------------- */
  const sb = $('soundBtn');
  let actx = null, master = null, timer = null, nextT = 0, idx = 0, playing = false;
  // An original waltz in D minor, 3/4 at 100 bpm. [midi, beats]
  const MEL = [[74,1],[77,1],[81,1],[79,1.5],[77,.5],[76,1],[77,1],[74,1],[69,1],[70,2],[69,1],[67,1],[70,1],[74,1],[73,1.5],[76,.5],[79,1],[77,1],[76,1],[73,1],[74,3],
               [81,1],[79,.5],[77,.5],[76,1],[77,1],[74,2],[82,1],[81,.5],[79,.5],[77,1],[76,3],[74,1],[76,1],[77,1],[79,1],[81,1],[82,1],[81,1.5],[79,.5],[76,1],[74,3]];
  const BASS = [50,46,50,43,43,45,45,50,50,50,43,45,50,43,45,50];
  const CH = { 50: [62,65,69], 46: [62,65,70], 43: [62,67,70], 45: [61,64,67] };
  const hz = m => 440 * Math.pow(2, (m - 69) / 12);
  const BEAT = .6;
  function bell(f, t, v, dur) {
    const o = actx.createOscillator(), o2 = actx.createOscillator(), gn = actx.createGain(), g2 = actx.createGain();
    o.type = 'sine'; o.frequency.value = f; o2.type = 'sine'; o2.frequency.value = f * 4.01;
    gn.gain.setValueAtTime(0, t); gn.gain.linearRampToValueAtTime(v, t + .005); gn.gain.exponentialRampToValueAtTime(.0001, t + dur);
    g2.gain.setValueAtTime(v * .25, t); g2.gain.exponentialRampToValueAtTime(.0001, t + .25);
    o.connect(gn); o2.connect(g2); gn.connect(master); g2.connect(master);
    o.start(t); o2.start(t); o.stop(t + dur + .05); o2.stop(t + .3);
  }
  // schedule by absolute beat so melody and bass stay locked
  let beat0 = 0, melBeat = 0, bar = 0;
  function schedule() {
    const ahead = actx.currentTime + .25;
    while (nextT < ahead) {
      const [m, len] = MEL[idx];
      bell(hz(m), nextT, .22, 1.6);
      melBeat += len; nextT = beat0 + melBeat * BEAT; idx++;
      if (idx >= MEL.length) { idx = 0; beat0 += melBeat * BEAT; melBeat = 0; nextT = beat0; }
    }
    while (barT < ahead) {
      const b = BASS[bar % 16], c = CH[b];
      bell(hz(b), barT, .16, 2); bell(hz(c[0]), barT + BEAT, .06, 1); bell(hz(c[1]), barT + BEAT * 2, .06, 1);
      bar++; barT += BEAT * 3;
    }
  }
  let barT = 0;
  function startMusic() {
    if (!actx) {
      actx = new (window.AudioContext || window.webkitAudioContext)();
      master = actx.createGain(); master.gain.value = 0;
      const verb = actx.createConvolver(), len = actx.sampleRate * 2.4, buf = actx.createBuffer(2, len, actx.sampleRate);
      for (let ch = 0; ch < 2; ch++) { const d = buf.getChannelData(ch); for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.6); }
      verb.buffer = buf; const wet = actx.createGain(); wet.gain.value = .35;
      master.connect(actx.destination); master.connect(verb); verb.connect(wet); wet.connect(actx.destination);
    }
    actx.resume();
    beat0 = nextT = barT = actx.currentTime + .1; idx = 0; melBeat = 0; bar = 0;
    master.gain.cancelScheduledValues(actx.currentTime); master.gain.setTargetAtTime(.3, actx.currentTime, .4);
    clearInterval(timer); timer = setInterval(schedule, 60); playing = true;
  }
  function stopMusic() {
    playing = false; clearInterval(timer);
    if (actx) { master.gain.setTargetAtTime(0, actx.currentTime, .15); setTimeout(() => { if (!playing) actx.suspend(); }, 700); }
  }
  function setSound(on) { sb && sb.setAttribute('aria-pressed', on); sb && sb.setAttribute('aria-label', on ? 'Mute music' : 'Play music'); ls.set('hp_music', on ? 1 : 0); on ? startMusic() : stopMusic(); }
  sb && sb.addEventListener('click', () => setSound(sb.getAttribute('aria-pressed') !== 'true'));
  onTheme(t => { if (t !== 'hogwarts' && playing) { stopMusic(); sb.setAttribute('aria-pressed', 'false'); } });
  // remembered "on": browsers need a gesture first, so resume on the first tap
  if (ls.get('hp_music') === '1') addEventListener('pointerdown', function once(e) { if (isHP() && !playing && !e.target.closest('#soundBtn')) setSound(true); removeEventListener('pointerdown', once); }, { once: true });

  applyTexts();
  onScroll();
  window.HP = { setTheme, award, get points() { return points; } };
})();
