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

interface CronJob {
  cron_id: string;
  thread_id?: string;
  assistant_id: string;
  schedule: string;
  payload?: any;
  created_at: string;
  updated_at: string;
  end_time?: string;
  next_run_date?: string;
  metadata?: any;
  user_id?: string;
  webhook?: string;
  multitask_strategy?: 'reject' | 'rollback' | 'interrupt' | 'enqueue';
  on_completion?: 'delete' | 'keep';
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
        graph_id: 'bd9d7831-8cd0-52cf-b4ff-e0a75afee4f5',
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

  async searchAssistants(params: {
    graph_id?: string;
    metadata?: Record<string, any>;
    limit?: number;
    offset?: number;
    sort_by?: 'assistant_id' | 'created_at' | 'updated_at' | 'name' | 'graph_id';
    sort_order?: 'asc' | 'desc';
    select?: string[];
  } = {}): Promise<Assistant[]> {
    const response = await fetch(`${this.baseUrl}/assistants/search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        graph_id: 'deepagent',
        limit: 50,
        sort_by: 'updated_at',
        sort_order: 'desc',
        ...params
      })
    });
    
    if (!response.ok) {
      throw new Error(`Failed to search assistants: ${response.statusText}`);
    }
    
    return response.json();
  }

  async countAssistants(params: {
    graph_id?: string;
    metadata?: Record<string, any>;
  } = {}): Promise<number> {
    const response = await fetch(`${this.baseUrl}/assistants/count`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        graph_id: 'deepagent',
        ...params
      })
    });
    
    if (!response.ok) {
      throw new Error(`Failed to count assistants: ${response.statusText}`);
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

  async searchThreads(params: {
    metadata?: Record<string, any>;
    limit?: number;
    offset?: number;
    sort_by?: 'thread_id' | 'created_at' | 'updated_at' | 'status';
    sort_order?: 'asc' | 'desc';
    select?: string[];
  } = {}): Promise<Thread[]> {
    const response = await fetch(`${this.baseUrl}/threads/search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        limit: 50,
        sort_by: 'updated_at',
        sort_order: 'desc',
        ...params
      })
    });
    
    if (!response.ok) {
      throw new Error(`Failed to search threads: ${response.statusText}`);
    }
    
    return response.json();
  }

  async countThreads(params: {
    metadata?: Record<string, any>;
  } = {}): Promise<number> {
    const response = await fetch(`${this.baseUrl}/threads/count`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params)
    });
    
    if (!response.ok) {
      throw new Error(`Failed to count threads: ${response.statusText}`);
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

  // Cancel all runs (global cancel)
  async cancelAllRuns(): Promise<void> {
    const response = await fetch(`${this.baseUrl}/runs/cancel`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        status: 'all'
      })
    });
    
    if (!response.ok) {
      throw new Error(`Failed to cancel all runs: ${response.statusText}`);
    }
  }

  // Get active runs for a thread
  async getActiveRuns(threadId?: string): Promise<Run[]> {
    const url = threadId 
      ? `${this.baseUrl}/threads/${threadId}/runs?status=pending,running`
      : `${this.baseUrl}/runs?status=pending,running`;
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to get active runs: ${response.statusText}`);
    }
    return response.json();
  }

  // Get thread history with checkpoints
  async getThreadHistory(threadId: string, options?: {
    before?: string;
    limit?: number;
    metadata?: Record<string, any>;
  }): Promise<any[]> {
    const params = new URLSearchParams();
    if (options?.before) params.set('before', options.before);
    if (options?.limit) params.set('limit', options.limit.toString());
    if (options?.metadata) params.set('metadata', JSON.stringify(options.metadata));
    
    const url = `${this.baseUrl}/threads/${threadId}/history${params.toString() ? '?' + params.toString() : ''}`;
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Failed to get thread history: ${response.statusText}`);
    }
    return response.json();
  }

  // Update thread state (for rollback)
  async updateThreadState(threadId: string, state: any, asNode?: string): Promise<any> {
    const response = await fetch(`${this.baseUrl}/threads/${threadId}/state`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        values: state,
        as_node: asNode
      })
    });
    
    if (!response.ok) {
      throw new Error(`Failed to update thread state: ${response.statusText}`);
    }
    return response.json();
  }

  // Get thread interrupts
  async getThreadInterrupts(threadId: string): Promise<any[]> {
    const response = await fetch(`${this.baseUrl}/threads/${threadId}/interrupts`);
    if (!response.ok) {
      throw new Error(`Failed to get thread interrupts: ${response.statusText}`);
    }
    return response.json();
  }

  // Resume from interrupt
  async resumeFromInterrupt(threadId: string, command?: any): Promise<Run> {
    const response = await fetch(`${this.baseUrl}/threads/${threadId}/runs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        command: command || { resume: null },
        multitask_strategy: 'enqueue'
      })
    });
    
    if (!response.ok) {
      throw new Error(`Failed to resume from interrupt: ${response.statusText}`);
    }
    return response.json();
  }

  // Cron Job Management
  async createCronJob(threadId: string, cronData: {
    assistant_id: string;
    schedule: string;
    input?: any;
    metadata?: any;
    end_time?: string;
    webhook?: string;
    multitask_strategy?: 'reject' | 'rollback' | 'interrupt' | 'enqueue';
  }): Promise<CronJob> {
    const response = await fetch(`${this.baseUrl}/threads/${threadId}/runs/crons`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...cronData,
        multitask_strategy: cronData.multitask_strategy || 'enqueue'
      })
    });
    
    if (!response.ok) {
      throw new Error(`Failed to create cron job: ${response.statusText}`);
    }
    
    return response.json();
  }

  async searchCronJobs(params: {
    assistant_id?: string;
    thread_id?: string;
    limit?: number;
    offset?: number;
    sort_by?: 'cron_id' | 'assistant_id' | 'thread_id' | 'next_run_date' | 'end_time' | 'created_at' | 'updated_at';
    sort_order?: 'asc' | 'desc';
    select?: string[];
  } = {}): Promise<CronJob[]> {
    const response = await fetch(`${this.baseUrl}/runs/crons/search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        limit: 100,
        sort_by: 'created_at',
        sort_order: 'desc',
        ...params
      })
    });
    
    if (!response.ok) {
      throw new Error(`Failed to search cron jobs: ${response.statusText}`);
    }
    
    return response.json();
  }

  async countCronJobs(params: {
    assistant_id?: string;
    thread_id?: string;
  } = {}): Promise<number> {
    const response = await fetch(`${this.baseUrl}/runs/crons/count`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params)
    });
    
    if (!response.ok) {
      throw new Error(`Failed to count cron jobs: ${response.statusText}`);
    }
    
    return response.json();
  }

  async deleteCronJob(cronId: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/runs/crons/${cronId}`, {
      method: 'DELETE'
    });
    
    if (!response.ok) {
      throw new Error(`Failed to delete cron job: ${response.statusText}`);
    }
  }

  // Create stateless cron job
  async createStatelessCronJob(cronData: {
    assistant_id: string;
    schedule: string;
    input?: any;
    metadata?: any;
    end_time?: string;
    webhook?: string;
    multitask_strategy?: 'reject' | 'rollback' | 'interrupt' | 'enqueue';
    on_completion?: 'delete' | 'keep';
  }): Promise<CronJob> {
    const response = await fetch(`${this.baseUrl}/runs/crons`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...cronData,
        multitask_strategy: cronData.multitask_strategy || 'enqueue',
        on_completion: cronData.on_completion || 'delete'
      })
    });
    
    if (!response.ok) {
      throw new Error(`Failed to create stateless cron job: ${response.statusText}`);
    }
    
    return response.json();
  }
}

export const orchestratorAPI = new OrchestratorAPI();

// Export types
export type {
  Assistant,
  Thread,
  Run,
  StreamEvent,
  GraphSchema,
  CronJob
};