// LEDLink Profile Configurator v9.4
// Vanilla-JS wizard: template selection → canvas drawing → design options → BOM
// Interface: initConfigurator(rootEl, onCloseFn, opts) → cleanup function
//   opts.profiles  — [{ id, name }] דגמי הפרופילים לבחירה בשלב 3
//   opts.profileId — דגם שנבחר מראש (כפתור "תכנן עם הפרופיל הזה")
//   opts.shared    — תכנון מפוענח מקישור (decodeDesign) → נפתח ישר בסיכום

var SHAPE_NAMES   = { I: 'קו ישר', L: "צורת ר'", U: "צורת ח'", FREE: 'שרטוט חופשי' };
var COLOR_NAMES   = { BLK: 'שחור מט', WHT: 'לבן מט' };
var LIGHTING_CODE = { 'מרכזית': 'c', 'אווירה': 'm' };
var INSTALL_CODE  = { 'שקוע': 'r', 'צמוד/תלוי': 's' };

function invert(o) { var r = {}; Object.keys(o).forEach(function(k) { r[o[k]] = k; }); return r; }

// התכנון נארז לפרמטר ?cfg= בכתובת, כדי שהשרטוט יגיע בקישור בתוך הודעת הוואטסאפ
// (קישור wa.me לא יכול לשאת קובץ). הכול ASCII — מחרוזות עבריות מקודדות לאות אחת.
export function encodeDesign(state) {
  var xs = state.vertices.map(function(v) { return v.x; });
  var ys = state.vertices.map(function(v) { return v.y; });
  var minX = Math.min.apply(null, xs), minY = Math.min.apply(null, ys);
  var data = {
    v: 1, m: state.mode,
    p: state.vertices.map(function(v) { return [Math.round(v.x - minX), Math.round(v.y - minY)]; }),
    s: state.inputs.slice(0, state.vertices.length - 1).map(Number),
    f: state.feedIndex, c: state.color, k: state.cct,
    l: LIGHTING_CODE[state.lightingType], i: INSTALL_CODE[state.installType],
  };
  if (state.profileId) data.pr = state.profileId;
  return btoa(JSON.stringify(data)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

// מחזיר null על כל קלט שאינו תכנון תקין — הקישור מגיע מבחוץ.
export function decodeDesign(code) {
  try {
    var b64 = String(code).replace(/-/g, '+').replace(/_/g, '/');
    var d = JSON.parse(atob(b64 + '==='.slice((b64.length + 3) % 4)));
    var isNum = function(n, min, max) { return typeof n === 'number' && isFinite(n) && n >= min && n <= max; };
    if (!d || d.v !== 1 || !SHAPE_NAMES[d.m]) return null;
    if (!Array.isArray(d.p) || d.p.length < 2 || d.p.length > 40) return null;
    if (!d.p.every(function(pt) { return Array.isArray(pt) && isNum(pt[0], 0, 1e4) && isNum(pt[1], 0, 1e4); })) return null;
    if (!Array.isArray(d.s) || d.s.length !== d.p.length - 1 || !d.s.every(function(n) { return isNum(n, 0.1, 1e5); })) return null;
    if (!isNum(d.f, 0, d.s.length - 1) || !COLOR_NAMES[d.c] || (d.k !== '3000K' && d.k !== '4000K')) return null;
    var lightingType = invert(LIGHTING_CODE)[d.l], installType = invert(INSTALL_CODE)[d.i];
    if (!lightingType || !installType) return null;
    return {
      mode: d.m,
      vertices: d.p.map(function(pt) { return { x: pt[0], y: pt[1] }; }),
      inputs: d.s.map(String),
      feedIndex: d.f, color: d.c, cct: d.k,
      lightingType: lightingType, installType: installType,
      profileId: typeof d.pr === 'string' && /^[\w-]{1,60}$/.test(d.pr) ? d.pr : '',
    };
  } catch (e) {
    return null;
  }
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, function(ch) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch];
  });
}

