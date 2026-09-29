/*
 * bahri-login-fx.js — behaviours for the sign-in page (Main.Employee_Login_Page_New)
 * that CSS cannot provide. Ported from the reference design
 * (R:\Bahri Design as website\login-samples.html):
 *
 *   1. a very gentle 3D tilt of the glass card (and the rings around it) as
 *      the pointer moves over the right-hand panel — max 3.5°, so the card
 *      barely moves;
 *   2. the "Latest at Bahri" announcement rotating through its headlines every
 *      5s with a cross-fade, its category chip and progress dots in step;
 *   3. a smooth hand-off into the app after a successful sign-in: the card
 *      dissolves as the form is submitted, and — because Mendix reloads the
 *      client on sign-in — a curtain in the login's own light (raised by a
 *      one-line script in index.html before first paint) covers the reload and
 *      fades once the home page is on screen, which rises into place.
 *
 * Loaded from theme/web/index.html on every page; it only acts when a
 * `.bahri-login-new` page is on screen (or a hand-off is pending), and binds
 * each element once. Styling lives in bahri-login-new.scss (--bl-rx/--bl-ry,
 * .bl-announce-dots/.bl-has-dots, .bl-leaving, html.bl-handoff, .bl-enter).
 */
(function () {
    'use strict';

    var TILT = 3.5;
    var ITEMS = [
        { t: 'September payslips are now available in the hub.', c: 'HR' },
        { t: 'Q3 town hall — register now, seats are limited.', c: 'Events' },
        { t: 'New leave policy goes live from Monday.', c: 'Policy' },
        { t: 'Fleet Safety Week starts next week — see the schedule.', c: 'Fleet' }
    ];
    var HANDOFF_KEY = 'bl-signin-transition'; // shared with the inline script in index.html
    var HANDOFF_MAX_AGE = 20000;             // a flag older than this is stale, not a sign-in
    var reduceMotion = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);

    function flag(set) {
        try { if (set) { sessionStorage.setItem(HANDOFF_KEY, String(Date.now())); } else { sessionStorage.removeItem(HANDOFF_KEY); } } catch (e) { /* storage unavailable */ }
    }
    function flagAge() {
        try { var t = +sessionStorage.getItem(HANDOFF_KEY) || 0; return t ? Date.now() - t : -1; } catch (e) { return -1; }
    }

    // 1 · tilt — the panel sets two CSS variables; the card and its rings
    // rotate with them (see .bl-form / .bl-panel::before in the stylesheet).
    function bindTilt(panel) {
        if (panel.dataset.blTilt) { return; }
        panel.dataset.blTilt = '1';
        panel.addEventListener('mousemove', function (e) {
            var r = panel.getBoundingClientRect();
            var rx = ((e.clientY - r.top) / r.height - 0.5) * -TILT;
            var ry = ((e.clientX - r.left) / r.width - 0.5) * TILT;
            panel.style.setProperty('--bl-rx', rx.toFixed(3) + 'deg');
            panel.style.setProperty('--bl-ry', ry.toFixed(3) + 'deg');
        });
        panel.addEventListener('mouseleave', function () {
            panel.style.setProperty('--bl-rx', '0deg');
            panel.style.setProperty('--bl-ry', '0deg');
        });
    }

    // 2 · announcement — real progress dots (so the active one can slide), then
    // rotate text + chip + dots with the reference's cross-fade timing.
    function bindAnnounce(card) {
        if (card.dataset.blRotate) { return; }
        card.dataset.blRotate = '1';
        var text = card.querySelector('.bl-announce-text');
        var chip = card.querySelector('.bl-announce-chip');
        if (!text) { return; }

        var dots = document.createElement('div');
        dots.className = 'bl-announce-dots';
        dots.setAttribute('aria-hidden', 'true');
        for (var k = 0; k < ITEMS.length; k++) { dots.appendChild(document.createElement('i')); }
        card.appendChild(dots);
        card.classList.add('bl-has-dots');
        var marks = dots.children;
        marks[0].classList.add('on');

        if (reduceMotion) { return; }

        var i = 0;
        var timer = setInterval(function () {
            if (!document.body.contains(card)) { clearInterval(timer); return; }
            text.style.opacity = '0';
            text.style.transform = 'translateY(-6px)';
            if (chip) { chip.style.opacity = '0'; }
            setTimeout(function () {
                i = (i + 1) % ITEMS.length;
                text.textContent = ITEMS[i].t;
                if (chip) { chip.textContent = ITEMS[i].c; }
                for (var d = 0; d < marks.length; d++) { marks[d].classList.toggle('on', d === i); }
                text.style.transition = 'none';
                text.style.transform = 'translateY(9px)';
                requestAnimationFrame(function () {
                    text.style.transition = '';
                    text.style.opacity = '1';
                    text.style.transform = 'translateY(0)';
                    if (chip) { chip.style.opacity = '1'; }
                });
            }, 420);
        }, 5000);
    }

    // 3a · leaving — when the form is submitted with both fields filled, start
    // the exit and flag the hand-off for the reload. Any validation error
    // (wrong password, empty field…) shakes the card assembly; if we were
    // leaving, the sign-in was refused, so the card comes back as it shakes.
    function shake(el) {
        if (!el || reduceMotion) { return; }
        el.classList.remove('bl-shake');
        void el.offsetWidth; // restart the animation if it is still running
        el.classList.add('bl-shake');
        el.addEventListener('animationend', function done(e) {
            if (e.animationName === 'bl-shake') { el.classList.remove('bl-shake'); el.removeEventListener('animationend', done); }
        });
    }

    // A successful sign-in reloads the client, so "the page is unloading" is the
    // one reliable success signal.
    var unloading = false;
    window.addEventListener('pagehide', function () { unloading = true; });
    window.addEventListener('beforeunload', function () { unloading = true; });

    // The sign-in request itself (a POST to xas/ with action "login") is the
    // definitive refusal signal: the client rejects a 401 without reading the
    // body, so the request never reaches resource timing — watch fetch()
    // instead. Observe-only: the call and its result pass through untouched.
    var onLoginResponse = null;
    (function () {
        var native = window.fetch;
        if (typeof native !== 'function') { return; }
        window.fetch = function (input, init) {
            var result = native.apply(this, arguments);
            try {
                var url = String(typeof input === 'string' ? input : (input && input.url) || '');
                var body = init && init.body;
                if (/\/xas\/?(\?|$)/.test(url) && typeof body === 'string' && body.indexOf('"action":"login"') !== -1) {
                    result.then(function (res) { if (onLoginResponse) { onLoginResponse(res.status); } },
                                function () { if (onLoginResponse) { onLoginResponse(0); } });
                }
            } catch (e) { /* observing only — never disturb the call */ }
            return result;
        };
    })();

    function bindSubmit(page) {
        if (page.dataset.blSubmit) { return; }
        page.dataset.blSubmit = '1';
        var user = page.querySelector('.bl-field:not(.bl-field-pass) input');
        var pass = page.querySelector('.bl-field-pass input');
        var button = page.querySelector('.bl-submit');
        var panel = page.querySelector('.bl-panel');
        var error = page.querySelector('.bl-error');

        // Each submit is an "attempt" that is settled exactly once: by a refusal
        // (shake, and the card returns if it was leaving) or by the reload.
        var settled = true;

        function errorVisible() {
            return !!error && !!error.textContent.trim() && getComputedStyle(error).display !== 'none';
        }
        function refused() {
            if (settled) { return; }
            settled = true;
            shake(panel);
            if (page.classList.contains('bl-leaving')) {
                page.classList.remove('bl-leaving');
                flag(false);
            }
        }

        // The sign-in request settles the attempt, both ways. 200 is the only
        // thing that starts the exit — so a refusal cannot strand the page
        // part-way through one, which is what used to leave the card dissolved.
        onLoginResponse = function (status) {
            if (settled) { return; }
            if (status === 200) {
                settled = true;
                page.classList.add('bl-leaving');
                flag(true);
            } else {
                refused();
            }
        };

        // The message widget is only ever written on a failure, and it rewrites
        // its content every time (even for the same text) — so any change to it
        // while an attempt is open is a refusal.
        if (error) {
            new MutationObserver(function () {
                if (!settled && errorVisible()) { refused(); }
            }).observe(error, { attributes: true, childList: true, subtree: true, characterData: true });
        }

        // Submitting no longer dissolves anything on faith. The card stays put
        // until the runtime answers: on success the exit plays in the moment
        // between the 200 and the client's own reload, and on a refusal there
        // is nothing to put back — it only shakes.
        function submitted() {
            settled = false;
            setTimeout(function () { if (!settled && !unloading) { refused(); } }, 6000);
        }

        if (button) { button.addEventListener('click', submitted); }
        [user, pass].forEach(function (input) {
            if (input) { input.addEventListener('keydown', function (e) { if (e.key === 'Enter') { submitted(); } }); }
        });
    }

    // 3b · arriving — index.html has already raised the curtain (html.bl-handoff)
    // if a sign-in was flagged. Once the home page is mounted and Mendix's
    // loader has gone, let the page rise in and fade the curtain away. Landing
    // back on the sign-in page means it was refused: drop the curtain at once.
    var handoffDone = false;
    function arrive() {
        if (handoffDone) { return; }
        var root = document.documentElement;
        var age = flagAge();
        var curtain = root.classList.contains('bl-handoff');
        if (age < 0 && !curtain) { return; }               // nothing pending
        if (age > HANDOFF_MAX_AGE && !curtain) { flag(false); return; }

        var login = document.querySelector('.bahri-login-new');
        var page = document.querySelector('.mx-page:not(.bahri-login-new)');
        var loading = document.querySelector('.mx-progress:not(.mx-progress-hidden)');

        if (login && !login.classList.contains('bl-leaving')) {   // refused / back on sign-in
            handoffDone = true;
            flag(false);
            root.classList.remove('bl-handoff', 'bl-handoff-out');
            return;
        }
        if (page && page.children.length && !loading) {
            handoffDone = true;
            flag(false);
            if (!reduceMotion) { page.classList.add('bl-enter'); }
            requestAnimationFrame(function () {
                root.classList.add('bl-handoff-out');
                setTimeout(function () { root.classList.remove('bl-handoff', 'bl-handoff-out'); }, 800);
            });
        }
    }
    // never leave the curtain up: whatever happens, it goes after 5s
    if (document.documentElement.classList.contains('bl-handoff')) {
        setTimeout(function () {
            if (!handoffDone) {
                handoffDone = true;
                flag(false);
                document.documentElement.classList.add('bl-handoff-out');
                setTimeout(function () { document.documentElement.classList.remove('bl-handoff', 'bl-handoff-out'); }, 800);
            }
        }, 5000);
    }

    function scan() {
        arrive();
        var pages = document.querySelectorAll('.mx-page.bahri-login-new');
        if (!pages.length) { return; }
        for (var p = 0; p < pages.length; p++) { bindSubmit(pages[p]); }
        var panels = document.querySelectorAll('.bahri-login-new .bl-panel');
        for (var a = 0; a < panels.length; a++) { bindTilt(panels[a]); }
        var cards = document.querySelectorAll('.bahri-login-new .bl-announce');
        for (var b = 0; b < cards.length; b++) { bindAnnounce(cards[b]); }
    }

    // Mendix renders pages after this script runs (and re-renders the sign-in
    // page after a logout), so watch for the elements rather than assuming them.
    var queued = false;
    var observer = new MutationObserver(function () {
        if (queued) { return; }
        queued = true;
        requestAnimationFrame(function () { queued = false; scan(); });
    });

    function start() {
        scan();
        observer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['class'] });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', start);
    } else {
        start();
    }
})();
