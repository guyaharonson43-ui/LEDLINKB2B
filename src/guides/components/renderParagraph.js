// src/guides/components/renderParagraph.js
export function renderParagraph(text, links) {
  if (!links || links.length === 0) return text;
  let parts = [text];
  links.forEach(({ word, url }, li) => {
    parts = parts.flatMap((part, pi) => {
      if (typeof part !== 'string') return [part];
      const idx = part.indexOf(word);
      if (idx === -1) return [part];
      return [
        part.slice(0, idx),
        <a key={`l${li}-${pi}`} href={url}
          style={{ color: '#E8A020', fontWeight: 600, textDecoration: 'underline', textUnderlineOffset: '3px' }}>
          {word}
        </a>,
        part.slice(idx + word.length),
      ].filter(x => x !== '');
    });
  });
  return parts;
}
