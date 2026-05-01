# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## כללי עבודה

- כל הטקסט בממשק המשתמש בעברית, כיוון RTL (`dir="rtl"`, `direction: rtl`)
- אין build tools — הפרויקט מורץ ישירות בדפדפן, ללא npm / webpack / vite
- אין צורך בהרצת שרת; פותחים את הקבצים ישירות בדפדפן (`file://`)

## מבנה הפרויקט

שני דפים נפרדים שמקושרים זה לזה:

| קובץ | תפקיד |
|------|--------|
| `home.html` | דף נחיתה שיווקי — Hero, Stats, קטגוריות, יתרונות, CTA, Footer |
| `index.html` | קטלוג מוצרים — React 18 (CDN) + Babel standalone + Tailwind CDN |
| `products_data.js` | 373 מוצרים — נטען כ-`window.__PRODUCTS__` |
| `datasheets_data.js` | מפתח PDF לפי שם/ID מוצר — נטען כ-`PRODUCT_DATASHEETS` |

## ארכיטקטורה של index.html

React app שלם בקובץ HTML אחד, ללא transpile מקדים:

- **`<script type="text/babel">`** — כל הקומפוננטות בתוך תגית אחת
- **`IMG_BASE`** — קידומת לנתיבי תמונות/PDF (כרגע `file:///C:/Users/guy/Downloads/ledlink/`)
- **`window.__PRODUCTS__`** — מערך המוצרים מ-`products_data.js`
- **`PRODUCT_DATASHEETS`** — אובייקט מ-`datasheets_data.js`, מפתח לפי `product.id` או `product.name`

**קומפוננטות מרכזיות:**
- `App` — state ראשי: `activeTab`, `search`, `stripF`, `psF`, `selected`
- `Navbar` — ניווט עם לינק חזרה ל-`home.html`
- `ProductCard` / `ProductModal` — תצוגת מוצר וחלון מוצר
- `StripFilters` / `DriverFilters` / `ProfileFilters` — sidebar סינון לפי קטגוריה
- `SpecTags` — תגיות מפרט על הכרטיס, נגזרות מ-`getStripMeta()` / `product.specs`

**קטגוריות מוצר:** `'פרופילים'` | `'סטריפ LED'` | `'דרייברים'`

## מבנה מוצר ב-products_data.js

```js
{
  id: "ledlink-xxx",       // מזהה ייחודי
  name: "שם מוצר",         // עברית, עלול להכיל HTML entities
  img: "strips/xxx.jpg",   // נתיב יחסי מ-IMG_BASE
  desc: "...",             // תיאור חופשי (פרופילים: שדות מופרדים ב-|)
  category: "פרופילים",   // קטגוריה ראשית
  subCategory: "COB",      // אופציונלי
  url: "https://...",      // דף מוצר באתר
  specs: {                 // דרייברים בלבד
    power, voltage, ip, outputMode, inputVoltage, dimming: []
  }
}
```

## נקודות חשובות

- **נתיבי תמונות** ב-`home.html` ו-`IMG_BASE` ב-`index.html` כרגע מוחלטים (`file:///C:/Users/guy/...`) — יש לשנות לנתיבים יחסיים לפני העלאה לאינטרנט
- `cleanName()` — פונקציה שמנקה HTML entities משמות מוצרים
- סינון סטריפ נשען על `getStripMeta()` שמנתח את `desc` ו-`specs` גם יחד
- Modal מוצר מחפש datasheet לפי `product.id` ואחר כך לפי `product.name`
