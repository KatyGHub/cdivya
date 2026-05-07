/**
 * scroll-reveal.js
 * IntersectionObserver-based entrance animations.
 * Adds .is-visible to .reveal-block elements when they enter the viewport.
 */

export function initScrollReveal() {
  const targets = document.querySelectorAll('.reveal-block');
  if (!targets.length) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    },
    {
      threshold: 0.12,
      rootMargin: '0px 0px -40px 0px',
    }
  );

  targets.forEach(el => observer.observe(el));
}
