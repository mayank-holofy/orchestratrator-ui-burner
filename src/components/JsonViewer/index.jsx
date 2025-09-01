import React from 'react';
import './index.css';

const JsonViewer = ({ data }) => {
  const renderJson = (obj) => {
    if (typeof obj === 'string') {
      // Split string by \n and render each line separately
      const lines = obj.split('\\n');
      return (
        <div className="json-value">
          {lines.map((line, i) => (
            <div key={i}>{line}</div>
          ))}
        </div>
      );
    }

    if (typeof obj !== 'object' || obj === null) {
      return <div className="json-value">{String(obj)}</div>;
    }

    if (Array.isArray(obj)) {
      return (
        <div className="json-array">
          {obj.map((item, index) => (
            <div key={index}>{renderJson(item)}</div>
          ))}
        </div>
      );
    }

    return (
      <div className="json-object">
        {Object.entries(obj).map(([key, value], index) => (
          <div key={index} className="json-pair">
            <div className="json-key">{key} : </div>
            {renderJson(value)}
          </div>
        ))}
      </div>
    );
  };

  return <div className="json-viewer">{renderJson(data)}</div>;
};

export default JsonViewer;
