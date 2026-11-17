/* Pilot ATAL through SAUVC — a small side-view AUV sim.
   Physics: thrust, linear + quadratic drag, slight positive buoyancy, a mid-pool current.
   Autopilot: waypoint follower with a cascaded controller (position → velocity → thrust). */
(() => {
  const cv = document.getElementById('simCanvas'); if (!cv) return;
  const ctx = cv.getContext('2d');
  const root = document.getElementById('game');
  const over = document.getElementById('gameOver');
  const $ = id => document.getElementById(id);
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const touch = matchMedia('(pointer: coarse)').matches;
  const store = { get(k) { try { return localStorage.getItem(k); } catch { return null; } }, set(k, v) { try { localStorage.setItem(k, v); } catch {} } };

  /* ---------------- world ---------------- */
  const WW = 2600, WH = 600, SURF = 60, FLOOR = 560;
  const GX = 540, BAR = { x: GX - 20, y: 222, w: 40, h: 16 };
  const FX = 1080, BX = 1580, UX = 2060, ZX = 2330;
  const BI = 25;                       // bucket inner half-width (narrow)
  const PEN = 3;                       // seconds per bump / sting
  // drifting jellyfish: touching one stings (hull damage + time penalty)
  const JELLY = [{ x: 820, y0: 300, a: 125, w: .55, ph: 0 }, { x: 1330, y0: 320, a: 150, w: .42, ph: 1.2 }, { x: 1840, y0: 290, a: 120, w: .6, ph: 2.5 }, { x: 2200, y0: 230, a: 105, w: .5, ph: .7 }];
  const jellyPos = j => ({ x: j.x + Math.sin(S.t * .3 + j.ph) * 30, y: j.y0 + Math.sin(S.t * j.w + j.ph) * j.a });
  const SUB_W = 66, SUB_H = 20;
  const fog = document.createElement('canvas'), fg = fog.getContext('2d');

  let W = 0, H = 0, SC = 1, DPR = 1, camX = 0;
  function fit() {
    const r = cv.getBoundingClientRect(); DPR = Math.min(devicePixelRatio || 1, 2);
    W = r.width; H = r.height; cv.width = W * DPR; cv.height = H * DPR; fog.width = cv.width; fog.height = cv.height;
    SC = H / WH;
  }
  fit(); new ResizeObserver(fit).observe(cv);

  /* ---------------- state ---------------- */
  const mkSub = () => ({ x: 120, y: 200, vx: 0, vy: 0, ux: 0, uy: 0, face: 1, wp: 0, hold: 0, done: null });
  let S;               // game state
  let mode = 'auto';   // 'fly' | 'auto'
  let phase = 'attract'; // 'attract' | 'play' | 'end'
  const snow = Array.from({ length: 140 }, () => ({ x: Math.random() * WW, y: SURF + Math.random() * (FLOOR - SURF), z: Math.random() }));

  function reset(m) {
    mode = m;
    S = {
      t: 0, clock: 0, started: false, bumps: 0, bumpCd: 0, stings: 0, stingCd: 0, pen: 0, hull: 100, bat: 100, dead: 0,
      actor: mkSub(), ghost: mkSub(), ghostT: null,
      gate: false, flare: { down: false, ang: 0, dir: 1 }, bucket: false, buoy: false, surface: false,
      buoyOff: { x: 0, y: 0, vx: 0, vy: 0 }, balls: [], markers: 2,
      msg: '', msgT: 0, overGate: false
    };
    S.ghost.auto = true;
    if (m === 'auto') S.actor.auto = true;
    updTasks();
  }
  const toast = (m) => { S.msg = m; S.msgT = 2.2; };

  /* ---------------- tasks UI ---------------- */
  const taskEls = [...document.querySelectorAll('#simTasks li')];
  function updTasks() { taskEls.forEach(li => li.classList.toggle('done', li.dataset.t === 'flare' ? S.flare.down : S[li.dataset.t] === true)); }

  /* ---------------- autopilot ---------------- */
  const buoyPos = () => ({ x: UX + S.buoyOff.x + Math.sin(S.t * .9) * 14, y: 300 + S.buoyOff.y + Math.sin(S.t * 1.3) * 26 });
  const route = () => [
    { x: 260, y: 380 }, { x: GX - 70, y: 390 }, { x: GX + 90, y: 390, tol: 30 },
    { x: FX - 90, y: 470 }, { x: FX + 30, y: 470, tol: 26, v: 3.4 },
    { x: BX, y: 420 }, { x: BX, y: 424, act: 'drop', hold: .5, tol: 10 },
    { x: UX - 70, y: () => buoyPos().y }, { x: () => buoyPos().x - 10, y: () => buoyPos().y, tol: 24 },
    { x: ZX + 60, y: 300 }, { x: ZX + 60, y: SURF + 2, act: 'surface', tol: 14 }
  ];
  const ROUTE = route();
  const val = v => typeof v === 'function' ? v() : v;
  function autopilot(sub, dt, interact) {
    const wp = ROUTE[Math.min(sub.wp, ROUTE.length - 1)];
    const tx = val(wp.x), ty = val(wp.y);
    const ex = tx - sub.x, ey = ty - sub.y, dist = Math.hypot(ex, ey);
    const vmax = wp.v || 3.0, kp = .045, kv = .55;
    let vdx = ex * kp, vdy = ey * kp; const vm = Math.hypot(vdx, vdy);
    if (vm > vmax) { vdx *= vmax / vm; vdy *= vmax / vm; }
    // obstacle avoidance: repulsive field around each jellyfish
    for (const j of JELLY) {
      const p = jellyPos(j), jx = sub.x - p.x, jy = sub.y - (p.y + 10), jd = Math.hypot(jx, jy) || 1, R = 130;
      if (jd < R) { const k = 4.2 * (1 - jd / R); vdx += jx / jd * k; vdy += jy / jd * k; }
    }
    sub.ux = Math.max(-1, Math.min(1, (vdx - sub.vx) * kv));
    sub.uy = Math.max(-1, Math.min(1, (vdy - sub.vy) * kv + BUOY / THRUST));   // feed-forward against buoyancy
    if (dist < (wp.tol || 28)) {
      if (wp.hold) { sub.hold += dt; if (sub.hold < wp.hold || Math.hypot(sub.vx, sub.vy) > .7) return; }
      sub.hold = 0;
      if (wp.act === 'drop' && interact) drop(sub);
      if (sub.wp < ROUTE.length - 1) sub.wp++;
    }
  }

  /* ---------------- physics ---------------- */
  const THRUST = .28, DRAG = .05, QDRAG = .0009, BUOY = .012;
  const current = (x, y) => (x > 700 && x < 2000) ? .036 * Math.sin(S.t * .5 + y * .012) + .014 * Math.sin(S.t * 1.9 + x * .01) : 0;
  const currentY = (x) => (x > 1900 && x < 2280) ? .016 * Math.sin(S.t * .7) : 0;
  function step(sub, dt, interact) {
    sub.vx += (sub.ux * THRUST + current(sub.x, sub.y)) * dt;
    sub.vy += (sub.uy * THRUST - BUOY + currentY(sub.x)) * dt;
    const sp = Math.hypot(sub.vx, sub.vy);
    sub.vx -= (sub.vx * DRAG + sub.vx * sp * QDRAG) * dt;
    sub.vy -= (sub.vy * DRAG + sub.vy * sp * QDRAG) * dt;
    const px = sub.x;
    sub.x += sub.vx * dt; sub.y += sub.vy * dt;
    if (Math.abs(sub.ux) > .15) sub.face = sub.ux > 0 ? 1 : -1;
    // bounds
    if (sub.y < SURF + 2) { sub.y = SURF + 2; sub.vy = Math.max(0, sub.vy); }
    if (sub.y > FLOOR - SUB_H / 2) { sub.y = FLOOR - SUB_H / 2; if (sub.vy > 1.2 && interact) bump(); sub.vy = Math.min(0, sub.vy) * -.2; }
    if (sub.x < 40) { sub.x = 40; sub.vx = 0; } if (sub.x > WW - 40) { sub.x = WW - 40; sub.vx = 0; }
    if (!interact) return;
    // gate bar (solid) + pass check
    collide(sub, BAR);
    if (px < GX && sub.x >= GX && !S.gate) {
      if (sub.y - SUB_H / 2 > BAR.y + BAR.h) { S.gate = true; toast('Gate ✓'); updTasks(); }
      else if (sub.y < BAR.y) toast('Over the gate — doesn’t count');
    }
    // flare
    if (!S.flare.down) {
      const fr = { x: FX - 6, y: 360, w: 12, h: FLOOR - 360 };
      if (overlap(sub, fr)) {
        if (Math.abs(sub.vx) > 1.6) { S.flare.down = true; S.flare.dir = Math.sign(sub.vx); toast('Flare down ✓'); updTasks(); }
        else { collide(sub, fr); toast('Too slow — ram it harder'); }
      }
    }
    // bucket walls
    collide(sub, { x: BX - BI - 7, y: 498, w: 7, h: FLOOR - 498 });
    collide(sub, { x: BX + BI, y: 498, w: 7, h: FLOOR - 498 });
    // jellyfish
    for (const j of JELLY) {
      const p = jellyPos(j), a = rect(sub), cy = p.y + 10;
      const qx = Math.max(a.x, Math.min(p.x, a.x + a.w)), qy = Math.max(a.y, Math.min(cy, a.y + a.h));
      if (Math.hypot(qx - p.x, qy - cy) < 24 && S.stingCd <= 0) {
        S.stingCd = 1; S.stings++; S.pen += PEN; S.hull -= 20; shake = 8;
        const dx = sub.x - p.x, dy = sub.y - cy, m = Math.hypot(dx, dy) || 1; sub.vx = dx / m * 2.4; sub.vy = dy / m * 2.4;
        toast(`Stung! +${PEN} s, hull −20%`);
      }
    }
    if (S.hull <= 0 && phase === 'play') { S.hull = 0; finish('hull'); return; }
    // buoy
    if (!S.buoy) {
      const b = buoyPos();
      if (Math.hypot(sub.x - b.x, sub.y - b.y) < 24 + 16) { S.buoy = true; S.buoyOff.vx += sub.vx * 1.4; S.buoyOff.vy += sub.vy * 1.4; toast('Buoy touched ✓'); updTasks(); }
    }
    // surface in zone
    if (!S.surface && sub.x > ZX && sub.y <= SURF + 4) { S.surface = true; updTasks(); finish('surface'); }
    else if (S.bat <= 0 && sub.y <= SURF + 4) finish('battery');
    else if (sub.x <= ZX && sub.y <= SURF + 4 && S.t > 2 && S.msgT <= 0) toast('Surface over the pinger →');
  }
  const rect = s => ({ x: s.x - SUB_W / 2, y: s.y - SUB_H / 2, w: SUB_W, h: SUB_H });
  const overlap = (s, r) => { const a = rect(s); return a.x < r.x + r.w && a.x + a.w > r.x && a.y < r.y + r.h && a.y + a.h > r.y; };
  function collide(s, r) {
    if (!overlap(s, r)) return;
    const a = rect(s);
    const dx1 = r.x + r.w - a.x, dx2 = a.x + a.w - r.x, dy1 = r.y + r.h - a.y, dy2 = a.y + a.h - r.y;
    const m = Math.min(dx1, dx2, dy1, dy2);
    if (m === dx1) { s.x += dx1; s.vx = Math.abs(s.vx) * .3; } else if (m === dx2) { s.x -= dx2; s.vx = -Math.abs(s.vx) * .3; }
    else if (m === dy1) { s.y += dy1; s.vy = Math.abs(s.vy) * .3; } else { s.y -= dy2; s.vy = -Math.abs(s.vy) * .3; }
    bump();
  }
  function bump() { if (S.bumpCd > 0) return; S.bumpCd = .6; S.bumps++; S.pen += PEN; S.hull -= 12; shake = 6; }
  let shake = 0;
  function drop(sub) {
    if (S.markers <= 0 || S.bucket) return;
    S.markers--; S.balls.push({ x: sub.x, y: sub.y + 10, vx: sub.vx * .6, vy: sub.vy * .5 + .5, rest: false, inB: false });
  }
  function stepBalls(dt) {
    for (const b of S.balls) {
      if (b.rest) continue;
      b.vy += .09 * dt; b.vx *= 1 - .03 * dt; b.vy *= 1 - .02 * dt;
      const py = b.y; b.x += b.vx * dt; b.y += b.vy * dt;
      if (py < 498 && b.y >= 498) {
        if (b.x > BX - BI && b.x < BX + BI) { b.inB = true; }
        else if (Math.abs(b.x - (BX - BI - 3.5)) < 6 || Math.abs(b.x - (BX + BI + 3.5)) < 6) { b.vx *= -.5; b.vy *= -.3; }
      }
      if (b.y > FLOOR - 7) {
        b.y = FLOOR - 7; b.rest = true;
        if (b.inB && !S.bucket) { S.bucket = true; toast('Marker in the bucket ✓'); updTasks(); }
        else if (!b.inB) toast(S.markers ? `Missed — ${S.markers} marker left` : 'Out of markers');
      }
    }
  }

  /* ---------------- input ---------------- */
  const keys = new Set();
  const visible = { v: false };
  new IntersectionObserver(es => { visible.v = es[0].isIntersecting; document.body.classList.toggle('in-game', visible.v); }, { threshold: .35 }).observe(cv);
  const GAME_KEYS = ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'KeyW', 'KeyA', 'KeyS', 'KeyD', 'Space', 'KeyR'];
  addEventListener('keydown', e => {
    if (phase !== 'play' || (!visible.v && document.activeElement !== cv) || !GAME_KEYS.includes(e.code)) return;
    e.preventDefault();
    if (e.code === 'Space' && !e.repeat && mode === 'fly') drop(S.actor);
    else if (e.code === 'KeyR') start('fly');
    keys.add(e.code);
  });
  addEventListener('keyup', e => keys.delete(e.code));
  addEventListener('blur', () => keys.clear());
  // touch joystick
  const stick = $('simStick'); const joy = { on: false, ox: 0, oy: 0, x: 0, y: 0 };
  cv.addEventListener('pointerdown', e => {
    if (phase !== 'play' || mode !== 'fly' || e.pointerType === 'mouse') return;
    const r = cv.getBoundingClientRect(); joy.on = true; joy.ox = e.clientX; joy.oy = e.clientY; joy.x = joy.y = 0;
    stick.style.left = e.clientX - r.left + 'px'; stick.style.top = e.clientY - r.top + 'px'; stick.classList.add('on');
    cv.setPointerCapture(e.pointerId);
  });
  cv.addEventListener('pointermove', e => {
    if (!joy.on) return;
    let dx = e.clientX - joy.ox, dy = e.clientY - joy.oy; const m = Math.hypot(dx, dy), R = 42;
    if (m > R) { dx *= R / m; dy *= R / m; }
    joy.x = dx / R; joy.y = dy / R; stick.style.setProperty('--sx', dx + 'px'); stick.style.setProperty('--sy', dy + 'px');
  });
  const endJoy = () => { joy.on = false; joy.x = joy.y = 0; stick.classList.remove('on'); };
  cv.addEventListener('pointerup', endJoy); cv.addEventListener('pointercancel', endJoy);
  $('simDrop').addEventListener('pointerdown', e => { e.preventDefault(); if (phase === 'play' && mode === 'fly') drop(S.actor); });
  if (touch) $('goText').textContent = 'Drag on the pool to steer, tap DROP over the bucket. Dodge the jellyfish, watch your battery, and every hit costs 3 s.';

  /* ---------------- flow ---------------- */
  const modeBtns = [...root.querySelectorAll('[data-gm]')];
  const setModeBtn = m => modeBtns.forEach(b => b.classList.toggle('on', b.dataset.gm === m));
  function start(m) {
    reset(m); phase = 'play'; over.hidden = true; root.classList.toggle('playing', m === 'fly'); setModeBtn(m);
    if (m === 'fly') cv.focus({ preventScroll: true });
  }
  modeBtns.forEach(b => b.addEventListener('click', () => start(b.dataset.gm)));
  $('goStart').addEventListener('click', () => start('fly'));
  $('goWatch').addEventListener('click', () => start('auto'));
  /* ---------------- leaderboard (stored on this device) ---------------- */
  const board = {
    load() { try { const a = JSON.parse(store.get('atal_board') || '[]'); return Array.isArray(a) ? a.filter(e => e && typeof e.t === 'number') : []; } catch { return []; } },
    save(a) { store.set('atal_board', JSON.stringify(a.slice(0, 10))); },
    add(e) { const a = board.load(); a.push(e); a.sort((x, y) => x.t - y.t); board.save(a); return a.indexOf(e) < 10 ? a.findIndex(x => x.id === e.id) + 1 : 0; }
  };
  (() => { const old = +store.get('atal_best'); if (old && !board.load().length) board.save([{ id: 'old', n: 'You', t: old, p: 0, d: '' }]); })();
  const refT = () => +store.get('atal_ghost') || null;
  const fmtDate = iso => { try { return iso ? new Date(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'short' }) : ''; } catch { return ''; } };
  function renderBoard(hl) {
    const list = $('boardList'); if (!list) return;
    const rows = board.load().map(e => ({ ...e }));
    const ref = refT(); if (ref) rows.push({ id: 'bot', n: 'ATAL autopilot', t: ref, p: 0, bot: true });
    rows.sort((x, y) => x.t - y.t);
    list.textContent = '';
    if (!rows.some(r => !r.bot)) { const li = document.createElement('li'); li.className = 'empty'; li.textContent = 'No finished dives yet. Complete all five tasks to get on the board.'; list.appendChild(li); }
    let rank = 0;
    rows.slice(0, 11).forEach(r => {
      const li = document.createElement('li'); if (!r.bot) rank++;
      li.className = (r.bot ? 'bot' : '') + (r.id === hl ? ' me' : '');
      const c = (cls, txt) => { const sp = document.createElement('span'); sp.className = cls; sp.textContent = txt; li.appendChild(sp); };
      c('rk', r.bot ? '◆' : String(rank).padStart(2, '0')); c('nm', r.n); c('tm', r.t.toFixed(1) + ' s'); c('pn', r.bot ? 'reference' : (r.p ? `+${r.p} s pen` : 'clean') + (r.d ? ' · ' + fmtDate(r.d) : ''));
      list.appendChild(li);
    });
  }
  renderBoard();
  let pending = null;
  $('goSave') && $('goSave').addEventListener('submit', e => {
    e.preventDefault(); if (!pending) return;
    const n = ($('goName').value || '').trim().replace(/\s+/g, ' ').slice(0, 14) || 'Anonymous';
    store.set('atal_name', n);
    const entry = { ...pending, n }; pending = null;
    const r = board.add(entry);
    $('goSave').hidden = true;
    $('goRank').textContent = r ? `Saved — #${r} on this device's board.` : 'Saved, but outside the top 10.';
    renderBoard(entry.id);
  });

  function finish(reason) {
    if (phase === 'attract') { setTimeout(() => { if (phase === 'attract') reset('auto'); }, 1500); return; }
    if (phase !== 'play') return;
    phase = 'end'; root.classList.remove('playing');
    const tasks = ['gate', 'bucket', 'buoy', 'surface'].filter(k => S[k]).length + (S.flare.down ? 1 : 0);
    const total = S.clock + S.pen;
    const ghost = S.ghostT;
    if (ghost && mode === 'fly') { store.set('atal_ghost', ghost.toFixed(1)); }
    const pens = `${S.bumps} bump${S.bumps === 1 ? '' : 's'}, ${S.stings} sting${S.stings === 1 ? '' : 's'} (+${S.pen} s) · hull ${Math.max(0, S.hull)}% · battery ${Math.max(0, S.bat).toFixed(0)}%`;
    $('goSave').hidden = true; $('goRank').textContent = ''; pending = null;
    setTimeout(() => {
      over.hidden = false;
      if (mode === 'auto') {
        $('goKick').textContent = 'Autopilot run';
        $('goTitle').textContent = reason === 'surface' ? `Mission complete in ${total.toFixed(1)} s` : 'Autopilot lost the vehicle';
        $('goText').textContent = `${tasks}/5 tasks. ${pens}. Think you can fly it faster?`;
      } else if (reason === 'hull' || reason === 'battery') {
        $('goKick').textContent = reason === 'hull' ? 'Hull breach' : 'Battery flat';
        $('goTitle').textContent = 'Mission aborted';
        $('goText').textContent = reason === 'hull' ? `Too many hits, so ATAL surfaced for repairs. ${tasks}/5 tasks done. ${pens}.` : `ATAL ran out of charge and floated up short of the pinger. Full thrust drains the battery fast. ${tasks}/5 tasks done.`;
      } else {
        const full = tasks === 5;
        const rows = board.load(), best = rows.length ? rows[0].t : Infinity;
        const win = full && ghost && total < ghost;
        $('goKick').textContent = full ? (win ? 'You beat the autopilot' : 'Mission complete') : `Surfaced with ${tasks}/5 tasks`;
        $('goTitle').textContent = full ? `${total.toFixed(1)} s` : 'Incomplete mission';
        $('goText').innerHTML = `<span class="results"><span class="${win ? 'win' : 'lose'}"><b>${total.toFixed(1)} s</b>you</span><span><b>${ghost ? ghost.toFixed(1) + ' s' : '—'}</b>autopilot</span><span><b>${best === Infinity ? '—' : best.toFixed(1) + ' s'}</b>board best</span></span>${pens}`;
        if (full) {
          pending = { id: Date.now().toString(36), t: +total.toFixed(1), p: S.pen, d: new Date().toISOString() };
          const prospective = rows.filter(r => r.t <= pending.t).length + 1;
          $('goRank').textContent = prospective <= 10 ? `That's #${prospective} on this device. Sign the board:` : 'Outside the top 10 — dive again.';
          if (prospective <= 10) { $('goSave').hidden = false; $('goName').value = store.get('atal_name') || ''; setTimeout(() => $('goName').focus({ preventScroll: true }), 50); }
        }
      }
      $('goStart').textContent = 'Dive again';
    }, 900);
  }

  /* ---------------- render helpers ---------------- */
  const X = x => (x - camX) * SC, Y = y => y * SC;
  function drawWorld(t) {
    ctx.save(); ctx.scale(SC, SC); ctx.translate(-camX, 0);
    // air + water
    ctx.fillStyle = '#04101c'; ctx.fillRect(camX, 0, W / SC, SURF);
    const g = ctx.createLinearGradient(0, SURF, 0, FLOOR);
    g.addColorStop(0, '#0f5868'); g.addColorStop(.5, '#0a3846'); g.addColorStop(1, '#05202b');
    ctx.fillStyle = g; ctx.fillRect(camX, SURF, W / SC, FLOOR - SURF);
    // back wall tiles (parallax)
    ctx.strokeStyle = 'rgba(160,230,240,.05)'; ctx.lineWidth = 1; ctx.beginPath();
    const off = camX * .4;
    for (let x = Math.floor((camX - off) / 60) * 60; x < camX + W / SC + 60; x += 60) { ctx.moveTo(x + off % 60, SURF); ctx.lineTo(x + off % 60, FLOOR); }
    for (let y = SURF; y < FLOOR; y += 60) { ctx.moveTo(camX, y); ctx.lineTo(camX + W / SC, y); }
    ctx.stroke();
    // light shafts
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 14; i++) {
      const sx = i * 200 + Math.sin(t * .3 + i) * 30; if (sx < camX - 200 || sx > camX + W / SC + 200) continue;
      const lg = ctx.createLinearGradient(0, SURF, 0, FLOOR - 100); lg.addColorStop(0, 'rgba(170,240,255,.10)'); lg.addColorStop(1, 'rgba(170,240,255,0)');
      ctx.fillStyle = lg; ctx.beginPath(); ctx.moveTo(sx, SURF); ctx.lineTo(sx + 40, SURF); ctx.lineTo(sx + 130, FLOOR - 100); ctx.lineTo(sx + 50, FLOOR - 100); ctx.fill();
    }
    ctx.restore();
    // surface waves
    ctx.strokeStyle = 'rgba(190,240,255,.55)'; ctx.lineWidth = 2; ctx.beginPath();
    for (let x = camX - 10; x < camX + W / SC + 10; x += 10) { const y = SURF + Math.sin(x * .03 + t * 2) * 2.2 + Math.sin(x * .011 - t) * 1.5; x === camX - 10 ? ctx.moveTo(x, y) : ctx.lineTo(x, y); }
    ctx.stroke();
    // floor + lane lines
    ctx.fillStyle = '#0a2a33'; ctx.fillRect(camX, FLOOR, W / SC, WH - FLOOR);
    ctx.fillStyle = 'rgba(0,0,0,.45)'; for (let x = 0; x < WW; x += 400) ctx.fillRect(x + 150, FLOOR, 100, 6);
    ctx.strokeStyle = 'rgba(160,230,240,.12)'; ctx.beginPath(); for (let x = 0; x < WW; x += 40) { ctx.moveTo(x, FLOOR); ctx.lineTo(x, WH); } ctx.stroke();
    // start pad
    ctx.fillStyle = 'rgba(70,227,255,.5)'; ctx.font = '600 12px "JetBrains Mono", monospace'; ctx.fillText('START', 90, FLOOR + 22);
    // gate: back post, bar, front post
    ctx.fillStyle = '#9c4f1c'; ctx.fillRect(GX + 8, BAR.y + BAR.h, 8, FLOOR - BAR.y - BAR.h);
    ctx.fillStyle = '#1b1f24'; ctx.fillRect(BAR.x, BAR.y, BAR.w, BAR.h);
    ctx.fillStyle = '#e8772e'; ctx.fillRect(GX - 14, BAR.y + BAR.h, 9, FLOOR - BAR.y - BAR.h);
    // flare (falls over)
    const fa = S.flare.down ? Math.min(1.45, (S.flare.ang += .05)) * S.flare.dir : 0;
    ctx.save(); ctx.translate(FX, FLOOR); ctx.rotate(fa);
    ctx.fillStyle = '#c72d22'; ctx.fillRect(-5, -(FLOOR - 360), 10, FLOOR - 360);
    ctx.fillStyle = '#ffd0c8'; ctx.fillRect(-5, -(FLOOR - 360), 10, 6);
    ctx.restore(); ctx.fillStyle = '#333'; ctx.fillRect(FX - 14, FLOOR - 4, 28, 4);
    // bucket
    ctx.fillStyle = '#1d4ed8'; ctx.fillRect(BX - BI - 7, 498, 7, FLOOR - 498); ctx.fillRect(BX + BI, 498, 7, FLOOR - 498); ctx.fillRect(BX - BI - 7, FLOOR - 6, BI * 2 + 14, 6);
    ctx.fillStyle = 'rgba(29,78,216,.25)'; ctx.fillRect(BX - BI, 498, BI * 2, FLOOR - 504);
    // buoy + tether
    const b = buoyPos();
    ctx.strokeStyle = 'rgba(220,240,255,.35)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(UX, FLOOR); ctx.quadraticCurveTo(UX + (b.x - UX) * .5 + 10, (FLOOR + b.y) / 2, b.x, b.y + 22); ctx.stroke();
    const bg = ctx.createRadialGradient(b.x - 7, b.y - 7, 2, b.x, b.y, 24); bg.addColorStop(0, '#ffb27a'); bg.addColorStop(1, '#c2410c');
    ctx.fillStyle = bg; ctx.beginPath(); ctx.arc(b.x, b.y, 22, 0, 6.283); ctx.fill();
    // surface zone + pinger rings
    ctx.setLineDash([6, 8]); ctx.strokeStyle = 'rgba(74,222,128,.35)'; ctx.beginPath(); ctx.moveTo(ZX, SURF); ctx.lineTo(ZX, FLOOR); ctx.stroke(); ctx.setLineDash([]);
    ctx.fillStyle = 'rgba(74,222,128,.08)'; ctx.fillRect(ZX, SURF, WW - ZX, FLOOR - SURF);
    const pxp = ZX + 140;
    ctx.fillStyle = '#4ade80'; ctx.fillRect(pxp - 8, FLOOR - 10, 16, 10);
    for (let k = 0; k < 3; k++) { const r = ((t * 60 + k * 70) % 210); ctx.strokeStyle = `rgba(74,222,128,${.4 * (1 - r / 210)})`; ctx.beginPath(); ctx.arc(pxp, FLOOR - 10, r, Math.PI, 0); ctx.stroke(); }
    // markers
    for (const m of S.balls) { ctx.fillStyle = '#facc15'; ctx.beginPath(); ctx.arc(m.x, m.y, 6, 0, 6.283); ctx.fill(); }
    // jellyfish hazards (glowing, so you can spot them in the dark)
    for (const j of JELLY) {
      const p = jellyPos(j), pu = Math.sin(t * 3 + j.ph);
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      const gl = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, 60); gl.addColorStop(0, 'rgba(232,121,249,.28)'); gl.addColorStop(1, 'rgba(232,121,249,0)');
      ctx.fillStyle = gl; ctx.beginPath(); ctx.arc(p.x, p.y, 60, 0, 6.283); ctx.fill();
      ctx.restore();
      const bw = 20 * (1 + .12 * pu), bh = 15 * (1 - .1 * pu);
      ctx.fillStyle = 'rgba(232,121,249,.45)'; ctx.strokeStyle = 'rgba(245,190,255,.9)'; ctx.lineWidth = 1.4;
      ctx.beginPath(); ctx.ellipse(p.x, p.y, bw, bh, 0, Math.PI, 0); ctx.quadraticCurveTo(p.x, p.y + 5, p.x - bw, p.y); ctx.fill(); ctx.stroke();
      ctx.strokeStyle = 'rgba(245,190,255,.55)'; ctx.lineWidth = 1;
      for (let k = 0; k < 5; k++) { const tx = p.x - bw * .7 + k * bw * .35; ctx.beginPath(); ctx.moveTo(tx, p.y + 1); for (let u = 1; u <= 6; u++) ctx.lineTo(tx + Math.sin(t * 2.5 + j.ph + u * .7 + k) * (1.5 + u * .7), p.y + u * 6); ctx.stroke(); }
    }
    // marine snow drifting with the current
    for (const p of snow) {
      p.x += (current(p.x, p.y) * 20 + .05) * (reduced ? 0 : 1); p.y += .05 * (reduced ? 0 : 1);
      if (p.x > WW) p.x = 0; if (p.y > FLOOR) p.y = SURF + 5;
      if (p.x < camX - 10 || p.x > camX + W / SC + 10) continue;
      ctx.fillStyle = `rgba(210,240,250,${.15 + p.z * .35})`; ctx.fillRect(p.x, p.y, 1 + p.z * 1.6, 1 + p.z * 1.6);
    }
    ctx.restore();
  }
  function drawSub(sub, alpha, tint) {
    if (!window.drawAUV) return;
    const pitch = Math.max(-.35, Math.min(.35, sub.vy * .08)) * sub.face;
    ctx.save(); ctx.globalAlpha = alpha; ctx.translate(X(sub.x), Y(sub.y)); ctx.scale(SC * .72 * sub.face, SC * .72); ctx.rotate(pitch * sub.face);
    if (tint) { ctx.filter = 'hue-rotate(160deg) saturate(1.4)'; }
    window.drawAUV(ctx, S.t * 30 * (Math.abs(sub.ux) + Math.abs(sub.uy) + .2), 1);
    ctx.restore();
  }
  function fogLayer(subs) {
    fg.setTransform(DPR, 0, 0, DPR, 0, 0);
    fg.globalCompositeOperation = 'source-over'; fg.clearRect(0, 0, W, H);
    const dg = fg.createLinearGradient(0, Y(SURF), 0, Y(FLOOR));
    dg.addColorStop(0, 'rgba(1,6,14,.22)'); dg.addColorStop(.3, 'rgba(1,6,14,.68)'); dg.addColorStop(1, 'rgba(1,6,14,.93)');
    fg.fillStyle = dg; fg.fillRect(0, Y(SURF), W, H);
    fg.globalCompositeOperation = 'destination-out';
    for (let [sub, k] of subs) {
      if (sub === S.actor && S.bat < 15) k *= S.bat <= 0 ? .25 : (.7 + .3 * Math.sin(S.t * 40));
      const sx = X(sub.x), sy = Y(sub.y), dir = sub.face, ang = Math.max(-.35, Math.min(.35, sub.vy * .08));
      const L = 260 * SC, half = 100 * SC, nx = sx + dir * 30 * SC;
      const ex = nx + dir * L * Math.cos(ang), ey = sy + L * Math.sin(ang) * dir;
      const cg = fg.createLinearGradient(nx, sy, ex, ey); cg.addColorStop(0, `rgba(0,0,0,${k})`); cg.addColorStop(1, 'rgba(0,0,0,0)');
      fg.fillStyle = cg; fg.beginPath(); fg.moveTo(nx, sy - 6 * SC); fg.lineTo(ex, ey - half); fg.lineTo(ex, ey + half); fg.lineTo(nx, sy + 6 * SC); fg.closePath(); fg.fill();
      const rg = fg.createRadialGradient(sx, sy, 0, sx, sy, 90 * SC); rg.addColorStop(0, `rgba(0,0,0,${k * .9})`); rg.addColorStop(1, 'rgba(0,0,0,0)');
      fg.fillStyle = rg; fg.beginPath(); fg.arc(sx, sy, 90 * SC, 0, 6.283); fg.fill();
    }
    ctx.drawImage(fog, 0, 0, W, H);
    // warm lamp glow over the lit cone
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    for (const [sub, k] of subs) {
      const sx = X(sub.x), sy = Y(sub.y), dir = sub.face, nx = sx + dir * 30 * SC;
      const lg = ctx.createLinearGradient(nx, sy, nx + dir * 260 * SC, sy);
      lg.addColorStop(0, `rgba(255,214,150,${.16 * k})`); lg.addColorStop(1, 'rgba(255,214,150,0)');
      ctx.fillStyle = lg; ctx.beginPath(); ctx.moveTo(nx, sy - 5 * SC); ctx.lineTo(nx + dir * 260 * SC, sy - 90 * SC); ctx.lineTo(nx + dir * 260 * SC, sy + 90 * SC); ctx.lineTo(nx, sy + 5 * SC); ctx.fill();
    }
    ctx.restore();
  }
  function beacons(t) {
    const list = [];
    if (!S.gate) list.push([GX, BAR.y - 18, 1]);
    if (!S.flare.down) list.push([FX, 344, 2]);
    if (!S.bucket) list.push([BX, 482, 3]);
    if (!S.buoy) { const b = buoyPos(); list.push([b.x, b.y - 38, 4]); }
    list.push([ZX + 140, SURF + 26, 5]);
    ctx.font = `600 ${Math.max(10, 12 * SC)}px "JetBrains Mono", monospace`; ctx.textAlign = 'center';
    for (const [x, y, n] of list) {
      const a = .45 + .35 * Math.sin(t * 3 + n);
      ctx.fillStyle = `rgba(255,192,97,${a})`; ctx.beginPath(); ctx.arc(X(x), Y(y), 9 * SC + 3, 0, 6.283); ctx.fill();
      ctx.fillStyle = '#1b1204'; ctx.fillText(n, X(x), Y(y) + 4 * SC);
    }
    ctx.textAlign = 'left';
  }
  function perception(sub) {
    const tg = [];
    if (!S.gate) tg.push(['gate', GX - 22, BAR.y - 4, 44, FLOOR - BAR.y]);
    if (!S.flare.down) tg.push(['flare', FX - 12, 354, 24, FLOOR - 354]);
    if (!S.bucket) tg.push(['bucket', BX - 46, 492, 92, FLOOR - 488]);
    const b = buoyPos(); if (!S.buoy) tg.push(['buoy', b.x - 28, b.y - 28, 56, 56]);
    for (const j of JELLY) { const p = jellyPos(j); tg.push(['jelly', p.x - 26, p.y - 20, 52, 58]); }
    ctx.font = '500 11px "JetBrains Mono", monospace';
    for (const [n, x, y, w, h] of tg) {
      const cx = x + w / 2, cy = y + h / 2, d = Math.hypot(cx - sub.x, cy - sub.y);
      if (d > 420 || Math.sign(cx - sub.x) !== sub.face) continue;
      const conf = (.97 - d / 2400 + Math.random() * .02).toFixed(2), c = n === 'jelly' ? '#f0abfc' : n === 'buoy' || n === 'flare' ? '#ffc061' : '#46e3ff';
      ctx.strokeStyle = c; ctx.lineWidth = 1.5; ctx.strokeRect(X(x), Y(y), w * SC, h * SC);
      const lbl = `${n} ${conf}`, tw = ctx.measureText(lbl).width + 8;
      ctx.fillStyle = c; ctx.fillRect(X(x), Y(y) - 16, tw, 16); ctx.fillStyle = '#021016'; ctx.fillText(lbl, X(x) + 4, Y(y) - 4);
    }
    // planned path
    ctx.setLineDash([4, 6]); ctx.strokeStyle = 'rgba(70,227,255,.45)'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(X(sub.x), Y(sub.y));
    for (let i = sub.wp; i < Math.min(ROUTE.length, sub.wp + 4); i++) ctx.lineTo(X(val(ROUTE[i].x)), Y(val(ROUTE[i].y)));
    ctx.stroke(); ctx.setLineDash([]);
  }
  function hud(sub) {
    const depth = Math.max(0, (sub.y - SURF) / (FLOOR - SURF) * 3);
    ctx.font = '500 12px "JetBrains Mono", monospace'; ctx.fillStyle = 'rgba(232,242,255,.9)';
    const T = S.clock + S.pen;
    ctx.fillText(`T+${T.toFixed(1)} s${S.pen ? `  (+${S.pen})` : ''}`, 12, 22);
    ctx.fillText(`${mode === 'auto' ? 'AUTOPILOT' : 'MANUAL'} · markers ${S.markers}`, 12, 40);
    // hull + battery bars
    const bar = (lbl, v, y, warn) => {
      ctx.font = '500 10px "JetBrains Mono", monospace'; ctx.fillStyle = 'rgba(232,242,255,.6)'; ctx.fillText(lbl, 12, y + 5);
      ctx.fillStyle = 'rgba(232,242,255,.12)'; ctx.fillRect(44, y, 72, 5);
      ctx.fillStyle = v < warn ? (S.t * 4 % 2 < 1 ? '#f87171' : '#7f1d1d') : v < 50 ? '#ffc061' : '#4ade80'; ctx.fillRect(44, y, 72 * Math.max(0, v) / 100, 5);
    };
    bar('HULL', S.hull, 50, 30); bar('BATT', S.bat, 61, 15);
    ctx.font = '500 12px "JetBrains Mono", monospace'; ctx.fillStyle = 'rgba(232,242,255,.9)';
    ctx.textAlign = 'right';
    ctx.fillText(`DEPTH ${depth.toFixed(2)} m`, W - 12, 22);
    ctx.fillText(`SPEED ${(Math.hypot(sub.vx, sub.vy) * .09).toFixed(2)} m/s`, W - 12, 40);
    if (mode === 'fly' && S.ghostT == null) ctx.fillText(`autopilot T+${S.clock.toFixed(1)}`, W - 12, 58);
    else if (mode === 'fly') ctx.fillText(`autopilot ${S.ghostT.toFixed(1)} s ✓`, W - 12, 58);
    ctx.textAlign = 'left';
    // minimap
    const narrow = W < 520, mw = narrow ? W - 24 : Math.min(260, W * .38), mh = narrow ? 18 : 26, mx = (W - mw) / 2, my = narrow ? 76 : 10, k = mw / WW;
    ctx.fillStyle = 'rgba(1,7,17,.65)'; ctx.fillRect(mx, my, mw, mh); ctx.strokeStyle = 'rgba(120,190,255,.25)'; ctx.strokeRect(mx, my, mw, mh);
    const yy = y => my + (y - SURF) / (FLOOR - SURF) * mh;
    [[GX, S.gate], [FX, S.flare.down], [BX, S.bucket], [UX, S.buoy], [ZX + 140, S.surface]].forEach(([x, d]) => { ctx.fillStyle = d ? '#4ade80' : '#ffc061'; ctx.fillRect(mx + x * k - 1.5, my + 3, 3, mh - 6); });
    ctx.strokeStyle = 'rgba(232,242,255,.5)'; ctx.strokeRect(mx + camX * k, my, (W / SC) * k, mh);
    if (mode === 'fly') { ctx.fillStyle = 'rgba(70,227,255,.6)'; ctx.beginPath(); ctx.arc(mx + S.ghost.x * k, yy(S.ghost.y), 2.5, 0, 6.283); ctx.fill(); }
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(mx + sub.x * k, yy(sub.y), 3, 0, 6.283); ctx.fill();
    // toast
    if (S.msgT > 0) {
      ctx.font = `600 ${Math.max(13, 16 * SC)}px "Space Grotesk", sans-serif`; ctx.textAlign = 'center';
      ctx.globalAlpha = Math.min(1, S.msgT * 2); ctx.fillStyle = S.msg.includes('✓') ? '#4ade80' : '#ffc061';
      ctx.fillText(S.msg, W / 2, my + mh + 28); ctx.globalAlpha = 1; ctx.textAlign = 'left';
    }
  }

  /* ---------------- loop ---------------- */
  reset('auto');
  let last = performance.now(), running = false;
  new IntersectionObserver(es => { running = es[0].isIntersecting; last = performance.now(); }, { rootMargin: '200px' }).observe(cv);
  function frame(now) {
    requestAnimationFrame(frame);
    if (!running || document.documentElement.dataset.theme === 'hogwarts') return;
    const dts = Math.max(0, Math.min(.05, (now - last) / 1000)); last = now; const dt = dts * 60;
    S.t += dts; S.msgT -= dts; S.bumpCd -= dts; S.stingCd -= dts; shake *= .85;
    const actor = S.actor;
    if (phase !== 'end') {
      // controls
      if (actor.auto) autopilot(actor, dts, true);
      else {
        const kx = (keys.has('ArrowRight') || keys.has('KeyD') ? 1 : 0) - (keys.has('ArrowLeft') || keys.has('KeyA') ? 1 : 0);
        const ky = (keys.has('ArrowDown') || keys.has('KeyS') ? 1 : 0) - (keys.has('ArrowUp') || keys.has('KeyW') ? 1 : 0);
        actor.ux = kx || joy.x; actor.uy = ky || joy.y;
        if (!S.started && (actor.ux || actor.uy)) S.started = true;
      }
      // battery: idle load + thrust load; when flat the motors cut and ATAL floats up
      if (S.bat <= 0) { actor.ux = actor.uy = 0; if (!S.dead) { S.dead = 1; toast('Battery flat — floating up'); } }
      else if ((S.started || actor.auto) && phase === 'play') S.bat = Math.max(0, S.bat - dts * (.5 + 1.5 * (Math.abs(actor.ux) + Math.abs(actor.uy))));
      if (phase === 'attract') S.bat = 100;
      if (S.started || actor.auto) S.clock += dts;
      step(actor, dt, true);
      if (mode === 'fly') {
        if (S.started) { autopilot(S.ghost, dts, false); step(S.ghost, dt, false); }
        if (S.ghostT == null && S.ghost.wp === ROUTE.length - 1 && S.ghost.y <= SURF + 4) S.ghostT = S.clock;
      }
      stepBalls(dt);
      // buoy spring
      const o = S.buoyOff; o.vx += (-o.x * .02 - o.vx * .05) * dt; o.vy += (-o.y * .02 - o.vy * .05) * dt; o.x += o.vx * dt; o.y += o.vy * dt;
    }
    // camera
    const targetCam = Math.max(0, Math.min(WW - W / SC, actor.x - (W / SC) * .4));
    camX += (targetCam - camX) * .08;
    // render
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    ctx.save(); if (shake > .3) ctx.translate((Math.random() - .5) * shake, (Math.random() - .5) * shake);
    ctx.clearRect(0, 0, W, H);
    drawWorld(S.t);
    if (mode === 'fly') drawSub(S.ghost, .4, true);
    drawSub(actor, 1, false);
    fogLayer(mode === 'fly' ? [[actor, 1], [S.ghost, .35]] : [[actor, 1]]);
    beacons(S.t);
    if (mode === 'auto') perception(actor);
    hud(actor);
    ctx.restore();
  }
  requestAnimationFrame(frame);
  // test hook: ?simdebug exposes a fixed-step driver (for headless checks)
  if (/[?&]simdebug/.test(location.search)) window.ATALSim = {
    start, get S() { return S; }, get phase() { return phase; }, keys,
    run(sec) { running = true; let t = last; for (let i = 0; i < sec * 60; i++) { t += 1000 / 60; frame(t); } return { phase, clock: S.clock, actor: { x: S.actor.x, y: S.actor.y, wp: S.actor.wp }, ghost: { wp: S.ghost.wp, t: S.ghostT }, gate: S.gate, flare: S.flare.down, bucket: S.bucket, buoy: S.buoy, surface: S.surface, bumps: S.bumps }; }
  };
})();
