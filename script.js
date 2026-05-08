const $ = (sel, parent = document) => parent.querySelector(sel);
const $$ = (sel, parent = document) => [...parent.querySelectorAll(sel)];

function clamp(n, min, max) {
  return Math.min(max, Math.max(min, n));
}

function fmtInt(n) {
  return new Intl.NumberFormat("en-US").format(Math.round(n));
}

function setupYear() {
  const y = $("#year");
  if (y) y.textContent = String(new Date().getFullYear());
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

  // Элегантное мобильное меню: toggle + закрытие по клику снаружи / ESC
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

function setupLoader() {
  const loader = $("#loader");
  if (!loader) return;

  const reduceMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
  if (reduceMotion) {
    loader.dataset.hide = "true";
    document.body.style.overflow = "";
    return;
  }

  // На время загрузки фиксируем скролл, чтобы вход был «ровным»
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
    { threshold: 0.14, rootMargin: "0px 0px -8% 0px" }
  );

  nodes.forEach((n, idx) => {
    n.style.transitionDelay = `${clamp(idx * 45, 0, 220)}ms`;
    io.observe(n);
  });
}

function setupSmoothAnchorFocus() {
  // После плавного скролла переносим фокус (доступность)
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

function setupParallax() {
  const targets = $$("[data-parallax]");
  const glows = $$(".bg__glow");
  if (!targets.length && !glows.length) return;

  const reduceMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
  if (reduceMotion) return;

  let raf = 0;
  const tick = () => {
    raf = 0;
    const y = window.scrollY || 0;
    const vh = window.innerHeight || 800;

    for (const el of targets) {
      const k = Number(el.getAttribute("data-parallax")) || 0.12;
      const r = el.getBoundingClientRect();
      const center = r.top + r.height / 2;
      const t = (center - vh / 2) / vh;
      const py = clamp(t * -44 * k, -26, 26);
      el.style.setProperty("--py", `${py.toFixed(2)}px`);
    }

    glows.forEach((g, idx) => {
      const drift = (Math.sin((y / 260) + idx) * 10) + (idx === 0 ? -6 : 6);
      g.style.transform = `translate3d(0, ${drift.toFixed(2)}px, 0)`;
    });
  };

  const onScroll = () => {
    if (raf) return;
    raf = window.requestAnimationFrame(tick);
  };

  tick();
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll, { passive: true });
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

function animateCount(el, to, ms = 900) {
  const reduceMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
  if (reduceMotion) {
    el.textContent = fmtInt(to);
    return;
  }

  const from = Number(el.textContent.replace(/,/g, "")) || 0;
  const start = performance.now();

  const step = (t) => {
    const p = clamp((t - start) / ms, 0, 1);
    const eased = 1 - Math.pow(1 - p, 3);
    const v = from + (to - from) * eased;
    el.textContent = fmtInt(v);
    if (p < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

function setupCounters() {
  const nodes = $$(".count[data-count]");
  if (!nodes.length) return;

  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (!e.isIntersecting) continue;
        const el = e.target;
        const to = Number(el.getAttribute("data-count")) || 0;
        animateCount(el, to, 950);
        io.unobserve(el);
      }
    },
    { threshold: 0.35 }
  );

  nodes.forEach((n) => io.observe(n));
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

function setupForm(formId, sentMessage) {
  const form = document.getElementById(formId);
  if (!form) return;

  const fields = $$(".field", form);
  const inputs = $$("input, select, textarea", form);
  const submit = $('button[type="submit"]', form);

  const validateAll = () => fields.every((f) => validateField(f));

  // Мягкая валидация по blur + повторная при вводе, если поле уже подсвечено
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
      $(".field__input", firstBad || form)?.focus?.();
      return;
    }

    if (submit) {
      submit.disabled = true;
      submit.style.opacity = "0.9";
    }

    // Имитируем «премиум отправку» — как будто мы действительно создаем заявку у консьержа
    await new Promise((r) => setTimeout(r, 850));
    form.reset();
    fields.forEach((f) => {
      f.dataset.invalid = "false";
      const err = $(".field__error", f);
      if (err) err.textContent = "";
    });

    showToast(sentMessage);

    if (submit) {
      submit.disabled = false;
      submit.style.opacity = "1";
    }
  });
}

