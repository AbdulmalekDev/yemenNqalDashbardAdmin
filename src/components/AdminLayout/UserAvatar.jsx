import React from 'react';

const UserAvatar = ({ name, className = "" }) => {
  const initial = name?.charAt(0) || 'م';

  return (
    <div className={`w-8 h-8 bg-primary-700 rounded-full flex items-center justify-center ${className}`}>
      <span className="text-white text-sm font-semibold">
        {initial}
      </span>
    </div>
  );
};

export default UserAvatar;
