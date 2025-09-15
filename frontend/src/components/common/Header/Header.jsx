import React from 'react';
import PointsCounter from '../PointsCounter/PointsCounter';

const Header = ({ title, subtitle, points }) => {
  return (
    <div className="bg-gradient-to-r from-green-600 via-white to-red-600 p-1 rounded-lg">
      <div className="bg-white p-4 rounded-lg text-center">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">{title}</h1>
        <p className="text-gray-600">{subtitle}</p>
        <div className="flex items-center justify-center gap-4 mt-2">
          <p className="text-sm text-gray-500">Made in Gaza 🇵🇸</p>
          <PointsCounter points={points} />
        </div>
      </div>
    </div>
  );
};

export default Header;