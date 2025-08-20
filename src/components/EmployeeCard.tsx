import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import logo from '../assets/logo.svg';

interface EmployeeCardProps {
  visible?: boolean;
}

const EmployeeCard: React.FC<EmployeeCardProps> = ({ visible = true }) => {
  const [rotateX, setRotateX] = useState(0);
  const [rotateY, setRotateY] = useState(0);
  const [glareX, setGlareX] = useState(50);
  const [glareY, setGlareY] = useState(50);
  const cardRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    
    // Calculate rotation based on mouse position
    const rotateXValue = ((y - centerY) / centerY) * -15; // -15 to 15 degrees
    const rotateYValue = ((x - centerX) / centerX) * 15; // -15 to 15 degrees
    
    setRotateX(rotateXValue);
    setRotateY(rotateYValue);
    
    // Calculate glare position
    const glareXPercent = (x / rect.width) * 100;
    const glareYPercent = (y / rect.height) * 100;
    setGlareX(glareXPercent);
    setGlareY(glareYPercent);
  };

  const handleMouseLeave = () => {
    setRotateX(0);
    setRotateY(0);
    setGlareX(50);
    setGlareY(50);
  };

  if (!visible) return null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8, rotateY: 90 }}
      animate={{ opacity: 1, scale: 1, rotateY: 0 }}
      exit={{ opacity: 0, scale: 0.8, y: -50 }}
      transition={{ duration: 0.6, type: "spring" }}
      className="relative mb-8"
      style={{ perspective: '1000px' }}
    >
      <div
        ref={cardRef}
        className="relative mx-auto"
        style={{
          width: '198px',
          height: '321px',
          transformStyle: 'preserve-3d',
          transform: `rotateX(${rotateX}deg) rotateY(${rotateY}deg)`,
          transition: 'transform 0.1s ease-out',
        }}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        {/* Card Container with gradient border */}
        <div 
          className="absolute inset-0 p-[1px]"
          style={{
            borderRadius: '6px',
            background: 'linear-gradient(180deg, rgba(181, 181, 181, 1), rgba(79, 79, 79, 1))',
            boxShadow: '0 50px 100px 0 rgba(0, 0, 0, 0.7)',
          }}
        >
          {/* Inner Card */}
          <div 
            className="relative w-full h-full overflow-hidden"
            style={{
              borderRadius: '6px',
              background: '#000',
            }}
          >
            {/* Glare Effect */}
            <div
              className="absolute inset-0 pointer-events-none opacity-0 hover:opacity-100 transition-opacity duration-300"
              style={{
                background: `radial-gradient(circle at ${glareX}% ${glareY}%, rgba(255, 255, 255, 0.15) 0%, transparent 60%)`,
                mixBlendMode: 'overlay',
              }}
            />

            {/* Card Content */}
            <div className="relative h-full flex flex-col">
              {/* Logo - large and centered */}
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                <img 
                  src={logo} 
                  alt="Some100" 
                  className="h-20 w-auto opacity-30"
                  style={{ filter: 'brightness(0) invert(1)' }}
                />
              </div>
              
              {/* Top Section - Employee Type Label */}
              <div className="absolute top-3 left-3" style={{ writingMode: 'vertical-rl' }}>
                <div className="text-gray-500 text-[7px] uppercase tracking-[1px] font-light">
                  AI EMPLOYEE #0001
                </div>
              </div>

              {/* Main Profile Section */}
              <div className="relative h-full w-full flex items-center justify-center">
                {/* Dotted profile silhouette */}
                <div className="relative w-32 h-40">
                  {/* Create dotted pattern profile */}
                  <div 
                    className="absolute inset-0"
                    style={{
                      background: `
                        radial-gradient(circle at 50% 35%, 
                          transparent 0%, 
                          transparent 40%, 
                          rgba(200, 200, 200, 0.05) 40%, 
                          transparent 50%
                        )
                      `,
                    }}
                  />
                  
                  {/* Dot matrix pattern for profile */}
                  <svg 
                    viewBox="0 0 100 120" 
                    className="w-full h-full"
                    style={{ opacity: 0.4 }}
                  >
                    {/* Create dot pattern for head silhouette */}
                    {[...Array(15)].map((_, row) => (
                      [...Array(10)].map((_, col) => {
                        const x = col * 10 + 5;
                        const y = row * 8 + 4;
                        // Create head shape with dots
                        const inHead = 
                          (row < 7 && Math.abs(col - 5) <= 3 - row * 0.3) || // head
                          (row >= 7 && row < 12 && Math.abs(col - 5) <= 4); // shoulders
                        
                        if (inHead) {
                          return (
                            <circle
                              key={`${row}-${col}`}
                              cx={x}
                              cy={y}
                              r="0.8"
                              fill="rgba(150, 150, 150, 0.6)"
                            />
                          );
                        }
                        return null;
                      })
                    ))}
                  </svg>
                </div>
              </div>

              {/* Horizontal divider line */}
              <div className="absolute left-0 right-0 bottom-[25%] h-[0.5px] bg-gradient-to-r from-transparent via-gray-700 to-transparent opacity-50"></div>

              {/* Bottom Section - ID and status */}
              <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between">
                <div className="text-gray-500 text-[6px] font-mono">
                  ID: A5C291E-B9A2017
                </div>
                
                {/* Bottom right decorative element */}
                <div className="flex items-center gap-1">
                  <div className="w-4 h-[0.5px] bg-gradient-to-r from-transparent to-gray-600"></div>
                  <div className="w-4 h-[0.5px] bg-gradient-to-r from-gray-600 to-transparent"></div>
                </div>
              </div>
            </div>

            {/* Holographic Overlay Effect */}
            <div 
              className="absolute inset-0 pointer-events-none opacity-20"
              style={{
                background: `linear-gradient(135deg, 
                  transparent 30%, 
                  rgba(36, 255, 255, 0.1) 45%, 
                  rgba(255, 36, 255, 0.1) 50%, 
                  rgba(36, 255, 36, 0.1) 55%, 
                  transparent 70%)`,
                transform: `translateX(${(glareX - 50) * 0.5}px) translateY(${(glareY - 50) * 0.5}px)`,
                transition: 'transform 0.1s ease-out',
              }}
            />
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default EmployeeCard;