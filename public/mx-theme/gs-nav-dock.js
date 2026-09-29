/*  gs-nav-dock.js — the phone dock's idle state.
 *
 *  The navigation is pinned to the bottom of the screen on a phone
 *  (gs-bahri/atom-gs-responsive.scss, section 5). Sitting over the page at
 *  full strength the whole time, it competes with what is being read, so it
 *  steps back three seconds after the last sign of a hand: a pointer move, a
 *  tap, a key, a wheel, a scroll. Anything at all brings it back.
 *
 *  Written as a clock rather than a timer that is cleared and set again,
 *  because Mendix replaces the page's DOM on every navigation: the element
 *  this marks is a different one after each, and a stored reference or a
 *  pending timeout would be pointing at the one before. Reading the class off
 *  whatever is on screen right now costs two comparisons twice a second and
 *  survives every page change on its own.
 */
(function () {
    'use strict';

    var IDLE_AFTER = 3000;
    var PHONE = '(max-width: 767.98px)';
    var IDLE_CLASS = 'gs-nav-idle';
    var TICK = 500;

    var media = window.matchMedia(PHONE);
    var last = Date.now();

    function dock() {
        return document.querySelector('.gs-bahri-layout .gs-nav');
    }

    function mark(idle) {
        var el = dock();
        if (!el || el.classList.contains(IDLE_CLASS) === idle) {
            // nothing to say: writing the class again would restart the fade
            return;
        }
        if (idle) {
            el.classList.add(IDLE_CLASS);
        } else {
            el.classList.remove(IDLE_CLASS);
        }
    }

    function moved() {
        last = Date.now();
        mark(false);
    }

    function tick() {
        mark(media.matches && Date.now() - last >= IDLE_AFTER);
    }

    var SIGNS = ['pointerdown', 'pointermove', 'touchstart', 'wheel', 'keydown', 'scroll', 'click'];
    for (var i = 0; i < SIGNS.length; i++) {
        // capture, so a scroll inside Mendix's own scroll container counts too
        document.addEventListener(SIGNS[i], moved, { capture: true, passive: true });
    }

    if (media.addEventListener) {
        media.addEventListener('change', moved);
    } else if (media.addListener) {
        media.addListener(moved);
    }

    window.setInterval(tick, TICK);
}());
