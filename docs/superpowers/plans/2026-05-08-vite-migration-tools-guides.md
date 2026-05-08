# Vite Migration — tools.html & guides.html

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** migrate tools.html and guides.html from CDN Babel + Tailwind CDN to Vite-built React bundles, eliminating ~1.3MB of runtime overhead and fixing Lighthouse Performance.

**Architecture:** each page gets its own `src/<page>/` folder mirroring the existing `src/catalog/` pattern — `main.jsx` as entry point, `App.jsx` for root component, `components/` for sub-components, and a `<page>.css` for non-Tailwind styles extracted from the inline `<style>` block. The HTML shell becomes a 30-line stub with `<div id="root">` and a Vite-injected `<script type="module">`.

**Tech Stack:** Vite 6, React 18, Tailwind 3 (already configured), `@vitejs/plugin-react`

---

## File Map

### New files to create
```
src/
  tools/
    main.jsx                   — ReactDOM.createRoot entry
    App.jsx                    — tab switching, URL state, top-level layout
    tools.css                  — CSS extracted from tools.html <style> block
    components/
      ContactRow.jsx            — WA + phone CTA row (shared by all calculators)
      VoltageDropCalc.jsx       — מחשבון מפל מתח (tools.html ~line 181–280)
      LumenCalc.jsx             — מחשבון לומן לחלל (~line 281–420)
      EnergyCalc.jsx            — מחשבון חיסכון אנרגיה (~line 421–530)
      BeamLinearCalc.jsx        — מחשבון פיזור אלומה (~line 531–655)
      CircadianCalc.jsx         — מחשבון ביולוגי (~line 656–875)
      LinearProfileCalc.jsx     — מחשבון פרופיל ליניארי (~line 876–1000)
      PowerCalc.jsx             — מחשבון התאמת ספק כוח (~line 1001–1100)
      TabBar.jsx                — horizontal tab bar + mobile <select>
      ToolsNavbar.jsx           — nav bar for tools page
      ToolsFooter.jsx           — footer for tools page
  guides/
    main.jsx
    App.jsx
    data.js                    — GUIDES array (already in guides.html ~line 245–389)
    components/
      renderParagraph.js        — inline link helper (added in previous commit)
      GuideCard.jsx             — guide card with hover (~line 469–498)
      GuideArticle.jsx          — modal article view (~line 392–466)
      GuidesNavbar.jsx
      GuidesFooter.jsx
```

### Files to modify
- `tailwind.config.js` — add `./tools.html`, `./guides.html`, `./src/tools/**/*.{jsx,js}`, `./src/guides/**/*.{jsx,js}` to `content`
- `vite.config.js` — add `tools: 'tools.html'`, `guides: 'guides.html'` to `rollupOptions.input`
- `tools.html` — replace with minimal HTML shell (keep only `<head>` meta/SEO, remove all `<script>` CDN/Babel, add `<script type="module" src="/src/tools/main.jsx">`)
- `guides.html` — same treatment

---

## Task 1: Update tailwind.config.js content paths

**Files:** Modify `tailwind.config.js`

- [ ] **Step 1: Update content array**

```js
// tailwind.config.js
export default {
  content: [
    './catalog.html',
    './index.html',
    './tools.html',
    './guides.html',
    './src/**/*.{jsx,js}',
  ],
  theme: {
    extend: {
      colors: {
        surface:       '#F4F4F0',
        'surface-alt': '#ECEAE4',
        card:          '#FFFFFF',
        'card-hover':  '#FAFAF8',
        border:        '#E0DDD6',
        'border-dark': '#C8C4BC',
        nav:           '#1A1A1A',
        gold:          '#E8A020',
        'gold-dim':    '#C4880A',
        'gold-faint':  'rgba(232,160,32,0.12)',
        ink:           '#1C1C1C',
        'ink-soft':    '#555555',
        'ink-faint':   '#999999',
        muted:         '#777777',
      },
      fontFamily: { sans: ['Heebo', 'sans-serif'] },
    },
  },
  plugins: [],
};
```

- [ ] **Step 2: Commit**

```bash
git add tailwind.config.js
git commit -m "config: add tools + guides paths to Tailwind content"
```

---

## Task 2: Create guides/data.js

Extract the GUIDES array from guides.html (~line 245–389) into its own module.

**Files:** Create `src/guides/data.js`

- [ ] **Step 1: Create the file**

