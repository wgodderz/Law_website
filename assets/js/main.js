/* Paradigm Law Group — shared site behavior:
   partial injection, nav, FAQ accordion, gradient hero,
   guilloché texture, page-transition loader, scroll reveal. */

const PREFERS_REDUCED_MOTION = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ---------- Guilloché texture (signature motif) ---------- */
function guillocheDataUri() {
  const rings = [];
  for (let i = 0; i < 7; i++) {
    const rx = 30 + i * 14;
    const ry = 18 + i * 9;
    rings.push(
      `<ellipse cx="100" cy="100" rx="${rx}" ry="${ry}" fill="none" stroke="#c99a4b" stroke-width="0.6" transform="rotate(${i * 11} 100 100)"/>`
    );
  }
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200"><g opacity="0.9">${rings.join("")}</g></svg>`;
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
}

function applyTextures() {
  const uri = guillocheDataUri();
  document.documentElement.style.setProperty("--guilloche-svg", uri);
  document.querySelectorAll(".hero-texture").forEach((el) => {
    el.style.backgroundImage = uri;
    el.style.backgroundSize = "260px";
  });
}

/* ---------- Living gradient hero background ----------
   Two radial gradients drift slowly and independently (different
   periods/phases) so the navy field feels alive rather than static,
   plus a slow breathing pulse on size. */
