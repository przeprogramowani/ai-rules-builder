import React from 'react';

interface StatusBadgeProps {
  status: 'draft' | 'published';
  className?: string;
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className = '' }) => {
  const isDraft = status === 'draft';

  return (
    <span
      className={`
        inline-flex items-center px-2 py-1 rounded-full text-xs font-medium
        ${isDraft ? 'bg-gray-700 text-gray-300' : 'bg-green-900/50 text-green-300'}
        ${className}
      `}
    >
      {isDraft ? 'Draft' : 'Published'}
    </span>
  );
};

export default StatusBadge;
