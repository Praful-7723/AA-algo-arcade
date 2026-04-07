import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

export function PremiumLoader() {
  const [loadingText, setLoadingText] = useState('Initializing');

  useEffect(() => {
    const states = ['Waking AI...', 'Mapping Sectors...', 'Syncing Neural Net...', 'Ready...'];
    let i = 0;
    const interval = setInterval(() => {
      i = (i + 1) % states.length;
      setLoadingText(states[i]);
    }, 800);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center gap-6 mt-6">
      <div className="relative w-20 h-20 flex items-center justify-center">

        {/* Base Glow */}
        <div className="
          absolute inset-0 rounded-full blur-xl animate-pulse
          bg-[#A2FC2B]/20
        " />

        {/* Outer Dashed Ring */}
        <div className="
          absolute inset-0 rounded-full border border-dashed
          border-[#A2FC2B]/40
          animate-[spin_8s_linear_infinite]
        " />

        {/* Main Arc */}
        <div className="
          absolute inset-1 rounded-full border-2 border-transparent
          border-t-[#A2FC2B]
          shadow-[0_0_8px_rgba(162,252,43,0.6)]
          animate-[spin_2s_linear_infinite]
        " />

        {/* Reverse Arc */}
        <div className="
          absolute inset-3 rounded-full border-2 border-transparent
          border-b-[#fffd7a]
          shadow-[0_0_8px_rgba(255,253,122,0.4)]
          animate-[spin_3s_linear_infinite_reverse]
        " />

        {/* Inner Fast Ring */}
        <div className="
          absolute inset-5 rounded-full border border-transparent
          border-l-[#fff]/60
          animate-[spin_1s_ease-in-out_infinite]
        " />

        {/* Orbital Dot */}
        <div className="absolute inset-0 animate-[spin_4s_linear_infinite]">
          <div className="
            absolute top-0 left-1/2 -translate-x-1/2
            w-1.5 h-1.5 rounded-full
            bg-[#A2FC2B]
            shadow-[0_0_6px_rgba(162,252,43,0.9)]
          " />
        </div>

        {/* Center Core */}
        <div className="
          absolute w-2 h-2 rounded-full animate-pulse
          bg-white
          shadow-[0_0_10px_rgba(255,255,255,1)]
        " />
      </div>

      {/* Text */}
      <div className="flex flex-col items-center h-6 justify-center">
        <motion.span
          key={loadingText}
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -5 }}
          transition={{ duration: 0.3 }}
          className="
            text-[10px] font-bold tracking-[0.3em] uppercase
            text-[#A2FC2B]
          "
        >
          {loadingText}
        </motion.span>
      </div>
    </div>
  );
}
