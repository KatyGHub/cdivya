/**
 * nav.js
 * Handles nav scroll-state, hamburger toggle, and anchor smooth-close.
 */

export function initNav() {
  const nav       = document.getElementById('nav');
  const hamburger = document.getElementById('hamburger');
  const navLinks  = document.getElementById('navLinks');

  if (!nav) return;

  // ── Scroll-aware nav ───────────────────────────
  const handleScroll = () => {
    nav.classList.toggle('scrolled', window.scrollY > 40);
  };

  window.addEventListener('scroll', handleScroll, { passive: true });
  handleScroll();

  // ── Hamburger toggle ───────────────────────────
  const openMenu = () => {
    navLinks.classList.add('mobile-open');
    hamburger.classList.add('is-open');
    hamburger.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';
  };

  const closeMenu = () => {
    navLinks.classList.remove('mobile-open');
    hamburger.classList.remove('is-open');
    hamburger.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
  };

  hamburger?.addEventListener('click', () => {
    navLinks.classList.contains('mobile-open') ? closeMenu() : openMenu();
  });

  // Close on link click
  navLinks?.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', closeMenu);
  });

  // Close on Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeMenu();
  });

  // ── Active link highlight on scroll ───────────
  const sections = document.querySelectorAll('section[id]');

  const linkObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          navLinks?.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
          const match = navLinks?.querySelector(`[href="#${entry.target.id}"]`);
          match?.classList.add('active');
        }
      });
    },
    { rootMargin: '-40% 0px -55% 0px' }
  );

  sections.forEach(s => linkObserver.observe(s));
}