function initHeroGradient() {
  const els = document.querySelectorAll(".hero-gradient");
  if (!els.length) return;

  els.forEach((el) => {
    function paint(cx1, cy1, cx2, cy2, width) {
      el.style.background = `
        radial-gradient(${width * 0.7}% ${width * 0.6}% at ${cx2}% ${cy2}%, rgba(201, 154, 75, 0.16) 0%, rgba(201, 154, 75, 0) 60%),
        radial-gradient(${width}% ${width + 20}% at ${cx1}% ${cy1}%,
          #1c2c4d 0%,
          #16233f 30%,
          #0e1830 55%,
          #0b0f1a 78%,
          #0b0f1a 100%)`;
    }

    if (PREFERS_REDUCED_MOTION) {
      paint(50, 15, 70, 30, 130);
      return;
    }

    function step(t) {
      const s = t / 1000;
      const cx1 = 50 + Math.sin(s * 0.09) * 10;
      const cy1 = 15 + Math.cos(s * 0.07) * 6;
      const cx2 = 68 + Math.sin(s * 0.05 + 2) * 14;
      const cy2 = 32 + Math.cos(s * 0.06 + 1) * 12;
      const width = 130 + Math.sin(s * 0.12) * 6;
      paint(cx1, cy1, cx2, cy2, width);
      requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  });
}

/* ---------- Cursor-reactive light over hero text ----------
   The glow eases toward the cursor rather than snapping to it,
   so it trails softly behind pointer movement. */
function initCursorGlow() {
  if (PREFERS_REDUCED_MOTION) return;
  document.querySelectorAll(".hero").forEach((hero) => {
    const glow = document.createElement("div");
    glow.className = "cursor-glow";
    hero.appendChild(glow);

    let targetX = 0;
    let targetY = 0;
    let curX = 0;
    let curY = 0;
    let tracking = false;
    let looping = false;
    const ease = 0.11;

    function loop() {
      curX += (targetX - curX) * ease;
      curY += (targetY - curY) * ease;
      glow.style.transform = `translate(${curX}px, ${curY}px) translate(-50%, -50%)`;
      if (tracking || Math.abs(targetX - curX) > 0.5 || Math.abs(targetY - curY) > 0.5) {
        requestAnimationFrame(loop);
      } else {
        looping = false;
      }
    }

    hero.addEventListener("mousemove", (e) => {
      const rect = hero.getBoundingClientRect();
      targetX = e.clientX - rect.left;
      targetY = e.clientY - rect.top;
      if (!tracking) {
        tracking = true;
        glow.style.opacity = "1";
      }
      if (!looping) {
        looping = true;
        requestAnimationFrame(loop);
      }
    });

    hero.addEventListener("mouseleave", () => {
      tracking = false;
      glow.style.opacity = "0";
    });
  });
}

/* ---------- Letters warm with a bronze glow near the cursor ----------
   Shared by the hero headline and the header wordmark. Letters are
   grouped into per-word wrappers (white-space: nowrap) so line breaks
   can only happen between words, never inside one. */
function buildGlowLetters(container, text) {
  const words = text.split(" ");
  const letters = [];
  words.forEach((word, wi) => {
    const wordSpan = document.createElement("span");
    wordSpan.style.display = "inline-block";
    wordSpan.style.whiteSpace = "nowrap";
    Array.from(word).forEach((ch) => {
      const span = document.createElement("span");
      span.textContent = ch;
      span.style.display = "inline-block";
      span.style.transition = "color 320ms ease, text-shadow 320ms ease";
      wordSpan.appendChild(span);
      letters.push(span);
    });
    container.appendChild(wordSpan);
    if (wi < words.length - 1) container.appendChild(document.createTextNode(" "));
  });
  return letters;
}

function attachGlowTracking(hoverTarget, letters, radius) {
  let mouseX = null;
  let mouseY = null;
  let raf = null;

  function update() {
    letters.forEach((span) => {
      const rect = span.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dist = Math.hypot(mouseX - cx, mouseY - cy);
      if (dist < radius) {
        const strength = 1 - dist / radius;
        span.style.color = "#fff6e6";
        span.style.textShadow = `0 0 ${6 + strength * 26}px rgba(216, 168, 78, ${0.5 + strength * 0.75})`;
      } else {
        span.style.color = "";
        span.style.textShadow = "";
      }
    });
    raf = null;
  }

  hoverTarget.addEventListener("mousemove", (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
    if (!raf) raf = requestAnimationFrame(update);
  });
  hoverTarget.addEventListener("mouseleave", () => {
    letters.forEach((span) => {
      span.style.color = "";
      span.style.textShadow = "";
    });
  });
}

function initMagneticHeadline() {
  if (PREFERS_REDUCED_MOTION) return;
  document.querySelectorAll(".hero h1").forEach((h1) => {
    const hero = h1.closest(".hero");
    if (!hero) return;
    const text = h1.textContent;
    h1.innerHTML = "";
    const letters = buildGlowLetters(h1, text);
    attachGlowTracking(hero, letters, 100);
  });
}

/* Header wordmark ("Paradigm Law Group") gets the same glow, scaled
   down for its smaller size. Runs after partials inject since the
   header markup doesn't exist until then. */
function initWordmarkGlow() {
  if (PREFERS_REDUCED_MOTION) return;
  const textEl = document.querySelector(".wordmark .text");
  if (!textEl) return;
  const small = textEl.querySelector("small");
  const labelNode = Array.from(textEl.childNodes).find((n) => n.nodeType === Node.TEXT_NODE && n.textContent.trim());
  const label = labelNode ? labelNode.textContent.trim() : "";
  if (!label) return;

  textEl.innerHTML = "";
  const letters = buildGlowLetters(textEl, label);
  if (small) textEl.appendChild(small);

  const wordmark = textEl.closest(".wordmark");
  attachGlowTracking(wordmark, letters, 46);
}

/* ---------- Header / footer partial injection ---------- */
async function injectPartials() {
  const slots = document.querySelectorAll("[data-include]");
  await Promise.all(
    Array.from(slots).map(async (slot) => {
      const name = slot.getAttribute("data-include");
      const depth = slot.getAttribute("data-depth") || "";
      try {
        const res = await fetch(`${depth}partials/${name}.html`);
        slot.innerHTML = await res.text();
      } catch (e) {
        console.error("Failed to load partial", name, e);
      }
    })
  );
  fixPartialLinks();
  highlightActiveNav();
  initNavToggle();
}

function fixPartialLinks() {
  const depth = document.body.getAttribute("data-depth") || "";
  document.querySelectorAll("[data-href]").forEach((el) => {
    el.setAttribute("href", depth + el.getAttribute("data-href"));
  });
}

function highlightActiveNav() {
  const page = document.body.getAttribute("data-page");
  if (!page) return;
  document.querySelectorAll(`a[data-nav="${page}"]`).forEach((a) => a.classList.add("active"));
}

function initNavToggle() {
  const toggle = document.querySelector(".nav-toggle");
  const mobileNav = document.querySelector(".mobile-nav");
  if (!toggle || !mobileNav) return;
  toggle.addEventListener("click", () => {
    const open = mobileNav.classList.toggle("open");
    toggle.setAttribute("aria-expanded", open ? "true" : "false");
  });
  mobileNav.querySelectorAll("a").forEach((a) =>
    a.addEventListener("click", () => {
      mobileNav.classList.remove("open");
      toggle.setAttribute("aria-expanded", "false");
    })
  );
}

/* ---------- FAQ accordion ---------- */
function initFaqAccordion() {
  document.querySelectorAll(".faq-item").forEach((item) => {
    const q = item.querySelector(".faq-q");
    const a = item.querySelector(".faq-a");
    if (!q || !a) return;
    q.addEventListener("click", () => {
      const isOpen = item.classList.contains("open");
      item.classList.toggle("open", !isOpen);
      a.style.maxHeight = isOpen ? "0px" : a.scrollHeight + "px";
      q.setAttribute("aria-expanded", String(!isOpen));
    });
  });
}

/* ---------- Page-transition loader ---------- */
function initPageLoader() {
  const loader = document.getElementById("page-loader");
  if (!loader) return;

  const lettersEl = document.getElementById("loader-letters");
  if (lettersEl) {
    const text = loader.getAttribute("data-loader-text") || "Just a moment";
    lettersEl.innerHTML = text
      .split("")
      .map((c) => `<span class="loader-letter">${c === " " ? "&nbsp;" : c}</span>`)
      .join("");
  }

  document.addEventListener("click", (e) => {
    const link = e.target.closest("a");
    if (!link) return;
    const href = link.getAttribute("href");
    if (!href || href.startsWith("#") || link.target === "_blank") return;
    if (link.hasAttribute("data-no-loader")) return;
    const isExternal = /^https?:\/\//i.test(href) && !href.includes(location.hostname);
    if (isExternal) return;

    e.preventDefault();
    loader.classList.add("active");
    const delay = PREFERS_REDUCED_MOTION ? 0 : 480;
    setTimeout(() => {
      window.location.href = href;
    }, delay);
  });

  window.addEventListener("pageshow", () => loader.classList.remove("active"));
}

/* ---------- Scroll reveal ---------- */
function initReveal() {
  const items = document.querySelectorAll(".reveal");
  if (!items.length) return;
  if (PREFERS_REDUCED_MOTION) {
    items.forEach((el) => el.classList.add("in"));
    return;
  }
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("in");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15 }
  );
  items.forEach((el) => observer.observe(el));
}

