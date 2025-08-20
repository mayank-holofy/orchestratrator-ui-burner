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
  const [hasTyped, setHasTyped] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      if (message || attachedFiles.length > 0) {
        textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
        setIsExpanded(true);
        // Hide card when user starts typing
        if (message.length > 0 && !hasTyped) {
          setShowCard(false);
          setHasTyped(true);
        }
      } else {
        setIsExpanded(false);
      }
    }
  }, [message, attachedFiles, hasTyped]);

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
            in seconds<span className="inline-block w-3 h-10 bg-white ml-2 animate-pulse"></span>
          </h2>
        </div>

        {/* Input Container */}
        <div className="relative">
          <div className={`transition-all duration-300 ${
            isExpanded 
              ? 'bg-[#1E1E1E] border border-[#818181]' 
              : 'bg-[#1E1E1E] border border-solid border-[rgba(129,129,129,0.5)]'
          }`}
          style={{
            borderRadius: '16px',
            padding: '24px',
            minHeight: '140px',
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
              placeholder="Ask me anything..."
              className="w-full bg-transparent text-white placeholder-gray-400 resize-none outline-none"
              rows={1}
              style={{ 
                minHeight: '32px',
                fontFamily: 'Saira, system-ui, sans-serif',
                fontSize: '18px',
                lineHeight: '28px',
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