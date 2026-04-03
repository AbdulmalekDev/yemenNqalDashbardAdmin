import React from 'react';
import { ROLE_LABELS, ROLE_COLORS } from './constants';

const RoleBadge = ({ role, className = '' }) => {
  const label = ROLE_LABELS[role] || ROLE_LABELS.default;
  const colorClass = ROLE_COLORS[role] || ROLE_COLORS.default;

  return (
    <span className={`${colorClass} ${className} px-2 py-1 rounded-full font-medium text-[10px]`}>
      {label}
    </span>
  );
};

export default RoleBadge;
