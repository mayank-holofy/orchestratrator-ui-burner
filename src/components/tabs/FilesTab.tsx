import { motion } from 'framer-motion';
import { File, FileText } from 'lucide-react';

interface FilesTabProps {
  files: Record<string, string>;
  isLoading?: boolean;
}

const FilesTab = ({ files, isLoading }: FilesTabProps) => {
  const fileEntries = Object.entries(files || {});

  if (isLoading) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex items-center justify-center h-64"
      >
        <div className="flex gap-1">
          <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
          <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
          <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
        </div>
      </motion.div>
    );
  }

  if (fileEntries.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex flex-col items-center justify-center h-64 text-center"
      >
        <File className="w-8 h-8 text-gray-600 mb-3" />
        <p className="text-gray-400 text-sm">No files in this thread</p>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="p-4 space-y-4"
    >
      <div className="flex items-center justify-between">
        <h3 className="text-white font-medium">Files ({fileEntries.length})</h3>
      </div>
      
      <div className="space-y-2">
        {fileEntries.map(([filename, content], index) => (
          <motion.div
            key={filename}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-gray-900 rounded-lg p-3 border border-gray-700"
          >
            <div className="flex items-center gap-2 mb-2">
              <FileText className="w-4 h-4 text-blue-400" />
              <span className="text-white text-sm font-medium">{filename}</span>
              <span className="text-gray-500 text-xs ml-auto">
                {content.length} chars
              </span>
            </div>
            
            <div className="bg-gray-800 rounded p-2 max-h-32 overflow-y-auto">
              <pre className="text-gray-300 text-xs whitespace-pre-wrap font-mono">
                {content.length > 500 ? `${content.substring(0, 500)}...` : content}
              </pre>
            </div>
            
            {content.length > 500 && (
              <button className="text-blue-400 hover:text-blue-300 text-xs mt-1">
                Show full content
              </button>
            )}
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
};

export default FilesTab;