/*
 * gs-svc-clock.js — an analog face for the time picker on the employee
 * service request pages (Digital Card, Drivers, Catering, Absence).
 *
 * The picker is itvisors' React Date Time Picker, built on react-datetime,
 * which offers a number spinner and nothing else. This adds a clock above
 * that spinner and keeps its hands on whatever the spinner currently reads —
 * so the time can be seen at a glance while it is still set the usual way.
 * The face is a reading of the value, not a second control: it takes no
 * clicks, and nothing here touches the widget's own state.
 *
 * The dial and the hands are drawn in atom-service-gs.scss (.gs-clock*);
 * this file only writes two CSS variables, --gs-clock-h and --gs-clock-m.
 *
 * It also holds the one other thing the service pages need that CSS cannot
 * do: opening the Absence history as a dialog (see below).
 */
(function () {
    'use strict';

    function angles(panel) {
        var counters = panel.querySelectorAll('.rdtCounter');
        if (!counters.length) { return null; }
        var read = function (i) {
            var el = counters[i] && counters[i].querySelector('.rdtCount');
            return el ? parseInt(el.textContent, 10) : NaN;
        };
        var hours = read(0);
        if (isNaN(hours)) { return null; }
        var minutes = read(1);
        if (isNaN(minutes)) { minutes = 0; }

        // A 12-hour picker carries AM/PM in a counter of its own; a 24-hour one
        // does not, and its hours already run 0–23.
        var last = counters[counters.length - 1];
        var part = last && last.className.indexOf('rdtCounterDayPart') !== -1
            ? (last.textContent || '') : '';
        if (part) {
            if (/pm/i.test(part) && hours < 12) { hours += 12; }
            if (/am/i.test(part) && hours === 12) { hours = 0; }
        }

        return {
            hour: (hours % 12) * 30 + minutes * 0.5, // the hour hand creeps with the minutes
            minute: minutes * 6
        };
    }

    function sync(panel, face) {
        var a = angles(panel);
        if (!a) { return; }
        face.style.setProperty('--gs-clock-h', a.hour.toFixed(2) + 'deg');
        face.style.setProperty('--gs-clock-m', a.minute.toFixed(2) + 'deg');
    }

    // The stepped field rolls in from the side it came from — up when the value
    // went up, down when it went down. A wrap at the end of a field (59 to 00)
    // rolls the way it was actually stepped rather than the way it reads.
    function roll(panel) {
        var counts = panel.querySelectorAll('.rdtCounter .rdtCount');
        for (var i = 0; i < counts.length; i++) {
            var el = counts[i];
            var now = (el.textContent || '').trim();
            var was = el.dataset.gsWas;
            if (was === undefined) { el.dataset.gsWas = now; continue; }
            if (was === now) { continue; }
            el.dataset.gsWas = now;

            var a = parseInt(was, 10);
            var b = parseInt(now, 10);
            var up;
            if (isNaN(a) || isNaN(b)) {
                up = true;                        // AM / PM — no direction to read
            } else {
                var span = el === counts[0] ? 12 : 60;
                up = ((b - a + span) % span) <= span / 2;
            }

            el.classList.remove('gs-count-up', 'gs-count-down');
            void el.offsetWidth;                  // restart the animation mid-flight
            el.classList.add(up ? 'gs-count-up' : 'gs-count-down');
        }
    }

    function build(panel) {
        if (panel.dataset.gsClock) { return; }
        var counters = panel.querySelector('.rdtCounters');
        // Only the time picker gets a clock; a date picker has no counters.
        if (!counters || !panel.querySelector('.rdtTime')) { return; }
        panel.dataset.gsClock = '1';

        var face = document.createElement('div');
        face.className = 'gs-clock';
        face.setAttribute('aria-hidden', 'true'); // the counters are the accessible control
        face.innerHTML =
            '<div class="gs-clock-face">' +
            '<i class="gs-clock-hand gs-clock-hour"></i>' +
            '<i class="gs-clock-hand gs-clock-minute"></i>' +
            '<i class="gs-clock-pin"></i>' +
            '</div>';
        counters.parentNode.insertBefore(face, counters);

        sync(panel, face);
        roll(panel);
        new MutationObserver(function () { sync(panel, face); roll(panel); })
            .observe(counters, { childList: true, subtree: true, characterData: true });
    }

    // ------------------------------------------------ absence history dialog
    // The history is reference material, not something needed while the form is
    // being filled, and stacked under the balance it pushed itself off screen.
    // It is asked for instead: an icon on the balance card opens it as a dialog
    // over the blurred page. The widget itself is never rebuilt — it is moved
    // into the dialog and put back where it was on close — so the list keeps
    // its data and its handlers.
    var histTrigger = null;
    var histAnchorNode = null;
    var histBackdrop = null;

    // Leaving plays before anything is taken away, so the card settles back
    // rather than blinking out; if the browser has animations turned off the
    // end handler never fires, hence the timer alongside it.
    function closeHistory() {
        if (!histBackdrop || histBackdrop.dataset.closing) { return; }
        histBackdrop.dataset.closing = '1';
        var leaving = histBackdrop;
        leaving.classList.add('is-closing');
        var done = false;
        var finish = function () {
            if (done) { return; }
            done = true;
            removeHistory(leaving);
        };
        leaving.addEventListener('animationend', finish);
        setTimeout(finish, 320);
        document.documentElement.classList.remove('gs-hist-open');
        if (histTrigger) { histTrigger.focus(); }
    }

    // The card goes back exactly where it came from, marked by the comment node
    // left in its place, and only then is the dialog taken away.
    function removeHistory(node) {
        var card = node.querySelector('.absence-2-c');
        if (card && histAnchorNode && histAnchorNode.parentNode) {
            histAnchorNode.parentNode.insertBefore(card, histAnchorNode);
        }
        if (histAnchorNode && histAnchorNode.parentNode) { histAnchorNode.parentNode.removeChild(histAnchorNode); }
        histAnchorNode = null;
        node.remove();
        if (histBackdrop === node) { histBackdrop = null; }
    }

    function openHistory(card, trigger) {
        if (histBackdrop) { return; }
        histTrigger = trigger;

        histBackdrop = document.createElement('div');
        histBackdrop.className = 'gs-hist-backdrop';
        histBackdrop.addEventListener('mousedown', function (e) {
            if (e.target === histBackdrop) { closeHistory(); }
        });

        var close = document.createElement('button');
        close.type = 'button';
        close.className = 'gs-hist-close';
        close.setAttribute('aria-label', 'Close absence history');
        close.addEventListener('click', closeHistory);

        // a comment marks the spot the card came from
        histAnchorNode = document.createComment('gs-absence-history');
        card.parentNode.insertBefore(histAnchorNode, card);

        histBackdrop.appendChild(card);
        card.appendChild(close);
        card.setAttribute('role', 'dialog');
        card.setAttribute('aria-modal', 'true');
        document.body.appendChild(histBackdrop);
        document.documentElement.classList.add('gs-hist-open');
        close.focus();
    }

    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && histBackdrop) { closeHistory(); }
    });

    function bindHistory() {
        var page = document.querySelector('.gs-service-page.gs-svc-calendar');
        if (!page) { return; }
        var balance = page.querySelector('.absence-1-c');
        var card = page.querySelector('.absence-2-c');
        if (!balance || !card || balance.dataset.gsHistBtn) { return; }
        // while the dialog is open the card lives elsewhere; leave it be
        if (histBackdrop) { return; }
        balance.dataset.gsHistBtn = '1';

        var host = balance.querySelector('.mx-dataview-content') || balance;
        var btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'gs-hist-btn';
        btn.title = 'Absence history';
        btn.setAttribute('aria-label', 'Absence history');
        btn.addEventListener('click', function () {
            var live = document.querySelector('.gs-service-page .absence-2-c');
            if (live) { openHistory(live, btn); }
        });
        host.appendChild(btn);
    }

    function scan() {
        var panels = document.querySelectorAll('.gs-service-page .rdtPicker');
        for (var i = 0; i < panels.length; i++) { build(panels[i]); }
        bindHistory();
    }

    // The panel is mounted only while the picker is open, so it is watched for
    // rather than looked up once.
    var queued = false;
    var observer = new MutationObserver(function () {
        if (queued) { return; }
        queued = true;
        requestAnimationFrame(function () { queued = false; scan(); });
    });

    function start() {
        scan();
        observer.observe(document.body, { childList: true, subtree: true });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', start);
    } else {
        start();
    }
})();
