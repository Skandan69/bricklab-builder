/**
 * A way out of every game.
 *
 * Frontier only linked home from its title screen, Open World never did, and
 * Infinite Plots only from a menu overlay — so once a player was actually in
 * a world there was no route back to the rest of the site. Every game loads
 * this the same way it loads feedback.js:
 *
 *   <script src="/game-nav.js" defer></script>
 *
 * Two of the three games already have a fixed top bar with a brand in it, so
 * the control goes in there rather than floating a second pill over the top of
 * it. Frontier has no such bar in play, so it gets one of its own and the
 * debug readout is nudged down to make room.
 *
 * While the pointer is locked a link cannot be clicked — the browser is
 * sending every event to the game — so the control dims and says what to press
 * instead of looking broken.
 */
(function () {
  if (window.__bricklabNav) return;
  window.__bricklabNav = true;

  var HOME = '/';

  var style = document.createElement('style');
  style.textContent = [
    '.bl-exit{display:inline-flex;align-items:center;gap:7px;padding:8px 13px;border-radius:10px;',
    'border:1px solid rgba(255,255,255,.22);background:rgba(12,16,22,.82);color:#eaf2fb;',
    'font:600 12.5px/1 system-ui,-apple-system,"Segoe UI",sans-serif;text-decoration:none;',
    'cursor:pointer;pointer-events:auto;backdrop-filter:blur(8px);white-space:nowrap;',
    'box-shadow:0 6px 18px rgba(0,0,0,.35);transition:background .18s ease,border-color .18s ease,color .18s ease}',
    '.bl-exit:hover{background:rgba(22,30,42,.94);border-color:#7cc4ff;color:#7cc4ff}',
    '.bl-exit:focus-visible{outline:2px solid #7cc4ff;outline-offset:3px}',
    '.bl-exit b{font-size:14px;line-height:1}',
    '.bl-exit.locked{opacity:.55;cursor:default}',
    '.bl-exit.locked:hover{background:rgba(12,16,22,.82);border-color:rgba(255,255,255,.22);color:#eaf2fb}',
    '.bl-exit-float{position:fixed;left:14px;top:12px;z-index:2147482000}',
    /* Frontier's debug readout owns the top-left corner in play, so move it. */
    'body.bl-has-exit #stats{top:56px}',
  ].join('');

  function build() {
    var a = document.createElement('a');
    a.className = 'bl-exit';
    a.href = HOME;
    a.innerHTML = '<b>&#8592;</b><span>BrickLab</span>';
    a.setAttribute('aria-label', 'Leave the game and go back to BrickLab');

    /* Pointer lock swallows clicks, so say what to do rather than sit there
       looking like a button that does not work. */
    function syncLock() {
      var locked = !!document.pointerLockElement;
      a.classList.toggle('locked', locked);
      a.title = locked ? 'Press Esc first, then click to leave' : 'Back to BrickLab';
    }
    document.addEventListener('pointerlockchange', syncLock);
    syncLock();

    a.addEventListener('click', function (event) {
      if (document.pointerLockElement) {
        /* Release the pointer and let them click again, rather than navigating
           out from under a locked cursor they did not mean to give up. */
        event.preventDefault();
        if (document.exitPointerLock) document.exitPointerLock();
      }
    });
    return a;
  }

  function mount() {
    document.head.appendChild(style);
    var exit = build();
    var bar = document.querySelector('.topbar');
    if (bar) {
      bar.insertBefore(exit, bar.firstChild);   // Open World and Infinite Plots
      return;
    }

    exit.classList.add('bl-exit-float');        // Frontier
    document.body.classList.add('bl-has-exit');
    document.body.appendChild(exit);

    /* Frontier's title screen already has a brand that links home, and the
       floating pill lands right on top of it. Stand down whenever some other
       route home is actually on screen, and come back when it is not — which
       is exactly the moment the player is in the world with no way out. */
    function otherWayHome() {
      var links = document.querySelectorAll('a[href="/"], a[href="./"]');
      for (var i = 0; i < links.length; i++) {
        if (links[i] === exit) continue;
        var r = links[i].getBoundingClientRect();
        if (r.width > 0 && r.height > 0 && r.bottom > 0 && r.top < window.innerHeight) return true;
      }
      return false;
    }
    function sync() {
      var hide = otherWayHome();
      exit.style.display = hide ? 'none' : '';
      document.body.classList.toggle('bl-has-exit', !hide);
    }
    sync();
    setInterval(sync, 700);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount);
  else mount();
})();
