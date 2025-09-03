import { useState, useEffect } from 'react';
import { 
  MessageCircle, 
  Calendar, 
  ChevronRight, 
  RefreshCw, 
  Search,
  Clock,
  Activity,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import { orchestratorAPI } from '../../services/orchestrator';
import type { Thread, Assistant } from '../../services/orchestrator';
import { useNavigate } from 'react-router-dom';

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

interface WorkersTabProps {
  onWorkerSelect?: (threadId: string) => void;
}

const WorkersTab: React.FC<WorkersTabProps> = ({ onWorkerSelect }) => {
  const [workers, setWorkers] = useState<WorkerItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const navigate = useNavigate();
  
  const itemsPerPage = 10;

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

  const filteredWorkers = workers.filter(worker =>
    worker.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    worker.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleWorkerClick = (worker: WorkerItem) => {
    if (onWorkerSelect) {
      onWorkerSelect(worker.thread_id);
    } else {
      // Navigate to the specific thread
      navigate(`/threads/${worker.thread_id}`);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'busy': return <Activity className="w-4 h-4 text-blue-400 animate-pulse" />;
      case 'error': return <AlertCircle className="w-4 h-4 text-red-400" />;
      case 'interrupted': return <Clock className="w-4 h-4 text-yellow-400" />;
      default: return <CheckCircle className="w-4 h-4 text-green-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'busy': return 'border-blue-500/20 bg-blue-950/20';
      case 'error': return 'border-red-500/20 bg-red-950/20';
      case 'interrupted': return 'border-yellow-500/20 bg-yellow-950/20';
      default: return 'border-green-500/20 bg-green-950/20';
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

  const totalPages = Math.ceil(totalCount / itemsPerPage);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <MessageCircle className="w-6 h-6 text-white" />
          <h2 className="text-xl font-semibold text-white">Previous Conversations</h2>
          <span className="px-2 py-1 text-xs bg-white/10 text-gray-300 rounded-full">
            {totalCount}
          </span>
        </div>
        
        <button
          onClick={() => loadWorkers(currentPage)}
          disabled={loading}
          className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors duration-200 disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 text-white ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="Search conversations..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500/50 focus:bg-white/15"
        />
      </div>

      {/* Error State */}
      {error && (
        <div className="p-4 mb-4 bg-red-950/20 border border-red-500/20 rounded-lg">
          <div className="flex items-center gap-2 text-red-400">
            <AlertCircle className="w-4 h-4" />
            <span className="text-sm">{error}</span>
          </div>
        </div>
      )}

      {/* Workers List */}
      <div className="flex-1 overflow-auto">
        {loading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="p-4 bg-white/5 border border-white/10 rounded-lg animate-pulse">
                <div className="h-4 bg-white/20 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-white/20 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        ) : filteredWorkers.length === 0 ? (
          <div className="text-center py-12">
            <MessageCircle className="w-12 h-12 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400">
              {searchTerm ? 'No conversations match your search' : 'No previous conversations found'}
            </p>
            <p className="text-sm text-gray-500 mt-2">
              Start chatting to see your conversations here
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredWorkers.map((worker) => (
              <div
                key={worker.id}
                className={`group p-4 border rounded-lg cursor-pointer transition-all duration-200 hover:bg-white/10 ${getStatusColor(worker.status)}`}
                onClick={() => handleWorkerClick(worker)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      {getStatusIcon(worker.status)}
                      <h3 className="font-medium text-white truncate">{worker.name}</h3>
                    </div>
                    
                    {worker.description && (
                      <p className="text-sm text-gray-400 truncate mb-2">{worker.description}</p>
                    )}
                    
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {formatRelativeTime(worker.lastActivity)}
                      </span>
                      {worker.messageCount && (
                        <span className="flex items-center gap-1">
                          <MessageCircle className="w-3 h-3" />
                          {worker.messageCount} messages
                        </span>
                      )}
                      <span className="capitalize">{worker.status}</span>
                    </div>
                  </div>
                  
                  <ChevronRight className="w-5 h-5 text-gray-500 group-hover:text-white transition-colors" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/10">
          <span className="text-sm text-gray-400">
            Page {currentPage} of {totalPages}
          </span>
          
          <div className="flex gap-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 text-sm bg-white/10 hover:bg-white/20 rounded disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <button
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1 text-sm bg-white/10 hover:bg-white/20 rounded disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkersTab;