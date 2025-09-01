// Orchestrator API Service
const API_BASE = 'https://orchestrator.some1.ai';

interface Assistant {
  assistant_id: string;
  graph_id: string;
  name: string;
  description: string | null;
  config: {
    tags?: string[];
    recursion_limit?: number;
    configurable?: Record<string, any>;
  };
  context?: Record<string, any>;
  metadata?: Record<string, any>;
  version?: number;
  created_at: string;
  updated_at: string;
}

interface Thread {
  thread_id: string;
  status: 'idle' | 'busy' | 'interrupted' | 'error';
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
  values?: Record<string, any>;
  interrupts?: any[];
}

interface Run {
  run_id: string;
  thread_id: string;
  assistant_id: string;
  status: 'pending' | 'running' | 'error' | 'success' | 'timeout' | 'interrupted';
  created_at: string;
  updated_at: string;
  metadata: Record<string, any>;
}

interface StreamEvent {
  type: 'values' | 'messages' | 'events' | 'tasks' | 'updates' | 'debug' | 'custom';
  data: any;
  timestamp?: string;
}

interface GraphSchema {
  input_schema?: any;
  output_schema?: any;
  state_schema?: any;
  config_schema?: any;
  context_schema?: any;
}

class OrchestratorAPI {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE) {
    this.baseUrl = baseUrl;
  }

  // Assistant Management
  async createAssistant(params: {
    name?: string;
    description?: string;
    config?: any;
    context?: any;
    metadata?: any;
  }): Promise<Assistant> {
    const response = await fetch(`${this.baseUrl}/assistants`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        graph_id: 'deepagent',
        name: params.name || 'AI Assistant',
        description: params.description,
        config: params.config || {},
        context: params.context || {},
        metadata: params.metadata || {},
        if_exists: 'do_nothing'
      })
    });
    
    if (!response.ok) {
      throw new Error(`Failed to create assistant: ${response.statusText}`);
    }
    
    return response.json();
  }

  async getAssistant(assistantId: string): Promise<Assistant> {
    const response = await fetch(`${this.baseUrl}/assistants/${assistantId}`);
    if (!response.ok) {
      throw new Error(`Failed to get assistant: ${response.statusText}`);
    }
    return response.json();
  }

  async getAssistantSchemas(assistantId: string): Promise<GraphSchema> {
    const response = await fetch(`${this.baseUrl}/assistants/${assistantId}/schemas`);
    if (!response.ok) {
      throw new Error(`Failed to get assistant schemas: ${response.statusText}`);
    }
    return response.json();
  }

  async getAssistantGraph(assistantId: string): Promise<any> {
    const response = await fetch(`${this.baseUrl}/assistants/${assistantId}/graph`);
    if (!response.ok) {
      throw new Error(`Failed to get assistant graph: ${response.statusText}`);
    }
    return response.json();
  }

  // Thread Management
  async createThread(metadata?: Record<string, any>): Promise<Thread> {
    const response = await fetch(`${this.baseUrl}/threads`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        metadata: metadata || {},
        if_exists: 'do_nothing'
      })
    });
    
    if (!response.ok) {
      throw new Error(`Failed to create thread: ${response.statusText}`);
    }
    
    return response.json();
  }

  async getThread(threadId: string): Promise<Thread> {
    const response = await fetch(`${this.baseUrl}/threads/${threadId}`);
    if (!response.ok) {
      throw new Error(`Failed to get thread: ${response.statusText}`);
    }
    return response.json();
  }

  async getThreadState(threadId: string): Promise<any> {
    const response = await fetch(`${this.baseUrl}/threads/${threadId}/state`);
    if (!response.ok) {
      throw new Error(`Failed to get thread state: ${response.statusText}`);
    }
    return response.json();
  }

  // Run Management
  async createRun(threadId: string, params: {
    assistantId: string;
    input?: any;
    config?: any;
    interrupt_before?: string[] | '*';
    interrupt_after?: string[] | '*';
    stream_mode?: string[];
    metadata?: Record<string, any>;
  }): Promise<Run> {
    const response = await fetch(`${this.baseUrl}/threads/${threadId}/runs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        assistant_id: params.assistantId,
        input: params.input,
        config: params.config,
        interrupt_before: params.interrupt_before,
        interrupt_after: params.interrupt_after,
        stream_mode: params.stream_mode || ['values', 'messages', 'events', 'tasks'],
        metadata: params.metadata || {},
        multitask_strategy: 'enqueue'
      })
    });
    
    if (!response.ok) {
      throw new Error(`Failed to create run: ${response.statusText}`);
    }
    
    return response.json();
  }

  async getRun(threadId: string, runId: string): Promise<Run> {
    const response = await fetch(`${this.baseUrl}/threads/${threadId}/runs/${runId}`);
    if (!response.ok) {
      throw new Error(`Failed to get run: ${response.statusText}`);
    }
    return response.json();
  }

  async getThreadRuns(threadId: string): Promise<Run[]> {
    const response = await fetch(`${this.baseUrl}/threads/${threadId}/runs`);
    if (!response.ok) {
      throw new Error(`Failed to get thread runs: ${response.statusText}`);
    }
    return response.json();
  }

  // Streaming
  streamRun(threadId: string, runId: string, onEvent: (event: StreamEvent) => void): EventSource {
    const eventSource = new EventSource(
      `${this.baseUrl}/threads/${threadId}/runs/${runId}/stream`
    );

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        onEvent({
          type: data.type || 'events',
          data: data,
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        console.error('Failed to parse stream event:', error);
      }
    };

    eventSource.onerror = (error) => {
      console.error('Stream error:', error);
      eventSource.close();
    };

    return eventSource;
  }

  // Create and stream a run in one call
  async streamRunCreate(threadId: string, params: {
    assistantId: string;
    input?: any;
    config?: any;
    onEvent: (event: StreamEvent) => void;
  }): Promise<{ run: Run; stop: () => void }> {
    // First create the run
    const run = await this.createRun(threadId, {
      assistantId: params.assistantId,
      input: params.input,
      config: params.config,
      stream_mode: ['values', 'messages', 'events', 'tasks', 'updates', 'debug'],
      metadata: { source: 'ui' }
    });

    // Then stream events
    const eventSource = this.streamRun(threadId, run.run_id, params.onEvent);

    return {
      run,
      stop: () => eventSource.close()
    };
  }

  // Send command to running thread
  async sendCommand(threadId: string, _runId: string, command: {
    resume?: any;
    update?: any;
    goto?: { node: string; input: any };
  }): Promise<Run> {
    const response = await fetch(`${this.baseUrl}/threads/${threadId}/runs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        command: command,
        multitask_strategy: 'enqueue'
      })
    });
    
    if (!response.ok) {
      throw new Error(`Failed to send command: ${response.statusText}`);
    }
    
    return response.json();
  }

  // Cancel a run
  async cancelRun(threadId: string, runId: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/threads/${threadId}/runs/${runId}/cancel`, {
      method: 'POST'
    });
    
    if (!response.ok) {
      throw new Error(`Failed to cancel run: ${response.statusText}`);
    }
  }
}

export const orchestratorAPI = new OrchestratorAPI();

// Export types
export type {
  Assistant,
  Thread,
  Run,
  StreamEvent,
  GraphSchema
};