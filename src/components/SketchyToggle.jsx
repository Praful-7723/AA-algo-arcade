import React from 'react';
import { motion } from 'framer-motion';

export const SketchyToggle = ({ options, activeOption, onChange }) => {
    return (
        <div style={{ display: 'flex', gap: '2rem', justifyContent: 'center', padding: '0.25rem', background: 'transparent' }}>
            {options.map((opt) => {
                const isActive = activeOption === opt.id;
                return (
                    <div
                        key={opt.id}
                        onClick={() => onChange(opt.id)}
                        style={{
                            position: 'relative',
                            padding: '0.5rem 0.5rem',
                            fontFamily: 'Inter, sans-serif',
                            fontSize: '1rem',
                            fontWeight: isActive ? 800 : 600,
                            color: isActive ? '#000' : 'rgba(0,0,0,0.5)',
                            cursor: 'pointer',
                            userSelect: 'none',
                            transition: 'color 0.2s',
                            zIndex: 1
                        }}
                    >
                        <span style={{ position: 'relative', zIndex: 10 }}>{opt.label}</span>

                        {isActive && (
                            <svg 
                                style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: '-1', overflow: 'visible' }} 
                                viewBox="0 0 100 100" 
                                preserveAspectRatio="none"
                            >
                                <motion.path
                                    d="M-5,50 Q25,40 50,50 T105,50"
                                    fill="none"
                                    stroke="#fff"
                                    strokeWidth="40"
                                    strokeLinecap="round"
                                    initial={{ pathLength: 0 }}
                                    animate={{ pathLength: 1 }}
                                    transition={{ duration: 0.3, ease: "easeInOut" }}
                                    style={{ opacity: 0.9 }}
                                />
                                <motion.path
                                    d="M-5,85 Q25,95 50,85 T105,85"
                                    fill="none"
                                    stroke="black"
                                    strokeWidth="3"
                                    initial={{ pathLength: 0 }}
                                    animate={{ pathLength: 1 }}
                                    transition={{ duration: 0.4, delay: 0.1 }}
                                />
                            </svg>
                        )}
                    </div>
                )
            })}
        </div>
    );
};
