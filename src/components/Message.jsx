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
    const isToolResult = message.type === 'tool';
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
                  : isToolResult
                  ? 'bg-green-950/30 text-green-100 border border-green-500/30'
                  : 'bg-[#1a1a1a] text-white border border-gray-800'
              }`}
            >
              <div 
                className="text-[15px] prose prose-invert max-w-none"
                dangerouslySetInnerHTML={{
                  __html: messageContent
                    // Basic markdown formatting
                    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')  // Bold
                    .replace(/\*(.*?)\*/g, '<em>$1</em>')              // Italic
                    .replace(/^### (.*$)/gm, '<h3 class="text-lg font-semibold mt-4 mb-2">$1</h3>')  // H3
                    .replace(/^## (.*$)/gm, '<h2 class="text-xl font-semibold mt-4 mb-2">$1</h2>')   // H2
                    .replace(/^# (.*$)/gm, '<h1 class="text-2xl font-bold mt-4 mb-2">$1</h1>')      // H1
                    .replace(/^- (.*$)/gm, '<li class="ml-4">• $1</li>')                           // Bullet points
                    .replace(/^(\d+)\. (.*$)/gm, '<li class="ml-4">$1. $2</li>')                  // Numbered lists
                    .replace(/`([^`]+)`/g, '<code class="bg-gray-700 px-1 rounded">$1</code>')     // Inline code
                    .replace(/\n/g, '<br>')                                                        // Line breaks
                }}
              />
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
            <div className="toolCalls mt-3 space-y-2">
              {toolCalls.map((toolCall) => {
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
