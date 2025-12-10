import React from 'react';
import { STATUS_COLORS } from '../../constants';

interface StatusBadgeProps {
  status: string;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md' }) => {
  const colorClass = STATUS_COLORS[status] || 'bg-gray-100 text-gray-700';
  const sizeClass = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs font-medium';
  
  return (
    <span className={`inline-flex items-center justify-center rounded-full border ${sizeClass} ${colorClass} capitalize`}>
      {status.replace('_', ' ').toLowerCase()}
    </span>
  );
};