```js
// src/guides/data.js
export const GUIDES = [
  // ── paste the full GUIDES array from guides.html lines 245–389 here ──
  // Keep every { id, cat, readTime, title, excerpt, img, catalogLink, catalogLabel, body } object exactly as-is
];
```

> Read `guides.html` lines 245–389, copy the array literal verbatim, change `const GUIDES = [` to `export const GUIDES = [`.

- [ ] **Step 2: Commit**

```bash
git add src/guides/data.js
git commit -m "feat(guides): extract GUIDES data to src/guides/data.js"
```

---

## Task 3: Create renderParagraph helper

**Files:** Create `src/guides/components/renderParagraph.js`

- [ ] **Step 1: Create the file**

```js
// src/guides/components/renderParagraph.js
import React from 'react';

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
```

- [ ] **Step 2: Commit**

```bash
git add src/guides/components/renderParagraph.js
git commit -m "feat(guides): renderParagraph helper as ESM module"
```

---

## Task 4: Create GuideCard component

**Files:** Create `src/guides/components/GuideCard.jsx`

- [ ] **Step 1: Create the file**

```jsx
// src/guides/components/GuideCard.jsx
import { useState } from 'react';

export default function GuideCard({ g, onOpen }) {
  const [hovered, setHovered] = useState(false);
  return (
    // ── paste the <article> JSX from guides.html lines 472–497 here ──
    // Replace:  onClick={() => onOpen(g)}  ← already correct
    // Replace:  onMouseEnter={()=>setHovered(true)}  ← already correct
  );
}
```

> Read guides.html lines 469–498, extract the full `GuideCard` component body. Change `const GuideCard = ({ g, onOpen }) => {` to `export default function GuideCard({ g, onOpen }) {`.

- [ ] **Step 2: Commit**

```bash
git add src/guides/components/GuideCard.jsx
git commit -m "feat(guides): GuideCard component"
```

---

## Task 5: Create GuideArticle component

**Files:** Create `src/guides/components/GuideArticle.jsx`

- [ ] **Step 1: Create the file**

```jsx
// src/guides/components/GuideArticle.jsx
import { useEffect } from 'react';
import { renderParagraph } from './renderParagraph';

const WA_NUMBER = '972524444470';

const WaIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/>
  </svg>
);

export default function GuideArticle({ guide, onClose }) {
  // ── paste the GuideArticle component body from guides.html lines 393–466 here ──
  // Change:  const GuideArticle = ({ guide, onClose }) => {  →  export default function GuideArticle({ guide, onClose }) {
  // The block.type === 'p' renderer must call:  renderParagraph(block.text, block.links)
}
```

- [ ] **Step 2: Verify the paragraph renderer is wired**

Inside the JSX, the `type === 'p'` branch must render:
```jsx
<p key={i} style={{fontSize:15,color:'#555',lineHeight:1.8,marginBottom:12}}>
  {renderParagraph(block.text, block.links)}
</p>
```

- [ ] **Step 3: Commit**

```bash
git add src/guides/components/GuideArticle.jsx
git commit -m "feat(guides): GuideArticle modal component"
```

---

## Task 6: Create GuidesNavbar + GuidesFooter

**Files:** Create `src/guides/components/GuidesNavbar.jsx`, `src/guides/components/GuidesFooter.jsx`

- [ ] **Step 1: Extract GuidesNavbar**

Read guides.html lines 530–607 (the `<nav>` + mobile menu JSX). Create:

```jsx
// src/guides/components/GuidesNavbar.jsx
import { useState } from 'react';

const CATALOG = [
  { label: 'דרייברים',  url: 'catalog.html?tab=דרייברים'  },
  { label: 'סטריפ LED', url: 'catalog.html?tab=סטריפ LED' },
  { label: 'פרופילים',  url: 'catalog.html?tab=פרופילים'  },
];
const TOOLS = [
  { label: '⚡ מפל מתח',        url: 'tools.html?tool=voltage'     },
  { label: '💡 לומן לחלל',      url: 'tools.html?tool=lumen'       },
  { label: '♻️ חיסכון אנרגיה',  url: 'tools.html?tool=roi'         },
  { label: '📏 פיזור אלומה',    url: 'tools.html?tool=beam-linear' },
  { label: '🌙 מחשבון ביולוגי', url: 'tools.html?tool=circadian'   },
  { label: '📐 פרופיל LED',     url: 'tools.html?tool=linear'      },
  { label: '🔌 ספק כוח',        url: 'tools.html?tool=power'       },
];

export default function GuidesNavbar() {
  const [openDrop, setOpenDrop] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  // ── paste nav + mobile-menu JSX from guides.html lines 532–607 ──
  // Remove the useState declarations that are already above
}
```

