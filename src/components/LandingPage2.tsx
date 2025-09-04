import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import {
  Plus,
  Mic,
  Send,
  ChevronDown,
  X,
  FileText,
  Wrench,
  Activity as ActivityIcon,
  Heart,
  Clock,
  StopCircle,
  File,
  MessageCircle,
} from 'lucide-react';
import logo from '../assets/logo.svg';
import EmployeeCard from './EmployeeCard';
import PlanTab from './tabs/PlanTab';
import ToolsTab from './tabs/ToolsTab';
import ActivityTab from './tabs/ActivityTab';
import HealthTab from './tabs/HealthTab';
import SchedulesTab from './tabs/SchedulesTab';
import FilesTab from './tabs/FilesTab';
import WorkersList from './WorkersList';
import { useOrchestratorChat } from '../hooks/useOrchestratorChat.js';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';
import { createClient } from '../lib/client.js';
import { getDeployment } from '../lib/environment/deployments';
import { useSearchParams, useParams, useNavigate } from 'react-router-dom';
import { useAuthContext } from '../providers/Auth.js';
import { extractStringFromMessageContent } from '../utils/orchestratoreChat.js';
import { orchestratorAPI } from '../services/orchestrator';
import Message from './Message.jsx';
import ReasoningBubble from './ReasoningBubble.tsx';
import './ChatScrollbar.css';

// Loading phrases like Claude Code (moved outside component to prevent re-renders)
const LOADING_PHRASES = [
  'Analyzing the situation...',
  'Processing your request...',
  'Gathering information...',
  'Thinking through the problem...',
  'Connecting the dots...',
  'Working on it...',
  'Almost there...',
  'Reviewing data...',
  'Organizing thoughts...',
  'Crafting a response...',
  'Double-checking details...',
  'Putting pieces together...',
  'Exploring possibilities...',
  'Finding the best approach...',
  'Cross-referencing information...',
  'Finalizing the solution...'
];

interface AttachedFile {
  id: string;
  name: string;
  type: string;
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface ReasoningStep {
  id: string;
  content: string;
  status: 'pending' | 'completed';
  timestamp: string;
  toolCall?: {name: string, description?: string};
}

const LandingPage2 = () => {
  const navigate = useNavigate();
  const [message, setMessage] = useState('');
  const [attachedFiles, setAttachedFiles] = useState<AttachedFile[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);
  const [showCard, setShowCard] = useState(true);
  const [agentCount, setAgentCount] = useState(0);
  
  // Speech recognition
  const {
    isListening,
    isSupported: speechSupported,
    transcript,
    interimTranscript,
    startListening,
    stopListening,
    resetTranscript
  } = useSpeechRecognition({
    continuous: false,
    interimResults: true,
    language: 'en-US',
    onResult: (result) => {
      if (result.isFinal) {
        setMessage(prev => prev + result.transcript);
        resetTranscript();
      }
    },
    onError: (error) => {
      console.error('Speech recognition error:', error);
    }
  });
  
  // Handle mic button click
  const handleMicClick = useCallback(() => {
    if (!speechSupported) {
      alert('Speech recognition is not supported in your browser');
      return;
    }
    
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  }, [speechSupported, isListening, startListening, stopListening]);
  
  const [isFocused, setIsFocused] = useState(false);
  const [params, setParams] = useSearchParams();
  const urlParams = useParams();
  const threadId = urlParams.threadId || params.get('threadId');
  const setThreadId = useCallback(
    (id: string) => setParams({ threadId: id }),
    [setParams]
  );
  const { session } = useAuthContext();
  const { messages, isLoading, sendMessage, stopStream } = useOrchestratorChat(
    threadId,
    setThreadId
  );

  // Fetch available tools
  useEffect(() => {
    const fetchTools = async () => {
      if (!session?.accessToken) return;
      
      try {
        const client = createClient(session.accessToken);
        const deployment = getDeployment();
        
        if (deployment?.agentId) {
          // Try to get assistant info which might include tools
          const assistant = await client.assistants.get(deployment.agentId);
          
          // For now, let's create a basic tools list based on what we see in activity
          // This is a temporary solution until we find the proper API
          const basicTools = [
            { name: 'list_tasks', description: 'List and manage tasks', status: 'available' },
            { name: 'computer_use', description: 'Computer vision and interaction', status: 'available' },
            { name: 'web_search', description: 'Search the web for information', status: 'available' },
            { name: 'file_operations', description: 'Read, write, and manage files', status: 'available' },
          ];
          setAvailableTools(basicTools);
        }
      } catch (error) {
        console.warn('Could not fetch tools:', error);
        // Set empty array if we can't fetch tools
        setAvailableTools([]);
      }
    };
    
    fetchTools();
  }, [session?.accessToken]);

  // Agent hook for API communication
  const [selectedSubAgent, setSelectedSubAgent] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [todos, setTodos] = useState([]);
  const [files, setFiles] = useState({});
  const [availableTools, setAvailableTools] = useState([]);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isLoadingThreadState, setIsLoadingThreadState] = useState(false);
  const [startNewThread, setStartNewThread] = useState(false);

