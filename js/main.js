/* Intro, nav, scroll reveal, counters, active section, scroll-lit text,
   heading decode, depth rules, panel glare, work-index preview. */
(() => {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = matchMedia('(pointer: fine)').matches;
  const nav = document.getElementById('nav');
  const menuBtn = document.getElementById('menuBtn');
  const store = { get(k) { try { return sessionStorage.getItem(k); } catch { return null; } }, set(k, v) { try { sessionStorage.setItem(k, v); } catch {} } };

  /* ---------- pre-dive intro ---------- */
  const intro = document.getElementById('intro');
  let readyCbs = [];
  const whenReady = fn => document.body.classList.contains('ready') ? fn() : readyCbs.push(fn);
  const ready = () => { document.body.classList.add('ready'); readyCbs.forEach(f => f()); readyCbs = []; };
  if (!intro || reduced || store.get('dove') || location.hash || document.documentElement.dataset.theme === 'hogwarts') {
    intro && intro.remove(); ready();
  } else {
    document.documentElement.classList.add('locked');
    const log = document.getElementById('introLog');
    const lines = [
      ['ATAL // PRE-DIVE CHECK', ''],
      ['IMU ............', 'OK'], ['DVL ............', 'OK'], ['STEREO IDS ×2 ..', 'OK'],
      ['EKF ............', 'CONVERGED'], ['THRUSTERS ×8 ...', 'ARMED'], ['', ''], ['DIVE ▼', 'go']
    ];
    let i = 0, done = false, timer;
    const finish = () => {
      if (done) return; done = true; clearTimeout(timer); store.set('dove', 1);
      intro.classList.add('drain');
      setTimeout(() => { document.documentElement.classList.remove('locked'); ready(); }, 380);
      setTimeout(() => intro.remove(), 1400);
    };
    const next = () => {
      if (i >= lines.length) { timer = setTimeout(finish, 380); return; }
      const [a, b] = lines[i++];
      log.innerHTML += b === 'go' ? `<span class="go">${a}</span>\n` : b ? `${a} <span class="ok">${b}</span>\n` : `${a}\n`;
      timer = setTimeout(next, i === 1 ? 380 : 190);
    };
    next();
    document.getElementById('introSkip').addEventListener('click', finish);
    addEventListener('keydown', finish, { once: true });
    intro.addEventListener('click', finish);
  }

  const hint = document.getElementById('torchHint');
  if (hint && !fine) hint.textContent = 'ATAL is out exploring with its lamp. Tap anywhere to ping sonar.';

  /* ---------- nav ---------- */
  addEventListener('scroll', () => nav.classList.toggle('scrolled', scrollY > 30), { passive: true });
  menuBtn.addEventListener('click', () => { const o = nav.classList.toggle('open'); menuBtn.setAttribute('aria-expanded', o); });
  nav.querySelectorAll('.nav-links a').forEach(a => a.addEventListener('click', () => { nav.classList.remove('open'); menuBtn.setAttribute('aria-expanded', 'false'); }));

  /* ---------- reveal ---------- */
  const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { threshold: .08, rootMargin: '0px 0px -40px 0px' });
  document.querySelectorAll('.reveal').forEach(el => io.observe(el));

  /* ---------- counters ---------- */
  const run = el => {
    const to = parseFloat(el.dataset.count), dec = +el.dataset.dec || 0, pre = el.dataset.prefix || '', suf = el.dataset.suffix || '';
    if (reduced) { el.textContent = pre + to.toFixed(dec) + suf; return; }
    const t0 = performance.now(), dur = 1500;
    const tick = t => { const p = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - p, 3); el.textContent = pre + (to * e).toFixed(dec) + suf; if (p < 1) requestAnimationFrame(tick); };
    requestAnimationFrame(tick);
  };
  whenReady(() => {
    const co = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { setTimeout(() => run(e.target), 500); co.unobserve(e.target); } }), { threshold: .6 });
    document.querySelectorAll('[data-count]').forEach(el => co.observe(el));
  });

  /* ---------- active nav link ---------- */
  const links = Object.fromEntries([...nav.querySelectorAll('.nav-links a')].map(a => [a.getAttribute('href').slice(1), a]));
  const so = new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting) { Object.values(links).forEach(a => a.classList.remove('active')); const id = e.target.id === 'lead' ? 'oss' : e.target.id; links[id] && links[id].classList.add('active'); }
  }), { rootMargin: '-45% 0px -50% 0px' });
  document.querySelectorAll('main section[id]').forEach(s => so.observe(s));

  /* ---------- scroll-lit manifesto: words light up like a torch passing ---------- */
  const lit = document.getElementById('lit');
  if (lit) {
    const words = [];
    const wrap = (node, em) => {
      [...node.childNodes].forEach(n => {
        if (n.nodeType === 3) {
          const frag = document.createDocumentFragment();
          n.textContent.split(/(\s+)/).forEach(part => {
            if (!part) return;
            if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(part)); return; }
            const s = document.createElement('span'); s.className = 'w' + (em ? ' em' : ''); s.textContent = part; words.push(s); frag.appendChild(s);
          });
          n.replaceWith(frag);
        } else wrap(n, em || n.tagName === 'EM');
      });
    };
    wrap(lit, false);
    const upd = () => {
      const r = lit.getBoundingClientRect();
      const p = reduced ? 1 : Math.max(0, Math.min(1, (innerHeight * .85 - r.top) / (r.height + innerHeight * .35)));
      const n = Math.round(p * words.length);
      words.forEach((w, i) => w.classList.toggle('on', i < n));
    };
    addEventListener('scroll', upd, { passive: true }); addEventListener('resize', upd); upd();
  }

  /* ---------- heading decode (sonar readout) ---------- */
  const glyphs = '01<>/[]{}#=+*~^ABCDEF';
  const decode = el => {
    if (reduced) return;
    const nodes = []; const walk = n => n.childNodes.forEach(c => c.nodeType === 3 ? nodes.push([c, c.textContent]) : walk(c)); walk(el);
    const t0 = performance.now(), dur = 750;
    el.classList.add('decoding');
    const tick = now => {
      const p = (now - t0) / dur;
      nodes.forEach(([n, txt]) => {
        n.textContent = [...txt].map((ch, i) => (ch === ' ' || i / txt.length < p * 1.15 - .15) ? ch : glyphs[(Math.random() * glyphs.length) | 0]).join('');
      });
      if (p < 1) requestAnimationFrame(tick); else { nodes.forEach(([n, txt]) => n.textContent = txt); el.classList.remove('decoding'); }
    };
    requestAnimationFrame(tick);
  };
  const dio = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { decode(e.target); dio.unobserve(e.target); } }), { threshold: .6 });
  document.querySelectorAll('.sec-head h2, .contact-title').forEach(h => dio.observe(h));

  /* ---------- depth rules between zones ---------- */
  document.querySelectorAll('main section[data-depth]').forEach(sec => {
    const m = +sec.dataset.depth; if (!m || sec.id === 'lead') return;
    const r = document.createElement('div'); r.className = 'depth-rule'; r.setAttribute('aria-hidden', 'true');
    r.innerHTML = `<span>${m.toLocaleString('en-US')} m · ${sec.dataset.zone} · ${Math.round(1 + m * .09924).toLocaleString('en-US')} atm</span>`;
    sec.prepend(r);
  });

  /* ---------- glare on panels ---------- */
  if (fine) document.querySelectorAll('.viz, .oss, .mini, .lead-card, .term, .pdetail').forEach(el => {
    el.classList.add('glare');
    el.addEventListener('pointermove', e => { const r = el.getBoundingClientRect(); el.style.setProperty('--gx', e.clientX - r.left + 'px'); el.style.setProperty('--gy', e.clientY - r.top + 'px'); });
  });

  /* ---------- work index: floating live preview ---------- */
  const pv = document.getElementById('ixPreview');
  if (pv && fine) {
    const img = pv.querySelector('img');
    const pos = { x: 0, y: 0 }, cur = { x: 0, y: 0 }; let on = false;
    document.querySelectorAll('#workIndex a').forEach(a => {
      a.addEventListener('pointerenter', () => {
        let src = a.dataset.img;
        if (a.dataset.prev) { const c = document.getElementById(a.dataset.prev); try { src = c.toDataURL('image/jpeg', .8); } catch { src = ''; } }
        if (!src) { pv.classList.remove('on'); on = false; return; }
        img.src = src; pv.classList.add('on'); on = true;
      });
      a.addEventListener('pointerleave', () => { pv.classList.remove('on'); on = false; });
    });
    addEventListener('pointermove', e => { pos.x = e.clientX + 170; pos.y = e.clientY; }, { passive: true });
    const f = () => { cur.x += (pos.x - cur.x) * .18; cur.y += (pos.y - cur.y) * .18; if (on) { pv.style.left = cur.x + 'px'; pv.style.top = cur.y + 'px'; } requestAnimationFrame(f); };
    f();
  }
})();
