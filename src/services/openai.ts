interface AgentConfig {
  name: string;
  role: string;
  tools: string[];
  capabilities: string[];
  context?: any;
}

interface OnboardingContext {
  userRequest: string;
  agentConfig?: AgentConfig;
  currentPhase: OnboardingPhase;
  collectedInfo: Record<string, any>;
}

const OnboardingPhase = {
  INITIAL_REQUEST: 'INITIAL_REQUEST',
  INTRODUCTION: 'INTRODUCTION',
  WORKSPACE_SETUP: 'WORKSPACE_SETUP',
  TOOL_DISCOVERY: 'TOOL_DISCOVERY',
  ACCESS_REQUEST: 'ACCESS_REQUEST',
  TEAM_CONTEXT: 'TEAM_CONTEXT',
  FINAL_CONFIRMATION: 'FINAL_CONFIRMATION'
} as const;

type OnboardingPhase = typeof OnboardingPhase[keyof typeof OnboardingPhase];

const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY;

export async function analyzeInitialRequest(userInput: string): Promise<AgentConfig> {
  const prompt = `Analyze this request for an AI employee and generate a configuration.
  
Request: "${userInput}"

Extract and return a JSON object with:
1. name: A professional sounding full name appropriate for the role
2. role: The job title (e.g., "Project Manager", "Customer Support Lead", "Sales Representative", "DevOps Engineer", "Data Analyst")
3. tools: Array of required tools from ["computer", "phone", "email", "slack", "linear", "jira", "github", "calendar", "intercom", "salesforce", "gmail", "aws", "docker", "kubernetes", "tableau", "excel"]
4. capabilities: Array of 5-7 key capabilities this role needs (be comprehensive and specific)

Be specific and realistic. Choose tools that make sense for the role. For example:
- Project Manager: linear, slack, calendar, email, github
- Customer Support: intercom, phone, email, slack, knowledge base
- DevOps Engineer: aws, docker, kubernetes, github, slack
- Sales Rep: salesforce, phone, email, calendar, slack`;

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [
          { role: 'system', content: 'You are an AI that analyzes requests and generates employee configurations. Always respond with valid JSON only.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        response_format: { type: "json_object" }
      })
    });

    const data = await response.json();
    return JSON.parse(data.choices[0].message.content);
  } catch (error) {
    console.error('OpenAI API error:', error);
    // Fallback configuration
    return {
      name: "Alex Chen",
      role: "Project Manager",
      tools: ["computer", "slack", "linear", "calendar"],
      capabilities: ["Project planning", "Team coordination", "Sprint management", "Status reporting"]
    };
  }
}

