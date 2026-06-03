/* LEDLink Professional Chatbot — יועץ תאורה
 * chatbot-config.js must load before this file.
 */
(function () {
'use strict';

// ── Config ───────────────────────────────────────────────────────────────
var CFG    = window.CHATBOT_CONFIG || {};
var API_KEY  = CFG.CLAUDE_API_KEY  || '';
var IMG_BASE = CFG.IMG_BASE        || 'file:///C:/Users/guy/Downloads/ledlink/';
var WA_NUM   = CFG.WHATSAPP_NUMBER || '972501234567';

// ── Color Temperature Table ──────────────────────────────────────────────
var COLOR_TEMP = {
  'סלון':           { k: '3000K', label: 'אור חם',     reason: 'יוצר אווירה נעימה וביתית, מרגיע ומזמין',                    alt: '4000K אם החדר משמש גם לעבודה מהבית' },
  'חדר שינה':      { k: '3000K', label: 'אור חם',     reason: 'מסייע לרגיעה והכנה לשינה',                                  alt: '2700K לאינטימיות מרבית' },
  'מטבח':          { k: '4000K', label: 'אור ניטרלי',  reason: 'מאפשר לראות צבעי מזון בצורה נאמנה, לא קר מדי ולא חם מדי', alt: '6000K לאזור הכיור ומשטח עבודה' },
  'משרד':          { k: '6000K', label: 'אור קר',      reason: 'שומר על ריכוז וערנות לאורך יום עבודה',                     alt: '4000K אם רוצים סביבת עבודה נעימה יותר' },
  'מסדרון':        { k: '4000K', label: 'אור ניטרלי',  reason: 'נייטרלי ותפקודי, מתאים למעבר',                             alt: '3000K לתחושה ביתית' },
  'שירותים/מקלחת': { k: '4000K', label: 'אור ניטרלי',  reason: 'בהיר ונקי, מתאים לגילוח ואיפור',                          alt: '' },
  'חנות':          { k: '4000K', label: 'אור ניטרלי',  reason: 'מציג סחורה בצורה טבעית לרוב קטגוריות',                    alt: '6000K לחנויות בגדים/תכשיטים, 3000K למזון/אופנה' },
  'חוץ':           { k: '3000K', label: 'אור חם',     reason: 'חם ונעים בלילה, פחות מושך חרקים',                          alt: '4000K לאזורי בטיחות/חניה' },
  'אחר':           { k: '4000K', label: 'אור ניטרלי',  reason: 'פשרה טובה לרוב השימושים',                                  alt: '' }
};

// ── Lux & Power Table ────────────────────────────────────────────────────
var LUX_TABLE = {
  'סלון':           { lux: 150,  wpm: 12, eff: 110 },
  'חדר שינה':      { lux: 100,  wpm: 10, eff: 110 },
  'מטבח':          { lux: 300,  wpm: 16, eff: 120 },
  'משרד':          { lux: 500,  wpm: 20, eff: 120 },
  'מסדרון':        { lux: 150,  wpm: 10, eff: 110 },
  'שירותים/מקלחת': { lux: 200,  wpm: 12, eff: 110 },
  'חנות':          { lux: 400,  wpm: 18, eff: 120 },
  'חוץ':           { lux: 50,   wpm: 10, eff: 100 },
  'אחר':           { lux: 150,  wpm: 12, eff: 110 }
};

var ROOM_SIZE = {
  'קטן — עד 12מ"ר':    10,
  'בינוני — 12–25מ"ר': 18,
  'גדול — מעל 25מ"ר':  32
};

// ── Profile Rules ────────────────────────────────────────────────────────
var PROFILE_RULES = {
  'גבס': {
    dry: ['ledlink-5213', 'ledlink-6114'],
    wet: ['ledlink-1808', 'ledlink-1813']
  },
  'בטון/טיח': {
    dry: ['ledlink-1013', 'ledlink-1707', 'ledlink-2020', 'ledlink-3020'],
    wet: ['ledlink-1808', 'ledlink-1813']
  },
  'עץ': {
    dry: ['ledlink-tuba30', 'ledlink-tuba60', 'ledlink-1013'],
    wet: ['ledlink-1808']
  },
  'תקרה חשופה / בטון גלוי': {
    dry: ['ledlink-tuba60', 'ledlink-tuba30', 'ledlink-5075'],
    wet: ['ledlink-1808']
  }
};

// ── Profile Meta ─────────────────────────────────────────────────────────
var PROFILE_META = {
  'ledlink-5213': {
    why:  'נסתר לחלוטין בתקרת גבס — הפרופיל נעלם בתקרה, תאורה נקייה',
    note: 'דורש חיתוך בגבס 52mm × 13mm. מתאים לסטריפ עד 12mm.'
  },
  'ledlink-6114': {
    why:  'שקוע רחב לגבס — מתאים לסטריפ הספק גבוה או סטריפ כפול',
    note: 'דורש חיתוך 61mm × 14mm. מתאים לסטריפ עד 12mm, עוצמה גבוהה.'
  },
  'ledlink-1013': {
    why:  'פרופיל צמוד-תקרה דק ועדין — כמעט בלתי נראה על בטון/טיח',
    note: 'רוחב 10mm — מתאים לסטריפ 8mm. גובה 13mm בלבד.'
  },
  'ledlink-1707': {
    why:  'פרופיל דק וצמוד — מינימליסטי, מדגיש את הסטריפ במינימום נפח',
    note: 'רוחב 17mm — מתאים לסטריפ עד 12mm.'
  },
  'ledlink-2020': {
    why:  'פרופיל צמוד-תקרה קלאסי — גוף ייצוגי, מפזר חלבי עדין',
    note: 'רוחב 20mm, גובה 20mm. מתאים לסטריפ עד 12mm.'
  },
  'ledlink-3020': {
    why:  'פרופיל צמוד רחב — לסטריפ עם הספק גבוה או ליצירת אפקט אור רחב',
    note: 'רוחב 30mm, גובה 20mm. מתאים לסטריפ עד 12mm.'
  },
  'ledlink-1808': {
    why:  'פרופיל IP65 — מוגן לחלוטין מאדים ומים, מתאים לאזורים לחים',
    note: 'רוחב 18mm. מתאים לכל שירותים/מקלחת/מטבח/חוץ.'
  },
  'ledlink-1813': {
    why:  'פרופיל IP65 רחב יותר — לאזורים לחים עם סטריפ הספק גבוה',
    note: 'רוחב 18mm, גובה 13mm. הגנה IP65 מלאה.'
  },
  'ledlink-tuba30': {
    why:  'פרופיל עגול תלייה/צמוד — מתאים לתקרות עץ וחשופות, אסתטיקה תעשייתית',
    note: 'קוטר 30mm. ניתן לתלייה בכבל או הצמדה.'
  },
  'ledlink-tuba60': {
    why:  'פרופיל עגול גדול תלייה — נוכחות חזקה, מתאים לחלל פתוח/גבוה',
    note: 'קוטר 60mm. מתאים לגובה תקרה 3m ומעלה.'
  },
  'ledlink-5075': {
    why:  'פרופיל גדול לתקרה חשופה — נוכחות עיצובית חזקה, הספק גבוה',
    note: 'רוחב 50mm, גובה 75mm. מתאים לחללים מסחריים גבוהים.'
  }
};

// ── Questions ────────────────────────────────────────────────────────────
var QUESTIONS = [
  {
    id: 'roomType',
    text: 'שלום! אני לינק, יועץ התאורה של LEDLink 💡\n\nמה סוג החדר שברצונכם לתאור?',
    opts: ['סלון', 'חדר שינה', 'מטבח', 'משרד', 'מסדרון', 'שירותים/מקלחת', 'חנות', 'חוץ', 'אחר']
  },
  {
    id: 'colorConfirm',
    text: '__COLOR_REC__',   // replaced dynamically in runQ()
    opts: ['✅ מסכים עם ההמלצה', '3000K — אור חם', '4000K — אור ניטרלי', '6000K — אור קר']
  },
  {
    id: 'ceilingType',
    text: 'מה סוג התקרה בחדר?',
    opts: ['גבס', 'בטון/טיח', 'עץ', 'תקרה חשופה / בטון גלוי']
  },
  {
    id: 'roomSize',
    text: 'מה גודל החדר בערך?\n(נשתמש בזה לחישוב ההספק הנדרש)',
    opts: ['קטן — עד 12מ"ר', 'בינוני — 12–25מ"ר', 'גדול — מעל 25מ"ר']
  },
  {
    id: 'ipNeeded',
    text: 'האם הפרופיל יהיה קרוב למקור מים?\n(מקלחת, אדים, שפריץ ישיר)',
    opts: ['כן — מגע/אדים ממים', 'לא — אזור יבש'],
    skip: function (ans) {
      var wet = ['מטבח', 'שירותים/מקלחת', 'חוץ'];
      return wet.indexOf(ans.roomType) === -1;
    }
  }
];

// ── Flow State ───────────────────────────────────────────────────────────
var st = { open: false, answers: {} };

function startFlow() {
  st.answers = {};
  el('llcb-msgs').innerHTML = '';
  runQ(0);
}

function runQ(idx) {
  // skip questions whose skip() returns true
  while (idx < QUESTIONS.length && QUESTIONS[idx].skip && QUESTIONS[idx].skip(st.answers)) {
    idx++;
  }
  if (idx >= QUESTIONS.length) { renderResult(); return; }

  var q    = QUESTIONS[idx];
  var text = q.text;

  if (q.id === 'colorConfirm') {
    var rec = COLOR_TEMP[st.answers.roomType] || COLOR_TEMP['אחר'];
    text = 'לחדר מסוג **' + st.answers.roomType + '** אנחנו ממליצים על:\n\n'
      + '🌡️ **' + rec.k + ' — ' + rec.label + '**\n'
      + rec.reason + '.'
      + (rec.alt ? '\n\n💡 חלופה אפשרית: ' + rec.alt : '')
      + '\n\nהאם אתם מסכימים עם ההמלצה?';
  }

  botSay(text).then(function () {
    showOpts(q.opts, function (val) {
      st.answers[q.id] = val;
      runQ(idx + 1);
    });
  });
}

// ── Recommendation Engine ────────────────────────────────────────────────

function getColorResult(answers) {
  var confirm = answers.colorConfirm || '';
  if (confirm.indexOf('3000K') !== -1) return { k: '3000K', label: 'אור חם',     chosen: true };
  if (confirm.indexOf('4000K') !== -1) return { k: '4000K', label: 'אור ניטרלי', chosen: true };
  if (confirm.indexOf('6000K') !== -1) return { k: '6000K', label: 'אור קר',     chosen: true };
  var rec = COLOR_TEMP[answers.roomType] || COLOR_TEMP['אחר'];
  return { k: rec.k, label: rec.label, chosen: false };
}

function getProfileRecs(answers) {
  var ceiling = answers.ceilingType || 'בטון/טיח';
  var ipAns   = answers.ipNeeded   || '';
  var isWet   = ipAns.indexOf('כן') !== -1;
  var key     = isWet ? 'wet' : 'dry';

  var rules = PROFILE_RULES[ceiling] || PROFILE_RULES['בטון/טיח'];
  var ids   = rules[key] || rules['dry'];

  var productMap = (window.__PRODUCTS__ || []).reduce(function (m, p) {
    m[p.id] = p; return m;
  }, {});

  return ids.map(function (id) {
    var p    = productMap[id] || {};
    var meta = PROFILE_META[id] || {};
    return { id: id, name: p.name || '', img: p.img || '', url: p.url || '#', why: meta.why || '', note: meta.note || '' };
  }).filter(function (p) { return p.name !== ''; });
}

function calcPower(answers) {
  var room    = answers.roomType || 'אחר';
  var sizeKey = answers.roomSize || 'בינוני — 12–25מ"ר';
  var areaM2  = ROOM_SIZE[sizeKey] || 18;
  var tbl     = LUX_TABLE[room]    || LUX_TABLE['אחר'];

  var totalLm  = Math.round(tbl.lux * areaM2);
  var stripLmM = Math.round(tbl.wpm * tbl.eff);
  var stripM   = Math.ceil(totalLm / stripLmM);
  var totalW   = Math.round(tbl.wpm * stripM);

  var PSU_SIZES = [25, 50, 75, 100, 150, 200, 350];
  var minPsu    = Math.ceil(totalW * 1.25);
  var psuW      = PSU_SIZES.filter(function (s) { return s >= minPsu; })[0] || 350;

  return { lux: tbl.lux, wpm: tbl.wpm, areaM2: areaM2, totalLm: totalLm, stripM: stripM, totalW: totalW, psuW: psuW };
}

function buildWAText(answers, colorRes, profiles, power) {
  var main = profiles[0] || {};
  var alt  = profiles[1] ? '\n   חלופה: ' + profiles[1].name : '';
  return 'שלום LEDLink! 🌟\n'
    + 'יועץ התאורה המליץ לי על:\n\n'
    + '📍 חדר: '            + (answers.roomType    || '') + '\n'
    + '🌡️ גוון: '           + colorRes.k + ' — '  + colorRes.label + '\n'
    + '🏗️ תקרה: '           + (answers.ceilingType || '') + '\n'
    + '📐 פרופיל מומלץ: '   + (main.name          || '') + alt + '\n\n'
    + '⚡ חישוב הספק:\n'
    + '   שטח: '            + power.areaM2  + 'מ"ר\n'
    + '   עוצמת סטריפ: '    + power.wpm    + ' W/m\n'
    + '   אורך סטריפ נדרש: ~' + power.stripM + ' מטר\n'
    + '   הספק כולל: '      + power.totalW  + 'W\n'
    + '   ספק כוח מינימלי: ' + power.psuW   + 'W\n\n'
    + 'אשמח לייעוץ ואישור הזמנה 🙏';
}

// ── Result Renderer ──────────────────────────────────────────────────────

function renderResult() {
  var colorRes = getColorResult(st.answers);
  var profiles = getProfileRecs(st.answers);
  var power    = calcPower(st.answers);
  var main     = profiles[0];
  var alts     = profiles.slice(1);
  var waText   = buildWAText(st.answers, colorRes, profiles, power);
  var msgs     = el('llcb-msgs');

  botSay('מצאתי את הפתרון עבורכם 🎉 הנה הסיכום:').then(function () {

    // ── Layer A: Color temperature card ──
    var colorCard = document.createElement('div');
    colorCard.className = 'llcb-info-card';
    colorCard.innerHTML =
      '<div class="llcb-info-title">🌡️ גוון מומלץ: ' + colorRes.k + ' — ' + colorRes.label + '</div>'
      + '<div class="llcb-info-body">'
      + ((COLOR_TEMP[st.answers.roomType] || COLOR_TEMP['אחר']).reason) + '.'
      + '</div>';
    msgs.appendChild(colorCard);
    msgs.scrollTop = msgs.scrollHeight;

    // ── Layer B: Profile card ──
    if (!main) {
      botSay('לא נמצא פרופיל מתאים — פנו אלינו לייעוץ אישי!').then(function () {
        addWAOnlyBtn(waText);
        addRestartBtn();
      });
      return;
    }

    var profCard = document.createElement('div');
    profCard.className = 'llcb-card';
    profCard.innerHTML =
      '<img class="llcb-card-img" src="' + IMG_BASE + main.img + '" alt="' + main.name + '" onerror="this.style.display=\'none\'">'
      + '<div class="llcb-card-body">'
      +   '<div class="llcb-section-label">🔧 פרופיל מומלץ</div>'
      +   '<div class="llcb-card-name">' + main.name + '</div>'
      +   '<div class="llcb-card-why">✅ ' + main.why + '</div>'
      +   (main.note ? '<div class="llcb-card-note">📌 ' + main.note + '</div>' : '')
      +   '<div class="llcb-card-btns">'
      +     '<a class="llcb-btn-g" href="' + main.url + '" target="_blank">לדף המוצר</a>'
      +     '<a class="llcb-btn-w" href="https://wa.me/' + WA_NUM + '?text=' + encodeURIComponent(waText) + '" target="_blank">WhatsApp</a>'
      +   '</div>'
      + '</div>';
    msgs.appendChild(profCard);

    // Alternative mini cards
    if (alts.length) {
      var altLabel = document.createElement('div');
      altLabel.className = 'llcb-section-label';
      altLabel.style.padding = '4px 14px 6px';
      altLabel.textContent = 'חלופות מומלצות:';
      msgs.appendChild(altLabel);

      var row = document.createElement('div');
      row.className = 'llcb-mini-row';
      alts.forEach(function (p) {
        var a = document.createElement('a');
        a.className = 'llcb-mini';
        a.href = p.url; a.target = '_blank';
        a.innerHTML =
          '<img src="' + IMG_BASE + p.img + '" alt="' + p.name + '" onerror="this.style.display=\'none\'">'
          + '<div class="llcb-mini-nm">' + p.name + '</div>'
          + (p.why ? '<div class="llcb-mini-why">' + p.why.split('—')[0].trim() + '</div>' : '');
        row.appendChild(a);
      });
      msgs.appendChild(row);
    }

    // ── Layer C: Power calculation card ──
    var pwCard = document.createElement('div');
    pwCard.className = 'llcb-info-card llcb-power-card';
    pwCard.innerHTML =
      '<div class="llcb-info-title">⚡ חישוב הספק לחדרכם</div>'
      + '<div class="llcb-power-grid">'
      +   '<div class="llcb-pw-item"><span class="llcb-pw-label">תאורה נדרשת</span><span class="llcb-pw-val">' + power.lux + ' lux</span></div>'
      +   '<div class="llcb-pw-item"><span class="llcb-pw-label">שטח החדר</span><span class="llcb-pw-val">' + power.areaM2 + ' מ"ר</span></div>'
      +   '<div class="llcb-pw-item"><span class="llcb-pw-label">עוצמת סטריפ</span><span class="llcb-pw-val">' + power.wpm + ' W/m</span></div>'
      +   '<div class="llcb-pw-item"><span class="llcb-pw-label">אורך סטריפ נדרש</span><span class="llcb-pw-val">~' + power.stripM + ' מ\'</span></div>'
      +   '<div class="llcb-pw-item llcb-pw-highlight"><span class="llcb-pw-label">הספק כולל</span><span class="llcb-pw-val">' + power.totalW + 'W</span></div>'
      +   '<div class="llcb-pw-item llcb-pw-highlight"><span class="llcb-pw-label">ספק כוח מינימלי</span><span class="llcb-pw-val">' + power.psuW + 'W</span></div>'
      + '</div>'
      + '<a class="llcb-tool-link" href="calcpowerlast.html" target="_blank">🔧 לכלי חישוב ספק הכוח ←</a>';
    msgs.appendChild(pwCard);
    msgs.scrollTop = msgs.scrollHeight;

    addRestartBtn();
  });
}

function addWAOnlyBtn(waText) {
  var d = document.createElement('div');
  d.style.padding = '0 14px 10px';
  d.innerHTML = '<a class="llcb-btn-w" style="text-decoration:none;display:block;text-align:center;padding:10px;border-radius:12px;"'
    + ' href="https://wa.me/' + WA_NUM + '?text=' + encodeURIComponent(waText) + '" target="_blank">פנו אלינו ב-WhatsApp</a>';
  el('llcb-msgs').appendChild(d);
}

function addRestartBtn() {
  var d = document.createElement('div');
  d.className = 'llcb-restart';
  d.innerHTML = '<button onclick="window._llcbRestart()">🔄 התחל שיחה חדשה</button>';
  el('llcb-msgs').appendChild(d);
  el('llcb-msgs').scrollTop = el('llcb-msgs').scrollHeight;
}

// ── PLACEHOLDER: Task 5 will be appended here ─────────────────────────────

})(); // end IIFE
