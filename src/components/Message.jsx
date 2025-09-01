import { motion, AnimatePresence } from 'framer-motion';
import { memo, useMemo, useEffect } from 'react';
import { extractStringFromMessageContent } from '../utils/orchestratoreChat';
import ToolCallBox from './ToolCallBox/index.jsx';

const Message = memo(
  ({
    message,
    toolCalls,
    showAvatar,
    onSelectSubAgent,
    selectedSubAgent,
    index,
  }) => {
    const isUser = message.type === 'human';
    const messageContent = extractStringFromMessageContent(message);
    const hasContent = messageContent && messageContent.trim() !== '';
    const hasToolCalls = toolCalls.length > 0;
    const subAgents = useMemo(() => {
      return toolCalls
        .filter((toolCall) => {
          return (
            toolCall.name === 'task' &&
            toolCall.args['subagent_type'] &&
            toolCall.args['subagent_type'] !== '' &&
            toolCall.args['subagent_type'] !== null
          );
        })
        .map((toolCall) => {
          return {
            id: toolCall.id,
            name: toolCall.name,
            subAgentName: toolCall.args['subagent_type'],
            input: toolCall.args['description'],
            output: toolCall.result,
            status: toolCall.status,
          };
        });
    }, [toolCalls]);

    const subAgentsString = useMemo(() => {
      return JSON.stringify(subAgents);
    }, [subAgents]);

    useEffect(() => {
      if (subAgents.some((subAgent) => subAgent.id === selectedSubAgent?.id)) {
        onSelectSubAgent(
          subAgents.find((subAgent) => subAgent.id === selectedSubAgent?.id)
        );
      }
    }, [selectedSubAgent, onSelectSubAgent, subAgentsString]);

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.1 }}
        className={`mb-6 flex ${
          message.type === 'human' ? 'justify-end' : 'justify-start'
        }`}
      >
        <div className="max-w-[70%]">
          {hasContent && (
            <div
              className={`px-4 py-3 rounded-2xl ${
                message.type === 'human'
                  ? 'bg-white text-black'
                  : 'bg-[#1a1a1a] text-white border border-gray-800'
              }`}
            >
              <p className="text-[15px]">{messageContent}</p>
            </div>
          )}
          {/* <div
            className={`mt-1 text-[11px] text-gray-500 ${
                message.type === 'human' ? 'text-right' : 'text-left'
            }`}
          >
            {msg.timestamp.toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </div> */}
          {hasToolCalls && (
            <div className="toolCalls">
              {toolCalls.map((toolCall) => {
                if (toolCall.name === 'task') return null;
                return <ToolCallBox key={toolCall.id} toolCall={toolCall} />;
              })}
            </div>
          )}
          {!isUser && subAgents.length > 0 && (
            <div className="subAgents">
              {subAgents.map((subAgent) => (
                <SubAgentIndicator
                  key={subAgent.id}
                  subAgent={subAgent}
                  onClick={() => onSelectSubAgent(subAgent)}
                />
              ))}
            </div>
          )}
        </div>
      </motion.div>
    );
  }
);

export default Message;
