import React from 'react';
import Logo from '../ui/Logo';

interface AuthLayoutProps {
  children: React.ReactNode;
  subtitle?: string;
}

export const AuthLayout: React.FC<AuthLayoutProps> = ({ children, subtitle }) => {
  return (
    <div className="flex items-center justify-center min-h-full w-full py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <a href="/" className="inline-block">
            <Logo size="lg" className="justify-center" />
          </a>
          {subtitle && <p className="mt-4 text-sm text-gray-400">{subtitle}</p>}
        </div>
        <div className="mt-8 bg-gray-900/90 py-8 px-4 shadow-lg rounded-lg border border-gray-800">
          {children}
          <div id="cf-captcha-container"></div>
        </div>
      </div>
      <script src="https://challenges.cloudflare.com/turnstile/v0/api.js" async defer></script>
    </div>
  );
};

export default AuthLayout;
