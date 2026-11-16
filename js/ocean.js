/* Ocean background (light shafts, marine snow, bubbles, bioluminescence),
   torchlight hero, and the depth gauge. */
(() => {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const cv = document.getElementById('ocean');
  const ctx = cv.getContext('2d');
  const hero = document.getElementById('top');
  let W = 0, H = 0, DPR = 1;
  let depth = 0;                 // 0..1 (surface → seabed)
  const torch = { x: -9999, y: -9999, on: false, r: 220 };
  window.DIVE = { torch, get depth() { return depth; } };

  const snow = [], bubbles = [], glow = [];
  function resize() {
    DPR = Math.min(devicePixelRatio || 1, 1.75);
    W = innerWidth; H = innerHeight;
    cv.width = W * DPR; cv.height = H * DPR;
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    const n = Math.round(Math.min(160, W * H / 9000));
    snow.length = 0;
    for (let i = 0; i < n; i++) snow.push(mkSnow(true));
    glow.length = 0;
    for (let i = 0; i < 26; i++) glow.push({ x: Math.random() * W, y: Math.random() * H, p: Math.random() * 6.28, s: .4 + Math.random() * .8, r: 1 + Math.random() * 1.8 });
    torch.r = W < 700 ? 150 : 230;
  }
  function mkSnow(any) {
    const z = Math.random();               // 0 far … 1 near
    return { x: Math.random() * W, y: any ? Math.random() * H : -10, z, r: .4 + z * 1.6, vy: .08 + z * .32, ph: Math.random() * 6.28, a: .15 + z * .45 };
  }
  addEventListener('resize', resize);
  resize();

  const lerp = (a, b, t) => a + (b - a) * t;
  const mix = (c1, c2, t) => `rgb(${c1.map((v, i) => Math.round(lerp(v, c2[i], t))).join(',')})`;

  let t = 0, last = performance.now();
  function frame(now) {
    const dt = Math.min(50, now - last) / 16.67; last = now; t += dt;
    // water column colour
    const d = depth, e = Math.pow(d, .7);
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, mix([8, 52, 86], [2, 7, 16], e));
    g.addColorStop(.55, mix([4, 28, 52], [2, 6, 13], e));
    g.addColorStop(1, mix([2, 12, 26], [1, 4, 9], e));
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);

    // light shafts from the surface
    const sh = Math.pow(1 - d, 2.4);
    if (sh > .02) {
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      for (let i = 0; i < 6; i++) {
        const cx = W * (.12 + i * .17) + Math.sin(t * .006 + i * 1.7) * 60;
        const w = 40 + (i % 3) * 35, spread = 160 + (i % 2) * 120;
        const lg = ctx.createLinearGradient(0, 0, 0, H * .95);
        const a = (.05 + .03 * Math.sin(t * .011 + i)) * sh;
        lg.addColorStop(0, `rgba(160,225,255,${a})`); lg.addColorStop(1, 'rgba(160,225,255,0)');
        ctx.fillStyle = lg; ctx.beginPath();
        ctx.moveTo(cx - w / 2, -20); ctx.lineTo(cx + w / 2, -20);
        ctx.lineTo(cx + spread / 2 + 80, H); ctx.lineTo(cx - spread / 2 + 80, H); ctx.closePath(); ctx.fill();
      }
      // surface shimmer band
      const sg = ctx.createLinearGradient(0, 0, 0, 120);
      sg.addColorStop(0, `rgba(190,240,255,${.10 * sh})`); sg.addColorStop(1, 'rgba(190,240,255,0)');
      ctx.fillStyle = sg; ctx.fillRect(0, 0, W, 120);
      ctx.restore();
    }

    // marine snow; brightened warm inside the torch beam (forward scatter)
    const tr2 = torch.r * torch.r;
    for (const p of snow) {
      if (!reduced) { p.y += p.vy * dt; p.x += Math.sin(t * .01 + p.ph) * .12 * dt; }
      if (p.y > H + 10) Object.assign(p, mkSnow(false));
      let a = p.a * (.55 + .45 * (1 - d)), col = '200,225,255';
      if (torch.on) {
        const dx = p.x - torch.x, dy = p.y - torch.y, q = dx * dx + dy * dy;
        if (q < tr2) { const k = 1 - q / tr2; a = Math.min(1, a + k * .9); col = '255,226,170'; }
      }
      ctx.fillStyle = `rgba(${col},${a})`;
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 6.283); ctx.fill();
    }

    // bubbles near the surface
    if (!reduced && d < .2 && Math.random() < .05 * dt) bubbles.push({ x: Math.random() * W, y: H + 10, r: 1.5 + Math.random() * 4, vy: .6 + Math.random() * .9, ph: Math.random() * 6 });
    for (let i = bubbles.length - 1; i >= 0; i--) {
      const b = bubbles[i]; b.y -= b.vy * dt; b.x += Math.sin(t * .05 + b.ph) * .35;
      if (b.y < -10) { bubbles.splice(i, 1); continue; }
      ctx.strokeStyle = `rgba(200,240,255,${.35 * (1 - d * 4)})`; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.arc(b.x, b.y, b.r, 0, 6.283); ctx.stroke();
    }

    // bioluminescence appears in the deep
    const bl = Math.max(0, (d - .25) / .75);
    if (bl > 0) {
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      for (const q of glow) {
        if (!reduced) { q.y -= q.s * .15 * dt; q.p += .02 * dt; if (q.y < -10) { q.y = H + 10; q.x = Math.random() * W; } }
        const a = bl * (.25 + .75 * Math.max(0, Math.sin(q.p)));
        const rg = ctx.createRadialGradient(q.x, q.y, 0, q.x, q.y, q.r * 5);
        rg.addColorStop(0, `rgba(150,240,255,${a * .9})`); rg.addColorStop(.25, `rgba(70,227,255,${a * .35})`); rg.addColorStop(1, 'rgba(70,227,255,0)');
        ctx.fillStyle = rg; ctx.beginPath(); ctx.arc(q.x, q.y, q.r * 5, 0, 6.283); ctx.fill();
      }
      ctx.restore();
    }
    requestAnimationFrame(frame);   // browsers pause rAF in hidden tabs
  }
  requestAnimationFrame(frame);

  /* ---------- torch ---------- */
  const hint = document.getElementById('torchHint');
  const target = { x: innerWidth * .7, y: innerHeight * .45 }, cur = { ...target };
  let lastMove = 0, moved = false;
  const fine = matchMedia('(pointer: fine)').matches;
  hero.addEventListener('pointermove', e => {
    if (e.pointerType !== 'mouse' && e.pointerType !== 'pen') return;
    const r = hero.getBoundingClientRect();
    target.x = e.clientX - r.left; target.y = e.clientY - r.top; lastMove = performance.now();
    if (!moved) { moved = true; hint && hint.classList.add('gone'); }
  });
  function torchLoop(now) {
    const r = hero.getBoundingClientRect();
    const visible = r.bottom > 0;
    if (visible) {
      if (!fine || now - lastMove > 3500) {           // wander when idle / on touch
        const k = now * .00025;
        target.x = r.width * (.5 + .36 * Math.sin(k * 1.3));
        target.y = r.height * (.45 + .22 * Math.sin(k * 2.1 + 1));
      }
      const s = reduced ? 1 : .12;
      cur.x += (target.x - cur.x) * s; cur.y += (target.y - cur.y) * s;
      hero.style.setProperty('--mx', cur.x + 'px');
      hero.style.setProperty('--my', cur.y + 'px');
      hero.style.setProperty('--beam', torch.r + 'px');
      torch.x = cur.x + r.left; torch.y = cur.y + r.top; torch.on = true;
    } else torch.on = false;
    requestAnimationFrame(torchLoop);
  }
  requestAnimationFrame(torchLoop);

  /* ---------- depth gauge, dive readouts, zone banners ---------- */
  // Sections carry real depths (m). `depth` is a 0..1 *visual* depth so the art keeps
  // its pacing even though the metres run out to the Challenger Deep.
  const MAXM = 10935;
  const VIS = [[0, 0], [80, .02], [150, .05], [450, .15], [850, .225], [1600, .3], [4300, .5], [6500, .75], [8800, .9], [MAXM, 1]];
  const pw = (tab, m) => { for (let i = 1; i < tab.length; i++) if (m <= tab[i][0]) { const [a, va] = tab[i - 1], [b, vb] = tab[i]; return va + (vb - va) * (m - a) / (b - a); } return tab[tab.length - 1][1]; };
  const TEMP = [[0, 27], [60, 25], [200, 15], [500, 8], [1000, 4.5], [2000, 3], [4000, 1.8], [6000, 1.4], [MAXM, 2.4]];
  const ZONES = {
    'SUNLIGHT ZONE': ['Epipelagic · 0–200 m', 'Enough light for photosynthesis. Most ocean life lives here.'],
    'TWILIGHT ZONE': ['Mesopelagic · 200–1,000 m', 'Under 1% of surface light. Animals start making their own.'],
    'MIDNIGHT ZONE': ['Bathypelagic · 1,000–4,000 m', 'No sunlight at all. The only light is bioluminescence.'],
    'ABYSSAL ZONE': ['Abyssopelagic · 4,000–6,000 m', 'Near-freezing water, over 400 times surface pressure.'],
    'HADAL ZONE': ['Hadalpelagic · 6,000–11,000 m', 'The ocean trenches. Deeper than Everest is tall.'],
    'CHALLENGER DEEP': ['Mariana Trench · 10,935 m', 'The deepest known point on Earth: about 1,086 atm.']
  };
  const secs = [...document.querySelectorAll('[data-depth]')];
  const $ = id => document.getElementById(id);
  const fill = $('gaugeFill'), read = $('gaugeDepth'), zone = $('gaugeZone');
  const ds = { d: $('dsDepth'), p: $('dsPres'), t: $('dsTemp'), l: $('dsLight') };
  const vig = $('vignette'), zb = $('zoneBanner');
  window.DIVE.meters = 0;
  const seen = new Set(['SURFACE']); let zbTimer, booted = false, maxZone = 0;
  const zoneOrder = ['SURFACE', ...Object.keys(ZONES)];
  function banner(z) {
    if (!zb || !ZONES[z] || reduced) return;
    const gm = document.getElementById('game'), gr = gm && gm.getBoundingClientRect();   // never over the game
    if (gr && gr.top < innerHeight * .7 && gr.bottom > innerHeight * .3) return;
    $('zbKick').textContent = 'Entering'; $('zbName').textContent = z.toLowerCase().replace(/(^|\s)\S/g, c => c.toUpperCase());
    $('zbFact').textContent = ZONES[z][0] + ' — ' + ZONES[z][1];
    zb.classList.remove('on'); void zb.offsetWidth; zb.classList.add('on');
    clearTimeout(zbTimer); zbTimer = setTimeout(() => zb.classList.remove('on'), 2600);
  }
  const fmtLight = m => { const l = 100 * Math.exp(-m / 43); return l >= 1 ? Math.round(l) + '%' : l >= .001 ? l.toPrecision(1) + '%' : '0%'; };
  function onScroll() {
    const y = scrollY + innerHeight * .4;
    let m = 0, z = secs[0].dataset.zone;
    for (let i = 0; i < secs.length; i++) {
      const a = secs[i], b = secs[i + 1];
      const ta = a.offsetTop, da = +a.dataset.depth;
      if (y >= ta) { z = a.dataset.zone; m = da; if (b) { const tb = b.offsetTop, db = +b.dataset.depth; if (y < tb) m = da + (db - da) * (y - ta) / (tb - ta); } }
    }
    if (scrollY + innerHeight >= document.documentElement.scrollHeight - 4) { m = MAXM; z = 'CHALLENGER DEEP'; }
    depth = Math.min(1, pw(VIS, m));
    window.DIVE.meters = m;
    const mr = Math.round(m);
    read.textContent = mr >= 10000 ? String(mr) : String(mr).padStart(4, '0');
    fill.style.height = depth * 100 + '%';
    if (zone.textContent !== z) zone.textContent = z;
    if (ds.d) {
      ds.d.textContent = mr.toLocaleString('en-US') + ' m';
      ds.p.textContent = Math.round(1 + m * .09924).toLocaleString('en-US') + ' atm';
      ds.t.textContent = pw(TEMP, m).toFixed(1) + ' °C';
      ds.l.textContent = fmtLight(m);
    }
    if (vig) vig.style.opacity = Math.min(1, Math.pow(depth, .8) * 1.05).toFixed(3);
    document.documentElement.style.setProperty('--depth', depth.toFixed(3));
    // banner only when descending into a zone for the first time
    const zi = zoneOrder.indexOf(z);
    if (!booted && performance.now() > 1500) booted = true;             // ignore the initial hash jump
    if (!booted) for (let i = 0; i <= zi; i++) seen.add(zoneOrder[i]);
    else if (zi > maxZone && !seen.has(z)) { seen.add(z); banner(z); }
    if (zi > maxZone) maxZone = zi;
  }
  addEventListener('scroll', onScroll, { passive: true });
  addEventListener('resize', onScroll);
  onScroll();
})();
