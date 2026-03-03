const menuBtn = document.getElementById("menuBtn");
const navMenu = document.getElementById("navMenu");
const navLinks = navMenu ? navMenu.querySelectorAll("a") : [];
const WINGS_WHATSAPP = "919559752997";
const API_BASE = window.WINGS_API_BASE || "";

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
    const days = Math.floor(gap / (1000 * 60 * 60 * 24));
    const hrs = Math.floor((gap % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const mins = Math.floor((gap % (1000 * 60 * 60)) / (1000 * 60));
    const secs = Math.floor((gap % (1000 * 60)) / 1000);
    offerTimer.textContent = `${days}d ${String(hrs).padStart(2, "0")}h ${String(mins).padStart(2, "0")}m ${String(secs).padStart(2, "0")}s`;
  };
  tickOffer();
  setInterval(tickOffer, 1000);
}

const portrait = document.querySelector(".portrait-glow");
if (portrait) {
  portrait.addEventListener("mousemove", (e) => {
    const rect = portrait.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    portrait.style.transform = `perspective(900px) rotateY(${x * 8}deg) rotateX(${y * -8}deg)`;
  });
  portrait.addEventListener("mouseleave", () => {
    portrait.style.transform = "perspective(900px) rotateY(0deg) rotateX(0deg)";
  });
}

const buildWhatsAppMessage = (lead) =>
  [
    "*New Wings Coaching Lead*",
    `Enquiry Type: ${lead.enquiryType}`,
    `Student Name: ${lead.name}`,
    `Parent Name: ${lead.parentName}`,
    `Class: ${lead.grade}`,
    `Phone: ${lead.phone}`,
    `Preferred Time: ${lead.preferredTime || "Not Provided"}`,
    `Message: ${lead.message || "Not Provided"}`,
    "Source: Website Form",
    `Submitted At: ${new Date().toLocaleString("en-IN")}`,
  ].join("\n");

const buildWhatsAppLink = (lead) =>
  `https://wa.me/${WINGS_WHATSAPP}?text=${encodeURIComponent(buildWhatsAppMessage(lead))}`;

const submitLeadToBackend = async (lead) => {
  try {
    const response = await fetch(`${API_BASE}/api/enquiry`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(lead),
    });
    if (!response.ok) throw new Error("Backend rejected lead");
    const payload = await response.json();
    if (payload && payload.wa_url) return payload.wa_url;
  } catch (error) {
    // Fallback ensures WhatsApp lead flow still works when backend is unavailable.
  }
  return buildWhatsAppLink(lead);
};

const form = document.getElementById("enquiryForm");
const formMsg = document.getElementById("formMsg");

if (form && formMsg) {
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const data = new FormData(form);
    const enquiryType = String(data.get("enquiryType") || "").trim();
    const name = String(data.get("name") || "").trim();
    const parentName = String(data.get("parentName") || "").trim();
    const grade = String(data.get("grade") || "").trim();
    const phone = String(data.get("phone") || "").trim();
    const message = String(data.get("message") || "").trim();
    const preferredTime = String(data.get("preferredTime") || "").trim();

    if (!enquiryType || !name || !parentName || !grade || !/^\d{10}$/.test(phone)) {
      formMsg.textContent = "Please fill enquiry type, student name, parent name, class and valid 10-digit mobile number.";
      formMsg.style.color = "#bf1f1f";
      return;
    }

    const lead = {
      enquiryType,
      name,
      parentName,
      grade,
      phone,
      preferredTime,
      message,
      source: "website",
    };

    formMsg.textContent = "Submitting details and opening WhatsApp...";
    formMsg.style.color = "#147a33";

    const preOpenedWindow = window.open("about:blank", "_blank");
    const waUrl = await submitLeadToBackend(lead);
    if (preOpenedWindow) preOpenedWindow.location.href = waUrl;
    else window.location.href = waUrl;

    formMsg.textContent = "Lead captured successfully.";
    form.reset();
  });
}
