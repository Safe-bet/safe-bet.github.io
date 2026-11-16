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

  /* ---------- depth gauge ---------- */
  const secs = [...document.querySelectorAll('[data-depth]')];
  const fill = document.getElementById('gaugeFill'), read = document.getElementById('gaugeDepth'), zone = document.getElementById('gaugeZone');
  function onScroll() {
    const y = scrollY + innerHeight * .4;
    let m = 0, z = secs[0].dataset.zone;
    for (let i = 0; i < secs.length; i++) {
      const a = secs[i], b = secs[i + 1];
      const ta = a.offsetTop, da = +a.dataset.depth;
      if (y >= ta) { z = a.dataset.zone; m = da; if (b) { const tb = b.offsetTop, db = +b.dataset.depth; if (y < tb) m = da + (db - da) * (y - ta) / (tb - ta); } }
    }
    if (scrollY + innerHeight >= document.documentElement.scrollHeight - 4) { m = 4000; z = 'SEABED'; }
    depth = Math.min(1, m / 4000);
    read.textContent = String(Math.round(m)).padStart(4, '0');
    fill.style.height = depth * 100 + '%';
    if (zone.textContent !== z) zone.textContent = z;
  }
  addEventListener('scroll', onScroll, { passive: true });
  addEventListener('resize', onScroll);
  onScroll();
})();
