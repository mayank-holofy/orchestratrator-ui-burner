import React, { useState, useMemo, useCallback, memo } from 'react';
import {
  FiCheckCircle,
  FiAlertCircle,
  FiLoader,
  FiTerminal,
  FiChevronDown,
  FiChevronRight,
  FiCode,
  FiPlay,
} from 'react-icons/fi';
import './index.css';
import JsonViewer from '../JsonViewer/index.jsx';

const ToolCard = ({ name, id, args, result }) => {
  return (
    <div className="tool-call-box">
      <div className="tool-call-header">
        <div className="tool-title">Tool</div>
        <div className="tool-info">
          <div className="tool-details">
            <span className="tool-name">{name}</span>
            <span className="tool-id">{id}</span>
          </div>
        </div>
      </div>
      <div className="tool-call-content">
        {result ? (
          <div className="content-section">
            <div className="code-container">
              <pre className="code-block">
                <code>
                  {typeof result === 'string' ? (
                    <span className="string-result">{result}</span>
                  ) : (
                    JSON.stringify(result, null, 2)
                  )}
                </code>
              </pre>
            </div>
          </div>
        ) : (
          <>
            {args && Object.keys(args).length > 0 && (
              <div className="content-section">
                <div className="code-container">
                  <pre className="code-block">
                    {/* <code>{JSON.stringify(args, null, 2)}</code> */}
                    <code>
                      <JsonViewer data={args} />
                    </code>
                  </pre>
                </div>
              </div>
            )}
          </>
        )}
      </div>
      <div className="tool-call-footer"></div>
    </div>
  );
};

const ToolCallBox = memo(({ toolCall }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const { name, args, result, status } = useMemo(() => {
    const toolName = toolCall.name || 'Unknown Tool';
    const toolArgs = toolCall.args || '{}';
    let parsedArgs = {};
    try {
      parsedArgs =
        typeof toolArgs === 'string' ? JSON.parse(toolArgs) : toolArgs;
    } catch {
      parsedArgs = { raw: toolArgs };
    }
    const toolResult = toolCall.result || null;
    const toolStatus = toolCall.status || 'completed';

    return {
      name: toolName,
      args: parsedArgs,
      result: toolResult,
      status: toolStatus,
    };
  }, [toolCall]);

  const statusIcon = useMemo(() => {
    switch (status) {
      case 'completed':
        return <FiCheckCircle className="status-icon success" />;
      case 'error':
        return <FiAlertCircle className="status-icon error" />;
      case 'pending':
        return <FiLoader className="status-icon pending spinning" />;
      default:
        return <FiTerminal className="status-icon default" />;
    }
  }, [status]);

  const toggleExpanded = useCallback(() => {
    setIsExpanded((prev) => !prev);
  }, []);

  const hasContent = result || Object.keys(args).length > 0;


  return (
    <>
      <ToolCard name={name} id={toolCall.id} args={args} />
      <ToolCard name={name} id={toolCall.id} result={result} />
    </>
  );
});

export default ToolCallBox;
