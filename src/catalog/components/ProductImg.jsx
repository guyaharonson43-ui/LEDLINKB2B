import { useState } from 'react';
import { imgSrc } from '../utils/helpers';

export default function ProductImg({ src, name, tall, priority }) {
  const [err, setErr] = useState(false);
  const pt = tall ? '75%' : '65%';

  if (!src || err) {
    return (
      <div style={{ paddingTop: pt, position: 'relative', background: '#F0EDE8' }}>
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ fontSize: 11, color: '#CCCCCC', letterSpacing: 2 }}>LEDLINK</span>
        </div>
      </div>
    );
  }

  return (
    <div style={{ paddingTop: pt, position: 'relative', overflow: 'hidden' }}>
      <img
        src={imgSrc(src)}
        alt={name}
        width={tall ? 200 : 200}
        height={tall ? 150 : 130}
        loading={priority ? 'eager' : 'lazy'}
        fetchpriority={priority ? 'high' : undefined}
        decoding={priority ? 'sync' : 'async'}
        onError={() => setErr(true)}
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'contain', padding: '12px' }}
      />
    </div>
  );
}
