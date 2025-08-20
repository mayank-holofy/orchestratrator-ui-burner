import { Message, ThinkingStep, AIAction } from '../types/chat';
import { v4 as uuidv4 } from 'uuid';

export const mockThinkingSteps: ThinkingStep[] = [
  {
    id: uuidv4(),
    text: "Analyzing user request and identifying key requirements...",
    duration: 1200,
    type: 'analysis'
  },
  {
    id: uuidv4(),
    text: "Searching knowledge base for relevant information...",
    duration: 800,
    type: 'reasoning'
  },
  {
    id: uuidv4(),
    text: "Formulating comprehensive response strategy...",
    duration: 1500,
    type: 'planning'
  },
  {
    id: uuidv4(),
    text: "Executing response generation with context awareness...",
    duration: 2000,
    type: 'execution'
  }
];

export const mockActions: AIAction[] = [
  {
    id: uuidv4(),
    type: 'web_search',
    description: 'Searching for latest information on the topic',
    status: 'complete',
    timestamp: new Date(),
    result: { sources: 5, relevance: 0.92 }
  },
  {
    id: uuidv4(),
    type: 'calculation',
    description: 'Processing numerical analysis',
    status: 'complete',
    timestamp: new Date(),
    result: { accuracy: 0.99 }
  }
];

export const mockResponses = [
  "I understand you're looking for assistance with that. Let me analyze the requirements and provide you with a comprehensive solution.",
  "Based on my analysis, I've identified several key aspects to consider. Let me break this down for you systematically.",
  "That's an interesting question. I'll need to process multiple data points to give you the most accurate response.",
  "I've completed the analysis. Here's what I found based on the available information and current best practices.",
  "Let me help you with that. I'm accessing relevant resources and formulating an optimal approach."
];

export const generateMockResponse = async (
  userMessage: string,
  onThinkingUpdate?: (step: ThinkingStep) => void,
  onActionUpdate?: (action: AIAction) => void
): Promise<string> => {
  // Simulate thinking process
  for (const step of mockThinkingSteps) {
    if (onThinkingUpdate) {
      onThinkingUpdate(step);
    }
    await new Promise(resolve => setTimeout(resolve, step.duration));
  }

  // Simulate actions
  for (const action of mockActions) {
    if (onActionUpdate) {
      onActionUpdate(action);
    }
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  // Return a mock response
  const response = mockResponses[Math.floor(Math.random() * mockResponses.length)];
  
  // Add some context from the user message
  if (userMessage.toLowerCase().includes('code')) {
    return `${response}\n\nHere's a code example that demonstrates the solution:\n\n\`\`\`typescript\n// Example implementation\nfunction solve() {\n  return 'Solution implemented';\n}\n\`\`\``;
  } else if (userMessage.toLowerCase().includes('explain')) {
    return `${response}\n\n**Key Points:**\n1. First, consider the fundamental principles\n2. Then, apply the relevant methodology\n3. Finally, validate the results\n\nThis approach ensures comprehensive coverage of the topic.`;
  }
  
  return response;
};

export const streamMockResponse = async function* (text: string) {
  const words = text.split(' ');
  for (const word of words) {
    yield word + ' ';
    await new Promise(resolve => setTimeout(resolve, 50 + Math.random() * 100));
  }
};