/**
 * SUYASH KUMAR — TELEMETRY & LIVE HUD ENGINE
 */

const TelemetryEngine = {
  init() {
    this.initClock();
    this.initTheme();
    this.initCounters();
    this.initScrollSpy();
  },

  initClock() {
    const clockEl = document.getElementById('utcClock');
    if (!clockEl) return;

    const updateClock = () => {
      const now = new Date();
      // Format as IST / UTC+05:30
      const options = {
        timeZone: 'Asia/Kolkata',
        hour12: false,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      };
      const timeStr = now.toLocaleTimeString('en-GB', options);
      clockEl.textContent = `IST ${timeStr}`;
    };

    updateClock();
    setInterval(updateClock, 1000);
  },

  initTheme() {
    const themeBtn = document.getElementById('themeToggleBtn');
    const savedTheme = localStorage.getItem('suyash_theme') || 'dark';
    
    document.documentElement.setAttribute('data-theme', savedTheme);
    this.updateThemeIcon(savedTheme);

    if (themeBtn) {
      themeBtn.addEventListener('click', () => {
        const current = document.documentElement.getAttribute('data-theme') || 'dark';
        const next = current === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', next);
        localStorage.setItem('suyash_theme', next);
        this.updateThemeIcon(next);
      });
    }
  },

  updateThemeIcon(theme) {
    const themeIcon = document.getElementById('themeIcon');
    if (!themeIcon) return;
    if (theme === 'light') {
      themeIcon.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>`;
    } else {
      themeIcon.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>`;
    }
  },

  initCounters() {
    const countElements = document.querySelectorAll('[data-target-count]');
    
    const animateCounter = (el) => {
      const target = parseFloat(el.getAttribute('data-target-count'));
      const prefix = el.getAttribute('data-prefix') || '';
      const suffix = el.getAttribute('data-suffix') || '';
      const isDecimal = target % 1 !== 0;
      let start = 0;
      const duration = 1400;
      const startTime = performance.now();

      const step = (now) => {
        const progress = Math.min((now - startTime) / duration, 1);
        const easeProgress = 1 - Math.pow(1 - progress, 3);
        const current = start + (target - start) * easeProgress;
        
        el.textContent = `${prefix}${isDecimal ? current.toFixed(1) : Math.floor(current).toLocaleString()}${suffix}`;
        
        if (progress < 1) {
          requestAnimationFrame(step);
        } else {
          el.textContent = `${prefix}${isDecimal ? target.toFixed(1) : target.toLocaleString()}${suffix}`;
        }
      };

      requestAnimationFrame(step);
    };

    const observer = new IntersectionObserver((entries, obs) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          animateCounter(entry.target);
          obs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.2 });

    countElements.forEach(el => observer.observe(el));
  },

  initScrollSpy() {
    const navLinks = document.querySelectorAll('.nav-link-item a');
    const sections = document.querySelectorAll('section[id]');

    window.addEventListener('scroll', () => {
      let current = '';
      const scrollPos = window.pageYOffset || document.documentElement.scrollTop;

      sections.forEach(section => {
        const sectionTop = section.offsetTop - 120;
        const sectionHeight = section.offsetHeight;
        if (scrollPos >= sectionTop && scrollPos < sectionTop + sectionHeight) {
          current = section.getAttribute('id');
        }
      });

      navLinks.forEach(link => {
        link.parentElement.classList.remove('active');
        if (link.getAttribute('href') === `#${current}`) {
          link.parentElement.classList.add('active');
        }
      });
    }, { passive: true });
  }
};