function setupFooterMiniForm() {
  const form = $("#footer-form");
  if (!form) return;
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const input = $("input[name='email']", form);
    if (!input) return;
    if (!input.checkValidity()) {
      showToast("Enter a valid email");
      input.focus();
      return;
    }
    const btn = $("button", form);
    if (btn) btn.disabled = true;
    await new Promise((r) => setTimeout(r, 650));
    form.reset();
    if (btn) btn.disabled = false;
    showToast("We’ll reach out shortly");
  });
}

function setupChatWidget() {
  const btn = $("#open-chat");
  const dlg = $("#chat");
  if (!btn || !dlg) return;

  btn.addEventListener("click", () => {
    if (typeof dlg.showModal === "function") dlg.showModal();
    else showToast("Chat widget not supported (demo)");
  });
}

function createSlider(root) {
  const track = $("[data-slider-track]", root);
  const slides = $$("[data-slide]", root);
  const prev = $("[data-slider-prev]", root);
  const next = $("[data-slider-next]", root);
  const dotsWrap = $("[data-slider-dots]", root);
  if (!track || !slides.length) return;

  let i = 0;
  let autoplayTimer = null;
  const reduceMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;

  const scrollToIndex = (idx) => {
    i = (idx + slides.length) % slides.length;
    const left = slides[i].offsetLeft;
    track.scrollTo({ left, behavior: reduceMotion ? "auto" : "smooth" });
    if (dotsWrap) {
      $$("[data-dot]", dotsWrap).forEach((d, di) => (d.dataset.on = di === i ? "true" : "false"));
    }
  };

  if (dotsWrap) {
    dotsWrap.innerHTML = "";
    slides.forEach((_, di) => {
      const b = document.createElement("button");
      b.className = "rDot";
      b.type = "button";
      b.dataset.dot = "true";
      b.dataset.on = di === 0 ? "true" : "false";
      b.setAttribute("aria-label", `Go to slide ${di + 1}`);
      b.addEventListener("click", () => scrollToIndex(di));
      dotsWrap.appendChild(b);
    });
  }

  prev?.addEventListener("click", () => scrollToIndex(i - 1));
  next?.addEventListener("click", () => scrollToIndex(i + 1));

  // Автоплей: только если пользователь не взаимодействует
  const startAutoplay = () => {
    if (reduceMotion) return;
    stopAutoplay();
    autoplayTimer = window.setInterval(() => scrollToIndex(i + 1), 5200);
  };
  const stopAutoplay = () => {
    if (autoplayTimer) window.clearInterval(autoplayTimer);
    autoplayTimer = null;
  };

  root.addEventListener("pointerenter", stopAutoplay);
  root.addEventListener("pointerleave", startAutoplay);

  // Свайп/перетаскивание (простая реализация)
  let downX = 0;
  let downLeft = 0;
  let isDown = false;
  track.addEventListener("pointerdown", (e) => {
    isDown = true;
    downX = e.clientX;
    downLeft = track.scrollLeft;
    track.setPointerCapture?.(e.pointerId);
    stopAutoplay();
  });
  track.addEventListener("pointermove", (e) => {
    if (!isDown) return;
    const dx = e.clientX - downX;
    track.scrollLeft = downLeft - dx;
  });
  const end = () => {
    if (!isDown) return;
    isDown = false;
    // Подсчёт текущего слайда по ближайшему offsetLeft
    const left = track.scrollLeft;
    let best = 0;
    let bestDist = Infinity;
    slides.forEach((s, si) => {
      const d = Math.abs(s.offsetLeft - left);
      if (d < bestDist) {
        bestDist = d;
        best = si;
      }
    });
    scrollToIndex(best);
    startAutoplay();
  };
  track.addEventListener("pointerup", end);
  track.addEventListener("pointercancel", end);

  // Держим индекс в синхронизации при нативном скролле
  let scrollRaf = 0;
  track.addEventListener(
    "scroll",
    () => {
      if (scrollRaf) return;
      scrollRaf = requestAnimationFrame(() => {
        scrollRaf = 0;
        const left = track.scrollLeft;
        let best = 0;
        let bestDist = Infinity;
        slides.forEach((s, si) => {
          const d = Math.abs(s.offsetLeft - left);
          if (d < bestDist) {
            bestDist = d;
            best = si;
          }
        });
        i = best;
        if (dotsWrap) {
          $$("[data-dot]", dotsWrap).forEach((d, di) => (d.dataset.on = di === i ? "true" : "false"));
        }
      });
    },
    { passive: true }
  );

  scrollToIndex(0);
  startAutoplay();
}

