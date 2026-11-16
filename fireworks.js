// Colourful fireworks drawn on a transparent full-screen canvas.
// Call startFireworks(durationMs) to begin. New rockets stop launching
// after durationMs, the last sparks fade out, then the canvas removes itself.
(function () {
  const COLORS = ['#ff2e88', '#ff7a3d', '#ffd23f', '#2de2e6', '#b45cff', '#ffffff', '#5cff9d'];
  const GRAVITY = 0.04;
  const FRICTION = 0.985;

  let running = false;

  function rand(min, max) {
    return min + Math.random() * (max - min);
  }

  function pick(list) {
    return list[Math.floor(Math.random() * list.length)];
  }

  window.startFireworks = function (durationMs) {
    if (running) return;
    running = true;

    const canvas = document.createElement('canvas');
    canvas.className = 'fireworks-canvas';
    document.body.appendChild(canvas);
    const ctx = canvas.getContext('2d');

    let width, height, dpr;
    function resize() {
      dpr = window.devicePixelRatio || 1;
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    resize();
    window.addEventListener('resize', resize);

    const rockets = [];
    const sparks = [];
    const endTime = Date.now() + durationMs;
    let nextLaunch = 0;

    function launchRocket() {
      rockets.push({
        x: rand(width * 0.1, width * 0.9),
        y: height,
        vx: rand(-1, 1),
        vy: rand(-11, -7.5) * Math.min(1, height / 800 + 0.3),
        color: pick(COLORS),
      });
    }

    function explode(r) {
      const count = Math.floor(rand(60, 110));
      const twoTone = Math.random() < 0.4 ? pick(COLORS) : null;
      const ring = Math.random() < 0.25;            // some bursts are perfect rings
      for (let i = 0; i < count; i++) {
        const angle = (Math.PI * 2 * i) / count;
        const speed = ring ? 4 : rand(1, 5.5);
        sparks.push({
          x: r.x,
          y: r.y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          color: twoTone && i % 2 ? twoTone : r.color,
          life: 1,
          decay: rand(0.008, 0.018),
          size: rand(1.5, 2.8),
        });
      }
    }

    function frame() {
      const now = Date.now();

      // Fade the previous frame a little, which leaves glowing trails
      ctx.globalCompositeOperation = 'destination-out';
      ctx.fillStyle = 'rgba(0, 0, 0, 0.18)';
      ctx.fillRect(0, 0, width, height);
      ctx.globalCompositeOperation = 'lighter';

      // Launch new rockets until time is up (sometimes a volley of several)
      if (now < endTime && now >= nextLaunch) {
        const volley = Math.random() < 0.15 ? Math.floor(rand(3, 6)) : 1;
        for (let i = 0; i < volley; i++) launchRocket();
        nextLaunch = now + rand(250, 700);
      }

      // Rockets rise, then burst at the top of their flight
      for (let i = rockets.length - 1; i >= 0; i--) {
        const r = rockets[i];
        r.x += r.vx;
        r.y += r.vy;
        r.vy += GRAVITY * 1.5;
        ctx.fillStyle = r.color;
        ctx.beginPath();
        ctx.arc(r.x, r.y, 2.2, 0, Math.PI * 2);
        ctx.fill();
        if (r.vy >= -0.5) {
          explode(r);
          rockets.splice(i, 1);
        }
      }

      // Sparks fly out, slow down, fall and fade
      for (let i = sparks.length - 1; i >= 0; i--) {
        const s = sparks[i];
        s.vx *= FRICTION;
        s.vy = s.vy * FRICTION + GRAVITY;
        s.x += s.vx;
        s.y += s.vy;
        s.life -= s.decay;
        if (s.life <= 0) {
          sparks.splice(i, 1);
          continue;
        }
        ctx.globalAlpha = s.life;
        ctx.fillStyle = s.color;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;

      // Keep going until time is up and the last sparks have faded
      if (now < endTime || rockets.length || sparks.length) {
        requestAnimationFrame(frame);
      } else {
        window.removeEventListener('resize', resize);
        canvas.remove();
        running = false;
      }
    }

    requestAnimationFrame(frame);
  };
})();
