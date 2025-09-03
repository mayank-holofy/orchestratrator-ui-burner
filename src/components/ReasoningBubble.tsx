import { motion } from 'framer-motion';
import { Brain, Loader2 } from 'lucide-react';
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
}

const ReasoningBubble = ({ step, isLatest = false }: ReasoningBubbleProps) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className="mb-4 flex justify-start"
    >
      <div 
        className="max-w-[85%] px-4 py-3 rounded-2xl cursor-pointer"
        style={{
          background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(168, 85, 247, 0.1) 100%)',
          border: '1px solid rgba(99, 102, 241, 0.2)',
          backdropFilter: 'blur(10px)'
        }}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-2 mb-2">
          <div className="flex items-center gap-2">
            {step.status === 'pending' && isLatest ? (
              <Loader2 className="w-4 h-4 text-indigo-400 animate-spin" />
            ) : (
              <Brain className="w-4 h-4 text-indigo-400" />
            )}
            <span className="text-xs text-indigo-300 font-medium uppercase tracking-wide">
              {step.toolCall ? `Executing: ${step.toolCall.name}` : 
               step.status === 'pending' ? 'Thinking...' : 'Reasoning'}
            </span>
          </div>
          <span className="text-xs text-gray-500">
            {new Date(step.timestamp).toLocaleTimeString([], { 
              hour: '2-digit', 
              minute: '2-digit',
              second: '2-digit'
            })}
          </span>
        </div>
        
        <div className="text-sm text-gray-200">
          {isExpanded || step.content.length <= 100 ? (
            step.content
          ) : (
            <>
              {step.content.substring(0, 100)}...
              <span className="text-indigo-400 ml-2 text-xs">click to expand</span>
            </>
          )}
        </div>
        
        {step.status === 'pending' && isLatest && (
          <motion.div
            className="mt-2 h-1 bg-gray-700 rounded-full overflow-hidden"
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