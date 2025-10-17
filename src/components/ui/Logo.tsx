import React from 'react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const Logo: React.FC<LogoProps> = ({ size = 'md', className = '' }) => {
  const sizeClasses = {
    sm: {
      icon: 'text-lg',
      text: 'text-lg md:text-xl',
    },
    md: {
      icon: 'text-xl',
      text: 'text-xl md:text-2xl',
    },
    lg: {
      icon: 'text-2xl',
      text: 'text-2xl md:text-3xl',
    },
  };

  const { icon, text } = sizeClasses[size];

  return (
    <div className={`flex items-center space-x-3 group ${className}`}>
      <span className={`${icon}`} aria-hidden="true">
        ✨
      </span>
      <h1
        className={`font-mono ${text} font-semibold bg-gradient-to-r from-blue-400 to-teal-400 bg-clip-text text-transparent group-hover:from-teal-400 group-hover:to-purple-400 transition-colors duration-300`}
      >
        10xRules.ai
      </h1>
    </div>
  );
};

export default Logo;