  const [activeTab, setActiveTab] = useState<
    'plan' | 'tools' | 'activity' | 'health' | 'schedules' | 'files'
  >('activity');
  const [activeRuns, setActiveRuns] = useState<any[]>([]);
  const [threadStatus, setThreadStatus] = useState<string>('idle');
  const [statusMessage, setStatusMessage] = useState<{type: 'error' | 'info' | 'success', message: string} | null>(null);
  const [currentToolCall, setCurrentToolCall] = useState<{name: string, description?: string} | null>(null);
  const [currentReasoning, setCurrentReasoning] = useState<string | null>(null);
  const [loadingPhrase, setLoadingPhrase] = useState<string>('');
  const [reasoningSteps, setReasoningSteps] = useState<ReasoningStep[]>([]);

  // Auto dismiss status messages after 5 seconds
  useEffect(() => {
    if (statusMessage) {
      const timer = setTimeout(() => {
        setStatusMessage(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [statusMessage]);


  useEffect(() => {
    const fetchThreadState = async () => {
      if (!threadId || !session?.accessToken) {
        setTodos([]);
        setFiles({});
        setThreadStatus('idle');
        setIsLoadingThreadState(false);
        return;
      }
      setIsLoadingThreadState(true);
      try {
        const client = createClient(session.accessToken);
        const state = await client.threads.getState(threadId);

        if (state.values) {
          const currentState = state.values as any;
          setTodos(currentState.todos || []);
          setFiles(currentState.files || {});
        }

        // Fetch thread info for status
        try {
          const threadInfo = await orchestratorAPI.getThread(threadId);
          setThreadStatus(threadInfo.status || 'idle');
          
          // Handle error status with base64 encoded error message
          if (threadInfo.status === 'error' && threadInfo.error) {
            try {
              const decodedError = JSON.parse(atob(threadInfo.error));
              setStatusMessage({
                type: 'error',
                message: `Thread Error: ${decodedError.message || decodedError.error || 'Unknown error'}`
              });
            } catch (decodeError) {
              setStatusMessage({
                type: 'error',
                message: 'Thread has an error but could not decode error details'
              });
            }
          }
        } catch (statusError) {
          console.warn('Could not fetch thread status:', statusError);
          setThreadStatus('idle');
        }
      } catch (error: any) {
        console.error('Failed to fetch thread state:', error);
        setTodos([]);
        setFiles({});
        setThreadStatus('idle');
        setStatusMessage({
          type: 'error', 
          message: `Failed to load thread: ${error.message || 'Unknown error'}`
        });
      } finally {
        setIsLoadingThreadState(false);
      }
    };
    fetchThreadState();
  }, [threadId, session?.accessToken]);

  // Minimal polling - only check for error state on initial load
  useEffect(() => {
    if (!threadId) {
      setActiveRuns([]);
      return;
    }

    const checkForErrors = async () => {
      try {
        const threadInfo = await orchestratorAPI.getThread(threadId);
        
        // Handle error status with base64 encoded error message
        if (threadInfo.status === 'error' && threadInfo.error) {
          try {
            const decodedError = JSON.parse(atob(threadInfo.error));
            setStatusMessage({
              type: 'error',
              message: `Thread Error: ${decodedError.message || decodedError.error || 'Unknown error'}`
            });
          } catch (decodeError) {
            setStatusMessage({
              type: 'error',
              message: 'Thread has an error but could not decode error details'
            });
          }
        }
      } catch (error) {
        console.warn('Failed to fetch thread status:', error);
      }
    };

    // Only check once on initial load for errors
    checkForErrors();
  }, [threadId]);

  // Use LangChain stream state for real-time status instead of polling
  useEffect(() => {
    if (isLoading) {
      setThreadStatus('busy');
      setActiveRuns([{ id: 'stream-active', status: 'running' }]); // Simulate active run for UI
      
      // Start rotating loading phrases
      const getRandomPhrase = () => LOADING_PHRASES[Math.floor(Math.random() * LOADING_PHRASES.length)];
      setLoadingPhrase(getRandomPhrase());
      
      const phraseInterval = setInterval(() => {
        setLoadingPhrase(getRandomPhrase());
      }, 4500); // Change phrase every 4.5 seconds (similar to Claude Code)
      
      return () => clearInterval(phraseInterval);
    } else {
      setThreadStatus('idle');
      setActiveRuns([]);
      // Clear tool call and reasoning when loading stops
      setCurrentToolCall(null);
      setCurrentReasoning(null);
      setLoadingPhrase('');
      
      // Mark all pending reasoning steps as completed
      setReasoningSteps(prev => prev.map(step => 
        step.status === 'pending' ? { ...step, status: 'completed' } : step
      ));
    }
  }, [isLoading]);

  const handleStopAllRuns = async () => {
    try {
      await orchestratorAPI.cancelAllRuns();
      setActiveRuns([]);
      stopStream(); // Also stop any current streaming
    } catch (error) {
      console.error('Failed to cancel all runs:', error);
    }
  };

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isInChatState, setIsInChatState] = useState(false);

  // Auto-enter chat state when threadId is present (navigating to existing conversation)
  useEffect(() => {
    if (threadId && !isInChatState) {
      setIsInChatState(true);
      setShowCard(false);
      setActiveTab('activity'); // Show activity to see conversation history
    }
  }, [threadId]);

  // Handle escape key to go back to home screen
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && threadId) {
        // Navigate back to home screen
        navigate('/');
        // Reset chat state
        setIsInChatState(false);
        setShowCard(true);
      }
    };

    // Add event listener
    document.addEventListener('keydown', handleKeyDown);

    // Cleanup event listener on unmount
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [threadId, navigate]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      if (message || attachedFiles.length > 0) {
        textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
        setIsExpanded(true);
      } else {
        setIsExpanded(false);
      }
    }
  }, [message, attachedFiles]);

  useEffect(() => {
    if (isInChatState && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [isInChatState]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const newFiles = files.map((file) => ({
      id: Math.random().toString(36).substr(2, 9),
      name: file.name,
      type: file.type,
    }));
    setAttachedFiles([...attachedFiles, ...newFiles]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeFile = (id: string) => {
    setAttachedFiles(attachedFiles.filter((f) => f.id !== id));
  };

  const handleSendMessage = async () => {
    if (message.trim() || attachedFiles.length > 0) {
      try {
        // Enter chat state and hide card on first message send
        if (!isInChatState) {
          setShowCard(false);
          setIsInChatState(true);
        }
        
        // Clear reasoning steps when starting a new message
        setReasoningSteps([]);
        // Clear input
        const userRequest = message?.trim();
        setMessage('');
        setAttachedFiles([]);
        setStatusMessage(null); // Clear any previous errors
        sendMessage(userRequest);

        // Switch to activity tab to see what's happening
        setActiveTab('activity');
      } catch (error: any) {
        setStatusMessage({
          type: 'error',
          message: `Failed to send message: ${error.message || 'Unknown error'}`
        });
      }
    }
  };

  const handleInputFocus = () => {
    // Only set focus state, don't enter chat state yet
    // Chat state will be triggered on first message send
    setIsFocused(true);
  };

  // Extract tools from messages for thread-specific tools (no state updates here)
  const threadSpecificToolsFromMessages = useMemo(() => {
    const toolsInThread = new Set();
    
    messages.forEach((message: any) => {
      if (message.type === 'ai') {
        const toolCallsInMessage = [];
        if (message.additional_kwargs?.tool_calls) {
          toolCallsInMessage.push(...message.additional_kwargs.tool_calls);
        } else if (message.tool_calls) {
          toolCallsInMessage.push(...message.tool_calls.filter(tc => tc.name !== ''));
        } else if (Array.isArray(message.content)) {
          toolCallsInMessage.push(...message.content.filter(c => c.type === 'tool_use'));
        }

        toolCallsInMessage.forEach((toolCall) => {
          const name = toolCall.function?.name || toolCall.name || toolCall.type || 'unknown';
          const args = toolCall.function?.arguments || toolCall.args || toolCall.input || {};
          
          // Exclude TaskMaster tools from Tools tab (they go to Plan tab)
          const isTaskMasterTool = name.includes('_task') || 
                                  name.includes('taskmaster') ||
                                  (name === 'task' && args.subagent_type);
          
          if (!isTaskMasterTool) {
            toolsInThread.add(name);
          }
        });
      }
    });

    return Array.from(toolsInThread).map(toolName => ({
      name: toolName,
      status: 'available',
      description: `${toolName} tool used in this thread`,
      category: 'thread-specific'
    }));
  }, [messages]);

  // Route TaskMaster tools to Plan tab (deduplicated and clean) - Using useMemo to prevent infinite loops
  const { derivedPlanData, derivedActivities } = useMemo(() => {
    if (!messages || messages.length === 0) {
      return { derivedPlanData: [], derivedActivities: [] };
    }
    
    const planItems = new Map(); // Use Map to avoid duplicates
    const activityItems = new Map(); // Use Map for non-TaskMaster tools too
    
    messages.forEach((message: any) => {
      if (message.type === 'ai') {
        const toolCallsInMessage = [];
        if (message.additional_kwargs?.tool_calls) {
          toolCallsInMessage.push(...message.additional_kwargs.tool_calls);
        } else if (message.tool_calls) {
          toolCallsInMessage.push(...message.tool_calls.filter(tc => tc.name !== ''));
        } else if (Array.isArray(message.content)) {
          toolCallsInMessage.push(...message.content.filter(c => c.type === 'tool_use'));
        }

        toolCallsInMessage.forEach((toolCall) => {
          const name = toolCall.function?.name || toolCall.name || toolCall.type || 'unknown';
          const args = toolCall.function?.arguments || toolCall.args || toolCall.input || {};
          
          // Check if this is a TaskMaster tool (simplified filter)
          // Exclude schedule-related tools as they should go to SchedulesTab, not PlanTab
          const isTaskMasterTool = (name.includes('_task') || 
                                  name.includes('taskmaster') ||
                                  (name === 'task' && args.subagent_type)) &&
                                  name !== 'list_tasks' &&
                                  name !== 'list_scheduled_tasks' &&
                                  name !== 'check_scheduled_task' &&
                                  name !== 'schedule_task';

          if (isTaskMasterTool && toolCall.id) {
            const planItem = {
              id: toolCall.id, // Use actual tool call ID as key
              timestamp: new Date().toISOString(),
              type: name === 'task' && args.subagent_type ? 'task_delegation' : 'task_management',
              subAgentType: args.subagent_type || undefined,
              description: `${name} - ${args.description || args.prompt || `Executing ${name}`}`,
              status: 'pending',
              toolCall: {
                id: toolCall.id,
                name,
                args,
                status: 'pending',
                result: null
              }
            };
            planItems.set(toolCall.id, planItem);
          }

          // Add NON-TaskMaster tools to activity log
          if (!isTaskMasterTool && toolCall.id) {
            const activity = {
              id: toolCall.id, // Use tool call ID as key
              timestamp: new Date().toISOString(),
              type: 'tool_call',
              level: 'info',
              data: {
                toolCall: {
                  id: toolCall.id,
                  name,
                  args,
                  status: 'pending',
                  result: null
                }
              }
            };
            activityItems.set(toolCall.id, activity);
          }
        });
      } else if (message.type === 'tool') {
        // Update tool results in Plan tab (TaskMaster tools)
        const toolCallId = message.tool_call_id;
        if (toolCallId && planItems.has(toolCallId)) {
          const existingItem = planItems.get(toolCallId);
          const toolResult = extractStringFromMessageContent(message);
          
          planItems.set(toolCallId, {
            ...existingItem,
            status: 'completed',
            toolCall: {
              ...existingItem.toolCall,
              result: toolResult,
              status: 'completed'
            }
          });
        }

        // Update tool results in Activity log (NON-TaskMaster tools)
        if (toolCallId && activityItems.has(toolCallId)) {
          const existingActivity = activityItems.get(toolCallId);
          const toolResult = extractStringFromMessageContent(message);
          
          activityItems.set(toolCallId, {
            ...existingActivity,
            level: 'success',
            data: {
              ...existingActivity.data,
              toolCall: {
                ...existingActivity.data.toolCall,
                result: toolResult,
                status: 'completed'
              }
            }
          });
        }
      }
    });

    // Return both Plan data and Activities
    const derivedPlanData = Array.from(planItems.values()).reverse(); // Reverse to show newest first
    const derivedActivities = Array.from(activityItems.values()).reverse().slice(0, 500);
    
    return { derivedPlanData, derivedActivities };
  }, [messages]);

  // Use derived data directly instead of storing in state to prevent infinite loops
  const currentPlanData = derivedPlanData;
  const currentActivities = derivedActivities;

  const processedMessages = useMemo(() => {
    const messageMap = new Map();
    
    messages.forEach((message: any) => {
      if (message.type === 'ai') {
        const toolCallsInMessage = [];
        if (
          message.additional_kwargs?.tool_calls &&
          Array.isArray(message.additional_kwargs.tool_calls)
        ) {
          toolCallsInMessage.push(...message.additional_kwargs.tool_calls);
        } else if (message.tool_calls && Array.isArray(message.tool_calls)) {
          toolCallsInMessage.push(
            ...message.tool_calls.filter(
              (toolCall: any) => toolCall.name !== ''
            )
          );
        } else if (Array.isArray(message.content)) {
          const toolUseBlocks = message.content.filter(
            (block: any) => block.type === 'tool_use'
          );
          toolCallsInMessage.push(...toolUseBlocks);
        }
        
        const toolCallsWithStatus = toolCallsInMessage.map((toolCall) => {
          const name =
            toolCall.function?.name ||
            toolCall.name ||
            toolCall.type ||
            'unknown';
          const args =
            toolCall.function?.arguments ||
            toolCall.args ||
            toolCall.input ||
            {};
          
          return {
            id: toolCall.id || `tool-${Math.random()}`,
            name,
            args,
            status: 'pending',
          };
        });

        // Only show AI messages with text content, hide pure tool call messages
        const messageContent = extractStringFromMessageContent(message);
        if (messageContent.trim().length > 0) {
          messageMap.set(message.id, {
            message,
            toolCalls: [], // Don't show tool calls in chat - activity log handles that
          });
        }
      } else if (message.type === 'tool') {
        // Don't show tool results in chat - they're technical details for activity log
        // Tool results are already shown in activity log
        return;
      } else if (message.type === 'human') {
        messageMap.set(message.id, {
          message,
          toolCalls: [],
        });
      }
    });
    
    const processedArray = Array.from(messageMap.values());
    return processedArray.map((data, index) => {
      const prevMessage = index > 0 ? processedArray[index - 1].message : null;
      return {
        ...data,
        showAvatar: data.message.type !== prevMessage?.type,
      };
    });
  }, [messages]);

  // Separate effect to update current tool call and reasoning (prevents infinite loops)
  useEffect(() => {
    if (!isLoading) {
      setCurrentToolCall(null);
      setCurrentReasoning(null);
      return;
    }

    // Find the latest AI message with tool calls
    const latestAIMessage = [...messages].reverse().find(m => m.type === 'ai');
    if (latestAIMessage) {
      // Extract tool calls
      const toolCalls = latestAIMessage.tool_calls || 
                       latestAIMessage.additional_kwargs?.tool_calls ||
                       (Array.isArray(latestAIMessage.content) ? 
                         latestAIMessage.content.filter(c => c.type === 'tool_use') : []);
      
      if (toolCalls && toolCalls.length > 0) {
        const lastTool = toolCalls[toolCalls.length - 1];
        const toolName = lastTool.name || lastTool.function?.name || 'unknown';
        const toolArgs = lastTool.args || lastTool.function?.arguments || lastTool.input || {};
        
        setCurrentToolCall({
          name: toolName,
          description: toolArgs.description || toolArgs.prompt || `Executing ${toolName}`
        });
      }

      // Extract reasoning content
      const messageContent = extractStringFromMessageContent(latestAIMessage);
      if (messageContent.trim().length > 0) {
        setCurrentReasoning(messageContent);
        
        // Add or update reasoning step in chat history
        const stepId = `reasoning-${Date.now()}`;
        const newStep: ReasoningStep = {
          id: stepId,
          content: messageContent,
          status: 'pending',
          timestamp: new Date().toISOString(),
          toolCall: currentToolCall || undefined
        };
        
        setReasoningSteps(prev => {
          // Check if this is an update to the latest step or a new step
          const latest = prev[prev.length - 1];
          if (latest && latest.status === 'pending' && latest.content !== messageContent) {
            // Update the latest pending step
            return [...prev.slice(0, -1), { ...latest, content: messageContent }];
          } else if (!latest || latest.content !== messageContent) {
            // Add new step
            return [...prev, newStep];
          }
          return prev;
        });
      }
    }
  }, [messages, isLoading]);

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      {/* Background Video */}
      <div
        className="absolute inset-0 w-full h-full"
        style={{ opacity: isInChatState ? 0.3 : 1, transition: 'opacity 0.6s' }}
      >
        <video
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
        >
          <source src="/background-video.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-black/30"></div>
      </div>

      {/* Close Button - Only show in chat state */}
      {isInChatState && (
        <button
          onClick={() => {
            navigate('/');
            setIsInChatState(false);
            setShowCard(true);
          }}
          className="absolute top-6 left-17 z-50 p-3 rounded-lg bg-gray-900/50 border border-white/20 hover:bg-gray-800/60 transition-colors duration-200"
        >
          <X className="w-5 h-5 text-white" />
        </button>
      )}

      {/* Logo/Brand */}
      <div
        className="absolute top-8 left-8 z-20"
        style={{ opacity: isInChatState ? 0.5 : 1, transition: 'opacity 0.4s' }}
      >
        <img
          src={logo}
          alt="Some100 Logo"
          className="h-12 w-auto"
          style={{ filter: 'brightness(0) invert(1)' }}
        />
      </div>

      {/* Thread Status Indicator */}
      {threadId && (
        <div
          className="absolute top-8 right-8 z-20 flex items-center gap-2"
          style={{ 
            opacity: isInChatState ? 0.8 : 0.6,
            right: (isLoading || activeRuns.length > 0) && isInChatState ? '200px' : '32px',
            transition: 'all 0.4s'
          }}
        >
          <div className={`w-3 h-3 rounded-full ${
            threadStatus === 'idle' ? 'bg-gray-500' :
            threadStatus === 'busy' ? 'bg-green-500 animate-pulse' :
            threadStatus === 'interrupted' ? 'bg-orange-500' :
            threadStatus === 'error' ? 'bg-red-500' : 'bg-gray-500'
          }`} />
          <span className="text-white/80 text-sm font-medium capitalize">
            {threadStatus === 'busy' ? 'Running' : threadStatus}
          </span>
        </div>
      )}

      {/* Global Stop All Button */}
      {(isLoading || activeRuns.length > 0) && isInChatState && (
        <div
          className="absolute top-8 right-8 z-20"
          style={{ opacity: 1, transform: 'scale(1)', transition: 'all 0.3s' }}
        >
          <button
            onClick={handleStopAllRuns}
            className="flex items-center gap-2 px-4 py-2 bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30 rounded-lg transition-colors backdrop-blur-sm"
          >
            <StopCircle className="w-5 h-5" />
            <span className="text-sm font-medium">
              Stop All {activeRuns.length > 0 && `(${activeRuns.length})`}
            </span>
          </button>
        </div>
      )}

      {/* Main Content */}
      <div
        className="h-screen flex flex-col justify-center items-center px-6 relative z-10"
        style={{
          opacity: 1,
          width: isInChatState ? '50%' : '100%',
          justifyContent: isInChatState ? 'flex-start' : 'flex-end',
          paddingTop: isInChatState ? '80px' : '0px',
          paddingBottom: isInChatState ? '0px' : '80px',
          transition: 'all 0.3s ease'
        }}
      >
        {/* Employee Card and Title - Fade Out in Chat State */}
        <div>
          {!isInChatState && (
            <div
              className="w-full"
              style={{ maxWidth: '768px' }}
            >
              <EmployeeCard visible={false} />

              <div className="text-center mb-12">
                <h1
                  className="text-white font-light"
                  style={{ fontSize: '48px', lineHeight: '1.2' }}
                >
                  Create AI Employees
                </h1>
                <h2
                  className="text-white font-light mt-2"
                  style={{ fontSize: '48px', lineHeight: '1.2' }}
                >
                  in seconds
                  <span
                    className="inline-block ml-2"
                    style={{
                      width: '20px',
                      height: '48px',
                      backgroundColor: 'white',
                      animation: 'blink 1s infinite',
                    }}
                  ></span>
                </h2>
              </div>

            </div>
          )}
        </div>

        {/* Chat Messages - Appear in Chat State */}
        {isInChatState && (
          <div
            className="absolute top-8 left-0 right-0 overflow-y-auto px-6 chat-scrollbar"
            style={{ 
              maxWidth: '768px', 
              margin: '0 auto',
              bottom: '140px' // Reserve space for input box
            }}
              >
            <div className="flex flex-col min-h-full justify-end pb-48">
              {processedMessages.map((data, index) => (
                <Message
                  key={data.message.id}
                  index={index}
                  message={data.message}
                  toolCalls={data.toolCalls}
                  showAvatar={data.showAvatar}
                  onSelectSubAgent={setSelectedSubAgent}
                  selectedSubAgent={selectedSubAgent}
                />
              ))}
              
              {/* Reasoning Steps */}
              {reasoningSteps.map((step, index) => (
                <ReasoningBubble
                  key={step.id}
                  step={step}
                  isLatest={index === reasoningSteps.length - 1 && step.status === 'pending'}
                  onStop={stopStream}
                />
              ))}
              
              
              {isLoading && processedMessages.length > 0 && processedMessages[processedMessages.length - 1].message.type === 'human' && (
                <div
                                  className="flex justify-start mb-6"
                >
                  <div className="bg-[#1a1a1a] border border-gray-800 px-4 py-3 rounded-2xl">
                    <div className="flex gap-1">
                      <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                      <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                      <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                    </div>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} className="h-32" />
            </div>
          </div>
        )}

        {/* Status Message */}
        {statusMessage && (
          <div
            className="w-full"
            style={{ 
              maxWidth: '768px',
              opacity: 1,
              position: isInChatState ? 'fixed' : 'relative',
              bottom: isInChatState ? '140px' : 'auto',
              left: isInChatState ? '25%' : 'auto',
              transform: isInChatState ? 'translateX(-50%)' : 'none',
              paddingLeft: isInChatState ? '24px' : '0px',
              paddingRight: isInChatState ? '24px' : '0px',
              zIndex: isInChatState ? 25 : 1,
              marginBottom: isInChatState ? '0px' : '12px',
              transition: 'all 0.3s ease'
            }}
          >
            <div className={`px-4 py-3 rounded-lg border flex items-center gap-3 ${
              statusMessage.type === 'error' ? 'bg-red-950/50 border-red-500/30 text-red-200' :
              statusMessage.type === 'success' ? 'bg-green-950/50 border-green-500/30 text-green-200' :
              'bg-blue-950/50 border-blue-500/30 text-blue-200'
            }`}>
              <div className={`w-2 h-2 rounded-full ${
                statusMessage.type === 'error' ? 'bg-red-500' :
                statusMessage.type === 'success' ? 'bg-green-500' :
                'bg-blue-500'
              }`} />
              <span className="text-sm">{statusMessage.message}</span>
              <button 
                onClick={() => setStatusMessage(null)}
                className="ml-auto text-gray-400 hover:text-white"
              >
                ×
              </button>
            </div>
          </div>
        )}

        {/* THE SAME INPUT BOX - Animates from middle to bottom */}
        <div
          className="w-full"
          style={{ 
            maxWidth: '768px',
            opacity: 1,
            position: isInChatState ? 'fixed' : 'relative',
            bottom: isInChatState ? '24px' : 'auto',
            left: isInChatState ? '25%' : 'auto',
            transform: isInChatState ? 'translateX(-50%)' : 'none',
            paddingLeft: isInChatState ? '24px' : '0px',
            paddingRight: isInChatState ? '24px' : '0px',
            zIndex: isInChatState ? 25 : 1,
            transition: 'all 0.3s ease'
          }}
          >
          <div className="relative">
            {/* Glow effect when focused - only in landing */}
            {isFocused && !isInChatState && (
              <div
                className="absolute inset-0 rounded-2xl opacity-50 pointer-events-none"
                style={{
                  background:
                    'radial-gradient(circle at center, rgba(255, 255, 255, 0.1), transparent 70%)',
                  filter: 'blur(20px)',
                  transform: 'scale(1.05)',
                }}
              />
            )}

            <div
              className="relative"
              style={{ 
                borderRadius: '16px',
                padding: isInChatState ? '16px 20px' : '24px',
                minHeight: isInChatState ? 'auto' : '140px',
                backgroundColor: '#1E1E1E',
                borderWidth: '0.5px',
                borderColor:
                  isFocused && !isInChatState
                    ? 'rgba(255, 255, 255, 0.4)'
                    : isExpanded && !isInChatState
                    ? 'rgba(129, 129, 129, 0.6)'
                    : 'rgba(129, 129, 129, 0.3)',
                boxShadow:
                  isFocused && !isInChatState
                    ? '0 0 40px rgba(255, 255, 255, 0.1), inset 0 0 20px rgba(255, 255, 255, 0.05)'
                    : 'none',
                transform: isFocused && !isInChatState ? 'translateY(-2px)' : 'translateY(0)',
                borderStyle: 'solid',
                transition: 'all 0.3s ease'
              }}
            >
              {/* Attached Files */}
              {attachedFiles.length > 0 && (
                <div className="mb-4">
                  <div className="flex flex-wrap gap-2">
                    {attachedFiles.map((file) => (
                      <div
                        key={file.id}
                        className="flex items-center gap-2 bg-[rgba(30,30,30,1)] text-white px-3 py-1.5 rounded-md text-sm border border-[rgba(129,129,129,0.3)]"
                      >
                        <span>{file.name}</span>
                        <button
                          onClick={() => removeFile(file.id)}
                          className="hover:bg-[rgba(255,255,255,0.1)] rounded p-0.5"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Listening Indicator */}
              {isListening && !isInChatState && (
                <div className="flex items-center justify-center gap-2 text-red-400 text-sm mb-4 animate-fade-in">
                  <div className="w-2 h-2 bg-red-400 rounded-full animate-pulse"></div>
                  <span>Listening... Speak now</span>
                  <div className="w-2 h-2 bg-red-400 rounded-full animate-pulse"></div>
                </div>
              )}

              {/* Original textarea first in landing state */}
              {!isInChatState && (
                <textarea
                  ref={textareaRef}
                  value={message + (interimTranscript ? ` ${interimTranscript}` : '')}
                  onChange={(e) => setMessage(e.target.value)}
                  onFocus={handleInputFocus}
                  onBlur={() => setIsFocused(false)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  placeholder="Ask me anything..."
                  className="w-full bg-transparent text-white placeholder-gray-400 resize-none outline-none transition-all duration-300"
                  rows={1}
                  style={{
                    minHeight: '32px',
                    fontFamily: 'Saira, system-ui, sans-serif',
                    fontSize: '18px',
                    lineHeight: '28px',
                    color: isFocused
                      ? 'rgba(255, 255, 255, 1)'
                      : 'rgba(255, 255, 255, 0.9)',
                  }}
                />
              )}

              {/* Original bottom controls in landing state */}
              {!isInChatState && (
                <div className="flex items-center justify-between mt-6">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="text-gray-400 hover:text-white transition-colors p-2 hover:bg-[rgba(255,255,255,0.05)] rounded-lg"
                    >
                      <Plus size={22} />
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      multiple
                      onChange={handleFileSelect}
                      className="hidden"
                    />

                  </div>

                  <div className="flex items-center gap-2">
                    <button 
                      onClick={handleMicClick}
                      className={`transition-colors p-2.5 rounded-lg ${
                        isListening 
                          ? 'text-red-400 bg-red-400/10 hover:text-red-300 hover:bg-red-400/20' 
                          : 'text-gray-400 hover:text-white hover:bg-[rgba(255,255,255,0.05)]'
                      }`}
                      title={speechSupported ? (isListening ? 'Stop recording' : 'Start voice input') : 'Speech recognition not supported'}
                      disabled={!speechSupported}
                    >
                      <Mic size={22} className={isListening ? 'animate-pulse' : ''} />
                    </button>


                    <button
                      onClick={handleSendMessage}
                      className="bg-white text-black p-2.5 rounded-xl hover:bg-gray-100 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                      disabled={
                        (!message.trim() && attachedFiles.length === 0) ||
                        isLoading
                      }
                    >
                      <Send size={20} />
                    </button>
                  </div>
                </div>
              )}

              {/* Listening Indicator for Chat State */}
              {isListening && isInChatState && (
                <div className="flex items-center justify-center gap-2 text-red-400 text-sm mb-4 animate-fade-in">
                  <div className="w-2 h-2 bg-red-400 rounded-full animate-pulse"></div>
                  <span>Listening... Speak now</span>
                  <div className="w-2 h-2 bg-red-400 rounded-full animate-pulse"></div>
                </div>
              )}

              {/* Chat state - horizontal layout */}
              {isInChatState && (
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="text-gray-400 hover:text-white transition-colors p-2 hover:bg-[rgba(255,255,255,0.05)] rounded-lg"
                  >
                    <Plus size={20} />
                  </button>

                  <textarea
                    ref={textareaRef}
                    value={message + (interimTranscript ? ` ${interimTranscript}` : '')}
                    onChange={(e) => setMessage(e.target.value)}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                    placeholder="Type a message..."
                    className="flex-1 bg-transparent text-white placeholder-gray-400 resize-none outline-none transition-all duration-300"
                    rows={1}
                    style={{
                      minHeight: '24px',
                      fontFamily: 'Saira, system-ui, sans-serif',
                      fontSize: '15px',
                      lineHeight: '24px',
                      color: isFocused
                        ? 'rgba(255, 255, 255, 1)'
                        : 'rgba(255, 255, 255, 0.9)',
                    }}
                  />

                  <button 
                    onClick={handleMicClick}
                    className={`transition-colors p-2.5 rounded-lg ${
                      isListening 
                        ? 'text-red-400 bg-red-400/10 hover:text-red-300 hover:bg-red-400/20' 
                        : 'text-gray-400 hover:text-white hover:bg-[rgba(255,255,255,0.05)]'
                    }`}
                    title={speechSupported ? (isListening ? 'Stop recording' : 'Start voice input') : 'Speech recognition not supported'}
                    disabled={!speechSupported}
                  >
                    <Mic size={20} className={isListening ? 'animate-pulse' : ''} />
                  </button>


                  <button
                    onClick={handleSendMessage}
                    className="bg-white text-black p-2.5 rounded-xl hover:bg-gray-100 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    disabled={
                      (!message.trim() && attachedFiles.length === 0) ||
                      isLoading
                    }
                  >
                    <Send size={18} />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* My Agents Section - Show previous conversations under My Agents */}
        <div>
          {!isInChatState && (
            <div className="mt-10">
              <div className="flex flex-col items-center mb-8">
                <h3 className="text-gray-400 text-lg mb-2">My Agents</h3>
                {agentCount > 0 && (
                  <span className="px-2 py-1 text-xs bg-white/10 text-gray-300 rounded-full mb-4">
                    {agentCount}
                  </span>
                )}
              </div>
              
              <WorkersList 
                onWorkerSelect={(threadId) => {
                  navigate(`/threads/${threadId}`);
                }}
                onNewWorker={() => {
                  // Focus on the input to start a new conversation
                  setIsInChatState(false);
                  setTimeout(() => {
                    textareaRef.current?.focus();
                  }, 100);
                }}
                onCountChange={(count) => {
                  setAgentCount(count);
                }}
              />
            </div>
          )}
        </div>
      </div>

      {/* Right Panel - Always Absolute (slides in from right) */}
      <div
        className="absolute top-0 right-0 w-1/2 h-full bg-[#0a0a0a] border-l border-gray-900"
        style={{ transform: `translateX(${isInChatState ? '0' : '100%'})`, transition: 'transform 0.3s' }}
      >
        <div className="flex h-full">
          {/* Tab Icons - Left Side */}
          <div className="flex flex-col items-center justify-center gap-8 px-6 border-r border-gray-800">
            <button
              onClick={() => setActiveTab('plan')}
              className={`p-3 rounded-lg transition-all duration-200 ${
                activeTab === 'plan'
                  ? 'bg-white/10 text-white'
                  : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              <FileText size={20} />
            </button>

            <button
              onClick={() => setActiveTab('tools')}
              className={`p-3 rounded-lg transition-all duration-200 ${
                activeTab === 'tools'
                  ? 'bg-white/10 text-white'
                  : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              <Wrench size={20} />
            </button>

            <button
              onClick={() => setActiveTab('activity')}
              className={`p-3 rounded-lg transition-all duration-200 ${
                activeTab === 'activity'
                  ? 'bg-white/10 text-white'
                  : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              <ActivityIcon size={20} />
            </button>

            <button
              onClick={() => setActiveTab('health')}
              className={`p-3 rounded-lg transition-all duration-200 ${
                activeTab === 'health'
                  ? 'bg-white/10 text-white'
                  : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              <Heart size={20} />
            </button>

            <button
              onClick={() => setActiveTab('schedules')}
              className={`p-3 rounded-lg transition-all duration-200 ${
                activeTab === 'schedules'
                  ? 'bg-white/10 text-white'
                  : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              <Clock size={20} />
            </button>

            <button
              onClick={() => setActiveTab('files')}
              className={`p-3 rounded-lg transition-all duration-200 ${
                activeTab === 'files'
                  ? 'bg-white/10 text-white'
                  : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              <File size={20} />
            </button>

          </div>

          {/* Tab Content - Right Side */}
          <div className="flex-1 p-18 relative">
            <div className="h-full">
              {/* Plan Tab */}
              {activeTab === 'plan' && (
                <PlanTab
                  plan={currentPlanData.length > 0 ? {
                    tasks: currentPlanData.map(item => ({
                      id: item.id,
                      title: item.description || (item.toolCall ? `${item.toolCall.name} tool` : 'Task'),
                      type: item.type || item.subAgentType || 'task',
                      status: item.status,
                      timestamp: item.timestamp,
                      toolCall: item.toolCall // Pass through tool call data
                    })),
                    currentTask: currentPlanData.find(item => item.status === 'pending')?.id || null
                  } : null}
                  isProcessing={isLoading}
                />
              )}

              {/* Tools Tab */}
              {activeTab === 'tools' && (
                <ToolsTab
                  tools={threadSpecificToolsFromMessages}
                />
              )}

              {/* Activity Tab */}
              {activeTab === 'activity' && (
                <ActivityTab
                  activities={currentActivities}
                  onClearActivities={() => {
                    // Clear activities is not supported with derived data
                    // Activities are derived from messages, so they can't be cleared independently
                  }}
                  threadId={threadId || undefined}
                  isLoading={isLoading}
                />
              )}

              {/* Health Tab */}
              {activeTab === 'health' && (
                <HealthTab 
                  assistantId={getDeployment()?.agentId || 'bd9d7831-8cd0-52cf-b4ff-e0a75afee4f5'} 
                  threadId={threadId || undefined} 
                />
              )}

              {/* Schedules Tab */}
              {activeTab === 'schedules' && (
                <SchedulesTab 
                  threadId={threadId || undefined}
                  assistantId={getDeployment()?.agentId || 'bd9d7831-8cd0-52cf-b4ff-e0a75afee4f5'}
                  activities={currentActivities}
                />
              )}

              {/* Files Tab */}
              {activeTab === 'files' && (
                <FilesTab 
                  files={files}
                  isLoading={isLoadingThreadState}
                />
              )}

            </div>
          </div>
        </div>
      </div>

    </div>
  );
};

export default LandingPage2;
