function parseStripDesc(desc) {
  if (!desc) return {};
  const ipM    = desc.match(/IP(\d+)/i);
  const wM     = desc.match(/(\d+(?:\.\d+)?)\s*W/i);
  const isRGBW = /RGBW/i.test(desc);
  const isRGB  = !isRGBW && /RGB/i.test(desc);
  return {
    ip:    ipM ? 'IP' + ipM[1] : '',
    power: wM  ? parseFloat(wM[1]) : null,
    color: isRGBW ? 'RGBW' : isRGB ? 'RGB' : 'לבן',
    type:  /COB/i.test(desc) ? 'COB'
         : /נאון/.test(desc) ? 'נאון'
         : /זיגזג/.test(desc) ? 'זיגזג'
         : /דיגיטלי/.test(desc) ? 'דיגיטלי'
         : 'סטנדרט',
  };
}

export function getStripMeta(p) {
  const d    = parseStripDesc(p.desc || '');
  const name = (p.name || '').toUpperCase();
  const sub  = p.subCategory || '';
  const ip   = p.specs?.ip || d.ip || '';

  const power = (d.power !== undefined && d.power !== null)
    ? d.power
    : p.specs?.power ? parseFloat(p.specs.power) : null;

  let color = d.color;
  if (!p.desc) {
    if (/RGBW/i.test(name))               color = 'RGBW';
    else if (/RGB/i.test(name) || sub === 'RGB') color = 'RGB';
    else                                   color = 'לבן';
  }

  let type = d.type;
  if (type === 'סטנדרט') {
    if      (sub === 'COB'  || /COB|DOB/i.test(name))              type = 'COB';
    else if (sub === 'Neon' || /NEON/i.test(name) || /נאון/.test(name)) type = 'נאון';
    else if (sub === 'SPI'  || /\bSPI\b/i.test(name))              type = 'דיגיטלי';
    else if (/3D/i.test(name))                                      type = 'זיגזג';
  }

  const voltage = p.specs?.voltage || p.specs?.inputVoltage
    || ((p.desc || '').match(/\b(12|24|48)V\b/)?.[0] ?? '');

  return { ip, power, type, color, voltage };
}