- [ ] **Step 2: Extract GuidesFooter**

Read guides.html lines 630–687. Create:

```jsx
// src/guides/components/GuidesFooter.jsx
export default function GuidesFooter() {
  return (
    // ── paste <footer className="footer">...</footer> from guides.html ──
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add src/guides/components/GuidesNavbar.jsx src/guides/components/GuidesFooter.jsx
git commit -m "feat(guides): Navbar + Footer components"
```

---

## Task 7: Create guides App.jsx + main.jsx

**Files:** Create `src/guides/App.jsx`, `src/guides/main.jsx`, `src/guides/guides.css`

- [ ] **Step 1: Create guides.css**

Read guides.html lines 40–139 (the full `<style>` block). Extract all CSS into:

```css
/* src/guides/guides.css */
/* ── paste entire <style> block content from guides.html here ── */
/* Remove the Tailwind CDN config block (tailwind.config = {...}) — that's JS not CSS */
```

- [ ] **Step 2: Create App.jsx**

```jsx
// src/guides/App.jsx
import { useState } from 'react';
import { GUIDES } from './data';
import GuideCard from './components/GuideCard';
import GuideArticle from './components/GuideArticle';
import GuidesNavbar from './components/GuidesNavbar';
import GuidesFooter from './components/GuidesFooter';

export default function App() {
  const [openGuide, setOpenGuide] = useState(null);
  return (
    <div style={{ minHeight: '100vh', background: '#F4F4F0' }}>
      <GuidesNavbar />

      {/* Page header */}
      <div style={{ background: '#1A1A1A', padding: '48px 32px 40px' }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 4, textTransform: 'uppercase', color: '#E8A020', marginBottom: 12 }}>LEDLink · רחובות</div>
          <h1 style={{ fontSize: 'clamp(28px,4vw,48px)', fontWeight: 900, color: '#FFFFFF', lineHeight: 1.15, marginBottom: 12 }}>
            לפני שקונים — לומדים
          </h1>
          <p style={{ fontSize: 17, color: 'rgba(255,255,255,0.9)', fontWeight: 500, lineHeight: 1.7, maxWidth: 520 }}>
            מדריכים שיכולים לעזור.
          </p>
        </div>
      </div>

      {/* Guides grid */}
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '48px 24px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 24 }}>
          {GUIDES.map(g => <GuideCard key={g.id} g={g} onOpen={setOpenGuide} />)}
        </div>
      </div>

      <GuidesFooter />
      {openGuide && <GuideArticle guide={openGuide} onClose={() => setOpenGuide(null)} />}
    </div>
  );
}
```

- [ ] **Step 3: Create main.jsx**

```jsx
// src/guides/main.jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import './guides.css';
import App from './App';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```

- [ ] **Step 4: Commit**

```bash
git add src/guides/
git commit -m "feat(guides): App + main entry"
```

---

## Task 8: Replace guides.html with minimal Vite shell

**Files:** Modify `guides.html`

- [ ] **Step 1: Replace guides.html**

Keep: all `<head>` meta/SEO/OG tags, JSON-LD schema, canonical, the CSS class selectors the CSS file references (`.footer`, `.nav-drop-item`, `.hamburger*`, `.mm-*`, `.tabs-*`).

Remove: every `<script>` tag in `<head>` that loads React/Babel/Tailwind CDN, the entire `<script type="text/babel">` block, and the `a11y-widget.js` inline scroll-top script block (keep the `<script src="a11y-widget.js">` and scroll-top button).

Replace the body with:

```html
<body>
  <div id="root"></div>
  <script type="module" src="/src/guides/main.jsx"></script>
  <script src="a11y-widget.js" defer></script>
  <button id="scroll-top-btn" onclick="window.scrollTo({top:0,behavior:'smooth'})" aria-label="חזרה לראש העמוד">&#8679;</button>
  <style>
    #scroll-top-btn{position:fixed;bottom:24px;left:20px;width:44px;height:44px;border-radius:50%;background:#1d4ed8;color:#fff;border:none;font-size:24px;line-height:1;cursor:pointer;box-shadow:0 3px 10px rgba(0,0,0,0.25);opacity:0;transform:translateY(16px);transition:opacity .25s,transform .25s;z-index:998;pointer-events:none;display:flex;align-items:center;justify-content:center;}
    #scroll-top-btn.visible{opacity:1;transform:translateY(0);pointer-events:auto;}
    #scroll-top-btn:hover{background:#1e40af;}
  </style>
  <script>
    (function(){ var b=document.getElementById('scroll-top-btn');
      window.addEventListener('scroll',function(){ b.classList.toggle('visible',window.scrollY>300); },{passive:true});
    })();
  </script>
  <a href="https://wa.me/972524444470" target="_blank" rel="noopener noreferrer" class="wa-float" aria-label="פתח שיחת WhatsApp">
    <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/></svg>
  </a>
</body>
```

- [ ] **Step 2: Add guides to vite.config.js**

```js
// vite.config.js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: '/',
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        catalog: 'catalog.html',
        index:   'index.html',
        guides:  'guides.html',
      },
    },
  },
});
```

- [ ] **Step 3: Run dev server and verify guides.html renders**

```bash
npm run dev
# open http://localhost:5173/guides.html
# verify: guide cards visible, clicking a card opens modal, internal links (gold text) work
```

- [ ] **Step 4: Commit**

```bash
git add guides.html vite.config.js
git commit -m "feat(guides): Vite migration complete — replace CDN Babel with ESM build"
```

---

## Task 9: Create tools ContactRow + WaIcon

**Files:** Create `src/tools/components/ContactRow.jsx`

- [ ] **Step 1: Create the file**

Read tools.html lines 158–179. Extract:

```jsx
// src/tools/components/ContactRow.jsx
const WA_NUMBER = '972524444470';
const PHONE_HREF = 'tel:+97286326059';

const WaIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/>
  </svg>
);

export { WA_NUMBER, WaIcon };

export default function ContactRow({ waHref, disabled }) {
  return (
    // ── paste ContactRow JSX from tools.html lines 166–179 ──
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/tools/components/ContactRow.jsx
git commit -m "feat(tools): ContactRow component"
```

---

## Task 10: Extract all 7 calculator components

For each calculator, read the indicated line range in tools.html and create the file. All calculators import `ContactRow` from `./ContactRow`.

**VoltageDropCalc** — tools.html lines 181–280

```jsx
// src/tools/components/VoltageDropCalc.jsx
import { useState } from 'react';
import ContactRow, { WA_NUMBER } from './ContactRow';
// ── paste VoltageDropCalc component body ──
export default VoltageDropCalc;
```

**LumenCalc** — tools.html lines 281–423 (ends before `/* ── Energy ──*/`)

```jsx
// src/tools/components/LumenCalc.jsx
import { useState, useEffect } from 'react';
import ContactRow, { WA_NUMBER } from './ContactRow';
export default function LumenCalc({ circadianPreset, onPresetConsumed }) { /* ... */ }
```

Note: LumenCalc accepts `circadianPreset` and `onPresetConsumed` props — these are passed from App when the biological calculator sends a preset. Keep those props intact.

**EnergyCalc** — tools.html lines 424–531

```jsx
// src/tools/components/EnergyCalc.jsx
import { useState } from 'react';
import ContactRow, { WA_NUMBER } from './ContactRow';
export default function EnergyCalc() { /* ... */ }
```

**BeamLinearCalc** — tools.html lines 532–656

```jsx
// src/tools/components/BeamLinearCalc.jsx
import { useState } from 'react';
import ContactRow, { WA_NUMBER } from './ContactRow';
export default function BeamLinearCalc() { /* ... */ }
```

**CircadianCalc** — tools.html lines 657–875 (ends before `/* ── Linear Profile ──*/`)

```jsx
// src/tools/components/CircadianCalc.jsx
import { useState } from 'react';
import ContactRow, { WA_NUMBER } from './ContactRow';
export default function CircadianCalc({ onPreset }) { /* ... */ }
```

Note: CircadianCalc accepts `onPreset` callback — fires when user clicks "העבר ללומן". Keep this prop.

**LinearProfileCalc** — tools.html lines 876–1004

```jsx
// src/tools/components/LinearProfileCalc.jsx
import { useState } from 'react';
import ContactRow, { WA_NUMBER } from './ContactRow';
export default function LinearProfileCalc() { /* ... */ }
```

**PowerCalc** — tools.html lines 1005–1100