function setupSliders() {
  $$("[data-slider]").forEach((root) => createSlider(root));
}

// Данные щенков (демо), чтобы сайт выглядел «живым» и убедительным
const PUPPIES = [
  {
    id: "luna",
    name: "Luna",
    breed: "Cavalier King Charles Spaniel",
    gender: "female",
    ageWeeks: 14,
    country: "France",
    size: "small",
    price: 8200,
    delivery: "EU & USA",
    traits: ["calm", "cuddly", "gentle"],
    img: "https://images.unsplash.com/photo-1558788353-f76d92427f16?auto=format&fit=crop&w=1400&q=80",
  },
  {
    id: "milo",
    name: "Milo",
    breed: "Golden Retriever",
    gender: "male",
    ageWeeks: 16,
    country: "USA",
    size: "large",
    price: 7400,
    delivery: "USA",
    traits: ["playful", "gentle", "smart"],
    img: "https://images.unsplash.com/photo-1552053831-71594a27632d?auto=format&fit=crop&w=1400&q=80",
  },
  {
    id: "nori",
    name: "Nori",
    breed: "Toy Poodle",
    gender: "female",
    ageWeeks: 13,
    country: "Italy",
    size: "small",
    price: 9600,
    delivery: "EU & USA",
    traits: ["smart", "cuddly", "calm"],
    img: "https://images.unsplash.com/photo-1583337130417-3346a1be7dee?auto=format&fit=crop&w=1400&q=80",
  },
  {
    id: "atlas",
    name: "Atlas",
    breed: "French Bulldog",
    gender: "male",
    ageWeeks: 15,
    country: "Spain",
    size: "medium",
    price: 6900,
    delivery: "EU",
    traits: ["playful", "cuddly", "gentle"],
    img: "https://images.unsplash.com/photo-1583511655826-05700d52f4d9?auto=format&fit=crop&w=1400&q=80",
  },
  {
    id: "sage",
    name: "Sage",
    breed: "Miniature Schnauzer",
    gender: "female",
    ageWeeks: 17,
    country: "Germany",
    size: "medium",
    price: 6100,
    delivery: "EU & USA",
    traits: ["smart", "adventurous", "gentle"],
    img: "https://images.unsplash.com/photo-1518717758536-85ae29035b6d?auto=format&fit=crop&w=1400&q=80",
  },
  {
    id: "cosmo",
    name: "Cosmo",
    breed: "Shiba Inu",
    gender: "male",
    ageWeeks: 18,
    country: "USA",
    size: "medium",
    price: 8800,
    delivery: "USA",
    traits: ["adventurous", "smart", "playful"],
    img: "https://images.unsplash.com/photo-1517423440428-a5a00ad493e8?auto=format&fit=crop&w=1400&q=80",
  },
];

function uniq(arr) {
  return [...new Set(arr)];
}

