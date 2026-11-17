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
  const FX = { flare: 0, patronus: null, snitch: null, px: -999, py: -999 };   // spell effects drawn on this canvas
  addEventListener('pointermove', e => { FX.px = e.clientX; FX.py = e.clientY; }, { passive: true });
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
    const fl = (1 + .12 * Math.sin(t * .02 + c.fl) + .08 * Math.sin(t * .053 + c.fl * 2)) * (1 + FX.flare * 1.4);
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
  function drawStag(t, alpha, bx, by, s, gallop = 1) {
    g.save(); g.globalAlpha = alpha; g.translate(bx, by); g.scale(s, s);
    g.shadowColor = 'rgba(120,180,255,.9)'; g.shadowBlur = 22;
    g.strokeStyle = 'rgba(170,210,255,.9)'; g.fillStyle = 'rgba(190,220,255,.55)'; g.lineWidth = 3; g.lineCap = 'round';
    const step = t * .006 * gallop + stag.ph;
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
    if (contactVis && !FX.patronus) { if (!reduced) stag.x += .0011 * dt; if (stag.x > 1.25) stag.x = -.25; const ss = Math.min(1.1, W / 900); drawStag(now, .9, stag.x * W, H - 70 * ss, ss); }
    // Expecto patronum: a big stag gallops across the screen
    if (FX.patronus) {
      const P = FX.patronus; P.x += P.v * dt;
      const ss = Math.min(2.2, W / 520);
      drawStag(now, Math.min(1, (W + 300 - P.x) / 300, (P.x + 300) / 300), P.x, H * .62 + Math.sin(now * .012) * 10, ss, 2.6);
      for (let k = 0; k < 3; k++) sparks.push({ x: P.x - 60 * ss + Math.random() * 120 * ss, y: H * .62 - Math.random() * 150 * ss, vx: -1.5 - Math.random() * 2, vy: -.5 + Math.random(), l: 1, c: '170,210,255' });
      if (P.x > W + 320) FX.patronus = null;
    }
    // Incendio: candles flare, embers rise
    if (FX.flare > 0) { FX.flare = Math.max(0, FX.flare - .004 * dt); if (Math.random() < FX.flare) sparks.push({ x: Math.random() * W, y: H + 5, vx: (Math.random() - .5) * .6, vy: -2 - Math.random() * 2, l: 1.4, c: '255,140,40' }); }
    // the Golden Snitch, flitting around the page
    if (FX.snitch) {
      const sn = FX.snitch; sn.age += dt / 60; sn.wing += dt * .9;
      const dx = sn.x - FX.px, dy = sn.y - FX.py, d = Math.hypot(dx, dy) || 1;
      if (sn.summoned && sn.age < 1.6) { sn.vx += (FX.px - sn.x) * .004 * dt; sn.vy += (FX.py - sn.y) * .004 * dt; }
      else if (d < 160) { sn.vx += dx / d * .7 * dt; sn.vy += dy / d * .7 * dt; }
      if (Math.random() < .04 * dt) { const a = Math.random() * 6.283; sn.vx += Math.cos(a) * 3; sn.vy += Math.sin(a) * 3; }
      if (sn.x < 30) sn.vx += .4 * dt; if (sn.x > W - 30) sn.vx -= .4 * dt; if (sn.y < 80) sn.vy += .4 * dt; if (sn.y > H - 30) sn.vy -= .4 * dt;
      const sp = Math.hypot(sn.vx, sn.vy), cap = 6.5; if (sp > cap) { sn.vx *= cap / sp; sn.vy *= cap / sp; }
      sn.vx *= .985; sn.vy *= .985; sn.x += sn.vx * dt; sn.y += sn.vy * dt;
      const f = Math.sin(sn.wing) * .9;
      const gl = g.createRadialGradient(sn.x, sn.y, 0, sn.x, sn.y, 26); gl.addColorStop(0, 'rgba(255,225,110,.6)'); gl.addColorStop(1, 'rgba(255,225,110,0)');
      g.fillStyle = gl; g.beginPath(); g.arc(sn.x, sn.y, 26, 0, 6.283); g.fill();
      g.fillStyle = 'rgba(250,250,255,.92)'; g.strokeStyle = 'rgba(150,150,160,.8)'; g.lineWidth = .8;
      [-1, 1].forEach(sd => { g.beginPath(); g.moveTo(sn.x + sd * 4, sn.y - 2); g.quadraticCurveTo(sn.x + sd * 16, sn.y - 13 * f - 5, sn.x + sd * 24, sn.y - 5 * f); g.quadraticCurveTo(sn.x + sd * 14, sn.y + 2, sn.x + sd * 4, sn.y + 2); g.fill(); g.stroke(); });
      const g2 = g.createRadialGradient(sn.x - 2, sn.y - 2, 1, sn.x, sn.y, 6); g2.addColorStop(0, '#fff3b0'); g2.addColorStop(1, '#c79a1a');
      g.fillStyle = g2; g.beginPath(); g.arc(sn.x, sn.y, 6, 0, 6.283); g.fill();
      if (Math.random() < .5) sparks.push({ x: sn.x, y: sn.y, vx: (Math.random() - .5) * .5, vy: (Math.random() - .5) * .5, l: .8, c: '230,180,40' });
      if (sn.age > sn.ttl) FX.snitch = null;
    }
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

  const mk = (tag, cls, txt) => { const e = document.createElement(tag); if (cls) e.className = cls; if (txt != null) e.textContent = txt; return e; };
  const seen = (el, fn, th = .2) => new IntersectionObserver((es, o) => es.forEach(e => { if (e.isIntersecting) fn(o); }), { threshold: th }).observe(el);

  /* ---------------- the library: projects as books on a shelf ---------------- */
  const workIdx = $('workIndex');
  if (workIdx) {
    const shelf = mk('div', 'bookshelf hp-only');
    const COL = ['#7f0909', '#1f4a34', '#23325e', '#6b4426', '#8a6a1a', '#4b2a6b', '#3a2a22'];
    [...workIdx.querySelectorAll('a')].forEach((a, i) => {
      const b = mk('a', 'book'); b.href = a.getAttribute('href');
      b.style.setProperty('--bc', COL[i % COL.length]); b.style.setProperty('--bh', (84 + (i * 37) % 16) + '%'); b.style.setProperty('--i', i);
      b.append(mk('span', 'bk-n', String(i + 1).padStart(2, '0')), mk('span', 'bk-t', a.querySelector('.ix-t').textContent), mk('span', 'bk-y', a.querySelector('.ix-y').textContent), mk('span', 'bk-tip', a.querySelector('.ix-m').textContent));
      shelf.appendChild(b);
    });
    workIdx.after(shelf);
    seen(shelf, o => { shelf.classList.add('in'); o.disconnect(); });
  }

  /* ---------------- the map: footprints along a winding path of milestones ---------------- */
  const mapEl = $('hpMap'), D = window.SITE;
  const notes = [];
  if (mapEl && D) {
    const C = [...D.commits].reverse();                       // oldest first: the walk goes forward in time
    const HOUSE = { main: ['#7f0909', 'Milestones'], robotics: ['#1d4e89', 'Robotics'], ai: ['#5b3a8a', 'Industry AI'], research: ['#2f6b2a', 'Research'], oss: ['#a0520a', 'Open source'] };
    const legend = mk('div', 'mp-legend');
    const keys = Object.keys(HOUSE);
    const lbtn = keys.map(k => { const b = mk('button', 'mp-chip'); b.type = 'button'; b.style.setProperty('--c', HOUSE[k][0]); b.setAttribute('aria-pressed', 'false'); b.append(mk('i'), document.createTextNode(HOUSE[k][1])); b.dataset.b = k; legend.appendChild(b); return b; });
    const title = mk('p', 'mp-title', 'The Map of Suyash Kumar');
    const sub = mk('p', 'mp-sub', 'Scroll to walk the path. Tap a seal to read the entry.');
    const field = mk('div', 'mp-field');
    const svgNS = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(svgNS, 'svg'); svg.setAttribute('class', 'mp-svg');
    const path = document.createElementNS(svgNS, 'path'); svg.appendChild(path);
    const steps = mk('canvas', 'mp-steps');
    field.append(svg, steps);
    const nodes = C.map((c, i) => {
      const n = mk('div', 'mp-node'); n.dataset.b = c.b; n.style.setProperty('--c', HOUSE[c.b] ? HOUSE[c.b][0] : '#7f0909');
      const seal = mk('button', 'mp-seal'); seal.type = 'button'; seal.setAttribute('aria-expanded', 'false'); seal.setAttribute('aria-label', c.msg);
      seal.textContent = (c.b === 'main' ? '✦' : c.b === 'robotics' ? '⚓' : c.b === 'ai' ? '✧' : c.b === 'research' ? '⚗' : '✎');
      const lbl = mk('div', 'mp-lbl');
      lbl.append(mk('i', null, c.date), mk('b', null, c.msg));
      const note = mk('div', 'mp-note');
      const ul = mk('ul'); (c.diff || []).forEach(d => ul.appendChild(mk('li', null, d))); note.appendChild(ul);
      if (c.link) { const a = mk('a', null, c.link.startsWith('#') ? 'Read more ↓' : 'See the pull request ↗'); a.href = c.link; if (!c.link.startsWith('#')) { a.target = '_blank'; a.rel = 'noopener'; } note.appendChild(a); }
      lbl.appendChild(note);
      const toggle = () => { const o = n.classList.toggle('open'); seal.setAttribute('aria-expanded', o); requestAnimationFrame(layout); };
      seal.addEventListener('click', toggle); lbl.querySelector('b').addEventListener('click', toggle);
      n.append(seal, lbl); field.appendChild(n); notes.push(n);
      return n;
    });
    // year markers
    let lastYear = '';
    const years = [];
    C.forEach((c, i) => { const y = (c.date.match(/20\d\d/) || [c.date])[0]; if (y !== lastYear) { lastYear = y; const yb = mk('div', 'mp-year', /^20/.test(y) ? 'Year of ' + y : y); field.appendChild(yb); years.push([yb, i]); } });
    mapEl.append(title, sub, legend, field);
    lbtn.forEach(b => b.addEventListener('click', () => {
      const on = b.getAttribute('aria-pressed') !== 'true';
      lbtn.forEach(x => x.setAttribute('aria-pressed', on && x === b));
      nodes.forEach(n => n.classList.toggle('dim', on && n.dataset.b !== b.dataset.b));
    }));

    let pts = [], samples = [], nodeLen = [], total = 1;
    function layout() {
      if (!isHP() || !mapEl.offsetWidth) return;
      const w = field.clientWidth, wide = w > 700;
      let y = 60; pts = [];
      const yStart = new Set(years.map(v => v[1]));
      nodes.forEach((n, i) => {
        if (i && yStart.has(i)) y += 36;
        const x = wide ? w / 2 + Math.sin(i * 1.15 + .4) * w * .26 : 30;
        n.style.left = x + 'px'; n.style.top = y + 'px';
        n.classList.toggle('right', !wide || x < w / 2);
        pts.push([x, y]);
        const lb = n.querySelector('.mp-lbl'), nt = n.querySelector('.mp-note');
        y += Math.max(wide ? 96 : 86, lb.offsetHeight - nt.offsetHeight + (n.classList.contains('open') ? nt.scrollHeight : 0) + 28);
      });
      years.forEach(([yb, i]) => { yb.style.top = (pts[i][1] - 52) + 'px'; yb.style.left = wide ? (pts[i][0] < w / 2 ? pts[i][0] + 40 : pts[i][0] - 40 - yb.offsetWidth) + 'px' : '64px'; });
      const H = y + 10;
      field.style.height = H + 'px';
      svg.setAttribute('viewBox', `0 0 ${w} ${H}`); svg.setAttribute('width', w); svg.setAttribute('height', H);
      // smooth curve through the milestones (Catmull-Rom → Bézier)
      let d = `M${pts[0][0]},${pts[0][1]}`;
      for (let i = 0; i < pts.length - 1; i++) {
        const p0 = pts[i - 1] || pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] || p2;
        d += ` C${p1[0] + (p2[0] - p0[0]) / 6},${p1[1] + (p2[1] - p0[1]) / 6} ${p2[0] - (p3[0] - p1[0]) / 6},${p2[1] - (p3[1] - p1[1]) / 6} ${p2[0]},${p2[1]}`;
      }
      path.setAttribute('d', d);
      total = path.getTotalLength(); samples = [];
      for (let l = 0; l <= total; l += 6) { const p = path.getPointAtLength(l); samples.push([p.x, p.y, l]); }
      nodeLen = pts.map(([x, yy]) => { let best = 0, bd = 1e9; for (const s of samples) { const q = (s[0] - x) ** 2 + (s[1] - yy) ** 2; if (q < bd) { bd = q; best = s[2]; } } return best; });
      const dpr = Math.min(devicePixelRatio || 1, 2); steps.width = w * dpr; steps.height = H * dpr; steps.style.width = w + 'px'; steps.style.height = H + 'px';
    }
    addEventListener('resize', layout); onTheme(() => setTimeout(layout, 50));
    if (document.fonts) document.fonts.ready.then(layout);
    layout();
    // footprints walk as you scroll; the newest carries a name tag
    const sg = steps.getContext('2d'); let vis = false;
    seen(mapEl, () => { vis = true; }, 0);
    new IntersectionObserver(es => { vis = es[0].isIntersecting; }).observe(mapEl);
    const foot = (x, y, ang, left, a) => {
      sg.save(); sg.translate(x, y); sg.rotate(ang + Math.PI / 2); sg.translate(left ? -5 : 5, 0); sg.fillStyle = `rgba(74,44,18,${a})`;
      sg.beginPath(); sg.ellipse(0, 2, 3, 5, 0, 0, 6.283); sg.fill(); sg.beginPath(); sg.ellipse(0, -5.5, 2.4, 2.8, 0, 0, 6.283); sg.fill(); sg.restore();
    };
    const walk = () => {
      requestAnimationFrame(walk);
      if (!vis || !isHP() || !samples.length) return;
      const r = field.getBoundingClientRect(), dpr = steps.width / r.width;
      const p = Math.max(0, Math.min(1, (innerHeight * .62 - r.top) / r.height)), head = p * total;
      sg.setTransform(dpr, 0, 0, dpr, 0, 0); sg.clearRect(0, 0, r.width, r.height);
      let n = 0, hx = samples[0][0], hy = samples[0][1];
      for (let k = 1; k < samples.length - 1 && samples[k][2] < head; k += 3) {   // samples are 6 px apart → a step every 18 px
        const [x0, y0, l] = samples[k], [x1, y1] = samples[k + 1];
        foot(x0, y0, Math.atan2(y1 - y0, x1 - x0), n++ % 2 === 0, Math.max(.12, .85 - (head - l) / 900));
        hx = x0; hy = y0;
      }
      nodes.forEach((nd, i) => nd.classList.toggle('reached', nodeLen[i] <= head + 4));
      sg.font = "italic 14px 'IM Fell English', serif";
      const label = 'Suyash Kumar', tw = sg.measureText(label).width + 16, lx = Math.min(r.width - tw - 4, hx + 14), ly = hy - 30;
      sg.fillStyle = 'rgba(251,242,220,.96)'; sg.strokeStyle = 'rgba(74,44,18,.75)'; sg.lineWidth = 1;
      sg.beginPath(); sg.roundRect(lx, ly, tw, 22, 3); sg.fill(); sg.stroke();
      sg.fillStyle = '#4a2c12'; sg.fillText(label, lx + 8, ly + 15);
    };
    requestAnimationFrame(walk);
  }

  /* ---------------- the wand shop: letters fly out of the cabinet into their slots ---------------- */
  const pt = $('ptable'), pwrap = document.querySelector('.ptable-wrap');
  let summoned = false;
  function summon() {
    if (!pt || !isHP()) return;
    const tiles = [...pt.querySelectorAll('.el')];
    tiles.forEach(t => { if (!t.querySelector('.envl')) { const e = mk('span', 'envl hp-only'); e.setAttribute('aria-hidden', 'true'); t.appendChild(e); } });
    if (reduced) return;
    pt.getAnimations({ subtree: true }).forEach(a => a.cancel());
    pwrap.classList.add('side'); void pwrap.offsetWidth;
    requestAnimationFrame(() => requestAnimationFrame(() => pwrap.classList.remove('side')));
    const wr = pt.getBoundingClientRect(), cx = wr.left + wr.width * .5, cy = wr.top + wr.height * .55;
    tiles.forEach((el, i) => {
      const r = el.getBoundingClientRect(), dx = cx - (r.left + r.width / 2), dy = cy - (r.top + r.height / 2), rz = (Math.random() - .5) * 70;
      el.animate([
        { transform: `translate3d(${dx}px, ${dy}px, -700px) rotateY(180deg) rotateZ(${rz}deg) scale(.5)` },   // starts inside the cabinet, behind the board (no opacity: that would flatten the 3-D flip)
        { transform: `translate3d(${dx * .35 + (Math.random() - .5) * 120}px, ${dy * .35 - 170}px, 280px) rotateY(205deg) rotateZ(${-rz}deg) scale(1.2)`, offset: .55 },
        { transform: 'translate3d(0, -10px, 60px) rotateY(150deg) scale(1.05)', offset: .82 },
        { transform: 'translateZ(3px)' }
      ], { duration: 1500, delay: 250 + i * 32, easing: 'cubic-bezier(.3,.55,.25,1)', fill: 'backwards' });
    });
  }
  if (pt) {
    seen(pt, () => { if (isHP() && !summoned) { summoned = true; summon(); } }, .15);
    onTheme(t => { summoned = false; if (t === 'hogwarts') { const r = pt.getBoundingClientRect(); if (r.top < innerHeight && r.bottom > 0) { summoned = true; setTimeout(summon, 300); } } });
    const ab = $('accioLetters'); ab && ab.addEventListener('click', summon);
  }

  /* ---------------- spells: type them anywhere, or use the spellbook ---------------- */
  const SPELLS = [
    ['lumos', 'Lumos', 'Light up the castle'],
    ['nox', 'Nox', 'Lights out. Your wand still glows.'],
    ['wingardiumleviosa', 'Wingardium Leviosa', 'Make the page float'],
    ['expectopatronum', 'Expecto Patronum', 'Send a stag galloping across'],
    ['accio', 'Accio Snitch', 'Summon the Golden Snitch, then catch it'],
    ['alohomora', 'Alohomora', 'Unlock every door and diary entry'],
    ['incendio', 'Incendio', 'Make the candles roar'],
    ['finite', 'Finite', 'End all spells']
  ];
  const castEl = $('spellCast');
  const castSeen = new Set(JSON.parse(ls.get('hp_spells') || '[]'));
  let levT;
  function burstAt(x, y, c = '211,166,37', n = 26) { for (let i = 0; i < n; i++) { const a = Math.random() * 6.283, v = 1 + Math.random() * 4; sparks.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, l: 1.2, c }); } }
  function announce(text) { if (!castEl) return; castEl.textContent = text; castEl.classList.remove('on'); void castEl.offsetWidth; castEl.classList.add('on'); }
  function cast(id, x = innerWidth / 2, y = innerHeight / 2) {
    if (!isHP()) return;
    const sp = SPELLS.find(s => s[0] === id); if (!sp) return;
    announce(sp[1] + '!'); burstAt(x, y);
    if (!castSeen.has(id)) { castSeen.add(id); ls.set('hp_spells', JSON.stringify([...castSeen])); award(5, x, y - 20); }
    if (id === 'lumos') { root.classList.remove('hp-night'); FX.flare = .7; }
    if (id === 'nox') root.classList.add('hp-night');
    if (id === 'wingardiumleviosa') { document.body.classList.add('levitate'); clearTimeout(levT); levT = setTimeout(() => document.body.classList.remove('levitate'), 9000); }
    if (id === 'expectopatronum') FX.patronus = { x: -300, v: reduced ? 40 : 7 };
    if (id === 'accio') FX.snitch = { x: -30, y: innerHeight * .35, vx: 7, vy: 0, age: 0, ttl: 18, wing: 0, summoned: true };
    if (id === 'alohomora') { notes.forEach(n => { n.classList.add('open'); n.querySelector('.mp-seal').setAttribute('aria-expanded', 'true'); }); $('oss') && $('oss').classList.add('unlocked'); dispatchEvent(new Event('resize')); }
    if (id === 'incendio') FX.flare = 1;
    if (id === 'finite') { root.classList.remove('hp-night'); document.body.classList.remove('levitate'); FX.patronus = null; FX.flare = 0; $('oss') && $('oss').classList.remove('unlocked'); }
  }
  // typed spells
  let buf = '';
  addEventListener('keydown', e => {
    if (!isHP() || e.metaKey || e.ctrlKey || e.altKey || (e.target.closest && e.target.closest('input, textarea, select, [contenteditable]'))) return;
    if (document.getElementById('qgame')?.classList.contains('playing')) return;
    if (!/^[a-z]$/i.test(e.key)) return;
    buf = (buf + e.key.toLowerCase()).slice(-24);
    const hit = SPELLS.find(s => buf.endsWith(s[0]));
    if (hit) { buf = ''; cast(hit[0], FX.px > 0 ? FX.px : innerWidth / 2, FX.py > 0 ? FX.py : innerHeight / 2); }
  });
  // the spellbook
  const sbBtn = $('sbBtn'), sbPanel = $('sbPanel'), sbList = $('sbList');
  if (sbBtn) {
    SPELLS.forEach(([id, name, what]) => {
      const li = mk('li'), b = mk('button', 'sb-spell'); b.type = 'button';
      b.append(mk('b', null, name), mk('span', null, what));
      b.addEventListener('click', e => { const r = b.getBoundingClientRect(); cast(id, r.left + r.width / 2, r.top); if (!fine) setOpen(false); });
      li.appendChild(b); sbList.appendChild(li);
    });
    const setOpen = o => { sbPanel.hidden = !o; sbBtn.setAttribute('aria-expanded', o); };
    sbBtn.addEventListener('click', () => setOpen(sbPanel.hidden));
    addEventListener('pointerdown', e => { if (!sbPanel.hidden && !e.target.closest('#spellbook')) setOpen(false); });
    addEventListener('keydown', e => { if (e.key === 'Escape') setOpen(false); });
  }
  // wand light in the dark (Nox): follows the pointer or the hero wand
  const night = $('night');
  const moveLight = (x, y) => { if (night) { night.style.setProperty('--wx', x + 'px'); night.style.setProperty('--wy', y + 'px'); } };
  addEventListener('pointermove', e => moveLight(e.clientX, e.clientY), { passive: true });
  addEventListener('pointerdown', e => moveLight(e.clientX, e.clientY), { passive: true });
  // catching the Snitch
  addEventListener('pointerdown', e => {
    const sn = FX.snitch; if (!sn || !isHP()) return;
    if (Math.hypot(e.clientX - sn.x, e.clientY - sn.y) < (fine ? 30 : 44)) {
      FX.snitch = null; burstAt(e.clientX, e.clientY, '255,215,90', 40); announce('Snitch caught!'); award(150, e.clientX, e.clientY - 20);
    }
  }, true);
  // the Snitch also turns up on its own now and then
  let nextSnitch = performance.now() + 35000 + Math.random() * 20000;
  setInterval(() => {
    if (!isHP() || FX.snitch || document.hidden || reduced) return;
    if (performance.now() > nextSnitch) { FX.snitch = { x: innerWidth + 30, y: innerHeight * (.25 + Math.random() * .4), vx: -5, vy: 0, age: 0, ttl: 14, wing: 0 }; nextSnitch = performance.now() + 75000 + Math.random() * 60000; }
  }, 1000);
  onTheme(t => { if (t !== 'hogwarts') { root.classList.remove('hp-night'); document.body.classList.remove('levitate'); FX.snitch = null; FX.patronus = null; } });
  // the restricted section: hovering a chained book (or Alohomora) unlocks it
  document.querySelectorAll('#oss .oss').forEach(b => b.addEventListener('click', () => b.classList.add('free')));

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

  /* ---------------- music: an original waltz, arranged live in Web Audio ----------------
     Celesta melody, harp arpeggios, plucked bass, string pad, a wordless choir and
     glockenspiel sparkles. The arrangement grows each time the 16-bar tune loops. */
  const sb = $('soundBtn');
  const MEL = [[74,1],[77,1],[81,1],[79,1.5],[77,.5],[76,1],[77,1],[74,1],[69,1],[70,2],[69,1],[67,1],[70,1],[74,1],[73,1.5],[76,.5],[79,1],[77,1],[76,1],[73,1],[74,3],
               [81,1],[79,.5],[77,.5],[76,1],[77,1],[74,2],[82,1],[81,.5],[79,.5],[77,1],[76,3],[74,1],[76,1],[77,1],[79,1],[81,1],[82,1],[81,1.5],[79,.5],[76,1],[74,3]];
  // [bass root, chord tones] per bar: Dm Bb Dm Gm Gm A7 A7 Dm | Dm Dm Gm A Dm Gm A7 Dm
  const CHORDS = [[50,[62,65,69]],[46,[58,62,65]],[50,[62,65,69]],[43,[55,58,62]],[43,[55,58,62]],[45,[57,61,64,67]],[45,[57,61,64,67]],[50,[62,65,69]],
                  [50,[62,65,69]],[50,[62,65,69]],[43,[55,58,62]],[45,[57,61,64]],[50,[62,65,69]],[43,[55,58,62]],[45,[57,61,64,67]],[50,[62,65,69]]];
  const MBAR = Array.from({ length: 16 }, () => []);
  { let b = 0; for (const [m, len] of MEL) { const k = Math.floor(b / 3 + 1e-6); MBAR[k].push([m, b - k * 3, len]); b += len; } }
  const hz = m => 440 * Math.pow(2, (m - 69) / 12);
  const BEAT = .62, BAR = BEAT * 3;

  function makeScore(ac, dest) {
    // bus: voices → master → compressor → dest, with a reverb send and a dotted-eighth echo
    const master = ac.createGain(); master.gain.value = 1;
    const comp = ac.createDynamicsCompressor(); comp.threshold.value = -18; comp.ratio.value = 3; comp.attack.value = .01; comp.release.value = .3;
    master.connect(comp); comp.connect(dest);
    const verb = ac.createConvolver(), len = Math.floor(ac.sampleRate * 2.2), buf = ac.createBuffer(2, len, ac.sampleRate);
    for (let c = 0; c < 2; c++) { const d = buf.getChannelData(c); for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3) * (i < 400 ? i / 400 : 1); }
    verb.buffer = buf; const vret = ac.createGain(); vret.gain.value = .55; verb.connect(vret); vret.connect(comp);
    const dly = ac.createDelay(2); dly.delayTime.value = BEAT * .75; const fb = ac.createGain(); fb.gain.value = .32; const dlp = ac.createBiquadFilter(); dlp.type = 'lowpass'; dlp.frequency.value = 2600;
    dly.connect(dlp); dlp.connect(fb); fb.connect(dly); const dret = ac.createGain(); dret.gain.value = .5; dlp.connect(dret); dret.connect(comp);
    // a few shared pan buses (pan, reverb send, echo send) instead of a panner per note
    const buses = new Map();
    const out = (node, pan, wet, echo = 0) => {
      const key = `${Math.round(pan * 10)}|${Math.round(wet * 10)}|${Math.round(echo * 10)}`;
      let p = buses.get(key);
      if (!p) {
        p = ac.createStereoPanner(); p.pan.value = Math.round(pan * 10) / 10; p.connect(master);
        const sv = ac.createGain(); sv.gain.value = wet; p.connect(sv); sv.connect(verb);
        if (echo) { const e = ac.createGain(); e.gain.value = echo; p.connect(e); e.connect(dly); }
        buses.set(key, p);
      }
      node.connect(p);
    };
    const env = (t, v, a, d) => { const g = ac.createGain(); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(v, t + a); g.gain.exponentialRampToValueAtTime(.0001, t + a + d); return g; };
    const osc = (type, f, t, stop, to, detune = 0) => { const o = ac.createOscillator(); o.type = type; o.frequency.value = f; o.detune.value = detune; o.connect(to); o.start(t); o.stop(stop); return o; };

    function celesta(f, t, v, pan = .1, echo = .25) {
      const g = env(t, v, .004, 2.4);
      osc('sine', f, t, t + 2.5, g);
      const h = ac.createGain(); h.gain.setValueAtTime(.28, t); h.gain.exponentialRampToValueAtTime(.001, t + .3); h.connect(g); osc('sine', f * 4.01, t, t + .35, h);
      const h2 = ac.createGain(); h2.gain.setValueAtTime(.1, t); h2.gain.exponentialRampToValueAtTime(.001, t + .9); h2.connect(g); osc('sine', f * 2, t, t + 1, h2);
      out(g, pan, .45, echo);
    }
    function harp(f, t, v, pan) {
      const g = env(t, v, .003, 1.8), lp = ac.createBiquadFilter(); lp.type = 'lowpass';
      lp.frequency.setValueAtTime(Math.min(9000, f * 9), t); lp.frequency.exponentialRampToValueAtTime(Math.max(300, f * 1.5), t + .6); lp.connect(g);
      osc('triangle', f, t, t + 1.9, lp); const o2 = ac.createGain(); o2.gain.value = .35; o2.connect(lp); osc('sine', f * 2, t, t + 1.9, o2);
      out(g, pan, .5);
    }
    function pluck(f, t, v) {
      const g = env(t, v, .006, 1.1), lp = ac.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 600; lp.connect(g);
      osc('triangle', f, t, t + 1.2, lp); osc('sine', f, t, t + 1.2, lp);
      out(g, 0, .2);
    }
    function pad(notes, t, dur, v, kind) {
      const g = ac.createGain(); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(v, t + dur * .35); g.gain.setValueAtTime(v, t + dur * .75); g.gain.linearRampToValueAtTime(0, t + dur + .5);
      const lfo = ac.createOscillator(); lfo.frequency.value = kind === 'choir' ? 5.2 : 4.6; const ld = ac.createGain(); ld.gain.value = kind === 'choir' ? 9 : 5; lfo.connect(ld); lfo.start(t); lfo.stop(t + dur + .6);
      const mix = ac.createGain(); mix.gain.value = 1 / notes.length;
      let tail = mix;
      if (kind === 'choir') {   // formant filters turn a buzzy tone into a soft "aah"
        const sum = ac.createGain(); sum.gain.value = 1;
        [[700, 1], [1150, .55], [2600, .22]].forEach(([fq, a]) => { const bp = ac.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = fq; bp.Q.value = 7; const ga = ac.createGain(); ga.gain.value = a * 2.2; mix.connect(bp); bp.connect(ga); ga.connect(sum); });
        tail = sum;
      } else { const lp = ac.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 1500; lp.Q.value = .5; mix.connect(lp); tail = lp; }
      tail.connect(g);
      notes.forEach((m, i) => (kind === 'choir' ? [0] : [-7, 7]).forEach(dt => { const o = osc('sawtooth', hz(m), t, t + dur + .6, mix, dt + (i - 1) * 2); ld.connect(o.detune); }));
      out(g, kind === 'choir' ? -.45 : .4, kind === 'choir' ? .9 : .6);
    }

    let barN = 0, loopN = 0, barT = 0;
    function bar(i, t) {
      const [root, ch] = CHORDS[i], late = i >= 8, L = loopN;
      pluck(hz(root - 12), t, .5);
      if (L > 0 || i > 1) pluck(hz(root - 5), t + BEAT * 2, .18);
      // harp: six rising eighths across the chord
      const arp = [root, root + 7, ch[0], ch[1], ch[2], ch[0] + 12];
      if (L > 0 || i >= 2) arp.forEach((m, k) => harp(hz(m), t + k * BEAT / 2, .11 - k * .008, -.7 + k * .28));
      // strings from the second phrase, every bar after the first loop
      if (late || L > 0) pad(ch.slice(0, 3).map(m => m - 12).concat(ch[0]), t, BAR, .085, 'strings');
      // the choir joins on the repeat
      if (L > 0 && (late || L > 1)) pad(ch.slice(0, 3), t, BAR, .06, 'choir');
      // melody on celesta; on later loops a harp doubles it an octave down
      for (const [m, st, len] of MBAR[i]) {
        celesta(hz(m), t + st * BEAT, .2);
        if (L > 1) harp(hz(m - 12), t + st * BEAT, .07, -.5);
      }
      // glockenspiel sparkles closing each phrase, and a shimmer at the top of each loop
      if (i === 7 || i === 15) ch.concat(ch[0] + 12).forEach((m, k) => celesta(hz(m + 24), t + BEAT * 2 + k * .09, .05, .5 - k * .25, .4));
      if (i === 0) [62, 65, 69, 72, 74, 77, 81, 86].forEach((m, k) => celesta(hz(m + 12), t + k * .05, .025, -.6 + k * .17, 0));
    }
    return {
      master,
      start(t) { barT = t; barN = 0; loopN = 0; },
      until(t) { while (barT < t) { bar(barN % 16, barT); barN++; if (barN % 16 === 0) loopN++; barT += BAR; } },
      dispose() { [comp, vret, dret].forEach(n => { try { n.disconnect(); } catch {} }); }
    };
  }

  let actx = null, gainOut = null, score = null, timer = null, playing = false;
  function startMusic() {
    if (!actx) {
      actx = new (window.AudioContext || window.webkitAudioContext)();
      gainOut = actx.createGain(); gainOut.gain.value = 0; gainOut.connect(actx.destination);
    }
    actx.resume();
    const old = score; if (old) setTimeout(() => old.dispose(), 4000);
    score = makeScore(actx, gainOut);           // fresh bus each start; the old one is released once its tails fade
    score.start(actx.currentTime + .15);
    gainOut.gain.cancelScheduledValues(actx.currentTime); gainOut.gain.setValueAtTime(gainOut.gain.value, actx.currentTime); gainOut.gain.setTargetAtTime(.32, actx.currentTime, .5);
    clearInterval(timer); timer = setInterval(() => score.until(actx.currentTime + .5), 80); playing = true;
  }
  function stopMusic() {
    playing = false; clearInterval(timer);
    if (actx) { gainOut.gain.setTargetAtTime(0, actx.currentTime, .2); setTimeout(() => { if (!playing) actx.suspend(); }, 900); }
  }
  if (/[?&]simdebug/.test(location.search)) window.HPScore = { makeScore, BAR };
  function setSound(on) { sb && sb.setAttribute('aria-pressed', on); sb && sb.setAttribute('aria-label', on ? 'Mute music' : 'Play music'); ls.set('hp_music', on ? 1 : 0); on ? startMusic() : stopMusic(); }
  sb && sb.addEventListener('click', () => setSound(sb.getAttribute('aria-pressed') !== 'true'));
  onTheme(t => { if (t !== 'hogwarts' && playing) { stopMusic(); sb.setAttribute('aria-pressed', 'false'); } });
  // remembered "on": browsers need a gesture first, so resume on the first tap
  if (ls.get('hp_music') === '1') addEventListener('pointerdown', function once(e) { if (isHP() && !playing && !e.target.closest('#soundBtn')) setSound(true); removeEventListener('pointerdown', once); }, { once: true });

  applyTexts();
  onScroll();
  window.HP = { setTheme, award, get points() { return points; } };
})();
