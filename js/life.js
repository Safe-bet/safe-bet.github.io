/* Sea life: a fish school (boids) in the shallows, jellyfish in the deep,
   the seabed with kelp and a parked ATAL, the hero AUV that steers the torch,
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
    const d = D.depth;
    ctx.clearRect(0, 0, W, H);

    // --- fish (shallows) ---
    const fa = band(d, .02, .08, .38, .5);
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
        ctx.strokeStyle = `rgba(52,140,110,${.55 * ba})`; ctx.lineWidth = 3; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(x0, y0);
        for (let i = 1; i <= segs; i++) ctx.lineTo(x0 + Math.sin(t * .02 + k.ph + i * .45) * i * 1.6, y0 - i * len / segs);
        ctx.stroke();
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
      if (visible && D.torch.on) {
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
