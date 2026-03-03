const menuBtn = document.getElementById("menuBtn");
const navMenu = document.getElementById("navMenu");
const navLinks = navMenu ? navMenu.querySelectorAll("a") : [];

if (menuBtn && navMenu) {
  menuBtn.addEventListener("click", () => {
    navMenu.classList.toggle("open");
  });
}

navLinks.forEach((link) => {
  link.addEventListener("click", () => {
    navMenu.classList.remove("open");
  });
});

const reveals = document.querySelectorAll(".reveal");
const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("show");
        revealObserver.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.18 }
);
reveals.forEach((item) => revealObserver.observe(item));

const counters = document.querySelectorAll(".count");
const animateCounter = (el) => {
  const target = Number(el.dataset.target || 0);
  const start = performance.now();
  const duration = 1300;

  const run = (now) => {
    const p = Math.min((now - start) / duration, 1);
    const value = Math.floor(target * p);
    el.textContent = `${value}+`;
    if (p < 1) requestAnimationFrame(run);
  };

  requestAnimationFrame(run);
};

const countObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        animateCounter(entry.target);
        countObserver.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.55 }
);

counters.forEach((c) => countObserver.observe(c));

const offerTimer = document.getElementById("offerTimer");
if (offerTimer) {
  const target = new Date("2026-03-31T23:59:59+05:30").getTime();
  const tickOffer = () => {
    const now = Date.now();
    const gap = target - now;
    if (gap <= 0) {
      offerTimer.textContent = "Offer Closed";
      return;
    }
    const hrs = Math.floor(gap / (1000 * 60 * 60));
    const mins = Math.floor((gap % (1000 * 60 * 60)) / (1000 * 60));
    const secs = Math.floor((gap % (1000 * 60)) / 1000);
    offerTimer.textContent = `${String(hrs).padStart(2, "0")}:${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };
  tickOffer();
  setInterval(tickOffer, 1000);
}

const form = document.getElementById("enquiryForm");
const formMsg = document.getElementById("formMsg");

if (form && formMsg) {
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const data = new FormData(form);
    const name = String(data.get("name") || "").trim();
    const grade = String(data.get("grade") || "").trim();
    const phone = String(data.get("phone") || "").trim();

    if (!name || !grade || !/^\d{10}$/.test(phone)) {
      formMsg.textContent = "Please fill valid name, class and 10-digit mobile number.";
      formMsg.style.color = "#bf1f1f";
      return;
    }

    formMsg.textContent = "Enquiry submitted. Wings Coaching team will contact you shortly.";
    formMsg.style.color = "#147a33";
    form.reset();
  });
}
