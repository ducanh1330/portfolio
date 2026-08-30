const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ==========================================================================
   Preloader — pure vanilla JS, never blocked on GSAP/Lenis loading
   ========================================================================== */
const preloader = document.getElementById("preloader");

function dismissPreloader() {
  if (!preloader || preloader.classList.contains("is-done")) return;
  preloader.classList.add("is-done");
  revealSplitTexts();
}

if (preloader) {
  if (prefersReducedMotion) {
    preloader.classList.add("is-done");
  } else {
    const fill = document.getElementById("preloaderFill");
    const percent = document.getElementById("preloaderPercent");
    const PRELOAD_MS = 1800;
    const start = Date.now();
    const tick = () => {
      const elapsed = Date.now() - start;
      const pct = Math.min(100, Math.round((elapsed / PRELOAD_MS) * 100));
      if (fill) fill.style.width = pct + "%";
      if (percent) percent.textContent = pct + "%";
      if (elapsed >= PRELOAD_MS) {
        dismissPreloader();
      } else {
        requestAnimationFrame(tick);
      }
    };
    requestAnimationFrame(tick);
    // Hard fallback in case rAF is throttled (e.g. background tab) — never leave visitors stuck.
    setTimeout(dismissPreloader, PRELOAD_MS + 1500);
  }
}

/* ==========================================================================
   Kinetic letter-split reveal (reused by hero + project titles)
   ========================================================================== */
function splitIntoLetters(el) {
  // Letters are grouped inside a per-word wrapper so the browser can still
  // wrap lines at normal word boundaries — splitting bare characters with no
  // word grouping (or forcing non-breaking spaces) breaks text wrapping entirely.
  const letters = [];
  const walk = (node) => {
    Array.from(node.childNodes).forEach((child) => {
      if (child.nodeType === Node.TEXT_NODE) {
        const frag = document.createDocumentFragment();
        const words = child.textContent.split(" ");
        words.forEach((word, i) => {
          if (word.length) {
            const wordSpan = document.createElement("span");
            wordSpan.className = "word";
            word.split("").forEach((ch) => {
              const letterSpan = document.createElement("span");
              letterSpan.className = "letter";
              letterSpan.textContent = ch;
              wordSpan.appendChild(letterSpan);
              letters.push(letterSpan);
            });
            frag.appendChild(wordSpan);
          }
          if (i < words.length - 1) {
            frag.appendChild(document.createTextNode(" "));
          }
        });
        node.replaceChild(frag, child);
      } else if (child.nodeType === Node.ELEMENT_NODE && child.tagName !== "BR") {
        walk(child);
      }
    });
  };
  walk(el);
  return letters;
}

function revealSplitTexts() {
  if (prefersReducedMotion || !window.gsap) return;
  document.querySelectorAll("[data-split-text]").forEach((el) => {
    const letters = splitIntoLetters(el);
    window.gsap.set(letters, { opacity: 0, y: "0.35em", rotate: 2 });
    window.gsap.to(letters, {
      opacity: 1,
      y: 0,
      rotate: 0,
      duration: 0.9,
      ease: "power4.out",
      stagger: 0.045,
    });
  });
}

/* ==========================================================================
   Lenis + GSAP ScrollTrigger — global smooth scroll, excludes the carousel
   ========================================================================== */
if (!prefersReducedMotion && window.Lenis && window.gsap && window.ScrollTrigger) {
  window.gsap.registerPlugin(window.ScrollTrigger);
  const lenis = new window.Lenis({ duration: 1.1, smoothWheel: true });
  lenis.on("scroll", window.ScrollTrigger.update);
  window.gsap.ticker.add((time) => lenis.raf(time * 1000));
  window.gsap.ticker.lagSmoothing(0);
}

/* ==========================================================================
   Hero — pinned canvas scroll-scrub (grain/gradient, no video asset)
   ========================================================================== */
