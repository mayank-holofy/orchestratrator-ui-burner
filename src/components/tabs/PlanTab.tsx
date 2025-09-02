import { motion } from 'framer-motion';
import { CheckCircle2, Circle, Loader2, XCircle, PlayCircle } from 'lucide-react';
import type { AgentPlan } from '../../hooks/useAgent';
import ToolCallBox from '../ToolCallBox/index.jsx';
import '../ChatScrollbar.css';

interface PlanTabProps {
  plan: AgentPlan | null;
  isProcessing: boolean;
}

const PlanTab = ({ plan, isProcessing }: PlanTabProps) => {
  const getTaskIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="w-5 h-5 text-green-500" />;
      case 'running':
        return <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />;
      case 'failed':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'pending':
      default:
        return <Circle className="w-5 h-5 text-gray-500" />;
    }
  };

  const getTaskBgColor = (status: string, isCurrent: boolean) => {
    if (isCurrent) return 'bg-blue-500/10 border-blue-500/30';
    switch (status) {
      case 'completed':
        return 'bg-green-500/5 border-green-500/20';
      case 'running':
        return 'bg-blue-500/5 border-blue-500/20';
      case 'failed':
        return 'bg-red-500/5 border-red-500/20';
      default:
        return 'bg-gray-800/30 border-gray-700/30';
    }
  };

  return (
    <motion.div
      key="plan"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="h-full overflow-y-auto tab-scrollbar"
    >
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <h2 className="text-white text-2xl font-light">EXECUTION PLAN</h2>
          {isProcessing && (
            <div className="flex items-center gap-2 text-blue-400 text-sm">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Executing...</span>
            </div>
          )}
        </div>
      </div>

      {!plan ? (
        <div className="flex flex-col items-center justify-center h-64 text-gray-500">
          <PlayCircle className="w-12 h-12 mb-4 opacity-50" />
          <p className="text-sm">No active plan</p>
          <p className="text-xs mt-2 opacity-70">Send a task to generate an execution plan</p>
        </div>
      ) : (
        <div className="space-y-3">
          {/* Show all tasks */}
          {plan.tasks.length > 0 && plan.tasks.map((task, index) => (
              <motion.div
                key={task.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05, duration: 0.3 }}
                className={`
                  flex items-start gap-3 p-4 rounded-lg border
                  transition-all duration-300
                  ${getTaskBgColor(task.status, false)}
                `}
              >
                {/* Task Content */}
                <div className="flex-1">
                  {(task as any).toolCall ? (
                    /* Task management tool - show clean summary */
                    <div>
                      <div className="space-y-3">
                        {/* Tool Call Request */}
                        <div className="flex items-center gap-2">
                          {getTaskIcon(task.status)}
                          <span className="text-white font-medium">{(task as any).toolCall.name}</span>
                          <span className="text-xs text-gray-500 uppercase">{task.status}</span>
                        </div>
                        
                        {/* Tool Arguments (Request) */}
                        {(task as any).toolCall.args && Object.keys((task as any).toolCall.args).length > 0 && (
                          <div className="p-3 bg-blue-900/20 rounded border-l-2 border-blue-500/30">
                            <div className="text-xs text-blue-400 mb-1">Request:</div>
                            <pre className="text-xs text-gray-300 whitespace-pre-wrap font-mono">
                              {JSON.stringify((task as any).toolCall.args, null, 2)}
                            </pre>
                          </div>
                        )}
                        
                        {/* Tool Result (Response) */}
                        {(task as any).toolCall.result && (
                          <div className="p-3 bg-green-900/20 rounded border-l-2 border-green-500/30">
                            <div className="text-xs text-green-400 mb-1">Response:</div>
                            <div className="text-xs text-gray-300 whitespace-pre-wrap font-mono max-h-48 overflow-y-auto">
                              {typeof (task as any).toolCall.result === 'string' 
                                ? (task as any).toolCall.result
                                : JSON.stringify((task as any).toolCall.result, null, 2)
                              }
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    /* Regular task delegation */
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="text-gray-200 text-sm font-medium">
                          {(task as any).title || task.name}
                        </p>
                        {((task as any).description || (task as any).type) && (
                          <p className="text-gray-500 text-xs mt-1">
                            {(task as any).type && <span className="uppercase tracking-wide">{(task as any).type}</span>}
                            {(task as any).type && (task as any).description && <span> • </span>}
                            {(task as any).description}
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                    
                  {/* Progress Indicator */}
                  {task.progress !== undefined && task.status === 'running' && (
                    <div className="ml-4 flex items-center gap-2">
                      <div className="w-24 h-1 bg-gray-700 rounded-full overflow-hidden">
                        <motion.div
                          className="h-full bg-blue-500"
                          initial={{ width: 0 }}
                          animate={{ width: `${task.progress}%` }}
                          transition={{ duration: 0.3 }}
                        />
                      </div>
                      <span className="text-xs text-gray-500">
                        {task.progress}%
                      </span>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}

          {/* Summary */}
          {plan.tasks.length > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="mt-6 p-4 bg-gray-800/20 rounded-lg border border-gray-700/30"
            >
              <div className="grid grid-cols-4 gap-4 text-center">
                <div>
                  <p className="text-2xl font-light text-white">
                    {plan.tasks.length}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">Total</p>
                </div>
                <div>
                  <p className="text-2xl font-light text-green-400">
                    {plan.tasks.filter(t => t.status === 'completed').length}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">Completed</p>
                </div>
                <div>
                  <p className="text-2xl font-light text-blue-400">
                    {plan.tasks.filter(t => t.status === 'running').length}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">Running</p>
                </div>
                <div>
                  <p className="text-2xl font-light text-gray-400">
                    {plan.tasks.filter(t => t.status === 'pending').length}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">Pending</p>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      )}
    </motion.div>
  );
};

export default PlanTab;