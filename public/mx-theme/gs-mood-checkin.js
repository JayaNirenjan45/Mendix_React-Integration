// =============================================================================
//  Daily check-in (mood) popup for Main.NewLayout.
//  Clicking the header emoji (.gs-header-mood) opens the popup next to it;
//  the back arrow, Escape, or a click outside closes it.
//  Styles live in gs-bahri/atom-gs.scss (.gs-mood-pop).
// =============================================================================
(function () {
  "use strict";

  // Resolve assets relative to this script so it works on /p/... page URLs too.
  var scriptSrc = document.currentScript && document.currentScript.src;
  var BASE = scriptSrc ? scriptSrc.replace(/[^/]*(\?.*)?$/, "") : "";
  var IMG_DIR = BASE + "gs-bahri/gs-images/mood/";

  // Clockwise from the top, 40deg apart, matching the Figma frame.
  var MOODS = ["Bored", "Neutral", "Happy", "Sad", "Angry", "Surprised", "Loving", "Inspired", "Calm"];

  // Figma frame units (675 x 875).
  var RING_CX = 338;
  var RING_CY = 403;
  var RING_R = 197;
  var ICON = 104;
  var GAP = 12;
  var EDGE = 16;

  var pop = null;
  var trigger = null;
  var selected = null;

  var ARROW_LEFT =
    '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M19 12H5M11 18l-6-6 6-6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  var ARROW_RIGHT =
    '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';

  function build() {
    var el = document.createElement("div");
    el.className = "gs-mood-pop";
    el.setAttribute("role", "dialog");
    el.setAttribute("aria-labelledby", "gs-mood-pop-title");

    var ring = MOODS.map(function (mood, i) {
      var a = ((10 + i * 40) * Math.PI) / 180;
      var x = RING_CX + RING_R * Math.sin(a) - ICON / 2;
      var y = RING_CY - RING_R * Math.cos(a) - ICON / 2;
      return (
        '<button type="button" class="gs-mood-pop__mood" role="radio" aria-checked="false"' +
        ' data-mood="' + mood + '" aria-label="' + mood + '"' +
        ' style="--x:' + x.toFixed(1) + ";--y:" + y.toFixed(1) + ";--i:" + i + '">' +
        '<img src="' + IMG_DIR + "mood-circle-" + mood + '.svg" alt="" draggable="false">' +
        "</button>"
      );
    }).join("");

    el.innerHTML =
      '<button type="button" class="gs-mood-pop__back" aria-label="Close">' + ARROW_LEFT + "</button>" +
      '<div class="gs-mood-pop__eyebrow">Daily Check-in</div>' +
      '<div class="gs-mood-pop__ring" role="radiogroup" aria-labelledby="gs-mood-pop-title">' + ring + "</div>" +
      '<h2 class="gs-mood-pop__title" id="gs-mood-pop-title">How are you<br>feeling today?</h2>' +
      '<div class="gs-mood-pop__hint">Choose your mood</div>' +
      '<button type="button" class="gs-mood-pop__next" aria-label="Continue" disabled>' + ARROW_RIGHT + "</button>";

    el.querySelector(".gs-mood-pop__back").addEventListener("click", close);
    el.querySelector(".gs-mood-pop__next").addEventListener("click", submit);
    el.querySelector(".gs-mood-pop__ring").addEventListener("click", function (e) {
      var btn = e.target.closest(".gs-mood-pop__mood");
      if (btn) select(btn.getAttribute("data-mood"));
    });
    return el;
  }

  function select(mood) {
    selected = mood;
    pop.querySelectorAll(".gs-mood-pop__mood").forEach(function (btn) {
      btn.setAttribute("aria-checked", String(btn.getAttribute("data-mood") === mood));
    });
    pop.classList.add("gs-mood-pop--has-selection");
    pop.querySelector(".gs-mood-pop__hint").textContent = "Feeling " + mood;
    pop.querySelector(".gs-mood-pop__next").disabled = false;
  }

  function submit() {
    if (!selected) return;
    try {
      localStorage.setItem("gsDailyMood", JSON.stringify({ mood: selected, date: new Date().toISOString().slice(0, 10) }));
    } catch (e) {
      // storage unavailable — selection is still broadcast below
    }
    // Hook for Mendix (e.g. a JavaScript Snippet / nanoflow) to persist the check-in.
    window.dispatchEvent(new CustomEvent("gs:mood-checkin", { detail: { mood: selected } }));
    close();
  }

  function position() {
    if (!pop || !trigger) return;
    if (!document.body.contains(trigger)) return close();
    var r = trigger.getBoundingClientRect();
    var w = pop.offsetWidth;
    var h = pop.offsetHeight;
    var vw = document.documentElement.clientWidth;
    var vh = document.documentElement.clientHeight;

    // Centred under the emoji, kept inside the viewport.
    var left = Math.min(Math.max(EDGE, r.left + r.width / 2 - w / 2), vw - w - EDGE);
    var top = r.bottom + GAP;
    if (top + h > vh - EDGE) top = Math.max(EDGE, vh - h - EDGE);

    pop.style.left = left + "px";
    pop.style.top = top + "px";
    pop.style.transformOrigin = (r.left + r.width / 2 - left) + "px " + (r.top + r.height / 2 - top) + "px";
  }

  function open(from) {
    trigger = from;
    selected = null;
    pop = build();
    document.body.appendChild(pop);
    position();
    // Next frame so the entry transition runs.
    requestAnimationFrame(function () {
      if (pop) pop.classList.add("gs-mood-pop--open");
    });
    pop.querySelector(".gs-mood-pop__back").focus({ preventScroll: true });
    window.addEventListener("resize", position);
    document.addEventListener("keydown", onKeydown);
    document.addEventListener("pointerdown", onOutside, true);
  }

  function close() {
    if (!pop) return;
    var el = pop;
    var returnTo = trigger;
    pop = null;
    trigger = null;
    window.removeEventListener("resize", position);
    document.removeEventListener("keydown", onKeydown);
    document.removeEventListener("pointerdown", onOutside, true);
    el.classList.remove("gs-mood-pop--open");
    setTimeout(function () {
      el.remove();
    }, 200);
    if (returnTo && document.body.contains(returnTo) && returnTo.focus) returnTo.focus({ preventScroll: true });
  }

  function onKeydown(e) {
    if (e.key === "Escape") close();
  }

  function onOutside(e) {
    if (pop && !pop.contains(e.target) && !(trigger && trigger.contains(e.target))) close();
  }

  // Delegated, because Mendix re-renders the layout on navigation.
  document.addEventListener("click", function (e) {
    var hit = e.target.closest && e.target.closest(".gs-header-mood");
    if (!hit) return;
    if (pop) close();
    else open(hit);
  });

  window.addEventListener("popstate", close);
})();