(function initHeroCanvas() {
  const canvas = document.getElementById("heroCanvas");
  const pinWrap = document.getElementById("heroPinWrap");
  const heroSection = document.getElementById("hero");
  if (!canvas || !pinWrap || !heroSection || prefersReducedMotion) return;

  const ctx = canvas.getContext("2d");

  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  resize();
  window.addEventListener("resize", resize);

  function draw(progress) {
    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    const angle = progress * Math.PI * 2;
    const cx = w / 2 + Math.cos(angle) * w * 0.3;
    const cy = h / 2 + Math.sin(angle) * h * 0.3;
    const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(w, h) * 0.7);
    gradient.addColorStop(0, "rgba(10,10,10,0.07)");
    gradient.addColorStop(1, "rgba(10,10,10,0)");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, w, h);

    ctx.fillStyle = "rgba(10,10,10,0.3)";
    const dotCount = 220;
    for (let i = 0; i < dotCount; i++) {
      const nx = Math.sin(i * 12.9898 + progress * 40) * 43758.5453;
      const ny = Math.sin(i * 78.233 + progress * 27) * 12345.678;
      const x = (nx - Math.floor(nx)) * w;
      const y = (ny - Math.floor(ny)) * h;
      ctx.fillRect(x, y, 1, 1);
    }
  }
  draw(0);

  if (!window.gsap || !window.ScrollTrigger) return;

  const heroTitleEl = document.getElementById("heroTitle");
  const heroEyebrowEl = document.querySelector(".hero-eyebrow");
  const heroLede = document.querySelector(".hero-lede");
  const heroFacts = document.querySelector(".hero-facts");
  const heroActions = document.querySelector(".hero-actions");
  const heroScroll = document.querySelector(".hero-scroll");
  const heroPortrait = document.querySelector(".hero-portrait");

  const pillars = Array.from(document.querySelectorAll(".hero-pillar"));
  const pillarTag = document.getElementById("heroPillarTag");
  const PILLAR_INTRO_END = 0.22;

  function updatePillars(progress) {
    if (!pillars.length) return;
    const span = (1 - PILLAR_INTRO_END) / pillars.length;
    const fadeWindow = span * 0.25;
    let activeName = "";

    pillars.forEach((pillar, i) => {
      const start = PILLAR_INTRO_END + i * span;
      const end = start + span;
      let opacity = 0;

      if (progress >= start && progress <= end) {
        if (progress < start + fadeWindow) {
          opacity = (progress - start) / fadeWindow;
        } else if (progress > end - fadeWindow && i < pillars.length - 1) {
          opacity = (end - progress) / fadeWindow;
        } else {
          opacity = 1;
        }
      }

      opacity = Math.max(0, Math.min(1, opacity));
      pillar.style.opacity = opacity;
      pillar.style.transform = `translateY(${(1 - opacity) * 24}px)`;
      if (opacity > 0.5) activeName = pillar.querySelector(".hero-pillar-title").textContent;
    });

    if (pillarTag) pillarTag.textContent = activeName;
  }

  window.ScrollTrigger.create({
    trigger: pinWrap,
    start: "top top",
    end: "bottom top",
    scrub: true,
    onUpdate: (self) => {
      draw(self.progress);
      const introFade = Math.max(0, 1 - self.progress / (PILLAR_INTRO_END * 0.8));
      window.gsap.set(heroTitleEl, {
        scale: 1 - self.progress * 0.06,
        y: -self.progress * 40,
        opacity: introFade,
      });
      window.gsap.set([heroEyebrowEl, heroLede, heroFacts, heroActions, heroScroll, heroPortrait], {
        opacity: introFade,
      });
      updatePillars(self.progress);
    },
  });
})();

const nav = document.getElementById("siteNav");
const navToggle = document.getElementById("navToggle");
const navLinks = document.getElementById("navLinks");

const setScrolled = () => {
  nav.classList.toggle("is-scrolled", window.scrollY > 12);
};
setScrolled();
window.addEventListener("scroll", setScrolled, { passive: true });

if (navToggle && navLinks) {
  navToggle.addEventListener("click", () => {
    const isOpen = navLinks.getAttribute("data-open") === "true";
    navLinks.setAttribute("data-open", String(!isOpen));
    navToggle.setAttribute("aria-expanded", String(!isOpen));
  });

  navLinks.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      navLinks.setAttribute("data-open", "false");
      navToggle.setAttribute("aria-expanded", "false");
    });
  });
}

const courseList = document.getElementById("courseList");
const courseToggle = document.getElementById("courseToggle");

if (courseList && courseToggle) {
  const label = courseToggle.querySelector(".course-toggle-label");
  courseToggle.addEventListener("click", () => {
    const expanded = courseList.classList.toggle("is-expanded");
    courseToggle.classList.toggle("is-expanded", expanded);
    courseToggle.setAttribute("aria-expanded", String(expanded));
    label.textContent = expanded ? "Show fewer courses" : "Show all coursework (16)";
  });
}

const workCarousel = document.getElementById("workCarousel");

