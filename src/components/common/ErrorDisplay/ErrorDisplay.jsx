import React from 'react';

const ErrorDisplay = ({ error, onRetry }) => {
  return (
    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
      <h2 className="font-bold">Error</h2>
      <p>{error}</p>
      {onRetry && (
        <button 
          onClick={onRetry} 
          className="mt-2 bg-red-500 text-white px-4 py-2 rounded"
        >
          Retry
        </button>
      )}
    </div>
  );
};

export default ErrorDisplay;