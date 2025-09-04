export const ORCHESTRATOR_PUBLIC_DEPLOYMENT_URL =
  'https://orchestrator.some1.ai';
export const ORCHESTRATOR_PUBLIC_AGENT_ID = 'bd9d7831-8cd0-52cf-b4ff-e0a75afee4f5';
export const ORCHESTRATOR_PUBLIC_LANGSMITH_API_KEY =
  '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';
export function getDeployment() {
  return {
    name: 'Some1-Orchestrator',
    deploymentUrl: ORCHESTRATOR_PUBLIC_DEPLOYMENT_URL,
    agentId: ORCHESTRATOR_PUBLIC_AGENT_ID,
  };
}
