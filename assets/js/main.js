(function () {
  "use strict";

  var yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  var toggle = document.getElementById("navToggle");
  var nav = document.getElementById("primaryNav");
  if (toggle && nav) {
    toggle.addEventListener("click", function () {
      var open = nav.classList.toggle("open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
    });
    nav.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", function () {
        nav.classList.remove("open");
        toggle.setAttribute("aria-expanded", "false");
      });
    });
  }

  var THEME_COLORS = { dark: "#141210", light: "#faf8f4" };
  var themeToggle = document.getElementById("themeToggle");
  var themeColorMeta = document.querySelector('meta[name="theme-color"]');
  var root = document.documentElement;

  function applyTheme(theme) {
    if (theme === "light") {
      root.setAttribute("data-theme", "light");
    } else {
      root.removeAttribute("data-theme");
    }
    if (themeColorMeta) themeColorMeta.setAttribute("content", THEME_COLORS[theme]);
    if (themeToggle) {
      themeToggle.setAttribute("aria-label", theme === "light" ? "Switch to dark theme" : "Switch to light theme");
    }
  }

  if (themeToggle) {
    var current = root.getAttribute("data-theme") === "light" ? "light" : "dark";
    applyTheme(current);

    themeToggle.addEventListener("click", function () {
      current = current === "light" ? "dark" : "light";
      applyTheme(current);
      try { localStorage.setItem("theme", current); } catch (e) {}
    });
  }
})();
