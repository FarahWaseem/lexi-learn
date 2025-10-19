import React from 'react';
import { Loader2 } from 'lucide-react';

const LoadingSpinner = ({ message = "Loading..." }) => {
  return (
    <div className="p-4 text-center">
      <Loader2 className="w-8 h-8 mx-auto animate-spin mb-2" />
      <p>{message}</p>
    </div>
  );
};

export default LoadingSpinner;