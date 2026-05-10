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

  // Elegant mobile menu: toggle plus outside click and ESC close.
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

  // Lock scroll during loading so the entry feels stable.
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
  // Move focus after smooth scrolling for accessibility.
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

function setupHeroCine() {
  const hero = $("[data-hero]");
  if (!hero) return;

  const reduceMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;

  // Parallax (mouse + gentle mobile tilt)
  let hx = 0;
  let hy = 0;
  let hz = 0;
  let raf = 0;

  const apply = () => {
    raf = 0;
    hero.style.setProperty("--hx", `${hx.toFixed(2)}px`);
    hero.style.setProperty("--hy", `${hy.toFixed(2)}px`);
    hero.style.setProperty("--hz", `${hz.toFixed(2)}`);
    // Tiny eye follow illusion
    hero.style.setProperty("--ex", `${(hx * 0.22).toFixed(2)}px`);
    hero.style.setProperty("--ey", `${(hy * 0.18).toFixed(2)}px`);
  };

  const schedule = () => {
    if (raf) return;
    raf = requestAnimationFrame(apply);
  };

  if (!reduceMotion) {
    hero.addEventListener(
      "pointermove",
      (e) => {
        const r = hero.getBoundingClientRect();
        const cx = r.left + r.width / 2;
        const cy = r.top + r.height / 2;
        const dx = (e.clientX - cx) / Math.max(320, r.width);
        const dy = (e.clientY - cy) / Math.max(420, r.height);
        hx = clamp(dx * 26, -26, 26);
        hy = clamp(dy * 20, -20, 20);
        hz = clamp(Math.abs(dx) * 36 + Math.abs(dy) * 28, 0, 60);
        schedule();
      },
      { passive: true }
    );

    hero.addEventListener(
      "pointerleave",
      () => {
        hx *= 0.2;
        hy *= 0.2;
        hz *= 0.2;
        schedule();
      },
      { passive: true }
    );

    // Optional: very subtle device tilt on mobile
    window.addEventListener(
      "deviceorientation",
      (e) => {
        if (!("beta" in e) || !("gamma" in e)) return;
        const dx = clamp((e.gamma || 0) / 30, -1, 1);
        const dy = clamp((e.beta || 0) / 30, -1, 1);
        hx = clamp(dx * 14, -14, 14);
        hy = clamp(dy * 10, -10, 10);
        hz = clamp(Math.abs(dx) * 26 + Math.abs(dy) * 22, 0, 50);
        schedule();
      },
      { passive: true }
    );
  }

  // Dust particles canvas
  const canvas = $("[data-dust]", hero);
  const ctx = canvas?.getContext?.("2d");
  if (canvas && ctx && !reduceMotion) {
    const DPR = () => clamp(window.devicePixelRatio || 1, 1, 2);
    let w = 0;
    let h = 0;
    let dpr = DPR();
    let particles = [];
    let animId = 0;

    const resize = () => {
      dpr = DPR();
      w = Math.max(320, hero.clientWidth);
      h = Math.max(320, hero.clientHeight);
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const targetN = Math.round(clamp((w * h) / 28000, 26, 70));
      if (particles.length < targetN) {
        for (let i = particles.length; i < targetN; i++) {
          particles.push({
            x: Math.random() * w,
            y: Math.random() * h,
            r: 0.6 + Math.random() * 2.2,
            a: 0.04 + Math.random() * 0.12,
            vx: -0.14 + Math.random() * 0.28,
            vy: -0.12 + Math.random() * 0.24,
            tw: Math.random() * Math.PI * 2,
          });
        }
      } else if (particles.length > targetN) {
        particles = particles.slice(0, targetN);
      }
    };

    const tick = () => {
      animId = requestAnimationFrame(tick);
      ctx.clearRect(0, 0, w, h);
      ctx.globalCompositeOperation = "lighter";

      const px = hx * 0.35;
      const py = hy * 0.35;

      for (const p of particles) {
        p.tw += 0.015 + p.r * 0.0015;
        const twinkle = (Math.sin(p.tw) + 1) / 2;
        const alpha = p.a * (0.55 + twinkle * 0.9);

        p.x += p.vx;
        p.y += p.vy;
        if (p.x < -20) p.x = w + 20;
        if (p.x > w + 20) p.x = -20;
        if (p.y < -20) p.y = h + 20;
        if (p.y > h + 20) p.y = -20;

        const x = p.x + px;
        const y = p.y + py;
        const grd = ctx.createRadialGradient(x, y, 0, x, y, p.r * 10);
        grd.addColorStop(0, `rgba(250,248,245,${alpha})`);
        grd.addColorStop(0.35, `rgba(250,248,245,${alpha * 0.35})`);
        grd.addColorStop(1, "rgba(250,248,245,0)");
        ctx.fillStyle = grd;
        ctx.beginPath();
        ctx.arc(x, y, p.r * 10, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.globalCompositeOperation = "source-over";
    };

    resize();
    tick();
    window.addEventListener("resize", resize, { passive: true });
    document.addEventListener(
      "visibilitychange",
      () => {
        if (document.hidden) {
          cancelAnimationFrame(animId);
        } else {
          cancelAnimationFrame(animId);
          tick();
        }
      },
      { passive: true }
    );
  }

  // Hero search -> Finder handoff
  const form = $("#hero-search-form");
  const input = $("#hero-breed");
  const qf = $$(".qf[data-qf]");
  const finder = $("#finder");
  const breedSel = $("#breed");
  if (form && input && finder) {
    const chooseBreed = (qRaw) => {
      const q = (qRaw || "").trim().toLowerCase();
      if (!q || !breedSel) return false;
      const options = [...breedSel.options];
      // Exact
      let best = options.find((o) => o.value.toLowerCase() === q || o.textContent.toLowerCase() === q);
      // Contains
      if (!best) best = options.find((o) => o.value.toLowerCase().includes(q) || o.textContent.toLowerCase().includes(q));
      // Word match
      if (!best) {
        const tokens = q.split(/\s+/).filter(Boolean);
        best = options.find((o) => tokens.some((t) => o.textContent.toLowerCase().includes(t)));
      }
      if (!best || best.value === "any") return false;
      breedSel.value = best.value;
      breedSel.dispatchEvent(new Event("change", { bubbles: true }));
      return true;
    };

    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const ok = chooseBreed(input.value);
      finder.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
      if (input.value.trim() && !ok) showToast("We'll curate the closest match");
      else showToast("Showing curated matches");
    });

    qf.forEach((b) => {
      b.addEventListener("click", () => {
        qf.forEach((x) => (x.dataset.on = "false"));
        b.dataset.on = "true";
        const v = b.getAttribute("data-qf") || "";
        input.value = v;
        showToast("Filter applied");
      });
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

async function sendTelegramRequest(form) {
  const data = Object.fromEntries(new FormData(form).entries());
  const response = await fetch("/api/send-telegram", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name: data.name,
      contactMethod: data.contactMethod,
      contactValue: data.contactValue,
      message: data.message,
    }),
  });

  if (!response.ok) {
    throw new Error("Telegram request failed");
  }

  return response.json();
}

function setupForm(formId, sentMessage) {
  const form = document.getElementById(formId);
  if (!form) return;

  const fields = $$(".field", form);
  const inputs = $$("input, select, textarea", form);
  const submit = $('button[type="submit"]', form);

  const validateAll = () => fields.every((f) => validateField(f));

  // Validate gently on blur, then revalidate while typing after a field is highlighted.
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

    try {
      await sendTelegramRequest(form);
      form.reset();
      fields.forEach((f) => {
        f.dataset.invalid = "false";
        const err = $(".field__error", f);
        if (err) err.textContent = "";
      });

      showToast(sentMessage);
    } catch (err) {
      showToast("Не удалось отправить заявку. Попробуйте позже.");
    } finally {
      if (submit) {
        submit.disabled = false;
        submit.style.opacity = "1";
      }
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
    showToast("We'll reach out shortly");
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

function setupMobileConsultButton() {
  // The mobile consultation button opens the same dialog as the floating Chat button.
  const btn = $("#mobile-consult");
  const dlg = $("#chat");
  if (!btn || !dlg) return;

  btn.addEventListener("click", () => {
    if (typeof dlg.showModal === "function") dlg.showModal();
    else showToast("Chat widget not supported (demo)");
  });
}

function escapeHTML(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function setupTestimonials() {
  const track = $("[data-slider-track]");
  const testimonials = typeof TESTIMONIALS !== "undefined" ? TESTIMONIALS : [];
  if (!track || !Array.isArray(testimonials)) return;

  const flags = {
    France: "FR",
    USA: "US",
    Germany: "DE",
  };

  track.innerHTML = testimonials
    .map((item) => {
      const city = String(item.location || "").split(",")[0] || item.country || "Client";
      const flag = flags[item.country] || item.country || "";

      return `
        <article class="rSlide" data-slide>
          <div class="rSlide__media">
            <img src="${escapeHTML(item.image)}" alt="${escapeHTML(item.clientName)} with their puppy" loading="lazy" />
          </div>
          <div class="rSlide__body">
            <div class="rSlide__mHead" aria-label="Reviewer">
              <div class="rSlide__avatar" aria-hidden="true"></div>
              <div class="rSlide__mWho">
                <div class="rSlide__mName">${escapeHTML(item.clientName)} <span class="flag" aria-label="${escapeHTML(item.country)}">${escapeHTML(flag)}</span></div>
                <div class="rSlide__mBadges">
                  ${item.verified ? '<span class="badge badge--verified" aria-label="Verified review">Verified</span>' : ""}
                  <span class="pill pill--soft">${escapeHTML(city)}</span>
                </div>
              </div>
            </div>
            <div class="rSlide__meta">
              <span class="pill">${escapeHTML(item.location)}</span>
              <span class="pill pill--soft">${escapeHTML(item.deliveryTime)}</span>
            </div>
            <h3 class="rSlide__title">"${escapeHTML(item.title)}"</h3>
            <p class="rSlide__text">${escapeHTML(item.text)}</p>
            <div class="rSlide__who">
              <span class="rSlide__name">${escapeHTML(item.clientName)}</span>
              <span class="rSlide__sep">·</span>
              <span class="rSlide__note">${escapeHTML(item.clientType)}</span>
            </div>
          </div>
        </article>
      `;
    })
    .join("");
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

  // Autoplay only while the user is not interacting.
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

  // Swipe and drag support.
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
    // Pick the current slide by the nearest offsetLeft.
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

  // Keep the index in sync during native scrolling.
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

function uniq(arr) {
  return [...new Set(arr)];
}

// Builds a Telegram link with a prefilled puppy inquiry.
function generateTelegramLink(puppy) {
  const message = `Hello! I'm interested in ${puppy.name}, ${puppy.breed}, ${puppy.age}, price ${puppy.price}. Please contact me.`;
  const encodedMessage = encodeURIComponent(message);
  return `https://t.me/pomeranian_mini_mishki?text=${encodedMessage}`;
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

  // Populate selects from the data set.
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
    budgetLabel.textContent = `$2,000 - $${fmtInt(v)}`;
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
    const priceValue = Number(String(p.price).replace(/[^\d]/g, "")) || 0;
    if (priceValue > f.budget) return false;
    if (f.traits.length) {
      // All selected traits must be present to keep matches curated.
      for (const t of f.traits) if (!p.traits.includes(t)) return false;
    }
    return true;
  };

  const renderCard = (p) => {
    const card = document.createElement("article");
    card.className = "puppy glass";
    const telegramLink = generateTelegramLink(p);
    card.innerHTML = `
      <div class="puppy__media">
        <img src="${p.image}" alt="${p.breed} puppy named ${p.name}" loading="lazy" decoding="async" />
        <div class="puppy__badge">${p.status}</div>
      </div>
      <div class="puppy__titleRow">
        <div>
          <h3 class="puppy__name">${p.name}</h3>
          <div class="puppy__meta">${p.breed} · ${p.gender} · ${p.age}</div>
        </div>
        <div class="price">${p.price}</div>
      </div>
      <p class="puppy__description">${p.description}</p>
      <div class="puppy__facts">
        <span class="pill">${p.country}</span>
        <span class="pill">${p.delivery}</span>
      </div>
      <div class="puppy__tags">${p.tags
        .map((tag) => `<span class="pill pill--soft">${tag}</span>`)
        .join("")}</div>
      <div class="puppy__bottom">
        <a class="btn btn--primary btn--sm" href="${telegramLink}" target="_blank" rel="noopener noreferrer">Request Puppy</a>
      </div>
    `;
    return card;
  };

  const render = () => {
    const f = getFilters();
    const matched = PUPPIES.filter((p) => match(p, f));

    countEl.textContent = String(matched.length);
    if (!PUPPIES.length) {
      sub.textContent = "No puppies available right now. Contact us for personal matching.";
      results.innerHTML = `<div class="sectionMini__note">No puppies available right now. Contact us for personal matching.</div>`;
      return;
    }

    sub.textContent =
      matched.length === 0
        ? "No exact matches - try widening budget or removing a trait."
        : "Curated puppies ready for safe delivery.";

    results.innerHTML = "";
    if (!matched.length) {
      results.innerHTML = `<div class="sectionMini__note">No exact matches - try widening budget or removing a trait.</div>`;
    } else {
      matched.forEach((p) => results.appendChild(renderCard(p)));
    }
  };

  // Update instantly, not only on submit.
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
setupHeroCine();
setupTestimonials();
setupSliders();
setupFinder();
setupChatWidget();
setupMobileConsultButton();
setupChatDialogCloseToast();
setupForm("reserve-form", "Спасибо! Мы скоро свяжемся с вами.");
setupFooterMiniForm();
