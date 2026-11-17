/* Sea life by zone: whale + fish school (sunlight), lanternfish + siphonophore (twilight),
   anglerfish, jellyfish + comb jellies (midnight/abyss), snailfish (hadal), and
   the seabed with crinoids, a hydrothermal vent and a parked ATAL, the hero AUV that steers the torch,
   and sonar pings on click. Reads window.DIVE from ocean.js. */
(() => {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const D = window.DIVE;
  const cv = document.getElementById('life');
  const ctx = cv.getContext('2d');
  let W = 0, H = 0;
  const mouse = { x: -9999, y: -9999 };
  addEventListener('pointermove', e => { mouse.x = e.clientX; mouse.y = e.clientY; }, { passive: true });
  addEventListener('pointerleave', () => { mouse.x = mouse.y = -9999; });

  const smooth = (a, b, x) => { const k = Math.max(0, Math.min(1, (x - a) / (b - a))); return k * k * (3 - 2 * k); };
  const band = (d, a, b, c, e) => smooth(a, b, d) * (1 - smooth(c, e, d));

  /* ---------- the AUV, drawn nose-forward along +x ---------- */
  function drawAUV(g, t, s = 1) {
    g.save(); g.scale(s, s);
    // rear thrusters + spinning props
    const spin = Math.abs(Math.sin(t * .6));
    g.fillStyle = '#2a3646';
    g.fillRect(-56, -17, 12, 8); g.fillRect(-56, 9, 12, 8);
    g.fillStyle = 'rgba(200,220,235,.55)';
    g.beginPath(); g.ellipse(-58, -13, 1.6, 5 * spin + 1, 0, 0, 6.283); g.ellipse(-58, 13, 1.6, 5 * (1 - spin) + 1, 0, 0, 6.283); g.fill();
    // top vertical thrusters
    g.fillStyle = '#2a3646'; g.fillRect(-26, -21, 12, 6); g.fillRect(12, -21, 12, 6);
    // hull
    const hg = g.createLinearGradient(0, -12, 0, 12);
    hg.addColorStop(0, '#eef4f9'); hg.addColorStop(.45, '#b9c7d4'); hg.addColorStop(1, '#5d6e80');
    g.fillStyle = hg; g.beginPath(); g.roundRect(-46, -12, 86, 24, 12); g.fill();
    // orange band + label strip
    g.fillStyle = '#e8772e'; g.fillRect(-8, -12, 7, 24);
    g.fillStyle = 'rgba(10,26,46,.75)'; g.fillRect(4, -3, 26, 3);
    // glass nose with camera
    g.fillStyle = 'rgba(70,227,255,.35)'; g.beginPath(); g.ellipse(40, 0, 9, 11, 0, -1.57, 1.57); g.fill();
    g.fillStyle = '#ffe2a8'; g.shadowColor = '#ffc061'; g.shadowBlur = 14; g.beginPath(); g.arc(43, 0, 3, 0, 6.283); g.fill(); g.shadowBlur = 0;
    // antenna
    g.strokeStyle = '#8a9aa8'; g.lineWidth = 1.2; g.beginPath(); g.moveTo(-30, -12); g.lineTo(-34, -26); g.stroke();
    g.restore();
  }
  window.drawAUV = drawAUV;

  /* ---------- fish school ---------- */
  const fish = [];
  const seed = () => {
    fish.length = 0;
    const n = W < 700 ? 22 : 44, cx = W * .7, cy = H * .5;
    for (let i = 0; i < n; i++) { const a = Math.random() * 6.28; fish.push({ x: cx + Math.cos(a) * 80 * Math.random(), y: cy + Math.sin(a) * 60 * Math.random(), vx: -1 + Math.random() * .4, vy: (Math.random() - .5) * .4, s: .8 + Math.random() * .5 }); }
  };
  /* ---------- jellyfish ---------- */
  const jellies = Array.from({ length: innerWidth < 700 ? 4 : 7 }, (_, i) => ({ x: Math.random(), y: Math.random(), s: 14 + Math.random() * 18, ph: Math.random() * 6.28, c: i % 3 === 0 ? '167,139,250' : '70,227,255' }));
  /* ---------- zone creatures ---------- */
  const R = Math.random;
  const small = () => innerWidth < 700;
  const whale = { x: 1.3, y: .38, ph: 0 };
  const lantern = Array.from({ length: 22 }, () => ({ x: R(), y: R(), v: .25 + R() * .35, s: 1.1 + R() * .8, ph: R() * 6, dir: R() < .5 ? -1 : 1 }));
  const siph = { x: .2, y: 1.1, pts: [] };
  const anglers = [{ x: .78, y: .6, dir: -1, ph: 0, s: 1 }, { x: .18, y: .3, dir: 1, ph: 2, s: .6 }];
  const combs = Array.from({ length: 4 }, () => ({ x: R(), y: R(), s: 12 + R() * 10, ph: R() * 6 }));
  const snails = Array.from({ length: 4 }, () => ({ x: R(), y: .25 + R() * .5, s: .8 + R() * .5, ph: R() * 6, dir: R() < .5 ? -1 : 1 }));
  const smoke = [];

  /* ---------- seabed ---------- */
  let ridge = [], kelp = [], rocks = [];
  const buildBed = () => {
    ridge = []; const n = 60;
    for (let i = 0; i <= n; i++) { const x = i / n; ridge.push(Math.sin(x * 7.1) * .18 + Math.sin(x * 17.3 + 1) * .08 + Math.sin(x * 2.3 + 2) * .25); }
    kelp = Array.from({ length: W < 700 ? 6 : 12 }, (_, i) => ({ x: (i + .3 + Math.random() * .5) / (W < 700 ? 6 : 12), h: .5 + Math.random() * .6, ph: Math.random() * 6 }));
    rocks = Array.from({ length: 7 }, () => ({ x: Math.random(), r: 10 + Math.random() * 26 }));
  };
  const bedY = (x, base, amp) => { const f = x / W * (ridge.length - 1), i = Math.floor(f), k = f - i; const v = ridge[i] + ((ridge[i + 1] ?? ridge[i]) - ridge[i]) * k; return base - v * amp; };

  function resize() {
    const d = Math.min(devicePixelRatio || 1, 1.75);
    W = innerWidth; H = innerHeight; cv.width = W * d; cv.height = H * d; ctx.setTransform(d, 0, 0, d, 0, 0);
    seed(); buildBed();
  }
  addEventListener('resize', resize); resize();

  let lastScroll = scrollY;
  let t = 0, last = performance.now();
  function frame(now) {
    const dt = Math.min(50, now - last) / 16.67; last = now; t += dt;
    const dy = Math.max(-40, Math.min(40, scrollY - lastScroll)); lastScroll = scrollY;
    if (document.documentElement.dataset.theme === 'hogwarts') { requestAnimationFrame(frame); return; }
    const d = D.depth;
    ctx.clearRect(0, 0, W, H);

    // --- blue whale passing far off (sunlight zone) ---
    const wa = band(d, .005, .03, .12, .2);
    if (wa <= .01) whale.seen = false;
    if (wa > .01) {
      if (!whale.seen) { whale.seen = true; if (whale.x > 1 || whale.x < -.6) whale.x = .92; }
      if (!reduced) { whale.x -= .0009 * dt; whale.y -= dy * .25 / H; }
      if (whale.x < -.8) { whale.x = 1.4; whale.y = .25 + R() * .3; }
      const L = Math.min(W * .75, 900), x = whale.x * W, y = whale.y * H + Math.sin(t * .01) * 14, fl = Math.sin(t * .03) * .25;
      ctx.save(); ctx.translate(x, y); ctx.fillStyle = `rgba(3,20,36,${.7 * wa})`;
      ctx.beginPath(); ctx.moveTo(0, 0);
      ctx.bezierCurveTo(L * .05, -L * .07, L * .35, -L * .09, L * .62, -L * .045);
      ctx.bezierCurveTo(L * .8, -L * .02, L * .88, -L * .01, L * .93, L * fl * .05);
      ctx.lineTo(L, -L * .06 + L * fl * .08); ctx.lineTo(L * .97, L * fl * .05); ctx.lineTo(L, L * .06 + L * fl * .08);
      ctx.lineTo(L * .92, L * .012 + L * fl * .05);
      ctx.bezierCurveTo(L * .7, L * .045, L * .3, L * .07, L * .06, L * .04); ctx.closePath(); ctx.fill();
      // pectoral fin
      ctx.beginPath(); ctx.moveTo(L * .22, L * .045); ctx.quadraticCurveTo(L * .3, L * .12, L * .36, L * .13); ctx.quadraticCurveTo(L * .3, L * .07, L * .28, L * .05); ctx.fill();
      ctx.restore();
    }

    // --- lanternfish with photophores (twilight) ---
    const la = band(d, .1, .16, .34, .42);
    if (la > .01) {
      for (const f of lantern) {
        if (!reduced) { f.x += f.dir * f.v * .0007 * dt; f.y -= dy * .5 / H; }
        if (f.x < -.05) f.x = 1.05; if (f.x > 1.05) f.x = -.05; if (f.y < -.05) f.y = 1.05; if (f.y > 1.05) f.y = -.05;
        const x = f.x * W, y = f.y * H + Math.sin(t * .02 + f.ph) * 6, s = f.s;
        ctx.save(); ctx.translate(x, y); ctx.scale(f.dir * s, s);
        ctx.fillStyle = `rgba(45,75,105,${.9 * la})`; ctx.beginPath(); ctx.ellipse(0, 0, 9, 3.2, 0, 0, 6.283); ctx.fill();
        ctx.beginPath(); ctx.moveTo(-8, 0); ctx.lineTo(-13, -3); ctx.lineTo(-13, 3); ctx.fill();
        const blink = .5 + .5 * Math.sin(t * .08 + f.ph * 3);
        ctx.fillStyle = `rgba(120,240,255,${la * (.4 + .6 * blink)})`; ctx.shadowColor = '#46e3ff'; ctx.shadowBlur = 6;
        for (let k = 0; k < 5; k++) { ctx.beginPath(); ctx.arc(5 - k * 3, 2.2, 1.1, 0, 6.283); ctx.fill(); }
        ctx.beginPath(); ctx.arc(6, -.5, 1.1, 0, 6.283); ctx.fill(); ctx.shadowBlur = 0;
        ctx.restore();
      }
    }

    // --- siphonophore: a glowing colonial chain drifting through (twilight → midnight) ---
    const sa = band(d, .17, .22, .4, .48);
    if (sa > .01) {
      if (!reduced) { siph.y -= (.00035 * dt + dy * .4 / H); siph.x += Math.sin(t * .004) * .0003 * dt; }
      if (siph.y < -.6) { siph.y = 1.15; siph.x = .15 + R() * .7; }
      const n = 26, hx = siph.x * W, hy = siph.y * H;
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      for (let i = 0; i < n; i++) {
        const px = hx + Math.sin(t * .02 - i * .28) * (6 + i * 1.4), py = hy + i * 11;
        const a = sa * (1 - i / n) * (.5 + .5 * Math.sin(t * .06 - i * .5));
        ctx.fillStyle = `rgba(167,139,250,${.55 * a})`; ctx.beginPath(); ctx.arc(px, py, i ? 2.6 : 4.5, 0, 6.283); ctx.fill();
        if (i % 3 === 0) { ctx.strokeStyle = `rgba(167,139,250,${.3 * a})`; ctx.beginPath(); ctx.moveTo(px, py); ctx.quadraticCurveTo(px + 8, py + 10, px + 4 + Math.sin(t * .05 + i) * 4, py + 22); ctx.stroke(); }
      }
      ctx.restore();
    }

    // --- anglerfish: only the lure gives it away (midnight → abyss) ---
    const aa = band(d, .28, .36, .66, .76);
    if (aa > .01) {
      for (const f of anglers) {
        if (!reduced) { f.x += f.dir * .00012 * dt; f.y -= dy * .3 / H; }
        if (f.x < -.15) f.x = 1.15; if (f.x > 1.15) f.x = -.15; if (f.y < -.2) f.y = 1.2; if (f.y > 1.2) f.y = -.2;
        const s = (small() ? .7 : 1) * f.s, x = f.x * W, y = f.y * H + Math.sin(t * .012 + f.ph) * 10;
        const lx = 34, ly = -40 + Math.sin(t * .05 + f.ph) * 3, pulse = .6 + .4 * Math.sin(t * .07 + f.ph);
        ctx.save(); ctx.translate(x, y); ctx.scale(f.dir * s, s);
        // lure light spills onto the face
        const lg = ctx.createRadialGradient(lx, ly, 0, lx, ly, 90); lg.addColorStop(0, `rgba(160,255,230,${.35 * aa * pulse})`); lg.addColorStop(1, 'rgba(160,255,230,0)');
        ctx.fillStyle = lg; ctx.beginPath(); ctx.arc(lx, ly, 90, 0, 6.283); ctx.fill();
        // body, faintly lit
        const bg = ctx.createRadialGradient(lx, ly, 10, 10, 0, 80); bg.addColorStop(0, `rgba(70,100,110,${.75 * aa})`); bg.addColorStop(1, `rgba(10,18,26,${.85 * aa})`);
        ctx.fillStyle = bg; ctx.beginPath(); ctx.ellipse(0, 0, 38, 30, 0, 0, 6.283); ctx.fill();
        ctx.beginPath(); ctx.moveTo(-34, 0); ctx.quadraticCurveTo(-56, -6, -66, -20); ctx.lineTo(-62, 0); ctx.lineTo(-66, 20); ctx.quadraticCurveTo(-56, 6, -34, 4); ctx.fill();
        // jaw + teeth
        const jaw = Math.max(0, Math.sin(t * .02 + f.ph)) * 6;
        ctx.fillStyle = `rgba(2,4,8,${aa})`; ctx.beginPath(); ctx.moveTo(14, 2); ctx.quadraticCurveTo(30, 6 + jaw, 40, 4 + jaw); ctx.lineTo(40, 0); ctx.quadraticCurveTo(30, -2, 14, 2); ctx.fill();
        ctx.strokeStyle = `rgba(220,235,240,${.7 * aa})`; ctx.lineWidth = 1; ctx.beginPath();
        for (let k = 0; k < 6; k++) { const tx = 18 + k * 3.6; ctx.moveTo(tx, 1); ctx.lineTo(tx + 1, 5 + jaw * .5); ctx.moveTo(tx + 1.5, 6 + jaw); ctx.lineTo(tx + 2.2, 2 + jaw * .4); }
        ctx.stroke();
        // eye
        ctx.fillStyle = `rgba(200,240,255,${.8 * aa})`; ctx.beginPath(); ctx.arc(18, -10, 2.4, 0, 6.283); ctx.fill();
        // illicium + bulb
        ctx.strokeStyle = `rgba(90,120,130,${aa})`; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(8, -26); ctx.quadraticCurveTo(20, -58, lx, ly); ctx.stroke();
        ctx.fillStyle = `rgba(200,255,240,${aa})`; ctx.shadowColor = '#7fffd4'; ctx.shadowBlur = 18 * pulse; ctx.beginPath(); ctx.arc(lx, ly, 3.6, 0, 6.283); ctx.fill(); ctx.shadowBlur = 0;
        ctx.restore();
      }
    }

    // --- comb jellies: rainbow light scattering off beating cilia (abyss) ---
    const ca = band(d, .42, .5, .82, .9);
    if (ca > .01) {
      for (const c of combs) {
        if (!reduced) { c.y -= (.00018 * dt + dy * .35 / H); c.x += Math.sin(t * .005 + c.ph) * .0002 * dt; }
        if (c.y < -.1) { c.y = 1.1; c.x = R(); } if (c.y > 1.15) { c.y = -.08; c.x = R(); }
        const x = c.x * W, y = c.y * H, s = c.s;
        ctx.fillStyle = `rgba(200,230,255,${.08 * ca})`; ctx.strokeStyle = `rgba(200,230,255,${.25 * ca})`; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.ellipse(x, y, s * .62, s, 0, 0, 6.283); ctx.fill(); ctx.stroke();
        for (let r = 0; r < 4; r++) {
          const ox = (r - 1.5) * s * .32;
          for (let k = 0; k < 7; k++) {
            const yy = y - s * .8 + k * s * .26, hue = (t * 4 + k * 40 + r * 60 + c.ph * 50) % 360;
            const w = Math.sqrt(Math.max(0, 1 - Math.pow((yy - y) / s, 2)));
            ctx.fillStyle = `hsla(${hue},95%,65%,${.8 * ca * (.4 + .6 * Math.max(0, Math.sin(t * .2 - k * .8)))})`;
            ctx.fillRect(x + ox * w - 1, yy, 2, 2.4);
          }
        }
      }
    }

    // --- hadal snailfish: pale, translucent, the deepest fish ever filmed ---
    const ha = band(d, .74, .82, 2, 3);
    if (ha > .01) {
      for (const f of snails) {
        if (!reduced) { f.x += f.dir * .00022 * dt; f.y -= dy * .2 / H; }
        if (f.x < -.1) f.x = 1.1; if (f.x > 1.1) f.x = -.1; if (f.y < .05) f.y = .9; if (f.y > .95) f.y = .1;
        const x = f.x * W, y = f.y * H + Math.sin(t * .015 + f.ph) * 8, s = f.s * (small() ? .8 : 1.1), wv = Math.sin(t * .09 + f.ph);
        ctx.save(); ctx.translate(x, y); ctx.scale(f.dir * s, s);
        ctx.fillStyle = `rgba(250,210,225,${.45 * ha})`; ctx.strokeStyle = `rgba(255,230,240,${.55 * ha})`; ctx.lineWidth = .8;
        ctx.beginPath(); ctx.moveTo(14, 0); ctx.bezierCurveTo(14, -9, 0, -10, -6, -6);
        ctx.quadraticCurveTo(-22, -3 + wv * 3, -34, wv * 5); ctx.quadraticCurveTo(-22, 4 + wv * 3, -6, 6); ctx.bezierCurveTo(0, 10, 14, 9, 14, 0); ctx.fill(); ctx.stroke();
        ctx.fillStyle = `rgba(30,20,30,${.7 * ha})`; ctx.beginPath(); ctx.arc(8, -3, 1.4, 0, 6.283); ctx.fill();
        ctx.restore();
      }
    }

    // --- fish (shallows) ---
    const fa = band(d, .02, .06, .13, .2);
    if (fa > 0.01) {
      for (const f of fish) {
        let cx = 0, cy = 0, ax = 0, ay = 0, sx = 0, sy = 0, n = 0;
        for (const o of fish) {
          if (o === f) continue;
          const ddx = o.x - f.x, ddy = o.y - f.y, q = ddx * ddx + ddy * ddy;
          if (q < 6400) { cx += o.x; cy += o.y; ax += o.vx; ay += o.vy; n++; if (q < 324) { sx -= ddx / (q + 1) * 18; sy -= ddy / (q + 1) * 18; } }
        }
        if (n) { f.vx += ((cx / n - f.x) * .0009 + (ax / n - f.vx) * .05) * dt; f.vy += ((cy / n - f.y) * .0009 + (ay / n - f.vy) * .05) * dt; }
        f.vx += sx * .05 * dt; f.vy += sy * .05 * dt;
        const mx = f.x - mouse.x, my = f.y - mouse.y, mq = mx * mx + my * my;
        if (mq < 22000) { const k = (1 - mq / 22000) * .5; f.vx += mx / Math.sqrt(mq + 1) * k * dt; f.vy += my / Math.sqrt(mq + 1) * k * dt; }
        const m = 80;
        if (f.x < m) f.vx += .04 * dt; if (f.x > W - m) f.vx -= .04 * dt;
        if (f.y < H * .15) f.vy += .04 * dt; if (f.y > H * .85) f.vy -= .04 * dt;
        const sp = Math.hypot(f.vx, f.vy), mxs = 2.2, mns = .7;
        if (sp > mxs) { f.vx *= mxs / sp; f.vy *= mxs / sp; } else if (sp < mns) { f.vx *= mns / sp; f.vy *= mns / sp; }
        if (!reduced) { f.x += f.vx * dt; f.y += f.vy * dt - dy * .2; }
        if (f.y < -40) f.y = H + 30; if (f.y > H + 40) f.y = -30;
        const a = Math.atan2(f.vy, f.vx), wag = Math.sin(t * .35 + f.x * .05) * .35;
        ctx.save(); ctx.translate(f.x, f.y); ctx.rotate(a); ctx.scale(f.s, f.s);
        ctx.fillStyle = `rgba(185,220,238,${.75 * fa})`;
        ctx.beginPath(); ctx.ellipse(0, 0, 8, 2.6, 0, 0, 6.283); ctx.fill();
        ctx.beginPath(); ctx.moveTo(-7, 0); ctx.lineTo(-12, -3.5 + wag * 3); ctx.lineTo(-12, 3.5 + wag * 3); ctx.closePath(); ctx.fill();
        ctx.fillStyle = `rgba(255,255,255,${.5 * fa})`; ctx.fillRect(3, -1.6, 1.4, 1.4);
        ctx.restore();
      }
    }

    // --- jellyfish (deep) ---
    const ja = band(d, .4, .52, 2, 3);
    if (ja > 0.01) {
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      for (const j of jellies) {
        const p = Math.sin(t * .045 + j.ph);
        if (!reduced) { j.y -= ((.12 + Math.max(0, p) * .5) * dt + dy * .35) / H; j.x += Math.sin(t * .006 + j.ph) * .0003 * dt; }
        if (j.y < -.15) { j.y = 1.12; j.x = Math.random(); } if (j.y > 1.2) { j.y = -.1; j.x = Math.random(); }
        const x = j.x * W, y = j.y * H, s = j.s, bw = s * (1 + .14 * p), bh = s * .72 * (1 - .12 * p);
        const gl = ctx.createRadialGradient(x, y, 0, x, y, s * 2.6);
        gl.addColorStop(0, `rgba(${j.c},${.22 * ja})`); gl.addColorStop(1, `rgba(${j.c},0)`);
        ctx.fillStyle = gl; ctx.beginPath(); ctx.arc(x, y, s * 2.6, 0, 6.283); ctx.fill();
        ctx.fillStyle = `rgba(${j.c},${.35 * ja})`; ctx.strokeStyle = `rgba(${j.c},${.8 * ja})`; ctx.lineWidth = 1.2;
        ctx.beginPath(); ctx.ellipse(x, y, bw, bh, 0, Math.PI, 0); ctx.quadraticCurveTo(x, y + bh * .35, x - bw, y); ctx.fill(); ctx.stroke();
        ctx.lineWidth = 1;
        for (let k = 0; k < 5; k++) {
          const tx = x - bw * .7 + k * bw * .35; ctx.beginPath(); ctx.moveTo(tx, y + 1);
          for (let u = 1; u <= 6; u++) ctx.lineTo(tx + Math.sin(t * .05 + j.ph + u * .7 + k) * (2 + u * .8), y + u * s * .38);
          ctx.strokeStyle = `rgba(${j.c},${.45 * ja})`; ctx.stroke();
        }
      }
      ctx.restore();
    }

    // --- seabed ---
    const ba = smooth(.84, 1, d);
    if (ba > 0.01) {
      const base = H + 30 - ba * H * .26, amp = H * .06;
      // kelp behind ridge
      for (const k of kelp) {
        const x0 = k.x * W, y0 = bedY(x0, base, amp) + 6, segs = 12, len = H * .3 * k.h * ba;
        ctx.strokeStyle = `rgba(200,190,220,${.35 * ba})`; ctx.lineWidth = 1.6; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(x0, y0);
        let tx = x0, ty = y0;
        for (let i = 1; i <= segs; i++) { tx = x0 + Math.sin(t * .015 + k.ph + i * .35) * i * .9; ty = y0 - i * len * .55 / segs; ctx.lineTo(tx, ty); }
        ctx.stroke();
        // feathery crown
        ctx.strokeStyle = `rgba(240,200,255,${.45 * ba})`; ctx.lineWidth = 1;
        for (let a = 0; a < 6; a++) { const an = -Math.PI / 2 + (a - 2.5) * .35 + Math.sin(t * .03 + k.ph + a) * .12; ctx.beginPath(); ctx.moveTo(tx, ty); ctx.quadraticCurveTo(tx + Math.cos(an) * 14, ty + Math.sin(an) * 14, tx + Math.cos(an + .5) * 24, ty + Math.sin(an + .5) * 20 + 6); ctx.stroke(); }
      }
      const gr = ctx.createLinearGradient(0, base - amp, 0, H);
      gr.addColorStop(0, '#061423'); gr.addColorStop(1, '#010409');
      ctx.fillStyle = gr; ctx.beginPath(); ctx.moveTo(0, H);
      for (let x = 0; x <= W; x += 12) ctx.lineTo(x, bedY(x, base, amp));
      ctx.lineTo(W, H); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = `rgba(70,227,255,${.25 * ba})`; ctx.lineWidth = 1; ctx.beginPath();
      for (let x = 0; x <= W; x += 12) { const y = bedY(x, base, amp); x ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }
      ctx.stroke();
      for (const r of rocks) { const x = r.x * W, y = bedY(x, base, amp) + r.r * .35; ctx.fillStyle = '#0a1c2e'; ctx.beginPath(); ctx.ellipse(x, y, r.r, r.r * .55, 0, Math.PI, 0); ctx.fill(); }
      // hydrothermal vent: chimney, black-smoker plume, tube worms
      const vx = W * (small() ? .2 : .3), vy = bedY(vx, base, amp) + 4, ch = 70 * ba;
      ctx.fillStyle = '#0c1a26'; ctx.beginPath(); ctx.moveTo(vx - 26, vy); ctx.lineTo(vx - 9, vy - ch); ctx.lineTo(vx + 9, vy - ch); ctx.lineTo(vx + 24, vy); ctx.closePath(); ctx.fill();
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      const hot = ctx.createRadialGradient(vx, vy - ch, 0, vx, vy - ch, 26); hot.addColorStop(0, `rgba(255,140,60,${.45 * ba})`); hot.addColorStop(1, 'rgba(255,140,60,0)');
      ctx.fillStyle = hot; ctx.beginPath(); ctx.arc(vx, vy - ch, 26, 0, 6.283); ctx.fill(); ctx.restore();
      if (!reduced && R() < .6) smoke.push({ x: vx + (R() - .5) * 8, y: vy - ch, r: 4 + R() * 4, l: 1, vx: (R() - .5) * .3 });
      for (let i = smoke.length - 1; i >= 0; i--) {
        const q = smoke[i]; q.y -= .9 * dt; q.x += (q.vx + Math.sin(t * .03 + i) * .25) * dt; q.r += .12 * dt; q.l -= .006 * dt;
        if (q.l <= 0) { smoke.splice(i, 1); continue; }
        ctx.fillStyle = `rgba(30,34,40,${.32 * q.l * ba})`; ctx.beginPath(); ctx.arc(q.x, q.y, q.r, 0, 6.283); ctx.fill();
      }
      for (let i = 0; i < 9; i++) {
        const wx = vx - 48 + i * 12 + (i > 4 ? 22 : 0), wy = bedY(wx, base, amp) + 4, wh = (18 + (i * 7) % 14) * ba, sw = Math.sin(t * .04 + i) * 2;
        ctx.strokeStyle = `rgba(230,225,215,${.6 * ba})`; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(wx, wy); ctx.lineTo(wx + sw, wy - wh); ctx.stroke();
        ctx.fillStyle = `rgba(239,68,68,${.85 * ba})`; ctx.beginPath(); ctx.ellipse(wx + sw, wy - wh - 3, 3.2, 5, 0, 0, 6.283); ctx.fill();
      }
      // ATAL parked on the seabed, lamp on
      const ax = W * .82, ay = bedY(W * .82, base, amp) - 18;
      ctx.save(); ctx.globalAlpha = ba; ctx.translate(ax, ay); ctx.rotate(-.04);
      ctx.globalCompositeOperation = 'lighter';
      const cone = ctx.createLinearGradient(44, 0, -260, 0);
      cone.addColorStop(0, 'rgba(255,214,150,.22)'); cone.addColorStop(1, 'rgba(255,214,150,0)');
      ctx.fillStyle = cone; ctx.beginPath(); ctx.moveTo(-40, 0); ctx.lineTo(-300, -70); ctx.lineTo(-300, 40); ctx.closePath(); ctx.fill();
      ctx.globalCompositeOperation = 'source-over';
      ctx.scale(-1, 1); drawAUV(ctx, t, W < 700 ? .8 : 1.1);
      ctx.restore();
    }
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);

  /* ---------- hero AUV steering the torch ---------- */
  const hero = document.getElementById('top');
  const hc = document.getElementById('heroSub');
  if (hero && hc) {
    const g = hc.getContext('2d');
    let hw = 0, hh = 0;
    const fit = () => { const r = hero.getBoundingClientRect(), d = Math.min(devicePixelRatio || 1, 2); hw = r.width; hh = r.height; hc.width = hw * d; hc.height = hh * d; g.setTransform(d, 0, 0, d, 0, 0); };
    fit(); addEventListener('resize', fit);
    const auv = { x: hw * .9, y: hh * .7, ang: Math.PI };
    const trail = [];
    let tt = 0, lt = performance.now(), visible = true;
    new IntersectionObserver(es => { visible = es[0].isIntersecting; }).observe(hero);
    const step = (now) => {
      const dt = Math.min(50, now - lt) / 16.67; lt = now; tt += dt;
      if (visible && D.torch.on && !(document.documentElement.dataset.theme === 'hogwarts')) {
        const r = hero.getBoundingClientRect();
        const sx = D.torch.x - r.left, sy = D.torch.y - r.top;
        const dist = hw < 700 ? 150 : 270;
        let vx = auv.x - sx, vy = auv.y - sy; const m = Math.hypot(vx, vy) || 1; vx /= m; vy /= m;
        const tx = Math.max(60, Math.min(hw - 60, sx + vx * dist)), ty = Math.max(90, Math.min(hh - 60, sy + vy * dist));
        const k = reduced ? 1 : .025 * dt;
        auv.x += (tx - auv.x) * k; auv.y += (ty - auv.y) * k;
        const want = Math.atan2(sy - auv.y, sx - auv.x);
        let da = want - auv.ang; while (da > Math.PI) da -= 6.283; while (da < -Math.PI) da += 6.283;
        auv.ang += da * (reduced ? 1 : .06 * dt);
        g.clearRect(0, 0, hw, hh);
        g.globalAlpha = hw < 700 ? .5 : 1;
        // headlight cone onto the torch spot
        const nx = auv.x + Math.cos(auv.ang) * 48, ny = auv.y + Math.sin(auv.ang) * 48;
        const L = Math.hypot(sx - nx, sy - ny), half = D.torch.r * .7;
        const px = -Math.sin(auv.ang), py = Math.cos(auv.ang);
        g.save(); g.globalCompositeOperation = 'lighter';
        const cg = g.createLinearGradient(nx, ny, sx, sy);
        cg.addColorStop(0, 'rgba(255,222,165,.32)'); cg.addColorStop(1, 'rgba(255,222,165,.02)');
        g.fillStyle = cg; g.beginPath(); g.moveTo(nx + px * 5, ny + py * 5);
        const ex = nx + Math.cos(auv.ang) * L, ey = ny + Math.sin(auv.ang) * L;
        g.lineTo(ex + px * half, ey + py * half); g.lineTo(ex - px * half, ey - py * half); g.lineTo(nx - px * 5, ny - py * 5); g.closePath(); g.fill();
        g.restore();
        // thruster bubbles
        if (!reduced && Math.random() < .35) trail.push({ x: auv.x - Math.cos(auv.ang) * 58, y: auv.y - Math.sin(auv.ang) * 58, r: 1 + Math.random() * 2.5, l: 1 });
        for (let i = trail.length - 1; i >= 0; i--) { const b = trail[i]; b.y -= .6 * dt; b.x += Math.sin(tt * .1 + i) * .3; b.l -= .012 * dt; if (b.l <= 0) { trail.splice(i, 1); continue; } g.strokeStyle = `rgba(210,240,255,${b.l * .5})`; g.beginPath(); g.arc(b.x, b.y, b.r, 0, 6.283); g.stroke(); }
        // the vehicle (kept upright)
        g.save(); g.translate(auv.x, auv.y); g.rotate(auv.ang); if (Math.cos(auv.ang) < 0) g.scale(1, -1);
        drawAUV(g, tt, hw < 700 ? .75 : 1);
        g.restore();
      }
      requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }

  /* ---------- sonar ping on click ---------- */
  if (!reduced) addEventListener('pointerdown', e => {
    if (e.target.closest('input, textarea, select')) return;
    for (let i = 0; i < 2; i++) {
      const p = document.createElement('span');
      p.className = 'ping'; p.style.left = e.clientX + 'px'; p.style.top = e.clientY + 'px'; p.style.animationDelay = i * .18 + 's';
      document.body.appendChild(p); setTimeout(() => p.remove(), 1400);
    }
  }, { passive: true });
})();
