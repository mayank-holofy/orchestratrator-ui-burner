import { motion } from 'framer-motion';
import { Brain, Loader2, StopCircle } from 'lucide-react';
import { useState } from 'react';

interface ReasoningBubbleProps {
  step: {
    id: string;
    content: string;
    status: 'pending' | 'completed';
    timestamp: string;
    toolCall?: {name: string, description?: string};
  };
  isLatest?: boolean;
  onStop?: () => void;
}

const ReasoningBubble = ({ step, isLatest = false, onStop }: ReasoningBubbleProps) => {
  // For thinking/pending steps, start expanded; for completed, start collapsed if long
  const [isExpanded, setIsExpanded] = useState(
    step.status === 'pending' || step.content.length <= 200
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className="mb-6 flex justify-start"
    >
      <div 
        className="max-w-[85%] px-4 py-4 rounded-2xl cursor-pointer relative overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.08) 0%, rgba(168, 85, 247, 0.08) 100%)',
          border: '1px solid rgba(99, 102, 241, 0.15)',
          backdropFilter: 'blur(20px)',
          boxShadow: '0 8px 32px rgba(99, 102, 241, 0.1)'
        }}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            {step.status === 'pending' && isLatest ? (
              <Loader2 className="w-4 h-4 text-indigo-400 animate-spin" />
            ) : (
              <Brain className="w-4 h-4 text-indigo-400" />
            )}
            <div>
              <span className="text-sm text-indigo-300 font-medium block">
                {step.toolCall ? `Executing: ${step.toolCall.name}` : 
                 step.status === 'pending' ? 'Thinking...' : 'Reasoning'}
              </span>
              <span className="text-xs text-gray-500 font-mono">
                {new Date(step.timestamp).toLocaleTimeString([], { 
                  hour: '2-digit', 
                  minute: '2-digit',
                  second: '2-digit'
                })}
              </span>
            </div>
          </div>
        </div>
        
        <div className="text-sm text-gray-100 leading-relaxed font-medium">
          <div className="whitespace-pre-wrap mb-3">
            {isExpanded ? step.content : (
              step.content.length > 200 
                ? step.content.substring(0, 200) + '...' 
                : step.content
            )}
          </div>
          
          {/* Expandable section for long content */}
          {step.content.length > 200 && (
            <div className="border-t border-gray-700/20 pt-2 mb-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsExpanded(!isExpanded);
                }}
                className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors flex items-center gap-1"
              >
                {isExpanded ? 'Show less' : 'Show more'}
                <span className="text-gray-500">({step.content.length} chars)</span>
              </button>
            </div>
          )}
          
          {/* Stop button for pending latest step - positioned after content */}
          {step.status === 'pending' && isLatest && onStop && (
            <div className="flex justify-center pt-3 border-t border-gray-700/20">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onStop();
                }}
                className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition-all duration-200 flex items-center gap-2 shadow-md hover:shadow-lg"
                title="Stop execution"
              >
                <StopCircle size={14} />
                <span className="text-xs font-medium">Stop</span>
              </button>
            </div>
          )}
        </div>
        
        {step.status === 'pending' && isLatest && (
          <motion.div
            className="mt-2 h-1 bg-gray-700/30 rounded-full overflow-hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            <motion.div
              className="h-full bg-gradient-to-r from-indigo-500 to-purple-500"
              animate={{
                x: [-100, 200],
              }}
              transition={{
                repeat: Infinity,
                duration: 2,
                ease: "easeInOut"
              }}
              style={{ width: '30%' }}
            />
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};

export default ReasoningBubble;