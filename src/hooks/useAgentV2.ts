import { useState, useCallback, useRef } from 'react';
import { orchestratorV2 } from '../services/orchestratorV2';
import type { StreamEvent } from '../services/orchestratorV2';

export interface AgentMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
}

export interface AgentState {
  messages: AgentMessage[];
  isProcessing: boolean;
  error: string | null;
  activities: any[];
  plan: any | null;
  tools: any[];
  isConnected: boolean;
}

export const useAgentV2 = () => {
  const [state, setState] = useState<AgentState>({
    messages: [],
    isProcessing: false,
    error: null,
    activities: [],
    plan: null,
    tools: [],
    isConnected: false
  });

  const stopFunctionRef = useRef<(() => void) | null>(null);

  // Check connection health
  const checkConnection = useCallback(async () => {
    try {
      const health = await orchestratorV2.checkHealth();
      setState(prev => ({ ...prev, isConnected: health.ok }));
      return health.ok;
    } catch (error) {
      setState(prev => ({ ...prev, isConnected: false }));
      return false;
    }
  }, []);

  // Handle stream events
  const handleStreamEvent = useCallback((event: StreamEvent) => {
    console.log('Stream event:', event);

    // Add to activities
    setState(prev => ({
      ...prev,
      activities: [{
        id: Date.now().toString(),
        timestamp: new Date().toISOString(),
        type: event.event,
        data: event.data
      }, ...prev.activities].slice(0, 500) // Keep last 500 events
    }));

    // Handle different event types
    if (event.event === 'data' && event.data) {
      // Check for messages
      if (event.data.type === 'message' || event.data.messages) {
        const messages = event.data.messages || [event.data];
        messages.forEach((msg: any) => {
          if (msg.content) {
            const assistantMessage: AgentMessage = {
              id: Date.now().toString(),
              role: 'assistant',
              content: typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content),
              timestamp: new Date()
            };
            setState(prev => ({
              ...prev,
              messages: [...prev.messages, assistantMessage]
            }));
          }
        });
      }

      // Check for plan
      if (event.data.plan || (event.data.content && typeof event.data.content === 'string' && event.data.content.includes('Plan'))) {
        setState(prev => ({
          ...prev,
          plan: event.data.plan || extractPlanFromContent(event.data.content)
        }));
      }

      // Check for tools
      if (event.data.tools || event.data.tool_calls) {
        setState(prev => ({
          ...prev,
          tools: event.data.tools || event.data.tool_calls || []
        }));
      }

      // Check for final output
      if (event.data.output) {
        const outputMessage: AgentMessage = {
          id: Date.now().toString(),
          role: 'assistant',
          content: typeof event.data.output === 'string' ? event.data.output : JSON.stringify(event.data.output),
          timestamp: new Date()
        };
        setState(prev => ({
          ...prev,
          messages: [...prev.messages, outputMessage]
        }));
      }
    }

    // Handle completion
    if (event.event === 'done') {
      setState(prev => ({ ...prev, isProcessing: false }));
      stopFunctionRef.current = null;
    }

    // Handle error
    if (event.event === 'error') {
      setState(prev => ({
        ...prev,
        isProcessing: false,
        error: event.data
      }));
      stopFunctionRef.current = null;
    }
  }, []);

  // Extract plan from text content
  const extractPlanFromContent = (content: string) => {
    const lines = content.split('\n');
    const tasks: any[] = [];
    
    lines.forEach((line, index) => {
      const match = line.match(/^\d+\.\s+(.+)/);
      if (match) {
        tasks.push({
          id: `task_${index}`,
          name: match[1],
          status: 'pending'
        });
      }
    });

    return tasks.length > 0 ? { tasks } : null;
  };

  // Send message
  const sendMessage = useCallback(async (message: string) => {
    // Add user message
    const userMessage: AgentMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: message,
      timestamp: new Date()
    };

    setState(prev => ({
      ...prev,
      messages: [...prev.messages, userMessage],
      isProcessing: true,
      error: null
    }));

    try {
      // Start streaming - matching LangChain Studio exactly
      const stop = await orchestratorV2.streamRun(
        {
          assistant_id: 'bd9d7831-8cd0-52cf-b4ff-e0a75afee4f5',
          input: {
            messages: [{ 
              role: 'user', 
              content: message 
            }]
          },
          config: {
            configurable: {},
            tags: ['ui'],
            metadata: {
              source: 'ui',
              timestamp: Date.now()
            }
          },
          stream_mode: ['values', 'messages', 'events', 'updates', 'debug'],
          stream_subgraphs: true
        },
        handleStreamEvent
      );

      stopFunctionRef.current = stop;

    } catch (error: any) {
      console.error('Failed to send message:', error);
      setState(prev => ({
        ...prev,
        isProcessing: false,
        error: error.message || 'Failed to send message'
      }));
    }
  }, [handleStreamEvent]);

  // Cancel execution
  const cancelExecution = useCallback(() => {
    if (stopFunctionRef.current) {
      stopFunctionRef.current();
      stopFunctionRef.current = null;
    }
    orchestratorV2.cancel();
    setState(prev => ({ ...prev, isProcessing: false }));
  }, []);

  // Clear activities
  const clearActivities = useCallback(() => {
    setState(prev => ({ ...prev, activities: [] }));
  }, []);

  // Clear messages
  const clearMessages = useCallback(() => {
    setState(prev => ({ ...prev, messages: [] }));
  }, []);

  return {
    ...state,
    sendMessage,
    cancelExecution,
    clearActivities,
    clearMessages,
    checkConnection
  };
};