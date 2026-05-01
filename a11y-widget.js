(function () {
  const css = `
    #a11y-btn {
      position: fixed; bottom: 24px; left: 24px; z-index: 9999;
      width: 52px; height: 52px; border-radius: 50%;
      background: #0057B8; border: none; cursor: pointer;
      box-shadow: 0 4px 16px rgba(0,0,0,0.35);
      display: flex; align-items: center; justify-content: center;
      transition: background 0.2s, transform 0.2s;
    }
    #a11y-btn:hover { background: #0046A0; transform: scale(1.08); }
    #a11y-btn svg { width: 28px; height: 28px; fill: #fff; }

    #a11y-panel {
      position: fixed; bottom: 88px; left: 24px; z-index: 9998;
      width: 260px; background: #fff;
      border-radius: 14px; box-shadow: 0 8px 40px rgba(0,0,0,0.22);
      padding: 18px 16px 14px; direction: rtl;
      display: none; flex-direction: column; gap: 0;
      font-family: 'Heebo', sans-serif;
    }
    #a11y-panel.open { display: flex; }

    #a11y-panel-header {
      display: flex; align-items: center; gap: 8px;
      font-size: 14px; font-weight: 800; color: #1A1A1A;
      padding-bottom: 12px; margin-bottom: 10px;
      border-bottom: 1px solid #E8E8E8;
    }
    #a11y-panel-header svg { fill: #0057B8; flex-shrink: 0; }

    /* שורת גודל טקסט */
    .a11y-size-row {
      display: flex; align-items: center; justify-content: space-between;
      padding: 8px 0; border-bottom: 1px solid #F0F0F0;
    }
    .a11y-size-label { font-size: 14px; color: #333; font-weight: 500; }
    .a11y-size-btns { display: flex; gap: 6px; }
    .a11y-size-btn {
      width: 30px; height: 30px; border-radius: 6px;
      border: 2px solid #D0D0D0; background: #F4F4F4;
      cursor: pointer; display: flex; align-items: center; justify-content: center;
      color: #444; font-weight: 800; font-family: 'Heebo', sans-serif;
      transition: all 0.15s;
    }
    .a11y-size-btn:nth-child(1) { font-size: 10px; }
    .a11y-size-btn:nth-child(2) { font-size: 13px; }
    .a11y-size-btn:nth-child(3) { font-size: 16px; }
    .a11y-size-btn.active { border-color: #0057B8; background: #E8F0FC; color: #0057B8; }
    .a11y-size-btn:hover { border-color: #0057B8; }

    /* שורות toggle */
    .a11y-toggle-row {
      display: flex; align-items: center; justify-content: space-between;
      padding: 9px 0; border-bottom: 1px solid #F0F0F0;
    }
    .a11y-toggle-label { font-size: 14px; color: #333; font-weight: 500; }
    .a11y-toggle-btn {
      min-width: 52px; height: 26px; border-radius: 6px;
      border: 1px solid #ccc; background: #F4F4F4;
      cursor: pointer; font-size: 12px; font-weight: 700;
      font-family: 'Heebo', sans-serif; color: #888;
      transition: all 0.15s; padding: 0 8px;
    }
    .a11y-toggle-btn.active { background: #0057B8; border-color: #0057B8; color: #fff; }

    #a11y-reset {
      width: 100%; padding: 9px; border-radius: 8px;
      background: #1A1A1A; color: #fff; border: none; cursor: pointer;
      font-size: 13px; font-weight: 700; font-family: 'Heebo', sans-serif;
      margin-top: 12px; transition: background 0.15s;
    }
    #a11y-reset:hover { background: #333; }

    #a11y-acc-link {
      display: block; text-align: center; margin-top: 10px;
      font-size: 12px; color: #0057B8; text-decoration: underline;
      cursor: pointer;
    }

    /* ── Effects ── */
    html.a11y-text-sm body  { zoom: 1.0; }
    html.a11y-text-md body  { zoom: 1.2; }
    html.a11y-text-lg body  { zoom: 1.4; }
    html.a11y-high-contrast { filter: contrast(2); }
    html.a11y-grayscale     { filter: grayscale(1); }
    html.a11y-highlight-links a { outline: 3px solid #FFD700 !important; background: #FFF9C4 !important; }
    html.a11y-readable * { font-family: Arial, sans-serif !important; letter-spacing: 0.05em !important; line-height: 1.8 !important; }
    html.a11y-no-anim *, html.a11y-no-anim *::before, html.a11y-no-anim *::after {
      animation: none !important; transition: none !important;
    }
  `;

  const style = document.createElement('style');
  style.textContent = css;
  document.head.appendChild(style);

  /* ── Panel HTML ── */
  const panel = document.createElement('div');
  panel.id = 'a11y-panel';
  panel.innerHTML = `
    <div id="a11y-panel-header">
      <svg width="18" height="18" viewBox="0 0 24 24"><circle cx="12" cy="4" r="2"/><path d="M19 8h-6l-1 5 3 2v5h-2v-4l-3-2-1 6H7l1.5-8L6 8H4V6h16v2z"/></svg>
      הגדרות נגישות
    </div>

    <div class="a11y-size-row">
      <span class="a11y-size-label">גודל טקסט</span>
      <div class="a11y-size-btns">
        <button class="a11y-size-btn" data-size="sm">A</button>
        <button class="a11y-size-btn" data-size="md">A</button>
        <button class="a11y-size-btn" data-size="lg">A</button>
      </div>
    </div>

    <div class="a11y-toggle-row">
      <span class="a11y-toggle-label">ניגודיות גבוהה</span>
      <button class="a11y-toggle-btn" data-action="high-contrast">כבוי</button>
    </div>
    <div class="a11y-toggle-row">
      <span class="a11y-toggle-label">גווני אפור</span>
      <button class="a11y-toggle-btn" data-action="grayscale">כבוי</button>
    </div>
    <div class="a11y-toggle-row">
      <span class="a11y-toggle-label">הדגשת קישורים</span>
      <button class="a11y-toggle-btn" data-action="highlight-links">כבוי</button>
    </div>
    <div class="a11y-toggle-row">
      <span class="a11y-toggle-label">פונט קריא (דיסלקציה)</span>
      <button class="a11y-toggle-btn" data-action="readable">כבוי</button>
    </div>
    <div class="a11y-toggle-row">
      <span class="a11y-toggle-label">עצור אנימציות</span>
      <button class="a11y-toggle-btn" data-action="no-anim">כבוי</button>
    </div>

    <button id="a11y-reset">↺ אפס הכל</button>
    <a id="a11y-acc-link" href="accessibility.html">הצהרת נגישות</a>
  `;

  const btn = document.createElement('button');
  btn.id = 'a11y-btn';
  btn.setAttribute('aria-label', 'פתח הגדרות נגישות');
  btn.innerHTML = `<svg viewBox="0 0 24 24"><circle cx="12" cy="4" r="2"/><path d="M19 8h-6l-1 5 3 2v5h-2v-4l-3-2-1 6H7l1.5-8L6 8H4V6h16v2z"/></svg>`;

  document.body.appendChild(panel);
  document.body.appendChild(btn);

  /* ── Logic ── */
  const root = document.documentElement;
  const toggleActions = ['high-contrast','grayscale','highlight-links','readable','no-anim'];
  const sizeClasses = ['a11y-text-sm','a11y-text-md','a11y-text-lg'];

  function setSize(size) {
    sizeClasses.forEach(c => root.classList.remove(c));
    panel.querySelectorAll('.a11y-size-btn').forEach(b => b.classList.remove('active'));
    if (size) {
      root.classList.add('a11y-text-' + size);
      const activeBtn = panel.querySelector(`[data-size="${size}"]`);
      if (activeBtn) activeBtn.classList.add('active');
    }
    saveState();
  }

  function toggleAction(action) {
    const cls = 'a11y-' + action;
    root.classList.toggle(cls);
    const tb = panel.querySelector(`[data-action="${action}"]`);
    if (tb) {
      const on = root.classList.contains(cls);
      tb.classList.toggle('active', on);
      tb.textContent = on ? 'פעיל' : 'כבוי';
    }
    saveState();
  }

  function saveState() {
    const state = { size: null, toggles: {} };
    sizeClasses.forEach(c => { if (root.classList.contains(c)) state.size = c.replace('a11y-text-',''); });
    toggleActions.forEach(a => { state.toggles[a] = root.classList.contains('a11y-' + a); });
    localStorage.setItem('a11y', JSON.stringify(state));
  }

  function loadState() {
    try {
      const s = JSON.parse(localStorage.getItem('a11y') || '{}');
      if (s.size) setSize(s.size);
      if (s.toggles) Object.entries(s.toggles).forEach(([a, on]) => { if (on) toggleAction(a); });
    } catch(e) {}
  }

  function resetAll() {
    sizeClasses.forEach(c => root.classList.remove(c));
    toggleActions.forEach(a => {
      root.classList.remove('a11y-' + a);
      const tb = panel.querySelector(`[data-action="${a}"]`);
      if (tb) { tb.classList.remove('active'); tb.textContent = 'כבוי'; }
    });
    panel.querySelectorAll('.a11y-size-btn').forEach(b => b.classList.remove('active'));
    localStorage.removeItem('a11y');
  }

  /* Events */
  btn.addEventListener('click', () => {
    panel.classList.toggle('open');
  });

  panel.querySelectorAll('.a11y-size-btn').forEach(b => {
    b.addEventListener('click', () => {
      const already = b.classList.contains('active');
      setSize(already ? null : b.dataset.size);
    });
  });

  panel.querySelectorAll('.a11y-toggle-btn').forEach(b => {
    b.addEventListener('click', () => toggleAction(b.dataset.action));
  });

  document.getElementById('a11y-reset').addEventListener('click', resetAll);

  document.addEventListener('click', e => {
    if (!panel.contains(e.target) && !btn.contains(e.target)) {
      panel.classList.remove('open');
    }
  });

  loadState();
})();
