import React from 'react';
import { Trophy } from 'lucide-react';

const PointsCounter = ({ points }) => {
  return (
    <div className="flex items-center text-green-600">
      <Trophy className="w-4 h-4 mr-1" />
      <span className="text-sm font-semibold">{points} points</span>
    </div>
  );
};

export default PointsCounter;