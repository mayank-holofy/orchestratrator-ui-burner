import { useState, useRef } from 'react';
import { 
  MessageCircle, 
  Calendar, 
  Activity,
  AlertCircle,
  CheckCircle,
  Clock,
  MoreVertical,
  Edit3,
  Trash2
} from 'lucide-react';
import logo from '../assets/logo.svg';
import { orchestratorAPI, type Assistant } from '../services/orchestrator';

interface WorkerCardProps {
  threadId: string;
  assistantId: string;
  name: string;
  description?: string;
  status: 'idle' | 'busy' | 'interrupted' | 'error';
  lastActivity: string;
  messageCount?: number;
  assistant: Assistant; // Full assistant object with all data
  onClick?: () => void;
  className?: string;
  onMenuClick?: (assistant: Assistant, threadId: string) => void;
}

const WorkerCard: React.FC<WorkerCardProps> = ({
  threadId,
  assistantId,
  name,
  description,
  status,
  lastActivity,
  messageCount,
  assistant,
  onClick,
  className = '',
  onMenuClick
}) => {
  
  // Early return if assistant data is not available
  if (!assistant) {
    return (
      <div
        className={`relative cursor-pointer transition-transform hover:scale-105 ${className}`}
        style={{
          perspective: '1000px',
          width: '198px',
          height: '321px',
        }}
      >
        <div className="relative w-full h-full animate-pulse">
          <div 
            className="absolute inset-0 p-[1px]"
            style={{
              borderRadius: '6px',
              background: 'linear-gradient(180deg, rgba(181, 181, 181, 0.3), rgba(79, 79, 79, 0.3))',
              boxShadow: '0 25px 50px 0 rgba(0, 0, 0, 0.3)',
            }}
          >
            <div 
              className="relative w-full h-full overflow-hidden"
              style={{
                borderRadius: '6px',
                background: '#111',
              }}
            >
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                <div className="h-20 w-20 bg-white/10 rounded opacity-30" />
              </div>
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 mt-8">
                <div className="text-center">
                  <div className="h-3 w-24 bg-white/10 rounded mb-1 mx-auto" />
                  <div className="h-2 w-20 bg-white/10 rounded mx-auto" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  // Card animation states
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
    const rotateXValue = ((y - centerY) / centerY) * -10; // -10 to 10 degrees
    const rotateYValue = ((x - centerX) / centerX) * 10; // -10 to 10 degrees
    
    // Only update if values have changed significantly to prevent infinite loops
    const threshold = 0.1;
    if (Math.abs(rotateXValue - rotateX) > threshold) {
      setRotateX(rotateXValue);
    }
    if (Math.abs(rotateYValue - rotateY) > threshold) {
      setRotateY(rotateYValue);
    }
    
    // Calculate glare position
    const glareXPercent = (x / rect.width) * 100;
    const glareYPercent = (y / rect.height) * 100;
    if (Math.abs(glareXPercent - glareX) > threshold) {
      setGlareX(glareXPercent);
    }
    if (Math.abs(glareYPercent - glareY) > threshold) {
      setGlareY(glareYPercent);
    }
  };

  const handleMouseLeave = () => {
    setRotateX(0);
    setRotateY(0);
    setGlareX(50);
    setGlareY(50);
  };

  // Handle menu click
  const handleMenuClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onMenuClick?.(assistant, threadId);
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'busy': return <Activity className="w-4 h-4 text-blue-400 animate-pulse" />;
      case 'error': return <AlertCircle className="w-4 h-4 text-red-400" />;
      case 'interrupted': return <Clock className="w-4 h-4 text-yellow-400" />;
      default: return <CheckCircle className="w-4 h-4 text-green-400" />;
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'busy': return 'border-blue-500/30';
      case 'error': return 'border-red-500/30';
      case 'interrupted': return 'border-yellow-500/30';
      default: return 'border-green-500/30';
    }
  };

  const getStatusStyle = () => {
    switch (status) {
      case 'busy': return 'bg-blue-500/20 text-blue-400 border border-blue-500/30';
      case 'error': return 'bg-red-500/20 text-red-400 border border-red-500/30';
      case 'interrupted': return 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30';
      default: return 'bg-green-500/20 text-green-400 border border-green-500/30';
    }
  };

  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 30) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div
      ref={cardRef}
      className={`relative cursor-pointer transition-transform hover:scale-105 ${className}`}
      style={{
        perspective: '1000px',
        width: '198px',
        height: '321px',
      }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
    >
      <div
        className="relative w-full h-full"
        style={{
          transformStyle: 'preserve-3d',
          transform: `rotateX(${rotateX}deg) rotateY(${rotateY}deg)`,
          transition: 'transform 0.3s ease-out',
        }}
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
              
              {/* Top Section - Agent ID (left edge) */}
              <div className="absolute top-3 left-3" style={{ writingMode: 'vertical-rl' }}>
                <div className="text-gray-500 text-[8px] uppercase tracking-[1px] font-light">
                  AGENT #{threadId.slice(0, 8)}
                </div>
              </div>

              {/* Menu in top right */}
              <div className="absolute top-3 right-3 z-10">
                <button
                  onClick={handleMenuClick}
                  className="p-1 rounded-full hover:bg-gray-700/50 transition-colors duration-200"
                >
                  <MoreVertical className="w-4 h-4 text-gray-400 hover:text-white" />
                </button>
              </div>

              {/* Assistant Name - Top Left with padding from edge */}
              <div className="absolute top-4 left-8">
                <h3 className="text-white text-sm font-medium max-w-[140px] leading-tight">
                  {assistant.name}
                </h3>
                {assistant.description && assistant.description.length > 0 && (
                  <p className="text-gray-400 text-xs mt-1 max-w-[140px] leading-tight">
                    {assistant.description}
                  </p>
                )}
              </div>

              {/* Current Task - Bottom Left */}
              <div className="absolute bottom-12 left-3 right-3">
                <div className="text-left space-y-1">
                  <div className="px-3 py-1.5 bg-gray-800/30 border border-gray-700/20 rounded text-[7px] text-gray-400 font-mono tracking-wide leading-tight">
                    {(() => {
                      // Extract current task from thread values if available
                      const messages = (assistant as any).threadValues?.messages;
                      if (messages && Array.isArray(messages) && messages.length > 0) {
                        const lastMessage = messages[messages.length - 1];
                        const taskText = lastMessage?.content?.[0]?.text || '';
                        
                        // Extract key task info (first 80 chars)
                        const truncated = taskText.length > 80 ? taskText.substring(0, 80) + '...' : taskText;
                        return truncated || 'Ready';
                      }
                      return 'Ready';
                    })()}
                  </div>
                </div>
              </div>

              {/* Horizontal divider line */}
              <div className="absolute left-0 right-0 bottom-[25%] h-[0.5px] bg-gradient-to-r from-transparent via-gray-700 to-transparent opacity-50"></div>

              {/* Bottom Section - Last Activity, Status, and Message Count */}
              <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between">
                <div className="text-gray-500 text-[8px] font-mono">
                  {formatRelativeTime(lastActivity)}
                </div>
                
                <div className={`px-1.5 py-0.5 text-[7px] font-mono uppercase tracking-wider rounded ${getStatusStyle()}`}>
                  {status}
                </div>
                
                {messageCount && (
                  <div className="text-gray-500 text-[8px] font-mono">
                    {messageCount} msgs
                  </div>
                )}
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
    </div>
  );
};

export default WorkerCard;