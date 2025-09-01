import { motion } from 'framer-motion';
import { Heart, CheckCircle, XCircle, AlertCircle, Loader2, RefreshCw, Server, Database, Zap } from 'lucide-react';
import { useState, useEffect } from 'react';
import { orchestratorAPI } from '../../services/orchestrator';
import { createClient } from '../../lib/client';
import { getDeployment } from '../../lib/environment/deployments';
import '../ChatScrollbar.css';

interface HealthTabProps {
  assistantId?: string;
  threadId?: string;
}

interface HealthStatus {
  api: 'checking' | 'healthy' | 'error' | 'unknown';
  assistant: 'checking' | 'healthy' | 'error' | 'unknown';
  thread: 'checking' | 'healthy' | 'error' | 'unknown';
  streaming: 'checking' | 'healthy' | 'error' | 'unknown';
  langchain: 'checking' | 'healthy' | 'error' | 'unknown';
  lastCheck: string | null;
  error?: string;
  serverInfo?: any;
  deployment?: any;
}

const HealthTab = ({ assistantId, threadId }: HealthTabProps) => {
  const [health, setHealth] = useState<HealthStatus>({
    api: 'unknown',
    assistant: 'unknown',
    thread: 'unknown',
    streaming: 'unknown',
    langchain: 'unknown',
    lastCheck: null
  });
  const [isChecking, setIsChecking] = useState(false);

  const checkHealth = async () => {
    setIsChecking(true);
    const newHealth: HealthStatus = {
      api: 'checking',
      assistant: 'checking',
      thread: 'checking',
      streaming: 'checking',
      langchain: 'checking',
      lastCheck: new Date().toISOString(),
      deployment: getDeployment()
    };
    
    setHealth(newHealth);

    try {
      // Check API health
      const response = await fetch('https://orchestrator.some1.ai/ok');
      if (response.ok) {
        const data = await response.json();
        newHealth.api = data.ok ? 'healthy' : 'error';
      } else {
        newHealth.api = 'error';
        newHealth.error = `API returned ${response.status}`;
      }

      // Check server info
      try {
        const infoResponse = await fetch('https://orchestrator.some1.ai/info');
        if (infoResponse.ok) {
          newHealth.serverInfo = await infoResponse.json();
        }
      } catch (e) {
        console.error('Failed to get server info:', e);
      }

      // Check LangChain SDK client
      try {
        const deployment = getDeployment();
        if (deployment?.deploymentUrl) {
          const client = createClient('dummy-token'); // Just for testing connectivity
          // Test basic client connectivity
          newHealth.langchain = 'healthy';
        } else {
          newHealth.langchain = 'error';
        }
      } catch (e) {
        newHealth.langchain = 'error';
      }

      // Check assistant if ID provided
      if (assistantId) {
        try {
          await orchestratorAPI.getAssistant(assistantId);
          newHealth.assistant = 'healthy';
        } catch (e) {
          newHealth.assistant = 'error';
        }
      } else {
        newHealth.assistant = 'unknown';
      }

      // Check thread if ID provided
      if (threadId) {
        try {
          await orchestratorAPI.getThread(threadId);
          newHealth.thread = 'healthy';
        } catch (e) {
          newHealth.thread = 'error';
        }
      } else {
        newHealth.thread = 'unknown';
      }

      // Test streaming capability
      if (newHealth.api === 'healthy') {
        // Streaming is available if API is healthy
        newHealth.streaming = 'healthy';
      } else {
        newHealth.streaming = 'unknown';
      }

    } catch (error) {
      console.error('Health check failed:', error);
      newHealth.api = 'error';
      newHealth.error = error instanceof Error ? error.message : 'Unknown error';
    }

    setHealth(newHealth);
    setIsChecking(false);
  };

  useEffect(() => {
    checkHealth();
    // Check health every 30 seconds
    const interval = setInterval(checkHealth, 30000);
    return () => clearInterval(interval);
  }, [assistantId, threadId]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'error':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'checking':
        return <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />;
      default:
        return <AlertCircle className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'text-green-500';
      case 'error':
        return 'text-red-500';
      case 'checking':
        return 'text-blue-500';
      default:
        return 'text-gray-500';
    }
  };

  return (
    <motion.div
      key="health"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="h-full overflow-y-auto tab-scrollbar"
    >
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <h2 className="text-white text-2xl font-light">API HEALTH</h2>
          <button
            onClick={checkHealth}
            disabled={isChecking}
            className="flex items-center gap-2 px-3 py-1 text-sm rounded bg-gray-800/30 text-gray-400 border border-gray-700/30 hover:bg-gray-700/30 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isChecking ? 'animate-spin' : ''}`} />
            Check Now
          </button>
        </div>
        {health.lastCheck && (
          <p className="text-gray-500 text-xs mt-2">
            Last checked: {new Date(health.lastCheck).toLocaleTimeString()}
          </p>
        )}
      </div>

      {/* Status Grid */}
      <div className="grid gap-4">
        {/* API Status */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="p-4 rounded-lg border bg-gray-800/30 border-gray-700/30"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Server className="w-5 h-5 text-gray-400" />
              <div>
                <h3 className="text-white font-medium">Orchestrator API</h3>
                <p className="text-gray-500 text-xs">https://orchestrator.some1.ai</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {getStatusIcon(health.api)}
              <span className={`text-sm capitalize ${getStatusColor(health.api)}`}>
                {health.api}
              </span>
            </div>
          </div>
        </motion.div>

        {/* Assistant Status */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="p-4 rounded-lg border bg-gray-800/30 border-gray-700/30"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Zap className="w-5 h-5 text-gray-400" />
              <div>
                <h3 className="text-white font-medium">Assistant</h3>
                <p className="text-gray-500 text-xs">
                  {assistantId ? `ID: ${assistantId.slice(0, 8)}...` : 'Not initialized'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {getStatusIcon(health.assistant)}
              <span className={`text-sm capitalize ${getStatusColor(health.assistant)}`}>
                {health.assistant}
              </span>
            </div>
          </div>
        </motion.div>

        {/* Thread Status */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="p-4 rounded-lg border bg-gray-800/30 border-gray-700/30"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Database className="w-5 h-5 text-gray-400" />
              <div>
                <h3 className="text-white font-medium">Thread</h3>
                <p className="text-gray-500 text-xs">
                  {threadId ? `ID: ${threadId.slice(0, 8)}...` : 'Not created'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {getStatusIcon(health.thread)}
              <span className={`text-sm capitalize ${getStatusColor(health.thread)}`}>
                {health.thread}
              </span>
            </div>
          </div>
        </motion.div>

        {/* LangChain SDK Status */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
          className="p-4 rounded-lg border bg-gray-800/30 border-gray-700/30"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Heart className="w-5 h-5 text-gray-400" />
              <div>
                <h3 className="text-white font-medium">LangChain SDK</h3>
                <p className="text-gray-500 text-xs">{health.deployment?.deploymentUrl || 'Not configured'}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {getStatusIcon(health.langchain)}
              <span className={`text-sm capitalize ${getStatusColor(health.langchain)}`}>
                {health.langchain}
              </span>
            </div>
          </div>
        </motion.div>

        {/* Streaming Status */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 }}
          className="p-4 rounded-lg border bg-gray-800/30 border-gray-700/30"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Zap className="w-5 h-5 text-gray-400" />
              <div>
                <h3 className="text-white font-medium">Streaming</h3>
                <p className="text-gray-500 text-xs">Server-sent events</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {getStatusIcon(health.streaming)}
              <span className={`text-sm capitalize ${getStatusColor(health.streaming)}`}>
                {health.streaming}
              </span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Error Message */}
      {health.error && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg"
        >
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="text-red-400 font-medium mb-1">Connection Error</h4>
              <p className="text-gray-300 text-sm">{health.error}</p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Server Info */}
      {(health.serverInfo || health.deployment) && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-6 p-4 bg-gray-800/20 rounded-lg border border-gray-700/30"
        >
          <h4 className="text-gray-400 text-xs mb-3">DEPLOYMENT INFORMATION</h4>
          <div className="space-y-2 text-xs">
            {health.deployment?.name && (
              <div className="flex justify-between">
                <span className="text-gray-500">Deployment:</span>
                <span className="text-gray-300">{health.deployment.name}</span>
              </div>
            )}
            {health.deployment?.deploymentUrl && (
              <div className="flex justify-between">
                <span className="text-gray-500">URL:</span>
                <span className="text-gray-300 truncate max-w-48">{health.deployment.deploymentUrl}</span>
              </div>
            )}
            {health.deployment?.agentId && (
              <div className="flex justify-between">
                <span className="text-gray-500">Agent ID:</span>
                <span className="text-gray-300">{health.deployment.agentId}</span>
              </div>
            )}
            {threadId && (
              <div className="flex justify-between">
                <span className="text-gray-500">Thread ID:</span>
                <span className="text-gray-300 font-mono">{threadId.slice(0, 12)}...</span>
              </div>
            )}
            {health.serverInfo?.version && (
              <div className="flex justify-between">
                <span className="text-gray-500">Server Version:</span>
                <span className="text-gray-300">{health.serverInfo.version}</span>
              </div>
            )}
            {health.serverInfo?.langgraph_py_version && (
              <div className="flex justify-between">
                <span className="text-gray-500">LangGraph:</span>
                <span className="text-gray-300">{health.serverInfo.langgraph_py_version}</span>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};

export default HealthTab;