// Calm scroll-reveal: page sections fade and float up into place
// as they scroll into view. Each one animates once, then stays.
(function () {
  // Visitors who turn off animations just see everything straight away
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  if (!('IntersectionObserver' in window)) return;

  // [selector, delay between items in the same group (ms)]
  const GROUPS = [
    ['body > h1', 0],
    ['body > p', 0],
    ['.cover-art', 0],
    ['.trailers h2', 0],
    ['.trailer', 120],          // cards ripple in one after another
    ['body > h2', 0],
    ['body > table', 0],
    ['.stores h2', 0],
    ['.store', 120],
  ];

  const targets = [];
  GROUPS.forEach(([selector, step]) => {
    document.querySelectorAll(selector).forEach((el, i) => {
      el.classList.add('reveal');
      el.style.setProperty('--reveal-delay', `${i * step}ms`);
      targets.push(el);
    });
  });

  // Once an element has finished appearing, remove the reveal classes so its
  // own hover effects (lift, glow) work at their normal speed again
  function cleanUp(el) {
    el.classList.remove('reveal', 'is-visible');
    el.style.removeProperty('--reveal-delay');
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      const el = entry.target;
      observer.unobserve(el);
      el.classList.add('is-visible');
      const delay = parseInt(el.style.getPropertyValue('--reveal-delay'), 10) || 0;
      setTimeout(() => cleanUp(el), delay + 1100);
    });
  }, {
    threshold: 0.12,                 // start when a little of it is on screen
    rootMargin: '0px 0px -40px 0px', // ...and slightly above the bottom edge
  });

  targets.forEach((el) => observer.observe(el));
})();
