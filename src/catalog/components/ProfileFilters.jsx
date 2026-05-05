import { Icons } from './Icons';

export default function ProfileFilters({ count }) {
  return (
    <div>
      <div style={{ fontSize: 12, color: '#999999', marginBottom: 20 }}>{count} פרופילים</div>
      <div style={{ fontSize: 13, color: '#666666', lineHeight: 1.8 }}>
        <p>פרופילי LED מיוצרים בהזמנה אישית — אורך, צבע גימור (לבן/שחור/RAL), ודגם לפי בחירה.</p>
        <p style={{ marginTop: 12 }}>לייעוץ ובחירת פרופיל:</p>
        <a href={`https://wa.me/972524444470?text=${encodeURIComponent('שלום LEDLink, אני מעוניין/ת בפרופיל LED. אשמח לקבל ייעוץ.')}`}
          target="_blank"
          style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: '#E8A020', fontWeight: 700, marginTop: 8, textDecoration: 'none' }}>
          {Icons.wa} WhatsApp ←
        </a>
      </div>
    </div>
  );
}
