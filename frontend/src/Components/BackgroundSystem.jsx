import React from 'react';
import { motion } from 'framer-motion';

/**
 * BackgroundSystem - A premium layered background component
 * Layers:
 * 1. Base Gradient (Static)
 * 2. Animated Blobs (Framer Motion)
 * 3. Noise Texture (CSS Overlay)
 */
const BackgroundSystem = ({ children }) => {
  return (
    <div className="relative min-h-screen w-full bg-[#0b0f17] overflow-x-hidden">
      {/* Layer 1: Base Gradient */}
      <div className="fixed inset-0 bg-gradient-to-br from-[#0b0f17] via-[#0d1323] to-[#0a0f1c] -z-50" />

      {/* Layer 2: Animated Blobs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-40">
        {/* Top Right Accent - High Energy Blue */}
        <motion.div
          animate={{
            x: [0, 40, -20, 0],
            y: [0, -30, 50, 0],
            scale: [1, 1.1, 0.9, 1],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: "linear",
          }}
          className="absolute -top-[15%] -right-[15%] w-[70%] h-[70%] bg-blue-500/10 blur-[140px] rounded-full"
        />

        {/* Bottom Left Accent - Mystical Purple */}
        <motion.div
          animate={{
            x: [0, -60, 30, 0],
            y: [0, 80, -40, 0],
            scale: [1, 1.2, 0.95, 1],
          }}
          transition={{
            duration: 30,
            repeat: Infinity,
            ease: "linear",
          }}
          className="absolute -bottom-[20%] -left-[10%] w-[80%] h-[80%] bg-purple-600/10 blur-[160px] rounded-full"
        />

        {/* Subtle Middle Glow - Focus Emerald */}
        <motion.div
          animate={{
            opacity: [0.03, 0.08, 0.03],
            scale: [0.8, 1, 0.8],
          }}
          transition={{
            duration: 15,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60%] h-[60%] bg-emerald-500/5 blur-[120px] rounded-full"
        />
      </div>

      {/* Layer 3: Noise Texture Overlay */}
      <div className="fixed inset-0 bg-noise opacity-[0.03] pointer-events-none -z-30" />

      {/* Main Content Stage */}
      <div className="relative z-10 w-full">
        {children}
      </div>
    </div>
  );
};

export default BackgroundSystem;
