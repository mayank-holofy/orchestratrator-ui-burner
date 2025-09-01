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
  StopCircle,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import logo from '../assets/logo.svg';
import EmployeeCard from './EmployeeCard';
import PlanTab from './tabs/PlanTab';
import ToolsTab from './tabs/ToolsTab';
import ActivityTab from './tabs/ActivityTab';
import HealthTab from './tabs/HealthTab';
import { useOrchestratorChat } from '../hooks/useOrchestratorChat.js';
import { createClient } from '../lib/client.js';
import { getDeployment } from '../lib/environment/deployments';
import { useSearchParams } from 'react-router-dom';
import { useAuthContext } from '../providers/Auth.js';
import { extractStringFromMessageContent } from '../utils/orchestratoreChat.js';
import Message from './Message.jsx';
import ReasoningBubble from './ReasoningBubble.tsx';
import './ChatScrollbar.css';

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
  const threadId = params.get('threadId');
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
  const [reasoningSteps, setReasoningSteps] = useState([]);
  const [availableTools, setAvailableTools] = useState([]);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isLoadingThreadState, setIsLoadingThreadState] = useState(false);
  const [startNewThread, setStartNewThread] = useState(false);

  const [activeTab, setActiveTab] = useState<
    'plan' | 'tools' | 'activity' | 'health'
  >('health');

  useEffect(() => {
    const fetchThreadState = async () => {
      if (!threadId || !session?.accessToken) {
        setTodos([]);
        setFiles({});
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
      } catch (error) {
        console.error('Failed to fetch thread state:', error);
        setTodos([]);
        setFiles({});
      } finally {
        setIsLoadingThreadState(false);
      }
    };
    fetchThreadState();
  }, [threadId, session?.accessToken]);

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
      // Clear input
      const userRequest = message?.trim();
      setMessage('');
      setAttachedFiles([]);
      sendMessage(userRequest);

      // Switch to activity tab to see what's happening
      setActiveTab('activity');
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

  const processedMessages = useMemo(() => {
    /* 
  1. Loop through all messages
  2. For each AI message, add the AI message, and any tool calls to the messageMap
  3. For each tool message, find the corresponding tool call in the messageMap and update the status and output
  4. Extract tool calls to activities instead of showing in chat
  */
    const messageMap = new Map();
    const newActivities = [];
    
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
          
          // Route different tool types to appropriate tabs
          if (name === 'task' && args.subagent_type) {
            // Task delegation goes to Plan tab
            const planItem = {
              id: toolCall.id || `plan-${Date.now()}-${Math.random()}`,
              timestamp: new Date().toISOString(),
              type: 'task_delegation',
              subAgentType: args.subagent_type,
              description: args.description || args.prompt || 'Task delegated',
              status: 'pending'
            };
            setPlanData(prev => [planItem, ...prev].slice(0, 100));
          } else if (name === 'list_tasks') {
            // Only list_tasks goes to Plan tab as ToolCallBox
            console.log(`Routing tool "${name}" to Plan tab`);
            const planItem = {
              id: toolCall.id || `plan-${Date.now()}-${Math.random()}`,
              timestamp: new Date().toISOString(),
              type: 'task_management',
              description: `${name} tool execution`,
              toolCall: {
                id: toolCall.id || `tool-${Math.random()}`,
                name,
                args,
                status: 'pending',
                result: null
              }
            };
            console.log('Created plan item:', planItem);
            setPlanData(prev => [planItem, ...prev].slice(0, 100));
          } else if (name.includes('think') || name.includes('reason') || name.includes('analyze')) {
            // Reasoning goes to chat (will implement next)
            const reasoningStep = {
              id: toolCall.id || `reasoning-${Date.now()}-${Math.random()}`,
              timestamp: new Date().toISOString(),
              type: 'reasoning',
              content: args.prompt || args.description || `${name} in progress...`,
              status: 'pending'
            };
            setReasoningSteps(prev => [reasoningStep, ...prev].slice(0, 50));
          } else {
            // Regular tools go to Activity log
            console.log(`Routing tool "${name}" to Activity log`);
            const activity = {
              id: toolCall.id || `tool-${Date.now()}-${Math.random()}`,
              timestamp: new Date().toISOString(),
              type: 'tool_call',
              level: 'info',
              data: {
                toolCall: {
                  id: toolCall.id || `tool-${Math.random()}`,
                  name,
                  args,
                  status: 'pending',
                  result: null
                }
              }
            };
            newActivities.push(activity);
          }
          
          return {
            id: toolCall.id || `tool-${Math.random()}`,
            name,
            args,
            status: 'pending',
          };
        });
        
        // Only show messages with text content in chat, not pure tool call messages
        const hasTextContent = extractStringFromMessageContent(message).trim().length > 0;
        if (hasTextContent) {
          messageMap.set(message.id, {
            message,
            toolCalls: [], // Remove tool calls from chat display
          });
        }
      } else if (message.type === 'tool') {
        const toolCallId = message.tool_call_id;
        if (!toolCallId) {
          return;
        }
        
        // Update existing tool call in activities with result
        const toolResult = extractStringFromMessageContent(message);
        
        // Find existing tool call activity and update it
        const existingActivityIndex = newActivities.findIndex(
          activity => activity.data?.toolCall?.id === toolCallId
        );
        
        if (existingActivityIndex !== -1) {
          newActivities[existingActivityIndex].data.toolCall.result = toolResult;
          newActivities[existingActivityIndex].data.toolCall.status = 'completed';
          newActivities[existingActivityIndex].level = 'success';
        } else {
          // If not found in current batch, we'll update through a separate effect
          setActivities(prev => prev.map(activity => {
            if (activity.data?.toolCall?.id === toolCallId) {
              return {
                ...activity,
                data: {
                  ...activity.data,
                  toolCall: {
                    ...activity.data.toolCall,
                    result: toolResult,
                    status: 'completed'
                  }
                },
                level: 'success'
              };
            }
            return activity;
          }));
          
          // Also update reasoning steps
          setReasoningSteps(prev => prev.map(step => {
            if (step.id === toolCallId) {
              return {
                ...step,
                status: 'completed',
                content: step.content + ` → ${toolResult.substring(0, 100)}${toolResult.length > 100 ? '...' : ''}`
              };
            }
            return step;
          }));
          
          // Also update plan items (both delegations and tool calls)
          setPlanData(prev => prev.map(item => {
            if (item.id === toolCallId) {
              return {
                ...item,
                status: 'completed',
                ...(item.toolCall && {
                  toolCall: {
                    ...item.toolCall,
                    result: toolResult,
                    status: 'completed'
                  }
                })
              };
            }
            return item;
          }));
        }
        
        // Don't add tool results to chat - they go to activities only
        for (const [, data] of messageMap.entries()) {
          const toolCallIndex = data.toolCalls.findIndex(
            (tc) => tc.id === toolCallId
          );
          if (toolCallIndex !== -1) {
            data.toolCalls[toolCallIndex] = {
              ...data.toolCalls[toolCallIndex],
              status: 'completed',
              result: toolResult,
            };
            break;
          }
        }
      } else if (message.type === 'human') {
        messageMap.set(message.id, {
          message,
          toolCalls: [],
        });
      }
    });
    
    // Update activities state with new tool calls and responses (only for non-routed items)
    if (newActivities.length > 0) {
      setActivities(prev => [...newActivities, ...prev].slice(0, 500)); // Keep last 500 activities
    }
    
    const processedArray = Array.from(messageMap.values());
    return processedArray.map((data, index) => {
      const prevMessage = index > 0 ? processedArray[index - 1].message : null;
      return {
        ...data,
        showAvatar: data.message.type !== prevMessage?.type,
      };
    });
  }, [messages]);

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
            className="absolute top-8 bottom-8 left-0 right-0 overflow-y-auto px-6 chat-scrollbar"
            style={{ 
              maxWidth: '768px', 
              margin: '0 auto'
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.4 }}
          >
            <div className="flex flex-col min-h-full justify-end">
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
              
              {/* Reasoning Steps Experiment */}
              {reasoningSteps.map((step, index) => (
                <ReasoningBubble
                  key={step.id}
                  step={step}
                  isLatest={index === 0 && step.status === 'pending'}
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
              
              <div ref={messagesEndRef} />
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
                  tools={availableTools}
                />
              )}

              {/* Activity Tab */}
              {activeTab === 'activity' && (
                <ActivityTab
                  activities={activities}
                  onClearActivities={() => setActivities([])}
                />
              )}

              {/* Health Tab */}
              {activeTab === 'health' && (
                <HealthTab 
                  assistantId={getDeployment()?.agentId || 'deepagent'} 
                  threadId={threadId || undefined} 
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
