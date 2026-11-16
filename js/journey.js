/* Journey as `git log --graph`, and the periodic table of skills. */
(() => {
  const D = window.SITE;
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  /* ---------------- git log ---------------- */
  const list = document.getElementById('gitlog');
  if (list) {
    const lanes = Object.fromEntries(D.branches.map((b, i) => [b.id, i]));
    const color = Object.fromEntries(D.branches.map(b => [b.id, b.color]));
    const LX = i => 12 + i * 17;
    const GW = LX(D.branches.length - 1) + 16;
    list.style.setProperty('--gw', GW + 'px');
    const span = {};
    D.commits.forEach((c, r) => { const s = span[c.b] || (span[c.b] = { min: r, max: r }); s.max = r; });
    span.main = { min: 0, max: D.commits.length - 1 };

    D.commits.forEach((c, r) => {
      const li = document.createElement('li');
      li.className = 'commit'; li.dataset.b = c.b;
      let g = '';
      for (const b of D.branches) {
        const s = span[b.id]; if (!s || r < s.min || r > s.max) continue;
        const top = r === s.min ? '21px' : '0', bottom = r === s.max ? 'calc(100% - 21px)' : '0';
        if (!(r === s.min && r === s.max)) g += `<span class="ln" style="left:${LX(lanes[b.id]) - 1}px;top:${top};bottom:${bottom};background:${b.color}"></span>`;
      }
      let paths = '';
      if (c.b !== 'main') {
        const x = LX(lanes[c.b]), x0 = LX(0), col = color[c.b], s = span[c.b];
        if (r === s.min) paths += `<path d="M${x} 21 C ${x} 8, ${x0} 12, ${x0} 0" stroke="${col}" stroke-width="2" fill="none"/>`;
        if (r === s.max) paths += `<path d="M${x} 21 C ${x} 34, ${x0} 30, ${x0} 44" stroke="${col}" stroke-width="2" fill="none"/>`;
      }
      if (paths) g += `<svg width="${GW}" height="44">${paths}</svg>`;
      g += `<span class="nd${c.head ? ' head' : ''}" style="left:${LX(lanes[c.b])}px;border-color:${color[c.b]}"></span>`;

      const refs = [
        c.head ? `<span class="ref head">HEAD → main</span>` : '',
        c.tag ? `<span class="ref tag">tag: ${esc(c.tag)}</span>` : '',
        c.ref ? `<span class="ref br" style="--c:${color[c.b]}">${esc(c.ref)}</span>` : ''
      ].join('');
      const isExt = /^https?:/.test(c.link);
      li.innerHTML = `
        <div class="graph">${g}</div>
        <div>
          <button class="c-row" aria-expanded="false">
            <span class="c-hash">${c.hash}</span>
            <span class="c-msg">${refs}<span class="ty">${esc(c.type)}:</span> ${esc(c.msg)}</span>
            <span class="c-date">${esc(c.date)}</span>
          </button>
          <div class="c-diff"><div class="c-diff-inner">
            <div class="meta">commit ${c.hash}${'0'.repeat(4)}… · branch ${esc(D.branches[lanes[c.b]].name)}<br>Author: Suyash Kumar · Date: ${esc(c.date)}</div>
            ${c.diff.map(d => `<span class="add">+ ${esc(d)}</span>`).join('')}
            <span class="stat">${c.diff.length} insertion${c.diff.length > 1 ? 's' : ''}(+), 0 deletions(-) · <a href="${esc(c.link)}"${isExt ? ' target="_blank" rel="noopener"' : ''}>${isExt ? 'open on GitHub ↗' : 'jump to it ↓'}</a></span>
          </div></div>
        </div>`;
      const btn = li.querySelector('.c-row');
      btn.addEventListener('click', () => { const o = li.classList.toggle('open'); btn.setAttribute('aria-expanded', o); });
      list.appendChild(li);
    });
    // open HEAD by default
    const first = list.querySelector('.commit'); first.classList.add('open'); first.querySelector('.c-row').setAttribute('aria-expanded', 'true');

    // branch filter
    const bf = document.getElementById('branchFilter');
    const btns = [{ id: '*', name: '--all', color: '#e8f2ff' }, ...D.branches].map(b => {
      const el = document.createElement('button');
      el.className = 'bf'; el.style.setProperty('--c', b.color); el.setAttribute('aria-pressed', b.id === '*');
      el.innerHTML = `<i></i>${esc(b.name)}`; el.dataset.b = b.id; bf.appendChild(el); return el;
    });
    btns.forEach(el => el.addEventListener('click', () => {
      btns.forEach(x => x.setAttribute('aria-pressed', x === el));
      list.querySelectorAll('.commit').forEach(li => li.classList.toggle('dim', el.dataset.b !== '*' && li.dataset.b !== el.dataset.b));
    }));
  }

  /* ---------------- periodic table ---------------- */
  const pt = document.getElementById('ptable');
  if (pt) {
    const grp = Object.fromEntries(D.groups.map(g => [g.id, g]));
    const detail = document.getElementById('pdetail');
    const show = (e, i, tile) => {
      pt.querySelectorAll('.el').forEach(x => x.classList.toggle('sel', x === tile));
      const g = grp[e.g];
      detail.style.setProperty('--c', g.color);
      detail.innerHTML = `
        <div class="pd-tile"><span class="n"><span>${i + 1}</span><span>${e.u.length}</span></span><span class="s">${esc(e.s)}</span><span class="w">${esc(e.n)}</span></div>
        <p class="grp">${esc(g.name)}</p>
        <h4>${esc(e.n)}</h4>
        <p>${esc(e.d)}</p>
        ${e.u.length ? `<p style="margin-top:1rem;color:var(--ink-3);font:500 .7rem var(--f-mono)">FOUND IN</p><ul>${e.u.map(k => `<li><a href="${D.projects[k].href}">${esc(D.projects[k].label)}</a></li>`).join('')}</ul>` : ''}`;
    };
    D.elements.forEach((e, i) => {
      const b = document.createElement('button');
      b.className = 'el'; b.dataset.g = e.g;
      b.style.setProperty('--c', grp[e.g].color); b.style.setProperty('--i', i);
      b.setAttribute('aria-label', `${e.n}, ${grp[e.g].name}`);
      b.innerHTML = `<span class="n">${i + 1}</span><span class="s">${esc(e.s)}</span><span class="nm">${esc(e.n)}</span>`;
      b.addEventListener('click', () => show(e, i, b));
      b.addEventListener('mouseenter', () => { if (matchMedia('(pointer: fine)').matches) show(e, i, b); });
      pt.appendChild(b);
    });
    show(D.elements[0], 0, pt.firstChild);
    new IntersectionObserver((es, o) => { if (es[0].isIntersecting) { pt.classList.add('in'); o.disconnect(); } }, { threshold: .15 }).observe(pt);

    const lg = document.getElementById('plegend');
    const lbtns = D.groups.map(g => {
      const el = document.createElement('button');
      el.className = 'pl'; el.style.setProperty('--c', g.color); el.setAttribute('aria-pressed', 'false');
      el.innerHTML = `<i></i>${esc(g.name)}`; lg.appendChild(el); el.dataset.g = g.id; return el;
    });
    lbtns.forEach(el => el.addEventListener('click', () => {
      const on = el.getAttribute('aria-pressed') !== 'true';
      lbtns.forEach(x => x.setAttribute('aria-pressed', on && x === el));
      pt.querySelectorAll('.el').forEach(t => t.classList.toggle('fade', on && t.dataset.g !== el.dataset.g));
    }));
  }
})();
