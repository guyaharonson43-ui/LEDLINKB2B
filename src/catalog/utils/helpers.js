export function trackEvent(name, params) {
  if (typeof gtag === 'function') gtag('event', name, params || {});
}

export function cleanName(s) {
  return (s || '')
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(+n))
    .replace(/&amp;/g, '&')
    .replace(/&#038;/g, '&');
}

export function imgSrc(path) {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  return path;
}

export function pdfSrc(path) {
  return path || null;
}
