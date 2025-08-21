import { useState, useRef, useEffect } from 'react';
import { Plus, Mic, Send, ChevronDown, X, RotateCcw, MoreVertical, Expand, Minimize2, User, Monitor, FileText } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import logo from '../assets/logo.svg';
import EmployeeCard from './EmployeeCard';

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

const LandingPage = () => {
  const [message, setMessage] = useState('');
  const [attachedFiles, setAttachedFiles] = useState<AttachedFile[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);
  const [showCard, setShowCard] = useState(true);
  const [isFocused, setIsFocused] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isInChatState, setIsInChatState] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [isVideoFullscreen, setIsVideoFullscreen] = useState(false);
  const [activeBriefTab, setActiveBriefTab] = useState<'identity' | 'computer' | 'brief'>('identity');
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

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
  }, [messages, isInChatState]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const newFiles = files.map(file => ({
      id: Math.random().toString(36).substr(2, 9),
      name: file.name,
      type: file.type
    }));
    setAttachedFiles([...attachedFiles, ...newFiles]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeFile = (id: string) => {
    setAttachedFiles(attachedFiles.filter(f => f.id !== id));
  };

  const handleSendMessage = () => {
    if (message.trim() || attachedFiles.length > 0) {
      const newMessage: Message = {
        id: Date.now().toString(),
        role: 'user',
        content: message,
        timestamp: new Date(),
      };
      
      setMessages(prev => [...prev, newMessage]);
      
      // Enter chat state and hide card when first message is sent
      if (messages.length === 0) {
        setShowCard(false);
        setIsInChatState(true);
      }
      
      // Clear input
      setMessage('');
      setAttachedFiles([]);
      
      // Reset textarea height
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
      
      // Simulate bot response
      setIsTyping(true);
      setTimeout(() => {
        const botMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: "I'll help you analyze the call transcripts and extract the important information. Let me process this request for you.",
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, botMessage]);
        setIsTyping(false);
      }, 1500);
    }
  };

  const resetToLanding = () => {
    setIsInChatState(false);
    setShowCard(true);
    setMessages([]);
    setMessage('');
    setAttachedFiles([]);
    setIsTyping(false);
  };

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
                  <h1 className="text-white font-light" style={{ fontSize: '48px', lineHeight: '1.2' }}>
                    Create AI Employees
                  </h1>
                  <h2 className="text-white font-light mt-2" style={{ fontSize: '48px', lineHeight: '1.2' }}>
                    in seconds<span 
                      className="inline-block ml-2" 
                      style={{
                        width: '20px',
                        height: '48px',
                        backgroundColor: 'white',
                        animation: 'blink 1s infinite'
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
              className="absolute top-20 bottom-32 left-0 right-0 overflow-y-auto flex flex-col justify-end"
              style={{ maxWidth: '768px', margin: '0 auto' }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6, duration: 0.4 }}
            >
              {messages.map((msg, index) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`mb-6 flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className="max-w-[70%]">
                    <div
                      className={`px-4 py-3 rounded-2xl ${
                        msg.role === 'user'
                          ? 'bg-white text-black'
                          : 'bg-[#1a1a1a] text-white border border-gray-800'
                      }`}
                    >
                      <p className="text-[15px]">{msg.content}</p>
                    </div>
                    <div className={`mt-1 text-[11px] text-gray-500 ${
                      msg.role === 'user' ? 'text-right' : 'text-left'
                    }`}>
                      {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </motion.div>
              ))}
              
              {isTyping && (
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
            </motion.div>
          )}

          {/* THE SAME INPUT BOX - Animates from middle to bottom */}
          <motion.div 
            className="w-full"
            style={{ maxWidth: '768px' }}
            initial={{ opacity: 0 }}
            animate={{
              opacity: 1,
              position: isInChatState ? 'absolute' : 'relative',
              bottom: isInChatState ? '24px' : 'auto',
              left: isInChatState ? '0' : 'auto',
              right: isInChatState ? '0' : 'auto',
              marginLeft: isInChatState ? 'auto' : '0',
              marginRight: isInChatState ? 'auto' : '0',
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
                    background: 'radial-gradient(circle at center, rgba(255, 255, 255, 0.1), transparent 70%)',
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
                  borderColor: isFocused && !isInChatState
                    ? 'rgba(255, 255, 255, 0.4)' 
                    : isExpanded && !isInChatState
                      ? 'rgba(129, 129, 129, 0.6)' 
                      : 'rgba(129, 129, 129, 0.3)',
                  boxShadow: isFocused && !isInChatState
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
                      {attachedFiles.map(file => (
                        <div key={file.id} className="flex items-center gap-2 bg-[rgba(30,30,30,1)] text-white px-3 py-1.5 rounded-md text-sm border border-[rgba(129,129,129,0.3)]">
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
                    onFocus={() => setIsFocused(true)}
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
                      color: isFocused ? 'rgba(255, 255, 255, 1)' : 'rgba(255, 255, 255, 0.9)',
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

                      <button 
                        onClick={handleSendMessage}
                        className="bg-white text-black p-2.5 rounded-xl hover:bg-gray-100 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                        disabled={!message.trim() && attachedFiles.length === 0}
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
                        color: isFocused ? 'rgba(255, 255, 255, 1)' : 'rgba(255, 255, 255, 0.9)',
                      }}
                    />

                    <button className="text-gray-400 hover:text-white transition-colors p-2.5 hover:bg-[rgba(255,255,255,0.05)] rounded-lg">
                      <Mic size={20} />
                    </button>

                    <button 
                      onClick={handleSendMessage}
                      className="bg-white text-black p-2.5 rounded-xl hover:bg-gray-100 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                      disabled={!message.trim() && attachedFiles.length === 0}
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
                <button className="text-gray-400 hover:text-white transition-colors" style={{ fontSize: '15px' }}>
                  My Agents
                </button>
                <button className="text-gray-400 hover:text-white transition-colors" style={{ fontSize: '15px' }}>
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
              onClick={() => setActiveBriefTab('identity')}
              className={`p-3 rounded-lg transition-all duration-200 ${
                activeBriefTab === 'identity' 
                  ? 'bg-white/10 text-white' 
                  : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              <User size={20} />
            </button>
            
            <button
              onClick={() => setActiveBriefTab('brief')}
              className={`p-3 rounded-lg transition-all duration-200 ${
                activeBriefTab === 'brief' 
                  ? 'bg-white/10 text-white' 
                  : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              <FileText size={20} />
            </button>
            
            <button
              onClick={() => setActiveBriefTab('computer')}
              className={`p-3 rounded-lg transition-all duration-200 ${
                activeBriefTab === 'computer' 
                  ? 'bg-white/10 text-white' 
                  : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              <Monitor size={20} />
            </button>
          </div>

          {/* Tab Content - Right Side */}
          <div className="flex-1 p-24 overflow-hidden relative">
            <AnimatePresence mode="wait">
              {/* Identity Tab */}
              {activeBriefTab === 'identity' && (
                <motion.div
                  key="identity"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                  className="h-full overflow-y-auto"
                >
                  <div className="mb-8">
                    <h2 className="text-white text-2xl font-light">WORKER IDENTITY</h2>
                  </div>

                  {/* Employee Card with Metadata */}
                  <div className="flex gap-8 mb-8 items-start">
              <div className="flex-shrink-0">
                <EmployeeCard visible={true} />
              </div>
              
              {/* Worker Metadata */}
              <div className="flex-1">
                {/* Name */}
                <div className="mb-6">
                  <p className="text-gray-500 text-xs mb-2">NAME</p>
                  <p className="text-gray-300 text-lg">Mr Cabbage Flower</p>
                </div>
                
                {/* Email */}
                <div className="mb-6">
                  <p className="text-gray-500 text-xs mb-2">EMAIL</p>
                  <p className="text-gray-300">cabbageflower@agmail.com</p>
                </div>
                
                {/* Phone */}
                <div className="mb-6">
                  <p className="text-gray-500 text-xs mb-2">PHONE NO</p>
                  <p className="text-gray-300">+44 776 183 3949</p>
                </div>
                
                {/* Capabilities */}
                <div>
                  <p className="text-gray-500 text-xs mb-3">CAPABILITIES</p>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-green-500">✓</span>
                      <span className="text-gray-300 text-sm">Code Interpreter & Data Analysis</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-green-500">✓</span>
                      <span className="text-gray-300 text-sm">Phone calls</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-green-500">✓</span>
                      <span className="text-gray-300 text-sm">Web search</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-green-500">✓</span>
                      <span className="text-gray-300 text-sm">Gmail</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
                </motion.div>
              )}

              {/* Computer Tab */}
              {activeBriefTab === 'computer' && (
                <motion.div
                  key="computer"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                  className="h-full overflow-y-auto"
                >
                  <div className="mb-8">
                    <h2 className="text-white text-2xl font-light">WORKER COMPUTER</h2>
                  </div>

                  {/* Desktop Computer Simulation */}
                  <div className="mb-12">
              <h3 className="text-gray-500 text-xs mb-3">ACTIVE INSTANCE</h3>
              <div 
                className="bg-black border border-gray-800 rounded-lg overflow-hidden w-full relative group"
                style={{ aspectRatio: '16/10' }}
              >
                <video
                  autoPlay
                  loop
                  muted
                  playsInline
                  className="absolute inset-0 w-full h-full object-cover rounded-lg"
                >
                  <source src="/Computeruse.mp4" type="video/mp4" />
                </video>
                
                {/* Expand Button */}
                <button
                  onClick={() => setIsVideoFullscreen(true)}
                  className="absolute top-4 right-4 p-3 bg-black/50 hover:bg-black/70 rounded-lg transition-all duration-200 group-hover:opacity-100 opacity-60"
                >
                  <Expand size={20} className="text-white" />
                </button>
                
                {/* Activity Indicator Overlay */}
                <div className="absolute bottom-4 left-4 flex items-center gap-2 bg-black/50 px-3 py-1 rounded-full">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <div className="text-xs text-gray-300">Active Instance</div>
                </div>
              </div>
            </div>
                </motion.div>
              )}

              {/* Brief Tab */}
              {activeBriefTab === 'brief' && (
                <motion.div
                  key="brief"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                  className="h-full overflow-y-auto"
                >
                  <div className="mb-8">
                    <h2 className="text-white text-2xl font-light">CUSTOMER SUPPORT AI WORKER</h2>
                  </div>

                  <div className="space-y-8">
                    <div>
                      <h3 className="text-gray-500 text-xs mb-3">CONTEXTUAL UNDERSTANDING</h3>
                      <ul className="text-gray-300 space-y-2">
                        <li className="flex items-start gap-2">
                          <span className="text-gray-500 mt-1">•</span>
                          <span>Understand that callers may be reporting bugs or technical issues</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-gray-500 mt-1">•</span>
                          <span>Recognize the importance of accurate customer verification when required</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-gray-500 mt-1">•</span>
                          <span>Be aware that callers may be frustrated or concerned—demonstrate patience and understanding</span>
                        </li>
                      </ul>
                    </div>

                    <div>
                      <h3 className="text-gray-500 text-xs mb-3">CONVERSATION OBJECTIVES</h3>
                      <ul className="text-gray-300 space-y-2">
                        <li className="flex items-start gap-2">
                          <span className="text-gray-500 mt-1">•</span>
                          <span>Ensure a friendly and helpful customer experience from greeting to resolution</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-gray-500 mt-1">•</span>
                          <span>Accurately verify customer identity (when necessary)</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-gray-500 mt-1">•</span>
                          <span>Thoroughly understand and document the customer's bug or issue</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-gray-500 mt-1">•</span>
                          <span>Guide customers through appropriate troubleshooting steps</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-gray-500 mt-1">•</span>
                          <span>Escalate complex or critical issues to the relevant technical team</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-gray-500 mt-1">•</span>
                          <span>Clearly communicate next steps and set expectations for follow-up</span>
                        </li>
                      </ul>
                    </div>

                    <div>
                      <h3 className="text-gray-500 text-xs mb-3">CONVERSATION FRAMEWORK</h3>
                      <div className="space-y-3">
                        <div>
                          <p className="text-gray-400 font-medium mb-1">Friendly Introduction</p>
                          <p className="text-gray-300">Greet warmly, introduce yourself by name, state your role in customer support</p>
                        </div>
                        <div>
                          <p className="text-gray-400 font-medium mb-1">Customer Verification</p>
                          <p className="text-gray-300">Politely request essential details to verify identity when required</p>
                        </div>
                        <div>
                          <p className="text-gray-400 font-medium mb-1">Understanding the Issue</p>
                          <p className="text-gray-300">Listen attentively, express empathy, ask clarifying questions for relevant details</p>
                        </div>
                        <div>
                          <p className="text-gray-400 font-medium mb-1">Troubleshooting & Documentation</p>
                          <p className="text-gray-300">Guide through basic steps, record all important bug information and error codes</p>
                        </div>
                        <div>
                          <p className="text-gray-400 font-medium mb-1">Escalation</p>
                          <p className="text-gray-300">Escalate complex issues to specialists, inform about process and set expectations</p>
                        </div>
                        <div>
                          <p className="text-gray-400 font-medium mb-1">Wrapping Up</p>
                          <p className="text-gray-300">Summarize actions taken, provide ticket number, explain update process</p>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-gray-500 text-xs mb-3">RESPONSE GUIDELINES</h3>
                      <ul className="text-gray-300 space-y-2">
                        <li className="flex items-start gap-2">
                          <span className="text-gray-500 mt-1">•</span>
                          <span>Stay professional, courteous, and solution-focused throughout</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-gray-500 mt-1">•</span>
                          <span>Use clear and concise language; avoid technical jargon unless appropriate</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-gray-500 mt-1">•</span>
                          <span>Maintain confidentiality of personal and account information</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-gray-500 mt-1">•</span>
                          <span>Always aim to reduce customer effort and maximize satisfaction</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </motion.div>
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

      {/* Fullscreen Video Modal */}
      <AnimatePresence>
        {isVideoFullscreen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black flex items-center justify-center p-8"
          >
            <div className="relative w-full h-full max-w-[90vw] max-h-[90vh] border-2 border-gray-800 rounded-lg overflow-hidden">
              <video
                autoPlay
                loop
                muted
                playsInline
                className="w-full h-full object-contain"
              >
                <source src="/Computeruse.mp4" type="video/mp4" />
              </video>
              
              {/* Close Button */}
              <button
                onClick={() => setIsVideoFullscreen(false)}
                className="absolute top-4 right-4 p-3 bg-black/70 hover:bg-black/90 rounded-lg transition-all duration-200"
              >
                <X size={24} className="text-white" />
              </button>
              
              {/* Activity Indicator */}
              <div className="absolute bottom-6 left-6 flex items-center gap-2 bg-black/70 px-4 py-2 rounded-full">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <div className="text-sm text-gray-300">Active Instance - Fullscreen Mode</div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default LandingPage;