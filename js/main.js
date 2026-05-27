(function () {
  "use strict";

  const header = document.getElementById("header");
  const navToggle = document.getElementById("navToggle");
  const navLinks = document.getElementById("navLinks");
  const contactForm = document.getElementById("contactForm");
  const formNote = document.getElementById("formNote");

  // Sticky header on scroll
  function onScroll() {
    if (window.scrollY > 60) {
      header.classList.add("scrolled");
    } else {
      header.classList.remove("scrolled");
    }
  }

  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  // Mobile navigation
  navToggle.addEventListener("click", function () {
    const isOpen = navLinks.classList.toggle("open");
    navToggle.classList.toggle("open", isOpen);
    navToggle.setAttribute("aria-expanded", String(isOpen));
    navToggle.setAttribute("aria-label", isOpen ? "Close menu" : "Open menu");
  });

  navLinks.querySelectorAll("a").forEach(function (link) {
    link.addEventListener("click", function () {
      navLinks.classList.remove("open");
      navToggle.classList.remove("open");
      navToggle.setAttribute("aria-expanded", "false");
    });
  });

  // Scroll reveal
  const revealTargets = document.querySelectorAll(
    ".section-header, .dest-card, .package-card, .feature-list li, .review-card, .why-us-visual, .contact-form"
  );

  revealTargets.forEach(function (el) {
    el.classList.add("fade-in");
  });

  const observer = new IntersectionObserver(
    function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
        }
      });
    },
    { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
  );

  revealTargets.forEach(function (el) {
    observer.observe(el);
  });

  // Contact form
  contactForm.addEventListener("submit", function (e) {
    e.preventDefault();
    formNote.className = "form-note";
    formNote.textContent = "";

    const name = document.getElementById("name").value.trim();
    const email = document.getElementById("email").value.trim();

    if (!name || !email) {
      formNote.className = "form-note error";
      formNote.textContent = "Please fill in your name and email.";
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      formNote.className = "form-note error";
      formNote.textContent = "Please enter a valid email address.";
      return;
    }

    formNote.className = "form-note success";
    formNote.textContent =
      "Thank you, " +
      name.split(" ")[0] +
      "! We will reply within 24 hours. Terima kasih!";
    contactForm.reset();
  });
})();