/* ---------- Legacy tree: draws in once, then nodes glow softly ----------
   A cinematic one-time ink-drawing reveal (not a looping animation) —
   the trunk and branches draw in with a staggered delay, then each
   node fades in and settles into a slow ambient pulse. */
function initLegacyTree() {
  const svg = document.querySelector(".legacy-tree");
  if (!svg) return;
  const paths = Array.from(svg.querySelectorAll("path"));
  const circles = Array.from(svg.querySelectorAll("circle"));

  paths.forEach((path) => {
    const len = path.getTotalLength();
    path.style.strokeDasharray = `${len}`;
    path.style.strokeDashoffset = `${len}`;
    path.style.transition = "stroke-dashoffset 1.5s cubic-bezier(0.22, 1, 0.36, 1)";
  });
  circles.forEach((c) => {
    c.style.transition = "opacity 700ms ease";
  });

  if (PREFERS_REDUCED_MOTION) {
    paths.forEach((p) => (p.style.strokeDashoffset = "0"));
    circles.forEach((c) => {
      c.style.opacity = "1";
      c.classList.add("lit");
    });
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        paths.forEach((path, i) => {
          setTimeout(() => {
            path.style.strokeDashoffset = "0";
          }, i * 200);
        });
        const branchTime = paths.length * 200 + 1500;
        circles.forEach((c, i) => {
          setTimeout(() => {
            c.style.opacity = "1";
            c.classList.add("lit");
          }, branchTime + i * 130);
        });
        observer.disconnect();
      });
    },
    { threshold: 0.3 }
  );
  observer.observe(svg);
}

/* ---------- Service cards: cursor glow + icon ink-draw-in ---------- */
function initServiceCards() {
  const cards = document.querySelectorAll(".grid-3 .card");
  if (!cards.length) return;

  const shapeSelector = "path, circle, rect, line, polyline, polygon";

  cards.forEach((card) => {
    if (!PREFERS_REDUCED_MOTION) {
      const glow = document.createElement("div");
      glow.className = "card-glow";
      card.appendChild(glow);
      card.addEventListener("mousemove", (e) => {
        const rect = card.getBoundingClientRect();
        glow.style.transform = `translate(${e.clientX - rect.left}px, ${e.clientY - rect.top}px) translate(-50%, -50%)`;
        glow.style.opacity = "1";
      });
      card.addEventListener("mouseleave", () => {
        glow.style.opacity = "0";
      });
    }

    const icon = card.querySelector(".card-icon svg");
    if (!icon) return;
    const shapes = Array.from(icon.querySelectorAll(shapeSelector));
    shapes.forEach((shape) => {
      const len = shape.getTotalLength ? shape.getTotalLength() : 40;
      shape.style.strokeDasharray = `${len}`;
      shape.style.strokeDashoffset = `${len}`;
      shape.style.transition = "stroke-dashoffset 900ms cubic-bezier(0.22, 1, 0.36, 1)";
    });
    if (PREFERS_REDUCED_MOTION) {
      shapes.forEach((s) => (s.style.strokeDashoffset = "0"));
    }
  });

  if (PREFERS_REDUCED_MOTION) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const icon = entry.target.querySelector(".card-icon svg");
        if (icon) {
          icon.querySelectorAll(shapeSelector).forEach((shape) => {
            shape.style.strokeDashoffset = "0";
          });
        }
        observer.unobserve(entry.target);
      });
    },
    { threshold: 0.3 }
  );
  cards.forEach((card) => observer.observe(card));
}

