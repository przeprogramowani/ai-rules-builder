import React, { type ReactNode, useState } from 'react';

interface TooltipProps {
  content: string | ReactNode;
  children: ReactNode;
}

export default function Tooltip({ content, children }: TooltipProps) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative inline-block"
         onMouseEnter={() => setVisible(true)}
         onMouseLeave={() => setVisible(false)}>

      {children}

      {visible && (
        <div
          className="absolute top-full mt-2 left-1/2 transform -translate-x-1/2 whitespace-nowrap rounded bg-gray-700 text-white text-xs py-1 px-2 z-50 shadow-lg">
          {content}
          <div
            className="absolute -top-1 left-1/2 -translate-x-1/2 w-0 h-0 border-l-4 border-l-transparent border-r-4 border-r-transparent border-b-4 border-b-gray-700" />
        </div>
      )}
    </div>
  );
}