```jsx
// src/tools/components/PowerCalc.jsx
import { useState } from 'react';
import ContactRow, { WA_NUMBER } from './ContactRow';
export default function PowerCalc() { /* ... */ }
```

- [ ] **Step 1:** Create all 7 files as described above, extracting the component body from tools.html for each.

- [ ] **Step 2: Commit**

```bash
git add src/tools/components/
git commit -m "feat(tools): extract 7 calculator components to ESM"
```

---

## Task 11: Create TabBar component

**Files:** Create `src/tools/components/TabBar.jsx`

Read tools.html lines 1101–1160 for the tab definitions and rendering. The `TABS` array looks like:

```js
const TABS = [
  { id: 'voltage',     label: 'מפל מתח',        Icon: IcVoltage     },
  { id: 'lumen',       label: 'לומן לחלל',      Icon: IcLumen       },
  { id: 'roi',         label: 'חיסכון אנרגיה',  Icon: IcROI         },
  { id: 'beam-linear', label: 'פיזור אלומה',    Icon: IcBeam        },
  { id: 'circadian',   label: 'מחשבון ביולוגי', Icon: IcCircadian   },
  { id: 'linear',      label: 'פרופיל ליניארי', Icon: IcLinear      },
  { id: 'power',       label: 'ספק כוח',        Icon: IcPower       },
];
```

```jsx
// src/tools/components/TabBar.jsx
// ── paste all icon SVG constants (IcVoltage, IcLumen, etc.) from tools.html ──
// ── paste TABS array ──

export { TABS };

export default function TabBar({ active, onChange }) {
  return (
    // ── paste the tab-bar + mobile-select JSX from tools.html ──
  );
}
```

- [ ] **Step 1:** Create the file as described.

- [ ] **Step 2: Commit**

```bash
git add src/tools/components/TabBar.jsx
git commit -m "feat(tools): TabBar component with icons"
```

---

## Task 12: Create ToolsNavbar + ToolsFooter

**Files:** Create `src/tools/components/ToolsNavbar.jsx`, `src/tools/components/ToolsFooter.jsx`

Follow the same approach as Task 6 (GuidesNavbar/GuidesFooter) but reading tools.html instead.

- ToolsNavbar: lines that contain the `<nav>` + mobile menu JSX in tools.html (search for `{/* Navbar */}` comment)
- ToolsFooter: lines that contain `<footer className="footer">` in tools.html

```jsx
// src/tools/components/ToolsNavbar.jsx
import { useState } from 'react';
// ── paste nav + mobile-menu JSX ──
export default function ToolsNavbar() { /* ... */ }
```

```jsx
// src/tools/components/ToolsFooter.jsx
export default function ToolsFooter() {
  return ( /* ── paste <footer> JSX ── */ );
}
```

- [ ] **Step 1:** Create both files.

- [ ] **Step 2: Commit**

```bash
git add src/tools/components/ToolsNavbar.jsx src/tools/components/ToolsFooter.jsx
git commit -m "feat(tools): Navbar + Footer components"
```

---

## Task 13: Create tools App.jsx + main.jsx + tools.css

**Files:** Create `src/tools/App.jsx`, `src/tools/main.jsx`, `src/tools/tools.css`

- [ ] **Step 1: Create tools.css**

Read tools.html lines 40–139 (`<style>` block). Copy all CSS. Remove the Tailwind CDN `<script>` config.

```css
/* src/tools/tools.css */
/* ── paste full <style> block content from tools.html lines 40–139 ── */
```

- [ ] **Step 2: Create App.jsx**

The App in tools.html manages: `activeTool` state (from URL `?tool=`), history.pushState, circadian→lumen preset bridging, and rendering the active calculator. Read lines 1100–1413.

```jsx
// src/tools/App.jsx
import { useState, useEffect } from 'react';
import ToolsNavbar from './components/ToolsNavbar';
import ToolsFooter from './components/ToolsFooter';
import TabBar, { TABS } from './components/TabBar';
import VoltageDropCalc   from './components/VoltageDropCalc';
import LumenCalc         from './components/LumenCalc';
import EnergyCalc        from './components/EnergyCalc';
import BeamLinearCalc    from './components/BeamLinearCalc';
import CircadianCalc     from './components/CircadianCalc';
import LinearProfileCalc from './components/LinearProfileCalc';
import PowerCalc         from './components/PowerCalc';

export default function App() {
  // ── paste the full App component body from tools.html lines ~1107–1413 ──
  // Keep: useState for activeTool, circadianPreset, useEffect for URL sync + popstate
  // Keep: the TOOL_COMPONENTS map (or switch) that renders the active calculator
  // Keep: the circadianPreset → lumenPreset bridging logic
}
```

