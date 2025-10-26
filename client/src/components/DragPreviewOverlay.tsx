import { motion, AnimatePresence } from "motion/react";
import { Plus } from "lucide-react";

interface DragPreviewOverlayProps {
  start: { x: number; y: number };
  end: { x: number; y: number };
}

export const DragPreviewOverlay = ({ start, end }: DragPreviewOverlayProps) => {
  // Calculate bezier curve control points for smooth curve
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const distance = Math.sqrt(dx * dx + dy * dy);
  const safeDistance = distance === 0 ? 1 : distance; // avoid division by 0
  
  // Control points for bezier curve - create a natural flowing curve
  // The curve bends perpendicular to the connection line
  const curvature = Math.min(distance * 0.2, 80); // Dynamic curvature based on distance
  const midX = (start.x + end.x) / 2;
  const midY = (start.y + end.y) / 2;
  
  // Perpendicular offset for smooth curve
  const perpX = -dy / safeDistance;
  const perpY = dx / safeDistance;
  
  const controlPoint1X = midX + perpX * curvature * 0.5;
  const controlPoint1Y = midY + perpY * curvature * 0.5;
  const controlPoint2X = midX + perpX * curvature;
  const controlPoint2Y = midY + perpY * curvature;

  // Create SVG path for bezier curve
  const curvePath = `M ${start.x} ${start.y} C ${controlPoint1X} ${controlPoint1Y}, ${controlPoint2X} ${controlPoint2Y}, ${end.x} ${end.y}`;

  return (
    <motion.div 
      className="fixed top-0 left-0 w-full h-full pointer-events-none" 
      style={{ zIndex: 40 }}
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
    >
      <svg className="w-full h-full">
        <defs>
          {/* Gradient for the bezier curve */}
          <linearGradient id="dragCurveGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" style={{ stopColor: '#818cf8', stopOpacity: 0.8 }} />
            <stop offset="50%" style={{ stopColor: '#a78bfa', stopOpacity: 0.9 }} />
            <stop offset="100%" style={{ stopColor: '#c084fc', stopOpacity: 0.7 }} />
          </linearGradient>
          
          {/* Animated dash pattern */}
          <linearGradient id="dashGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" style={{ stopColor: '#818cf8', stopOpacity: 1 }} />
            <stop offset="100%" style={{ stopColor: '#a78bfa', stopOpacity: 0.8 }} />
          </linearGradient>

          {/* Glow filter for the curve */}
          <filter id="glowFilter" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>

        {/* Animated bezier curve */}
        <motion.path
          d={curvePath}
          stroke="url(#dragCurveGradient)"
          strokeWidth="3"
          fill="none"
          strokeLinecap="round"
          strokeDasharray="10,5"
          filter="url(#glowFilter)"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ 
            pathLength: 1, 
            opacity: 1,
            strokeDashoffset: [0, -15]
          }}
          transition={{
            pathLength: { duration: 0.4, ease: "easeOut" },
            opacity: { duration: 0.2 },
            strokeDashoffset: { 
              duration: 1, 
              repeat: Infinity, 
              ease: "linear" 
            }
          }}
        />

        {/* Start point indicator */}
        <motion.circle
          cx={start.x}
          cy={start.y}
          r="4"
          fill="#818cf8"
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 0.8 }}
          transition={{ type: "spring", stiffness: 400, damping: 20 }}
        />

        {/* Pulsing rings at end point - smaller and more subtle */}
        {[0, 1, 2].map((index) => (
          <motion.circle
            key={`ring-${index}`}
            cx={end.x}
            cy={end.y}
            r="12"
            fill="none"
            stroke="#818cf8"
            strokeWidth="1.5"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ 
              scale: [1, 2.2],
              opacity: [0.5, 0]
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              delay: index * 0.5,
              ease: "easeOut"
            }}
          />
        ))}
      </svg>

      {/* Ghost node preview at cursor - smaller and more subtle */}
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
        className="absolute pointer-events-none"
        style={{
          left: end.x - 80,
          top: end.y - 60,
        }}
      >
        {/* Ghost node card - reduced from w-72 h-48 to w-40 h-28 */}
        <motion.div
          className="w-40 h-28 rounded-xl bg-gradient-to-br from-white/30 to-white/15 backdrop-blur-sm border border-indigo-300/50 shadow-xl overflow-hidden relative"
          animate={{
            y: [0, -5, 0],
            boxShadow: [
              '0 8px 25px rgba(129, 140, 248, 0.25)',
              '0 12px 35px rgba(129, 140, 248, 0.35)',
              '0 8px 25px rgba(129, 140, 248, 0.25)',
            ]
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        >
          {/* Animated gradient background */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-br from-indigo-400/15 via-purple-400/15 to-pink-400/15"
            animate={{
              opacity: [0.2, 0.4, 0.2],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
          
          <div className="relative p-3 h-full flex flex-col items-center justify-center">
            {/* Plus icon with rotating glow - smaller */}
            <motion.div
              className="relative w-10 h-10 flex items-center justify-center mb-2"
            >
              {/* Rotating glow ring */}
              <motion.div
                className="absolute inset-0 rounded-full bg-gradient-to-br from-indigo-500/30 via-purple-500/30 to-pink-500/30"
                animate={{
                  rotate: [0, 360],
                  scale: [1, 1.15, 1],
                }}
                transition={{
                  rotate: { duration: 3, repeat: Infinity, ease: "linear" },
                  scale: { duration: 2, repeat: Infinity, ease: "easeInOut" }
                }}
              />
              
              {/* Plus icon */}
              <motion.div
                className="relative z-10"
                animate={{
                  scale: [1, 1.08, 1],
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              >
                <Plus className="w-5 h-5 text-white drop-shadow-md" strokeWidth={2.5} />
              </motion.div>
            </motion.div>
            
            {/* Preview text with shimmer effect - smaller */}
            <motion.div
              className="text-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <motion.div
                className="text-xs text-indigo-700/80"
                animate={{ opacity: [0.6, 0.9, 0.6] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              >
                New node
              </motion.div>
            </motion.div>
          </div>
        </motion.div>

        {/* Cursor cross indicator */}
        <motion.div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
        >
          <motion.div
            className="w-3 h-3 rounded-full bg-white border-2 border-indigo-500 shadow-lg"
            animate={{
              scale: [1, 1.3, 1],
            }}
            transition={{
              duration: 1,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
        </motion.div>
      </motion.div>

      {/* Particles around the end point - smaller and more subtle */}
      {[0, 1, 2, 3, 4, 5].map((index) => {
        const angle = (index / 6) * Math.PI * 2;
        const radius = 45;
        const particleX = end.x + Math.cos(angle) * radius;
        const particleY = end.y + Math.sin(angle) * radius;

        return (
          <motion.div
            key={`particle-${index}`}
            className="absolute w-1.5 h-1.5 rounded-full bg-indigo-400/80"
            style={{
              left: particleX,
              top: particleY,
            }}
            initial={{ scale: 0, opacity: 0 }}
            animate={{
              scale: [0, 1, 0],
              opacity: [0, 0.6, 0],
              x: [0, Math.cos(angle) * 15, Math.cos(angle) * 30],
              y: [0, Math.sin(angle) * 15, Math.sin(angle) * 30],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              delay: index * 0.2,
              ease: "easeOut"
            }}
          />
        );
      })}
    </motion.div>
  );
};