export function initConfigurator(rootEl, onCloseFn, opts) {
  opts = opts || {};
  var profiles = opts.profiles || [];
  var profileOptions = '<option value="">לא בטוח — המליצו לי על דגם</option>'
    + profiles.map(function(p) { return '<option value="' + escapeHtml(p.id) + '">' + escapeHtml(p.name) + '</option>'; }).join('');
  // 1. Inject HTML structure
  rootEl.innerHTML = `
    <div class="cfg-card">
      <div class="cfg-header">
        <button class="cfg-hdr-close" id="cfg-hdr-close" aria-label="סגור">✕</button>
        <h2>LEDLink Configurator</h2>
        <p>תכנון הנדסי וייצור בהתאמה אישית</p>
      </div>
      <!-- Step 1: Template -->
      <div class="cfg-step active" id="cfg-step-1">
        <div class="cfg-step-title">בחר צורת התחלה</div>
        <div class="cfg-grid-2">
          <div class="cfg-opt" id="cfg-tpl-I"><span class="cfg-opt-icon">➖</span>קו ישר</div>
          <div class="cfg-opt" id="cfg-tpl-L"><span class="cfg-opt-icon">📐</span>צורת ר'</div>
          <div class="cfg-opt" id="cfg-tpl-U"><span class="cfg-opt-icon"><svg width="28" height="28" viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M5 5 L5 27 L27 27 L27 5"/></svg></span>צורת ח'</div>
          <div class="cfg-opt" id="cfg-tpl-FREE"><span class="cfg-opt-icon">✏️</span>שרטוט חופשי</div>
        </div>
      </div>
      <!-- Step 2: Canvas -->
      <div class="cfg-step" id="cfg-step-2">
        <div class="cfg-step-title">הגדר מידות והזנה</div>
        <div class="cfg-canvas-wrap" id="cfg-container">
          <div class="cfg-status" id="cfg-status"></div>
          <div class="cfg-tools">
            <button class="cfg-tool-btn" id="cfg-tool-rotate">🔄 סובב</button>
            <button class="cfg-tool-btn" id="cfg-tool-clear">🗑️ נקה</button>
          </div>
          <canvas id="cfg-canvas"></canvas>
          <div class="cfg-ui-layer" id="cfg-ui-layer"></div>
        </div>
        <div class="cfg-nav">
          <button class="cfg-btn cfg-btn-prev" id="cfg-back-1">▶ חזור</button>
          <button class="cfg-btn cfg-btn-next" id="cfg-next-2">המשך לעיצוב ◀</button>
        </div>
      </div>
      <!-- Step 3: Design -->
      <div class="cfg-step" id="cfg-step-3">
        <div class="cfg-step-title">חתימת אור וגימור</div>
        <label class="cfg-label" for="cfg-profile">דגם פרופיל:</label>
        <select class="cfg-select" id="cfg-profile">${profileOptions}</select>
        <span class="cfg-label">צבע פרופיל:</span>
        <div class="cfg-grid-2">
          <div class="cfg-opt selected" id="cfg-c-BLK">שחור מט</div>
          <div class="cfg-opt" id="cfg-c-WHT">לבן מט</div>
        </div>
        <span class="cfg-label">גוון אור (CCT):</span>
        <div class="cfg-grid-2">
          <div class="cfg-opt selected" id="cfg-k-3000">חם 3000K</div>
          <div class="cfg-opt" id="cfg-k-4000">טבעי 4000K</div>
        </div>
        <span class="cfg-label">ייעוד התאורה:</span>
        <div class="cfg-grid-2">
          <div class="cfg-opt selected" id="cfg-lighting-central">מרכזית (30W/m)</div>
          <div class="cfg-opt" id="cfg-lighting-mood">אווירה (10W/m)</div>
        </div>
        <span class="cfg-label">אופן התקנה:</span>
        <div class="cfg-grid-2">
          <div class="cfg-opt selected" id="cfg-install-recessed">שקוע גבס</div>
          <div class="cfg-opt" id="cfg-install-surface">צמוד / תלוי</div>
        </div>
        <div class="cfg-nav">
          <button class="cfg-btn cfg-btn-prev" id="cfg-back-2">▶ חזור לשרטוט</button>
          <button class="cfg-btn cfg-btn-next" id="cfg-next-3">סיים וחשב BOM ◀</button>
        </div>
      </div>
      <!-- Step 4: BOM -->
      <div class="cfg-step" id="cfg-step-4">
        <div class="cfg-step-title" style="color:#E8A020">מפרט מוכן לייצור!</div>
        <div class="cfg-shared-note" id="cfg-shared-note" style="display:none">🔗 תכנון שנפתח מקישור. אפשר לערוך אותו או להוריד את השרטוט.</div>
        <img id="cfg-snapshot" class="cfg-snapshot" alt="שרטוט טכני">
        <button class="cfg-btn-dl" id="cfg-dl-btn">💾 הורד שרטוט (PNG)</button>
        <div class="cfg-bom-box" id="cfg-bom"></div>
        <button id="cfg-wa-link" class="cfg-btn-wa">💬 שלח תכנון, נחזור אליך</button>
        <div class="cfg-nav" style="margin-top:14px">
          <button class="cfg-btn cfg-btn-prev" id="cfg-back-3">חזור לעריכה</button>
          <button class="cfg-btn" style="background:#F0EDE8;color:#1C1C1C;border:1px solid #E0DDD6" id="cfg-restart">תכנן חדש</button>
        </div>
      </div>
    </div>`;

  // 2. DOM refs
  rootEl.querySelector('#cfg-hdr-close').onclick = onCloseFn;
  var canvas     = rootEl.querySelector('#cfg-canvas');
  var ctx        = canvas.getContext('2d');
  var uiLayer    = rootEl.querySelector('#cfg-ui-layer');
  var statusEl   = rootEl.querySelector('#cfg-status');
  var container  = rootEl.querySelector('#cfg-container');
  var toolRotate = rootEl.querySelector('#cfg-tool-rotate');
  var toolClear  = rootEl.querySelector('#cfg-tool-clear');

  // 3. State
  var state = {
    mode: 'I', vertices: [], feedIndex: 0, feedSelected: false,
    inputs: [], color: 'BLK', cct: '3000K',
    lightingType: 'מרכזית', installType: 'שקוע', locked: false,
    profileId: opts.profileId || '',
  };

  // 4. Helpers
  function goToStep(n, silent) {
    rootEl.querySelectorAll('.cfg-step').forEach(function(p) { p.classList.remove('active'); });
    rootEl.querySelector('#cfg-step-' + n).classList.add('active');
    if (n === 2) resize();
    if (!silent) history.pushState({ cfgStep: n }, '');
    var overlay = rootEl.closest('.cfg-overlay');
    if (overlay) overlay.scrollTop = 0;
  }
  history.pushState({ cfgStep: 1 }, '');

  function onPopState() {
    var active = rootEl.querySelector('.cfg-step.active');
    if (!active) { window.removeEventListener('popstate', onPopState); return; }
    var n = parseInt(active.id.replace('cfg-step-', ''));
    if (n > 1) {
      goToStep(n - 1, true);
    } else {
      window.removeEventListener('popstate', onPopState);
      onCloseFn();
    }
  }
  window.addEventListener('popstate', onPopState);

  function resize() {
    canvas.width  = container.clientWidth;
    canvas.height = container.clientHeight;
    if (state.vertices.length) redrawCanvas();
  }

  function recenterShape() {
    if (!state.vertices.length) return;
    var xs = state.vertices.map(function(v) { return v.x; });
    var ys = state.vertices.map(function(v) { return v.y; });
    var minX = Math.min.apply(null, xs), maxX = Math.max.apply(null, xs);
    var minY = Math.min.apply(null, ys), maxY = Math.max.apply(null, ys);
    var offX = (canvas.width / 2) - (minX + maxX) / 2;
    var offY = (canvas.height / 2) - (minY + maxY) / 2;
    state.vertices.forEach(function(v) { v.x += offX; v.y += offY; });
  }

  function injectTemplate(t) {
    var cx = canvas.width / 2, cy = canvas.height / 2;
    if (t === 'I') state.vertices = [{ x: cx - 150, y: cy }, { x: cx + 150, y: cy }];
    if (t === 'L') state.vertices = [{ x: cx - 100, y: cy - 100 }, { x: cx - 100, y: cy + 100 }, { x: cx + 100, y: cy + 100 }];
    if (t === 'U') state.vertices = [{ x: cx - 100, y: cy - 100 }, { x: cx - 100, y: cy + 100 }, { x: cx + 100, y: cy + 100 }, { x: cx + 100, y: cy - 100 }];
    recenterShape();
    redrawCanvas();
  }

  function rotateShape() {
    if (!state.vertices.length) return;
    var xs = state.vertices.map(function(v) { return v.x; });
    var ys = state.vertices.map(function(v) { return v.y; });
    var cx = (Math.min.apply(null, xs) + Math.max.apply(null, xs)) / 2;
    var cy = (Math.min.apply(null, ys) + Math.max.apply(null, ys)) / 2;
    state.vertices = state.vertices.map(function(v) {
      var dx = v.x - cx, dy = v.y - cy;
      return { x: cx - dy, y: cy + dx };
    });
    recenterShape();
    redrawCanvas();
  }

  function selectTemplate(t) {
    state.mode = t; state.locked = (t !== 'FREE'); state.inputs = []; state.feedIndex = 0;
    state.feedSelected = (t === 'I');
    goToStep(2);
    setTimeout(function() {
      resize();
      if (t === 'FREE') {
        state.vertices = []; toolRotate.style.display = 'none'; toolClear.style.display = 'none';
        statusEl.innerText = 'צייר כעת...'; redrawCanvas();
      } else {
        toolRotate.style.display = 'block'; toolClear.style.display = 'none';
        injectTemplate(t); statusEl.innerText = '';
      }
    }, 60);
  }

  function redrawCanvas() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    uiLayer.innerHTML = '';

    // Centroid — for pushing labels outside the shape
    var cx = 0, cy = 0;
    state.vertices.forEach(function(v) { cx += v.x; cy += v.y; });
    if (state.vertices.length) { cx /= state.vertices.length; cy /= state.vertices.length; }

    for (var i = 0; i < state.vertices.length - 1; i++) {
      var p1 = state.vertices[i], p2 = state.vertices[i + 1];
      var isFeed = state.feedSelected && i === state.feedIndex;
      ctx.beginPath(); ctx.lineWidth = 14; ctx.lineCap = 'square';
      ctx.strokeStyle = isFeed ? '#E8A020' : '#FFFFFF';
      ctx.shadowBlur  = isFeed ? 20 : 0;
      ctx.shadowColor = '#E8A020';
      ctx.moveTo(p1.x, p1.y); ctx.lineTo(p2.x, p2.y); ctx.stroke();
      ctx.shadowBlur = 0;

      var midX = (p1.x + p2.x) / 2, midY = (p1.y + p2.y) / 2;
      var len  = Math.hypot(p2.x - p1.x, p2.y - p1.y);
      var ang  = Math.atan2(p2.y - p1.y, p2.x - p1.x);

      // Hit area for feed selection
      var hit = document.createElement('div'); hit.className = 'cfg-seg-hit';
      hit.style.width = len + 'px'; hit.style.left = p1.x + 'px'; hit.style.top = (p1.y - 20) + 'px';
      hit.style.transform = 'rotate(' + ang + 'rad)';
      (function(idx) { hit.onclick = function() { state.feedIndex = idx; state.feedSelected = true; redrawCanvas(); }; })(i);
      uiLayer.appendChild(hit);

      // Measure input — positioned outside the shape
      var OFF = 20;
      var isH = Math.abs(p2.x - p1.x) > Math.abs(p2.y - p1.y);
      var inp = document.createElement('input'); inp.type = 'number'; inp.className = 'cfg-measure-input';
      inp.placeholder = 'ס"מ';
      if (isH) {
        var pushUp = (midY <= cy);
        inp.style.left      = midX + 'px';
        inp.style.top       = (pushUp ? midY - OFF : midY + OFF) + 'px';
        inp.style.transform = pushUp ? 'translate(-50%,-100%)' : 'translate(-50%,0%)';
      } else {
        var pushRight = (midX >= cx);
        inp.style.left      = (pushRight ? midX + OFF : midX - OFF) + 'px';
        inp.style.top       = midY + 'px';
        inp.style.transform = pushRight ? 'translate(0%,-50%)' : 'translate(-100%,-50%)';
      }
      inp.value = state.inputs[i] || '';
      (function(idx, el) {
        el.oninput = function() { el.style.borderColor = '#E8A020'; state.inputs[idx] = el.value; };
      })(i, inp);
      uiLayer.appendChild(inp);
    }
  }

  // Freehand drawing
  var isDrawing = false, rawPoints = [];
  function onPointerDown(e) {
    if (state.locked) return;
    isDrawing = true; rawPoints = [];
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.beginPath(); ctx.lineWidth = 4; ctx.strokeStyle = 'rgba(255,255,255,0.4)';
  }
  function onPointerMove(e) {
    if (!isDrawing) return;
    var rect = canvas.getBoundingClientRect();
    var pt = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    rawPoints.push(pt);
    if (rawPoints.length === 1) ctx.moveTo(pt.x, pt.y); else ctx.lineTo(pt.x, pt.y);
    ctx.stroke();
  }
  function onPointerUp() {
    if (!isDrawing) return; isDrawing = false;
    if (rawPoints.length > 5) processFreehand();
  }
  canvas.addEventListener('pointerdown', onPointerDown);
  canvas.addEventListener('pointermove', onPointerMove);
  canvas.addEventListener('pointerup',   onPointerUp);

  // Ramer–Douglas–Peucker simplification
  function rdp(p, e) {
    if (p.length < 3) return p;
    var maxD = 0, idx = 0;
    for (var i = 1; i < p.length - 1; i++) {
      var d = Math.abs(
        (p[p.length-1].y - p[0].y) * p[i].x
        - (p[p.length-1].x - p[0].x) * p[i].y
        + p[p.length-1].x * p[0].y
        - p[p.length-1].y * p[0].x
      ) / Math.hypot(p[p.length-1].y - p[0].y, p[p.length-1].x - p[0].x);
      if (d > maxD) { maxD = d; idx = i; }
    }
    if (maxD > e) return rdp(p.slice(0, idx + 1), e).slice(0, -1).concat(rdp(p.slice(idx), e));
    return [p[0], p[p.length - 1]];
  }

  function processFreehand() {
    var simplified = rdp(rawPoints, 40);
    if (simplified.length < 2) return;

    // 1. יישור ל-90 מעלות
    var ortho = [simplified[0]];
    for (var i = 1; i < simplified.length; i++) {
      var p1 = ortho[ortho.length - 1], p2 = simplified[i];
      if (Math.abs(p2.x - p1.x) > Math.abs(p2.y - p1.y)) ortho.push({ x: p2.x, y: p1.y });
      else ortho.push({ x: p1.x, y: p2.y });
    }

    // 2. סגירה מגנטית + תיקון הפינה שלפני הסגירה
    if (ortho.length > 2 && Math.hypot(ortho[ortho.length-1].x - ortho[0].x, ortho[ortho.length-1].y - ortho[0].y) < 90) {
      ortho[ortho.length - 1] = { x: ortho[0].x, y: ortho[0].y };
      var prev = ortho[ortho.length - 2];
      if (Math.abs(ortho[ortho.length - 3].y - prev.y) < 5) prev.x = ortho[0].x;
      else prev.y = ortho[0].y;
    }

    // 3. הלחמת צלעות קולינאריות (מונע חלוניות מידה כפולות)
    var clean = [ortho[0]];
    for (var j = 1; j < ortho.length; j++) {
      var prevC = clean[clean.length - 1], curr = ortho[j];
      if (Math.hypot(curr.x - prevC.x, curr.y - prevC.y) < 5) continue;
      if (clean.length > 1) {
        var pPrev = clean[clean.length - 2];
        var isHoriz = Math.abs(prevC.y - pPrev.y) < 2 && Math.abs(curr.y - prevC.y) < 2;
        var isVert  = Math.abs(prevC.x - pPrev.x) < 2 && Math.abs(curr.x - prevC.x) < 2;
        if (isHoriz || isVert) { clean[clean.length - 1] = curr; continue; }
      }
      clean.push(curr);
    }

    // 4. בדיקת איחוד בצומת הסגירה
    if (clean.length > 3 && clean[0].x === clean[clean.length-1].x && clean[0].y === clean[clean.length-1].y) {
      var pFirst = clean[1], pLast = clean[clean.length - 2];
      var isHorizC = Math.abs(clean[0].y - pFirst.y) < 2 && Math.abs(clean[0].y - pLast.y) < 2;
      var isVertC  = Math.abs(clean[0].x - pFirst.x) < 2 && Math.abs(clean[0].x - pLast.x) < 2;
      if (isHorizC || isVertC) { clean[0] = pLast; clean.pop(); clean[clean.length - 1] = pLast; }
    }

    state.vertices    = clean;
    state.locked      = true;
    state.feedSelected = (state.vertices.length - 1 === 1);
    toolRotate.style.display = 'block'; toolClear.style.display = 'block'; statusEl.innerText = '';
    recenterShape();
    redrawCanvas();
  }

  function validateAndProceed() {
    if (!state.vertices.length) { alert('נא לשרטוט או לבחור צורה'); return; }
    var missing = false;
    var inputs = uiLayer.querySelectorAll('input');
    for (var i = 0; i < state.vertices.length - 1; i++) {
      if (!state.inputs[i] || Number(state.inputs[i]) <= 0) {
        missing = true; if (inputs[i]) inputs[i].style.borderColor = '#ef4444';
      }
    }
    if (missing) { alert('שגיאה: נא להזין מידה תקינה לכל הצלעות'); return; }
    if ((state.vertices.length - 1) > 1 && !state.feedSelected) {
      alert('נא ללחוץ על הצלע שממנה תהיה ההזנה (תסומן בזהב)'); return;
    }
    goToStep(3);
  }

  function buildExportCanvas() {
    // שוליים לרוחב — בנייד הקנבס צר ותוויות "צלע N" של צלעות אנכיות נחתכות בקצוות
    var PADX = 70;
    var cw = canvas.width + PADX * 2, ch = canvas.height;
    var verts = state.vertices.map(function(v) { return { x: v.x + PADX, y: v.y }; });
    var HDR = 54, FTR = 34;
    var oc = document.createElement('canvas'); oc.width = cw; oc.height = ch + HDR + FTR;
    oc.style.direction = 'rtl';
    document.body.appendChild(oc);
    var ox = oc.getContext('2d');

    // ── HEADER (dark bar) ──
    ox.fillStyle = '#1C1C1C'; ox.fillRect(0, 0, cw, HDR);
    ox.textBaseline = 'middle'; ox.textAlign = 'right';
    ox.font = '300 18px Heebo,sans-serif'; ox.fillStyle = '#FFFFFF';
    ox.fillText('LINK', cw - 14, HDR / 2);
    var linkW = ox.measureText('LINK').width;
    ox.font = '900 18px Heebo,sans-serif'; ox.fillStyle = '#E8A020';
    ox.fillText('LED', cw - 14 - linkW, HDR / 2);
    ox.font = '12px Heebo,sans-serif'; ox.fillStyle = '#666'; ox.textAlign = 'end';
    ox.fillText('תכנון פרופיל LED אישי', 14, HDR / 2);
    ox.fillStyle = '#E8A020'; ox.fillRect(0, HDR - 2, cw, 2);

    // ── DRAWING AREA (white) ──
    ox.fillStyle = '#FFFFFF'; ox.fillRect(0, HDR, cw, ch);
    ox.strokeStyle = 'rgba(224,221,214,0.5)'; ox.lineWidth = 0.5;
    for (var gx = 0; gx < cw; gx += 30) { ox.beginPath(); ox.moveTo(gx, HDR); ox.lineTo(gx, HDR + ch); ox.stroke(); }
    for (var gy = 0; gy < ch; gy += 30) { ox.beginPath(); ox.moveTo(0, HDR + gy); ox.lineTo(cw, HDR + gy); ox.stroke(); }

    var cx = 0, cy = 0;
    verts.forEach(function(v) { cx += v.x; cy += v.y; });
    cx /= verts.length; cy /= verts.length;

    for (var i = 0; i < verts.length - 1; i++) {
      var p1 = verts[i], p2 = verts[i + 1];
      var isFeed = state.feedSelected && i === state.feedIndex;
      var x1 = p1.x, y1 = p1.y + HDR, x2 = p2.x, y2 = p2.y + HDR;
      ox.beginPath(); ox.lineWidth = 10; ox.lineCap = 'square';
      ox.strokeStyle = isFeed ? '#E8A020' : '#1C1C1C';
      ox.moveTo(x1, y1); ox.lineTo(x2, y2); ox.stroke();

      // תווית המידה יוצאת החוצה מהצורה, ותווית ההזנה לצד השני — כדי שלא יתנגשו
      var smx = (p1.x + p2.x) / 2, smy = (p1.y + p2.y) / 2;
      var isH = Math.abs(p2.x - p1.x) > Math.abs(p2.y - p1.y);
      var outSign = isH ? (smy <= cy ? -1 : 1) : (smx >= cx ? 1 : -1);
      ox.direction = 'rtl';
      if (isFeed) {
        var fx = (x1 + x2) / 2, fy = (y1 + y2) / 2;
        ox.font = 'bold 10px Heebo,sans-serif'; ox.textAlign = 'center'; ox.textBaseline = 'middle';
        var fw = ox.measureText('⚡ הזנה').width;
        ox.fillStyle = '#E8A020';
        if (isH) ox.fillText('⚡ הזנה', fx, fy - outSign * 18);
        else     ox.fillText('⚡ הזנה', fx - outSign * (fw / 2 + 12), fy);
      }
      if (state.inputs[i]) {
        // מספר הצלע בשרטוט — ההודעה מפרטת מידות והזנה לפי המספרים האלה
        var text = 'צלע ' + (i + 1) + ': ' + state.inputs[i] + ' ס"מ';
        ox.font = 'bold 11px Heebo,sans-serif'; ox.textAlign = 'center'; ox.textBaseline = 'middle';
        var tw = ox.measureText(text).width;
        var lx, ly;
        if (isH) {
          lx = (x1 + x2) / 2;
          ly = smy + HDR + outSign * 26;
        } else {
          lx = smx + outSign * (tw / 2 + 16);
          ly = (y1 + y2) / 2;
        }
        ox.fillStyle = '#F4F4F0'; ox.fillRect(lx - tw / 2 - 5, ly - 8, tw + 10, 16);
        ox.strokeStyle = '#E0DDD6'; ox.lineWidth = 1; ox.strokeRect(lx - tw / 2 - 5, ly - 8, tw + 10, 16);
        ox.fillStyle = '#1C1C1C'; ox.fillText(text, lx, ly);
      }
    }

    verts.forEach(function(v) {
      ox.beginPath(); ox.arc(v.x, v.y + HDR, 4, 0, Math.PI * 2);
      ox.fillStyle = '#E8A020'; ox.fill();
      ox.strokeStyle = '#1C1C1C'; ox.lineWidth = 1.5; ox.stroke();
    });

    // ── FOOTER ──
    ox.fillStyle = '#E8A020'; ox.fillRect(0, HDR + ch, cw, 2);
    ox.fillStyle = '#F4F4F0'; ox.fillRect(0, HDR + ch + 2, cw, FTR - 2);
    ox.direction = 'rtl';
    ox.font = '10px Heebo,sans-serif'; ox.textAlign = 'center'; ox.textBaseline = 'middle';
    ox.fillStyle = '#666';
    var profile = currentProfile();
    ox.fillText((profile ? 'פרופיל ' + profile.name + ' · ' : '')
      + state.installType + ' · ' + state.lightingType + ' · ' + state.cct + ' · ' + COLOR_NAMES[state.color],
      cw / 2, HDR + ch + 2 + (FTR - 2) / 2);
    document.body.removeChild(oc);
    return oc;
  }

  function currentProfile() {
    if (!state.profileId) return null;
    return profiles.find(function(p) { return p.id === state.profileId; }) || { id: state.profileId, name: state.profileId };
  }

  function captureCanvas() {
    rootEl.querySelector('#cfg-snapshot').src = buildExportCanvas().toDataURL('image/png');
  }

  var isIOS = /iPhone|iPad/i.test(navigator.userAgent) && !/CriOS|Chrome/i.test(navigator.userAgent);

  function showIOSSaveOverlay(dataURL, onClose) {
    var o = document.createElement('div');
    o.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.92);z-index:999999;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:14px;padding:20px;box-sizing:border-box;';
    o.innerHTML = '<div style="color:#E8A020;font-family:Heebo,sans-serif;font-size:15px;font-weight:700;text-align:center;">לחץ לחיצה ארוכה על השרטוט ← "שמור תמונה"</div>'
      + '<img src="' + dataURL + '" style="max-width:100%;max-height:55vh;border-radius:10px;border:2px solid #E8A020;">'
      + '<button style="background:#E8A020;color:#111;border:none;border-radius:10px;padding:13px 32px;font-family:Heebo,sans-serif;font-size:16px;font-weight:700;cursor:pointer;">סגור</button>';
    o.querySelector('button').onclick = function() { document.body.removeChild(o); if (onClose) onClose(); };
    document.body.appendChild(o);
  }

  function downloadSnapshot() {
    var dataURL = buildExportCanvas().toDataURL('image/png');
    if (isIOS) { showIOSSaveOverlay(dataURL, null); return; }
    var arr = dataURL.split(','), mime = arr[0].match(/:(.*?);/)[1];
    var bstr = atob(arr[1]), n = bstr.length, u8 = new Uint8Array(n);
    while (n--) { u8[n] = bstr.charCodeAt(n); }
    var blobUrl = URL.createObjectURL(new Blob([u8], { type: mime }));
    var link = document.createElement('a');
    link.href = blobUrl; link.download = 'LEDLink-Drawing-' + Date.now() + '.png';
    document.body.appendChild(link); link.click(); document.body.removeChild(link);
    setTimeout(function() { URL.revokeObjectURL(blobUrl); }, 1000);
  }

  function generateFinalBOM() {
    captureCanvas();
    var totalCM = 0; state.inputs.forEach(function(v) { totalCM += Number(v || 0); });
    var totalM  = totalCM / 100;
    var corners = state.vertices.length - 2;
    var first   = state.vertices[0], last = state.vertices[state.vertices.length - 1];
    if (state.vertices.length > 1 && first.x === last.x && first.y === last.y) corners += 1;
    var wpm   = (state.lightingType === 'מרכזית') ? 30 : 10;
    var reqW  = totalM * wpm * 1.2;
    var PSU   = [25, 50, 75, 100, 150, 200, 250, 350];
    var psuText = '', splitNote = '', num = 1;

    if (reqW > 350 || totalM > 5) {
      num = Math.ceil(Math.max(reqW / 350, totalM / 5));
      var wpu = reqW / num;
      var mpsu = PSU.find(function(w) { return w >= wpu; }) || 350;
      psuText   = num + " יח' זהות של " + mpsu + 'W';
      splitNote = '⚠️ תכנון בטוח: פיצול ל-' + num + ' הזנות למניעת מפל מתח.';
    } else {
      var matchedPsu = PSU.find(function(w) { return w >= reqW; }) || 350;
      psuText = "יח' אחת של " + matchedPsu + 'W';
    }

    var profile   = currentProfile();
    var sides     = state.vertices.length - 1;
    var colorName = COLOR_NAMES[state.color];
    var feedText  = num > 1
      ? num + ' נקודות הזנה (הראשית בצלע ' + (state.feedIndex + 1) + ')'
      : 'צלע ' + (state.feedIndex + 1);
    var sideLines = state.inputs.slice(0, sides).map(function(v, i) { return 'צלע ' + (i + 1) + ': ' + v + ' ס"מ'; });

    var html = '<div class="cfg-bom-item"><span>דגם פרופיל</span><span class="cfg-bom-val">' + (profile ? escapeHtml(profile.name) : 'לא נבחר — נמליץ') + '</span></div>';
    html += '<div class="cfg-bom-item"><span>צורה</span><span class="cfg-bom-val">' + SHAPE_NAMES[state.mode] + ' · ' + sides + ' צלעות</span></div>';
    html += '<div class="cfg-bom-item"><span>מידות</span><span class="cfg-bom-val">' + sideLines.join('<br>') + '</span></div>';
    html += '<div class="cfg-bom-item"><span>אורך חיתוך אלומיניום</span><span class="cfg-bom-val">' + totalM.toFixed(2) + ' מ\'</span></div>';
    html += '<div class="cfg-bom-item"><span>סוג התקנה / ייעוד</span><span class="cfg-bom-val">' + state.installType + ' / ' + state.lightingType + '</span></div>';
    html += '<div class="cfg-bom-item"><span>גוון וגימור</span><span class="cfg-bom-val">' + state.cct + ' / ' + colorName + '</span></div>';
    html += '<div class="cfg-bom-item"><span>הזנת חשמל ⚡</span><span class="cfg-bom-val">' + feedText + '</span></div>';
    if (corners > 0) html += '<div class="cfg-bom-item"><span>פינות 90° + הלחמות</span><span class="cfg-bom-val">' + corners + '</span></div>';
    html += '<div class="cfg-bom-item" style="border-bottom:none;flex-direction:column;gap:4px">'
          + '<div style="display:flex;justify-content:space-between;width:100%"><span>ספקי כוח (24V)</span><span class="cfg-bom-val">' + psuText + '</span></div>'
          + (splitNote ? '<div style="font-size:10px;color:#E8A020">' + splitNote + '</div>' : '')
          + '</div>';
    rootEl.querySelector('#cfg-bom').innerHTML = html;

    var shareUrl = location.origin + location.pathname + '?cfg=' + encodeDesign(state);
    var msg = '*הזמנת מפרט LEDLink*\n---'
            + '\nפרופיל: ' + (profile ? profile.name + ' (מק"ט ' + profile.id + ')' : 'לא נבחר — אשמח להמלצה')
            + '\nצורה: ' + SHAPE_NAMES[state.mode] + ' · ' + sides + ' צלעות' + (corners > 0 ? ' · ' + corners + ' פינות' : '')
            + '\n' + sideLines.join('\n')
            + '\nאורך כולל: ' + totalM.toFixed(2) + ' מ\''
            + '\nייעוד: ' + state.lightingType + ' (' + wpm + 'W/m)'
            + '\nהתקנה: ' + state.installType
            + '\nגוון/גימור: ' + state.cct + ' / ' + colorName
            + '\nספקים (24V): ' + psuText
            + '\n⚡ הזנה: ' + feedText
            + (splitNote ? '\n' + splitNote : '')
            + '\n\n📐 השרטוט המלא:\n' + shareUrl;
    var isMobile = /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent);
    waUrl = isMobile
      ? 'https://wa.me/972504722550?text=' + encodeURIComponent(msg)
      : 'https://web.whatsapp.com/send?phone=972504722550&text=' + encodeURIComponent(msg);
    goToStep(4);
  }

  function clearCanvas() {
    state.locked = false; state.vertices = []; state.inputs = []; state.feedIndex = 0; state.feedSelected = false;
    toolClear.style.display = 'none'; toolRotate.style.display = 'none';
    redrawCanvas(); statusEl.innerText = 'צייר כעת...';
  }

  // 5. Wire up buttons
  rootEl.querySelector('#cfg-tpl-I').onclick    = function() { selectTemplate('I'); };
  rootEl.querySelector('#cfg-tpl-L').onclick    = function() { selectTemplate('L'); };
  rootEl.querySelector('#cfg-tpl-U').onclick    = function() { selectTemplate('U'); };
  rootEl.querySelector('#cfg-tpl-FREE').onclick = function() { selectTemplate('FREE'); };
  rootEl.querySelector('#cfg-back-1').onclick   = function() { goToStep(1); };
  rootEl.querySelector('#cfg-next-2').onclick   = validateAndProceed;
  rootEl.querySelector('#cfg-back-2').onclick   = function() { goToStep(2); };
  rootEl.querySelector('#cfg-next-3').onclick   = generateFinalBOM;
  rootEl.querySelector('#cfg-back-3').onclick   = function() { goToStep(3); };
  rootEl.querySelector('#cfg-restart').onclick  = function() { clearCanvas(); goToStep(1); };
  rootEl.querySelector('#cfg-tool-rotate').onclick = rotateShape;
  rootEl.querySelector('#cfg-tool-clear').onclick  = clearCanvas;
  rootEl.querySelector('#cfg-dl-btn').onclick      = downloadSnapshot;

  // השרטוט נשלח כקישור בתוך ההודעה, כך שאין צורך לצרף קובץ
  var waUrl      = '';
  var waLink     = rootEl.querySelector('#cfg-wa-link');
  var sharedNote = rootEl.querySelector('#cfg-shared-note');
  waLink.onclick = function() { window.open(waUrl, '_blank'); };

  // מצב תצוגה מקישור: מסתירים את השליחה עד שמתחילים לערוך
  function setSharedView(on) {
    sharedNote.style.display = on ? 'block' : 'none';
    waLink.style.display     = on ? 'none' : '';
  }
  rootEl.querySelector('#cfg-back-3').addEventListener('click', function() { setSharedView(false); });
  rootEl.querySelector('#cfg-restart').addEventListener('click', function() { setSharedView(false); });

  var profileSelect = rootEl.querySelector('#cfg-profile');
  profileSelect.onchange = function() { state.profileId = profileSelect.value; };

  // Design option buttons
  var designGroups = [
    { ids: ['cfg-c-BLK', 'cfg-c-WHT'],                  key: 'color',        vals: ['BLK', 'WHT'] },
    { ids: ['cfg-k-3000', 'cfg-k-4000'],                 key: 'cct',          vals: ['3000K', '4000K'] },
    { ids: ['cfg-lighting-central', 'cfg-lighting-mood'], key: 'lightingType', vals: ['מרכזית', 'אווירה'] },
    { ids: ['cfg-install-recessed', 'cfg-install-surface'], key: 'installType', vals: ['שקוע', 'צמוד/תלוי'] },
  ];
  function selectDesign(grp, idx) {
    grp.ids.forEach(function(gid, i) { rootEl.querySelector('#' + gid).classList.toggle('selected', i === idx); });
    state[grp.key] = grp.vals[idx];
  }
  designGroups.forEach(function(grp) {
    grp.ids.forEach(function(id, idx) {
      var el = rootEl.querySelector('#' + id);
      if (el) el.onclick = function() { selectDesign(grp, idx); };
    });
  });

  // דגם שנבחר מראש או מקישור ואינו ברשימה — מוסיפים אותו כדי שלא ייעלם בשמירה
  function syncProfileSelect() {
    if (state.profileId && !profileSelect.querySelector('option[value="' + CSS.escape(state.profileId) + '"]')) {
      var opt = document.createElement('option');
      opt.value = state.profileId; opt.textContent = state.profileId;
      profileSelect.appendChild(opt);
    }
    profileSelect.value = state.profileId;
  }
  syncProfileSelect();

  // פתיחה מקישור ?cfg= — משחזרים את התכנון ומציגים ישר את הסיכום
  function restoreShared(d) {
    state.mode = d.mode; state.inputs = d.inputs; state.feedIndex = d.feedIndex; state.feedSelected = true;
    state.profileId = d.profileId; state.locked = true;
    designGroups.forEach(function(grp) { selectDesign(grp, Math.max(0, grp.vals.indexOf(d[grp.key]))); });
    syncProfileSelect();
    goToStep(2, true);
    setTimeout(function() {
      resize();
      // השרטוט נשמר בפיקסלים של מסך השולח — מקטינים כדי שייכנס לקנבס הנוכחי
      var xs = d.vertices.map(function(v) { return v.x; });
      var ys = d.vertices.map(function(v) { return v.y; });
      var w = Math.max.apply(null, xs), h = Math.max.apply(null, ys);
      var scale = Math.min(1, (canvas.width - 140) / (w || 1), (canvas.height - 100) / (h || 1));
      state.vertices = d.vertices.map(function(v) { return { x: v.x * scale, y: v.y * scale }; });
      toolRotate.style.display = 'block'; toolClear.style.display = 'block'; statusEl.innerText = '';
      recenterShape();
      redrawCanvas();
      generateFinalBOM();
      setSharedView(true);
    }, 60);
  }
  if (opts.shared) restoreShared(opts.shared);

  // Cleanup function returned to caller
  return function cleanup() {
    canvas.removeEventListener('pointerdown', onPointerDown);
    canvas.removeEventListener('pointermove', onPointerMove);
    canvas.removeEventListener('pointerup',   onPointerUp);
    window.removeEventListener('popstate', onPopState);
  };
}
