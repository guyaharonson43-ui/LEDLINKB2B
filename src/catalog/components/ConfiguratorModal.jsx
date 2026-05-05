import { useRef, useEffect } from 'react';
import { initConfigurator } from '../utils/configurator';

export default function ConfiguratorModal({ onClose }) {
  const wrapRef = useRef(null);

  useEffect(() => {
    let cleanup = null;
    if (wrapRef.current) {
      cleanup = initConfigurator(wrapRef.current, onClose);
    }
    return () => { if (typeof cleanup === 'function') cleanup(); };
  }, []);

  useEffect(() => {
    const onKey = e => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  return (
    <div className="cfg-overlay" onClick={onClose}>
      <div style={{ position: 'relative', width: '100%', maxWidth: 700 }} onClick={e => e.stopPropagation()}>
        <div ref={wrapRef} />
      </div>
    </div>
  );
}
