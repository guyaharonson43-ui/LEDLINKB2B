// נתוני בנייה של כל סטריפ לפי דף הנתונים של היצרן (datasheets/DS_*.pdf):
// led — סוג המארז, density — לדים למטר (סה"כ), rows — שורות לדים,
// alt — סטריפ דו-גווני (לדים חמים וקרים מתחלפים), widthMm — רוחב ה-PCB (W1),
// cutMm — מקטע חיתוך (L2). משמש את stripRender.js להדמיית המוצר.
const STRIP_MODELS = {
  // D24160CT — 80+80 לד/מ' 2835D, W1 10, L2 50 (4+4 לד)
  'ledlink-strip-15w':      { led: '2835', density: 160, alt: true, widthMm: 10, cutMm: 50 },
  // B24128A — 128 לד/מ' 2835, W1 10, L2 62.5 (8 לד)
  'ledlink-strip-ip65-16w': { led: '2835', density: 128, widthMm: 10, cutMm: 62.5 },
  // ST24560CT — 280+280 לד/מ' 2110 בשתי שורות, W1 10, L2 25 (7+7 לד)
  'ledlink-strip-50w':      { led: '2110', density: 560, rows: 2, alt: true, widthMm: 10, cutMm: 25 },
  // DOB — 288 לד/מ' תחת ציפוי חלבי, חיתוך 27.7
  'ledlink-strip-dob':      { dob: true, density: 288, widthMm: 10, cutMm: 27.7 },
  // ST24120AR — RGB 3535, 120 לד/מ'
  'qlt-st24120ar':          { led: '3535', color: 'rgb', density: 120, widthMm: 10, cutMm: 50 },
  // H24140I — 140 לד/מ' 2835, W1 10.5, L2 50 (7 לד), שרוול סיליקון
  'ledlink-strip-ip68-9w':  { led: '2835', density: 140, widthMm: 10.5, cutMm: 50 },
  // 3D — זיגזג, 60 לד/מ' 3528
  'ledlink-strip-zigzag':   { led: '3528', density: 60, zigzag: true, cutMm: 50 },
};

export default STRIP_MODELS;
