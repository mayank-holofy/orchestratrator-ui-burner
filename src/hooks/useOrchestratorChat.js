import { useCallback, useMemo, useEffect } from 'react';
import { useStream } from '@langchain/langgraph-sdk/react';
import { v4 as uuidv4 } from 'uuid';
import { getDeployment } from '../lib/environment/deployments';
import { createClient } from '../lib/client';
import { useAuthContext } from '../providers/Auth';

export function useOrchestratorChat(
  threadId,
  setThreadId
  // onTodosUpdate,
  // onFilesUpdate
) {
  const deployment = useMemo(() => getDeployment(), []);
  const { session } = useAuthContext();
  const accessToken = session?.accessToken;

  const agentId = useMemo(() => {
    if (!deployment?.agentId) {
      throw new Error(`No agent ID configured in environment`);
    }
    return deployment.agentId;
  }, [deployment]);

  const handleUpdateEvent = useCallback(
    (data) => {
      Object.entries(data).forEach(([_, nodeData]) => {
        if (nodeData?.todos) {
          // onTodosUpdate(nodeData.todos);
        }
        if (nodeData?.files) {
          // onFilesUpdate?.(nodeData.files);
        }
      });
    },
    // [onTodosUpdate, onFilesUpdate]
    []
  );

  const stream = useStream({
    assistantId: agentId,
    client: createClient(accessToken || ''),
    reconnectOnMount: true,
    threadId: threadId || undefined,
    onUpdateEvent: handleUpdateEvent,
    onThreadId: setThreadId,
    defaultHeaders: {
      'x-auth-scheme': 'langsmith',
    },
    onError: async (err) => {
      throw new Error(err);
      // if (err?.includes('404')) {
      //   const client = createClient(accessToken);
      //   const thread = await client.threads.create();
      //   setThreadId(thread.thread_id);
      // }
    },
  });

  const sendMessage = useCallback(
    (message) => {
      const humanMessage = {
        id: uuidv4(),
        type: 'human',
        content: message,
      };
      stream.submit(
        { messages: [humanMessage] },
        {
          optimisticValues(prev) {
            const prevMessages = prev.messages ?? [];
            const newMessages = [...prevMessages, humanMessage];
            return { ...prev, messages: newMessages };
          },
          config: {
            recursion_limit: 100,
          },
        }
      );
    },
    [stream]
  );

  const stopStream = useCallback(() => {
    try {
      stream.stop();
    } catch (e) {
      console.warn('Failed to cancel run:', e);
    }
  }, [stream]);

  // Reset stream when threadId changes to prevent stale isLoading state
  useEffect(() => {
    if (stream?.stop) {
      stream.stop();
    }
  }, [threadId]);

  return {
    messages: stream.messages,
    isLoading: stream.isLoading,
    sendMessage,
    stopStream,
  };
}
