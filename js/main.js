/* Brote · interacción y animaciones
   Si GSAP no carga, el sitio se ve completo y estático.
   Las animaciones corren aunque el sistema tenga "reducir movimiento" activado. */

(() => {
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const motion = () => !!window.gsap;

  /* ---------- Nav: fondo al scrollear, se oculta al bajar ---------- */
  const nav = $('[data-nav]');
  let lastY = scrollY;
  addEventListener('scroll', () => {
    const y = scrollY;
    nav.classList.toggle('is-scrolled', y > 20);
    nav.classList.toggle('is-hidden', y > lastY && y > 400 && !nav.classList.contains('is-open'));
    lastY = y;
  }, { passive: true });

  /* ---------- Menú en celular ---------- */
  const toggle = $('[data-menu-toggle]');
  const setMenu = open => {
    nav.classList.toggle('is-open', open);
    toggle.setAttribute('aria-expanded', open);
    toggle.querySelector('.sr-only').textContent = open ? 'Cerrar menú' : 'Abrir menú';
  };
  toggle.addEventListener('click', () => setMenu(!nav.classList.contains('is-open')));
  $$('#menu a').forEach(a => a.addEventListener('click', () => setMenu(false)));
  addEventListener('keydown', e => e.key === 'Escape' && setMenu(false));

  /* ---------- Pestañas de la carta ---------- */
  const tabs = $$('[data-tab]');
  const selectTab = tab => {
    const id = tab.dataset.tab;
    tabs.forEach(t => {
      const on = t === tab;
      t.setAttribute('aria-selected', on);
      t.tabIndex = on ? 0 : -1;
    });
    $$('[data-panel]').forEach(p => (p.hidden = p.dataset.panel !== id));
    $$('[data-media]').forEach(img => img.classList.toggle('is-active', img.dataset.media === id));
    if (motion()) {
      gsap.from(`[data-panel="${id}"] li`, { y: 24, opacity: 0, duration: .5, stagger: .06, ease: 'power3.out' });
      gsap.fromTo(`[data-media="${id}"]`, { scale: 1.15 }, { scale: 1, duration: 1.2, ease: 'power3.out' });
    }
  };
  tabs.forEach((t, i) => {
    t.addEventListener('click', () => selectTab(t));
    t.addEventListener('keydown', e => {
      const dir = { ArrowRight: 1, ArrowLeft: -1 }[e.key];
      if (!dir) return;
      const next = tabs[(i + dir + tabs.length) % tabs.length];
      next.focus();
      selectTab(next);
    });
  });

  /* ---------- Animaciones (GSAP) ---------- */
  if (!motion() || !window.ScrollTrigger) return;
  gsap.registerPlugin(ScrollTrigger);

  const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');

  // Divide un elemento en letras (respeta los <br>). Cada palabra va en una máscara .w
  // para que las letras "suban" desde abajo. El texto completo queda para lectores de pantalla.
  const splitChars = el => {
    let text = '', html = '';
    el.childNodes.forEach(n => {
      if (n.nodeName === 'BR') { html += '<br>'; text += ' '; return; }
      const t = n.textContent;
      text += t;
      html += t.split(/(\s+)/).map(w => (!w.trim() ? w : `<span class="w">${[...w].map(c => `<span class="char">${esc(c)}</span>`).join('')}</span>`)).join('');
    });
    el.innerHTML = `<span class="sr-only">${esc(text.trim())}</span><span aria-hidden="true">${html}</span>`;
    return $$('.char', el);
  };
  const splitWords = el => {
    const text = el.textContent.trim();
    el.innerHTML = `<span class="sr-only">${esc(text)}</span><span aria-hidden="true">${text.split(/\s+/).map(w => `<span class="word">${esc(w)}</span>`).join(' ')}</span>`;
    return $$('.word', el);
  };

  /* Barra de progreso */
  gsap.to('[data-progress]', { scaleX: 1, ease: 'none', scrollTrigger: { start: 0, end: 'max', scrub: .3 } });

  /* ---------- Hero ---------- */
  const heroChars = $$('[data-split]').map(splitChars);
  const media = $('[data-hero-media]');
  const photo = $('[data-hero-photo]');
  const ring = $('[data-ring]');
  const badge = $('.badge');

  const intro = gsap.timeline({ defaults: { ease: 'power4.out' } });
  intro
    .from(heroChars[0], { yPercent: 110, duration: 1.1, stagger: .05 })
    .from(heroChars[1], { yPercent: 110, duration: 1.1, stagger: .04 }, '-=.9')
    .fromTo(photo, { clipPath: 'inset(100% 0% 0% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.2 }, '-=1')
    .from(photo.querySelector('img'), { scale: 1.3, duration: 1.6 }, '<')
    .from(ring, { scale: .6, opacity: 0, duration: 1.6, ease: 'expo.out' }, '<.1')
    .from(badge, { scale: 0, rotate: -180, duration: 1, ease: 'back.out(1.7)' }, '-=1')
    .from('.hero__stats li, [data-hero-aside]', { y: 30, opacity: 0, duration: .8, stagger: .08 }, '-=.9');

  $$('[data-count]').forEach(el => {
    const obj = { v: 0 };
    intro.to(obj, { v: +el.dataset.count, duration: 1.4, ease: 'power2.out', onUpdate: () => (el.textContent = Math.round(obj.v)) }, .6);
  });

  // El vaso se balancea solo, el anillo y el sello giran sin parar
  gsap.fromTo(photo, { rotate: -5, y: 0 }, { rotate: 5, y: -14, duration: 3.2, ease: 'sine.inOut', yoyo: true, repeat: -1 });
  const ringSpin = gsap.to(ring, { rotate: '+=360', duration: 26, ease: 'none', repeat: -1 });
  gsap.to('[data-badge]', { rotation: 360, svgOrigin: '60 60', duration: 12, ease: 'none', repeat: -1 });

  // Al scrollear: el vaso gira y sube, el anillo acelera, las líneas se separan
  const heroScroll = { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true };
  gsap.to('.hero__line:not(.hero__line--end)', { xPercent: -14, scrollTrigger: heroScroll });
  gsap.to('.hero__line--end', { xPercent: 10, scrollTrigger: heroScroll });
  gsap.to(media, { yPercent: -22, rotate: -18, scale: .9, scrollTrigger: heroScroll });
  ScrollTrigger.create({
    trigger: '.hero', start: 'top top', end: 'bottom top',
    onUpdate: self => {
      ringSpin.timeScale(1 + Math.min(Math.abs(self.getVelocity()) / 120, 10));
      gsap.to(ringSpin, { timeScale: 1, duration: 1.2, overwrite: true });
    },
  });

  // Con mouse: el vaso sigue un poco al puntero
  if (matchMedia('(pointer: fine)').matches) {
    const hero = $('.hero');
    const mx = gsap.quickTo(media, 'x', { duration: .8, ease: 'power3.out' });
    const my = gsap.quickTo(media, 'y', { duration: .8, ease: 'power3.out' });
    hero.addEventListener('pointermove', e => {
      const r = hero.getBoundingClientRect();
      mx(((e.clientX - r.left) / r.width - .5) * 30);
      my(((e.clientY - r.top) / r.height - .5) * 20);
    });
    hero.addEventListener('pointerleave', () => { mx(0); my(0); });
  }

  /* ---------- Marquesinas ---------- */
  // Se repite el contenido hasta cubrir el ancho de pantalla, así la cinta queda siempre llena.
  $$('[data-marquee]').forEach(m => {
    const track = $('.marquee__track', m);
    const base = track.innerHTML;
    while (track.scrollWidth < innerWidth * 1.1) track.innerHTML += base;
    track.innerHTML += track.innerHTML;
    const from = m.hasAttribute('data-reverse') ? -50 : 0;
    const loop = gsap.fromTo(track, { xPercent: from }, { xPercent: from ? 0 : -50, duration: 28, ease: 'none', repeat: -1 });
    loop.totalTime(loop.duration() * 100); // margen para poder correr hacia atrás
    const skew = gsap.quickTo(track, 'skewX', { duration: .4, ease: 'power3.out' });
    ScrollTrigger.create({
      trigger: m, start: 'top bottom', end: 'bottom top',
      onUpdate: self => {
        gsap.to(loop, { timeScale: self.direction * (1 + Math.min(Math.abs(self.getVelocity()) / 400, 4)), duration: .3, overwrite: true });
        gsap.to(loop, { timeScale: self.direction, duration: 1, delay: .3 });
        skew(gsap.utils.clamp(-8, 8, self.getVelocity() / -250));
        clearTimeout(m._t); m._t = setTimeout(() => skew(0), 120);
      },
    });
  });

  /* ---------- Títulos: las letras suben al entrar ---------- */
  $$('[data-chars]').forEach(el => {
    const chars = splitChars(el);
    gsap.from(chars, {
      yPercent: 110, rotate: 6, duration: .9, stagger: .025, ease: 'power4.out',
      scrollTrigger: { trigger: el, start: 'top 85%', once: true },
    });
  });

  /* Manifiesto: las palabras se encienden mientras leés */
  gsap.fromTo(splitWords($('[data-words]')), { opacity: .16 }, {
    opacity: 1, stagger: .1, ease: 'none',
    scrollTrigger: { trigger: '.manifesto__big', start: 'top 80%', end: 'bottom 45%', scrub: true },
  });

  /* Fotos que se abren de abajo hacia arriba */
  $$('[data-clip]').forEach(fig => {
    gsap.timeline({ scrollTrigger: { trigger: fig, start: 'top 85%', once: true } })
      .fromTo(fig, { clipPath: 'inset(100% 0% 0% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.2, ease: 'power4.inOut' })
      .from(fig.querySelector('img'), { scale: 1.3, duration: 1.6, ease: 'power3.out' }, '<');
  });

  /* Parallax suave en fotos */
  $$('[data-speed]').forEach(el => {
    gsap.to(el, {
      yPercent: +el.dataset.speed * 100, ease: 'none',
      scrollTrigger: { trigger: el.parentElement, start: 'top bottom', end: 'bottom top', scrub: true },
    });
  });

  /* Bloques de texto que entran */
  $$('[data-reveal]').forEach(el => {
    gsap.from(el, { y: 50, opacity: 0, duration: 1, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 88%', once: true } });
  });

  /* Tarjetas en cascada (al terminar se limpia el transform para que funcione el hover) */
  ScrollTrigger.batch('[data-card]', {
    start: 'top 90%', once: true,
    onEnter: batch => gsap.from(batch, { y: 90, opacity: 0, rotate: 3, duration: .9, stagger: .1, ease: 'power3.out', clearProps: 'transform,opacity' }),
  });

  /* Los granos giran mientras scrolleás */
  $$('[data-bean-icon]').forEach((icon, i) => {
    gsap.fromTo(icon, { rotate: -90 }, {
      rotate: 270 + i * 40, ease: 'none',
      scrollTrigger: { trigger: '.beans__grid', start: 'top bottom', end: 'bottom top', scrub: true },
    });
  });

  /* Carta: la foto se abre al entrar */
  gsap.fromTo('.menu__media', { clipPath: 'inset(30% 20% 30% 20% round 300px)' }, {
    clipPath: 'inset(0% 0% 0% 0% round 0px)', duration: 1.4, ease: 'power4.out',
    scrollTrigger: { trigger: '.menu__media', start: 'top 80%', once: true },
  });
  ScrollTrigger.batch('.rows:not([hidden]) li', {
    start: 'top 92%', once: true,
    onEnter: batch => gsap.from(batch, { x: -30, opacity: 0, duration: .7, stagger: .07, ease: 'power3.out' }),
  });

  /* Proceso: scroll horizontal fijado (solo pantallas grandes) */
  gsap.matchMedia().add('(min-width: 900px)', () => {
    const track = $('[data-process-track]');
    // clientWidth no incluye la barra de scroll: así el último paso termina entero en pantalla
    const distance = () => track.scrollWidth - document.documentElement.clientWidth;
    const tween = gsap.to(track, {
      x: () => -distance(), ease: 'none',
      scrollTrigger: {
        trigger: '[data-process]', start: 'top top', end: () => `+=${distance()}`,
        pin: true, scrub: .6, invalidateOnRefresh: true, anticipatePin: 1,
      },
    });
    $$('.step', track).forEach(step => {
      gsap.from(step.querySelector('img'), {
        scale: 1.12, ease: 'none',
        scrollTrigger: { trigger: step, containerAnimation: tween, start: 'left right', end: 'left 40%', scrub: true },
      });
      gsap.from(step.querySelectorAll('.step__n, h3, p'), {
        y: 40, opacity: 0, stagger: .08, ease: 'power3.out',
        scrollTrigger: { trigger: step, containerAnimation: tween, start: 'left 85%', end: 'left 55%', scrub: true },
      });
    });
  });

  /* Footer: la palabra BROTE sube letra por letra */
  const footChars = splitChars($('[data-footer-word]'));
  gsap.from(footChars, {
    yPercent: 100, stagger: .06, ease: 'power3.out',
    scrollTrigger: { trigger: '.footer__word', start: 'top bottom', end: 'top 45%', scrub: 1 },
  });
  // cada letra da un saltito al pasar el mouse
  footChars.forEach(c => c.addEventListener('pointerenter', () => {
    if (!gsap.isTweening(c)) gsap.to(c, { y: '-=24', rotate: -4, duration: .22, ease: 'power2.out', yoyo: true, repeat: 1 });
  }));
})();
