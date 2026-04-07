'use client';
import React, { useState } from 'react';
import { Liquid } from './button-1';

const COLORS = {
  color1: '#FFFFFF',
  color2: '#A2FC2B',
  color3: '#C2FC6A',
  color4: '#FCFCFE',
  color5: '#F9F9FD',
  color6: '#E1FC2B',
  color7: '#8DE814',
  color8: '#6CC800',
  color9: '#9CF522',
  color10: '#FFFD7A',
  color11: '#5AB800',
  color12: '#D8FE9B',
  color13: '#7AE208',
  color14: '#E6FFAD',
  color15: '#EBFDC5',
  color16: '#FFF033',
  color17: '#469100',
};

const GitHubButton = ({ onClick }) => {
  const [isHovered, setIsHovered] = useState(false);
  return (
    <div style={{ display: 'flex', justifyContent: 'center' }} onClick={onClick}>
      <button
        type="button"
        style={{
          position: 'relative',
          display: 'inline-block',
          width: '16rem',
          height: '4.5em',
          margin: '0 auto',
          background: '#000',
          border: '2px solid #000',
          borderRadius: '9999px',
          overflow: 'hidden',
          cursor: 'pointer',
          padding: 0,
        }}>
        {/* Outer glow behind button */}
        <div style={{
          position: 'absolute',
          width: '112.81%',
          height: '128.57%',
          top: '8.57%',
          left: '50%',
          transform: 'translateX(-50%)',
          filter: 'blur(19px)',
          opacity: 0.7,
        }}>
          <span style={{
            position: 'absolute',
            inset: 0,
            borderRadius: '9999px',
            background: '#d9d9d9',
            filter: 'blur(6.5px)',
          }} />
          <div style={{
            position: 'relative',
            width: '100%',
            height: '100%',
            overflow: 'hidden',
            borderRadius: '9999px',
          }}>
            <Liquid isHovered={isHovered} colors={COLORS} />
          </div>
        </div>
        {/* Liquid animated surface */}
        <div style={{
          position: 'relative',
          width: '100%',
          height: '100%',
          overflow: 'hidden',
          borderRadius: '9999px',
        }}>
          <span style={{ position: 'absolute', inset: 0, borderRadius: '9999px', background: '#d9d9d9' }} />
          <span style={{ position: 'absolute', inset: 0, borderRadius: '9999px', background: '#000' }} />
          <Liquid isHovered={isHovered} colors={COLORS} />
        </div>
        {/* Clean text overlay — NO shadow, NO blur, NO dark box */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: '9999px',
            background: 'transparent',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10,
          }}
          aria-label="Start Game"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}>
          <span style={{
            color: 'rgba(255,255,255,0.95)',
            fontSize: '1.75rem',
            fontFamily: "'Outfit', sans-serif",
            fontWeight: 900,
            letterSpacing: '0.2em',
            textTransform: 'uppercase',
          }}>START</span>
        </div>
      </button>
    </div>
  );
};
export default GitHubButton;
