# CLAUDE.md

זהו קובץ הדרכה ל-Claude Code (claude.ai/code) בעת עבודה בריפוזיטורי זה.

## כללי עבודה

- **כל הטקסט בממשק המשתמש בעברית**, כיוון RTL (`dir="rtl"`, `direction: rtl`)
- **Build עם Vite** — React 18 מ-npm, JSX מקומפל ב-build (לא Babel בדפדפן, לא CDN)
- **פיתוח מקומי**: `npm install` ואז `npm run dev` → `http://localhost:5173/catalog.html`
- **בדיקת build**: `npm run build` ואז `npm run preview` (פורט 4173). ההגדרות ב-`.claude/launch.json`
- **דיפלוי**: merge ל-`main` → GitHub Actions בונה ומעלה ל-GitHub Pages (`ledlink.co.il`). אין Netlify ואין Supabase. פירוט ב-`docs/HOW-IT-WORKS.md`

## מבנה הפרויקט

| קובץ / תיקייה | תפקיד |
|------|--------|
| `index.html` | דף הבית — HTML סטטי (לא React) |
| `catalog.html` → `src/catalog/` | קטלוג המוצרים (React) |
| `tools.html` → `src/tools/` | מחשבוני תכנון (React) |
| `guides.html` → `src/guides/` | מדריכים (React) |
| `landing.html`, `about.html`, `faq.html`, `privacy.html`, `takanon.html`, `accessibility.html` | דפים סטטיים |
| `products_data_with_lighting.js` | **מקור המוצרים שהקטלוג טוען** (מיובא ב-`src/catalog/App.jsx`) |
| `products_data.js`, `lighting_products.js` | עותקים ישנים של אותם נתונים — כשמתקנים מוצר, לתקן בשלושתם |
| `datasheets_data.js` | מיפוי PDF לפי product.id / שם מוצר |
| `datasheets/`, `DATASHEET/` | קבצי PDF של היצרן (QLT) ודפי נתונים לפרופילים |
| `product-images/`, `strips/`, `assets/`, `projects/` | תמונות |
| `scripts/` | סקריפטים ל-build ולתחזוקת נתונים (`generate-static.mjs`, `sync-qlt-facets.mjs` וכו') |
| `docs/` | תיעוד פנימי — לא נכנס ל-build |

## Build

`npm run build` מריץ שלושה שלבים:
1. `scripts/generate-datasheet-manifest.mjs` — כותב את `src/catalog/utils/datasheetManifest.js`
2. `vite build` — ארבע נקודות כניסה (`catalog`, `index`, `guides`, `tools`) ל-`dist/`
3. `scripts/generate-static.mjs` — מעתיק תמונות/PDF, מייצר `sitemap.xml`, `robots.txt`, ודפי שיתוף `dist/share/{id}.html`

ה-workflow (`.github/workflows/deploy.yml`) מעתיק גם `landing.html` ו-`assets/`. ב-PR הוא רק בונה; דיפלוי רק ב-push ל-`main`.

> הבנייה המקומית משכתבת את `datasheetManifest.js` (סדר קבצים). אם השינוי לא קשור למשימה — להחזיר אותו לפני commit.

## ארכיטקטורה — קטלוג (`src/catalog/`)

- `App.jsx` — state: `activeTab` (קטגוריה), `search`, סינון, מוצר נבחר; פרמטרים מה-URL
- `components/` — `ProductCard`, `ProductModal`, `CatalogFilters`, `ProfileFilters`, `TrackFilters`, `SpecTags`, `ConfiguratorModal`, `NeonSchematics`, `Navbar`, `Footer`
- `utils/` — `helpers.js` (`cleanName`, `imgSrc`, `pdfSrc`, `trackEvent`), `stripMeta.js`, `driverMeta.js`, `catalogFacets.js`, `configurator.js`, `datasheetFiles.js`
- `data/` — `qltFacets.js` (סינון בסגנון qlt.it), `drawings.js` (שרטוטי פרופילים)

**קטגוריות (TABS):** `'דרייברים'` | `'סטריפ LED'` | `'פרופילים'` | `'גופי תאורה'` (ברירת מחדל)

**שרטוטי חתך נאון** — `NeonSchematics.jsx`: קומפוננטת `Section` מציירת כל פרופיל ביחידות מ"מ עם קווי מידה. `NEON_ID_MAP` ממפה product.id לפרופיל. המידות והצורה לקוחות מדפי הנתונים של QLT (`datasheets/DS_*.pdf`, עמוד "Dimensions").

## ארכיטקטורה — מחשבונים (`src/tools/`)

כל מחשבון קומפוננטה ב-`components/`. הרשימה ב-`TabBar.jsx`:
`voltage` (מפל מתח), `lumen` (לומן לחלל), `roi` (חיסכון אנרגיה), `beam-linear` (פיזור אלומה), `circadian` (מחשבון ביולוגי), `linear` (פרופיל LED), `power` (ספק כוח).

כל מחשבון יוצר טקסט תוצאות לשליחה ב-WhatsApp (`ContactRow.jsx`).

## מבנה מוצר

```js
{
  id: "qlt-xxx",               // מזהה ייחודי
  name: "שם המוצר",            // עברית, עלול להכיל HTML entities
  img: "strips/xxx.webp",      // נתיב יחסי לשורש האתר
  desc: "...",                 // תיאור (סטריפ: שדות ב-|, כולל "Lm/m" שמוצג בחלון המוצר)
  category: "סטריפ LED",       // קטגוריה ראשית
  subCategory: "Neon",         // אופציונלי
  url: "https://...",          // דף מוצר אצל היצרן
  specs: {                     // power, voltage, ip, outputMode, inputVoltage, dimming: []
  }
}
```

## עיצוב וצבעים

- **צבע ראשי:** `#E8A020` (זהב) · **משני:** `#C4880A` (זהב כהה)
- **טקסט:** `#1C1C1C` · **רקע:** `#F4F4F0` · **Navbar:** `#1A1A1A`
- **Font:** Heebo
- **RTL:** `dir="rtl"` בכל דף. מידות ומספרים באנגלית (כמו `8×16mm`) לעטוף ב-`<bdi dir="ltr">` או `dir="ltr"`, אחרת הדפדפן הופך אותם ל-`16mm×8`

## נקודות חשובות

1. **נתיבי קבצים** — יחסיים לשורש האתר (`strips/...`, `datasheets/...`); `imgSrc()` / `pdfSrc()` מחזירים אותם כמו שהם
2. **`cleanName()`** — מנקה HTML entities משמות מוצרים
3. **סינון סטריפ** — משלב `desc` ו-`specs` דרך `stripMeta.js`
4. **Datasheet lookup** — קודם לפי `product.id`, אחר כך לפי `product.name`
5. **WhatsApp** — המספר `972504722550` מוגדר כ-`WA_NUMBER` (tools/guides) ובקישורי `wa.me` בקטלוג
6. **URL parameters** — `catalog.html?tab=סטריפ LED`, `?product=<id>` (פותח מוצר), `?q=`, `?sub=`, `?cfg=` (תכנון פרופיל משותף); `tools.html?tool=circadian`
7. **מקור אמת לנתוני מוצר** — דפי הנתונים של QLT ב-`datasheets/`. אתר qlt.it חסום מסביבת הענן

## זרימת עדכון

1. **עדכון מוצרים** → `products_data_with_lighting.js` (ולשמור תואם את `products_data.js` / `lighting_products.js`) + תמונות
2. **עדכון datasheet** → `datasheets_data.js` + הקובץ ב-`datasheets/`
3. **עדכון קומפוננטה** → הקובץ המתאים ב-`src/`
4. **בדיקה** → `npm run dev`, ולפני PR `npm run build`
5. **פרסום** → branch → PR ל-`main` (הבנייה רצה כבדיקה) → merge → האתר מתעדכן תוך כ-2 דקות
