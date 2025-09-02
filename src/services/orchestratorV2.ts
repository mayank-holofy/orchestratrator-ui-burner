// Orchestrator API Service V2 - Matching LangChain Studio implementation
const API_BASE = 'https://orchestrator.some1.ai';

export interface StreamEvent {
  event: string;
  data: any;
}

export interface RunConfig {
  tags?: string[];
  metadata?: Record<string, any>;
  configurable?: Record<string, any>;
}

export interface RunRequest {
  assistant_id?: string;
  graph_id?: string;
  input: any;
  config?: RunConfig;
  stream_mode?: string[];
  stream_subgraphs?: boolean;
  on_disconnect?: 'cancel' | 'continue';
  on_completion?: 'delete' | 'keep';
  if_not_exists?: 'create' | 'reject';
}

class OrchestratorAPIV2 {
  private baseUrl: string;
  private abortController: AbortController | null = null;

  constructor(baseUrl: string = API_BASE) {
    this.baseUrl = baseUrl;
  }

  // Main streaming endpoint - exactly like LangChain Studio
  async streamRun(params: RunRequest, onEvent: (event: StreamEvent) => void): Promise<() => void> {
    // Cancel any existing stream
    if (this.abortController) {
      this.abortController.abort();
    }

    this.abortController = new AbortController();

    const requestBody = {
      assistant_id: params.assistant_id || 'bd9d7831-8cd0-52cf-b4ff-e0a75afee4f5',
      input: params.input,
      config: params.config || {},
      stream_mode: params.stream_mode || ['values', 'messages', 'events', 'tasks', 'updates', 'debug', 'checkpoints'],
      stream_subgraphs: params.stream_subgraphs !== false,
      on_disconnect: params.on_disconnect || 'cancel',
      on_completion: params.on_completion || 'delete',
      if_not_exists: params.if_not_exists || 'create'
    };

    console.log('Sending stream request:', requestBody);

    try {
      const response = await fetch(`${this.baseUrl}/runs/stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'text/event-stream',
        },
        body: JSON.stringify(requestBody),
        signal: this.abortController.signal
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to start stream: ${response.status} ${response.statusText} - ${errorText}`);
      }

      // Check if we got the right content type
      const contentType = response.headers.get('content-type');
      if (!contentType?.includes('text/event-stream')) {
        console.warn('Response is not SSE, got:', contentType);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('No response body');
      }

      const decoder = new TextDecoder();
      let buffer = '';

      // Process the stream
      const processStream = async () => {
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) {
              console.log('Stream ended');
              break;
            }

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            
            // Keep the last incomplete line in buffer
            buffer = lines.pop() || '';

            for (const line of lines) {
              if (line.trim() === '') continue;
              
              if (line.startsWith('event:')) {
                // const event = line.slice(6).trim();
                continue; // Event type line, will be paired with data
              }
              
              if (line.startsWith('data:')) {
                const dataStr = line.slice(5).trim();
                
                if (dataStr === '[DONE]') {
                  console.log('Received DONE signal');
                  onEvent({ event: 'done', data: null });
                  return;
                }

                try {
                  const data = JSON.parse(dataStr);
                  onEvent({ event: 'data', data });
                } catch (e) {
                  console.error('Failed to parse SSE data:', dataStr, e);
                }
              }
            }
          }
        } catch (error: any) {
          if (error.name === 'AbortError') {
            console.log('Stream aborted');
          } else {
            console.error('Stream error:', error);
            onEvent({ event: 'error', data: error.message });
          }
        } finally {
          reader.releaseLock();
        }
      };

      processStream();

      // Return stop function
      return () => {
        if (this.abortController) {
          this.abortController.abort();
          this.abortController = null;
        }
      };

    } catch (error) {
      console.error('Failed to start stream:', error);
      throw error;
    }
  }

  // Stateless run endpoint (non-streaming)
  async run(params: RunRequest): Promise<any> {
    const response = await fetch(`${this.baseUrl}/runs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        assistant_id: params.assistant_id || 'bd9d7831-8cd0-52cf-b4ff-e0a75afee4f5',
        input: params.input,
        config: params.config || {}
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to run: ${response.status} - ${errorText}`);
    }

    return response.json();
  }

  // Health check
  async checkHealth(): Promise<{ ok: boolean; error?: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/ok`);
      if (response.ok) {
        const data = await response.json();
        return { ok: data.ok || false };
      }
      return { ok: false, error: `Status ${response.status}` };
    } catch (error: any) {
      return { ok: false, error: error.message };
    }
  }

  // Get server info
  async getInfo(): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/info`);
      if (response.ok) {
        return await response.json();
      }
      return null;
    } catch (error) {
      console.error('Failed to get server info:', error);
      return null;
    }
  }

  // Cancel current stream
  cancel() {
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }
  }
}

export const orchestratorV2 = new OrchestratorAPIV2();