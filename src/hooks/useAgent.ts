import { useState, useEffect, useCallback, useRef } from 'react';
import { orchestratorAPI } from '../services/orchestrator';
import type { Assistant, Thread, Run, StreamEvent } from '../services/orchestrator';

export interface AgentPlan {
  tasks: {
    id: string;
    name: string;
    description?: string;
    status: 'pending' | 'running' | 'completed' | 'failed';
    progress?: number;
  }[];
  currentTask?: string;
}

export interface AgentTool {
  name: string;
  description?: string;
  status: 'available' | 'running' | 'completed';
  lastUsed?: string;
  parameters?: any;
}

export interface ActivityEvent {
  id: string;
  timestamp: string;
  type: string;
  data: any;
  level: 'info' | 'warning' | 'error' | 'success' | 'debug';
}

interface UseAgentState {
  // Core entities
  assistant: Assistant | null;
  thread: Thread | null;
  currentRun: Run | null;
  
  // UI State
  plan: AgentPlan | null;
  tools: AgentTool[];
  activities: ActivityEvent[];
  isProcessing: boolean;
  error: string | null;
  
  // Streaming
  streamConnection: EventSource | null;
}

export const useAgent = (onMessageReceived?: (message: any) => void) => {
  const [state, setState] = useState<UseAgentState>({
    assistant: null,
    thread: null,
    currentRun: null,
    plan: null,
    tools: [],
    activities: [],
    isProcessing: false,
    error: null,
    streamConnection: null
  });

  const activitiesRef = useRef<ActivityEvent[]>([]);
  const maxActivities = 1000; // Keep last 1000 events

  // Add activity event
  const addActivity = useCallback((event: Omit<ActivityEvent, 'id' | 'timestamp'>) => {
    const newEvent: ActivityEvent = {
      ...event,
      id: `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString()
    };

    activitiesRef.current = [newEvent, ...activitiesRef.current].slice(0, maxActivities);
    
    setState(prev => ({
      ...prev,
      activities: activitiesRef.current
    }));
  }, []);

  // Initialize assistant and thread
  const initialize = useCallback(async () => {
    // Prevent multiple initializations
    if (state.assistant && state.thread) {
      return;
    }

    try {
      // Create or get assistant
      const assistant = await orchestratorAPI.createAssistant({
        name: 'AI Agent',
        description: 'General purpose AI assistant',
        metadata: { 
          ui_version: '1.0',
          capabilities: ['planning', 'execution', 'tools']
        }
      });

      // Create thread for conversation
      const thread = await orchestratorAPI.createThread({
        user_id: 'user_' + Date.now(),
        session_id: 'session_' + Date.now()
      });

      // Get available tools from schema
      const schemas = await orchestratorAPI.getAssistantSchemas(assistant.assistant_id);
      const toolsList = extractToolsFromSchema(schemas);

      setState(prev => ({
        ...prev,
        assistant,
        thread,
        tools: toolsList
      }));

      // Add initialization activity
      addActivity({
        type: 'system',
        data: { message: 'Agent initialized successfully' },
        level: 'success'
      });

    } catch (error) {
      console.error('Failed to initialize agent:', error);
      setState(prev => ({
        ...prev,
        error: 'Failed to initialize agent'
      }));
      addActivity({
        type: 'error',
        data: { message: 'Failed to initialize agent', error },
        level: 'error'
      });
    }
  }, [state.assistant, state.thread, addActivity]);

  // Extract tools from schema (parsing the schema for available tools)
  const extractToolsFromSchema = (_schemas: any): AgentTool[] => {
    
    // Parse schema to find tools - this depends on your actual schema structure
    // For now, returning mock tools based on what you mentioned
    const availableTools = [
      { name: 'computer_use', description: 'VNC instance with vision capabilities' },
      { name: 'mcp', description: 'Model Context Protocol integration' },
      { name: 'web_search', description: 'Search the web for information' },
      { name: 'code_interpreter', description: 'Execute and analyze code' },
      { name: 'file_operations', description: 'Read, write, and manipulate files' }
    ];

    return availableTools.map(tool => ({
      ...tool,
      status: 'available' as const
    }));
  };

  // Parse streaming events
  const handleStreamEvent = useCallback((event: StreamEvent) => {
    // Add all events to activity log
    addActivity({
      type: event.type,
      data: event.data,
      level: 'info'
    });

    // Parse specific event types
    switch (event.type) {
      case 'messages':
        const message = handleMessageEvent(event.data);
        if (onMessageReceived && message?.content) {
          onMessageReceived(message);
        }
        break;
      
      case 'tasks':
        handleTaskEvent(event.data);
        break;
      
      case 'values':
        handleValueEvent(event.data);
        break;
      
      case 'events':
        handleGenericEvent(event.data);
        break;
      
      case 'updates':
        handleUpdateEvent(event.data);
        break;
      
      case 'debug':
        addActivity({
          type: 'debug',
          data: event.data,
          level: 'debug'
        });
        break;
    }
  }, [addActivity]);

  // Handle message events (chat messages, plans, etc.)
  const handleMessageEvent = (data: any) => {
    // Add to activity log
    addActivity({
      type: 'assistant_message',
      data: data,
      level: 'info'
    });

    // Parse plan from messages if present
    if (data.content && typeof data.content === 'string') {
      const planMatch = data.content.match(/## Plan[\s\S]*?(?=##|$)/);
      if (planMatch) {
        parsePlanFromMessage(planMatch[0]);
      }
    }

    // Return the message for chat display
    return data;
  };

  // Handle task events
  const handleTaskEvent = (data: any) => {
    if (data.task && data.status) {
      updatePlanTask(data.task, data.status);
    }
  };

  // Handle value/state events
  const handleValueEvent = (data: any) => {
    // Update thread state
    if (data.thread_state) {
      setState(prev => ({
        ...prev,
        thread: { ...prev.thread!, values: data.thread_state }
      }));
    }
  };

  // Handle generic events
  const handleGenericEvent = (data: any) => {
    // Tool usage events
    if (data.tool) {
      updateToolStatus(data.tool, data.status || 'running');
    }
  };

  // Handle state updates
  const handleUpdateEvent = (data: any) => {
    if (data.run_status) {
      setState(prev => ({
        ...prev,
        currentRun: prev.currentRun ? { ...prev.currentRun, status: data.run_status } : null
      }));
    }
  };

  // Parse plan from message content
  const parsePlanFromMessage = (planText: string) => {
    const tasks: AgentPlan['tasks'] = [];
    const lines = planText.split('\n');
    
    lines.forEach((line, index) => {
      const taskMatch = line.match(/^\d+\.\s+(.+)/);
      if (taskMatch) {
        tasks.push({
          id: `task_${index}`,
          name: taskMatch[1],
          status: 'pending'
        });
      }
    });

    if (tasks.length > 0) {
      setState(prev => ({
        ...prev,
        plan: { tasks, currentTask: tasks[0]?.id }
      }));
      
      addActivity({
        type: 'plan',
        data: { tasks: tasks.length, message: 'Plan created' },
        level: 'success'
      });
    }
  };

  // Update plan task status
  const updatePlanTask = (taskId: string, status: string) => {
    setState(prev => {
      if (!prev.plan) return prev;
      
      const updatedTasks = prev.plan.tasks.map(task =>
        task.id === taskId ? { ...task, status: status as any } : task
      );
      
      return {
        ...prev,
        plan: { ...prev.plan, tasks: updatedTasks }
      };
    });
  };

  // Update tool status
  const updateToolStatus = (toolName: string, status: string) => {
    setState(prev => ({
      ...prev,
      tools: prev.tools.map(tool =>
        tool.name === toolName 
          ? { ...tool, status: status as any, lastUsed: new Date().toISOString() }
          : tool
      )
    }));
  };

  const statusCheckIntervalRef = useRef<number | null>(null);

  // Send a message/command to the agent
  const sendMessage = useCallback(async (message: string) => {
    if (!state.assistant || !state.thread) {
      setState(prev => ({ ...prev, error: 'Agent not initialized' }));
      return;
    }

    // Clear any existing status check
    if (statusCheckIntervalRef.current) {
      clearInterval(statusCheckIntervalRef.current);
      statusCheckIntervalRef.current = null;
    }

    setState(prev => ({ ...prev, isProcessing: true, error: null }));
    
    try {
      // Add user message to activities
      addActivity({
        type: 'user_message',
        data: { message },
        level: 'info'
      });

      // Create and stream run
      const { run, stop } = await orchestratorAPI.streamRunCreate(state.thread.thread_id, {
        assistantId: state.assistant.assistant_id,
        input: { message },
        onEvent: handleStreamEvent
      });

      setState(prev => ({ 
        ...prev, 
        currentRun: run,
        streamConnection: { close: stop } as any
      }));

      // Monitor run status with proper cleanup
      statusCheckIntervalRef.current = setInterval(async () => {
        try {
          const runStatus = await orchestratorAPI.getRun(state.thread!.thread_id, run.run_id);
          if (runStatus.status === 'success' || runStatus.status === 'error' || runStatus.status === 'timeout') {
            if (statusCheckIntervalRef.current) {
              clearInterval(statusCheckIntervalRef.current);
              statusCheckIntervalRef.current = null;
            }
            setState(prev => ({ 
              ...prev, 
              isProcessing: false,
              currentRun: runStatus
            }));
            stop();
          }
        } catch (error) {
          console.error('Failed to check run status:', error);
        }
      }, 2000);

    } catch (error) {
      console.error('Failed to send message:', error);
      setState(prev => ({
        ...prev,
        error: 'Failed to send message',
        isProcessing: false
      }));
      addActivity({
        type: 'error',
        data: { message: 'Failed to send message', error },
        level: 'error'
      });
    }
  }, [state.assistant, state.thread, handleStreamEvent, addActivity]);

  // Send a status query without interrupting execution
  const queryStatus = useCallback(async (query: string) => {
    // This sends a query that doesn't interrupt the current execution
    // It's a separate conversation thread
    addActivity({
      type: 'status_query',
      data: { query },
      level: 'info'
    });

    // You can implement this as a separate lightweight query mechanism
    // For now, we'll just check the current state
    const status = {
      isRunning: state.isProcessing,
      currentTask: state.plan?.currentTask,
      runStatus: state.currentRun?.status,
      activities: state.activities.slice(0, 5) // Last 5 activities
    };

    addActivity({
      type: 'status_response',
      data: status,
      level: 'info'
    });

    return status;
  }, [state, addActivity]);

  // Cancel current execution
  const cancelExecution = useCallback(async () => {
    if (!state.thread || !state.currentRun) return;

    try {
      // Clear status check interval
      if (statusCheckIntervalRef.current) {
        clearInterval(statusCheckIntervalRef.current);
        statusCheckIntervalRef.current = null;
      }

      await orchestratorAPI.cancelRun(state.thread.thread_id, state.currentRun.run_id);
      
      setState(prev => ({
        ...prev,
        isProcessing: false,
        currentRun: null
      }));
      
      addActivity({
        type: 'system',
        data: { message: 'Execution cancelled' },
        level: 'warning'
      });
      
      // Close stream if active
      if (state.streamConnection) {
        state.streamConnection.close();
        setState(prev => ({ ...prev, streamConnection: null }));
      }
    } catch (error) {
      console.error('Failed to cancel execution:', error);
    }
  }, [state.thread, state.currentRun, state.streamConnection, addActivity]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (state.streamConnection) {
        state.streamConnection.close();
      }
      if (statusCheckIntervalRef.current) {
        clearInterval(statusCheckIntervalRef.current);
        statusCheckIntervalRef.current = null;
      }
    };
  }, [state.streamConnection]);

  return {
    // State
    ...state,
    
    // Actions
    initialize,
    sendMessage,
    queryStatus,
    cancelExecution,
    
    // Utilities
    clearActivities: () => {
      activitiesRef.current = [];
      setState(prev => ({ ...prev, activities: [] }));
    }
  };
};