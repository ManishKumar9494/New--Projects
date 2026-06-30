/* =========================================================================
   KW New Projects — public site logic (vanilla JS, no frameworks)
   ========================================================================= */
(function () {
  "use strict";

  /* ---------- Shared storage keys & helpers (mirrored in admin.html) ---------- */
  var BLOG_KEY = "kwnp_blogs";
  var LEAD_KEY = "kwnp_leads";

  function readJSON(key, fallback) {
    try {
      var raw = localStorage.getItem(key);
      if (!raw) return fallback;
      var val = JSON.parse(raw);
      return Array.isArray(val) ? val : fallback;
    } catch (e) { return fallback; }
  }
  function writeJSON(key, val) {
    try { localStorage.setItem(key, JSON.stringify(val)); } catch (e) {}
  }
  function uid() {
    return "id-" + Math.floor((1 + (performance.now() % 1)) * 1e9).toString(36) + "-" + (localStorage.length) + "-" + (readJSON(LEAD_KEY, []).length + readJSON(BLOG_KEY, []).length);
  }
  function nowISO() { return new Date().toISOString(); }
  function fmtDate(iso) {
    try {
      var d = new Date(iso);
      return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
    } catch (e) { return iso; }
  }
  function isSafeUrl(url) {
    if (typeof url !== "string") return false;
    return /^https?:\/\//i.test(url.trim());
  }

  /* ---------- Phone validation ----------
     Rules: exactly 10 digits, starts 6-9, not a sequential run,
     and no single digit repeated more than 7 times.
     Returns "" when valid, or an error message when invalid. */
  function phoneError(raw) {
    var d = (raw || "").replace(/\D/g, "");
    if (d.length === 12 && d.indexOf("91") === 0) d = d.slice(2); // strip +91
    if (d.length === 11 && d.charAt(0) === "0") d = d.slice(1);   // strip leading 0
    if (d.length !== 10) return "Please enter a valid 10-digit mobile number.";
    if (!/^[6-9]/.test(d)) return "Mobile number must start with 6, 7, 8 or 9.";
    var counts = {};
    for (var i = 0; i < 10; i++) {
      counts[d[i]] = (counts[d[i]] || 0) + 1;
      if (counts[d[i]] > 7) return "Please enter a valid mobile number (a digit repeats too many times).";
    }
    var asc = true, desc = true;
    for (var j = 1; j < 10; j++) {
      var diff = +d[j] - +d[j - 1];
      if (diff !== 1) asc = false;
      if (diff !== -1) desc = false;
    }
    if (asc || desc || d === "1234567890" || d === "0987654321") {
      return "Please enter a valid mobile number (sequential numbers are not allowed).";
    }
    return "";
  }

  /* ---------- Seed sample blog posts on first load ---------- */
  function seedBlogs() {
    if (localStorage.getItem(BLOG_KEY)) return;
    var seed = [
      {
        id: uid(), title: "KW New Projects Location: Why Ghaziabad Is the Smart Choice",
        slug: "kw-new-projects-location-ghaziabad", category: "Location",
        meta: "Explore the KW New Projects Location advantage — metro, expressway and social-infra connectivity to Delhi & Noida.",
        image: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1000&q=80",
        body: "KW New Projects enjoys a prime Ghaziabad address that balances connectivity with calm.\n\nWith quick access to the metro network and major expressways, commuting to Delhi and Noida is effortless. Reputed schools, hospitals, malls and workspaces lie within a short drive, making everyday life convenient for families.\n\nFor home-buyers evaluating the KW New Projects Location, the combination of low-density planning and strong civic infrastructure makes it a compelling long-term investment.",
        date: nowISO()
      },
      {
        id: uid(), title: "KW New Projects Amenities: Resort-Grade Living Explained",
        slug: "kw-new-projects-amenities-guide", category: "Amenities",
        meta: "A complete guide to KW New Projects Amenities — clubhouse, infinity pool, gym, sky deck and smart-home features.",
        image: "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=1000&q=80",
        body: "Luxury is in the details, and KW New Projects Amenities are designed to elevate everyday living.\n\nResidents enjoy a grand clubhouse, infinity-edge pool, fully-equipped gymnasium, spa, landscaped greens and a sky deck lounge with panoramic views.\n\nFamilies benefit from dedicated kids play zones, sports courts and jogging tracks, while smart-home automation and 24x7 security deliver peace of mind across both towers.",
        date: nowISO()
      },
      {
        id: uid(), title: "KW New Projects RERA & Construction Status: What Buyers Should Know",
        slug: "kw-new-projects-rera-construction-status", category: "Updates",
        meta: "Understand KW New Projects RERA Status, Construction Status and Possession Date — and how to verify them on up-rera.in.",
        image: "https://images.unsplash.com/photo-1450101499163-c8848c66ca85?auto=format&fit=crop&w=1000&q=80",
        body: "Transparency matters when buying a pre-launch home. The KW New Projects RERA Number and RERA Status are currently To be updated and should always be verified on the official portal at up-rera.in.\n\nAs the project progresses, Construction Status and Project Status updates will be shared on the official website.\n\nWe recommend every buyer confirm regulated details — prices, sizes, RERA registration and possession date — independently before booking.",
        date: nowISO()
      }
    ];
    writeJSON(BLOG_KEY, seed);
  }

  /* ---------- Build a blog card safely (no innerHTML for data) ---------- */
  function buildPostCard(post) {
    var card = document.createElement("article");
    card.className = "post-card";

    var media = document.createElement("div");
    media.className = "post-card__media";
    var img = document.createElement("img");
    img.loading = "lazy";
    img.alt = post.title ? ("KW New Projects — " + post.title) : "KW New Projects update";
    img.src = isSafeUrl(post.image) || /^images\//.test(post.image || "") ? post.image : "images/blog-placeholder.jpg";
    img.addEventListener("error", function () { this.classList.add("img-fallback"); });
    media.appendChild(img);

    var body = document.createElement("div");
    body.className = "post-card__body";

    var cat = document.createElement("span");
    cat.className = "post-card__cat";
    cat.textContent = post.category || "Update";

    var h3 = document.createElement("h3");
    h3.textContent = post.title || "Untitled";

    var p = document.createElement("p");
    p.textContent = post.meta || (post.body ? post.body.slice(0, 120) + "…" : "");

    var meta = document.createElement("div");
    meta.className = "post-card__meta";
    var date = document.createElement("span");
    date.textContent = fmtDate(post.date);
    var btn = document.createElement("button");
    btn.type = "button";
    btn.innerHTML = 'Read more <i class="fa-solid fa-arrow-right"></i>';
    btn.addEventListener("click", function () { openReader(post); });
    meta.appendChild(date);
    meta.appendChild(btn);

    body.appendChild(cat);
    body.appendChild(h3);
    body.appendChild(p);
    body.appendChild(meta);
    card.appendChild(media);
    card.appendChild(body);
    return card;
  }

  function renderBlog() {
    var grid = document.getElementById("blogGrid");
    if (!grid) return;
    var posts = readJSON(BLOG_KEY, []).slice().sort(function (a, b) {
      return new Date(b.date) - new Date(a.date);
    });
    grid.textContent = "";
    if (!posts.length) {
      var note = document.createElement("p");
      note.className = "empty-note";
      note.textContent = "New KW New Projects updates are coming soon. Check back shortly.";
      grid.appendChild(note);
      return;
    }
    posts.slice(0, 6).forEach(function (post) { grid.appendChild(buildPostCard(post)); });
  }

  /* ---------- Blog reader modal (safe DOM build) ---------- */
  function openReader(post) {
    var box = document.getElementById("readerContent");
    if (!box) return;
    // keep the close button, clear the rest
    box.textContent = "";
    var close = document.createElement("button");
    close.className = "modal__close";
    close.setAttribute("aria-label", "Close");
    close.setAttribute("data-modal-close", "");
    close.innerHTML = '<i class="fa-solid fa-xmark"></i>';
    box.appendChild(close);

    if (post.image) {
      var media = document.createElement("div");
      media.className = "reader__media";
      var img = document.createElement("img");
      img.alt = "KW New Projects — " + (post.title || "");
      img.src = isSafeUrl(post.image) || /^images\//.test(post.image) ? post.image : "images/blog-placeholder.jpg";
      img.addEventListener("error", function () { this.classList.add("img-fallback"); });
      media.appendChild(img);
      box.appendChild(media);
    }
    var cat = document.createElement("span");
    cat.className = "reader__cat";
    cat.textContent = post.category || "Update";
    box.appendChild(cat);

    var h2 = document.createElement("h2");
    h2.textContent = post.title || "Untitled";
    box.appendChild(h2);

    var meta = document.createElement("div");
    meta.className = "reader__meta";
    meta.textContent = "Published " + fmtDate(post.date);
    box.appendChild(meta);

    var bodyWrap = document.createElement("div");
    bodyWrap.className = "reader__body";
    String(post.body || "").split(/\n{2,}/).forEach(function (para) {
      if (!para.trim()) return;
      var p = document.createElement("p");
      p.textContent = para.trim();
      bodyWrap.appendChild(p);
    });
    box.appendChild(bodyWrap);

    openModal("readerModal");
  }

  /* ---------- Scroll lock (robust — never traps the page) ---------- */
  function lockScroll() {
    document.documentElement.classList.add("no-scroll");
    document.body.classList.add("no-scroll");
  }
  function maybeUnlock() {
    var anyModalOpen = document.querySelector(".modal.is-open");
    var dr = document.getElementById("drawer");
    var drawerOpen = dr && dr.classList.contains("is-open");
    if (!anyModalOpen && !drawerOpen) {
      document.documentElement.classList.remove("no-scroll");
      document.body.classList.remove("no-scroll");
      document.body.style.overflow = ""; // clear any legacy inline lock
    }
  }

  /* ---------- Modals ---------- */
  var lastFocus = null;
  function openModal(id) {
    var m = document.getElementById(id);
    if (!m) return;
    lastFocus = document.activeElement;
    m.classList.add("is-open");
    m.setAttribute("aria-hidden", "false");
    lockScroll();
    var focusable = m.querySelector("input, select, textarea, button");
    if (focusable) setTimeout(function () { focusable.focus(); }, 60);
  }
  function closeModal(m) {
    m.classList.remove("is-open");
    m.setAttribute("aria-hidden", "true");
    maybeUnlock();
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }
  function closeAllModals() {
    document.querySelectorAll(".modal.is-open").forEach(closeModal);
  }

  document.addEventListener("click", function (e) {
    var opener = e.target.closest("[data-modal-open]");
    if (opener) { e.preventDefault(); openModal(opener.getAttribute("data-modal-open")); return; }
    var closer = e.target.closest("[data-modal-close]");
    if (closer) { var m = closer.closest(".modal"); if (m) closeModal(m); return; }
  });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") closeAllModals();
  });

  /* ---------- Lead capture ---------- */
  function saveLead(data) {
    var leads = readJSON(LEAD_KEY, []);
    leads.push(data);
    writeJSON(LEAD_KEY, leads);
  }
  function handleLeadForm(form) {
    var phoneEl = form.querySelector('[name="phone"]');
    if (phoneEl) phoneEl.addEventListener("input", function () { phoneEl.setCustomValidity(""); });
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (phoneEl) phoneEl.setCustomValidity(phoneError(phoneEl.value));
      if (!form.checkValidity()) { form.reportValidity(); return; }
      var fd = new FormData(form);
      var lead = {
        id: uid(),
        name: (fd.get("name") || "").toString().trim(),
        phone: (fd.get("phone") || "").toString().trim(),
        email: (fd.get("email") || "").toString().trim(),
        config: (fd.get("config") || "").toString().trim() || "—",
        visitDate: (fd.get("visitDate") || "").toString().trim() || "—",
        source: form.getAttribute("data-source") || "Website",
        date: nowISO()
      };
      saveLead(lead);
      if (window.dataLayer) window.dataLayer.push({ event: "generate_lead", lead_source: lead.source });
      if (typeof gtag === "function") { try { gtag("event", "generate_lead", { source: lead.source }); } catch (err) {} }

      var parentModal = form.closest(".modal");
      if (parentModal) closeModal(parentModal);
      form.reset();

      var msg = document.getElementById("thanksMsg");
      if (msg) {
        msg.textContent = form.hasAttribute("data-visit")
          ? "Thank you! Your site visit request for KW New Projects has been received. Our relationship manager will confirm your preferred date shortly."
          : "Thank you! Your enquiry for KW New Projects has been received. Our team will contact you shortly.";
      }
      openModal("thanksModal");
    });
  }
  document.querySelectorAll("form[data-source]").forEach(handleLeadForm);

  /* ---------- Set min date on visit field ---------- */
  (function () {
    var d = new Date();
    var iso = d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
    document.querySelectorAll('input[name="visitDate"]').forEach(function (el) { el.min = iso; });
  })();

  /* ---------- Mobile drawer ---------- */
  var drawer = document.getElementById("drawer");
  var navToggle = document.getElementById("navToggle");
  if (navToggle && drawer) {
    navToggle.addEventListener("click", function () {
      drawer.classList.add("is-open");
      navToggle.setAttribute("aria-expanded", "true");
      lockScroll();
    });
    drawer.addEventListener("click", function (e) {
      if (e.target.closest("[data-drawer-close]")) {
        drawer.classList.remove("is-open");
        navToggle.setAttribute("aria-expanded", "false");
        maybeUnlock();
      }
    });
  }

  /* ---------- Sticky nav shadow ---------- */
  var nav = document.getElementById("nav");
  if (nav) {
    var onScroll = function () { nav.classList.toggle("is-stuck", window.scrollY > 10); };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
  }

  /* ---------- Plan tabs ---------- */
  document.querySelectorAll(".tab[data-tab]").forEach(function (tab) {
    tab.addEventListener("click", function () {
      var key = tab.getAttribute("data-tab");
      document.querySelectorAll(".tab[data-tab]").forEach(function (t) {
        var on = t === tab;
        t.classList.toggle("is-active", on);
        t.setAttribute("aria-selected", on ? "true" : "false");
      });
      document.querySelectorAll(".plan-panel").forEach(function (p) {
        p.classList.toggle("is-active", p.getAttribute("data-panel") === key);
      });
    });
  });

  /* ---------- FAQ accordion ---------- */
  document.querySelectorAll(".faq-item").forEach(function (item) {
    var q = item.querySelector(".faq-q");
    var a = item.querySelector(".faq-a");
    if (!q || !a) return;
    q.addEventListener("click", function () {
      var open = item.classList.contains("is-open");
      document.querySelectorAll(".faq-item.is-open").forEach(function (other) {
        if (other !== item) { other.classList.remove("is-open"); other.querySelector(".faq-a").style.maxHeight = null; }
      });
      if (open) { item.classList.remove("is-open"); a.style.maxHeight = null; }
      else { item.classList.add("is-open"); a.style.maxHeight = a.scrollHeight + "px"; }
    });
  });

  /* ---------- Reveal on scroll ---------- */
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); }
      });
    }, { threshold: 0.12 });
    document.querySelectorAll(".reveal").forEach(function (el) { io.observe(el); });
  } else {
    document.querySelectorAll(".reveal").forEach(function (el) { el.classList.add("in"); });
  }

  /* ---------- Year ---------- */
  var yr = document.getElementById("year");
  if (yr) yr.textContent = String(new Date().getFullYear());

  /* ---------- Pre-launch offer modal: timed + exit-intent, once per session ---------- */
  (function () {
    var SHOWN = "kwnp_offer_shown";
    function alreadyShown() { try { return sessionStorage.getItem(SHOWN) === "1"; } catch (e) { return false; } }
    function markShown() { try { sessionStorage.setItem(SHOWN, "1"); } catch (e) {} }
    function trigger() {
      if (alreadyShown()) return;
      if (document.querySelector(".modal.is-open")) return;
      markShown();
      openModal("offerModal");
    }
    // Desktop only — avoids trapping mobile scroll and intrusive-interstitial SEO penalties
    var isDesktop = window.matchMedia("(min-width: 769px)").matches;
    if (isDesktop) {
      var timer = setTimeout(trigger, 18000); // timed
      document.addEventListener("mouseout", function (e) {        // exit-intent
        if (!e.relatedTarget && e.clientY <= 0) { clearTimeout(timer); trigger(); }
      });
    }
  })();

  /* ---------- Safety: never leave the page scroll-locked (bfcache / legacy state) ---------- */
  window.addEventListener("pageshow", function () {
    document.documentElement.classList.remove("no-scroll");
    document.body.classList.remove("no-scroll");
    document.body.style.overflow = "";
  });

  /* ---------- Cross-tab / same-browser live sync ---------- */
  window.addEventListener("storage", function (e) {
    if (e.key === BLOG_KEY) renderBlog();
  });
  // Re-render when returning to the tab (e.g., after editing in admin tab)
  document.addEventListener("visibilitychange", function () {
    if (!document.hidden) renderBlog();
  });

  /* ---------- Init ---------- */
  seedBlogs();
  renderBlog();
})();
