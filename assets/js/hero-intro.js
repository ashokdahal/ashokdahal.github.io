/**
 * Hero intro sequence: the heading types itself out on a blank screen,
 * then the portrait fades in, then the rest of the hero (eyebrow, role,
 * lede, buttons, meta links) appears together in one step.
 *
 * Progressive enhancement: the heading's real text already sits in the
 * DOM (see index.html), so with JS disabled — or before this script
 * runs — everything is simply visible, no animation, nothing missing.
 */
(function () {
  "use strict";

  var typeTarget = document.getElementById("heroTypeTarget");
  var cursor = document.getElementById("typeCursor");
  var portrait = document.querySelector(".hero-portrait");
  var revealGroups = document.querySelectorAll(".hero-reveal");

  if (!typeTarget) return;

  var fullText = typeTarget.textContent;
  var reduceMotion = window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function showEverythingNow() {
    typeTarget.classList.add("started");
    if (portrait) portrait.classList.add("is-visible");
    revealGroups.forEach(function (el) { el.classList.add("is-visible"); });
    if (cursor) cursor.classList.add("done");
  }

  if (reduceMotion) {
    showEverythingNow();
    return;
  }

  typeTarget.classList.add("started");
  typeTarget.textContent = "";

  var TYPE_SPEED = 42;
  var i = 0;

  function typeNext() {
    i += 1;
    typeTarget.textContent = fullText.slice(0, i);
    if (i < fullText.length) {
      setTimeout(typeNext, TYPE_SPEED);
    } else {
      if (cursor) cursor.classList.add("done");
      setTimeout(revealPortrait, 260);
    }
  }

  function revealPortrait() {
    if (portrait) portrait.classList.add("is-visible");
    setTimeout(revealRest, 380);
  }

  function revealRest() {
    revealGroups.forEach(function (el) { el.classList.add("is-visible"); });
  }

  setTimeout(typeNext, 300);
})();
