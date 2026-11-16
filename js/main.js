/* Nav, scroll reveal, counters, active section. */
(() => {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const nav = document.getElementById('nav');
  const menuBtn = document.getElementById('menuBtn');

  addEventListener('scroll', () => nav.classList.toggle('scrolled', scrollY > 30), { passive: true });
  menuBtn.addEventListener('click', () => {
    const o = nav.classList.toggle('open'); menuBtn.setAttribute('aria-expanded', o);
  });
  nav.querySelectorAll('.nav-links a').forEach(a => a.addEventListener('click', () => { nav.classList.remove('open'); menuBtn.setAttribute('aria-expanded', 'false'); }));

  // reveal on scroll
  const io = new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
  }), { threshold: .08, rootMargin: '0px 0px -40px 0px' });
  document.querySelectorAll('.reveal').forEach(el => io.observe(el));

  // counters
  const run = el => {
    const to = parseFloat(el.dataset.count), dec = +el.dataset.dec || 0, pre = el.dataset.prefix || '', suf = el.dataset.suffix || '';
    if (reduced) { el.textContent = pre + to.toFixed(dec) + suf; return; }
    const t0 = performance.now(), dur = 1500;
    const tick = t => { const p = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - p, 3); el.textContent = pre + (to * e).toFixed(dec) + suf; if (p < 1) requestAnimationFrame(tick); };
    requestAnimationFrame(tick);
  };
  const co = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { run(e.target); co.unobserve(e.target); } }), { threshold: .6 });
  document.querySelectorAll('[data-count]').forEach(el => co.observe(el));

  // active nav link
  const links = Object.fromEntries([...nav.querySelectorAll('.nav-links a')].map(a => [a.getAttribute('href').slice(1), a]));
  const so = new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting) { Object.values(links).forEach(a => a.classList.remove('active')); const id = e.target.id === 'lead' ? 'oss' : e.target.id; links[id] && links[id].classList.add('active'); }
  }), { rootMargin: '-45% 0px -50% 0px' });
  document.querySelectorAll('main section[id]').forEach(s => so.observe(s));
})();
