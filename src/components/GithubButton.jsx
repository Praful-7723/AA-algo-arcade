import React from 'react';
import { Github, Star } from 'lucide-react';

export const GithubButton = ({ onClick }) => {
  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <button className="github-btn" onClick={onClick}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <Github strokeWidth={2.5} size={20} />
          <span style={{ marginLeft: '12px', marginRight: '16px', letterSpacing: '1px' }}>INITIATE</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'rgba(255,255,255,0.15)', padding: '4px 10px', borderRadius: '999px' }}>
          <Star size={14} fill="#FCD34D" color="#FCD34D" />
          <span style={{ fontWeight: 800, fontSize: '0.8rem', fontFamily: 'monospace' }}>1.2k</span>
        </div>
      </button>
      <div className="github-btn-glow" />
    </div>
  );
}
