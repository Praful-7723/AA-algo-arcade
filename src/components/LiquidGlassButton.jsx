import React from 'react';

export const LiquidGlassButton = ({ onClick, children, style }) => {
  return (
    <>
      <style>{`
        .liquid-glass-btn {
          position: relative;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          outline: none;
          background: transparent;
          border: none;
          border-radius: 8px;
          height: 100%;
          min-width: 48px;
        }
        .liquid-layer {
          position: absolute;
          top: 0; left: 0; z-index: 0;
          width: 100%; height: 100%;
          border-radius: 8px;
          box-shadow: 0 0 6px rgba(0,0,0,0.03), 0 2px 6px rgba(0,0,0,0.08), inset 3px 3px 0.5px -3px rgba(0,0,0,0.9), inset -3px -3px 0.5px -3px rgba(0,0,0,0.85), inset 1px 1px 1px -0.5px rgba(0,0,0,0.6), inset -1px -1px 1px -0.5px rgba(0,0,0,0.6), inset 0 0 6px 6px rgba(0,0,0,0.12), inset 0 0 2px 2px rgba(0,0,0,0.06), 0 0 12px rgba(255,255,255,0.15);
          transition: transform 0.2s cubic-bezier(0.1, 0.4, 0.2, 1);
        }
        .liquid-glass-filter {
          position: absolute;
          top: 0; left: 0;
          z-index: -10; height: 100%; width: 100%;
          overflow: hidden; border-radius: 8px;
          backdrop-filter: url("#container-glass");
        }
        .liquid-glass-btn:active .liquid-layer {
          transform: scale(0.95);
        }
      `}</style>
      <button className="liquid-glass-btn" onClick={onClick} style={style}>
        <div className="liquid-layer" />
        <div className="liquid-glass-filter" />
        <div style={{ position: 'relative', zIndex: 10 }}>{children}</div>
        
        <svg style={{ position: 'absolute', width: 0, height: 0, opacity: 0, pointerEvents: 'none' }}>
          <defs>
            <filter id="container-glass" x="0%" y="0%" width="100%" height="100%" colorInterpolationFilters="sRGB">
              <feTurbulence type="fractalNoise" baseFrequency="0.05 0.05" numOctaves="1" seed="1" result="turbulence" />
              <feGaussianBlur in="turbulence" stdDeviation="2" result="blurredNoise" />
              <feDisplacementMap in="SourceGraphic" in2="blurredNoise" scale="40" xChannelSelector="R" yChannelSelector="B" result="displaced" />
              <feGaussianBlur in="displaced" stdDeviation="2" result="finalBlur" />
              <feComposite in="finalBlur" in2="finalBlur" operator="over" />
            </filter>
          </defs>
        </svg>
      </button>
    </>
  );
}
