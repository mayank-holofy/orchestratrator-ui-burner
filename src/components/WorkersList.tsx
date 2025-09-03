import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react';
import { orchestratorAPI } from '../services/orchestrator';
import type { Thread, Assistant } from '../services/orchestrator';
import WorkerCard from './WorkerCard';

interface WorkerItem {
  id: string;
  thread_id: string;
  assistant_id: string;
  name: string;
  description?: string;
  status: 'idle' | 'busy' | 'interrupted' | 'error';
  lastActivity: string;
  messageCount?: number;
  assistant: Assistant;
}

interface WorkersListProps {
  onWorkerSelect?: (threadId: string) => void;
  onNewWorker?: () => void;
  onCountChange?: (count: number) => void;
}

const WorkersList: React.FC<WorkersListProps> = ({ onWorkerSelect, onNewWorker, onCountChange }) => {
  const [workers, setWorkers] = useState<WorkerItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  
  const itemsPerPage = 4; // Show 4 cards per page on home screen

  const loadWorkers = async (page = 1) => {
    try {
      setLoading(true);
      setError(null);
      
      // Search for recent threads
      const threads = await orchestratorAPI.searchThreads({
        limit: itemsPerPage,
        offset: (page - 1) * itemsPerPage,
        sort_by: 'updated_at',
        sort_order: 'desc'
      });

      // Get total count
      const count = await orchestratorAPI.countThreads();
      setTotalCount(count);
      onCountChange?.(count);

      // For each thread, get associated assistants and create worker items
      const workerPromises = threads.map(async (thread): Promise<WorkerItem | null> => {
        try {
          // Get recent runs to find the assistant used
          const runs = await orchestratorAPI.getThreadRuns(thread.thread_id);
          if (runs.length === 0) return null;

          const latestRun = runs[0];
          const assistant = await orchestratorAPI.getAssistant(latestRun.assistant_id);

          return {
            id: `${thread.thread_id}-${assistant.assistant_id}`,
            thread_id: thread.thread_id,
            assistant_id: assistant.assistant_id,
            name: assistant.name || 'Untitled Conversation',
            description: assistant.description || 'AI Assistant Conversation',
            status: thread.status,
            lastActivity: thread.updated_at,
            messageCount: runs.length,
            assistant
          };
        } catch (err) {
          console.warn(`Failed to load assistant for thread ${thread.thread_id}:`, err);
          return null;
        }
      });

      const workerResults = await Promise.all(workerPromises);
      const validWorkers = workerResults.filter((w): w is WorkerItem => w !== null);
      
      setWorkers(validWorkers);
    } catch (err: any) {
      console.error('Failed to load workers:', err);
      setError(err.message || 'Failed to load conversations');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWorkers(currentPage);
  }, [currentPage]);

  const handleWorkerClick = (worker: WorkerItem) => {
    if (onWorkerSelect) {
      onWorkerSelect(worker.thread_id);
    }
  };

  const totalPages = Math.ceil(totalCount / itemsPerPage);
  const hasWorkers = workers.length > 0 || loading;

  if (!hasWorkers && !error) {
    return (
      <div className="w-full max-w-6xl mx-auto px-6 mb-8">
        <div className="text-center">
          <p className="text-gray-400 mb-6">No agents found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto px-6 mb-12">
      <div className="flex items-center justify-end mb-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => loadWorkers(currentPage)}
            disabled={loading}
            className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors duration-200 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 text-white ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 mb-6 bg-red-950/20 border border-red-500/20 rounded-lg">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      {/* Workers Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        {loading ? (
          [...Array(itemsPerPage)].map((_, i) => (
            <div
              key={`loading-${i}`}
              className="relative animate-pulse"
              style={{
                width: '198px',
                height: '321px',
                perspective: '1000px',
              }}
            >
              {/* Match WorkerCard structure exactly */}
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
                  {/* Loading skeleton content */}
                  <div className="relative h-full flex flex-col">
                    {/* Center logo placeholder */}
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                      <div className="h-20 w-20 bg-white/10 rounded opacity-30" />
                    </div>
                    
                    {/* Top left vertical text placeholder */}
                    <div className="absolute top-3 left-3">
                      <div className="h-16 w-2 bg-white/10 rounded" />
                    </div>

                    {/* Top right status placeholder */}
                    <div className="absolute top-3 right-3">
                      <div className="w-4 h-4 bg-white/10 rounded-full" />
                    </div>

                    {/* Center content placeholder */}
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 mt-8">
                      <div className="text-center">
                        <div className="h-3 w-24 bg-white/10 rounded mb-1 mx-auto" />
                        <div className="h-2 w-20 bg-white/10 rounded mx-auto" />
                      </div>
                    </div>

                    {/* Bottom info placeholders */}
                    <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between">
                      <div className="h-2 w-12 bg-white/10 rounded" />
                      <div className="h-2 w-8 bg-white/10 rounded" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : (
          workers.map((worker) => (
            <div key={worker.id}>
              <WorkerCard
                threadId={worker.thread_id}
                assistantId={worker.assistant_id}
                name={worker.name}
                description={worker.description}
                status={worker.status}
                lastActivity={worker.lastActivity}
                messageCount={worker.messageCount}
                onClick={() => handleWorkerClick(worker)}
              />
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-4">
          <button
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1 || loading}
            className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
          >
            <ChevronLeft className="w-4 h-4" />
            Previous
          </button>
          
          <span className="text-sm text-gray-400">
            Page {currentPage} of {totalPages}
          </span>
          
          <button
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages || loading}
            className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
          >
            Next
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};

export default WorkersList;