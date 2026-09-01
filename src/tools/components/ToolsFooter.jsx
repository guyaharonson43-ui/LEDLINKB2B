// src/tools/components/ToolsFooter.jsx
export default function ToolsFooter() {
  return (
    <footer className="footer">
      <div className="footer-inner">
        <div className="footer-top">
          <div>
            <div style={{ direction: 'ltr', display: 'inline-flex', alignItems: 'center', gap: '2px' }}>
              <span className="footer-logo-led">LED</span><span className="footer-logo-link">LINK</span>
            </div>
            <div className="footer-tagline">פתרונות תאורה מקצועיים לפרויקטים בכל גודל. ישירות מהמפעל, רחובות.</div>
          </div>
          <div>
            <div className="footer-col-title">כתובת</div>
            <div className="footer-links">
              <span className="footer-link">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                יצירה 19, רחובות
              </span>
              <a href="https://waze.com/ul?ll=31.8969,34.8186&navigate=yes" target="_blank" className="footer-link">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="3 11 22 2 13 21 11 13 3 11"/></svg>
                נווט ב-Waze
              </a>
            </div>
          </div>
          <div>
            <div className="footer-col-title">צור קשר</div>
            <div className="footer-links">
              <a href="tel:+97286326059" className="footer-link">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.4 2 2 0 0 1 3.6 1.22h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L7.91 8.8a16 16 0 0 0 6 6l1-1.06a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 21.72 16z"/></svg>
                08-632-6059
              </a>
              <a href="mailto:office@ledlink.co.il" className="footer-link">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                office@ledlink.co.il
              </a>
              <a href="https://wa.me/972504722550" target="_blank" className="footer-link">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/></svg>
                WhatsApp
              </a>
            </div>
          </div>
          <div>
            <div className="footer-col-title">שעות פעילות</div>
            <div className="footer-hours-row"><span className="hours-day">ראשון – חמישי</span><span className="hours-open">07:00 – 15:00</span></div>
            <div className="footer-hours-row"><span className="hours-day">שישי</span><span className="hours-closed">סגור</span></div>
            <div className="footer-hours-row"><span className="hours-day">שבת</span><span className="hours-closed">סגור</span></div>
          </div>
        </div>
        <div className="footer-bottom">
          <div className="footer-copy">© 2026 LEDLink – כל הזכויות שמורות</div>
          <div className="footer-legal">
            <a href="about.html">אודות</a>
            <a href="takanon.html">תקנון</a>
            <a href="privacy.html">מדיניות פרטיות</a>
            <a href="accessibility.html">הצהרת נגישות</a>
            <a href="faq.html">שאלות נפוצות</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
