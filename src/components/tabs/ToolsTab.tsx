import { motion } from 'framer-motion';
import { Wrench, Monitor, Globe, Code, FileText, CheckCircle, Clock, Loader2 } from 'lucide-react';
import type { AgentTool } from '../../hooks/useAgent';
import '../ChatScrollbar.css';

interface ToolsTabProps {
  tools: AgentTool[];
}

const ToolsTab = ({ tools }: ToolsTabProps) => {
  const getToolIcon = (toolName: string) => {
    switch (toolName.toLowerCase()) {
      case 'computer_use':
        return <Monitor className="w-5 h-5" />;
      case 'mcp':
        return <Wrench className="w-5 h-5" />;
      case 'web_search':
        return <Globe className="w-5 h-5" />;
      case 'code_interpreter':
        return <Code className="w-5 h-5" />;
      case 'file_operations':
        return <FileText className="w-5 h-5" />;
      default:
        return <Wrench className="w-5 h-5" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running':
        return 'text-blue-400 bg-blue-500/10 border-blue-500/30';
      case 'completed':
        return 'text-green-400 bg-green-500/10 border-green-500/30';
      default:
        return 'text-gray-400 bg-gray-800/30 border-gray-700/30';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'running':
        return <Loader2 className="w-4 h-4 animate-spin" />;
      case 'completed':
        return <CheckCircle className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  return (
    <motion.div
      key="tools"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="h-full overflow-y-auto tab-scrollbar"
    >
      <div className="mb-8">
        <h2 className="text-white text-2xl font-light">AVAILABLE TOOLS</h2>
        <p className="text-gray-500 text-sm mt-2">
          {tools.length} tools integrated
        </p>
      </div>

      {tools.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 text-gray-500">
          <Wrench className="w-12 h-12 mb-4 opacity-50" />
          <p className="text-sm">No tools available</p>
          <p className="text-xs mt-2 opacity-70">Tools will appear once agent is initialized</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {tools.map((tool, index) => (
            <motion.div
              key={tool.name}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className={`
                p-4 rounded-lg border transition-all duration-300
                ${getStatusColor(tool.status)}
              `}
            >
              <div className="flex items-start gap-4">
                {/* Tool Icon */}
                <div className="flex-shrink-0 mt-1">
                  {getToolIcon(tool.name)}
                </div>

                {/* Tool Info */}
                <div className="flex-1">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-white font-medium">
                        {tool.name.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </h3>
                      {tool.description && (
                        <p className="text-gray-500 text-sm mt-1">
                          {tool.description}
                        </p>
                      )}
                    </div>

                    {/* Status */}
                    <div className="flex items-center gap-2 ml-4">
                      {getStatusIcon(tool.status)}
                      <span className="text-xs capitalize">
                        {tool.status}
                      </span>
                    </div>
                  </div>

                  {/* Last Used */}
                  {tool.lastUsed && (
                    <div className="mt-3 flex items-center gap-2 text-xs text-gray-500">
                      <Clock className="w-3 h-3" />
                      <span>
                        Last used: {new Date(tool.lastUsed).toLocaleTimeString()}
                      </span>
                    </div>
                  )}

                  {/* Parameters (if running) */}
                  {tool.status === 'running' && tool.parameters && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="mt-3 p-2 bg-black/30 rounded text-xs font-mono text-gray-400"
                    >
                      <pre>{JSON.stringify(tool.parameters, null, 2)}</pre>
                    </motion.div>
                  )}
                </div>
              </div>
            </motion.div>
          ))}

          {/* Tool Categories Summary */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="mt-6 p-4 bg-gray-800/20 rounded-lg border border-gray-700/30"
          >
            <h4 className="text-gray-400 text-xs mb-3">CAPABILITIES</h4>
            <div className="grid grid-cols-2 gap-3">
              {tools.some(t => t.name === 'computer_use') && (
                <div className="flex items-center gap-2">
                  <Monitor className="w-4 h-4 text-purple-400" />
                  <span className="text-sm text-gray-300">Computer Vision</span>
                </div>
              )}
              {tools.some(t => t.name === 'mcp') && (
                <div className="flex items-center gap-2">
                  <Wrench className="w-4 h-4 text-orange-400" />
                  <span className="text-sm text-gray-300">MCP Protocol</span>
                </div>
              )}
              {tools.some(t => t.name === 'web_search') && (
                <div className="flex items-center gap-2">
                  <Globe className="w-4 h-4 text-blue-400" />
                  <span className="text-sm text-gray-300">Web Access</span>
                </div>
              )}
              {tools.some(t => t.name === 'code_interpreter') && (
                <div className="flex items-center gap-2">
                  <Code className="w-4 h-4 text-green-400" />
                  <span className="text-sm text-gray-300">Code Execution</span>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
};

export default ToolsTab;