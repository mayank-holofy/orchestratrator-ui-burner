import { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, RefreshCw, Edit3, Trash2 } from 'lucide-react';
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
  
  // Modal and menu state
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingAssistant, setEditingAssistant] = useState<Assistant | null>(null);
  const [editingThreadId, setEditingThreadId] = useState<string | null>(null);
  const [showDropdownMenu, setShowDropdownMenu] = useState(false);
  const [dropdownAssistant, setDropdownAssistant] = useState<Assistant | null>(null);
  const [dropdownThreadId, setDropdownThreadId] = useState<string | null>(null);
  const [dropdownPosition, setDropdownPosition] = useState({ x: 0, y: 0 });
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  // Form state for editing
  const [editingName, setEditingName] = useState('');
  const [editingDescription, setEditingDescription] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  
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
          
          // Debug: Log thread metadata to see what's available
          console.log(`Thread ${thread.thread_id} metadata:`, thread.metadata);
          console.log(`Thread ${thread.thread_id} values:`, thread.values);
          
          // Look deeper into messages for current task info
          if (thread.values?.messages && Array.isArray(thread.values.messages)) {
            const lastMessages = thread.values.messages.slice(-3); // Get last 3 messages
            console.log(`Thread ${thread.thread_id} last messages:`, lastMessages);
            
            // Examine the structure of the last message
            const lastMessage = thread.values.messages[thread.values.messages.length - 1];
            if (lastMessage) {
              console.log(`Thread ${thread.thread_id} last message full:`, lastMessage);
              
              // If content is an array, examine the first item
              if (Array.isArray(lastMessage.content) && lastMessage.content.length > 0) {
                console.log(`Thread ${thread.thread_id} content[0]:`, lastMessage.content[0]);
              }
            }
          }
          
          // Check files for current work
          if (thread.values?.files) {
            console.log(`Thread ${thread.thread_id} files:`, thread.values.files);
          }

          return {
            id: `${thread.thread_id}-${assistant.assistant_id}`,
            thread_id: thread.thread_id,
            assistant_id: assistant.assistant_id,
            name: thread.metadata?.custom_name || assistant.name || 'Untitled Conversation',
            description: thread.metadata?.custom_description || assistant.description || '',
            status: thread.status,
            lastActivity: thread.updated_at,
            messageCount: runs.length,
            assistant: {
              ...assistant,
              threadValues: thread.values // Pass thread values to WorkerCard
            }
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

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdownMenu(false);
      }
    };

    if (showDropdownMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showDropdownMenu]);

  const handleWorkerClick = (worker: WorkerItem) => {
    if (onWorkerSelect) {
      onWorkerSelect(worker.thread_id);
    }
  };

  const handleMenuClick = (assistant: Assistant, threadId: string) => {
    setDropdownAssistant(assistant);
    setDropdownThreadId(threadId);
    
    // Position dropdown in center for now
    setDropdownPosition({
      x: window.innerWidth / 2 - 60, // Center horizontally
      y: window.innerHeight / 2 - 50  // Center vertically
    });
    
    setShowDropdownMenu(true);
  };

  const handleEditRequest = () => {
    if (dropdownAssistant && dropdownThreadId) {
      // Find the worker for this specific thread to get current display name/description
      const worker = workers.find(w => w.thread_id === dropdownThreadId);
      if (worker) {
        setEditingAssistant(dropdownAssistant);
        setEditingThreadId(dropdownThreadId);
        setEditingName(worker.name);
        setEditingDescription(worker.description);
        setShowEditModal(true);
        setShowDropdownMenu(false);
      }
    }
  };

  const handleSaveChanges = async () => {
    if (!editingThreadId || isSaving) return;
    
    setIsSaving(true);
    try {
      console.log('Saving per-thread data:', {
        threadId: editingThreadId,
        name: editingName,
        description: editingDescription
      });
      
      // Note: Since there's no thread metadata update API yet, we'll update locally
      // In the future, this would call: orchestratorAPI.updateThreadMetadata(threadId, { custom_name, custom_description })
      
      // Update only the specific worker (thread) by thread_id
      setWorkers(prevWorkers => 
        prevWorkers.map(worker => 
          worker.thread_id === editingThreadId 
            ? {
                ...worker,
                name: editingName,
                description: editingDescription,
                // Don't update assistant object - that's global
                // Instead we'd store in thread metadata when API is available
              }
            : worker
        )
      );
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      setShowEditModal(false);
    } catch (error) {
      console.error('Failed to save thread data:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteRequest = () => {
    if (dropdownAssistant) {
      // TODO: Implement delete confirmation and deletion
      console.log('Delete assistant:', dropdownAssistant.assistant_id);
      setShowDropdownMenu(false);
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
                assistant={worker.assistant}
                onClick={() => handleWorkerClick(worker)}
                onMenuClick={handleMenuClick}
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

      {/* Dropdown Menu - Outside of cards */}
      {showDropdownMenu && dropdownAssistant && (
        <div
          ref={dropdownRef}
          className="fixed bg-gray-800 border border-gray-600 rounded-lg shadow-lg min-w-[120px] z-50"
          style={{
            top: dropdownPosition.y,
            left: dropdownPosition.x,
          }}
        >
          <div className="py-1">
            <button
              onClick={handleEditRequest}
              className="w-full px-3 py-2 text-left text-sm text-gray-300 hover:bg-gray-700 hover:text-white flex items-center gap-2"
            >
              <Edit3 className="w-3 h-3" />
              Edit Details
            </button>
            <button
              onClick={handleDeleteRequest}
              className="w-full px-3 py-2 text-left text-sm text-gray-300 hover:bg-red-600 hover:text-white flex items-center gap-2"
            >
              <Trash2 className="w-3 h-3" />
              Delete
            </button>
          </div>
        </div>
      )}

      {/* Edit Modal - Outside of cards */}
      {showEditModal && editingAssistant && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowEditModal(false)}>
          <div className="bg-gray-800 border border-gray-600 rounded-lg p-6 w-96 max-w-[90vw]" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-white text-lg font-medium mb-4">Edit Assistant Details</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-gray-300 text-sm mb-2">Name</label>
                <input
                  type="text"
                  value={editingName}
                  onChange={(e) => setEditingName(e.target.value)}
                  className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                  placeholder="Assistant name"
                  disabled={isSaving}
                />
              </div>
              
              <div>
                <label className="block text-gray-300 text-sm mb-2">Description</label>
                <textarea
                  value={editingDescription}
                  onChange={(e) => setEditingDescription(e.target.value)}
                  className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white focus:outline-none focus:border-blue-500 resize-none"
                  placeholder="Assistant description"
                  rows={3}
                  disabled={isSaving}
                />
              </div>
              
              <div>
                <label className="block text-gray-300 text-sm mb-2">Assistant ID (Read-only)</label>
                <input
                  type="text"
                  value={editingAssistant.assistant_id}
                  className="w-full bg-gray-900 border border-gray-600 rounded px-3 py-2 text-gray-400 font-mono text-sm"
                  disabled
                />
              </div>
              
              {editingAssistant.version && (
                <div>
                  <label className="block text-gray-300 text-sm mb-2">Version (Read-only)</label>
                  <input
                    type="text"
                    value={`v${editingAssistant.version}`}
                    className="w-full bg-gray-900 border border-gray-600 rounded px-3 py-2 text-gray-400 font-mono text-sm"
                    disabled
                  />
                </div>
              )}
            </div>
            
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowEditModal(false)}
                className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
                disabled={isSaving}
              >
                Cancel
              </button>
              <button
                onClick={handleSaveChanges}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                disabled={isSaving}
              >
                {isSaving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save Changes'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkersList;