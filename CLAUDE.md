# CLAUDE.md

זהו קובץ הדרכה ל-Claude Code (claude.ai/code) בעת עבודה בריפוזיטורי זה.

## כללי עבודה

- **כל הטקסט בממשק המשתמש בעברית**, כיוון RTL (`dir="rtl"`, `direction: rtl`)
- **אין build tools** — הפרויקט מורץ ישירות בדפדפן, ללא npm / webpack / vite
- **שרת מקומי**: `python -m http.server 8000` (ב-.claude/launch.json)
- **שומר בדפדפן**: פתח `http://localhost:8000/index.html` או `http://localhost:8000/home.html`

## מבנה הפרויקט

| קובץ | תפקיד |
|------|--------|
| `home.html` | דף נחיתה שיווקי — Hero, Stats, קטגוריות, יתרונות, CTA, Footer |
| `index.html` | קטלוג מוצרים — React 18 (CDN) + Babel + Tailwind CDN |
| `tools.html` | כלי תכנון הנדסיים — חמישה מחשבונים בReact בקובץ אחד |
| `catalog.html` | קטלוג דינמי מ-products_data.js (React) |
| `products_data.js` | 373 מוצרים — נטען כ-`window.__PRODUCTS__` |
| `datasheets_data.js` | מיפוי PDF לפי ID/שם מוצר |

## ארכיטקטורה — index.html וcatalog.html

React app בקובץ HTML אחד, ללא pre-transpile:

- **`<script type="text/babel">`** — כל הקומפוננטות בתוך תגית אחת
- **`IMG_BASE`** — קידומת לתמונות/PDF (כרגע `file:///C:/Users/guy/Downloads/ledlink/`)
- **`window.__PRODUCTS__`** — מערך המוצרים מ-products_data.js
- **`PRODUCT_DATASHEETS`** — מפתח PDF לפי product.id או product.name

**קומפוננטות מרכזיות (index.html):**
- `App` — state: activeTab, search, stripF (סינון סטריפ), psF (סינון פרופיל), selected (מוצר בחלון)
- `Navbar` — ניווט עם קישור לבית וכלים
- `ProductCard` / `ProductModal` — תצוגה וחלון מוצר
- `StripFilters` / `DriverFilters` / `ProfileFilters` — סינון sidebar לפי קטגוריה
- `SpecTags` — תגיות מפרט, נגזרות מ-`getStripMeta()` / `product.specs`

**קטגוריות:** `'פרופילים'` | `'סטריפ LED'` | `'דרייברים'`

**קומפוננטות (catalog.html):**
- `App` — state: activeTab (קטגוריה נוכחית), search (חיפוש טקסט), selected (מוצר פתוח)
- `CatalogNav` — ניווט בין קטגוריות
- `CatalogGrid` — רשת מוצרים עם סינון חיפוש
- `ProductModal` — חלון מוצר עם לינק datasheet

## ארכיטקטורה — tools.html

מחשבונים הנדסיים בקובץ אחד:

**מחשבונים (כקומפוננטות React):**
1. `VoltageDropCalc` — בדיקת מפל מתח בכבלים DC
2. `LumenCalc` — חישוב תאורה לפי EN 12464
3. `ROICalc` — חיסכון אנרגיה בעדכון LED
4. `BeamLinearCalc` — פיזור אלומה של גוף ליניארי
5. `BiologicalCalc` — Melanopic Lux (השפעה ביולוגית)

**מבנה App:**
- TOOLS array — רשימת כלים (id, label)
- TOOL_ITEMS — אותו דבר לתפריט mobile
- Navbar — ניווט עם dropdowns
- Tool tabs — בחירה בין מחשבונים
- Tool content — רינדור הקומפוננטה הנוכחית
- Footer — אתר ממפיל (כתובת, טלפון, שעות)

**WhatsApp integration:**
- כל מחשבון יוצר `waText` — טקסט שיתוף עם תוצאות
- קישור WhatsApp ב-`waLink()` — לשליחת הצעת מחיר

## מבנה מוצר

```js
{
  id: "ledlink-xxx",           // מזהה ייחודי
  name: "שם המוצר",            // עברית, עלול להכיל HTML entities
  img: "strips/xxx.jpg",       // נתיב יחסי מ-IMG_BASE
  desc: "...",                 // תיאור (סטריפ: שדות ב-|)
  category: "סטריפ LED",       // קטגוריה ראשית
  subCategory: "COB",          // אופציונלי
  url: "https://...",          // דף מוצר באתר
  specs: {                     // דרייברים בלבד
    power, voltage, ip, outputMode, inputVoltage, dimming: []
  }
}
```

## עיצוב וצבעים

- **צבע ראשי:** `#E8A020` (זהב)
- **צבע משנה:** `#C4880A` (זהב כהה)
- **טקסט:** `#1C1C1C` (שחור)
- **רקע:** `#F4F4F0` (בז' בהיר)
- **Navbar:** `#1A1A1A` (שחור כהה מאוד)
- **Font:** Heebo (Google Fonts)
- **RTL:** `dir="rtl"`, `direction: rtl` בכל דף

## נקודות חשובות

1. **נתיבי קבצים** — כרגע מוחלטים (`file:///C:/Users/guy/...`), צריך לשנות לnested relative paths לפני העלאה
2. **`IMG_BASE`** — נקודת ציון מרכזית לתמונות וPDF בכל דף
3. **`cleanName()`** — מנקה HTML entities משמות מוצרים (עברית)
4. **סינון סטריפ** — משלב `desc` ו-`specs` דרך `getStripMeta()`
5. **Datasheet lookup** — ראשית לפי `product.id`, אחר כך לפי `product.name`
6. **WhatsApp number** — `972524444470` קבוע ב-`WA_NUMBER` בכל דף
7. **React CDN** — אין build, Babel standalone הופך JSX בדפדפן
8. **URL parameters** — `tools.html?tool=circadian` לפתיחת מחשבון ספציפי, `catalog.html?tab=סטריפ LED`

## ניווט

- `home.html` → דף נחיתה
- `index.html` → קטלוג מוצרים
- `catalog.html` → קטלוג דינמי (בעתיד)
- `tools.html` → כלי תכנון (שלוש שיטות: navbar dropdown, mobile menu, tab bar)
- `guides.html` → מדריכים (עוד לא קיים)
- `about.html` → אודות (עוד לא קיים)

## זרימת עדכון

1. **עדכון מוצרים** → עדכן `products_data.js` + תמונות ב-IMG_BASE
2. **עדכון datasheet** → עדכן `datasheets_data.js`
3. **עדכון עיצוב** → קובע בתוך `<style>` בתוך `<head>`
4. **עדכון קומפוננטה** → edit בתוך `<script type="text/babel">`
5. **בדיקה** → פתח בדפדפן עם שרת מקומי

## טיפים

- RTL דורש `direction: rtl` ב-CSS ו-`dir="rtl"` בHTML
- Tailwind CDN תומך `direction:rtl` אבל צריך לנטר spacing
- React CDN (לא ESM) — אין import/export, כל האתר בקובץ אחד
- Babel standalone — JSX בדפדפן, ללא build
- חפש entities בעברית: `&nbsp;`, `&lrm;` (left-to-right mark לדיוק)
