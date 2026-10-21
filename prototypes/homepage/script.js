/* ==========================================================================
   DevStash homepage mockup — interactions
   ========================================================================== */

(() => {
  "use strict";

  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  /* ------------------------------------------------------------------------
     Header: more opaque once the page is scrolled
     ------------------------------------------------------------------------ */

  const header = document.getElementById("site-header");

  const updateHeader = () => {
    if (!header) return;
    header.classList.toggle("scrolled", window.scrollY > 8);
  };

  updateHeader();
  window.addEventListener("scroll", updateHeader, { passive: true });

  /* ------------------------------------------------------------------------
     Mobile menu
     ------------------------------------------------------------------------ */

  const navToggle = document.querySelector(".nav-toggle");
  const mobileMenu = document.getElementById("mobile-menu");

  const setMenu = (open) => {
    if (!navToggle || !mobileMenu) return;
    navToggle.setAttribute("aria-expanded", String(open));
    navToggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    mobileMenu.hidden = !open;
  };

  if (navToggle && mobileMenu) {
    navToggle.addEventListener("click", () => {
      setMenu(navToggle.getAttribute("aria-expanded") !== "true");
    });

    mobileMenu.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", () => setMenu(false));
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") setMenu(false);
    });

    document.addEventListener("click", (event) => {
      if (mobileMenu.hidden) return;
      if (header && !header.contains(event.target)) setMenu(false);
    });

    window.addEventListener("resize", () => {
      if (window.innerWidth > 900) setMenu(false);
    });
  }

  /* ------------------------------------------------------------------------
     Scroll-reveal
     ------------------------------------------------------------------------ */

  const revealTargets = Array.from(document.querySelectorAll("[data-reveal]"));

  revealTargets.forEach((element) => {
    const parent = element.parentElement;
    if (!parent) return;
    const siblings = Array.from(parent.children).filter((child) =>
      child.hasAttribute("data-reveal")
    );
    const index = siblings.indexOf(element);
    if (index > 0) {
      element.style.setProperty("--reveal-delay", `${Math.min(index * 70, 350)}ms`);
    }
  });

  if (!("IntersectionObserver" in window) || prefersReducedMotion.matches) {
    revealTargets.forEach((element) => element.classList.add("is-visible"));
  } else {
    const revealObserver = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -6% 0px" }
    );

    revealTargets.forEach((element) => revealObserver.observe(element));
  }

  /* ------------------------------------------------------------------------
     Pricing toggle
     ------------------------------------------------------------------------ */

  const billingButtons = Array.from(document.querySelectorAll("[data-billing]"));
  const proPrice = document.getElementById("pro-price");
  const proPeriod = document.getElementById("pro-period");
  const proNote = document.getElementById("pro-note");

  const PLANS = {
    monthly: {
      price: "$8",
      period: "/ month",
      note: "Billed monthly. Cancel anytime.",
    },
    yearly: {
      price: "$6",
      period: "/ month",
      note: "Billed $72 once a year — save $24.",
    },
  };

  billingButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const plan = PLANS[button.dataset.billing];
      if (!plan || !proPrice || !proPeriod || !proNote) return;

      billingButtons.forEach((other) => {
        const isActive = other === button;
        other.classList.toggle("is-active", isActive);
        other.setAttribute("aria-pressed", String(isActive));
      });

      proPrice.textContent = plan.price;
      proPeriod.textContent = plan.period;
      proNote.textContent = plan.note;
    });
  });

  /* ------------------------------------------------------------------------
     Footer year
     ------------------------------------------------------------------------ */

  const year = document.getElementById("year");
  if (year) year.textContent = String(new Date().getFullYear());

  /* ------------------------------------------------------------------------
     Chaos icons: drift, bounce, rotate, pulse and flee the cursor
     ------------------------------------------------------------------------ */

  const stage = document.getElementById("chaos-stage");

  if (stage) {
    const icons = Array.from(stage.querySelectorAll("[data-chaos]"));
    const MIN_SPEED = 0.22;
    const MAX_SPEED = 1.5;
    const REPEL_RADIUS = 130;
    const PADDING = 18;

    const state = icons.map((element) => ({
      element,
      x: 0,
      y: 0,
      vx: 0,
      vy: 0,
      rotation: 0,
      spin: 0,
      phase: 0,
    }));

    const pointer = { x: 0, y: 0, active: false };
    let width = 0;
    let height = 0;
    let size = 56;
    let rafId = 0;
    let lastTime = 0;

    const clamp = (value, min, max) => Math.min(Math.max(value, min), max);
    const randomBetween = (min, max) => min + Math.random() * (max - min);

    const measure = () => {
      const rect = stage.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      size = icons[0] ? icons[0].offsetWidth || 56 : 56;
    };

    const render = (time, animate) => {
      const still = !animate || prefersReducedMotion.matches;

      state.forEach((item) => {
        const scale = still ? 1 : 1 + Math.sin(time / 900 + item.phase) * 0.045;
        item.element.style.transform =
          `translate3d(${item.x.toFixed(2)}px, ${item.y.toFixed(2)}px, 0) ` +
          `rotate(${item.rotation.toFixed(2)}deg) scale(${scale.toFixed(3)})`;
      });
    };

    const scatter = () => {
      measure();

      const maxX = Math.max(0, width - size - PADDING);
      const maxY = Math.max(0, height - size - PADDING);

      // Lay the icons out on a loose grid first so every source is visible
      // before the physics takes over and the layout drifts apart.
      const columns = 3;
      const rows = Math.ceil(state.length / columns);
      const stepX = columns > 1 ? (maxX - PADDING) / (columns - 1) : 0;
      const stepY = rows > 1 ? (maxY - PADDING) / (rows - 1) : 0;
      const slots = [];

      for (let row = 0; row < rows; row += 1) {
        for (let column = 0; column < columns; column += 1) {
          slots.push({
            x: PADDING + column * stepX,
            y: rows > 1 ? PADDING + row * stepY : (height - size) / 2,
          });
        }
      }

      for (let i = slots.length - 1; i > 0; i -= 1) {
        const j = Math.floor(Math.random() * (i + 1));
        [slots[i], slots[j]] = [slots[j], slots[i]];
      }

      state.forEach((item, index) => {
        const slot = slots[index];
        item.x = clamp(slot.x + randomBetween(-10, 10), PADDING, Math.max(PADDING, maxX));
        item.y = clamp(slot.y + randomBetween(-10, 10), PADDING, Math.max(PADDING, maxY));
        item.vx = randomBetween(-0.5, 0.5);
        item.vy = randomBetween(-0.5, 0.5);
        item.rotation = randomBetween(-12, 12);
        item.spin = randomBetween(-0.16, 0.16);
        item.phase = Math.random() * Math.PI * 2;
      });

      // Nudge overlapping tiles apart so the scattered layout stays readable.
      for (let pass = 0; pass < 30; pass += 1) {
        for (let i = 0; i < state.length; i += 1) {
          for (let j = i + 1; j < state.length; j += 1) {
            const a = state[i];
            const b = state[j];
            const dx = b.x - a.x;
            const dy = b.y - a.y;
            const distance = Math.hypot(dx, dy) || 0.001;
            const minDistance = size + 12;

            if (distance >= minDistance) continue;

            const push = (minDistance - distance) / 2;
            const nx = dx / distance;
            const ny = dy / distance;

            a.x -= nx * push;
            a.y -= ny * push;
            b.x += nx * push;
            b.y += ny * push;
          }
        }

        state.forEach((item) => {
          item.x = clamp(item.x, PADDING, Math.max(PADDING, maxX));
          item.y = clamp(item.y, PADDING, Math.max(PADDING, maxY));
        });
      }

      render(performance.now(), false);
    };

    const tick = (time) => {
      const delta = clamp((time - lastTime) / 16.667, 0.4, 3);
      lastTime = time;

      const maxX = Math.max(0, width - size - PADDING);
      const maxY = Math.max(0, height - size - PADDING);
      const minX = Math.min(PADDING, maxX);
      const minY = Math.min(PADDING, maxY);

      state.forEach((item) => {
        item.x += item.vx * delta;
        item.y += item.vy * delta;

        // Bounce off the stage walls, keeping a little energy on impact.
        if (item.x <= minX) {
          item.x = minX;
          item.vx = Math.abs(item.vx) + 0.04;
        } else if (item.x >= maxX) {
          item.x = maxX;
          item.vx = -Math.abs(item.vx) - 0.04;
        }

        if (item.y <= minY) {
          item.y = minY;
          item.vy = Math.abs(item.vy) + 0.04;
        } else if (item.y >= maxY) {
          item.y = maxY;
          item.vy = -Math.abs(item.vy) - 0.04;
        }

        // Flee the pointer.
        if (pointer.active) {
          const centerX = item.x + size / 2;
          const centerY = item.y + size / 2;
          const dx = centerX - pointer.x;
          const dy = centerY - pointer.y;
          const distance = Math.hypot(dx, dy);

          if (distance > 0.01 && distance < REPEL_RADIUS) {
            const force = (1 - distance / REPEL_RADIUS) * 0.7;
            item.vx += (dx / distance) * force * delta;
            item.vy += (dy / distance) * force * delta;
          }
        }

        // Keep every icon moving, but never flying.
        const speed = Math.hypot(item.vx, item.vy);

        if (speed > MAX_SPEED) {
          item.vx = (item.vx / speed) * MAX_SPEED;
          item.vy = (item.vy / speed) * MAX_SPEED;
        } else if (speed < MIN_SPEED) {
          const angle = speed > 0.001 ? Math.atan2(item.vy, item.vx) : Math.random() * Math.PI * 2;
          item.vx = Math.cos(angle) * MIN_SPEED;
          item.vy = Math.sin(angle) * MIN_SPEED;
        }

        // Subtle rotation, reversing before it gets distracting.
        item.rotation += item.spin * delta;
        if (item.rotation > 16) {
          item.rotation = 16;
          item.spin = -Math.abs(item.spin);
        } else if (item.rotation < -16) {
          item.rotation = -16;
          item.spin = Math.abs(item.spin);
        }
      });

      render(time, true);
      rafId = window.requestAnimationFrame(tick);
    };

    const animate = () => {
      scatter();
      if (prefersReducedMotion.matches) return;
      window.cancelAnimationFrame(rafId);
      lastTime = performance.now();
      rafId = window.requestAnimationFrame(tick);
    };

    stage.addEventListener("pointermove", (event) => {
      const rect = stage.getBoundingClientRect();
      pointer.x = event.clientX - rect.left;
      pointer.y = event.clientY - rect.top;
      pointer.active = true;
    });

    stage.addEventListener("pointerleave", () => {
      pointer.active = false;
    });

    window.addEventListener("pointerup", () => {
      pointer.active = false;
    });

    let resizeTimer = 0;
    window.addEventListener("resize", () => {
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(scatter, 160);
    });

    if (typeof prefersReducedMotion.addEventListener === "function") {
      prefersReducedMotion.addEventListener("change", () => {
        window.cancelAnimationFrame(rafId);
        if (prefersReducedMotion.matches) {
          scatter();
        } else {
          lastTime = performance.now();
          rafId = window.requestAnimationFrame(tick);
        }
      });
    }

    if (document.readyState === "complete") {
      animate();
    } else {
      window.addEventListener("load", animate, { once: true });
    }
  }
})();
