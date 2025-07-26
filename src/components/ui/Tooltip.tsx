import React, { useState, useRef, useLayoutEffect, type ReactNode } from 'react';

interface TooltipProps {
  content: string;
  children: ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
  delay?: number;
  className?: string;
}

export const Tooltip: React.FC<TooltipProps> = ({
  content,
  children,
  position = 'top',
  delay = 300,
  className = '',
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [actualPosition, setActualPosition] = useState(position);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hideTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (tooltipRef.current && containerRef.current) {
      const tooltip = tooltipRef.current;
      const container = containerRef.current;
      const tooltipRect = tooltip.getBoundingClientRect();
      const containerRect = container.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      let newPosition = position;

      // Check if tooltip is out of the right edge of the screen
      if (containerRect.left + tooltipRect.width / 2 > viewportWidth - 64) {
        if (position === 'top' || position === 'bottom') {
          newPosition = 'left';
        }
      }

      // Check if tooltip is out of the left edge of the screen
      if (containerRect.left - tooltipRect.width / 2 < 64) {
        if (position === 'top' || position === 'bottom') {
          newPosition = 'right';
        }
      }

      // Check if tooltip is out of the top edge of the screen
      if (containerRect.top - tooltipRect.height < 64) {
        if (position === 'top') {
          newPosition = 'bottom';
        }
      }

      // Check if tooltip is out of the bottom edge of the screen
      if (containerRect.bottom + tooltipRect.height > viewportHeight - 64) {
        if (position === 'bottom') {
          newPosition = 'top';
        }
      }

      setActualPosition(newPosition);
    }
  }, [position]);

  const handleMouseEnter = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      setIsVisible(true);

      // Auto-hide after 1.5 second of showing
      hideTimeoutRef.current = setTimeout(() => {
        setIsVisible(false);
      }, 1500);
    }, delay);
  };

  const handleMouseLeave = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
    }
    setIsVisible(false);
  };

  const getTooltipPosition = () => {
    const baseClasses =
      'absolute z-50 px-2 py-1 text-xs text-white bg-gray-900 border border-gray-600 rounded shadow-lg whitespace-nowrap pointer-events-none';

    switch (actualPosition) {
      case 'top':
        return `${baseClasses} bottom-full left-1/2 transform -translate-x-1/2 mb-2`;
      case 'bottom':
        return `${baseClasses} top-full left-1/2 transform -translate-x-1/2 mt-2`;
      case 'left':
        return `${baseClasses} right-full top-1/2 transform -translate-y-1/2 mr-2`;
      case 'right':
        return `${baseClasses} left-full top-1/2 transform -translate-y-1/2 ml-2`;
      default:
        return `${baseClasses} bottom-full left-1/2 transform -translate-x-1/2 mb-2`;
    }
  };

  const getArrowClasses = () => {
    const arrowBase = 'absolute w-2 h-2 bg-gray-900 border border-gray-600 transform -rotate-45';

    switch (actualPosition) {
      case 'top':
        return `${arrowBase} border-t-0 border-r-0 top-full left-1/2 -translate-x-1/2 -translate-y-1/2`;
      case 'bottom':
        return `${arrowBase} border-b-0 border-l-0 bottom-full left-1/2 -translate-x-1/2 translate-y-1/2`;
      case 'left':
        return `${arrowBase} border-l-0 border-t-0 left-full top-1/2 -translate-x-1/2 -translate-y-1/2`;
      case 'right':
        return `${arrowBase} border-r-0 border-b-0 right-full top-1/2 translate-x-1/2 -translate-y-1/2`;
      default:
        return `${arrowBase} border-t-0 border-r-0 top-full left-1/2 -translate-x-1/2 -translate-y-1/2`;
    }
  };

  return (
    <div
      ref={containerRef}
      className={`relative inline-block ${className}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {children}
      <div
        ref={tooltipRef}
        className={`${getTooltipPosition()} transition-opacity duration-200 ${
          isVisible ? 'opacity-100' : 'opacity-0'
        }`}
        role="tooltip"
        style={{ visibility: isVisible ? 'visible' : 'hidden' }}
      >
        {content}
        <div className={getArrowClasses()} />
      </div>
    </div>
  );
};

export default Tooltip;
