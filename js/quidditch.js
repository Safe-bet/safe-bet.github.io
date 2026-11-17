/* Seeker trials: a side-view Quidditch game for the Gryffindor theme.
   Fly through five hoops in order, dodge two homing Bludgers, then catch the
   Golden Snitch, which flees faster than you fly until it tires. */
(() => {
  const cv = document.getElementById('qCanvas'); if (!cv) return;
  const ctx = cv.getContext('2d');
  const root = document.getElementById('qgame');
  const $ = id => document.getElementById(id);
  const isHP = () => document.documentElement.dataset.theme === 'hogwarts';
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const touch = matchMedia('(pointer: coarse)').matches;
  const store = { get(k) { try { return localStorage.getItem(k); } catch { return null; } }, set(k, v) { try { localStorage.setItem(k, v); } catch {} } };

  /* ---------------- world ---------------- */
  const WW = 2400, WH = 900, GROUND = 830, TOP = 60;
  const HOOPS = [{ x: 480, y: 560 }, { x: 860, y: 300 }, { x: 1300, y: 640 }, { x: 1720, y: 260 }, { x: 2100, y: 500 }];
  const HR = 50;                      // hoop radius
  const THRUST = .3, BOOST = .58, DRAG = .035, QDRAG = .0025, SINK = .03;
  const PEN = 3, MAX_HITS = 5;

  let W = 0, H = 0, SC = 1, DPR = 1, camX = 0, camY = 0, VH = WH;
  function fit() {
    const r = cv.getBoundingClientRect(); DPR = Math.min(devicePixelRatio || 1, 2);
    W = r.width; H = r.height; cv.width = W * DPR; cv.height = H * DPR;
    SC = Math.max(H / WH, Math.min(W / 1400, H / 560));   // zoom in a little on wide screens
    VH = H / SC;
  }
  fit(); new ResizeObserver(fit).observe(cv);

  const clouds = Array.from({ length: 9 }, (_, i) => ({ x: i * 340 + Math.random() * 200, y: 80 + Math.random() * 240, s: .6 + Math.random() * .8 }));
  const mkPlayer = () => ({ x: 140, y: GROUND - 40, vx: 0, vy: 0, ux: 0, uy: 0, face: 1, boost: false, scarf: Array.from({ length: 7 }, () => ({ x: 140, y: GROUND - 40 })) });
  let S, phase = 'attract';

  function reset() {
    S = {
      t: 0, clock: 0, started: false, hoop: 0, hits: 0, pen: 0, stun: 0, stam: 100,
      p: mkPlayer(), snitch: null, caught: false, msg: '', msgT: 0, shake: 0, sparks: [],
      bl: [{ x: 900, y: 200, vx: 0, vy: 0, cd: 0 }, { x: 1500, y: 700, vx: 0, vy: 0, cd: 0 }]
    };
    updTasks(); setState('ON THE GROUND');
  }
  const toast = m => { S.msg = m; S.msgT = 2; };
  const setState = t => { const el = $('qState'); if (el && el.textContent !== t) el.textContent = t; };
  const taskEls = [...document.querySelectorAll('#qTasks li')];
  function updTasks() {
    taskEls.forEach(li => {
      const t = li.dataset.t, done = t === 'snitch' ? S.caught : +t < S.hoop;
      li.classList.toggle('done', done);
      li.classList.toggle('next', !done && (t === 'snitch' ? S.hoop >= 5 : +t === S.hoop));
    });
  }

  /* ---------------- snitch ---------------- */
  function releaseSnitch() {
    S.snitch = { x: S.p.x > WW / 2 ? 320 : WW - 320, y: 240 + Math.random() * 200, vx: -2, vy: 0, jink: 0, age: 0, wing: 0 };
    toast('The Golden Snitch is loose!'); setState('SNITCH RELEASED');
  }
  function stepSnitch(dt, dts) {
    const s = S.snitch; s.age += dts; s.wing += dts * 40;
    const dx = s.x - S.p.x, dy = s.y - S.p.y, d = Math.hypot(dx, dy) || 1;
    const tired = Math.max(0, s.age - 12);
    const flee = Math.max(5.4, 8.8 - tired * .14);           // faster than you, until it tires
    let ax = 0, ay = 0;
    if (d < 420) { ax += dx / d * .5; ay += dy / d * .5; }
    else { ax += Math.cos(s.age * .9) * .15; ay += Math.sin(s.age * 1.3) * .15; }
    s.jink -= dts;
    if (s.jink <= 0) { s.jink = .5 + Math.random() * .9; const a = Math.random() * 6.283; s.vx += Math.cos(a) * 4; s.vy += Math.sin(a) * 4; }
    // walls: steer back in
    if (s.x < 120) ax += .6; if (s.x > WW - 120) ax -= .6; if (s.y < TOP + 60) ay += .6; if (s.y > GROUND - 80) ay -= .6;
    s.vx += ax * dt; s.vy += ay * dt;
    const sp = Math.hypot(s.vx, s.vy), cap = d < 420 ? flee : 3.2;
    if (sp > cap) { s.vx *= cap / sp; s.vy *= cap / sp; }
    s.x = Math.max(40, Math.min(WW - 40, s.x + s.vx * dt)); s.y = Math.max(TOP, Math.min(GROUND - 30, s.y + s.vy * dt));
    if (!reduced && Math.random() < .6) S.sparks.push({ x: s.x, y: s.y, vx: (Math.random() - .5) * .6, vy: (Math.random() - .5) * .6, l: 1, c: '255,215,90' });
    if (d < 28 && phase !== 'end') catchIt();
  }

  /* ---------------- physics ---------------- */
  function stepPlayer(dt, dts) {
    const p = S.p;
    const stunned = S.stun > 0;
    const boosting = p.boost && S.stam > 0 && !stunned && (p.ux || p.uy);
    S.stam = Math.max(0, Math.min(100, S.stam + (boosting ? -42 : 14) * dts));
    const th = stunned ? 0 : boosting ? BOOST : THRUST;
    const m = Math.hypot(p.ux, p.uy) || 1, ux = p.ux / Math.max(1, m), uy = p.uy / Math.max(1, m);
    p.vx += ux * th * dt; p.vy += (uy * th + SINK) * dt;
    const sp = Math.hypot(p.vx, p.vy);
    p.vx -= (p.vx * DRAG + p.vx * sp * QDRAG) * dt; p.vy -= (p.vy * DRAG + p.vy * sp * QDRAG) * dt;
    const px = p.x;
    p.x += p.vx * dt; p.y += p.vy * dt;
    if (Math.abs(p.ux) > .15) p.face = p.ux > 0 ? 1 : -1;
    if (p.y > GROUND - 22) { p.y = GROUND - 22; p.vy = Math.min(0, p.vy) * -.2; }
    if (p.y < TOP) { p.y = TOP; p.vy = Math.max(0, p.vy); }
    if (p.x < 30) { p.x = 30; p.vx = 0; } if (p.x > WW - 30) { p.x = WW - 30; p.vx = 0; }
    // scarf trails behind
    let ax = p.x - p.face * 8, ay = p.y - 14;
    const k = 1 - Math.pow(.65, dt);   // frame-rate independent smoothing
    p.scarf.forEach((q, i) => { q.x += (ax - q.x) * k; q.y += (ay + 3 - q.y) * k + Math.sin(S.t * 9 + i) * .6; ax = q.x - p.face * 4; ay = q.y; });
    // hoops (in order)
    if (S.hoop < 5) {
      const h = HOOPS[S.hoop];
      if ((px - h.x) * (p.x - h.x) <= 0 && px !== p.x) {
        const off = Math.abs(p.y - h.y);
        if (off < HR - 10) { S.hoop++; toast(S.hoop < 5 ? `Hoop ${S.hoop} ✓` : 'All five hoops ✓'); updTasks(); burst(h.x, h.y, '211,166,37'); if (S.hoop === 5) releaseSnitch(); }
        else if (off < HR + 14) hit(0, -Math.sign(p.vx) * 2.5, 0, 'Clipped the hoop');
      }
    }
    // other hoops' rims are solid too
    HOOPS.forEach((h, i) => { if (i === S.hoop) return; if (Math.abs(p.x - h.x) < 10 && Math.abs(Math.abs(p.y - h.y) - HR) < 9) hit(0, -Math.sign(p.vx || 1) * 2.5, 0, 'Clipped a hoop'); });
  }
  function stepBludgers(dt, dts) {
    for (const b of S.bl) {
      b.cd -= dts;
      const dx = S.p.x - b.x, dy = S.p.y - b.y, d = Math.hypot(dx, dy) || 1;
      const hunt = b.cd <= 0 && d < 900;
      if (hunt) { b.vx += dx / d * .13 * dt; b.vy += dy / d * .13 * dt; }
      else { b.vx += Math.sin(S.t * .7 + b.x * .01) * .05 * dt; b.vy += Math.cos(S.t * .6) * .05 * dt; }
      const sp = Math.hypot(b.vx, b.vy), cap = hunt ? 5.1 : 2.5;
      if (sp > cap) { b.vx *= cap / sp; b.vy *= cap / sp; }
      b.x += b.vx * dt; b.y += b.vy * dt;
      if (b.y > GROUND - 14) { b.y = GROUND - 14; b.vy *= -.8; } if (b.y < TOP) { b.y = TOP; b.vy *= -.8; }
      if (b.x < 20 || b.x > WW - 20) { b.vx *= -1; b.x = Math.max(20, Math.min(WW - 20, b.x)); }
      if (d < 30 && b.cd <= 0 && phase === 'play') {
        b.cd = 1.8; b.vx = -dx / d * 6; b.vy = -dy / d * 6;
        hit(1, dx / d * 6, dy / d * 6, 'Bludger! +3 s');
      }
    }
  }
  function hit(stun, kx, ky, msg) {
    if (S.stun > 0 || phase !== 'play') return;
    S.hits++; S.pen += PEN; S.stun = stun ? .55 : .25; S.shake = 9; S.p.vx = kx || S.p.vx * -.4; S.p.vy = ky || S.p.vy;
    toast(msg); burst(S.p.x, S.p.y, '127,9,9');
    if (S.hits >= MAX_HITS) finish('fall');
  }
  const burst = (x, y, c) => { for (let i = 0; i < 18; i++) { const a = Math.random() * 6.283, v = 1 + Math.random() * 3; S.sparks.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, l: 1, c }); } };

  /* ---------------- autopilot (attract mode + tests) ---------------- */
  function autopilot(p) {
    let tx, ty, cap = 6;
    if (S.hoop < 5) { const h = HOOPS[S.hoop]; const side = p.x < h.x ? 1 : -1; tx = Math.abs(p.x - h.x) > 90 ? h.x - side * 60 : h.x + side * 90; ty = h.y; }
    else if (S.snitch) { tx = S.snitch.x + S.snitch.vx * 12; ty = S.snitch.y + S.snitch.vy * 12; cap = 10; }
    else { tx = p.x; ty = p.y; }
    let vx = (tx - p.x) * .06, vy = (ty - p.y) * .06; const m = Math.hypot(vx, vy); if (m > cap) { vx *= cap / m; vy *= cap / m; }
    for (const b of S.bl) { const dx = p.x - b.x, dy = p.y - b.y, d = Math.hypot(dx, dy) || 1; if (d < 150 && b.cd <= 0) { vx += dx / d * 5 * (1 - d / 150); vy += dy / d * 5 * (1 - d / 150); } }
    p.ux = Math.max(-1, Math.min(1, (vx - p.vx) * .5)); p.uy = Math.max(-1, Math.min(1, (vy - p.vy) * .5 - SINK / THRUST));
    p.boost = S.hoop >= 5 && S.stam > 25;
  }

  /* ---------------- input ---------------- */
  const keys = new Set(); let visible = false;
  new IntersectionObserver(es => { visible = es[0].isIntersecting; }, { threshold: .35 }).observe(cv);
  const GK = ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'KeyW', 'KeyA', 'KeyS', 'KeyD', 'Space', 'ShiftLeft', 'ShiftRight', 'KeyR'];
  addEventListener('keydown', e => {
    if (!isHP() || phase !== 'play' || (!visible && document.activeElement !== cv) || !GK.includes(e.code)) return;
    e.preventDefault(); if (e.code === 'KeyR') { start(); return; } keys.add(e.code);
  });
  addEventListener('keyup', e => keys.delete(e.code));
  addEventListener('blur', () => keys.clear());
  const stick = $('qStick'), joy = { on: false, ox: 0, oy: 0, x: 0, y: 0 }; let boostBtn = false;
  cv.addEventListener('pointerdown', e => {
    if (phase !== 'play' || e.pointerType === 'mouse') return;
    const r = cv.getBoundingClientRect(); joy.on = true; joy.ox = e.clientX; joy.oy = e.clientY; joy.x = joy.y = 0;
    stick.style.left = e.clientX - r.left + 'px'; stick.style.top = e.clientY - r.top + 'px'; stick.classList.add('on'); cv.setPointerCapture(e.pointerId);
  });
  cv.addEventListener('pointermove', e => {
    if (!joy.on) return; let dx = e.clientX - joy.ox, dy = e.clientY - joy.oy; const m = Math.hypot(dx, dy), R = 42;
    if (m > R) { dx *= R / m; dy *= R / m; } joy.x = dx / R; joy.y = dy / R; stick.style.setProperty('--sx', dx + 'px'); stick.style.setProperty('--sy', dy + 'px');
  });
  const endJoy = () => { joy.on = false; joy.x = joy.y = 0; stick.classList.remove('on'); };
  cv.addEventListener('pointerup', endJoy); cv.addEventListener('pointercancel', endJoy);
  const bb = $('qBoost');
  bb.addEventListener('pointerdown', e => { e.preventDefault(); boostBtn = true; });
  ['pointerup', 'pointercancel', 'pointerleave'].forEach(ev => bb.addEventListener(ev, () => { boostBtn = false; }));
  if (touch) $('qText').textContent = 'Drag on the pitch to fly, hold BOOST for speed. Hoops in order, dodge the Bludgers, then catch the Snitch.';

  /* ---------------- leaderboard ---------------- */
  const board = {
    load() { try { const a = JSON.parse(store.get('qd_board') || '[]'); return Array.isArray(a) ? a.filter(e => e && typeof e.t === 'number') : []; } catch { return []; } },
    save(a) { store.set('qd_board', JSON.stringify(a.slice(0, 10))); }
  };
  function renderBoard(hl) {
    const list = $('qBoardList'); list.textContent = '';
    const rows = board.load();
    if (!rows.length) { const li = document.createElement('li'); li.className = 'empty'; li.textContent = 'No Snitch caught yet. Be the first seeker on the board.'; list.appendChild(li); return; }
    rows.forEach((r, i) => {
      const li = document.createElement('li'); li.className = r.id === hl ? 'me' : '';
      const c = (cls, txt) => { const sp = document.createElement('span'); sp.className = cls; sp.textContent = txt; li.appendChild(sp); };
      c('rk', String(i + 1).padStart(2, '0')); c('nm', r.n); c('tm', r.t.toFixed(1) + ' s'); c('pn', (r.h ? `${r.h} hit${r.h > 1 ? 's' : ''}` : 'clean') + (r.d ? ' · ' + new Date(r.d).toLocaleDateString(undefined, { day: 'numeric', month: 'short' }) : ''));
      list.appendChild(li);
    });
  }
  renderBoard();
  let pending = null;
  $('qSave').addEventListener('submit', e => {
    e.preventDefault(); if (!pending) return;
    const n = ($('qName').value || '').trim().replace(/\s+/g, ' ').slice(0, 14) || 'Anonymous';
    store.set('qd_name', n);
    const entry = { ...pending, n }; pending = null;
    const a = board.load(); a.push(entry); a.sort((x, y) => x.t - y.t); board.save(a);
    const r = a.slice(0, 10).findIndex(x => x.id === entry.id) + 1;
    $('qSave').hidden = true; $('qRank').textContent = r ? `Saved: #${r} on the house board.` : 'Saved, but outside the top 10.';
    renderBoard(entry.id);
  });

  /* ---------------- flow ---------------- */
  const over = $('qOver');
  function start() { reset(); phase = 'play'; over.hidden = true; root.classList.add('playing'); cv.focus({ preventScroll: true }); }
  $('qStart').addEventListener('click', start);
  function catchIt() {
    S.caught = true; updTasks(); burst(S.snitch.x, S.snitch.y, '255,215,90'); setState('SNITCH CAUGHT');
    if (phase === 'attract') { setTimeout(() => { if (phase === 'attract') reset(); }, 1500); return; }
    finish('catch');
  }
  function finish(why) {
    if (phase !== 'play') return;
    phase = 'end'; root.classList.remove('playing');
    const total = S.clock + S.pen;
    $('qSave').hidden = true; $('qRank').textContent = ''; pending = null;
    if (why === 'catch') { const r = cv.getBoundingClientRect(); dispatchEvent(new CustomEvent('hp:points', { detail: { n: 50, x: r.left + r.width / 2, y: r.top + 40 } })); }
    setTimeout(() => {
      over.hidden = false;
      if (why === 'fall') {
        $('qKick').textContent = 'Knocked off your broom'; $('qTitle').textContent = 'Trial over';
        $('qText').textContent = `Five Bludger and hoop hits and you're out. You cleared ${S.hoop}/5 hoops. Keep moving and use boost to shake the Bludgers.`;
      } else {
        const rows = board.load(), best = rows.length ? rows[0].t : null;
        $('qKick').textContent = best == null || total < best ? 'New house record' : 'Snitch caught';
        $('qTitle').textContent = `${total.toFixed(1)} s`;
        $('qText').innerHTML = `<span class="results"><span class="win"><b>${total.toFixed(1)} s</b>you</span><span><b>${S.hits}</b>hits (+${S.pen} s)</span><span><b>${best == null ? '—' : best.toFixed(1) + ' s'}</b>board best</span></span>+50 points to Gryffindor`;
        pending = { id: Date.now().toString(36), t: +total.toFixed(1), h: S.hits, d: new Date().toISOString() };
        const pos = rows.filter(r => r.t <= pending.t).length + 1;
        if (pos <= 10) { $('qRank').textContent = `That's #${pos} on the house board. Sign it:`; $('qSave').hidden = false; $('qName').value = store.get('qd_name') || ''; setTimeout(() => $('qName').focus({ preventScroll: true }), 50); }
        else $('qRank').textContent = 'Outside the top 10. Fly again.';
      }
      $('qStart').textContent = 'Fly again';
    }, 900);
  }

  /* ---------------- render ---------------- */
  const X = x => (x - camX) * SC, Y = y => (y - camY) * SC;
  function drawWorld(t) {
    ctx.save(); ctx.scale(SC, SC); ctx.translate(-camX, -camY);
    const vw = W / SC;
    // sky
    const sky = ctx.createLinearGradient(0, 0, 0, GROUND); sky.addColorStop(0, '#7fa9c9'); sky.addColorStop(.6, '#c9d9df'); sky.addColorStop(1, '#f2d9a8');
    ctx.fillStyle = sky; ctx.fillRect(camX, 0, vw, GROUND);
    const sun = ctx.createRadialGradient(camX + vw * .8, 160, 0, camX + vw * .8, 160, 260); sun.addColorStop(0, 'rgba(255,240,200,.85)'); sun.addColorStop(1, 'rgba(255,240,200,0)');
    ctx.fillStyle = sun; ctx.fillRect(camX, 0, vw, GROUND);
    // clouds (parallax)
    for (const c of clouds) {
      const cx = ((c.x - camX * .25 + t * 6 * c.s) % (WW + 600) + WW + 600) % (WW + 600) - 300 + camX;
      ctx.fillStyle = 'rgba(255,255,255,.75)';
      for (let k = 0; k < 4; k++) { ctx.beginPath(); ctx.ellipse(cx + k * 34 * c.s, c.y + Math.sin(k * 1.7) * 8, 46 * c.s, 22 * c.s, 0, 0, 6.283); ctx.fill(); }
    }
    // castle silhouette far away (original design)
    ctx.save(); ctx.translate(camX * .7, 0); ctx.fillStyle = 'rgba(70,80,100,.45)';
    const cbase = GROUND - 120;
    [[300, 200, 34], [380, 260, 40], [460, 170, 30], [560, 300, 46], [660, 210, 30], [740, 150, 26]].forEach(([x, h, w]) => {
      ctx.fillRect(x, cbase - h, w, h + 120); ctx.beginPath(); ctx.moveTo(x - 6, cbase - h); ctx.lineTo(x + w / 2, cbase - h - w * 1.4); ctx.lineTo(x + w + 6, cbase - h); ctx.fill();
    });
    ctx.fillRect(280, cbase - 90, 520, 210);
    ctx.fillStyle = 'rgba(255,220,140,.5)'; for (let i = 0; i < 14; i++) ctx.fillRect(300 + (i * 37) % 480, cbase - 60 - (i * 23) % 140, 4, 7);
    ctx.restore();
    // stands with house drapes (parallax)
    const cols = [['#7f0909', '#d3a625'], ['#1a472a', '#aaaaaa'], ['#0e1a40', '#946b2d'], ['#ecb939', '#372e29']];
    for (let i = 0; i < 12; i++) {
      const sx = i * 230 - camX * .1 + 60, top = GROUND - 210 - (i % 3) * 30, [a, b] = cols[i % 4];
      ctx.fillStyle = '#6b5a45'; ctx.fillRect(sx, top, 70, GROUND - top);
      ctx.fillStyle = a; ctx.fillRect(sx, top, 70, 70); ctx.fillStyle = b; ctx.fillRect(sx, top + 70, 70, 12);
      for (let k = 0; k < 4; k++) { ctx.fillStyle = k % 2 ? a : b; ctx.beginPath(); ctx.moveTo(sx + k * 17.5, top + 82); ctx.lineTo(sx + k * 17.5 + 17.5, top + 82); ctx.lineTo(sx + k * 17.5 + 8.75, top + 100 + Math.sin(t * 2 + i + k) * 3); ctx.fill(); }
      ctx.fillStyle = a; ctx.beginPath(); ctx.moveTo(sx - 6, top); ctx.lineTo(sx + 35, top - 40); ctx.lineTo(sx + 76, top); ctx.fill();
      for (let k = 0; k < 6; k++) { ctx.fillStyle = `hsl(${(i * 47 + k * 61) % 360},40%,${45 + Math.sin(t * 3 + k + i) * 8}%)`; ctx.beginPath(); ctx.arc(sx + 8 + k * 11, top + 50 + Math.sin(t * 4 + k * 2 + i) * 2, 3, 0, 6.283); ctx.fill(); }
    }
    // ground
    ctx.fillStyle = '#5f8f3a'; ctx.fillRect(camX, GROUND, vw, WH - GROUND + 200);
    ctx.fillStyle = 'rgba(255,255,255,.07)'; for (let x = Math.floor(camX / 120) * 120; x < camX + vw; x += 240) ctx.fillRect(x, GROUND, 120, WH);
    // hoops
    HOOPS.forEach((h, i) => {
      const next = i === S.hoop, done = i < S.hoop;
      ctx.strokeStyle = '#8a6a1a'; ctx.lineWidth = 7; ctx.beginPath(); ctx.moveTo(h.x, h.y + HR); ctx.lineTo(h.x, GROUND); ctx.stroke();
      if (next) { ctx.save(); ctx.shadowColor = 'rgba(255,215,90,1)'; ctx.shadowBlur = 24 + Math.sin(t * 5) * 8; }
      ctx.strokeStyle = done ? '#9aa36b' : '#d3a625'; ctx.lineWidth = 8;
      ctx.beginPath(); ctx.ellipse(h.x, h.y, 14, HR, 0, 0, 6.283); ctx.stroke();
      if (next) ctx.restore();
      ctx.fillStyle = next ? '#7f0909' : 'rgba(43,26,14,.5)'; ctx.font = "700 20px 'Cinzel', serif"; ctx.textAlign = 'center';
      ctx.fillText(done ? '✓' : String(i + 1), h.x, h.y - HR - 14); ctx.textAlign = 'left';
    });
    ctx.restore();
  }
  function drawPlayer(p, t) {
    // scarf
    ctx.lineCap = 'round';
    for (let i = 0; i < p.scarf.length - 1; i++) { ctx.strokeStyle = i % 2 ? '#d3a625' : '#7f0909'; ctx.lineWidth = 5 * SC; ctx.beginPath(); ctx.moveTo(X(p.scarf[i].x), Y(p.scarf[i].y)); ctx.lineTo(X(p.scarf[i + 1].x), Y(p.scarf[i + 1].y)); ctx.stroke(); }
    const tilt = Math.max(-.4, Math.min(.4, p.vy * .05));
    ctx.save(); ctx.translate(X(p.x), Y(p.y)); ctx.scale(SC * p.face, SC); ctx.rotate(tilt * p.face);
    if (S.stun > 0) ctx.rotate(Math.sin(t * 40) * .15);
    // broom
    ctx.strokeStyle = '#6b4426'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(-40, 6); ctx.lineTo(38, 2); ctx.stroke();
    ctx.fillStyle = '#b08850'; ctx.beginPath(); ctx.moveTo(-38, 6); ctx.lineTo(-64, -4); ctx.lineTo(-68, 8); ctx.lineTo(-62, 18); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = '#8a6a3a'; ctx.lineWidth = 1; for (let k = -2; k < 16; k += 4) { ctx.beginPath(); ctx.moveTo(-40, 6); ctx.lineTo(-66, k); ctx.stroke(); }
    if (p.boost && S.stam > 0 && (p.ux || p.uy)) { ctx.fillStyle = 'rgba(255,200,90,.6)'; ctx.beginPath(); ctx.moveTo(-66, 0); ctx.lineTo(-96 - Math.random() * 14, 7); ctx.lineTo(-66, 14); ctx.fill(); }
    // rider: robe, arm, head, hair
    ctx.fillStyle = '#7f0909'; ctx.beginPath(); ctx.moveTo(-14, 4); ctx.quadraticCurveTo(-6, -30, 6, -32); ctx.lineTo(14, -6); ctx.lineTo(4, 6); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.moveTo(-14, 4); ctx.lineTo(-26 - Math.sin(t * 8) * 3, 12); ctx.lineTo(-8, 8); ctx.fill();
    ctx.strokeStyle = '#5c0505'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(4, -20); ctx.lineTo(18, 2); ctx.stroke();
    ctx.fillStyle = '#e8c9a0'; ctx.beginPath(); ctx.arc(8, -40, 8, 0, 6.283); ctx.fill();
    ctx.fillStyle = '#2b1a0e'; ctx.beginPath(); ctx.arc(6, -43, 8, Math.PI * .9, Math.PI * 2.05); ctx.fill();
    ctx.restore();
  }
  function drawBludger(b) {
    ctx.save(); ctx.translate(X(b.x), Y(b.y)); ctx.scale(SC, SC);
    const sp = Math.hypot(b.vx, b.vy);
    if (sp > 2) { ctx.strokeStyle = 'rgba(40,30,25,.25)'; ctx.lineWidth = 3; for (let k = -1; k <= 1; k++) { ctx.beginPath(); ctx.moveTo(-b.vx / sp * 16 + k * 5 * b.vy / sp, -b.vy / sp * 16 - k * 5 * b.vx / sp); ctx.lineTo(-b.vx / sp * 40, -b.vy / sp * 40); ctx.stroke(); } }
    const gr = ctx.createRadialGradient(-4, -4, 2, 0, 0, 13); gr.addColorStop(0, '#6b6b6b'); gr.addColorStop(1, '#1b1b1b');
    ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(0, 0, 13, 0, 6.283); ctx.fill();
    ctx.restore();
  }
  function drawSnitch(s, t) {
    ctx.save(); ctx.translate(X(s.x), Y(s.y)); ctx.scale(SC, SC);
    const gl = ctx.createRadialGradient(0, 0, 0, 0, 0, 30); gl.addColorStop(0, 'rgba(255,230,120,.7)'); gl.addColorStop(1, 'rgba(255,230,120,0)');
    ctx.fillStyle = gl; ctx.beginPath(); ctx.arc(0, 0, 30, 0, 6.283); ctx.fill();
    const f = Math.sin(s.wing) * .9;
    ctx.fillStyle = 'rgba(245,245,250,.9)'; ctx.strokeStyle = 'rgba(160,160,170,.8)'; ctx.lineWidth = .8;
    [-1, 1].forEach(sd => { ctx.beginPath(); ctx.moveTo(sd * 5, -2); ctx.quadraticCurveTo(sd * 20, -16 * f - 6, sd * 30, -6 * f); ctx.quadraticCurveTo(sd * 18, 2, sd * 5, 2); ctx.fill(); ctx.stroke(); });
    const g2 = ctx.createRadialGradient(-2, -2, 1, 0, 0, 7); g2.addColorStop(0, '#fff3b0'); g2.addColorStop(1, '#c79a1a');
    ctx.fillStyle = g2; ctx.beginPath(); ctx.arc(0, 0, 7, 0, 6.283); ctx.fill();
    ctx.restore();
  }
  function hud() {
    ctx.font = "600 14px 'Cinzel', serif"; ctx.fillStyle = '#2b1a0e';
    ctx.fillText(`${(S.clock + S.pen).toFixed(1)} s${S.pen ? `  (+${S.pen})` : ''}`, 12, 24);
    ctx.font = "italic 13px 'IM Fell English', serif";
    ctx.fillText(`Hoops ${S.hoop}/5 · hits ${S.hits}/${MAX_HITS}`, 12, 42);
    ctx.fillStyle = 'rgba(43,26,14,.15)'; ctx.fillRect(12, 50, 90, 6);
    ctx.fillStyle = S.stam < 25 ? '#9b1c1c' : '#d3a625'; ctx.fillRect(12, 50, 90 * S.stam / 100, 6);
    ctx.fillStyle = '#2b1a0e'; ctx.fillText('boost', 108, 57);
    // minimap
    const mw = Math.min(260, W * .42), mh = 20, mx = W - mw - 12, my = 12, k = mw / WW;
    ctx.fillStyle = 'rgba(246,234,208,.85)'; ctx.fillRect(mx, my, mw, mh); ctx.strokeStyle = 'rgba(92,52,20,.5)'; ctx.strokeRect(mx, my, mw, mh);
    const yy = y => my + (y - TOP) / (GROUND - TOP) * mh;
    HOOPS.forEach((h, i) => { ctx.fillStyle = i < S.hoop ? '#2f6b2a' : i === S.hoop ? '#7f0909' : '#a67c00'; ctx.fillRect(mx + h.x * k - 1.5, yy(h.y) - 3, 3, 6); });
    S.bl.forEach(b => { ctx.fillStyle = '#1b1b1b'; ctx.beginPath(); ctx.arc(mx + b.x * k, yy(b.y), 2.2, 0, 6.283); ctx.fill(); });
    if (S.snitch) { ctx.fillStyle = '#d3a625'; ctx.beginPath(); ctx.arc(mx + S.snitch.x * k, yy(S.snitch.y), 2.6, 0, 6.283); ctx.fill(); }
    ctx.fillStyle = '#7f0909'; ctx.beginPath(); ctx.arc(mx + S.p.x * k, yy(S.p.y), 3, 0, 6.283); ctx.fill();
    // off-screen snitch arrow
    if (S.snitch) {
      const sx = X(S.snitch.x), sy = Y(S.snitch.y);
      if (sx < 0 || sx > W || sy < 0 || sy > H) {
        const ax = Math.max(18, Math.min(W - 18, sx)), ay = Math.max(70, Math.min(H - 18, sy)), a = Math.atan2(sy - ay, sx - ax);
        ctx.save(); ctx.translate(ax, ay); ctx.rotate(a); ctx.fillStyle = '#d3a625'; ctx.beginPath(); ctx.moveTo(10, 0); ctx.lineTo(-8, -7); ctx.lineTo(-8, 7); ctx.fill(); ctx.restore();
      }
    }
    if (S.msgT > 0) {
      ctx.font = `700 ${Math.max(15, 18 * Math.min(1, SC * 1.4))}px 'Cinzel', serif`; ctx.textAlign = 'center';
      ctx.globalAlpha = Math.min(1, S.msgT * 2); ctx.fillStyle = S.msg.includes('✓') || S.msg.includes('Snitch') ? '#7f0909' : '#5c0505';
      ctx.fillText(S.msg, W / 2, my + mh + 40); ctx.globalAlpha = 1; ctx.textAlign = 'left';
    }
  }

  /* ---------------- loop ---------------- */
  reset();
  let last = performance.now(), running = false;
  new IntersectionObserver(es => { running = es[0].isIntersecting; last = performance.now(); }, { rootMargin: '200px' }).observe(cv);
  function frame(now) {
    requestAnimationFrame(frame);
    if (!running || !isHP()) return;
    const dts = Math.max(0, Math.min(.05, (now - last) / 1000)); last = now; const dt = dts * 60;
    S.t += dts; S.msgT -= dts; S.stun -= dts; S.shake *= .85;
    const p = S.p;
    if (phase !== 'end') {
      if (phase === 'attract' || p.auto) autopilot(p);
      else {
        const kx = (keys.has('ArrowRight') || keys.has('KeyD') ? 1 : 0) - (keys.has('ArrowLeft') || keys.has('KeyA') ? 1 : 0);
        const ky = (keys.has('ArrowDown') || keys.has('KeyS') ? 1 : 0) - (keys.has('ArrowUp') || keys.has('KeyW') ? 1 : 0);
        p.ux = kx || joy.x; p.uy = ky || joy.y; p.boost = keys.has('Space') || keys.has('ShiftLeft') || keys.has('ShiftRight') || boostBtn;
        if (!S.started && (p.ux || p.uy)) { S.started = true; setState('IN THE AIR'); }
      }
      if (phase === 'play' && (S.started || p.auto)) S.clock += dts;
      stepPlayer(dt, dts);
      if (phase === 'play') stepBludgers(dt, dts);
      if (S.snitch && !S.caught) stepSnitch(dt, dts);
    }
    for (let i = S.sparks.length - 1; i >= 0; i--) { const q = S.sparks[i]; q.x += q.vx * dt; q.y += q.vy * dt; q.l -= .03 * dt; if (q.l <= 0) S.sparks.splice(i, 1); }
    // camera
    camX += (Math.max(0, Math.min(WW - W / SC, p.x - (W / SC) * .42)) - camX) * .08;
    camY += (Math.max(0, Math.min(WH - VH, p.y - VH * .5)) - camY) * .08;
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    ctx.save(); if (S.shake > .3) ctx.translate((Math.random() - .5) * S.shake, (Math.random() - .5) * S.shake);
    ctx.clearRect(0, 0, W, H);
    drawWorld(S.t);
    if (phase === 'play') S.bl.forEach(drawBludger);
    if (S.snitch && !S.caught) drawSnitch(S.snitch, S.t);
    for (const q of S.sparks) { ctx.fillStyle = `rgba(${q.c},${q.l})`; ctx.beginPath(); ctx.arc(X(q.x), Y(q.y), (1.5 + q.l * 2) * Math.max(.6, SC), 0, 6.283); ctx.fill(); }
    drawPlayer(p, S.t);
    if (phase !== 'attract') hud();
    ctx.restore();
  }
  requestAnimationFrame(frame);
  if (/[?&]simdebug/.test(location.search)) window.QSim = {
    start, get S() { return S; }, get phase() { return phase; }, keys,
    run(sec) { running = true; let t = last; for (let i = 0; i < sec * 60; i++) { t += 1000 / 60; frame(t); } last = performance.now(); return { phase, clock: +S.clock.toFixed(1), hoop: S.hoop, hits: S.hits, caught: S.caught, x: Math.round(S.p.x), y: Math.round(S.p.y) }; }
  };
})();