- [ ] **Step 3: Create main.jsx**

```jsx
// src/tools/main.jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import './tools.css';
import App from './App';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```

- [ ] **Step 4: Commit**

```bash
git add src/tools/
git commit -m "feat(tools): App + main entry"
```

---

## Task 14: Replace tools.html with minimal Vite shell + update vite.config.js

**Files:** Modify `tools.html`, `vite.config.js`

- [ ] **Step 1: Replace tools.html**

Keep all `<head>` meta/SEO tags. Remove all CDN `<script>` tags (React, ReactDOM, Babel, Tailwind, Clarity, GA can stay). Remove the entire `<script type="text/babel">` block. The body becomes:

```html
<body>
  <div id="root"></div>
  <script type="module" src="/src/tools/main.jsx"></script>
  <script src="a11y-widget.js" defer></script>
  <button id="scroll-top-btn" onclick="window.scrollTo({top:0,behavior:'smooth'})" aria-label="חזרה לראש העמוד">&#8679;</button>
  <style>
    #scroll-top-btn{position:fixed;bottom:24px;left:20px;width:44px;height:44px;border-radius:50%;background:#1d4ed8;color:#fff;border:none;font-size:24px;line-height:1;cursor:pointer;box-shadow:0 3px 10px rgba(0,0,0,0.25);opacity:0;transform:translateY(16px);transition:opacity .25s,transform .25s;z-index:998;pointer-events:none;display:flex;align-items:center;justify-content:center;}
    #scroll-top-btn.visible{opacity:1;transform:translateY(0);pointer-events:auto;}
    #scroll-top-btn:hover{background:#1e40af;}
  </style>
  <script>
    (function(){ var b=document.getElementById('scroll-top-btn');
      window.addEventListener('scroll',function(){ b.classList.toggle('visible',window.scrollY>300); },{passive:true});
    })();
  </script>
  <a href="https://wa.me/972524444470" target="_blank" rel="noopener noreferrer" class="wa-float" aria-label="פתח שיחת WhatsApp">
    <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 ..."/></svg>
  </a>
</body>
```

- [ ] **Step 2: Update vite.config.js to include tools**

```js
// vite.config.js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: '/',
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        catalog: 'catalog.html',
        index:   'index.html',
        guides:  'guides.html',
        tools:   'tools.html',
      },
    },
  },
});
```

- [ ] **Step 3: Run dev and verify tools.html works**

```bash
npm run dev
# open http://localhost:5173/tools.html
# verify: all 7 tab calculators load, switching tabs works, circadian→lumen preset works, WA links work
```

- [ ] **Step 4: Run full build**

```bash
npm run build
# Expected: no errors, dist/ contains catalog.html, index.html, guides.html, tools.html
```

- [ ] **Step 5: Commit**

```bash
git add tools.html vite.config.js
git commit -m "feat(tools): Vite migration complete — replace CDN Babel with ESM build"
```

---

## Task 15: Remove manual file copies from generate-static.mjs

Now that tools.html and guides.html are Vite-built entries, they're included in dist automatically. Remove them from the manual copy loop.

**Files:** Modify `scripts/generate-static.mjs`

- [ ] **Step 1: Remove tools.html and guides.html from copyFile loop**

```js
// scripts/generate-static.mjs — find this block and update:
for (const f of [
  '404.html',
  'about.html', 'faq.html',
  'takanon.html', 'privacy.html', 'accessibility.html',
]) copyFile(f);
// tools.html and guides.html removed — now built by Vite
```

- [ ] **Step 2: Run full build again to confirm**

```bash
npm run build
# dist/tools.html and dist/guides.html should still exist (from Vite build, not copy)
```

- [ ] **Step 3: Commit**

```bash
git add scripts/generate-static.mjs
git commit -m "chore: remove tools + guides from manual copy — now Vite entries"
```

---

## Done

After Task 15, open a PR. The PR should show:
- `tools.html` and `guides.html` reduced from ~1400 lines to ~40 lines each
- New `src/tools/` and `src/guides/` directories
- `vite.config.js` with 4 build inputs
- No Babel or Tailwind CDN loaded at runtime
