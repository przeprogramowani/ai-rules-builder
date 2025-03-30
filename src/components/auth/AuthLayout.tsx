import React from 'react';

interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
}

export const AuthLayout: React.FC<AuthLayoutProps> = ({ children, title, subtitle }) => {
  return (
    <div className="flex items-center justify-center min-h-full w-full py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-white">{title}</h2>
          {subtitle && <p className="mt-2 text-sm text-gray-400">{subtitle}</p>}
        </div>
        <div className="mt-8 bg-gray-900/90 py-8 px-4 shadow-lg rounded-lg border border-gray-800">
          {children}
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;
