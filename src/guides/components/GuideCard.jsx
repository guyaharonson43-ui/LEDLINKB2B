// src/guides/components/GuideCard.jsx
import { useState } from 'react';

export default function GuideCard({ g, onOpen }) {
  const [hovered, setHovered] = useState(false);
  return (
    <article onClick={() => onOpen(g)} onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
      style={{ background: '#fff', borderRadius: 12, border: '1px solid #E0DDD6', overflow: 'hidden', cursor: 'pointer', transition: 'transform 0.25s, box-shadow 0.25s', transform: hovered ? 'translateY(-4px)' : 'none', boxShadow: hovered ? '0 12px 32px rgba(0,0,0,0.1)' : 'none' }}>
      <div style={{ aspectRatio: '16/10', overflow: 'hidden', background: '#F0EDE8', position: 'relative' }}>
        <img src={g.img} alt={g.title} loading="lazy"
          style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.5s', transform: hovered ? 'scale(1.05)' : 'scale(1)' }}
          onError={e => { e.target.src = 'https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?auto=format&fit=crop&w=500&q=80'; }} />
        <div style={{ position: 'absolute', top: 12, right: 12 }}>
          <span style={{ background: 'rgba(255,255,255,0.95)', fontSize: 10, color: '#E8A020', fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase', padding: '3px 10px', borderRadius: 4 }}>
            {g.cat}
          </span>
        </div>
      </div>
      <div style={{ padding: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#999', marginBottom: 8 }}>
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
          {g.readTime} קריאה
        </div>
        <h3 style={{ fontSize: 17, fontWeight: 900, color: hovered ? '#E8A020' : '#1C1C1C', lineHeight: 1.3, marginBottom: 8, transition: 'color 0.15s' }}>{g.title}</h3>
        <p style={{ fontSize: 14, color: '#777', lineHeight: 1.7, marginBottom: 16, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{g.excerpt}</p>
        <span style={{ fontSize: 12, fontWeight: 700, color: hovered ? '#E8A020' : '#1C1C1C', display: 'flex', alignItems: 'center', gap: 4, transition: 'color 0.15s' }}>
          קרא עוד
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" /></svg>
        </span>
      </div>
    </article>
  );
}
