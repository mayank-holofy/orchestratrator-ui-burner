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
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import logo from '../assets/logo.svg';
import EmployeeCard from './EmployeeCard';
import PlanTab from './tabs/PlanTab';
import ToolsTab from './tabs/ToolsTab';
import ActivityTab from './tabs/ActivityTab';
import HealthTab from './tabs/HealthTab';
import SchedulesTab from './tabs/SchedulesTab';
import FilesTab from './tabs/FilesTab';
import { useOrchestratorChat } from '../hooks/useOrchestratorChat.js';
import { createClient } from '../lib/client.js';
import { getDeployment } from '../lib/environment/deployments';
import { useSearchParams, useParams } from 'react-router-dom';
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

const LandingPage2 = () => {
  const [message, setMessage] = useState('');
  const [attachedFiles, setAttachedFiles] = useState<AttachedFile[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);
  const [showCard, setShowCard] = useState(true);
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
          console.log('Assistant info:', assistant);
          
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
  const [activities, setActivities] = useState([]);
  const [planData, setPlanData] = useState([]);
  const [availableTools, setAvailableTools] = useState([]);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isLoadingThreadState, setIsLoadingThreadState] = useState(false);
  const [startNewThread, setStartNewThread] = useState(false);

  const [activeTab, setActiveTab] = useState<
    'plan' | 'tools' | 'activity' | 'health' | 'schedules' | 'files'
  >('health');
  const [activeRuns, setActiveRuns] = useState<any[]>([]);
  const [threadStatus, setThreadStatus] = useState<string>('idle');
  const [statusMessage, setStatusMessage] = useState<{type: 'error' | 'info' | 'success', message: string} | null>(null);
  const [currentToolCall, setCurrentToolCall] = useState<{name: string, description?: string} | null>(null);
  const [currentReasoning, setCurrentReasoning] = useState<string | null>(null);
  const [loadingPhrase, setLoadingPhrase] = useState<string>('');

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
    // Show side panel and enter chat state when focusing on input
    if (!isInChatState) {
      setShowCard(false);
      setIsInChatState(true);
    }
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
          toolsInThread.add(name);
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
      }
    }
  }, [messages, isLoading]);

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      {/* Background Video */}
      <motion.div
        className="absolute inset-0 w-full h-full"
        animate={{ opacity: isInChatState ? 0.3 : 1 }}
        transition={{ duration: 0.6 }}
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
      </motion.div>

      {/* Logo/Brand */}
      <motion.div
        className="absolute top-8 left-8 z-20"
        animate={{ opacity: isInChatState ? 0.5 : 1 }}
        transition={{ duration: 0.4 }}
      >
        <img
          src={logo}
          alt="Some100 Logo"
          className="h-12 w-auto"
          style={{ filter: 'brightness(0) invert(1)' }}
        />
      </motion.div>

      {/* Thread Status Indicator */}
      {threadId && (
        <motion.div
          className="absolute top-8 right-8 z-20 flex items-center gap-2"
          animate={{ 
            opacity: isInChatState ? 0.8 : 0.6,
            right: (isLoading || activeRuns.length > 0) && isInChatState ? '200px' : '32px'
          }}
          transition={{ duration: 0.4 }}
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
        </motion.div>
      )}

      {/* Global Stop All Button */}
      {(isLoading || activeRuns.length > 0) && isInChatState && (
        <motion.div
          className="absolute top-8 right-8 z-20"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          transition={{ duration: 0.3 }}
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
        </motion.div>
      )}

      {/* Main Content */}
      <motion.div
        className="h-screen flex flex-col justify-center items-center px-6 relative z-10"
        initial={{ opacity: 0 }}
        animate={{
          opacity: 1,
          width: isInChatState ? '50%' : '100%',
          justifyContent: isInChatState ? 'flex-start' : 'center',
          paddingTop: isInChatState ? '80px' : '0px',
        }}
        transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
      >
        {/* Employee Card and Title - Fade Out in Chat State */}
        <AnimatePresence>
          {!isInChatState && (
            <motion.div
              className="w-full"
              style={{ maxWidth: '768px' }}
              exit={{ opacity: 0, scale: 0.95, y: -50 }}
              transition={{ duration: 0.5 }}
            >
              <EmployeeCard visible={showCard} />

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
            </motion.div>
          )}
        </AnimatePresence>

        {/* Chat Messages - Appear in Chat State */}
        {isInChatState && (
          <motion.div
            className="absolute top-8 left-0 right-0 overflow-y-auto px-6 chat-scrollbar"
            style={{ 
              maxWidth: '768px', 
              margin: '0 auto',
              bottom: '140px' // Reserve space for input box
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.4 }}
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
              
              
              {isLoading && processedMessages.length > 0 && processedMessages[processedMessages.length - 1].message.type === 'human' && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex justify-start mb-6"
                >
                  <div className="bg-[#1a1a1a] border border-gray-800 px-4 py-3 rounded-2xl">
                    <div className="flex gap-1">
                      <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                      <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                      <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                    </div>
                  </div>
                </motion.div>
              )}
              
              <div ref={messagesEndRef} className="h-32" />
            </div>
          </motion.div>
        )}
        {/* Current Tool Call & Reasoning Display */}
        {(currentToolCall || currentReasoning) && isLoading && (
          <motion.div
            className="w-full"
            style={{ maxWidth: '768px' }}
            initial={{ opacity: 0, y: 10 }}
            animate={{
              opacity: 1,
              y: 0,
              position: isInChatState ? 'fixed' : 'relative',
              bottom: isInChatState ? (statusMessage ? '180px' : '140px') : 'auto',
              left: isInChatState ? '25%' : 'auto',
              transform: isInChatState ? 'translateX(-50%)' : 'none',
              paddingLeft: isInChatState ? '24px' : '0px',
              paddingRight: isInChatState ? '24px' : '0px',
              zIndex: isInChatState ? 25 : 1,
              marginBottom: isInChatState ? '0px' : '12px',
            }}
            transition={{ duration: 0.3 }}
          >
            <div className="px-4 py-3 rounded-lg border bg-blue-950/30 border-blue-500/20 text-blue-200">
              {currentToolCall && (
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
                  <span className="text-sm font-medium">
                    Executing: {currentToolCall.name}
                  </span>
                </div>
              )}
              {currentReasoning && (
                <div className="text-sm text-blue-100/80 italic mb-2">
                  {currentReasoning.length > 150 
                    ? `${currentReasoning.substring(0, 150)}...` 
                    : currentReasoning
                  }
                </div>
              )}
              {loadingPhrase && (
                <div className="flex items-center gap-3">
                  <div className="flex gap-1">
                    <div className="w-1 h-1 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-1 h-1 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-1 h-1 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                  <span className="text-sm text-blue-100/80">
                    {loadingPhrase}
                  </span>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* Status Message */}
        {statusMessage && (
          <motion.div
            className="w-full"
            style={{ maxWidth: '768px' }}
            initial={{ opacity: 0, y: 10 }}
            animate={{
              opacity: 1,
              y: 0,
              position: isInChatState ? 'fixed' : 'relative',
              bottom: isInChatState ? '140px' : 'auto',
              left: isInChatState ? '25%' : 'auto',
              transform: isInChatState ? 'translateX(-50%)' : 'none',
              paddingLeft: isInChatState ? '24px' : '0px',
              paddingRight: isInChatState ? '24px' : '0px',
              zIndex: isInChatState ? 25 : 1,
              marginBottom: isInChatState ? '0px' : '12px',
            }}
            transition={{ duration: 0.3 }}
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
          </motion.div>
        )}

        {/* THE SAME INPUT BOX - Animates from middle to bottom */}
        <motion.div
          className="w-full"
          style={{ maxWidth: '768px' }}
          initial={{ opacity: 0 }}
          animate={{
            opacity: 1,
            position: isInChatState ? 'fixed' : 'relative',
            bottom: isInChatState ? '24px' : 'auto',
            left: isInChatState ? '25%' : 'auto',
            transform: isInChatState ? 'translateX(-50%)' : 'none',
            paddingLeft: isInChatState ? '24px' : '0px',
            paddingRight: isInChatState ? '24px' : '0px',
            zIndex: isInChatState ? 25 : 1,
          }}
          transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
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

            <motion.div
              className="relative"
              animate={{
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
                y: isFocused && !isInChatState ? -2 : 0,
              }}
              transition={{ duration: 0.6 }}
              style={{ borderStyle: 'solid' }}
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

              {/* Original textarea first in landing state */}
              {!isInChatState && (
                <textarea
                  ref={textareaRef}
                  value={message}
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

                    <button className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors bg-[rgba(255,255,255,0.08)] hover:bg-[rgba(255,255,255,0.12)] px-4 py-2 rounded-lg">
                      <span style={{ fontSize: '15px' }}>Public</span>
                      <ChevronDown size={18} />
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    <button className="text-gray-400 hover:text-white transition-colors p-2.5 hover:bg-[rgba(255,255,255,0.05)] rounded-lg">
                      <Mic size={22} />
                    </button>

                    {isLoading && (
                      <button
                        onClick={() => stopStream()}
                        className="bg-red-500 text-white p-2.5 rounded-xl hover:bg-red-600 transition-colors"
                        title="Stop execution"
                      >
                        <StopCircle size={20} />
                      </button>
                    )}

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
                    value={message}
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

                  <button className="text-gray-400 hover:text-white transition-colors p-2.5 hover:bg-[rgba(255,255,255,0.05)] rounded-lg">
                    <Mic size={20} />
                  </button>

                  {isLoading && (
                    <button
                      onClick={() => stopStream()}
                      className="bg-red-500 text-white p-2.5 rounded-xl hover:bg-red-600 transition-colors"
                      title="Stop execution"
                    >
                      <StopCircle size={18} />
                    </button>
                  )}

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
            </motion.div>
          </div>
        </motion.div>

        {/* Bottom Links - Fade out in chat state */}
        <AnimatePresence>
          {!isInChatState && (
            <motion.div
              className="flex justify-center gap-10 mt-10"
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <button
                className="text-gray-400 hover:text-white transition-colors"
                style={{ fontSize: '15px' }}
              >
                My Agents
              </button>
              <button
                className="text-gray-400 hover:text-white transition-colors"
                style={{ fontSize: '15px' }}
              >
                Templates
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Right Panel - Always Absolute (slides in from right) */}
      <motion.div
        className="absolute top-0 right-0 w-1/2 h-full bg-[#0a0a0a] border-l border-gray-900"
        initial={{ x: '100%' }}
        animate={{ x: isInChatState ? 0 : '100%' }}
        transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
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
          <div className="flex-1 p-18 overflow-hidden relative">
            <AnimatePresence mode="wait">
              {/* Plan Tab */}
              {activeTab === 'plan' && (
                <PlanTab
                  plan={planData.length > 0 ? {
                    tasks: planData.map(item => ({
                      id: item.id,
                      title: item.description || (item.toolCall ? `${item.toolCall.name} tool` : 'Task'),
                      type: item.type || item.subAgentType || 'task',
                      status: item.status,
                      timestamp: item.timestamp,
                      toolCall: item.toolCall // Pass through tool call data
                    })),
                    currentTask: planData.find(item => item.status === 'pending')?.id || null
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
                  activities={activities}
                  onClearActivities={() => setActivities([])}
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
                />
              )}

              {/* Files Tab */}
              {activeTab === 'files' && (
                <FilesTab 
                  files={files}
                  isLoading={isLoadingThreadState}
                />
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>

      {/* Footer - Only in landing */}
      <motion.div
        className="absolute bottom-8 left-1/2 transform -translate-x-1/2 text-gray-500 z-10"
        style={{ fontSize: '13px', letterSpacing: '0.5px' }}
        animate={{ opacity: isInChatState ? 0 : 1 }}
        transition={{ duration: 0.3 }}
      >
        YOU HAVE NO AGENTS
      </motion.div>
    </div>
  );
};

export default LandingPage2;
