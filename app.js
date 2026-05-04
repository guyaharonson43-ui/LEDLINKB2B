
const { useState, useEffect, useRef, useMemo, useCallback } = React;

// ── Base path for images/datasheets (local dev) ──
const IMG_BASE = '';

// ── Analytics ──
function trackEvent(name, params) {
  if (typeof gtag === 'function') gtag('event', name, params || {});
}

// ── Helpers ──
function cleanName(s) {
  return (s || '').replace(/&#(\d+);/g, (_, n) => String.fromCharCode(+n)).replace(/&amp;/g, '&').replace(/&#038;/g, '&');
}

function imgSrc(path) {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  return IMG_BASE + path;
}

function pdfSrc(path) {
  if (!path) return null;
  return path;
}

// ── Strip metadata ──
function parseStripDesc(desc) {
  if (!desc) return {};
  const ipM = desc.match(/IP(\d+)/i);
  const wM = desc.match(/(\d+(?:\.\d+)?)\s*W/i);
  const isRGBW = /RGBW/i.test(desc),isRGB = !isRGBW && /RGB/i.test(desc);
  return {
    ip: ipM ? 'IP' + ipM[1] : '',
    power: wM ? parseFloat(wM[1]) : null,
    color: isRGBW ? 'RGBW' : isRGB ? 'RGB' : 'לבן',
    type: /COB/i.test(desc) ? 'COB' : /נאון/.test(desc) ? 'נאון' : /זיגזג/.test(desc) ? 'זיגזג' : /דיגיטלי/.test(desc) ? 'דיגיטלי' : 'סטנדרט'
  };
}
function getStripMeta(p) {
  const d = parseStripDesc(p.desc || '');
  const name = (p.name || '').toUpperCase();
  const sub = p.subCategory || '';
  const ip = p.specs?.ip || d.ip || '';
  const power = d.power !== undefined && d.power !== null ? d.power :
  p.specs?.power ? parseFloat(p.specs.power) : null;
  let color = d.color;
  if (!p.desc) {
    if (/RGBW/i.test(name)) color = 'RGBW';else
    if (/RGB/i.test(name) || sub === 'RGB') color = 'RGB';else
    color = 'לבן';
  }
  let type = d.type;
  if (type === 'סטנדרט') {
    if (sub === 'COB' || /COB|DOB/i.test(name)) type = 'COB';else
    if (sub === 'Neon' || /NEON/i.test(name) || /נאון/.test(name)) type = 'נאון';else
    if (sub === 'SPI' || /\bSPI\b/i.test(name)) type = 'דיגיטלי';else
    if (/3D/i.test(name)) type = 'זיגזג';
  }
  const voltage = p.specs?.voltage || p.specs?.inputVoltage || (
  (p.desc || '').match(/\b(12|24|48)V\b/)?.[0] ?? '');
  return { ip, power, type, color, voltage };
}

// ── Filter constants ──
const STRIP_IP_OPTIONS = ['הכל', 'IP20', 'IP65', 'IP67', 'IP68'];
const STRIP_TYPE_OPTIONS = ['הכל', 'סטנדרט', 'COB', 'נאון', 'זיגזג', 'דיגיטלי'];
const STRIP_COLOR_OPTIONS = ['הכל', 'לבן', 'RGB', 'RGBW'];
const STRIP_VOLTAGE_OPTIONS = ['הכל', '12V', '24V', '48V'];
const STRIP_POWER_RANGES = [
{ label: 'הכל', min: 0, max: 99999 }, { label: 'עד 10W', min: 0, max: 10 },
{ label: '10–15W', min: 10, max: 15 }, { label: '15–20W', min: 15, max: 20 }, { label: '20W+', min: 20, max: 99999 }];

const STRIP_LMW_RANGES = [
{ label: 'הכל', min: 0, max: 99999 }, { label: 'עד 100', min: 0, max: 100 },
{ label: '100–150', min: 100, max: 150 }, { label: '150–200', min: 150, max: 200 }, { label: '200+', min: 200, max: 99999 }];

const PS_VOLTAGE_OPTIONS = ['הכל', '12V', '24V', '48V'];
const PS_IP_OPTIONS = ['הכל', 'IP20', 'IP65', 'IP67', 'IP68'];
const PS_OUTPUT_OPTIONS = ['הכל', 'CV', 'CC', 'CV+CC'];
const PS_DIMMING_OPTIONS = ['הכל', 'DALI', '0-10V', 'PWM', 'TRIAC', 'Resistor', 'Push'];
const PS_POWER_RANGES = [
{ label: 'הכל', min: 0, max: 99999 }, { label: 'עד 30W', min: 0, max: 30 },
{ label: '30–60W', min: 30, max: 60 }, { label: '60–100W', min: 60, max: 100 },
{ label: '100–200W', min: 100, max: 200 }, { label: '200W+', min: 200, max: 99999 }];

const INIT_STRIP = { ip: 'הכל', type: 'הכל', color: 'הכל', voltage: 'הכל', power: 'הכל', lmw: 'הכל' };
const INIT_PS = { voltage: 'הכל', ip: 'הכל', output: 'הכל', dimming: 'הכל', power: 'הכל' };

// ── SVG Icons ──
const Icons = {
  search: /*#__PURE__*/React.createElement("svg", { width: "16", height: "16", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2" }, /*#__PURE__*/React.createElement("circle", { cx: "11", cy: "11", r: "8" }), /*#__PURE__*/React.createElement("line", { x1: "21", y1: "21", x2: "16.65", y2: "16.65" })),
  close: /*#__PURE__*/React.createElement("svg", { width: "18", height: "18", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2.5" }, /*#__PURE__*/React.createElement("line", { x1: "18", y1: "6", x2: "6", y2: "18" }), /*#__PURE__*/React.createElement("line", { x1: "6", y1: "6", x2: "18", y2: "18" })),
  phone: /*#__PURE__*/React.createElement("svg", { width: "15", height: "15", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2" }, /*#__PURE__*/React.createElement("path", { d: "M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.64 3.3 2 2 0 0 1 3.62 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.6a16 16 0 0 0 6 6l.96-.96a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" })),
  filter: /*#__PURE__*/React.createElement("svg", { width: "16", height: "16", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2" }, /*#__PURE__*/React.createElement("polygon", { points: "22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" })),
  wa: /*#__PURE__*/React.createElement("svg", { width: "16", height: "16", viewBox: "0 0 24 24", fill: "currentColor" }, /*#__PURE__*/React.createElement("path", { d: "M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z" })),
  download: /*#__PURE__*/React.createElement("svg", { width: "14", height: "14", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2" }, /*#__PURE__*/React.createElement("path", { d: "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" }), /*#__PURE__*/React.createElement("polyline", { points: "7 10 12 15 17 10" }), /*#__PURE__*/React.createElement("line", { x1: "12", y1: "15", x2: "12", y2: "3" })),
  external: /*#__PURE__*/React.createElement("svg", { width: "12", height: "12", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2" }, /*#__PURE__*/React.createElement("path", { d: "M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" }), /*#__PURE__*/React.createElement("polyline", { points: "15 3 21 3 21 9" }), /*#__PURE__*/React.createElement("line", { x1: "10", y1: "14", x2: "21", y2: "3" })),
  chevron: /*#__PURE__*/React.createElement("svg", { width: "14", height: "14", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2" }, /*#__PURE__*/React.createElement("polyline", { points: "6 9 12 15 18 9" }))
};

// ── Filter Chip ──
const Chip = ({ label, active, onClick }) => /*#__PURE__*/
React.createElement("button", { className: `filter-chip ${active ? 'active' : ''}`, onClick: onClick }, label);


// ── Product Image ──
const ProductImg = ({ src, name, tall }) => {
  const [err, setErr] = useState(false);
  const h = tall ? 'padding-top: 75%' : '';
  if (!src || err) return (/*#__PURE__*/
    React.createElement("div", { style: { paddingTop: tall ? '75%' : '65%', position: 'relative', background: '#F0EDE8' } }, /*#__PURE__*/
    React.createElement("div", { style: { position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' } }, /*#__PURE__*/
    React.createElement("span", { style: { fontSize: 11, color: '#CCCCCC', letterSpacing: 2 } }, "LEDLINK")
    )
    ));

  return (/*#__PURE__*/
    React.createElement("div", { style: { paddingTop: tall ? '75%' : '65%', position: 'relative', overflow: 'hidden' } }, /*#__PURE__*/
    React.createElement("img", {
      src: imgSrc(src),
      alt: name,
      loading: "lazy",
      decoding: "async",
      onError: () => setErr(true),
      style: { position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'contain', padding: '12px' } }
    )
    ));

};

// ── Spec Tags for product card ──
const SpecTags = ({ product }) => {
  const cat = product.category;
  const tags = [];
  if (cat === 'דרייברים') {
    if (product.specs?.power) tags.push({ label: product.specs.power, hi: true });
    if (product.specs?.voltage) tags.push({ label: product.specs.voltage });
    if (product.specs?.ip) tags.push({ label: product.specs.ip });
    if (product.specs?.outputMode) tags.push({ label: product.specs.outputMode });
    if (product.specs?.dimming?.length) tags.push({ label: product.specs.dimming[0] });
  } else if (cat === 'סטריפ LED') {
    const m = getStripMeta(product);
    if (m.power) tags.push({ label: m.power + 'W/m', hi: true });
    if (m.voltage) tags.push({ label: m.voltage });
    if (m.ip) tags.push({ label: m.ip });
    if (m.type && m.type !== 'סטנדרט') tags.push({ label: m.type });
    if (m.color !== 'לבן') tags.push({ label: m.color });
  } else if (cat === 'פרופילים') {
    const d = product.desc || '';
    const mkat = d.match(/מקט:\s*([^\s|]+)/);
    const mlen = d.match(/(?:אורך[^:]*:\s*)([^\s|]+)/);
    const mip = d.match(/IP(\d+)/i);
    if (mkat) tags.push({ label: mkat[1], hi: true });
    if (mip) tags.push({ label: 'IP' + mip[1] });
    if (mlen) tags.push({ label: mlen[1] });
  }
  if (!tags.length) return null;
  return (/*#__PURE__*/
    React.createElement("div", { style: { display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 8 } },
    tags.slice(0, 4).map((t, i) => /*#__PURE__*/
    React.createElement("span", { key: i, className: `spec-tag ${t.hi ? 'highlight' : ''}` }, t.label)
    )
    ));

};

// ── Skeleton Card ──
const SkeletonCard = () =>
  React.createElement("div", { className: "product-card", style: { pointerEvents: 'none' } },
    React.createElement("div", { className: "skeleton-pulse", style: { height: 180 } }),
    React.createElement("div", { style: { padding: '12px 14px 14px' } },
      React.createElement("div", { className: "skeleton-pulse", style: { height: 10, width: '40%', marginBottom: 8 } }),
      React.createElement("div", { className: "skeleton-pulse", style: { height: 13, width: '90%', marginBottom: 6 } }),
      React.createElement("div", { className: "skeleton-pulse", style: { height: 13, width: '70%', marginBottom: 14 } }),
      React.createElement("div", { className: "skeleton-pulse", style: { height: 10, width: '55%', marginBottom: 12 } }),
      React.createElement("div", { className: "skeleton-pulse", style: { height: 30, width: '100%' } })
    )
  );

// ── Product Card ──
const ProductCard = ({ product, onClick }) => /*#__PURE__*/
React.createElement("div", { className: "product-card", onClick: () => onClick(product) }, /*#__PURE__*/
React.createElement(ProductImg, { src: product.img, name: product.name }), /*#__PURE__*/
React.createElement("div", { style: { padding: '12px 14px 14px' } }, /*#__PURE__*/
React.createElement("div", { style: { fontSize: 12, color: '#999999', marginBottom: 4, letterSpacing: 1, textTransform: 'uppercase' } },
product.subCategory || product.category
), /*#__PURE__*/
React.createElement("div", { style: { fontSize: 14, fontWeight: 700, color: '#1C1C1C', lineHeight: 1.3, minHeight: 36 } },
product.name
), /*#__PURE__*/
React.createElement(SpecTags, { product: product }), /*#__PURE__*/
React.createElement("button", { className: "btn-outline", style: { marginTop: 12, width: '100%', fontSize: 13, padding: '7px 0' } }, "\u05E4\u05E8\u05D8\u05D9\u05DD \u05E0\u05D5\u05E1\u05E4\u05D9\u05DD"

)
)
);


// ── Strip Filters ──
const StripFilters = ({ filters, setFilters, count }) => {
  const hasActive = Object.values(filters).some((v) => v !== 'הכל');
  return (/*#__PURE__*/
    React.createElement("div", null, /*#__PURE__*/
    React.createElement("div", { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 } }, /*#__PURE__*/
    React.createElement("span", { style: { fontSize: 12, color: '#999999' } }, count, " \u05DE\u05D5\u05E6\u05E8\u05D9\u05DD"),
    hasActive && /*#__PURE__*/React.createElement("button", { onClick: () => setFilters({ ...INIT_STRIP }), style: { fontSize: 12, color: '#E8A020', background: 'none', border: 'none', cursor: 'pointer' } }, "\u05D0\u05D9\u05E4\u05D5\u05E1")
    ),
    [
    { title: 'סוג', options: STRIP_TYPE_OPTIONS, key: 'type' },
    { title: 'מתח', options: STRIP_VOLTAGE_OPTIONS, key: 'voltage' },
    { title: 'הגנה (IP)', options: STRIP_IP_OPTIONS, key: 'ip' },
    { title: 'צבע', options: STRIP_COLOR_OPTIONS, key: 'color' }].
    map(({ title, options, key }) => /*#__PURE__*/
    React.createElement("div", { key: key, style: { marginBottom: 20 } }, /*#__PURE__*/
    React.createElement("div", { style: { fontSize: 11, fontWeight: 700, color: '#999999', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 8 } }, title), /*#__PURE__*/
    React.createElement("div", { style: { display: 'flex', flexWrap: 'wrap', gap: 6 } },
    options.map((v) => /*#__PURE__*/React.createElement(Chip, { key: v, label: v, active: filters[key] === v, onClick: () => setFilters((f) => ({ ...f, [key]: v })) }))
    )
    )
    ), /*#__PURE__*/
    React.createElement("div", { style: { marginBottom: 20 } }, /*#__PURE__*/
    React.createElement("div", { style: { fontSize: 11, fontWeight: 700, color: '#999999', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 8 } }, "\u05D4\u05E1\u05E4\u05E7 (W/m)"), /*#__PURE__*/
    React.createElement("div", { style: { display: 'flex', flexWrap: 'wrap', gap: 6 } },
    STRIP_POWER_RANGES.map((r) => /*#__PURE__*/React.createElement(Chip, { key: r.label, label: r.label, active: filters.power === r.label, onClick: () => setFilters((f) => ({ ...f, power: r.label })) }))
    )
    ), /*#__PURE__*/
    React.createElement("div", { style: { marginBottom: 20 } }, /*#__PURE__*/
    React.createElement("div", { style: { fontSize: 11, fontWeight: 700, color: '#999999', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 8 } }, "\u05DC\u05D5\u05DE\u05DF/\u05D5\u05D5\u05D0\u05D8"), /*#__PURE__*/
    React.createElement("div", { style: { display: 'flex', flexWrap: 'wrap', gap: 6 } },
    STRIP_LMW_RANGES.map((r) => /*#__PURE__*/React.createElement(Chip, { key: r.label, label: r.label, active: filters.lmw === r.label, onClick: () => setFilters((f) => ({ ...f, lmw: r.label })) }))
    )
    )
    ));

};

// ── Driver Filters ──
const DriverFilters = ({ filters, setFilters, count }) => {
  const hasActive = Object.values(filters).some((v) => v !== 'הכל');
  return (/*#__PURE__*/
    React.createElement("div", null, /*#__PURE__*/
    React.createElement("div", { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 } }, /*#__PURE__*/
    React.createElement("span", { style: { fontSize: 12, color: '#999999' } }, count, " \u05DE\u05D5\u05E6\u05E8\u05D9\u05DD"),
    hasActive && /*#__PURE__*/React.createElement("button", { onClick: () => setFilters({ ...INIT_PS }), style: { fontSize: 12, color: '#E8A020', background: 'none', border: 'none', cursor: 'pointer' } }, "\u05D0\u05D9\u05E4\u05D5\u05E1")
    ),
    [
    { title: 'מתח פלט', options: PS_VOLTAGE_OPTIONS, key: 'voltage' },
    { title: 'הגנה (IP)', options: PS_IP_OPTIONS, key: 'ip' },
    { title: 'מצב פלט', options: PS_OUTPUT_OPTIONS, key: 'output' }].
    map(({ title, options, key }) => /*#__PURE__*/
    React.createElement("div", { key: key, style: { marginBottom: 20 } }, /*#__PURE__*/
    React.createElement("div", { style: { fontSize: 11, fontWeight: 700, color: '#999999', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 8 } }, title), /*#__PURE__*/
    React.createElement("div", { style: { display: 'flex', flexWrap: 'wrap', gap: 6 } },
    options.map((v) => /*#__PURE__*/React.createElement(Chip, { key: v, label: v, active: filters[key] === v, onClick: () => setFilters((f) => ({ ...f, [key]: v })) }))
    )
    )
    ), /*#__PURE__*/
    React.createElement("div", { style: { marginBottom: 20 } }, /*#__PURE__*/
    React.createElement("div", { style: { fontSize: 11, fontWeight: 700, color: '#999999', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 8 } }, "\u05E2\u05DE\u05E2\u05D5\u05DD"), /*#__PURE__*/
    React.createElement("div", { style: { display: 'flex', flexWrap: 'wrap', gap: 6 } },
    PS_DIMMING_OPTIONS.map((v) => /*#__PURE__*/React.createElement(Chip, { key: v, label: v, active: filters.dimming === v, onClick: () => setFilters((f) => ({ ...f, dimming: v })) }))
    )
    ), /*#__PURE__*/
    React.createElement("div", { style: { marginBottom: 20 } }, /*#__PURE__*/
    React.createElement("div", { style: { fontSize: 11, fontWeight: 700, color: '#999999', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 8 } }, "\u05D4\u05E1\u05E4\u05E7"), /*#__PURE__*/
    React.createElement("div", { style: { display: 'flex', flexWrap: 'wrap', gap: 6 } },
    PS_POWER_RANGES.map((r) => /*#__PURE__*/React.createElement(Chip, { key: r.label, label: r.label, active: filters.power === r.label, onClick: () => setFilters((f) => ({ ...f, power: r.label })) }))
    )
    )
    ));

};

// ── Profile Filters ──
const ProfileFilters = ({ count }) => /*#__PURE__*/
React.createElement("div", null, /*#__PURE__*/
React.createElement("div", { style: { fontSize: 12, color: '#999999', marginBottom: 20 } }, count, " \u05E4\u05E8\u05D5\u05E4\u05D9\u05DC\u05D9\u05DD"), /*#__PURE__*/
React.createElement("div", { style: { fontSize: 13, color: '#666666', lineHeight: 1.8 } }, /*#__PURE__*/
React.createElement("p", null, "\u05E4\u05E8\u05D5\u05E4\u05D9\u05DC\u05D9 LED \u05DE\u05D9\u05D5\u05E6\u05E8\u05D9\u05DD \u05D1\u05D4\u05D6\u05DE\u05E0\u05D4 \u05D0\u05D9\u05E9\u05D9\u05EA \u2014 \u05D0\u05D5\u05E8\u05DA, \u05E6\u05D1\u05E2 \u05D2\u05D9\u05DE\u05D5\u05E8 (\u05DC\u05D1\u05DF/\u05E9\u05D7\u05D5\u05E8/RAL), \u05D5\u05D3\u05D2\u05DD \u05DC\u05E4\u05D9 \u05D1\u05D7\u05D9\u05E8\u05D4."), /*#__PURE__*/
React.createElement("p", { style: { marginTop: 12 } }, "\u05DC\u05D9\u05D9\u05E2\u05D5\u05E5 \u05D5\u05D1\u05D7\u05D9\u05E8\u05EA \u05E4\u05E8\u05D5\u05E4\u05D9\u05DC:"), /*#__PURE__*/
React.createElement("a", { href: `https://wa.me/972524444470?text=${encodeURIComponent('שלום LEDLink, אני מעוניין/ת בפרופיל LED. אשמח לקבל ייעוץ.')}`, target: "_blank",
  style: { display: 'inline-flex', alignItems: 'center', gap: 6, color: '#E8A020', fontWeight: 700, marginTop: 8, textDecoration: 'none' } },
Icons.wa, " WhatsApp \u2190"
)
)
);


// ── Product Modal ──
const ProductModal = ({ product, onClose }) => {
  const ds = (typeof PRODUCT_DATASHEETS !== 'undefined' ? PRODUCT_DATASHEETS : {})[product.id] ||
  (typeof PRODUCT_DATASHEETS !== 'undefined' ? PRODUCT_DATASHEETS : {})[product.name] ||
  [];
  const cat = product.category;
  const [copied, setCopied] = useState(false);
  const copyLink = () => {
    const url = `${location.href.split('?')[0]}?product=${encodeURIComponent(product.id)}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const renderSpecs = () => {
    if (cat === 'דרייברים' && product.specs) {
      const s = product.specs;
      return (/*#__PURE__*/
        React.createElement("div", { style: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 16 } },
        [['הספק', s.power], ['מתח', s.voltage], ['IP', s.ip], ['מצב פלט', s.outputMode],
        ['מתח כניסה', s.inputVoltage], ['עמעום', s.dimming?.join(', ')]].filter(([, v]) => v).map(([k, v]) => /*#__PURE__*/
        React.createElement("div", { key: k, style: { background: '#F4F4F0', borderRadius: 6, padding: '10px 14px', border: '1px solid #E0DDD6' } }, /*#__PURE__*/
        React.createElement("div", { style: { fontSize: 10, color: '#999999', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 4 } }, k), /*#__PURE__*/
        React.createElement("div", { style: { fontSize: 14, fontWeight: 700, color: '#1C1C1C' } }, v)
        )
        )
        ));

    }
    if (cat === 'סטריפ LED') {
      const m = getStripMeta(product);
      const desc = product.desc || '';
      const lmwM = desc.match(/(\d+(?:\.\d+)?)\s*Lm\/W/i);
      const lmM = desc.match(/(\d+(?:\.\d+)?)\s*Lm\/m/i);
      const kelvinM = desc.match(/([\d\/]+)\s*K/);
      return (/*#__PURE__*/
        React.createElement("div", { style: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 16 } },
        [
        ['הספק', m.power ? m.power + 'W/m' : null],
        ['מתח', m.voltage],
        ['הגנה', m.ip],
        ['סוג', m.type],
        ['צבע', m.color],
        ['לומן/וואט', lmwM ? lmwM[1] + ' Lm/W' : null],
        ['לומן/מטר', lmM ? lmM[1] + ' Lm/m' : null],
        ['טמפרטורת צבע', kelvinM ? kelvinM[1] + 'K' : null]].
        filter(([, v]) => v).map(([k, v]) => /*#__PURE__*/
        React.createElement("div", { key: k, style: { background: '#F4F4F0', borderRadius: 6, padding: '10px 14px', border: '1px solid #E0DDD6' } }, /*#__PURE__*/
        React.createElement("div", { style: { fontSize: 10, color: '#999999', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 4 } }, k), /*#__PURE__*/
        React.createElement("div", { style: { fontSize: 14, fontWeight: 700, color: '#1C1C1C' } }, v)
        )
        )
        ));

    }
    if (cat === 'פרופילים' && product.desc) {
      const parts = product.desc.split('|').map((s) => s.trim()).filter(Boolean);
      return (/*#__PURE__*/
        React.createElement("div", { style: { marginTop: 16 } },
        parts.map((p, i) => /*#__PURE__*/
        React.createElement("div", { key: i, style: { borderBottom: '1px solid #E8E5E0', padding: '10px 0', fontSize: 14, color: '#444444' } }, p)
        )
        ));

    }
    return null;
  };

  return (/*#__PURE__*/
    React.createElement("div", { className: "modal-overlay", onClick: onClose }, /*#__PURE__*/
    React.createElement("div", { className: "modal-box", onClick: (e) => e.stopPropagation() }, /*#__PURE__*/

    React.createElement("div", { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '20px 24px', borderBottom: '1px solid #E8E5E0' } }, /*#__PURE__*/
    React.createElement("div", null, /*#__PURE__*/
    React.createElement("div", { style: { fontSize: 11, color: '#999999', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 4 } },
    product.subCategory || product.category
    ), /*#__PURE__*/
    React.createElement("h2", { style: { fontSize: 20, fontWeight: 800, color: '#1C1C1C', margin: 0 } }, product.name)
    ), /*#__PURE__*/
    React.createElement("button", { onClick: onClose, style: { background: 'none', border: 'none', cursor: 'pointer', color: '#AAAAAA', padding: 4, marginTop: 2 } },
    Icons.close
    )
    ), /*#__PURE__*/


    React.createElement("div", { style: { padding: '24px' } }, /*#__PURE__*/
    React.createElement("div", { style: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, alignItems: 'start' } }, /*#__PURE__*/

    React.createElement("div", { style: { borderRadius: 8, overflow: 'hidden', border: '1px solid #E0DDD6' } }, /*#__PURE__*/
    React.createElement(ProductImg, { src: product.img, name: product.name, tall: true })
    ), /*#__PURE__*/

    React.createElement("div", null,
    renderSpecs(),
    window.NeonSchematic && React.createElement(window.NeonSchematic, { product })
    )
    ),


    product.desc && cat !== 'פרופילים' && /*#__PURE__*/
    React.createElement("div", { style: { marginTop: 20, background: '#F4F4F0', borderRadius: 8, padding: '14px 16px', border: '1px solid #E0DDD6' } }, /*#__PURE__*/
    React.createElement("div", { style: { fontSize: 11, color: '#999999', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 8 } }, "\u05EA\u05D9\u05D0\u05D5\u05E8"), /*#__PURE__*/
    React.createElement("p", { style: { fontSize: 13, color: '#555555', lineHeight: 1.7, margin: 0 } }, product.desc)
    ),



    ds.length > 0 && /*#__PURE__*/
    React.createElement("div", { style: { marginTop: 20 } }, /*#__PURE__*/
    React.createElement("div", { style: { fontSize: 11, color: '#999999', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 10 } }, "\u05DE\u05E1\u05DE\u05DB\u05D9\u05DD \u05D8\u05DB\u05E0\u05D9\u05D9\u05DD"), /*#__PURE__*/
    React.createElement("div", { style: { display: 'flex', flexDirection: 'column', gap: 8 } },
    ds.map((d, i) => /*#__PURE__*/
    React.createElement("a", { key: i, href: pdfSrc(d.file), target: "_blank", rel: "noopener noreferrer", onClick: () => trackEvent('datasheet_download', { product_id: product.id, datasheet: d.file }),
      style: { display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', background: '#F4F4F0',
        border: '1px solid #E0DDD6', borderRadius: 6, color: '#E8A020', textDecoration: 'none',
        fontSize: 13, fontWeight: 600, transition: 'border-color 0.15s' },
      onMouseEnter: (e) => e.currentTarget.style.borderColor = '#E8A020',
      onMouseLeave: (e) => e.currentTarget.style.borderColor = '#E0DDD6' },
    Icons.download,
    d.label
    )
    )
    )
    ), /*#__PURE__*/



    React.createElement("div", { style: { display: 'flex', gap: 12, marginTop: 24 } }, /*#__PURE__*/
    React.createElement("a", { href: `https://wa.me/972524444470?text=${encodeURIComponent('שלום LEDLink, אשמח לקבל מחיר עבור: ' + product.name + ' (מק"ט: ' + product.id + ')')}`,
      target: "_blank", rel: "noopener noreferrer", className: "btn-gold",
      style: { flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, textDecoration: 'none' },
      onClick: () => trackEvent('whatsapp_click', { product_id: product.id, product_name: product.name }) },
    Icons.wa, " \u05D1\u05E7\u05E9 \u05DE\u05D7\u05D9\u05E8"
    ), /*#__PURE__*/
    React.createElement("button", { onClick: copyLink, className: "btn-outline",
      style: { display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', border: 'none' } },
    copied ? '✓ הועתק' : '🔗 העתק לינק'
    )
    )
    )
    )
    ));

};

// ── Configurator Modal (canvas wizard from new4.html) ──
const ConfiguratorModal = ({ onClose }) => {
  const wrapRef = useRef(null);

  // Initialize vanilla-JS configurator after mount
  useEffect(() => {
    let cleanup = null;
    if (wrapRef.current && window.initConfigurator) {
      cleanup = window.initConfigurator(wrapRef.current, onClose);
    }
    return () => {if (typeof cleanup === 'function') cleanup();};
  }, []);

  // Close on Escape
  useEffect(() => {
    const onKey = (e) => {if (e.key === 'Escape') onClose();};
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  // Lock body scroll
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {document.body.style.overflow = '';};
  }, []);

  return (/*#__PURE__*/
    React.createElement("div", { className: "cfg-overlay", onClick: onClose }, /*#__PURE__*/
    React.createElement("div", { style: { position: 'relative', width: '100%', maxWidth: 700 }, onClick: (e) => e.stopPropagation() }, /*#__PURE__*/
    React.createElement("div", { ref: wrapRef })
    )
    ));

};

// ── Navbar ──
const Navbar = ({ activeTab, setActiveTab }) => {
  const [openDrop, setOpenDrop] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);

  const CATALOG = [
  { label: 'דרייברים', tab: 'דרייברים' },
  { label: 'סטריפ LED', tab: 'סטריפ LED' },
  { label: 'פרופילים', tab: 'פרופילים' }];

  const TOOLS = [
  { label: '⚡ מפל מתח', url: 'tools.html?tool=voltage' },
  { label: '💡 לומן לחלל', url: 'tools.html?tool=lumen' },
  { label: '♻️ חיסכון אנרגיה', url: 'tools.html?tool=roi' },
  { label: '📏 פיזור אלומה', url: 'tools.html?tool=beam-linear' },
  { label: '🌙 מחשבון ביולוגי', url: 'tools.html?tool=circadian' },
  { label: '📐 פרופיל LED', url: 'tools.html?tool=linear' },
  { label: '🔌 ספק כוח', url: 'tools.html?tool=power' }];


  const dropBox = {
    position: 'absolute', top: '100%', right: 0,
    background: '#1A1A1A', border: '1px solid #333',
    borderTop: '2px solid #E8A020', borderRadius: '0 0 8px 8px',
    minWidth: 190, zIndex: 200, padding: '6px 0',
    boxShadow: '0 8px 24px rgba(0,0,0,0.3)'
  };

  return (/*#__PURE__*/
    React.createElement(React.Fragment, null, /*#__PURE__*/
    React.createElement("nav", { style: { background: '#1A1A1A', borderBottom: '1px solid #2A2A2A', position: 'sticky', top: 0, zIndex: 100, height: 64, display: 'flex', alignItems: 'center' } }, /*#__PURE__*/
    React.createElement("div", { style: { maxWidth: 1200, margin: '0 auto', padding: '0 32px', display: 'flex', alignItems: 'center', gap: 32, width: '100%' } }, /*#__PURE__*/
    React.createElement("a", { href: "index.html", style: { display: 'flex', alignItems: 'center', gap: 4, textDecoration: 'none', flexShrink: 0, direction: 'ltr' } }, /*#__PURE__*/
    React.createElement("span", { style: { fontSize: 22, fontWeight: 900, letterSpacing: 1, color: '#E8A020' } }, "LED"), /*#__PURE__*/
    React.createElement("span", { style: { fontSize: 22, fontWeight: 300, color: '#FFFFFF' } }, "LINK")
    ), /*#__PURE__*/
    React.createElement("div", { className: "nav-desktop-links", style: { display: 'flex', alignItems: 'center', gap: 4 } }, /*#__PURE__*/

    React.createElement("div", { style: { position: 'relative' }, onMouseEnter: () => setOpenDrop('catalog'), onMouseLeave: () => setOpenDrop(null) }, /*#__PURE__*/
    React.createElement("button", { style: { display: 'flex', alignItems: 'center', gap: 4, color: '#E8A020', background: 'rgba(232,160,32,0.1)', border: 'none', cursor: 'pointer', fontSize: 15, fontWeight: 700, padding: '6px 14px', borderRadius: 6, fontFamily: 'Heebo,sans-serif' } }, "\u05E7\u05D8\u05DC\u05D5\u05D2 \u05DE\u05D5\u05E6\u05E8\u05D9\u05DD ", /*#__PURE__*/
    React.createElement("span", { style: { fontSize: 10, transition: 'transform 0.2s', display: 'inline-block', transform: openDrop === 'catalog' ? 'rotate(180deg)' : 'none' } }, "\u25BE")
    ),
    openDrop === 'catalog' && /*#__PURE__*/
    React.createElement("div", { style: dropBox },
    CATALOG.map((item) => /*#__PURE__*/
    React.createElement("button", { key: item.tab, className: "nav-drop-item", onClick: () => {setActiveTab(item.tab);setOpenDrop(null);} },
    item.label
    )
    )
    )

    ), /*#__PURE__*/


    React.createElement("div", { style: { position: 'relative' }, onMouseEnter: () => setOpenDrop('tools'), onMouseLeave: () => setOpenDrop(null) }, /*#__PURE__*/
    React.createElement("a", { href: "tools.html", style: { display: 'flex', alignItems: 'center', gap: 4, color: '#AAAAAA', textDecoration: 'none', fontSize: 15, fontWeight: 500, padding: '6px 14px', borderRadius: 6 } }, "\u05DB\u05DC\u05D9 \u05EA\u05DB\u05E0\u05D5\u05DF ", /*#__PURE__*/
    React.createElement("span", { style: { fontSize: 10, transition: 'transform 0.2s', display: 'inline-block', transform: openDrop === 'tools' ? 'rotate(180deg)' : 'none' } }, "\u25BE")
    ),
    openDrop === 'tools' && /*#__PURE__*/
    React.createElement("div", { style: dropBox },
    TOOLS.map((item) => /*#__PURE__*/
    React.createElement("a", { key: item.url, href: item.url, className: "nav-drop-item" }, item.label)
    )
    )

    ), /*#__PURE__*/
    React.createElement("a", { href: "guides.html", style: { color: '#AAAAAA', textDecoration: 'none', fontSize: 15, fontWeight: 500, padding: '6px 14px', borderRadius: 6 } }, "\u05DE\u05D3\u05E8\u05D9\u05DB\u05D9\u05DD"), /*#__PURE__*/
    React.createElement("a", { href: "about.html", style: { color: '#AAAAAA', textDecoration: 'none', fontSize: 15, fontWeight: 500, padding: '6px 14px', borderRadius: 6 } }, "\u05D0\u05D5\u05D3\u05D5\u05EA"), /*#__PURE__*/
    React.createElement("a", { href: "index.html#contact", style: { color: '#AAAAAA', textDecoration: 'none', fontSize: 15, fontWeight: 500, padding: '6px 14px', borderRadius: 6 } }, "\u05E6\u05D5\u05E8 \u05E7\u05E9\u05E8")
    ), /*#__PURE__*/
    React.createElement("div", { style: { flex: 1 } }), /*#__PURE__*/
    React.createElement("button", { className: menuOpen ? 'hamburger open' : 'hamburger', "aria-label": "\u05EA\u05E4\u05E8\u05D9\u05D8", onClick: () => setMenuOpen((m) => !m) }, /*#__PURE__*/
    React.createElement("span", { className: "hamburger-line" }), /*#__PURE__*/
    React.createElement("span", { className: "hamburger-line" }), /*#__PURE__*/
    React.createElement("span", { className: "hamburger-line" })
    ), /*#__PURE__*/
    )
    ), /*#__PURE__*/


    React.createElement("div", { className: menuOpen ? 'mm-overlay open' : 'mm-overlay', onClick: () => setMenuOpen(false) }), /*#__PURE__*/


    React.createElement("div", { className: menuOpen ? 'mobile-menu open' : 'mobile-menu' }, /*#__PURE__*/
    React.createElement("div", { className: "mm-header" }, /*#__PURE__*/
    React.createElement("div", { style: { direction: 'ltr', display: 'flex', alignItems: 'center', gap: 3 } }, /*#__PURE__*/
    React.createElement("span", { style: { fontSize: 18, fontWeight: 900, color: '#E8A020' } }, "LED"), /*#__PURE__*/
    React.createElement("span", { style: { fontSize: 18, fontWeight: 300, color: '#fff' } }, "LINK")
    ), /*#__PURE__*/
    React.createElement("button", { className: "mm-close", onClick: () => setMenuOpen(false), "aria-label": "\u05E1\u05D2\u05D5\u05E8" }, "\u2715")
    ), /*#__PURE__*/
    React.createElement("div", { className: "mm-label" }, "\u05E7\u05D8\u05DC\u05D5\u05D2 \u05DE\u05D5\u05E6\u05E8\u05D9\u05DD"),
    CATALOG.map((item) => /*#__PURE__*/
    React.createElement("span", { key: item.tab, className: activeTab === item.tab ? 'mm-link active' : 'mm-link',
      onClick: () => {setActiveTab(item.tab);setMenuOpen(false);} },
    item.label
    )
    ), /*#__PURE__*/
    React.createElement("span", { className: "mm-link sub", style: { color: '#E8A020', display: 'flex', alignItems: 'center', gap: 8 },
      onClick: () => {setActiveTab('פרופילים');setShowCfg(true);setMenuOpen(false);} }, "\u270F\uFE0F \u05EA\u05DB\u05E0\u05DF \u05E4\u05E8\u05D5\u05E4\u05D9\u05DC \u05D1\u05D4\u05EA\u05D0\u05DE\u05D4 \u05D0\u05D9\u05E9\u05D9\u05EA"

    ), /*#__PURE__*/
    React.createElement("div", { className: "mm-divider" }), /*#__PURE__*/
    React.createElement("div", { className: "mm-label" }, "\u05DB\u05DC\u05D9\u05DD \u05D5\u05DE\u05D3\u05E8\u05D9\u05DB\u05D9\u05DD"), /*#__PURE__*/
    React.createElement("a", { href: "tools.html", className: "mm-link" }, "\u05DB\u05DC\u05D9 \u05EA\u05DB\u05E0\u05D5\u05DF"), /*#__PURE__*/
    React.createElement("a", { href: "tools.html?tool=voltage", className: "mm-link sub" }, "\u26A1 \u05DE\u05E4\u05DC \u05DE\u05EA\u05D7"), /*#__PURE__*/
    React.createElement("a", { href: "tools.html?tool=lumen", className: "mm-link sub" }, "\uD83D\uDCA1 \u05DC\u05D5\u05DE\u05DF \u05DC\u05D7\u05DC\u05DC"), /*#__PURE__*/
    React.createElement("a", { href: "tools.html?tool=roi", className: "mm-link sub" }, "\u267B\uFE0F \u05D7\u05D9\u05E1\u05DB\u05D5\u05DF \u05D0\u05E0\u05E8\u05D2\u05D9\u05D4"), /*#__PURE__*/
    React.createElement("a", { href: "tools.html?tool=beam-linear", className: "mm-link sub" }, "\uD83D\uDCCF \u05E4\u05D9\u05D6\u05D5\u05E8 \u05D0\u05DC\u05D5\u05DE\u05D4"), /*#__PURE__*/
    React.createElement("a", { href: "tools.html?tool=circadian", className: "mm-link sub" }, "\uD83C\uDF19 \u05DE\u05D7\u05E9\u05D1\u05D5\u05DF \u05D1\u05D9\u05D5\u05DC\u05D5\u05D2\u05D9"), /*#__PURE__*/
    React.createElement("a", { href: "tools.html?tool=linear", className: "mm-link sub" }, "\uD83D\uDCD0 \u05E4\u05E8\u05D5\u05E4\u05D9\u05DC LED"), /*#__PURE__*/
    React.createElement("a", { href: "tools.html?tool=power", className: "mm-link sub" }, "\uD83D\uDD0C \u05E1\u05E4\u05E7 \u05DB\u05D5\u05D7"), /*#__PURE__*/
    React.createElement("a", { href: "guides.html", className: "mm-link" }, "\u05DE\u05D3\u05E8\u05D9\u05DB\u05D9\u05DD"), /*#__PURE__*/
    React.createElement("div", { className: "mm-divider" }), /*#__PURE__*/
    React.createElement("a", { href: "about.html", className: "mm-link" }, "\u05D0\u05D5\u05D3\u05D5\u05EA"), /*#__PURE__*/
    React.createElement("a", { href: "index.html#contact", className: "mm-link", onClick: () => setMenuOpen(false) }, "\u05E6\u05D5\u05E8 \u05E7\u05E9\u05E8")
    )
    ));

};

// ── Category Header ──
const CategoryHeader = ({ label, count, desc }) => /*#__PURE__*/
React.createElement("div", { style: { marginBottom: 32 } }, /*#__PURE__*/
React.createElement("div", { style: { display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 8 } }, /*#__PURE__*/
React.createElement("h1", { style: { fontSize: 28, fontWeight: 800, color: '#1C1C1C', margin: 0 } }, label), /*#__PURE__*/
React.createElement("span", { style: { fontSize: 14, color: '#E8A020', fontWeight: 700 } }, count)
),
desc && /*#__PURE__*/React.createElement("p", { style: { fontSize: 14, color: '#777777', margin: 0, lineHeight: 1.6 } }, desc), /*#__PURE__*/
React.createElement("div", { style: { width: 40, height: 2, background: '#E8A020', marginTop: 12 } })
);


// ── Footer ──
const Footer = () => /*#__PURE__*/
React.createElement("footer", { className: "footer" }, /*#__PURE__*/
React.createElement("div", { className: "footer-inner" }, /*#__PURE__*/
React.createElement("div", { className: "footer-top" }, /*#__PURE__*/
React.createElement("div", null, /*#__PURE__*/
React.createElement("div", { style: { direction: 'ltr', display: 'inline-flex', alignItems: 'center', gap: '2px' } }, /*#__PURE__*/
React.createElement("span", { className: "footer-logo-led" }, "LED"), /*#__PURE__*/React.createElement("span", { className: "footer-logo-link" }, "LINK")
), /*#__PURE__*/
React.createElement("div", { className: "footer-tagline" }, "\u05E4\u05EA\u05E8\u05D5\u05E0\u05D5\u05EA \u05EA\u05D0\u05D5\u05E8\u05D4 \u05DE\u05E7\u05E6\u05D5\u05E2\u05D9\u05D9\u05DD \u05DC\u05E4\u05E8\u05D5\u05D9\u05E7\u05D8\u05D9\u05DD \u05D1\u05DB\u05DC \u05D2\u05D5\u05D3\u05DC. \u05D9\u05E9\u05D9\u05E8\u05D5\u05EA \u05DE\u05D4\u05DE\u05E4\u05E2\u05DC, \u05E8\u05D7\u05D5\u05D1\u05D5\u05EA.")
), /*#__PURE__*/
React.createElement("div", null, /*#__PURE__*/
React.createElement("div", { className: "footer-col-title" }, "\u05DB\u05EA\u05D5\u05D1\u05EA"), /*#__PURE__*/
React.createElement("div", { className: "footer-links" }, /*#__PURE__*/
React.createElement("span", { className: "footer-link" }, /*#__PURE__*/
React.createElement("svg", { width: "14", height: "14", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" }, /*#__PURE__*/React.createElement("path", { d: "M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" }), /*#__PURE__*/React.createElement("circle", { cx: "12", cy: "10", r: "3" })), "\u05D9\u05E6\u05D9\u05E8\u05D4 19, \u05E8\u05D7\u05D5\u05D1\u05D5\u05EA"

), /*#__PURE__*/
React.createElement("a", { href: "https://waze.com/ul?ll=31.8969,34.8186&navigate=yes", target: "_blank", className: "footer-link" }, /*#__PURE__*/
React.createElement("svg", { width: "14", height: "14", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" }, /*#__PURE__*/React.createElement("polygon", { points: "3 11 22 2 13 21 11 13 3 11" })), "\u05E0\u05D5\u05D5\u05D8 \u05D1-Waze"

)
)
), /*#__PURE__*/
React.createElement("div", null, /*#__PURE__*/
React.createElement("div", { className: "footer-col-title" }, "\u05E6\u05D5\u05E8 \u05E7\u05E9\u05E8"), /*#__PURE__*/
React.createElement("div", { className: "footer-links" }, /*#__PURE__*/
React.createElement("a", { href: "tel:+97286326059", className: "footer-link" }, /*#__PURE__*/
React.createElement("svg", { width: "14", height: "14", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" }, /*#__PURE__*/React.createElement("path", { d: "M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.4 2 2 0 0 1 3.6 1.22h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L7.91 8.8a16 16 0 0 0 6 6l1-1.06a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 21.72 16z" })), "08-632-6059"

), /*#__PURE__*/
React.createElement("a", { href: "mailto:office@ledlink.co.il", className: "footer-link" }, /*#__PURE__*/
React.createElement("svg", { width: "14", height: "14", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" }, /*#__PURE__*/React.createElement("path", { d: "M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" }), /*#__PURE__*/React.createElement("polyline", { points: "22,6 12,13 2,6" })), "office@ledlink.co.il"

), /*#__PURE__*/
React.createElement("a", { href: "https://wa.me/972524444470", target: "_blank", className: "footer-link" }, /*#__PURE__*/
React.createElement("svg", { width: "14", height: "14", viewBox: "0 0 24 24", fill: "currentColor" }, /*#__PURE__*/React.createElement("path", { d: "M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z" })), "WhatsApp"

)
)
), /*#__PURE__*/
React.createElement("div", null, /*#__PURE__*/
React.createElement("div", { className: "footer-col-title" }, "\u05E9\u05E2\u05D5\u05EA \u05E4\u05E2\u05D9\u05DC\u05D5\u05EA"), /*#__PURE__*/
React.createElement("div", { className: "footer-hours-row" }, /*#__PURE__*/React.createElement("span", { className: "hours-day" }, "\u05E8\u05D0\u05E9\u05D5\u05DF \u2013 \u05D7\u05DE\u05D9\u05E9\u05D9"), /*#__PURE__*/React.createElement("span", { className: "hours-open" }, "15:00 \u2013 07:00")), /*#__PURE__*/
React.createElement("div", { className: "footer-hours-row" }, /*#__PURE__*/React.createElement("span", { className: "hours-day" }, "\u05E9\u05D9\u05E9\u05D9"), /*#__PURE__*/React.createElement("span", { className: "hours-closed" }, "\u05E1\u05D2\u05D5\u05E8")), /*#__PURE__*/
React.createElement("div", { className: "footer-hours-row" }, /*#__PURE__*/React.createElement("span", { className: "hours-day" }, "\u05E9\u05D1\u05EA"), /*#__PURE__*/React.createElement("span", { className: "hours-closed" }, "\u05E1\u05D2\u05D5\u05E8"))
)
), /*#__PURE__*/
React.createElement("div", { className: "footer-bottom" }, /*#__PURE__*/
React.createElement("div", { className: "footer-copy" }, "\xA9 2026 LEDLink \u2013 \u05DB\u05DC \u05D4\u05D6\u05DB\u05D5\u05D9\u05D5\u05EA \u05E9\u05DE\u05D5\u05E8\u05D5\u05EA"), /*#__PURE__*/
React.createElement("div", { className: "footer-legal" }, /*#__PURE__*/
React.createElement("a", { href: "about.html" }, "\u05D0\u05D5\u05D3\u05D5\u05EA"), /*#__PURE__*/
React.createElement("a", { href: "takanon.html" }, "\u05EA\u05E7\u05E0\u05D5\u05DF"), /*#__PURE__*/
React.createElement("a", { href: "privacy.html" }, "\u05DE\u05D3\u05D9\u05E0\u05D9\u05D5\u05EA \u05E4\u05E8\u05D8\u05D9\u05D5\u05EA"), /*#__PURE__*/
React.createElement("a", { href: "accessibility.html" }, "\u05D4\u05E6\u05D4\u05E8\u05EA \u05E0\u05D2\u05D9\u05E9\u05D5\u05EA"), /*#__PURE__*/
React.createElement("a", { href: "faq.html" }, "\u05E9\u05D0\u05DC\u05D5\u05EA \u05E0\u05E4\u05D5\u05E6\u05D5\u05EA")
)
)
)
);


// ── Main App ──
const TABS = [
{ id: 'דרייברים', label: 'דרייברים', desc: 'ספקי מתח LED מאירופה — קבוע מתח, קבוע זרם, עמעום' },
{ id: 'סטריפ LED', label: 'סטריפ LED', desc: 'סטריפ LED באיכות גבוהה לכל שימוש — COB, Neon, RGB ועוד' },
{ id: 'פרופילים', label: 'פרופילים', desc: 'פרופילי אלומיניום לסטריפ LED — ייצור בהזמנה אישית' }];


const PAGE_SIZE = 30;

const App = () => {
  const [products, setProducts] = useState([]);
  const [activeTab, setActiveTab] = useState('דרייברים');
  const [selected, setSelected] = useState(null);
  const [search, setSearch] = useState('');
  const [recentSearches, setRecentSearches] = useState(() => {
    try { return JSON.parse(localStorage.getItem('ledlink_recent_searches') || '[]'); }
    catch { return []; }
  });
  const [stripF, setStripF] = useState({ ...INIT_STRIP });
  const [psF, setPsF] = useState({ ...INIT_PS });
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showCfg, setShowCfg] = useState(false);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (window.__PRODUCTS__) {
      const loaded = window.__PRODUCTS__.map((p) => ({ ...p, name: cleanName(p.name) }));
      setProducts(loaded);
      setLoading(false);
      const productId = params.get('product');
      if (productId) {
        const found = loaded.find((p) => p.id === decodeURIComponent(productId));
        if (found) {
          setSelected(found);
          setActiveTab(found.category);
        }
      }
    }
    const tab = params.get('tab');
    const initTab = tab || 'דרייברים';
    if (tab) setActiveTab(tab);
    // עיגון ה-state הראשוני בהיסטוריה
    window.history.replaceState({ tab: initTab }, '', window.location.href);
  }, []);

  // סנכרון כפתור חזור של הדפדפן
  useEffect(() => {
    const onPop = (e) => {
      const id = e.state && e.state.tab ||
      new URLSearchParams(window.location.search).get('tab') ||
      'דרייברים';
      setActiveTab(id);
      setSearch('');
      setStripF({ ...INIT_STRIP });
      setPsF({ ...INIT_PS });
      setPage(1);
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  const saveSearch = useCallback((q) => {
    q = (q || '').trim();
    if (q.length < 2) return;
    setRecentSearches((prev) => {
      const next = [q, ...prev.filter((s) => s !== q)].slice(0, 5);
      localStorage.setItem('ledlink_recent_searches', JSON.stringify(next));
      return next;
    });
  }, []);

  const removeRecent = useCallback((q) => {
    setRecentSearches((prev) => {
      const next = prev.filter((s) => s !== q);
      localStorage.setItem('ledlink_recent_searches', JSON.stringify(next));
      return next;
    });
  }, []);

  // Switch tab: reset search + filters + pushState
  const switchTab = useCallback((id) => {
    setActiveTab(id);
    setSearch('');
    setStripF({ ...INIT_STRIP });
    setPsF({ ...INIT_PS });
    setSidebarOpen(false);
    setPage(1);
    const url = new URL(window.location.href);
    url.searchParams.set('tab', id);
    window.history.pushState({ tab: id }, '', url.toString());
  }, []);

  const filtered = useMemo(() => {
    let r = products.filter((p) => p.category === activeTab);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      r = r.filter((p) => p.name.toLowerCase().includes(q) || (p.desc || '').toLowerCase().includes(q));
    }
    if (activeTab === 'סטריפ LED') {
      r = r.filter((p) => {
        const m = getStripMeta(p);
        if (stripF.ip !== 'הכל' && m.ip !== stripF.ip) return false;
        if (stripF.type !== 'הכל' && m.type !== stripF.type) return false;
        if (stripF.color !== 'הכל' && m.color !== stripF.color) return false;
        if (stripF.voltage !== 'הכל' && m.voltage !== stripF.voltage) return false;
        if (stripF.power !== 'הכל') {
          const range = STRIP_POWER_RANGES.find((x) => x.label === stripF.power);
          if (range && (m.power === null || m.power < range.min || m.power > range.max)) return false;
        }
        if (stripF.lmw !== 'הכל') {
          const desc = p.desc || '';
          const lmwM = desc.match(/(\d+(?:\.\d+)?)\s*Lm\/W/i);
          const val = lmwM ? parseFloat(lmwM[1]) : null;
          const range = STRIP_LMW_RANGES.find((x) => x.label === stripF.lmw);
          if (range && (val === null || val < range.min || val > range.max)) return false;
        }
        return true;
      });
    }
    if (activeTab === 'דרייברים') {
      r = r.filter((p) => {
        const s = p.specs || {};
        if (psF.voltage !== 'הכל' && s.voltage !== psF.voltage) return false;
        if (psF.ip !== 'הכל' && s.ip !== psF.ip) return false;
        if (psF.output !== 'הכל' && s.outputMode !== psF.output) return false;
        if (psF.dimming !== 'הכל' && !(s.dimming || []).some((d) => d.toLowerCase().includes(psF.dimming.toLowerCase()))) return false;
        if (psF.power !== 'הכל') {
          const range = PS_POWER_RANGES.find((x) => x.label === psF.power);
          const pw = s.power ? parseFloat(s.power) : null;
          if (range && (pw === null || pw < range.min || pw > range.max)) return false;
        }
        return true;
      });
    }
    return r;
  }, [products, activeTab, search, stripF, psF]);

  useEffect(() => { setPage(1); }, [filtered]);

  const visibleProducts = filtered.slice(0, page * PAGE_SIZE);
  const hasMore = visibleProducts.length < filtered.length;

  const openProduct = useCallback((p) => {
    trackEvent('product_view', { product_id: p.id, product_name: p.name, category: p.category });
    setSelected(p);
  }, []);

  const tabInfo = TABS.find((t) => t.id === activeTab);
  const showFilters = activeTab !== 'פרופילים';

  const renderSidebar = () => {
    if (activeTab === 'פרופילים') return /*#__PURE__*/React.createElement(ProfileFilters, { count: filtered.length });
    if (activeTab === 'סטריפ LED') return /*#__PURE__*/React.createElement(StripFilters, { filters: stripF, setFilters: setStripF, count: filtered.length });
    if (activeTab === 'דרייברים') return /*#__PURE__*/React.createElement(DriverFilters, { filters: psF, setFilters: setPsF, count: filtered.length });
  };

  return (/*#__PURE__*/
    React.createElement("div", { style: { minHeight: '100vh', background: '#F4F4F0' } }, /*#__PURE__*/
    React.createElement(Navbar, { activeTab: activeTab, setActiveTab: switchTab }), /*#__PURE__*/


    React.createElement("div", { style: { borderBottom: '1px solid #E0DDD6', background: '#FFFFFF', position: 'sticky', top: 64, zIndex: 90, boxShadow: '0 1px 4px rgba(0,0,0,0.04)' } }, /*#__PURE__*/
    React.createElement("div", { style: { maxWidth: 1280, margin: '0 auto', padding: '0 24px', display: 'flex', gap: 0 } },
    TABS.map((t) => {
      const cnt = products.filter((p) => p.category === t.id).length;
      const active = activeTab === t.id;
      return (/*#__PURE__*/
        React.createElement("button", { key: t.id, onClick: () => switchTab(t.id),
          className: "tab-button",
          style: {
            padding: '16px 24px',
            border: 'none',
            borderBottom: active ? '2px solid #E8A020' : '2px solid transparent',
            background: 'none', cursor: 'pointer',
            color: active ? '#E8A020' : '#777777',
            fontFamily: 'Heebo,sans-serif',
            fontSize: 14, fontWeight: 700,
            transition: 'all 0.15s',
            display: 'flex', alignItems: 'center', gap: 8
          } },
        t.label, /*#__PURE__*/
        React.createElement("span", { style: { fontSize: 11, background: active ? 'rgba(232,160,32,0.12)' : '#F0EDE8',
            color: active ? '#E8A020' : '#999999',
            padding: '1px 7px', borderRadius: 20, fontWeight: 700 } },
        cnt
        )
        ));

    })
    )
    ), /*#__PURE__*/


    React.createElement("div", { className: "catalog-content-pad", style: { maxWidth: 1280, margin: '0 auto', padding: '40px 24px' } }, /*#__PURE__*/


    React.createElement(CategoryHeader, { label: tabInfo.label, count: filtered.length, desc: tabInfo.desc }), /*#__PURE__*/


    React.createElement("div", { style: { display: 'flex', gap: 12, marginBottom: 32, alignItems: 'center' } }, /*#__PURE__*/
    React.createElement("div", { style: { position: 'relative', flex: 1, maxWidth: 400 } }, /*#__PURE__*/
    React.createElement("input", {
      type: "text",
      placeholder: `חיפוש ב${tabInfo.label}...`,
      value: search,
      onChange: (e) => setSearch(e.target.value),
      onBlur: () => saveSearch(search),
      onKeyDown: (e) => e.key === 'Enter' && saveSearch(search),
      className: "search-input" }
    ), /*#__PURE__*/
    search && React.createElement("button", {
      onClick: () => { saveSearch(search); setSearch(''); },
      style: { position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
        background: 'none', border: 'none', cursor: 'pointer', color: '#AAAAAA',
        padding: 4, display: 'flex', alignItems: 'center', lineHeight: 1 },
      'aria-label': 'נקה חיפוש'
    },
    React.createElement("svg", { width: "14", height: "14", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2.5" },
      React.createElement("line", { x1: "18", y1: "6", x2: "6", y2: "18" }),
      React.createElement("line", { x1: "6", y1: "6", x2: "18", y2: "18" })
    )), /*#__PURE__*/
    React.createElement("span", { style: { position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#BBBBBB', pointerEvents: 'none' } },
    Icons.search
    )
    ),
    showFilters && /*#__PURE__*/
    React.createElement("button", { onClick: () => setSidebarOpen((o) => !o),
      className: "btn-outline",
      style: { display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, display: 'none' },
      id: "mobile-filter-btn" },
    Icons.filter, " \u05E1\u05D9\u05E0\u05D5\u05DF"
    )

    ), /*#__PURE__*/

    !search && recentSearches.length > 0 && React.createElement("div", {
      style: { display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20, flexWrap: 'wrap' }
    },
      React.createElement("span", { style: { fontSize: 12, color: '#999999', flexShrink: 0 } }, "חיפושים אחרונים:"),
      recentSearches.map((q) => React.createElement("span", {
        key: q,
        onClick: () => setSearch(q),
        style: { display: 'inline-flex', alignItems: 'center', gap: 4, background: '#FFFFFF',
          border: '1px solid #E0DDD6', borderRadius: 20, padding: '3px 10px 3px 6px',
          fontSize: 12, color: '#555555', cursor: 'pointer' }
      },
        q,
        React.createElement("button", {
          onClick: (e) => { e.stopPropagation(); removeRecent(q); },
          style: { background: 'none', border: 'none', cursor: 'pointer', color: '#BBBBBB',
            padding: 0, display: 'flex', alignItems: 'center', marginRight: 2 },
          'aria-label': 'הסר'
        }, React.createElement("svg", { width: "10", height: "10", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2.5" },
          React.createElement("line", { x1: "18", y1: "6", x2: "6", y2: "18" }),
          React.createElement("line", { x1: "6", y1: "6", x2: "18", y2: "18" })
        ))
      ))
    ), /*#__PURE__*/


    React.createElement("div", { className: showFilters ? 'catalog-layout with-sidebar' : 'catalog-layout no-sidebar' },


    showFilters && /*#__PURE__*/
    React.createElement("div", { className: "sidebar-mobile-hidden", style: { background: '#FFFFFF', border: '1px solid #E0DDD6', borderRadius: 10, padding: '24px 20px', position: 'sticky', top: 130, boxShadow: '0 2px 8px rgba(0,0,0,0.04)' } }, /*#__PURE__*/
    React.createElement("div", { style: { display: 'flex', alignItems: 'center', gap: 8, marginBottom: 24, paddingBottom: 16, borderBottom: '1px solid #E8E5E0' } }, /*#__PURE__*/
    React.createElement("span", { style: { color: '#E8A020' } }, Icons.filter), /*#__PURE__*/
    React.createElement("span", { style: { fontSize: 13, fontWeight: 700, color: '#1C1C1C' } }, "\u05E1\u05D9\u05E0\u05D5\u05DF")
    ),
    renderSidebar()
    ), /*#__PURE__*/



    React.createElement("div", null,
    activeTab === 'פרופילים' && /*#__PURE__*/
    React.createElement("div", { style: { marginBottom: 24, background: '#FFFFFF', border: '1px solid #E0DDD6', borderRadius: 10, padding: '20px 24px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' } }, /*#__PURE__*/
    React.createElement(ProfileFilters, { count: filtered.length }), /*#__PURE__*/

    React.createElement("div", { className: "cfg-cta-card", onClick: () => setShowCfg(true) }, /*#__PURE__*/
    React.createElement("div", { style: { display: 'flex', alignItems: 'center', gap: 14 } }, /*#__PURE__*/
    React.createElement("div", { style: { width: 44, height: 44, background: 'rgba(232,160,32,0.15)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 } }, "\u270F\uFE0F"), /*#__PURE__*/
    React.createElement("div", { style: { flex: 1 } }, /*#__PURE__*/
    React.createElement("div", { style: { fontSize: 14, fontWeight: 800, color: '#1C1C1C', marginBottom: 3 } }, "\u05EA\u05DB\u05E0\u05DF \u05E4\u05E8\u05D5\u05E4\u05D9\u05DC \u05D1\u05D4\u05EA\u05D0\u05DE\u05D4 \u05D0\u05D9\u05E9\u05D9\u05EA"), /*#__PURE__*/
    React.createElement("div", { style: { fontSize: 12, color: '#777777', lineHeight: 1.4 } }, "\u05E9\u05E8\u05D8\u05D5\u05D8 \u05DE\u05D9\u05D3\u05D5\u05EA, \u05D1\u05D7\u05D9\u05E8\u05EA \u05D2\u05D9\u05DE\u05D5\u05E8 \u05D5-BOM \u05D0\u05D5\u05D8\u05D5\u05DE\u05D8\u05D9 \u2014 \u05D0\u05E8\u05D1\u05E2\u05D4 \u05E9\u05DC\u05D1\u05D9\u05DD \u05E4\u05E9\u05D5\u05D8\u05D9\u05DD")
    ), /*#__PURE__*/
    React.createElement("div", { style: { color: '#E8A020', fontSize: 22, flexShrink: 0 } }, "\u2190")
    )
    )
    ),

    loading ? /*#__PURE__*/
    React.createElement("div", { className: "products-grid" },
      Array.from({ length: 12 }).map((_, i) => React.createElement(SkeletonCard, { key: i }))
    ) :
    filtered.length === 0 ? /*#__PURE__*/
    React.createElement("div", { style: { textAlign: 'center', padding: '80px 0', color: '#BBBBBB' } }, /*#__PURE__*/
    React.createElement("div", { style: { fontSize: 48, marginBottom: 16 } }, "\u25EF"), /*#__PURE__*/
    React.createElement("div", { style: { fontSize: 16, color: '#888888' } }, "\u05DC\u05D0 \u05E0\u05DE\u05E6\u05D0\u05D5 \u05DE\u05D5\u05E6\u05E8\u05D9\u05DD"), /*#__PURE__*/
    React.createElement("button", { onClick: () => {setSearch('');setStripF({ ...INIT_STRIP });setPsF({ ...INIT_PS });},
      style: { marginTop: 16, color: '#E8A020', background: 'none', border: 'none', cursor: 'pointer', fontSize: 14 } }, "\u05E0\u05E7\u05D4 \u05E1\u05D9\u05E0\u05D5\u05DF"

    )
    ) : /*#__PURE__*/

    React.createElement("div", null,
    React.createElement("div", { className: "products-grid" },
    visibleProducts.map((p) => /*#__PURE__*/
    React.createElement(ProductCard, { key: p.id, product: p, onClick: openProduct })
    )),
    hasMore && /*#__PURE__*/React.createElement("div", { style: { textAlign: 'center', padding: '32px 0 16px' } }, /*#__PURE__*/
      React.createElement("button", {
        onClick: () => setPage((p) => p + 1),
        style: { background: '#1C1C1C', color: '#fff', border: 'none', borderRadius: 8, padding: '12px 32px', fontSize: 15, fontWeight: 600, cursor: 'pointer', fontFamily: 'Heebo, sans-serif' }
      }, `הצג עוד (${filtered.length - visibleProducts.length} נותרו)`)
    )
    )

    )
    )
    ), /*#__PURE__*/

    React.createElement(Footer, null),


    selected && /*#__PURE__*/React.createElement(ProductModal, { product: selected, onClose: () => {setSelected(null);history.replaceState(null, '', location.pathname + (activeTab ? '?tab=' + encodeURIComponent(activeTab) : ''));} }),


    showCfg && /*#__PURE__*/React.createElement(ConfiguratorModal, { onClose: () => setShowCfg(false) })
    ));

};

ReactDOM.createRoot(document.getElementById('root')).render(/*#__PURE__*/React.createElement(App, null));