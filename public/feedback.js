/**
 * BrickLab player feedback — one widget, loaded by every game.
 *
 * Each game only needs:  <script src="/feedback.js" defer></script>
 *
 * The game it belongs to is inferred from the path, so nothing has to be
 * configured. A game that wants to say where the player had got to can set:
 *
 *   window.BRICKLAB_FEEDBACK = { context: () => ({ tier: 'Village', level: 4 }) };
 *
 * The context is read at send time, not at load time, so the script can be
 * dropped in before the game has finished starting.
 */
(function () {
  if (window.__bricklabFeedback) return;
  window.__bricklabFeedback = true;

  var GAMES = {
    '/frontier.html': 'frontier',
    '/worldforge.html': 'worldforge',
    '/infinite-plots.html': 'plots',
  };

  function gameId() {
    var configured = (window.BRICKLAB_FEEDBACK || {}).game;
    if (configured) return configured;
    return GAMES[location.pathname] || 'cities';
  }

  function gameContext() {
    var read = (window.BRICKLAB_FEEDBACK || {}).context;
    var context = { path: location.pathname, played: Math.round((Date.now() - started) / 1000) };
    if (typeof read !== 'function') return context;
    try {
      var extra = read();
      if (extra && typeof extra === 'object') {
        for (var k in extra) if (Object.prototype.hasOwnProperty.call(extra, k)) context[k] = extra[k];
      }
    } catch (e) { context.contextError = String(e && e.message || e); }
    return context;
  }

  var started = Date.now();
  var rating = 0;

  var style = document.createElement('style');
  style.textContent = [
    '.bl-fb-open{position:fixed;right:14px;bottom:14px;z-index:2147483000;padding:9px 13px;border-radius:999px;',
    'border:1px solid rgba(255,255,255,.28);background:rgba(14,22,34,.86);color:#fff;font:600 12px/1 system-ui,sans-serif;',
    'cursor:pointer;box-shadow:0 6px 20px rgba(0,0,0,.32);backdrop-filter:blur(6px)}',
    '.bl-fb-open:hover{border-color:#7cc4ff;color:#7cc4ff}',
    '.bl-fb-panel{position:fixed;right:14px;bottom:14px;z-index:2147483001;width:min(92vw,330px);padding:15px;',
    'border-radius:14px;border:1px solid rgba(255,255,255,.16);background:#101a28;color:#eaf2fb;',
    'font:13px/1.45 system-ui,sans-serif;box-shadow:0 18px 46px rgba(0,0,0,.45)}',
    '.bl-fb-panel h3{margin:0 0 3px;font-size:14px}',
    '.bl-fb-panel p{margin:0 0 11px;font-size:11.5px;color:#93a8bd}',
    '.bl-fb-stars{display:flex;gap:5px;margin-bottom:10px}',
    '.bl-fb-stars button{flex:1;padding:7px 0;border-radius:8px;border:1px solid rgba(255,255,255,.16);',
    'background:rgba(255,255,255,.05);color:#eaf2fb;font:600 13px system-ui,sans-serif;cursor:pointer}',
    '.bl-fb-stars button.on{background:#ffd166;border-color:#ffd166;color:#12202f}',
    '.bl-fb-panel textarea{width:100%;min-height:78px;resize:vertical;padding:9px;border-radius:9px;',
    'border:1px solid rgba(255,255,255,.16);background:rgba(255,255,255,.05);color:#eaf2fb;',
    'font:13px/1.45 system-ui,sans-serif}',
    '.bl-fb-row{display:flex;gap:7px;margin-top:10px}',
    '.bl-fb-row button{flex:1;padding:8px;border-radius:9px;border:1px solid rgba(255,255,255,.16);',
    'background:rgba(255,255,255,.05);color:#eaf2fb;font:600 12.5px system-ui,sans-serif;cursor:pointer}',
    '.bl-fb-row button.primary{background:#2f7fe8;border-color:#2f7fe8;color:#fff}',
    '.bl-fb-row button:disabled{opacity:.5;cursor:default}',
    '.bl-fb-note{margin-top:9px;font-size:11.5px;color:#93a8bd;min-height:15px}',
  ].join('');

  var button = document.createElement('button');
  button.className = 'bl-fb-open';
  button.type = 'button';
  button.textContent = 'Feedback';

  var panel = document.createElement('div');
  panel.className = 'bl-fb-panel';
  panel.style.display = 'none';
  panel.innerHTML = [
    '<h3>How is it playing?</h3>',
    '<p>Anything at all — confusing, boring, broken, good.</p>',
    '<div class="bl-fb-stars" role="group" aria-label="Rating">',
    '<button type="button" data-star="1">1</button><button type="button" data-star="2">2</button>',
    '<button type="button" data-star="3">3</button><button type="button" data-star="4">4</button>',
    '<button type="button" data-star="5">5</button></div>',
    '<textarea placeholder="What happened?" maxlength="1200" aria-label="Your feedback"></textarea>',
    '<div class="bl-fb-row"><button type="button" class="primary" data-send>Send</button>',
    '<button type="button" data-close>Close</button></div>',
    '<div class="bl-fb-note" role="status"></div>',
  ].join('');

  function mount() {
    document.head.appendChild(style);
    document.body.appendChild(button);
    document.body.appendChild(panel);
  }

  var textarea = panel.querySelector('textarea');
  var note = panel.querySelector('.bl-fb-note');
  var send = panel.querySelector('[data-send]');

  /* The games listen for keys on document. While this panel has focus those
     keystrokes are text, not movement, so they stop here. */
  ['keydown', 'keyup', 'keypress'].forEach(function (type) {
    panel.addEventListener(type, function (event) { event.stopPropagation(); });
  });

  panel.querySelectorAll('[data-star]').forEach(function (star) {
    star.addEventListener('click', function () {
      rating = Number(star.dataset.star);
      panel.querySelectorAll('[data-star]').forEach(function (other) {
        other.classList.toggle('on', Number(other.dataset.star) <= rating);
      });
    });
  });

  function open() {
    panel.style.display = '';
    button.style.display = 'none';
    if (document.exitPointerLock) document.exitPointerLock();
    setTimeout(function () { textarea.focus(); }, 0);
  }
  function close() {
    panel.style.display = 'none';
    button.style.display = '';
    note.textContent = '';
  }

  button.addEventListener('click', open);
  panel.querySelector('[data-close]').addEventListener('click', close);

  send.addEventListener('click', function () {
    var message = textarea.value.trim();
    if (!message && !rating) { note.textContent = 'Add a rating or a note first.'; return; }
    send.disabled = true;
    note.textContent = 'Sending…';
    fetch('/api/feedback', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ game: gameId(), rating: rating || null, message: message, context: gameContext() }),
    })
      .then(function (response) {
        if (!response.ok) return response.json().then(function (d) { throw new Error(d.error || 'Could not send'); });
        note.textContent = 'Thank you — that helps.';
        textarea.value = '';
        rating = 0;
        panel.querySelectorAll('[data-star]').forEach(function (s) { s.classList.remove('on'); });
        setTimeout(close, 1400);
      })
      .catch(function (error) { note.textContent = error.message || 'Could not send'; })
      .then(function () { send.disabled = false; });
  });

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount);
  else mount();
})();
