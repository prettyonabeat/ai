const $ = (sel, parent = document) => parent.querySelector(sel);
const $$ = (sel, parent = document) => [...parent.querySelectorAll(sel)];

function clamp(n, min, max) {
  return Math.min(max, Math.max(min, n));
}

function setupYear() {
  const el = $("#year");
  if (el) el.textContent = String(new Date().getFullYear());
}

function setupHeaderElevate() {
  const header = $("[data-elevate]");
  if (!header) return;

  const onScroll = () => {
    header.dataset.scrolled = window.scrollY > 8 ? "true" : "false";
  };
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });
}

function setupReveal() {
  const nodes = $$(".reveal");
  if (!nodes.length) return;

  const reduceMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
  if (reduceMotion) {
    nodes.forEach((n) => n.classList.add("is-in"));
    return;
  }

  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (e.isIntersecting) {
          e.target.classList.add("is-in");
          io.unobserve(e.target);
        }
      }
    },
    { root: null, threshold: 0.12, rootMargin: "0px 0px -8% 0px" }
  );

  nodes.forEach((n, idx) => {
    n.style.transitionDelay = `${clamp(idx * 55, 0, 240)}ms`;
    io.observe(n);
  });
}

function setupNav() {
  const nav = $(".nav");
  const toggle = $(".nav__toggle");
  const panel = $("#nav-panel");
  if (!nav || !toggle || !panel) return;

  const setOpen = (open) => {
    nav.dataset.open = open ? "true" : "false";
    toggle.setAttribute("aria-expanded", open ? "true" : "false");
  };

  const isOpen = () => nav.dataset.open === "true";

  setOpen(false);

  toggle.addEventListener("click", () => setOpen(!isOpen()));

  panel.addEventListener("click", (e) => {
    const a = e.target.closest?.("a");
    if (a) setOpen(false);
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") setOpen(false);
  });

  document.addEventListener("click", (e) => {
    if (!isOpen()) return;
    const target = e.target;
    if (!(target instanceof Element)) return;
    if (target.closest(".nav")) return;
    setOpen(false);
  });
}

let toastTimer = null;
function showToast(message) {
  const el = $("#toast");
  if (!el) return;

  el.textContent = message;
  el.dataset.show = "true";

  if (toastTimer) window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => {
    el.dataset.show = "false";
  }, 1700);
}

function setupToasts() {
  document.addEventListener("click", (e) => {
    const btn = e.target.closest?.("[data-toast]");
    if (!btn) return;
    const msg = btn.getAttribute("data-toast");
    if (msg) showToast(msg);
  });
}

function setupGlassHoverGlow() {
  const cards = $$(".glass");
  if (!cards.length) return;

  const reduceMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
  if (reduceMotion) return;

  for (const el of cards) {
    el.addEventListener("pointermove", (e) => {
      const r = el.getBoundingClientRect();
      const x = ((e.clientX - r.left) / r.width) * 100;
      const y = ((e.clientY - r.top) / r.height) * 100;
      el.style.setProperty("--mx", `${clamp(x, 0, 100)}%`);
      el.style.setProperty("--my", `${clamp(y, 0, 100)}%`);
    });
  }
}

function setupSmoothAnchorFocus() {
  // После плавной прокрутки переносим фокус для доступности с клавиатуры.
  $$('a[href^="#"]').forEach((a) => {
    a.addEventListener("click", () => {
      const id = a.getAttribute("href")?.slice(1);
      if (!id) return;
      const target = document.getElementById(id);
      if (!target) return;

      window.setTimeout(() => {
        target.setAttribute("tabindex", "-1");
        target.focus({ preventScroll: true });
        window.setTimeout(() => target.removeAttribute("tabindex"), 500);
      }, 450);
    });
  });
}

function setupLoader() {
  const loader = $("#loader");
  if (!loader) return;

  const reduceMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
  if (reduceMotion) {
    loader.dataset.hide = "true";
    document.body.style.overflow = "";
    return;
  }

  // На момент загрузки делаем лёгкую «премиум-паузу», чтобы анимации стартовали красиво.
  document.body.style.overflow = "hidden";

  const hide = () => {
    loader.dataset.hide = "true";
    window.setTimeout(() => {
      document.body.style.overflow = "";
    }, 520);
  };

  if (document.readyState === "complete") {
    window.setTimeout(hide, 520);
  } else {
    window.addEventListener("load", () => window.setTimeout(hide, 520), { once: true });
  }
}

function setupParallax() {
  const targets = $$("[data-parallax]");
  const glows = $$(".bg__glow");
  if (!targets.length && !glows.length) return;

  const reduceMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
  if (reduceMotion) return;

  let raf = 0;
  const onScroll = () => {
    if (raf) return;
    raf = window.requestAnimationFrame(() => {
      raf = 0;
      const y = window.scrollY || 0;
      const vh = window.innerHeight || 800;

      for (const el of targets) {
        const k = Number(el.getAttribute("data-parallax")) || 0.18;
        const r = el.getBoundingClientRect();
        const center = r.top + r.height / 2;
        const t = (center - vh / 2) / vh;
        const py = clamp(t * -42 * k, -28, 28);
        el.style.setProperty("--py", `${py.toFixed(2)}px`);
      }

      // Плавающие свечения фона — слегка «дышат» по скроллу.
      glows.forEach((g, idx) => {
        const drift = (Math.sin((y / 260) + idx) * 10) + (idx === 0 ? -6 : 6);
        g.style.transform = `translate3d(0, ${drift.toFixed(2)}px, 0)`;
      });
    });
  };

  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll, { passive: true });
}

function validateField(field) {
  const input = $(".field__input", field);
  const error = $(".field__error", field);
  if (!input || !error) return true;

  let msg = "";
  if (input.validity.valueMissing) msg = "Required.";
  else if (input.validity.typeMismatch) msg = "Please enter a valid value.";
  else if (input.validity.tooShort) msg = `Minimum ${input.minLength} characters.`;

  const ok = msg === "";
  field.dataset.invalid = ok ? "false" : "true";
  error.textContent = msg;
  return ok;
}

function setupForm() {
  const form = $("#contact-form");
  if (!form) return;

  const fields = $$(".field", form);
  const inputs = $$(".field__input", form);
  const submit = $('button[type="submit"]', form);

  const validateAll = () => fields.every((f) => validateField(f));

  inputs.forEach((input) => {
    input.addEventListener("input", () => {
      const field = input.closest(".field");
      if (!field) return;
      if (field.dataset.invalid === "true") validateField(field);
    });
    input.addEventListener("blur", () => {
      const field = input.closest(".field");
      if (field) validateField(field);
    });
  });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!validateAll()) {
      showToast("Check required fields");
      const firstBad = fields.find((f) => f.dataset.invalid === "true");
      const firstInput = firstBad ? $(".field__input", firstBad) : null;
      firstInput?.focus?.();
      return;
    }

    if (submit) {
      submit.disabled = true;
      submit.style.opacity = "0.9";
    }

    // Имитируем «премиум-отправку» — небольшая задержка, как у реального сервиса.
    await new Promise((r) => setTimeout(r, 850));
    form.reset();
    fields.forEach((f) => {
      f.dataset.invalid = "false";
      const err = $(".field__error", f);
      if (err) err.textContent = "";
    });

    showToast("Request sent");

    if (submit) {
      submit.disabled = false;
      submit.style.opacity = "1";
    }
  });
}

setupYear();
setupLoader();
setupHeaderElevate();
setupReveal();
setupNav();
setupToasts();
setupGlassHoverGlow();
setupSmoothAnchorFocus();
setupParallax();
setupForm();

