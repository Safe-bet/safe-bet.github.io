/**
 * SUYASH KUMAR — MAIN APPLICATION BOOTSTRAP
 */

document.addEventListener('DOMContentLoaded', () => {
  // Initialize Core Subsystems
  TelemetryEngine.init();
  InteractiveDemos.init();
  DeveloperTerminal.init();

  // Mobile Navigation Drawer Toggle
  const mobileToggle = document.getElementById('mobileNavToggle');
  const mobileDrawer = document.getElementById('mobileMenuDrawer');

  if (mobileToggle && mobileDrawer) {
    mobileToggle.addEventListener('click', () => {
      mobileDrawer.classList.toggle('open');
    });

    const mobileLinks = mobileDrawer.querySelectorAll('a');
    mobileLinks.forEach(link => {
      link.addEventListener('click', () => {
        mobileDrawer.classList.remove('open');
      });
    });
  }

  // Workbench Category Filter
  const filterBtns = document.querySelectorAll('.workbench-filter-bar .filter-btn');
  const projectCards = document.querySelectorAll('.workbench-card');

  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const cat = btn.getAttribute('data-filter');

      projectCards.forEach(card => {
        const cardCat = card.getAttribute('data-category');
        if (cat === 'all' || cardCat.includes(cat)) {
          card.style.display = 'grid';
          card.style.opacity = '1';
        } else {
          card.style.display = 'none';
        }
      });
    });
  });

  console.log("%c SUYASH KUMAR — SYSTEMS & AI ENGINEERING DASHBOARD READY %c", 
    "background:#1a4dff; color:#fff; font-weight:bold; padding:4px 8px; border-radius:4px;", 
    "color:#10b981; font-family:monospace;");
});
