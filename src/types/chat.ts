export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  isThinking?: boolean;
  thinkingSteps?: ThinkingStep[];
  actions?: AIAction[];
  status?: 'pending' | 'streaming' | 'complete' | 'error';
  metadata?: {
    model?: string;
    tokens?: number;
    responseTime?: number;
  };
}

export interface ThinkingStep {
  id: string;
  text: string;
  duration: number;
  type: 'analysis' | 'planning' | 'reasoning' | 'execution';
}

export interface AIAction {
  id: string;
  type: 'web_search' | 'calculation' | 'code_execution' | 'file_operation' | 'api_call';
  description: string;
  status: 'pending' | 'running' | 'complete' | 'failed';
  result?: any;
  timestamp: Date;
}

export interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  createdAt: Date;
  updatedAt: Date;
  model: AIModel;
  capabilities: AICapability[];
}

export interface AIModel {
  id: string;
  name: string;
  provider: 'openai' | 'anthropic' | 'google' | 'mock';
  capabilities: AICapability[];
  maxTokens: number;
}

export type AICapability = 
  | 'text_generation'
  | 'code_generation'
  | 'web_browsing'
  | 'file_operations'
  | 'vision'
  | 'function_calling'
  | 'reasoning'
  | 'autonomous_actions';

export interface UserPreferences {
  theme: 'dark' | 'light' | 'auto';
  showThinkingProcess: boolean;
  streamResponses: boolean;
  autoSave: boolean;
  soundEnabled: boolean;
}