import React from 'react';
import { transitions } from '../../styles/theme';

interface AuthInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  onAutofill?: (value: string) => void;
}

const AuthInput = React.forwardRef<HTMLInputElement, AuthInputProps>(
  ({ label, error, id, onAutofill, ...inputProps }, ref) => {
    const handleAnimationStart = (e: React.AnimationEvent<HTMLInputElement>) => {
      // Detect autofill via CSS animation
      if (e.animationName === 'onAutoFillStart') {
        const input = e.currentTarget;
        if (onAutofill && input.value) {
          onAutofill(input.value);
        }
      }
    };

    return (
      <div className="space-y-1">
        <label className="block text-sm font-medium text-gray-300" htmlFor={id}>
          {label}
        </label>
        <input
          id={id}
          ref={ref}
          {...inputProps}
          onAnimationStart={handleAnimationStart}
          data-testid={`auth-input-${id}`}
          className={`
            w-full px-3 py-2 bg-gray-800/50 border rounded-md
            text-gray-200 placeholder-gray-500
            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
            transition-colors duration-${transitions.duration.medium} ${transitions.timing.default}
            ${error ? 'border-red-500' : 'border-gray-700'}
            autofill-detect
          `}
        />
        {error && <p className="text-sm text-red-500 mt-1">{error}</p>}
        <style>{`
          @keyframes onAutoFillStart {
            from { opacity: 0.99; }
            to { opacity: 1; }
          }
          input.autofill-detect:-webkit-autofill {
            animation-name: onAutoFillStart;
            animation-duration: 0.001s;
          }
        `}</style>
      </div>
    );
  },
);
AuthInput.displayName = 'AuthInput';
export default AuthInput;
