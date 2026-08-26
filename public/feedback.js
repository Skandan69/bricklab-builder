/**
 * BrickLab player feedback — one guided conversation, loaded by every game.
 *
 * Each game only needs:  <script src="/feedback.js" defer></script>
 *
 * A blank box gets "it's good". Four specific questions, asked one at a time,
 * get answers you can act on — so this walks the player through them and sends
 * the whole thing as one note.
 *
 * The game it belongs to is inferred from the path, so nothing has to be
 * configured. A game that wants to say where the player had got to can set:
 *
 *   window.BRICKLAB_FEEDBACK = { context: () => ({ tier: 'Village', level: 4 }) };
 *
 * The context is read when the note is sent, not when the script loads, so it
 * can be dropped in before the game has finished starting.
 */
(function () {
  if (window.__bricklabFeedback) return;
  window.__bricklabFeedback = true;

  var GAMES = {
    '/frontier.html': 'frontier',
    '/worldforge.html': 'worldforge',
    '/infinite-plots.html': 'plots',
  };

  var started = Date.now();
  var step = 0;
  var answers = {};

  /* Each step is one question. `chips` are one-tap answers, `text` adds a box.
     Nothing is required — a player who only rates it still tells us something. */
  var STEPS = [
    {
      key: 'rating',
      title: 'How was it?',
      hint: '1 is bad, 5 is good.',
      scale: true,
    },
    {
      key: 'stopped',
      title: 'What made you stop playing?',
      hint: 'The honest answer is the useful one.',
      chips: ['Finished what I wanted', 'Got stuck', 'Got bored', 'Something broke', 'Just looking around'],
      text: 'Anything more? (optional)',
      textKey: 'stoppedNote',
    },
    {
      key: 'confusing',
      title: 'What was confusing or annoying?',
      hint: 'Even something small.',
      text: 'Type here, or skip',
      textOnly: true,
    },
    {
      key: 'again',
      title: 'Would you play again tomorrow?',
      hint: 'Last one.',
      chips: ['Yes', 'Maybe', 'No'],
    },
  ];

  function gameId() {
    var configured = (window.BRICKLAB_FEEDBACK || {}).game;
    if (configured) return configured;
    return GAMES[location.pathname] || 'cities';
  }

  function gameContext() {
    var read = (window.BRICKLAB_FEEDBACK || {}).context;
    var context = { path: location.pathname, played: Math.round((Date.now() - started) / 1000), answers: answers };
    if (typeof read !== 'function') return context;
    try {
      var extra = read();
      if (extra && typeof extra === 'object') {
        for (var k in extra) if (Object.prototype.hasOwnProperty.call(extra, k)) context[k] = extra[k];
      }
    } catch (e) { context.contextError = String((e && e.message) || e); }
    return context;
  }

  /** The answers as something a human can read in one glance. */
  function transcript() {
    var lines = [];
    STEPS.forEach(function (s) {
      var value = answers[s.key];
      var note = s.textKey ? answers[s.textKey] : null;
      if (value === undefined && !note) return;
      var said = value === undefined ? '' : String(value);
      if (note) said = said ? said + ' — ' + note : note;
      if (said) lines.push(s.title + ' ' + said);
    });
    return lines.join('\n');
  }

  var style = document.createElement('style');
  style.textContent = [
    '.bl-fb-open{position:fixed;right:14px;bottom:14px;z-index:2147483000;padding:9px 13px;border-radius:999px;',
    'border:1px solid rgba(255,255,255,.28);background:rgba(14,22,34,.86);color:#fff;font:600 12px/1 system-ui,sans-serif;',
    'cursor:pointer;box-shadow:0 6px 20px rgba(0,0,0,.32)}',
    '.bl-fb-open:hover{border-color:#7cc4ff;color:#7cc4ff}',
    '.bl-fb-panel{position:fixed;right:14px;bottom:14px;z-index:2147483001;width:min(92vw,340px);padding:16px;',
    'border-radius:14px;border:1px solid rgba(255,255,255,.16);background:#101a28;color:#eaf2fb;',
    'font:13px/1.45 system-ui,sans-serif;box-shadow:0 18px 46px rgba(0,0,0,.45)}',
    '.bl-fb-step{font-size:10.5px;letter-spacing:.9px;text-transform:uppercase;color:#7f95ab;margin-bottom:6px}',
    '.bl-fb-panel h3{margin:0 0 3px;font-size:15px;line-height:1.25}',
    '.bl-fb-panel p.hint{margin:0 0 12px;font-size:11.5px;color:#93a8bd}',
    '.bl-fb-scale{display:flex;gap:5px;margin-bottom:4px}',
    '.bl-fb-scale button{flex:1;padding:9px 0;border-radius:8px;border:1px solid rgba(255,255,255,.16);',
    'background:rgba(255,255,255,.05);color:#eaf2fb;font:600 13px system-ui,sans-serif;cursor:pointer}',
    '.bl-fb-scale button.on{background:#ffd166;border-color:#ffd166;color:#12202f}',
    '.bl-fb-chips{display:flex;flex-wrap:wrap;gap:6px;margin-bottom:9px}',
    '.bl-fb-chips button{padding:7px 11px;border-radius:999px;border:1px solid rgba(255,255,255,.16);',
    'background:rgba(255,255,255,.05);color:#eaf2fb;font:12.5px system-ui,sans-serif;cursor:pointer}',
    '.bl-fb-chips button.on{background:#2f7fe8;border-color:#2f7fe8;color:#fff}',
    '.bl-fb-panel textarea{width:100%;min-height:66px;resize:vertical;padding:9px;border-radius:9px;',
    'border:1px solid rgba(255,255,255,.16);background:rgba(255,255,255,.05);color:#eaf2fb;',
    'font:13px/1.45 system-ui,sans-serif}',
    '.bl-fb-row{display:flex;gap:7px;margin-top:12px}',
    '.bl-fb-row button{padding:8px 12px;border-radius:9px;border:1px solid rgba(255,255,255,.16);',
    'background:rgba(255,255,255,.05);color:#eaf2fb;font:600 12.5px system-ui,sans-serif;cursor:pointer}',
    '.bl-fb-row button.primary{flex:1;background:#2f7fe8;border-color:#2f7fe8;color:#fff}',
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

  /* The games listen for keys on document. While this panel is open those
     keystrokes are text, not movement, so they stop here. */
  ['keydown', 'keyup', 'keypress'].forEach(function (type) {
    panel.addEventListener(type, function (event) { event.stopPropagation(); });
  });

  function escapeHtml(value) {
    return String(value).replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
    });
  }

  function render() {
    if (step >= STEPS.length) return sending();
    var s = STEPS[step];
    var last = step === STEPS.length - 1;
    var parts = [
      '<div class="bl-fb-step">Question ' + (step + 1) + ' of ' + STEPS.length + '</div>',
      '<h3>' + escapeHtml(s.title) + '</h3>',
      '<p class="hint">' + escapeHtml(s.hint) + '</p>',
    ];
    if (s.scale) {
      parts.push('<div class="bl-fb-scale">');
      for (var i = 1; i <= 5; i++) {
        parts.push('<button type="button" data-value="' + i + '"' +
          (answers[s.key] === i ? ' class="on"' : '') + '>' + i + '</button>');
      }
      parts.push('</div>');
    }
    if (s.chips) {
      parts.push('<div class="bl-fb-chips">');
      s.chips.forEach(function (chip) {
        parts.push('<button type="button" data-value="' + escapeHtml(chip) + '"' +
          (answers[s.key] === chip ? ' class="on"' : '') + '>' + escapeHtml(chip) + '</button>');
      });
      parts.push('</div>');
    }
    if (s.text) {
      var key = s.textOnly ? s.key : s.textKey;
      parts.push('<textarea maxlength="600" placeholder="' + escapeHtml(s.text) + '" aria-label="' +
        escapeHtml(s.title) + '">' + escapeHtml(answers[key] || '') + '</textarea>');
    }
    parts.push('<div class="bl-fb-row">');
    if (step > 0) parts.push('<button type="button" data-back>Back</button>');
    parts.push('<button type="button" class="primary" data-next>' + (last ? 'Send' : 'Next') + '</button>');
    parts.push('<button type="button" data-close>Close</button>');
    parts.push('</div><div class="bl-fb-note" role="status"></div>');
    panel.innerHTML = parts.join('');

    var textarea = panel.querySelector('textarea');
    panel.querySelectorAll('[data-value]').forEach(function (choice) {
      choice.addEventListener('click', function () {
        var raw = choice.dataset.value;
        answers[s.key] = s.scale ? Number(raw) : raw;
        render();
        if (!s.text) next();                       // a one-tap answer moves straight on
      });
    });
    if (textarea) setTimeout(function () { textarea.focus(); }, 0);
    var back = panel.querySelector('[data-back]');
    if (back) back.addEventListener('click', function () { capture(); step--; render(); });
    panel.querySelector('[data-next]').addEventListener('click', function () { capture(); next(); });
    panel.querySelector('[data-close]').addEventListener('click', close);
  }

  function capture() {
    var s = STEPS[step];
    if (!s || !s.text) return;
    var textarea = panel.querySelector('textarea');
    if (!textarea) return;
    var key = s.textOnly ? s.key : s.textKey;
    var value = textarea.value.trim();
    if (value) answers[key] = value; else delete answers[key];
  }

  function next() {
    capture();
    step++;
    render();
  }

  function sending() {
    var message = transcript();
    var rating = typeof answers.rating === 'number' ? answers.rating : null;
    if (!message && rating === null) { step = 0; render(); return; }
    panel.innerHTML = '<div class="bl-fb-step">Sending</div><h3>Thank you.</h3>' +
      '<p class="hint">One moment…</p><div class="bl-fb-note" role="status"></div>';
    var note = panel.querySelector('.bl-fb-note');
    fetch('/api/feedback', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ game: gameId(), rating: rating, message: message, context: gameContext() }),
    })
      .then(function (response) {
        if (!response.ok) return response.json().then(function (d) { throw new Error(d.error || 'Could not send'); });
        panel.innerHTML = '<div class="bl-fb-step">Sent</div><h3>Thank you — that really helps.</h3>' +
          '<p class="hint">Back to the game.</p>';
        setTimeout(function () { reset(); close(); }, 1600);
      })
      .catch(function (error) {
        note.textContent = error.message || 'Could not send';
        var again = document.createElement('div');
        again.className = 'bl-fb-row';
        again.innerHTML = '<button type="button" class="primary" data-retry>Try again</button>' +
          '<button type="button" data-close>Close</button>';
        panel.appendChild(again);
        again.querySelector('[data-retry]').addEventListener('click', sending);
        again.querySelector('[data-close]').addEventListener('click', close);
      });
  }

  function reset() { step = 0; answers = {}; }

  function open() {
    panel.style.display = '';
    button.style.display = 'none';
    if (document.exitPointerLock) document.exitPointerLock();
    render();
  }
  function close() {
    panel.style.display = 'none';
    button.style.display = '';
  }

  button.addEventListener('click', open);

  function mount() {
    document.head.appendChild(style);
    document.body.appendChild(button);
    document.body.appendChild(panel);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount);
  else mount();
})();