function setupFinder() {
  const form = $("#finder-form");
  const results = $("#results");
  const countEl = $("#results-count");
  const sub = $("#results-sub");
  const resetBtn = $("#reset-filters");
  if (!form || !results || !countEl || !sub || !resetBtn) return;

  const breedSel = $("#breed");
  const genderSel = $("#gender");
  const countrySel = $("#country");
  const sizeSel = $("#size");
  const budget = $("#budget");
  const budgetLabel = $("#budget-label");
  const traitsWrap = $("#traits");
  if (!breedSel || !genderSel || !countrySel || !sizeSel || !budget || !budgetLabel || !traitsWrap) return;

  // Заполняем селекты из набора данных
  uniq(PUPPIES.map((p) => p.breed)).sort().forEach((b) => {
    const o = document.createElement("option");
    o.value = b;
    o.textContent = b;
    breedSel.appendChild(o);
  });
  uniq(PUPPIES.map((p) => p.country)).sort().forEach((c) => {
    const o = document.createElement("option");
    o.value = c;
    o.textContent = c;
    countrySel.appendChild(o);
  });

  let selectedTraits = [];
  const maxTraits = 3;

  const setBudgetLabel = () => {
    const v = Number(budget.value) || 0;
    budgetLabel.textContent = `$2,000 — $${fmtInt(v)}`;
  };
  setBudgetLabel();
  budget.addEventListener("input", () => {
    setBudgetLabel();
    render();
  });

  traitsWrap.addEventListener("click", (e) => {
    const btn = e.target.closest?.("[data-trait]");
    if (!btn) return;
    const trait = btn.getAttribute("data-trait");
    if (!trait) return;

    const on = btn.dataset.on === "true";
    if (on) {
      selectedTraits = selectedTraits.filter((t) => t !== trait);
      btn.dataset.on = "false";
    } else {
      if (selectedTraits.length >= maxTraits) {
        showToast("Pick up to 3 traits");
        return;
      }
      selectedTraits = [...selectedTraits, trait];
      btn.dataset.on = "true";
    }
    render();
  });

  const getFilters = () => ({
    breed: breedSel.value,
    gender: genderSel.value,
    country: countrySel.value,
    size: sizeSel.value,
    budget: Number(budget.value) || 0,
    traits: selectedTraits,
  });

  const match = (p, f) => {
    if (f.breed !== "any" && p.breed !== f.breed) return false;
    if (f.gender !== "any" && p.gender !== f.gender) return false;
    if (f.country !== "any" && p.country !== f.country) return false;
    if (f.size !== "any" && p.size !== f.size) return false;
    if (p.price > f.budget) return false;
    if (f.traits.length) {
      // Все выбранные traits должны встречаться в карточке (строже, но «консьерж» ощущение)
      for (const t of f.traits) if (!p.traits.includes(t)) return false;
    }
    return true;
  };

  const renderCard = (p) => {
    const card = document.createElement("article");
    card.className = "puppy glass";
    card.innerHTML = `
      <div class="puppy__media">
        <img src="${p.img}" alt="${p.breed} puppy named ${p.name}" loading="lazy" decoding="async" />
        <div class="puppy__badge">${p.delivery}</div>
      </div>
      <div class="puppy__titleRow">
        <div>
          <h3 class="puppy__name">${p.name}</h3>
          <div class="puppy__meta">${p.breed} · ${p.ageWeeks} weeks · ${p.country}</div>
        </div>
      </div>
      <div class="puppy__facts">
        <span class="pill">${p.size}</span>
        <span class="pill">${p.gender}</span>
        <span class="pill pill--soft">verified</span>
      </div>
      <div class="puppy__bottom">
        <div class="price">$${fmtInt(p.price)} <span>estimated</span></div>
        <button class="btn btn--primary btn--sm" type="button" data-toast="Request sent (demo)">Request Puppy</button>
      </div>
    `;
    return card;
  };

  const render = () => {
    const f = getFilters();
    const matched = PUPPIES.filter((p) => match(p, f));

    countEl.textContent = String(matched.length);
    sub.textContent =
      matched.length === 0
        ? "No exact matches — try widening budget or removing a trait."
        : "Curated puppies ready for safe delivery.";

    results.innerHTML = "";
    matched.forEach((p) => results.appendChild(renderCard(p)));
  };

  // Мгновенные обновления (не только по submit)
  [breedSel, genderSel, countrySel, sizeSel].forEach((el) =>
    el.addEventListener("change", () => render())
  );

  resetBtn.addEventListener("click", () => {
    breedSel.value = "any";
    genderSel.value = "any";
    countrySel.value = "any";
    sizeSel.value = "any";
    budget.value = "8000";
    setBudgetLabel();
    selectedTraits = [];
    $$("[data-trait]", traitsWrap).forEach((b) => (b.dataset.on = "false"));
    render();
    showToast("Filters reset");
  });

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    render();
    showToast("Matches updated");
  });

  render();
}

function setupChatDialogCloseToast() {
  const dlg = $("#chat");
  if (!dlg) return;
  dlg.addEventListener("close", () => {
    if (dlg.returnValue === "send") showToast("Consultation requested (demo)");
  });
}

setupYear();
setupLoader();
setupHeaderElevate();
setupNav();
setupToasts();
setupReveal();
setupParallax();
setupGlassHoverGlow();
setupSmoothAnchorFocus();
setupCounters();
setupSliders();
setupFinder();
setupChatWidget();
setupChatDialogCloseToast();
setupForm("reserve-form", "Request sent");
setupFooterMiniForm();

