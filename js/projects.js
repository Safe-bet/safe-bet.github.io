/* Project visuals. Each runs only while on screen. */
(() => {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

  function stage(canvas) {
    const ctx = canvas.getContext('2d');
    const s = { ctx, w: 0, h: 0, visible: false };
    const fit = () => {
      const r = canvas.getBoundingClientRect(), d = Math.min(devicePixelRatio || 1, 2);
      s.w = r.width; s.h = r.height; canvas.width = Math.round(r.width * d); canvas.height = Math.round(r.height * d);
      ctx.setTransform(d, 0, 0, d, 0, 0);
    };
    fit(); new ResizeObserver(fit).observe(canvas);
    new IntersectionObserver(es => { s.visible = es[0].isIntersecting; }, { rootMargin: '100px' }).observe(canvas);
    return s;
  }
  const loop = (s, draw) => {
    let last = performance.now();
    const f = now => { const dt = Math.min(64, now - last) / 1000; last = now; if (s.visible) draw(dt, now / 1000); requestAnimationFrame(f); };
    requestAnimationFrame(f);
  };
  const mono = (px) => `500 ${px}px "JetBrains Mono", monospace`;

  /* =================================================================
     1. SeamFinder — point cloud, pose search, ICP lock, seams, poses
     ================================================================= */
  (() => {
    const cv = document.getElementById('seamCanvas'); if (!cv) return;
    const S = stage(cv), ctx = S.ctx;
    const chip = document.getElementById('sfState');
    const steps = [...document.querySelectorAll('#sfSteps li')];

    // Part (mm): base plate, back wall, boss. z up.
    const boxes = [[0, 0, 0, 120, 80, 10], [0, 60, 10, 120, 70, 50], [20, 15, 10, 48, 40, 24]];
    const C = [60, 40, 20];
    const seams = [
      { a: [0, 60, 10], b: [120, 60, 10], off: [0, -2.2, 0], conf: 'ok' },
      { a: [20, 15, 10], b: [48, 15, 10], off: [0, 1.4, 0], conf: 'ok' },
      { a: [48, 15, 10], b: [48, 40, 10], off: [1.8, 0, 0], conf: 'warn' }
    ];
    const edges = [];
    for (const [x0, y0, z0, x1, y1, z1] of boxes) {
      const v = [[x0,y0,z0],[x1,y0,z0],[x1,y1,z0],[x0,y1,z0],[x0,y0,z1],[x1,y0,z1],[x1,y1,z1],[x0,y1,z1]];
      [[0,1],[1,2],[2,3],[3,0],[4,5],[5,6],[6,7],[7,4],[0,4],[1,5],[2,6],[3,7]].forEach(([i, j]) => edges.push([v[i], v[j]]));
    }
    // Depth points the camera would see (top-down-ish): visible faces + table
    const cloud = [], rnd = (a, b) => a + Math.random() * (b - a), nz = () => (Math.random() - .5) * 1.2;
    const inBoss = (x, y) => x > 20 && x < 48 && y > 15 && y < 40;
    for (let i = 0; i < 900; i++) { const x = rnd(0, 120), y = rnd(0, 60); if (!inBoss(x, y)) cloud.push([x, y, 10 + nz(), 0]); }
    for (let i = 0; i < 380; i++) cloud.push([rnd(0, 120), 60 + nz(), rnd(10, 50), 0]);
    for (let i = 0; i < 160; i++) cloud.push([rnd(0, 120), rnd(60, 70), 50 + nz(), 0]);
    for (let i = 0; i < 160; i++) cloud.push([rnd(20, 48), rnd(15, 40), 24 + nz(), 0]);
    for (let i = 0; i < 120; i++) cloud.push([rnd(20, 48), 15 + nz(), rnd(10, 24), 0]);
    for (let i = 0; i < 100; i++) cloud.push([48 + nz(), rnd(15, 40), rnd(10, 24), 0]);
    for (let i = 0; i < 160; i++) cloud.push([rnd(0, 120), nz(), rnd(0, 10), 0]);
    for (let i = 0; i < 420; i++) { const x = rnd(-30, 150), y = rnd(-25, 105); if (x < -2 || x > 122 || y < -2 || y > 82) cloud.push([x, y, nz() * .6, 1]); }

    const rotZ = (p, a) => { const c = Math.cos(a), s = Math.sin(a), x = p[0] - C[0], y = p[1] - C[1]; return [x * c - y * s + C[0], x * s + y * c + C[1], p[2]]; };
    const rotX = (p, a) => { const c = Math.cos(a), s = Math.sin(a), y = p[1] - C[1], z = p[2] - C[2]; return [p[0], y * c - z * s + C[1], y * s + z * c + C[2]]; };
    const pose = (p, P) => { let q = rotX(p, P.fx); q = rotZ(q, P.rz); return [q[0] + P.tx, q[1] + P.ty, q[2] + P.tz]; };
    let yaw = 0;
    const proj = (p) => {
      const sc = Math.min(S.w / 185, S.h / 128), x = p[0] - 60, y = p[1] - 40, z = p[2];
      const c = Math.cos(yaw), s = Math.sin(yaw), rx = x * c - y * s, ry = x * s + y * c;
      return [S.w / 2 + rx * sc, S.h * .6 + ry * sc * .62 - z * sc * .8];
    };
    const line3 = (a, b) => { const p = proj(a), q = proj(b); ctx.moveTo(p[0], p[1]); ctx.lineTo(q[0], q[1]); };

    const cands = [
      { rz: Math.PI, fx: 0 }, { rz: Math.PI / 2, fx: 0 }, { rz: 0, fx: Math.PI }, { rz: -Math.PI / 2, fx: 0 },
      { rz: Math.PI / 2, fx: Math.PI }, { rz: 0.35, fx: 0 }, { rz: 0.12, fx: 0 }
    ].map((c, i) => ({ ...c, tx: i < 5 ? rnd(-14, 14) : 7, ty: i < 5 ? rnd(-10, 10) : -5, tz: 0, score: i < 5 ? rnd(.08, .35) : (i === 5 ? .61 : .83) }));

    const PH = [ [0, 'LOAD CAD', 0], [1.2, 'SEARCH POSES', 1], [4.6, 'ICP REFINE', 2], [6.3, 'MEASURE SEAMS', 3], [8.4, 'SEND TO ARM', 4], [10.6, 'PROGRAM SENT', 4] ];
    const T = 12.4;
    let tt = 0, lastPh = -1;

    loop(S, (dt) => {
      tt = reduced ? 9.9 : (tt + dt) % T;
      yaw = reduced ? -.55 : -.55 + Math.sin(performance.now() / 4000) * .25;
      let ph = 0; for (let i = 0; i < PH.length; i++) if (tt >= PH[i][0]) ph = i;
      if (ph !== lastPh) {
        lastPh = ph; chip.textContent = PH[ph][1]; chip.classList.toggle('ok', ph >= 3);
        steps.forEach((li, i) => { li.classList.toggle('on', i === PH[ph][2] && ph < 5); li.classList.toggle('done', i < PH[ph][2] || ph === 5); });
      }
      const { w, h } = S; ctx.clearRect(0, 0, w, h);
      // grid floor
      ctx.strokeStyle = 'rgba(120,190,255,.07)'; ctx.lineWidth = 1; ctx.beginPath();
      for (let x = -60; x <= 180; x += 20) line3([x, -50, 0], [x, 130, 0]);
      for (let y = -50; y <= 130; y += 20) line3([-60, y, 0], [180, y, 0]);
      ctx.stroke();
      // point cloud (coloured by height)
      const reveal = Math.min(1, tt / 1.0);
      for (let i = 0; i < cloud.length * reveal; i++) {
        const p = cloud[i], q = proj(p);
        if (p[3]) { ctx.fillStyle = 'rgba(120,150,190,.28)'; }
        else { const k = p[2] / 50; ctx.fillStyle = `rgba(${70 + k * 120 | 0},${227 - k * 60 | 0},255,.75)`; }
        ctx.fillRect(q[0], q[1], 1.6, 1.6);
      }
      // CAD wireframe at current hypothesis
      let P = null, col = 'rgba(255,192,97,.85)', score = 0, label = '';
      if (ph === 1) {
        const k = Math.min(cands.length - 1, Math.floor((tt - 1.2) / ((4.6 - 1.2) / cands.length)));
        P = cands[k]; score = P.score; label = `candidate ${k + 1}/48 · score ${score.toFixed(2)}`;
        col = score > .7 ? 'rgba(255,192,97,.95)' : 'rgba(248,113,113,.7)';
      } else if (ph === 2) {
        const u = Math.min(1, (tt - 4.6) / 1.5), e = 1 - Math.pow(1 - u, 3), c0 = cands[cands.length - 1];
        P = { rz: c0.rz * (1 - e), fx: 0, tx: c0.tx * (1 - e), ty: c0.ty * (1 - e), tz: 0 };
        score = .83 + .15 * e; label = `ICP rms ${(3.1 - 2.6 * e).toFixed(2)} mm · inliers ${(71 + 26 * e) | 0}%`;
        col = e > .95 ? 'rgba(74,222,128,.95)' : 'rgba(255,192,97,.95)';
      } else if (ph >= 3) {
        P = { rz: 0, fx: 0, tx: 0, ty: 0, tz: 0 }; col = 'rgba(74,222,128,.75)'; label = 'LOCKED · pose averaged over 12 frames';
      }
      if (P) {
        ctx.strokeStyle = col; ctx.lineWidth = 1.4; ctx.beginPath();
        for (const [a, b] of edges) line3(pose(a, P), pose(b, P));
        ctx.stroke();
      }
      // seams
      if (ph >= 3) {
        const u = Math.min(1, (tt - 6.3) / 1.4);
        seams.forEach((sm, i) => {
          const k = Math.max(0, Math.min(1, u * 3 - i));
          if (!k) return;
          ctx.setLineDash([4, 4]); ctx.strokeStyle = 'rgba(169,189,211,.6)'; ctx.lineWidth = 1.2; ctx.beginPath(); line3(sm.a, sm.b); ctx.stroke(); ctx.setLineDash([]);
          const a = sm.a.map((v, j) => v + sm.off[j]), b = sm.b.map((v, j) => v + sm.off[j]);
          const e = a.map((v, j) => v + (b[j] - v) * k);
          const c = sm.conf === 'ok' ? '#4ade80' : '#fbbf24';
          ctx.strokeStyle = c; ctx.lineWidth = 3.2; ctx.shadowColor = c; ctx.shadowBlur = 10; ctx.beginPath(); line3(a, e); ctx.stroke(); ctx.shadowBlur = 0;
          const m = proj(a.map((v, j) => (v + b[j]) / 2));
          if (k === 1) { ctx.strokeStyle = c; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(m[0], m[1] - 14, 5, 0, 6.283); ctx.stroke(); }
        });
      }
      // torch poses
      if (ph >= 4) {
        const u = Math.min(1, (tt - 8.4) / 1.8);
        seams.forEach((sm, si) => {
          const a = sm.a.map((v, j) => v + sm.off[j]), b = sm.b.map((v, j) => v + sm.off[j]);
          const n = si === 0 ? 6 : 3;
          for (let i = 0; i < n; i++) {
            const f = i / (n - 1); if (f > u * 1.4 - si * .2) continue;
            const p = a.map((v, j) => v + (b[j] - v) * f);
            const o = proj(p);
            const dir = si === 0 ? [0, -10, 10] : (si === 1 ? [0, -9, 9] : [9, 0, 9]);
            const z = proj([p[0] + dir[0] * .9, p[1] + dir[1] * .9, p[2] + dir[2] * .9]);
            const tv = proj([p[0] + (b[0] - a[0]) / (Math.hypot(b[0] - a[0], b[1] - a[1]) || 1) * 8, p[1] + (b[1] - a[1]) / (Math.hypot(b[0] - a[0], b[1] - a[1]) || 1) * 8, p[2]]);
            ctx.lineWidth = 1.6;
            ctx.strokeStyle = '#46e3ff'; ctx.beginPath(); ctx.moveTo(o[0], o[1]); ctx.lineTo(z[0], z[1]); ctx.stroke();
            ctx.strokeStyle = '#f87171'; ctx.beginPath(); ctx.moveTo(o[0], o[1]); ctx.lineTo(tv[0], tv[1]); ctx.stroke();
          }
        });
      }
      // HUD text
      ctx.font = mono(11); ctx.fillStyle = 'rgba(169,189,211,.85)';
      ctx.fillText('D435 depth · 848×480 · table plane removed', 12, 20);
      if (label) { ctx.fillStyle = ph >= 3 ? '#4ade80' : '#ffc061'; ctx.fillText(label, 12, 38); }
      if (ph >= 3) {
        ctx.fillStyle = 'rgba(169,189,211,.85)';
        ctx.fillText('— measured   - - CAD-only', 12, h - 30);
        ctx.fillText(ph >= 4 ? 'z torch axis · x travel  →  T_base_cam' : 'seams: 2 green · 1 amber (>3 mm off CAD)', 12, h - 13);
      }
      if (ph === 5) { ctx.fillStyle = '#4ade80'; ctx.font = mono(12); ctx.fillText('weld program → arm  ✓', w - 190, h - 13); }
    });
  })();

  /* =================================================================
     2. ATAL — underwater camera, YOLO boxes, PID-stabilised attitude
     ================================================================= */
  (() => {
    const cv = document.getElementById('atalCanvas'); if (!cv) return;
    const S = stage(cv), ctx = S.ctx;
    const st = { roll: 0, pitch: 0, wr: 0, wp: 0, depth: 2.4, yaw: 0 };
    const hist = [];
    const motes = Array.from({ length: 70 }, () => ({ x: Math.random(), y: Math.random(), z: Math.random() }));
    const modeEl = document.getElementById('atalMode');
    let recover = 0;
    document.getElementById('atalKick').addEventListener('click', () => {
      st.wr += (Math.random() < .5 ? -1 : 1) * 1.6; st.wp += (Math.random() - .5) * 1.2; recover = 2.5;
    });
    // 3-D toggle
    const view3d = document.getElementById('atal3d');
    document.querySelectorAll('[data-atal]').forEach(b => b.addEventListener('click', () => {
      document.querySelectorAll('[data-atal]').forEach(x => x.classList.toggle('on', x === b));
      view3d.hidden = b.dataset.atal !== '3d';
    }));
    document.getElementById('load3d').addEventListener('click', () => {
      view3d.innerHTML = '<iframe title="ATAL AUV-IITK 3D model" allow="autoplay; fullscreen; xr-spatial-tracking" allowfullscreen src="https://sketchfab.com/models/b5b6cf667d7a463b87abfa6c48be65ba/embed?autostart=1&autospin=0.25&ui_theme=dark&dnt=1"></iframe>';
    });

    let t = 0;
    loop(S, (dt) => {
      t += dt;
      // cascaded PID, collapsed to a damped second-order response per axis + small wave disturbance
      const wn = 3.2, z = .38;
      const dist = Math.sin(t * .9) * .03 + Math.sin(t * 2.3) * .015;
      st.wr += (-2 * z * wn * st.wr - wn * wn * st.roll + dist) * dt; st.roll += st.wr * dt;
      st.wp += (-2 * z * wn * st.wp - wn * wn * st.pitch + dist * .6) * dt; st.pitch += st.wp * dt;
      st.depth = 2.4 + Math.sin(t * .4) * .03; st.yaw = (st.yaw + dt * 2) % 360;
      hist.push(st.roll); if (hist.length > 120) hist.shift();
      recover = Math.max(0, recover - dt);
      const m = recover > 0 ? 'STABILIZING' : 'AUTONOMOUS'; if (modeEl.textContent !== m) modeEl.textContent = m;

      const { w, h } = S;
      ctx.save();
      ctx.translate(w / 2, h / 2); ctx.rotate(-st.roll * .35); ctx.translate(0, st.pitch * 60); ctx.translate(-w / 2, -h / 2);
      // water
      const g = ctx.createLinearGradient(0, -h * .3, 0, h * 1.3);
      g.addColorStop(0, '#0f5560'); g.addColorStop(.45, '#0a3a45'); g.addColorStop(1, '#03161c');
      ctx.fillStyle = g; ctx.fillRect(-w * .3, -h * .5, w * 1.6, h * 2);
      // pool floor tiles with perspective
      const hy = h * .42;
      ctx.strokeStyle = 'rgba(160,230,230,.08)'; ctx.lineWidth = 1; ctx.beginPath();
      for (let i = -12; i <= 12; i++) { ctx.moveTo(w / 2 + i * 12, hy); ctx.lineTo(w / 2 + i * 160, h * 1.4); }
      for (let k = 1; k < 9; k++) { const y = hy + Math.pow(k / 8, 2.2) * (h * 1.0); ctx.moveTo(-w * .3, y); ctx.lineTo(w * 1.3, y); }
      ctx.stroke();
      // caustic shimmer on the floor
      ctx.globalCompositeOperation = 'lighter';
      for (let i = 0; i < 14; i++) {
        const x = (i * 97 + Math.sin(t * .7 + i) * 30) % (w * 1.2) - w * .1, y = hy + 40 + (i * 53 % (h * .5));
        const r = 30 + (i % 4) * 14, rg = ctx.createRadialGradient(x, y, 0, x, y, r);
        rg.addColorStop(0, 'rgba(120,255,240,.06)'); rg.addColorStop(1, 'rgba(120,255,240,0)'); ctx.fillStyle = rg; ctx.fillRect(x - r, y - r, r * 2, r * 2);
      }
      ctx.globalCompositeOperation = 'source-over';
      // gate (two orange poles + bar), slightly drifting with yaw sway
      const sway = Math.sin(t * .35) * 18;
      const gx = w * .44 + sway, gw = w * .26, gy = h * .2, gh = h * .5;
      ctx.fillStyle = '#e8772e'; ctx.fillRect(gx, gy, 7, gh); ctx.fillRect(gx + gw, gy, 7, gh);
      ctx.fillStyle = '#1b1f24'; ctx.fillRect(gx, gy - 6, gw + 7, 8);
      // buoy
      const bx = w * .22 + Math.sin(t * .8) * 6 + sway * .6, by = h * (w < 440 ? .5 : .58) + Math.sin(t * 1.1) * 5, br = Math.max(10, w * .028);
      const bg = ctx.createRadialGradient(bx - br * .3, by - br * .3, 1, bx, by, br);
      bg.addColorStop(0, '#ff8a7a'); bg.addColorStop(1, '#a3221a'); ctx.fillStyle = bg; ctx.beginPath(); ctx.arc(bx, by, br, 0, 6.283); ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,.15)'; ctx.beginPath(); ctx.moveTo(bx, by + br); ctx.lineTo(bx, h * 1.2); ctx.stroke();
      // turbidity haze
      const hz = ctx.createRadialGradient(w / 2, h / 2, h * .2, w / 2, h / 2, w * .75);
      hz.addColorStop(0, 'rgba(20,80,90,0)'); hz.addColorStop(1, 'rgba(2,20,26,.65)'); ctx.fillStyle = hz; ctx.fillRect(-w * .3, -h * .5, w * 1.6, h * 2);
      // suspended particles
      for (const p of motes) {
        p.x = (p.x + dt * .01 * (p.z + .2)) % 1; p.y = (p.y + Math.sin(t + p.z * 9) * .0004 + 1) % 1;
        ctx.fillStyle = `rgba(200,240,240,${.15 + p.z * .35})`; ctx.fillRect(p.x * w, p.y * h, 1 + p.z * 1.5, 1 + p.z * 1.5);
      }
      ctx.restore();

      // detections (screen space, follow objects with jitter)
      const jit = () => (Math.random() - .5) * 2.5;
      const box = (x, y, bw, bh, lbl, c) => {
        ctx.strokeStyle = c; ctx.lineWidth = 1.6; ctx.strokeRect(x + jit(), y + jit(), bw, bh);
        ctx.font = mono(10); const tw = ctx.measureText(lbl).width + 8;
        ctx.fillStyle = c; ctx.fillRect(x, y - 15, tw, 15); ctx.fillStyle = '#021016'; ctx.fillText(lbl, x + 4, y - 4);
      };
      const rot = (x, y) => { const cx = w / 2, cy = h / 2, a = -st.roll * .35, dx = x - cx, dy = y - cy + st.pitch * 60; return [cx + dx * Math.cos(a) - dy * Math.sin(a), cy + dx * Math.sin(a) + dy * Math.cos(a)]; };
      const [g1x, g1y] = rot(gx - 6, gy - 12);
      box(g1x, g1y, gw + 20, gh + 20, `gate ${(.93 + Math.random() * .03).toFixed(2)}`, '#46e3ff');
      const [b1x, b1y] = rot(bx - br - 5, by - br - 5);
      box(b1x, b1y, br * 2 + 10, br * 2 + 10, `buoy ${(.89 + Math.random() * .04).toFixed(2)}`, '#ffc061');

      // attitude HUD
      ctx.save(); ctx.translate(w / 2, h / 2); ctx.rotate(st.roll * .35);
      ctx.strokeStyle = 'rgba(255,255,255,.75)'; ctx.lineWidth = 1.4;
      ctx.beginPath(); ctx.moveTo(-70, st.pitch * 60); ctx.lineTo(-24, st.pitch * 60); ctx.moveTo(24, st.pitch * 60); ctx.lineTo(70, st.pitch * 60); ctx.stroke();
      ctx.restore();
      ctx.strokeStyle = '#ffc061'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(w / 2 - 16, h / 2); ctx.lineTo(w / 2 - 5, h / 2); ctx.lineTo(w / 2, h / 2 + 5); ctx.lineTo(w / 2 + 5, h / 2); ctx.lineTo(w / 2 + 16, h / 2); ctx.stroke();
      // depth tape
      ctx.font = mono(10); ctx.fillStyle = 'rgba(232,242,255,.85)';
      ctx.fillText(`DEPTH ${st.depth.toFixed(2)} m`, w - 116, 20);
      ctx.fillText(`ROLL ${(st.roll * 57.3).toFixed(1)}°`, w - 116, 36);
      ctx.fillText(`PITCH ${(st.pitch * 57.3).toFixed(1)}°`, w - 116, 52);
      ctx.fillText('YOLOv11 · 30 fps · Orin', 10, 20);
      // roll history (setpoint 0)
      const small = w < 440, phh = small ? 26 : 40, pw = small ? w * .3 : 140, px = 10, py = h - phh - 12;
      ctx.fillStyle = 'rgba(1,7,17,.6)'; ctx.fillRect(px, py, pw, phh);
      ctx.strokeStyle = 'rgba(255,255,255,.2)'; ctx.beginPath(); ctx.moveTo(px, py + phh / 2); ctx.lineTo(px + pw, py + phh / 2); ctx.stroke();
      ctx.strokeStyle = '#46e3ff'; ctx.lineWidth = 1.4; ctx.beginPath();
      hist.forEach((v, i) => { const x = px + i / 119 * pw, y = py + phh / 2 - Math.max(-1, Math.min(1, v / 1)) * phh / 2; i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); });
      ctx.stroke(); ctx.fillStyle = 'rgba(169,189,211,.8)'; ctx.fillText('roll vs setpoint', px + 4, py - 4);
    });
  })();

  /* =================================================================
     3. Thor cluster — Ray router, replication vs tensor parallel, failover
     ================================================================= */
  (() => {
    const cv = document.getElementById('thorCanvas'); if (!cv) return;
    const S = stage(cv), ctx = S.ctx;
    const rpsEl = document.getElementById('thorRps');
    let mode = 'rep';
    const gpus = [0, 1, 2].map(i => ({ i, alive: true, rejoin: 0, busy: 0, cur: null, q: [] }));
    const reqs = []; const done = []; let routerQ = [], tpBusy = 0, tpCur = null, spawnT = 0, id = 0;
    const SVC = 1.0, SVC_TP = .8, LAMBDA = 3.6;

    document.querySelectorAll('#thorSeg button').forEach(b => b.addEventListener('click', () => {
      document.querySelectorAll('#thorSeg button').forEach(x => x.classList.toggle('on', x === b));
      mode = b.dataset.mode; done.length = 0;
      gpus.forEach(g => { routerQ.push(...g.q); g.q = []; if (g.cur) { routerQ.push(g.cur); g.cur = null; } g.busy = 0; });
      tpCur = null; tpBusy = 0;
      for (let i = reqs.length - 1; i >= 0; i--) { const r = reqs[i]; if (r.stage === 'toGpu') { routerQ.push(r); reqs.splice(i, 1); } else if (r.stage === 'shard') reqs.splice(i, 1); }
    }));
    const layout = () => {
      const { w, h } = S;
      return { src: [w * .08, h * .5], router: [w * .36, h * .5], gpu: [0, 1, 2].map(i => [w * .72, h * (.2 + i * .3)]), out: [w * .96, h * .5], gw: Math.min(150, w * .22), gh: Math.min(56, h * .18) };
    };
    cv.addEventListener('click', e => {
      const r = cv.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top, L = layout();
      gpus.forEach((g, i) => {
        const [gx, gy] = L.gpu[i];
        if (Math.abs(x - gx) < L.gw / 2 + 8 && Math.abs(y - gy) < L.gh / 2 + 8) {
          if (g.alive) { g.alive = false; routerQ.push(...g.q); if (g.cur) routerQ.push(g.cur); g.q = []; g.cur = null; g.busy = 0; if (mode === 'tp') { if (tpCur) routerQ.push(tpCur); tpCur = null; tpBusy = 0; } }
          else { g.alive = true; g.rejoin = 1.2; }
        }
      });
    });

    const pt = (a, b, k) => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k];
    let now = 0;
    loop(S, (dt) => {
      now += dt;
      const L = layout(), { w, h } = S;
      // arrivals
      spawnT += dt * LAMBDA;
      while (spawnT >= 1) { spawnT -= 1; reqs.push({ id: id++, k: 0, from: L.src, to: L.router, stage: 'in', y: (Math.random() - .5) * 30 }); }
      // move requests
      for (let i = reqs.length - 1; i >= 0; i--) {
        const r = reqs[i]; r.k += dt * 1.6;
        if (r.k >= 1) {
          if (r.stage === 'in') { if (routerQ.length < 10) { routerQ.push(r); } r.stage = 'router'; reqs.splice(i, 1); }
          else if (r.stage === 'toGpu') { (gpus[r.g].alive ? gpus[r.g].q : routerQ).push(r); reqs.splice(i, 1); }
          else if (r.stage === 'out') reqs.splice(i, 1);
        }
      }
      gpus.forEach(g => { if (g.rejoin > 0) g.rejoin -= dt; });
      const ready = gpus.filter(g => g.alive && g.rejoin <= 0);
      // dispatch
      if (mode === 'rep') {
        while (routerQ.length && ready.length) {
          const g = ready.reduce((a, b) => (a.q.length + (a.cur ? 1 : 0) <= b.q.length + (b.cur ? 1 : 0) ? a : b));
          if (g.q.length + (g.cur ? 1 : 0) >= 2) break;
          const r = routerQ.shift(); r.stage = 'toGpu'; r.g = g.i; r.k = 0; r.from = L.router; r.to = L.gpu[g.i]; reqs.push(r);
        }
        gpus.forEach(g => {
          if (!g.alive) return;
          if (!g.cur && g.q.length) { g.cur = g.q.shift(); g.busy = 0; }
          if (g.cur) { g.busy += dt / SVC; if (g.busy >= 1) { done.push(now); reqs.push({ k: 0, from: L.gpu[g.i], to: L.out, stage: 'out', y: 0, ok: 1 }); g.cur = null; g.busy = 0; } }
        });
      } else {
        const all = ready.length === 3;
        if (all && !tpCur && routerQ.length) { tpCur = routerQ.shift(); tpBusy = 0; gpus.forEach(g => { reqs.push({ k: 0, from: L.router, to: L.gpu[g.i], stage: 'shard', y: 0 }); }); }
        if (tpCur) { tpBusy += dt / SVC_TP; gpus.forEach(g => g.busy = tpBusy); if (tpBusy >= 1) { done.push(now); reqs.push({ k: 0, from: L.gpu[1], to: L.out, stage: 'out', y: 0, ok: 1 }); tpCur = null; tpBusy = 0; gpus.forEach(g => g.busy = 0); } }
      }
      for (let i = reqs.length - 1; i >= 0; i--) if (reqs[i].stage === 'shard' && reqs[i].k >= 1) reqs.splice(i, 1);
      while (done.length && now - done[0] > 6) done.shift();
      const span = Math.min(6, now);
      const thr = span > 1 ? done.length / span : 0;
      const rel = thr / (1 / SVC);
      rpsEl.textContent = `${rel.toFixed(1)}× one GPU`;

      // ---- draw
      ctx.clearRect(0, 0, w, h);
      ctx.lineWidth = 1;
      ctx.strokeStyle = 'rgba(120,190,255,.14)'; ctx.beginPath();
      ctx.moveTo(...L.src); ctx.lineTo(...L.router); L.gpu.forEach(p => { ctx.moveTo(...L.router); ctx.lineTo(p[0] - L.gw / 2, p[1]); ctx.moveTo(p[0] + L.gw / 2, p[1]); ctx.lineTo(...L.out); }); ctx.stroke();
      // NVLink-ish chatter in TP mode
      if (mode === 'tp' && tpCur) {
        ctx.strokeStyle = `rgba(167,139,250,${.4 + .4 * Math.sin(now * 20)})`; ctx.lineWidth = 2; ctx.setLineDash([3, 4]); ctx.lineDashOffset = -now * 40; ctx.beginPath();
        ctx.moveTo(L.gpu[0][0] + L.gw / 2 + 8, L.gpu[0][1]); ctx.quadraticCurveTo(L.gpu[0][0] + L.gw / 2 + 30, L.gpu[1][1], L.gpu[2][0] + L.gw / 2 + 8, L.gpu[2][1]);
        ctx.stroke(); ctx.setLineDash([]);
        ctx.font = mono(10); ctx.fillStyle = '#a78bfa'; ctx.fillText('all-reduce', L.gpu[1][0] + L.gw / 2 + 14, L.gpu[1][1] - 34);
      }
      // source
      ctx.font = mono(10); ctx.fillStyle = 'rgba(169,189,211,.9)'; ctx.textAlign = 'center';
      ctx.fillText('clients', L.src[0], L.src[1] - 22);
      ctx.fillStyle = '#46e3ff'; ctx.beginPath(); ctx.arc(L.src[0], L.src[1], 6, 0, 6.283); ctx.fill();
      // router
      const rw = Math.min(110, w * .17), rh = 44;
      ctx.fillStyle = '#0a1a2e'; ctx.strokeStyle = '#46e3ff'; ctx.lineWidth = 1.5;
      rr(L.router[0] - rw / 2, L.router[1] - rh / 2, rw, rh, 10); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#e8f2ff'; ctx.font = mono(11); ctx.fillText('Ray router', L.router[0], L.router[1] - 3);
      ctx.fillStyle = 'rgba(169,189,211,.9)'; ctx.font = mono(9); ctx.fillText(`queue ${routerQ.length}`, L.router[0], L.router[1] + 11);
      // gpus
      gpus.forEach((g, i) => {
        const [x, y] = L.gpu[i], gw = L.gw, gh = L.gh;
        const col = !g.alive ? '#f87171' : g.rejoin > 0 ? '#fbbf24' : '#4ade80';
        ctx.fillStyle = '#0a1a2e'; ctx.strokeStyle = col; ctx.lineWidth = 1.5; rr(x - gw / 2, y - gh / 2, gw, gh, 10); ctx.fill(); ctx.stroke();
        ctx.textAlign = 'left'; ctx.fillStyle = '#e8f2ff'; ctx.font = mono(10);
        ctx.fillText(`THOR ${i + 1}`, x - gw / 2 + 10, y - gh / 2 + 16);
        ctx.fillStyle = col; ctx.textAlign = 'right';
        ctx.fillText(!g.alive ? 'DOWN' : g.rejoin > 0 ? 'REJOINING' : mode === 'tp' ? 'SHARD 1/3' : 'QWEN-32B', x + gw / 2 - 10, y - gh / 2 + 16);
        // util bar
        const bw = gw - 20; ctx.fillStyle = 'rgba(255,255,255,.08)'; ctx.fillRect(x - gw / 2 + 10, y + 6, bw, 6);
        ctx.fillStyle = col; ctx.fillRect(x - gw / 2 + 10, y + 6, bw * (g.alive ? Math.min(1, g.busy) : 0), 6);
        if (mode === 'rep' && g.alive) { ctx.fillStyle = 'rgba(169,189,211,.8)'; ctx.textAlign = 'left'; ctx.font = mono(9); ctx.fillText(`q ${g.q.length}`, x - gw / 2 + 10, y + gh / 2 - 4); }
        if (!g.alive) { ctx.strokeStyle = '#f87171'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x - 10, y - 4); ctx.lineTo(x + 10, y + 14); ctx.moveTo(x + 10, y - 4); ctx.lineTo(x - 10, y + 14); ctx.stroke(); }
      });
      if (mode === 'tp' && ready.length < 3) { ctx.textAlign = 'center'; ctx.fillStyle = '#f87171'; ctx.font = mono(11); ctx.fillText('TP group incomplete — model can’t run', w * .5, h - 14); }
      ctx.textAlign = 'center'; ctx.fillStyle = 'rgba(169,189,211,.9)'; ctx.font = mono(10); ctx.fillText('responses', L.out[0] - 8, L.out[1] - 22);
      ctx.textAlign = 'left';
      // packets
      for (const r of reqs) {
        const [x, y] = pt(r.from, r.to, Math.min(1, r.k));
        ctx.fillStyle = r.stage === 'out' ? '#4ade80' : r.stage === 'shard' ? '#a78bfa' : '#46e3ff';
        ctx.beginPath(); ctx.arc(x, y + (r.stage === 'in' ? r.y * (1 - r.k) : 0), 3, 0, 6.283); ctx.fill();
      }
    });
    function rr(x, y, w, h, r) { ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); }
  })();

  /* =================================================================
     4. Scan reveal — particle segmentation and X-ray reading
     ================================================================= */
  function scanner({ root, tabs, items, onProgress, onDone }) {
    if (!root) return;
    const imgs = root.querySelectorAll('img');
    let i = 0, p = 0, hold = 0, visible = false, userPicked = false;
    new IntersectionObserver(es => { visible = es[0].isIntersecting; }, { threshold: .3 }).observe(root);
    const set = (k) => {
      i = k; p = 0; hold = 0;
      imgs.forEach(im => { im.src = items[k].src; });
      tabs.forEach((b, j) => b.classList.toggle('on', j === k));
      onProgress(items[k], 0);
    };
    tabs.forEach((b, j) => b.addEventListener('click', () => { userPicked = true; set(j); }));
    let last = performance.now();
    const f = (now) => {
      const dt = Math.min(64, now - last) / 1000; last = now;
      if (visible) {
        if (p < 100) {
          p = Math.min(100, p + dt * (reduced ? 1000 : 38));
          root.style.setProperty('--p', p + '%'); root.style.setProperty('--lo', 1);
          onProgress(items[i], p / 100);
          if (p >= 100) onDone(items[i]);
        } else {
          hold += dt; root.style.setProperty('--lo', Math.max(0, 1 - hold * 2));
          if (hold > 3.2 && !userPicked) set((i + 1) % items.length);
        }
      }
      requestAnimationFrame(f);
    };
    set(0); requestAnimationFrame(f);
  }

  const flowItems = [
    { src: 'assets/surge/surge_annotated_s2.jpg', name: 'GRANULAR BED', n: 142 },
    { src: 'assets/surge/surge_annotated_ore.jpg', name: 'IRON ORE', n: 96 },
    { src: 'assets/surge/surge_annotated_sinter.jpg', name: 'SINTER', n: 64 },
    { src: 'assets/surge/surge_annotated_wa.jpg', name: 'MIXED', n: 118 },
    { src: 'assets/surge/surge_particle_stream.webp', name: 'LIVE STREAM', n: 0 }
  ];
  const fl = document.getElementById('flowLabel'), fc = document.getElementById('flowCount');
  scanner({
    root: document.getElementById('flowScan'), tabs: [...document.querySelectorAll('#flowTabs button')], items: flowItems,
    onProgress: (it, k) => { fl.textContent = k < 1 ? `SEGMENTING · ${it.name}` : `DONE · ${it.name}`; fc.textContent = it.n ? `${Math.round(it.n * k)} masks` : `tracking @ high FPS`; },
    onDone: () => {}
  });

  const xItems = [
    { src: 'assets/xray/xray_cardiomegaly.jpg', name: 'CARDIOMEGALY', c: 96.4 },
    { src: 'assets/xray/xray_pleural.jpg', name: 'PLEURAL EFFUSION', c: 91.8 },
    { src: 'assets/xray/xray_pneumothorax.jpg', name: 'PNEUMOTHORAX', c: 89.2 }
  ];
  const xl = document.getElementById('xrayLabel'), xb = document.getElementById('xrayBar'), xc = document.getElementById('xrayConf');
  scanner({
    root: document.getElementById('xrayScan'), tabs: [...document.querySelectorAll('#xrayTabs button')], items: xItems,
    onProgress: (it, k) => { if (k === 0) { xb.style.width = '0'; xc.textContent = '—'; } if (k < 1) xl.textContent = 'READING FILM'; },
    onDone: (it) => { xl.textContent = it.name; xb.style.width = it.c + '%'; xc.textContent = `p = ${(it.c / 100).toFixed(3)}`; }
  });

  /* =================================================================
     5. Face compare slider
     ================================================================= */
  const cmp = document.getElementById('faceCompare');
  if (cmp) cmp.querySelector('input').addEventListener('input', e => cmp.style.setProperty('--pos', e.target.value + '%'));

  /* =================================================================
     6. XRF spectrum — counts accumulate, element peaks emerge
     ================================================================= */
  (() => {
    const cv = document.getElementById('xrfCanvas'); if (!cv) return;
    const S = stage(cv), ctx = S.ctx;
    const peaks = [['Mg', 1.25, .55], ['Al', 1.49, .7], ['Si', 1.74, 1], ['Ca', 3.69, .45], ['Fe', 6.40, .38]];
    const N = 220, E = i => .5 + i / N * 7.5;
    const counts = new Float32Array(N);
    const model = e => { let v = .18 * Math.exp(-(e - .9) / 2.2); for (const [, c, a] of peaks) v += a * Math.exp(-((e - c) ** 2) / (2 * .07 ** 2)); return v; };
    let t = 0;
    loop(S, (dt) => {
      t += dt; if (t > 9) { t = 0; counts.fill(0); }
      for (let k = 0; k < 900 * dt; k++) { const i = Math.random() * N | 0; if (Math.random() < model(E(i))) counts[i] += 1; }
      const { w, h } = S; ctx.clearRect(0, 0, w, h);
      let mx = 1; for (let i = 0; i < N; i++) mx = Math.max(mx, counts[i]);
      const pad = 22;
      ctx.strokeStyle = 'rgba(120,190,255,.15)'; ctx.beginPath(); ctx.moveTo(pad, h - pad); ctx.lineTo(w - 8, h - pad); ctx.stroke();
      ctx.beginPath();
      for (let i = 0; i < N; i++) { const x = pad + i / (N - 1) * (w - pad - 8), y = h - pad - counts[i] / mx * (h - pad * 2); i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }
      ctx.strokeStyle = '#46e3ff'; ctx.lineWidth = 1.4; ctx.stroke();
      ctx.lineTo(w - 8, h - pad); ctx.lineTo(pad, h - pad); ctx.closePath(); ctx.fillStyle = 'rgba(70,227,255,.08)'; ctx.fill();
      ctx.font = mono(10); ctx.textAlign = 'center';
      if (t > 2.5) for (const [el, c] of peaks) {
        const i = Math.round((c - .5) / 7.5 * N), x = pad + i / (N - 1) * (w - pad - 8), y = h - pad - counts[i] / mx * (h - pad * 2);
        ctx.fillStyle = '#ffc061'; ctx.fillText(el, x, Math.max(12, y - 6));
      }
      ctx.fillStyle = 'rgba(169,189,211,.8)'; ctx.textAlign = 'left'; ctx.fillText('CLASS XRF · flare-isolated', pad, 14);
      ctx.textAlign = 'right'; ctx.fillText('keV →', w - 10, h - 6); ctx.textAlign = 'left';
    });
  })();
})();
