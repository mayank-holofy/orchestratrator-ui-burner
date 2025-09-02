import { motion, AnimatePresence } from 'framer-motion';
import { Activity, AlertCircle, CheckCircle, Info, AlertTriangle, Bug, MessageSquare, Zap, Terminal, Wrench, PlayCircle, StopCircle, Loader } from 'lucide-react';
import type { ActivityEvent } from '../../hooks/useAgent';
import { useState, useEffect, useRef } from 'react';
import ToolCallBox from '../ToolCallBox/index.jsx';
import { orchestratorAPI } from '../../services/orchestrator';
import '../ChatScrollbar.css';

interface ActivityTabProps {
  activities: ActivityEvent[];
  onClearActivities?: () => void;
  threadId?: string;
  isLoading?: boolean;
}

const ActivityTab = ({ activities, onClearActivities, threadId, isLoading }: ActivityTabProps) => {
  const [filter, setFilter] = useState<'all' | 'error'>('all');
  const [autoScroll, setAutoScroll] = useState(true);
  const [activeRuns, setActiveRuns] = useState<any[]>([]);
  const [cancellingRuns, setCancellingRuns] = useState<Set<string>>(new Set());
  const scrollRef = useRef<HTMLDivElement>(null);

  const getEventPriority = (type: string) => {
    // High priority: User actions, tool calls, important events
    const highPriorityTypes = ['tool_call', 'tool_result', 'user_message', 'messages', 'error'];
    // Low priority: System events, debugging, infrastructure
    const lowPriorityTypes = ['events', 'updates', 'debug', 'checkpoints', 'values', 'system'];
    
    if (highPriorityTypes.includes(type)) return 'high';
    if (lowPriorityTypes.includes(type)) return 'low';
    return 'high'; // Default to high for unknown types
  };

  const getEventIcon = (type: string, level: string) => {
    if (level === 'error') return <AlertCircle className="w-4 h-4 text-red-400" />;
    if (level === 'warning') return <AlertTriangle className="w-4 h-4 text-yellow-400" />;
    if (level === 'success') return <CheckCircle className="w-4 h-4 text-green-400" />;
    if (level === 'debug') return <Bug className="w-4 h-4 text-purple-400" />;
    
    switch (type) {
      case 'user_message':
      case 'messages':
        return <MessageSquare className="w-4 h-4 text-blue-400" />;
      case 'tool_call':
        return <Wrench className="w-4 h-4 text-orange-400" />;
      case 'tool_result':
        return <PlayCircle className="w-4 h-4 text-green-400" />;
      case 'tasks':
      case 'plan':
        return <Zap className="w-4 h-4 text-yellow-400" />;
      case 'system':
      case 'events':
        return <Terminal className="w-4 h-4 text-gray-400" />;
      default:
        return <Info className="w-4 h-4 text-gray-400" />;
    }
  };

  const getEventColor = (level: string) => {
    switch (level) {
      case 'error':
        return 'bg-red-500/10 border-red-500/20 text-red-400';
      case 'warning':
        return 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400';
      case 'success':
        return 'bg-green-500/10 border-green-500/20 text-green-400';
      case 'debug':
        return 'bg-purple-500/10 border-purple-500/20 text-purple-400';
      default:
        return 'bg-gray-800/30 border-gray-700/30 text-gray-400';
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      fractionalSecondDigits: 3
    });
  };

  const filteredActivities = activities
    .filter(activity => {
      // Filter by level only
      return filter === 'all' || activity.level === filter;
    });

  // Use isLoading prop to determine active runs instead of polling
  useEffect(() => {
    if (isLoading) {
      setActiveRuns([{ 
        run_id: 'stream-active', 
        thread_id: threadId || '', 
        assistant_id: 'bd9d7831-8cd0-52cf-b4ff-e0a75afee4f5',
        status: 'running',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        metadata: { source: 'stream' }
      }]);
    } else {
      setActiveRuns([]);
    }
  }, [isLoading, threadId]);


  useEffect(() => {
    if (autoScroll && scrollRef.current) {
      scrollRef.current.scrollTop = 0;
    }
  }, [activities, autoScroll]);

  const handleCancelRun = async (runId: string) => {
    if (!threadId || cancellingRuns.has(runId)) return;

    setCancellingRuns(prev => new Set(prev).add(runId));
    try {
      await orchestratorAPI.cancelRun(threadId, runId);
      // Remove from active runs immediately
      setActiveRuns(prev => prev.filter(run => run.run_id !== runId));
    } catch (error) {
      console.error('Failed to cancel run:', error);
    } finally {
      setCancellingRuns(prev => {
        const updated = new Set(prev);
        updated.delete(runId);
        return updated;
      });
    }
  };

  const getRunStatusIcon = (status: string) => {
    switch (status) {
      case 'running':
        return <Loader className="w-4 h-4 text-blue-400 animate-spin" />;
      case 'pending':
        return <PlayCircle className="w-4 h-4 text-yellow-400" />;
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-400" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-400" />;
      default:
        return <Info className="w-4 h-4 text-gray-400" />;
    }
  };

  const getRunStatusColor = (status: string) => {
    switch (status) {
      case 'running':
        return 'bg-blue-500/10 border-blue-500/30 text-blue-400';
      case 'pending':
        return 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400';
      case 'success':
        return 'bg-green-500/10 border-green-500/30 text-green-400';
      case 'error':
        return 'bg-red-500/10 border-red-500/30 text-red-400';
      default:
        return 'bg-gray-800/30 border-gray-700/30 text-gray-400';
    }
  };


  return (
    <motion.div
      key="activity"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="h-full flex flex-col"
    >
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-white text-2xl font-light">ACTIVITY LOG</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setAutoScroll(!autoScroll)}
              className={`px-3 py-1 text-xs rounded transition-colors ${
                autoScroll
                  ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                  : 'bg-gray-800/30 text-gray-400 border border-gray-700/30'
              }`}
            >
              Auto-scroll: {autoScroll ? 'ON' : 'OFF'}
            </button>
            {onClearActivities && (
              <button
                onClick={onClearActivities}
                className="px-3 py-1 text-xs rounded bg-gray-800/30 text-gray-400 border border-gray-700/30 hover:bg-gray-700/30 transition-colors"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Active Runs Section */}
        {(activeRuns.length > 0 || isLoading || threadId) && (
          <div className="mb-4 p-3 bg-gray-800/20 rounded-lg border border-gray-700/30">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-white text-sm font-medium">Active Operations</h3>
              {activeRuns.length > 1 && (
                <button
                  onClick={async () => {
                    try {
                      await orchestratorAPI.cancelAllRuns();
                      setActiveRuns([]);
                    } catch (error) {
                      console.error('Failed to cancel all runs:', error);
                    }
                  }}
                  className="px-2 py-1 text-xs rounded bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30 transition-colors flex items-center gap-1"
                >
                  <StopCircle className="w-3 h-3" />
                  Stop All
                </button>
              )}
            </div>
            
            {isLoading && activeRuns.length === 0 && (
              <div className="flex items-center gap-2 text-blue-400 text-xs">
                <Loader className="w-3 h-3 animate-spin" />
                <span>Operation in progress...</span>
              </div>
            )}

            {!isLoading && activeRuns.length === 0 && threadId && (
              <div className="flex items-center gap-2 text-gray-400 text-xs">
                <CheckCircle className="w-3 h-3" />
                <span>No active operations</span>
              </div>
            )}

            {activeRuns.map((run) => (
              <div key={run.run_id} className={`flex items-center justify-between p-2 rounded border text-xs mb-2 last:mb-0 ${getRunStatusColor(run.status)}`}>
                <div className="flex items-center gap-2">
                  {getRunStatusIcon(run.status)}
                  <div>
                    <span className="font-mono">{run.run_id.slice(0, 8)}...</span>
                    <span className="ml-2 opacity-70 capitalize">{run.status}</span>
                  </div>
                </div>
                <button
                  onClick={() => handleCancelRun(run.run_id)}
                  disabled={cancellingRuns.has(run.run_id)}
                  className="flex items-center gap-1 px-2 py-1 text-xs rounded bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30 transition-colors disabled:opacity-50"
                >
                  {cancellingRuns.has(run.run_id) ? (
                    <Loader className="w-3 h-3 animate-spin" />
                  ) : (
                    <StopCircle className="w-3 h-3" />
                  )}
                  Cancel
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Level Filters */}
        <div className="flex gap-2 flex-wrap">
          {(['all', 'error'] as const).map(level => (
            <button
              key={level}
              onClick={() => setFilter(level)}
              className={`px-3 py-1 text-xs rounded capitalize transition-colors ${
                filter === level
                  ? 'bg-white/10 text-white border border-white/20'
                  : 'bg-gray-800/30 text-gray-400 border border-gray-700/30 hover:bg-gray-700/30'
              }`}
            >
              {level === 'all' ? '📋 All' : '❌ Errors'}
              {level !== 'all' && (
                <span className="ml-1 opacity-60">
                  ({activities.filter(a => a.level === level).length})
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Activity List */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto space-y-2 pr-2 tab-scrollbar"
        style={{ maxHeight: 'calc(100vh - 300px)' }}
      >
        {filteredActivities.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-gray-500">
            <Activity className="w-12 h-12 mb-4 opacity-50" />
            <p className="text-sm">No activities yet</p>
            <p className="text-xs mt-2 opacity-70">Events will appear here as they occur</p>
          </div>
        ) : (
          <AnimatePresence mode="popLayout">
            {filteredActivities.map((event) => (
              <motion.div
                key={event.id}
                layout
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.2 }}
                className={`
                  ${event.type === 'tool_call' ? 'p-2' : 'p-3'} rounded-lg border text-xs
                  ${event.type === 'tool_call' ? '' : 'font-mono'}
                  ${getEventColor(event.level)}
                  ${getEventPriority(event.type) === 'low' ? 'opacity-60' : ''}
                `}
              >
                <div className="flex items-start gap-3">
                  {/* Icon */}
                  <div className="flex-shrink-0 mt-0.5">
                    {getEventIcon(event.type, event.level)}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <span className="font-semibold uppercase opacity-70">
                        {event.type.replace(/_/g, ' ')}
                      </span>
                      <span className="text-[10px] opacity-50 flex-shrink-0">
                        {formatTimestamp(event.timestamp)}
                      </span>
                    </div>

                    {/* Event Data */}
                    <div className="text-gray-300 break-all w-full">
                      {event.type === 'tool_call' && event.data?.toolCall ? (
                        <div className="mt-2">
                          <ToolCallBox toolCall={event.data.toolCall} />
                        </div>
                      ) : typeof event.data === 'string' ? (
                        <span>{event.data}</span>
                      ) : event.data?.message ? (
                        <span>{event.data.message}</span>
                      ) : (
                        <details className="cursor-pointer">
                          <summary className="hover:text-white transition-colors">
                            {Object.keys(event.data || {}).length} properties
                          </summary>
                          <pre className="mt-2 p-2 bg-black/30 rounded text-[10px] overflow-x-auto">
                            {JSON.stringify(event.data, null, 2)}
                          </pre>
                        </details>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>

      {/* Stats */}
      {activities.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-800">
          <div className="flex justify-between text-xs text-gray-500">
            <span>Total: {activities.length} events</span>
            <span>Showing: {filteredActivities.length}</span>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default ActivityTab;