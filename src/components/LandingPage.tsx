import { useState, useRef, useEffect } from 'react';
import { Plus, Mic, Send, ChevronDown, X } from 'lucide-react';
import logo from '../assets/logo.svg';
import EmployeeCard from './EmployeeCard';

interface AttachedFile {
  id: string;
  name: string;
  type: string;
}

const LandingPage = () => {
  const [message, setMessage] = useState('');
  const [attachedFiles, setAttachedFiles] = useState<AttachedFile[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);
  const [showCard, setShowCard] = useState(true);
  const [isFocused, setIsFocused] = useState(false);
  const [messages, setMessages] = useState<any[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
      // Add message to messages array
      setMessages([...messages, { text: message, files: attachedFiles }]);
      
      // Hide the card when first message is sent
      if (messages.length === 0) {
        setShowCard(false);
      }
      
      // Clear input
      setMessage('');
      setAttachedFiles([]);
      
      // Reset textarea height
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  };

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center px-6 relative overflow-hidden">
      {/* Background Video */}
      <div className="absolute inset-0 w-full h-full">
        <video
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
          style={{ opacity: 1 }}
        >
          <source src="/background-video.mp4" type="video/mp4" />
          {/* Fallback for browsers that don't support video */}
          Your browser does not support the video tag.
        </video>
        {/* Dark overlay for better text readability */}
        <div className="absolute inset-0 bg-black/30"></div>
      </div>

      {/* Logo/Brand */}
      <div className="absolute top-8 left-8 z-10">
        <img 
          src={logo} 
          alt="Some100 Logo" 
          className="h-12 w-auto"
          style={{ filter: 'brightness(0) invert(1)' }}
        />
      </div>

      {/* Main Content */}
      <div className="w-full relative z-10" style={{ maxWidth: '768px' }}>
        {/* Employee Card */}
        <EmployeeCard visible={showCard} />
        
        {/* Title */}
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

        {/* Input Container */}
        <div className="relative">
          {/* Glow effect when focused */}
          {isFocused && (
            <div 
              className="absolute inset-0 rounded-2xl opacity-50 pointer-events-none"
              style={{
                background: 'radial-gradient(circle at center, rgba(255, 255, 255, 0.1), transparent 70%)',
                filter: 'blur(20px)',
                transform: 'scale(1.05)',
              }}
            />
          )}
          
          <div className={`relative transition-all duration-500`}
          style={{
            borderRadius: '16px',
            padding: '24px',
            minHeight: '140px',
            backgroundColor: '#1E1E1E',
            border: '0.5px solid',
            borderColor: isFocused 
              ? 'rgba(255, 255, 255, 0.4)' 
              : isExpanded 
                ? 'rgba(129, 129, 129, 0.6)' 
                : 'rgba(129, 129, 129, 0.2)',
            boxShadow: isFocused 
              ? '0 0 40px rgba(255, 255, 255, 0.1), inset 0 0 20px rgba(255, 255, 255, 0.05)' 
              : 'none',
            transform: isFocused ? 'translateY(-2px)' : 'translateY(0)',
          }}>
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

            {/* Textarea */}
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

            {/* Bottom Controls */}
            <div className="flex items-center justify-between mt-6">
              <div className="flex items-center gap-3">
                {/* Add File Button */}
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

                {/* Public Dropdown */}
                <button className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors bg-[rgba(255,255,255,0.08)] hover:bg-[rgba(255,255,255,0.12)] px-4 py-2 rounded-lg">
                  <span style={{ fontSize: '15px' }}>Public</span>
                  <ChevronDown size={18} />
                </button>
              </div>

              <div className="flex items-center gap-2">
                {/* Mic Button */}
                <button className="text-gray-400 hover:text-white transition-colors p-2.5 hover:bg-[rgba(255,255,255,0.05)] rounded-lg">
                  <Mic size={22} />
                </button>

                {/* Send Button */}
                <button 
                  onClick={handleSendMessage}
                  className="bg-white text-black p-2.5 rounded-xl hover:bg-gray-100 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  disabled={!message.trim() && attachedFiles.length === 0}
                >
                  <Send size={20} />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Links */}
        <div className="flex justify-center gap-10 mt-10">
          <button className="text-gray-400 hover:text-white transition-colors" style={{ fontSize: '15px' }}>
            My Agents
          </button>
          <button className="text-gray-400 hover:text-white transition-colors" style={{ fontSize: '15px' }}>
            Templates
          </button>
        </div>
      </div>

      {/* Footer */}
      <div className="absolute bottom-8 text-gray-500 z-10" style={{ fontSize: '13px', letterSpacing: '0.5px' }}>
        YOU HAVE NO AGENTS
      </div>
    </div>
  );
};

export default LandingPage;