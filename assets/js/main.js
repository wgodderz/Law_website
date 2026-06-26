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
    const ease = 0.045;

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

/* ---------- Magnetic headline letters ----------
   Letters nearest the cursor lift and grow slightly, like type
   reacting to a light passing over it. */
function initMagneticHeadline() {
  if (PREFERS_REDUCED_MOTION) return;
  document.querySelectorAll(".hero h1").forEach((h1) => {
    const hero = h1.closest(".hero");
    if (!hero) return;

    const originalText = h1.textContent;
    const letters = [];
    h1.innerHTML = "";
    Array.from(originalText).forEach((ch) => {
      if (ch === " ") {
        h1.appendChild(document.createTextNode(" "));
        return;
      }
      const span = document.createElement("span");
      span.textContent = ch;
      span.style.display = "inline-block";
      span.style.transition = "transform 260ms cubic-bezier(0.22, 1, 0.36, 1)";
      span.style.willChange = "transform";
      h1.appendChild(span);
      letters.push(span);
    });

    let mouseX = null;
    let mouseY = null;
    let raf = null;
    const radius = 90;

    function update() {
      letters.forEach((span) => {
        const rect = span.getBoundingClientRect();
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        const dist = Math.hypot(mouseX - cx, mouseY - cy);
        if (dist < radius) {
          const strength = 1 - dist / radius;
          span.style.transform = `translateY(${-strength * 7}px) scale(${1 + strength * 0.18})`;
        } else {
          span.style.transform = "";
        }
      });
      raf = null;
    }

    hero.addEventListener("mousemove", (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
      if (!raf) raf = requestAnimationFrame(update);
    });
    hero.addEventListener("mouseleave", () => {
      letters.forEach((span) => (span.style.transform = ""));
    });
  });
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

/* ---------- Init ---------- */
document.addEventListener("DOMContentLoaded", async () => {
  applyTextures();
  initHeroGradient();
  initCursorGlow();
  initMagneticHeadline();
  await injectPartials();
  initFaqAccordion();
  initPageLoader();
  initReveal();
});
