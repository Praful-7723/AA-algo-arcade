import React from 'react';
import { ChevronRight } from "lucide-react";

export function AnimatedShinyButton({ children, className = "", onClick, style }) {
  return (
    <button className={`shiny-cta ${className}`} onClick={onClick} style={style}>
      <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {children}
        <ChevronRight style={{ marginLeft: '4px', width: '24px', height: '24px', transition: 'transform 0.3s' }} className="cta-arrow" />
      </span>
    </button>
  )
}