export async function getOnboardingResponse(context: OnboardingContext): Promise<string> {
  const phasePrompts: Record<OnboardingPhase, string> = {
    [OnboardingPhase.INITIAL_REQUEST]: '',
    [OnboardingPhase.INTRODUCTION]: `You are ${context.agentConfig?.name}, a new ${context.agentConfig?.role}. 
      Introduce yourself in first person, mention you're setting up your workspace, and be warm but professional. 
      Keep it to 2-3 sentences. Mention you'll need a moment to set up your computer.`,
    
    [OnboardingPhase.WORKSPACE_SETUP]: `You are ${context.agentConfig?.name}. Your computer is now ready. 
      Express that your workspace is set up and you're ready to learn about the tools the team uses. 
      Ask specifically about project management or relevant tools for your role. Be conversational.`,
    
    [OnboardingPhase.TOOL_DISCOVERY]: `You are ${context.agentConfig?.name}. 
      The user mentioned they use ${context.collectedInfo.primaryTool}. 
      Express familiarity with it and ask for authorization to connect. 
      Mention you'll need access to get started. Keep it brief and action-oriented.`,
    
    [OnboardingPhase.ACCESS_REQUEST]: `You are ${context.agentConfig?.name}. 
      You now have access to ${context.collectedInfo.primaryTool}. 
      Express what you can see or notice (make it realistic), and ask about team size or structure.
      Show you're getting oriented.`,
    
    [OnboardingPhase.TEAM_CONTEXT]: `You are ${context.agentConfig?.name}. 
      You now know there are ${context.collectedInfo.teamSize} team members. 
      Ask one more specific question about workflow or process that's relevant to your role.
      Show you're thinking about how to best support the team.`,
    
    [OnboardingPhase.FINAL_CONFIRMATION]: `You are ${context.agentConfig?.name}. 
      Summarize what you've learned and express readiness to start. 
      Mention 1-2 specific things you'll focus on based on what you've learned.
      Be confident and eager to begin.`
  };

  const systemPrompt = `You are an AI employee onboarding yourself. 
    Speak in first person, be professional yet friendly. 
    Keep responses concise (2-3 sentences max). 
    Never break character or mention you're an AI.`;

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: phasePrompts[context.currentPhase] }
        ],
        temperature: 0.8,
        max_tokens: 150
      })
    });

    const data = await response.json();
    return data.choices[0].message.content;
  } catch (error) {
    console.error('OpenAI API error:', error);
    // Fallback responses
    const fallbacks: Record<OnboardingPhase, string> = {
      [OnboardingPhase.INITIAL_REQUEST]: '',
      [OnboardingPhase.INTRODUCTION]: `Hi! I'm ${context.agentConfig?.name}, your new ${context.agentConfig?.role}. Let me get my workspace set up and I'll walk you through what I need to get started.`,
      [OnboardingPhase.WORKSPACE_SETUP]: "Perfect, my workspace is ready! What project management tools does your team use? I can work with Linear, Jira, Asana, or others.",
      [OnboardingPhase.TOOL_DISCOVERY]: "Great, I'm familiar with that tool. I'll need you to authorize my access so I can get connected to your workspace.",
      [OnboardingPhase.ACCESS_REQUEST]: "Excellent, I'm connected! I can see your workspace now. How many people are on the team I'll be working with?",
      [OnboardingPhase.TEAM_CONTEXT]: "Got it. One more thing - what's your typical workflow? Do you work in sprints or more continuous flow?",
      [OnboardingPhase.FINAL_CONFIRMATION]: "Perfect! I'm all set up and ready to start. I'll focus on keeping your projects organized and ensuring smooth communication across the team."
    };
    return fallbacks[context.currentPhase];
  }
}

export async function processUserResponse(userInput: string, context: OnboardingContext): Promise<{
  extractedInfo: Record<string, any>;
  nextPhase: OnboardingPhase;
}> {
  const prompt = `Given this onboarding context and user response, extract relevant information.
  
Current phase: ${context.currentPhase}
User response: "${userInput}"
Current context: ${JSON.stringify(context.collectedInfo)}

Extract any relevant information like:
- Tool names (Linear, Jira, Slack, etc.)
- Team size (numbers)
- Workflow type (Agile, Scrum, Kanban, etc.)
- Company name
- Any other relevant details

Return JSON with:
- extractedInfo: object with extracted data
- suggestedNextPhase: the next logical phase`;

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [
          { role: 'system', content: 'Extract information from user responses during onboarding. Respond with valid JSON only.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.3,
        response_format: { type: "json_object" }
      })
    });

    const data = await response.json();
    const result = JSON.parse(data.choices[0].message.content);
    
    // Map suggested phase to enum
    const phaseMap: Record<string, OnboardingPhase> = {
      'WORKSPACE_SETUP': OnboardingPhase.WORKSPACE_SETUP,
      'TOOL_DISCOVERY': OnboardingPhase.TOOL_DISCOVERY,
      'ACCESS_REQUEST': OnboardingPhase.ACCESS_REQUEST,
      'TEAM_CONTEXT': OnboardingPhase.TEAM_CONTEXT,
      'FINAL_CONFIRMATION': OnboardingPhase.FINAL_CONFIRMATION
    };
    
    return {
      extractedInfo: result.extractedInfo || {},
      nextPhase: phaseMap[result.suggestedNextPhase] || getNextPhase(context.currentPhase)
    };
  } catch (error) {
    console.error('OpenAI API error:', error);
    return {
      extractedInfo: {},
      nextPhase: getNextPhase(context.currentPhase)
    };
  }
}

function getNextPhase(currentPhase: OnboardingPhase): OnboardingPhase {
  const phaseOrder = [
    OnboardingPhase.INITIAL_REQUEST,
    OnboardingPhase.INTRODUCTION,
    OnboardingPhase.WORKSPACE_SETUP,
    OnboardingPhase.TOOL_DISCOVERY,
    OnboardingPhase.ACCESS_REQUEST,
    OnboardingPhase.TEAM_CONTEXT,
    OnboardingPhase.FINAL_CONFIRMATION
  ];
  
  const currentIndex = phaseOrder.indexOf(currentPhase);
  return phaseOrder[Math.min(currentIndex + 1, phaseOrder.length - 1)];
}