if (workCarousel) {
  const viewport = document.getElementById("workViewport");
  const slides = Array.from(workCarousel.querySelectorAll(".work-slide"));
  const dots = Array.from(workCarousel.querySelectorAll(".work-dot"));
  const prevBtn = document.getElementById("workPrev");
  const nextBtn = document.getElementById("workNext");
  const playPauseBtn = document.getElementById("workPlayPause");
  const AUTOPLAY_MS = 4500;
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  let activeIndex = 0;
  let autoplayTimer = null;
  let isPaused = prefersReducedMotion;

  function centerSlide(slide, behavior) {
    const targetLeft = slide.offsetLeft - (viewport.clientWidth - slide.clientWidth) / 2;
    viewport.scrollTo({ left: targetLeft, behavior });
  }

  function setActive(index, behavior = "smooth") {
    activeIndex = (index + slides.length) % slides.length;
    slides.forEach((slide, i) => slide.classList.toggle("is-active", i === activeIndex));
    dots.forEach((dot, i) => {
      dot.classList.toggle("is-active", i === activeIndex);
      dot.setAttribute("aria-selected", String(i === activeIndex));
    });
    centerSlide(slides[activeIndex], behavior);
  }

  function restartAutoplay() {
    clearInterval(autoplayTimer);
    if (isPaused) return;
    autoplayTimer = setInterval(() => setActive(activeIndex + 1), AUTOPLAY_MS);
  }

  function goTo(index) {
    setActive(index);
    restartAutoplay();
  }

  function setPaused(paused) {
    isPaused = paused;
    playPauseBtn.setAttribute("aria-pressed", String(paused));
    playPauseBtn.setAttribute("aria-label", paused ? "Play autoplay" : "Pause autoplay");
    playPauseBtn.textContent = paused ? "▶" : "❚❚";
    if (paused) {
      clearInterval(autoplayTimer);
    } else {
      restartAutoplay();
    }
  }

  slides.forEach((slide, i) => {
    const card = slide.querySelector(".work-card");
    card.addEventListener("click", (e) => {
      if (i !== activeIndex) {
        e.preventDefault();
        goTo(i);
      }
    });
  });

  dots.forEach((dot, i) => {
    dot.addEventListener("click", () => goTo(i));
  });

  prevBtn.addEventListener("click", () => goTo(activeIndex - 1));
  nextBtn.addEventListener("click", () => goTo(activeIndex + 1));
  playPauseBtn.addEventListener("click", () => setPaused(!isPaused));

  // Mouse-focusing a control makes the browser auto-scroll it into view, which
  // fights the carousel's own horizontal-only scrolling. Suppress focus on
  // mouse press only, so keyboard Tab focus (and its scroll-into-view) still works.
  const suppressMouseFocusScroll = (el) => el.addEventListener("mousedown", (e) => e.preventDefault());
  [prevBtn, nextBtn, playPauseBtn, ...dots].forEach(suppressMouseFocusScroll);
  slides.forEach((slide) => suppressMouseFocusScroll(slide.querySelector(".work-card")));

  workCarousel.addEventListener("mouseenter", () => clearInterval(autoplayTimer));
  workCarousel.addEventListener("mouseleave", () => {
    if (!isPaused) restartAutoplay();
  });
  viewport.addEventListener("touchstart", () => clearInterval(autoplayTimer), { passive: true });
  viewport.addEventListener("touchend", () => {
    if (!isPaused) restartAutoplay();
  }, { passive: true });

  let scrollSettle;
  viewport.addEventListener("scroll", () => {
    clearTimeout(scrollSettle);
    scrollSettle = setTimeout(() => {
      const center = viewport.scrollLeft + viewport.clientWidth / 2;
      let closest = 0;
      let closestDistance = Infinity;
      slides.forEach((slide, i) => {
        const slideCenter = slide.offsetLeft + slide.clientWidth / 2;
        const distance = Math.abs(slideCenter - center);
        if (distance < closestDistance) {
          closestDistance = distance;
          closest = i;
        }
      });
      if (closest !== activeIndex) {
        activeIndex = closest;
        slides.forEach((slide, i) => slide.classList.toggle("is-active", i === activeIndex));
        dots.forEach((dot, i) => {
          dot.classList.toggle("is-active", i === activeIndex);
          dot.setAttribute("aria-selected", String(i === activeIndex));
        });
      }
    }, 120);
  }, { passive: true });

  setActive(0, "auto");
  setPaused(isPaused);

  window.addEventListener("resize", () => centerSlide(slides[activeIndex], "auto"));
}
