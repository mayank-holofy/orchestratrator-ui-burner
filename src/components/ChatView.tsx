import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Mic, Send, ChevronDown, X, MoreVertical } from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface ChatViewProps {
  initialMessage?: string;
  onBack?: () => void;
}

const ChatView: React.FC<ChatViewProps> = ({ initialMessage, onBack }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    // Add initial message when component mounts
    if (initialMessage) {
      const userMessage: Message = {
        id: Date.now().toString(),
        role: 'user',
        content: initialMessage,
        timestamp: new Date(),
      };
      setMessages([userMessage]);
      
      // Simulate bot response
      setIsTyping(true);
      setTimeout(() => {
        const botMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: "I understand you want to analyze call transcripts and extract important information. I'll help you create a comprehensive solution for this task.",
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, botMessage]);
        setIsTyping(false);
      }, 1500);
    }
  }, [initialMessage]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSend = () => {
    if (inputMessage.trim()) {
      const newMessage: Message = {
        id: Date.now().toString(),
        role: 'user',
        content: inputMessage,
        timestamp: new Date(),
      };
      setMessages([...messages, newMessage]);
      setInputMessage('');
      
      // Simulate bot response
      setIsTyping(true);
      setTimeout(() => {
        const botMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: "I'm processing your request and will provide a detailed response shortly.",
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, botMessage]);
        setIsTyping(false);
      }, 1500);
    }
  };

  return (
    <div className="flex h-screen bg-black">
      {/* Left Chat Panel */}
      <motion.div 
        className="flex-1 flex flex-col"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto px-6 py-8">
          <AnimatePresence>
            {messages.map((message, index) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ 
                  duration: 0.4,
                  delay: index * 0.1,
                  ease: [0.4, 0, 0.2, 1]
                }}
                className={`mb-6 flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-[70%] ${message.role === 'user' ? 'order-2' : ''}`}>
                  <div
                    className={`px-4 py-3 rounded-2xl ${
                      message.role === 'user'
                        ? 'bg-white text-black'
                        : 'bg-[#1a1a1a] text-white border border-gray-800'
                    }`}
                  >
                    <p className="text-[15px] leading-relaxed">{message.content}</p>
                  </div>
                  <div className={`mt-1 text-[11px] text-gray-500 ${
                    message.role === 'user' ? 'text-right' : 'text-left'
                  }`}>
                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          
          {/* Typing Indicator */}
          <AnimatePresence>
            {isTyping && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
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
          </AnimatePresence>
          
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <motion.div 
          className="border-t border-gray-900 p-4"
          initial={{ y: 100 }}
          animate={{ y: 0 }}
          transition={{ 
            duration: 0.6,
            ease: [0.4, 0, 0.2, 1]
          }}
        >
          <div className="flex items-end gap-3 max-w-4xl mx-auto">
            <button className="p-2 text-gray-400 hover:text-white transition-colors">
              <Plus size={20} />
            </button>
            
            <div className="flex-1 bg-[#1a1a1a] border border-gray-800 rounded-xl px-4 py-3">
              <textarea
                ref={textareaRef}
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                placeholder="Type a message..."
                className="w-full bg-transparent text-white placeholder-gray-500 resize-none outline-none"
                rows={1}
                style={{ 
                  minHeight: '24px',
                  fontFamily: 'Saira, system-ui, sans-serif',
                  fontSize: '15px',
                }}
              />
            </div>
            
            <button className="p-2 text-gray-400 hover:text-white transition-colors">
              <Mic size={20} />
            </button>
            
            <button 
              onClick={handleSend}
              className="p-2 bg-white text-black rounded-lg hover:bg-gray-100 transition-colors"
            >
              <Send size={20} />
            </button>
          </div>
        </motion.div>
      </motion.div>

      {/* Right Panel - Agent Configuration */}
      <motion.div
        className="w-[400px] bg-[#0a0a0a] border-l border-gray-900"
        initial={{ x: 400 }}
        animate={{ x: 0 }}
        transition={{ 
          duration: 0.6,
          delay: 0.2,
          ease: [0.4, 0, 0.2, 1]
        }}
      >
        <div className="p-6">
          {/* Agent Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-white text-lg font-light">AGENT</h2>
            <button className="text-gray-400 hover:text-white">
              <MoreVertical size={20} />
            </button>
          </div>

          {/* Agent Card */}
          <div className="bg-[#1a1a1a] border border-gray-800 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-gray-400 text-sm">ONLINE</span>
            </div>
            <h3 className="text-white text-xl mb-2">PRODUCT MONITORING</h3>
            <p className="text-gray-500 text-sm">DAN GREY</p>
            
            <div className="flex gap-4 mt-4 pt-4 border-t border-gray-800">
              <div>
                <p className="text-gray-500 text-xs">TASKS COMPLETED</p>
                <p className="text-white text-lg">1.5k</p>
              </div>
              <div>
                <p className="text-gray-500 text-xs">TOKENS USED</p>
                <p className="text-white text-lg">1.5k</p>
              </div>
            </div>
            
            <div className="mt-4 pt-4 border-t border-gray-800">
              <p className="text-gray-500 text-xs mb-2">ACCESS</p>
              <p className="text-gray-300 text-sm">PUBLIC</p>
              <p className="text-gray-500 text-xs mt-1">ANYONE - PRESENT</p>
            </div>
          </div>

          {/* Contact Info */}
          <div className="mb-6">
            <p className="text-gray-500 text-xs mb-2">CONTACT</p>
            <p className="text-white text-sm mb-1">Mr Cabbage Flower</p>
            <p className="text-gray-400 text-xs mb-2">cabbageflower@agmail.com</p>
            <p className="text-gray-400 text-xs">+44 776 183 3949</p>
          </div>

          {/* Capabilities */}
          <div className="mb-6">
            <p className="text-gray-500 text-xs mb-3">CAPABILITIES</p>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-green-500 text-sm">✓</span>
                <span className="text-gray-300 text-sm">Code Interpreter & Data Analysis</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-green-500 text-sm">✓</span>
                <span className="text-gray-300 text-sm">Phone calls</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-green-500 text-sm">✓</span>
                <span className="text-gray-300 text-sm">Web search</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-green-500 text-sm">✓</span>
                <span className="text-gray-300 text-sm">Gmail</span>
              </div>
            </div>
          </div>

          {/* Purpose */}
          <div className="mb-6">
            <p className="text-gray-500 text-xs mb-2">PRIMARY PURPOSE</p>
            <p className="text-gray-300 text-sm leading-relaxed">
              Convince prospects to schedule a demo meeting showcasing Someone AI's capabilities and services.
            </p>
          </div>

          {/* Call Direction */}
          <div>
            <p className="text-gray-500 text-xs mb-2">CALL DIRECTION</p>
            <p className="text-gray-300 text-sm">Outbound</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default ChatView;