/* ---------- Hero photo depth: subtle scroll parallax ----------
   The photo drifts a few px slower than the page scroll, reading as
   depth-of-field rather than a flat pasted-on image. Only runs while
   a given hero is near the viewport, for cheap idle cost on long pages. */
function initHeroParallax() {
  if (PREFERS_REDUCED_MOTION) return;
  const heroes = Array.from(document.querySelectorAll(".hero"))
    .map((hero) => ({ hero, photo: hero.querySelector(".hero-photo") }))
    .filter((h) => h.photo);
  if (!heroes.length) return;

  let ticking = false;
  function update() {
    heroes.forEach(({ hero, photo }) => {
      const rect = hero.getBoundingClientRect();
      if (rect.bottom < 0 || rect.top > window.innerHeight) return;
      const shift = rect.top * -0.12;
      photo.style.transform = `translateY(${shift}px) scale(1.12)`;
    });
    ticking = false;
  }
  window.addEventListener(
    "scroll",
    () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(update);
      }
    },
    { passive: true }
  );
  update();
}

/* ---------- Credential stats count up on scroll-in ----------
   Parses a leading/trailing non-digit prefix+suffix (e.g. "$", "B+", "+")
   off each .stat-num so "20+" counts 0→20 and lands back on the exact
   original string, never on a rounding artifact. */
function initStatCountUp() {
  const nums = document.querySelectorAll(".stat-num");
  if (!nums.length || PREFERS_REDUCED_MOTION) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const el = entry.target;
        observer.unobserve(el);
        const raw = el.textContent.trim();
        const match = raw.match(/^([^\d]*)(\d+)(.*)$/);
        if (!match) return;
        const [, prefix, numStr, suffix] = match;
        const target = parseInt(numStr, 10);
        const duration = 1100;
        const start = performance.now();
        function frame(now) {
          const t = Math.min((now - start) / duration, 1);
          const eased = 1 - Math.pow(1 - t, 3);
          el.textContent = `${prefix}${Math.round(target * eased)}${suffix}`;
          if (t < 1) requestAnimationFrame(frame);
          else el.textContent = raw;
        }
        requestAnimationFrame(frame);
      });
    },
    { threshold: 0.5 }
  );
  nums.forEach((el) => observer.observe(el));
}

/* ---------- Article reading progress ----------
   A thin bronze fill across the top of the viewport tracking position
   through the article body specifically (not the whole page, so it
   reaches 100% as the prose ends rather than at the footer). */
function initReadingProgress() {
  if (document.body.getAttribute("data-page") !== "articles") return;
  const prose = document.querySelector(".prose");
  if (!prose) return;

  const bar = document.createElement("div");
  bar.className = "reading-progress";
  const fill = document.createElement("div");
  fill.className = "reading-progress-fill";
  bar.appendChild(fill);
  document.body.appendChild(bar);

  function update() {
    const rect = prose.getBoundingClientRect();
    const total = rect.height - window.innerHeight * 0.5;
    const scrolled = -rect.top;
    const pct = total > 0 ? Math.min(Math.max(scrolled / total, 0), 1) : 0;
    fill.style.transform = `scaleX(${pct})`;
  }
  window.addEventListener("scroll", () => requestAnimationFrame(update), { passive: true });
  update();
}

/* ---------- Init ---------- */
document.addEventListener("DOMContentLoaded", async () => {
  applyTextures();
  initHeroGradient();
  initCursorGlow();
  initMagneticHeadline();
  await injectPartials();
  initWordmarkGlow();
  initFaqAccordion();
  initPageLoader();
  initReveal();
  initLegacyTree();
  initServiceCards();
  initHeroParallax();
  initStatCountUp();
  initReadingProgress();
});
