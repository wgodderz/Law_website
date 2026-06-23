document.addEventListener("DOMContentLoaded", function () {
  // Mobile nav toggle
  var toggle = document.querySelector(".nav-toggle");
  var links = document.querySelector(".nav-links");
  if (toggle && links) {
    toggle.addEventListener("click", function () {
      links.classList.toggle("open");
    });
  }

  // FAQ accordion
  document.querySelectorAll(".faq-question").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var item = btn.closest(".faq-item");
      var answer = item.querySelector(".faq-answer");
      var isOpen = item.classList.contains("open");

      document.querySelectorAll(".faq-item.open").forEach(function (open) {
        if (open !== item) {
          open.classList.remove("open");
          open.querySelector(".faq-answer").style.maxHeight = null;
        }
      });

      if (isOpen) {
        item.classList.remove("open");
        answer.style.maxHeight = null;
      } else {
        item.classList.add("open");
        answer.style.maxHeight = answer.scrollHeight + "px";
      }
    });
  });

  // Ambient particle network behind hero sections
  document.querySelectorAll(".hero-fx-canvas").forEach(function (canvas) {
    try {
      var ctx = canvas.getContext("2d");
      var box = canvas.parentElement;
      var reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (!ctx || reduceMotion) return;

      function resize() {
        canvas.width = box.clientWidth;
        canvas.height = box.clientHeight;
      }
      resize();
      window.addEventListener("resize", resize);

      var N = Math.min(85, Math.round((box.clientWidth * box.clientHeight) / 11000));
      var pts = Array.from({ length: N }, function () {
        return {
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          vx: (Math.random() - 0.5) * 0.4,
          vy: (Math.random() - 0.5) * 0.4,
        };
      });

      var rafId;
      function tick() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        pts.forEach(function (p) {
          p.x += p.vx; p.y += p.vy;
          if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
          if (p.y < 0 || p.y > canvas.height) p.vy *= -1;
        });
        for (var i = 0; i < pts.length; i++) {
          for (var j = i + 1; j < pts.length; j++) {
            var dx = pts[i].x - pts[j].x, dy = pts[i].y - pts[j].y;
            var dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < 150) {
              ctx.strokeStyle = "rgba(231,200,115," + (1 - dist / 150) * 0.85 + ")";
              ctx.lineWidth = 0.8;
              ctx.beginPath();
              ctx.moveTo(pts[i].x, pts[i].y);
              ctx.lineTo(pts[j].x, pts[j].y);
              ctx.stroke();
            }
          }
        }
        pts.forEach(function (p) {
          ctx.fillStyle = "rgba(255,222,150,0.95)";
          ctx.beginPath();
          ctx.arc(p.x, p.y, 2.4, 0, Math.PI * 2);
          ctx.fill();
        });
        rafId = requestAnimationFrame(tick);
      }
      tick();

      // pause when off-screen to save battery/CPU
      if ("IntersectionObserver" in window) {
        new IntersectionObserver(function (entries) {
          entries.forEach(function (entry) {
            if (entry.isIntersecting) { if (!rafId) tick(); }
            else { cancelAnimationFrame(rafId); rafId = null; }
          });
        }).observe(canvas);
      }
    } catch (e) {
      // Canvas effect failed — hero still renders fine without it.
    }
  });

  // Footer year
  var yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // Scroll reveal animations.
  // Elements are visible by default (see CSS); only hide them (".pre") once
  // we've successfully set up the observer, so a script error or an
  // already-scrolled-past element never gets stuck invisible.
  try {
    var revealTargets = document.querySelectorAll(".reveal, .reveal-stagger");
    var reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (revealTargets.length && "IntersectionObserver" in window && !reduceMotion) {
      var observer = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (entry) {
            if (entry.isIntersecting) {
              entry.target.classList.add("in-view");
              observer.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.15, rootMargin: "0px 0px -40px 0px" }
      );
      revealTargets.forEach(function (el) {
        var rect = el.getBoundingClientRect();
        var alreadyVisible = rect.top < window.innerHeight && rect.bottom > 0;
        if (alreadyVisible) {
          el.classList.add("in-view");
        } else {
          el.classList.add("pre");
        }
        observer.observe(el);
      });
    }
  } catch (e) {
    // Reveal animation failed to initialize — content stays visible (default CSS state).
  }

  // Contact / schedule form placeholder submit handling
  document.querySelectorAll("form[data-placeholder-form]").forEach(function (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      alert("This form is not yet connected to an email or scheduling service. Replace the form action in the code once that's set up.");
    });
  });
});
