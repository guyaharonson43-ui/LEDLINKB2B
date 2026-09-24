"""בונה את src/catalog/data/stripModels.js מדפי הנתונים של היצרן.

לכל סטריפ (קטגוריה "סטריפ LED", לא נאון) מוצאים את דף הנתונים (DS_*.pdf)
דרך datasheets_data.js, קוראים ממנו את צפיפות הלדים, סוג הלד, רוחב ה-PCB
(W1) ומקטע החיתוך (L2), ובוחרים את העמודה שההספק שלה הכי קרוב להספק המוצר.

הרצה: python3 scripts/build_strip_models.py   (דורש pymupdf)
"""
import json, re, pathlib
import pymupdf

ROOT = pathlib.Path(__file__).resolve().parent.parent
NUM = r'\d+(?:[.,]\d+)?'
CELL = rf'{NUM}(?:\s*\+\s*{NUM})?'


def load_products():
    s = (ROOT / 'products_data_with_lighting.js').read_text()
    s = s[s.index('['):s.rindex(']') + 1]
    return json.loads(s)


def load_datasheets():
    s = (ROOT / 'datasheets_data.js').read_text()
    out = {}
    for m in re.finditer(r'^\s*"([^"]+)":\s*\[(.*?)\],?\s*$', s, re.M):
        out[m.group(1)] = re.findall(r'file:\s*"([^"]+)"', m.group(2))
    return out


def text_of(pdf):
    try:
        d = pymupdf.open(ROOT / pdf)
    except Exception:
        return ''
    return ' '.join(re.sub(r'\s+', ' ', p.get_text()) for p in d)


def field(t, label, pat=CELL, stop=r'[A-Z][a-z]'):
    m = re.search(label, t)
    if not m:
        return []
    seg = t[m.end():m.end() + 160]
    cut = re.search(stop, seg)
    seg = seg[:cut.start()] if cut else seg
    return re.findall(pat, seg)


def num(x):
    return sum(float(v.replace(',', '.')) for v in re.findall(NUM, x))


def model_for(p, t):
    qty = field(t, r'Led Q\.?ty \(LEDs?/m\)')
    if not qty:
        return None
    types = field(t, r'Led Type', r'\b(?:\d{4}D?|COB|DOB|CSP)\b', stop=r'Power')
    power = field(t, r'Power \(W/M\)')
    w1 = field(t, r'W1\s*\(mm\)')
    l2 = [m.group(1) for m in re.finditer(rf'({NUM}) \((?:{NUM}\s*\+\s*)?{NUM} LED\)', t[t.find('L2'):t.find('L2') + 200])] if 'L2' in t else []

    watts = float(re.search(NUM, (p.get('desc') or '') + ' 0').group().replace(',', '.') or 0)
    col = 0
    if power and watts:
        col = min(range(len(power)), key=lambda i: abs(num(power[i]) - watts))
    pick = lambda arr: arr[min(col, len(arr) - 1)] if arr else None

    q = pick(qty)
    m = {'density': int(round(num(q)))}
    if '+' in q:
        m['alt'] = True                       # שני גוונים מתחלפים (Tunable/CT)
    lt = pick(types)
    if lt:
        lt = lt.rstrip('D')
        if lt in ('COB', 'DOB', 'CSP'):
            m['dob'] = True
        else:
            m['led'] = lt
    w = pick(w1)
    if w:
        m['widthMm'] = float(w.replace(',', '.'))
    c = pick(l2)
    if c:
        m['cutMm'] = float(c.replace(',', '.'))
    return m


# דף הנתונים של DOB הוא הדפסת אתר בלי טבלה — הנתונים מהדף הקטלוגי DOB.pdf
MANUAL = {
    'ledlink-strip-dob': {'dob': True, 'density': 288, 'cutMm': 27.7, 'source': 'DOB.pdf'},
}


def main():
    ds = load_datasheets()
    models, missing = {}, []
    for p in load_products():
        if p.get('category') != 'סטריפ LED':
            continue
        if re.match(r'^(ledlink-neon|qlt-n\d|qlt-nt|qlt-spi-neon)', p['id']) or p.get('subCategory') == 'Neon':
            continue
        files = ds.get(p['id']) or ds.get(p['name']) or []
        dsf = [f for f in files if '/DS_' in f] or files
        m = None
        for f in dsf:
            m = model_for(p, text_of(f))
            if m:
                m['source'] = pathlib.Path(f).name
                break
        m = MANUAL.get(p['id'], m)
        if m:
            models[p['id']] = m
        else:
            missing.append(p['id'])
    lines = ['// נוצר אוטומטית ע"י scripts/build_strip_models.py מדפי הנתונים של היצרן — לא לערוך ידנית.',
             '// density — לדים למטר (סה"כ), led — מארז, alt — שני גוונים מתחלפים, widthMm — W1, cutMm — L2.',
             'const STRIP_MODELS = {']
    for k, v in models.items():
        lines.append(f'  {json.dumps(k)}: {json.dumps(v, ensure_ascii=False)},')
    lines += ['};', '', 'export default STRIP_MODELS;', '']
    (ROOT / 'src/catalog/data/stripModels.js').write_text('\n'.join(lines))
    print(f'{len(models)} models, {len(missing)} without datasheet data:', ' '.join(missing))


if __name__ == '__main__':
    main()
