import React from 'react';
import { motion } from 'framer-motion';

export function PremiumLoader() {
  const silverGradientId = "loader-silver-gradient";
  const glowFilterId = "loader-glow";

  const draw = {
    hidden: { pathLength: 0, opacity: 0 },
    visible: (i) => {
      const delay = 0.5 + i * 0.4;
      return {
        pathLength: 1,
        opacity: 1,
        transition: {
          pathLength: { delay, type: "spring", duration: 2, bounce: 0 },
          opacity: { delay, duration: 0.1 }
        }
      };
    }
  };

  return (
    <div className="flex flex-col items-center justify-center">
      <motion.div 
         initial={{ opacity: 0, scale: 0.95 }}
         animate={{ opacity: 1, scale: 1 }}
         transition={{ duration: 0.8, ease: "easeOut" }}
         className="relative flex flex-col items-center"
      >
        <svg
          className="w-40 h-40 overflow-visible"
          viewBox="0 0 112 112"
          role="img"
        >
          <defs>
            <linearGradient id={silverGradientId} x1="22" y1="18" x2="92" y2="96" gradientUnits="userSpaceOnUse">
              <stop offset="0" stopColor="#ffffff" />
              <stop offset="0.16" stopColor="#aeb8bf" />
              <stop offset="0.32" stopColor="#f9fbfc" />
              <stop offset="0.52" stopColor="#707a82" />
              <stop offset="0.72" stopColor="#dfe5e9" />
              <stop offset="1" stopColor="#ffffff" />
            </linearGradient>
            <filter id={glowFilterId} x="-35%" y="-35%" width="170%" height="170%">
              <feGaussianBlur stdDeviation="3.5" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          <g>
            {/* Left Brain Hemisphere */}
            <motion.path
              d="M15 89C24 62 32 39 43 18C54 39 62 62 71 89"
              stroke={`url(#${silverGradientId})`}
              strokeWidth="6"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
              custom={0}
              variants={draw}
              initial="hidden"
              animate="visible"
              filter={`url(#${glowFilterId})`}
            />
            {/* Right Brain Hemisphere */}
            <motion.path
              d="M41 89C50 62 58 39 69 18C80 39 88 62 97 89"
              stroke={`url(#${silverGradientId})`}
              strokeWidth="6"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
              custom={1}
              variants={draw}
              initial="hidden"
              animate="visible"
              filter={`url(#${glowFilterId})`}
            />
            {/* Circuit Nodes Base */}
            <motion.path
              d="M29 64C38 56 48 56 56 64C64 72 75 72 86 64"
              stroke="#ffffff"
              strokeWidth="3"
              strokeLinecap="round"
              fill="none"
              custom={2}
              variants={draw}
              initial="hidden"
              animate="visible"
              filter={`url(#${glowFilterId})`}
              opacity="0.6"
            />
            {/* Nodes */}
            <motion.circle cx="29" cy="64" r="5" fill="#ffffff" filter={`url(#${glowFilterId})`} initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 2.2, type: 'spring' }} />
            <motion.circle cx="56" cy="64" r="5" fill="#f9fbfc" filter={`url(#${glowFilterId})`} initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 2.3, type: 'spring' }} />
            <motion.circle cx="86" cy="64" r="5" fill="#ffffff" filter={`url(#${glowFilterId})`} initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 2.4, type: 'spring' }} />
          </g>
        </svg>

        <motion.div
           initial={{ opacity: 0, y: 10 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ delay: 2.6, duration: 1 }}
           className="boot-chrome-text text-xl"
        >
          ALGO ARCADE
        </motion.div>

        {/* Dynamic dots for luxury feel underneath */}
        <motion.div
           initial={{ opacity: 0 }}
           animate={{ opacity: [0.3, 1, 0.3] }}
           transition={{ delay: 3, duration: 2, repeat: Infinity }}
           className="flex gap-2 mt-4"
        >
            <div className="w-1.5 h-1.5 bg-gray-300 rounded-full shadow-[0_0_8px_rgba(255,255,255,0.8)]" />
            <div className="w-1.5 h-1.5 bg-white rounded-full shadow-[0_0_8px_rgba(255,255,255,1)]" />
            <div className="w-1.5 h-1.5 bg-gray-300 rounded-full shadow-[0_0_8px_rgba(255,255,255,0.8)]" />
        </motion.div>
      </motion.div>
    </div>
  );
}
