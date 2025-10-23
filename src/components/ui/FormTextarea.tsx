import React from 'react';
import { transitions } from '../../styles/theme';

interface FormTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  error?: string;
}

const FormTextarea = React.forwardRef<HTMLTextAreaElement, FormTextareaProps>(
  ({ label, error, id, className = '', ...textareaProps }, ref) => {
    return (
      <div className="space-y-1">
        <label className="block text-sm font-medium text-gray-300" htmlFor={id}>
          {label}
        </label>
        <textarea
          id={id}
          ref={ref}
          {...textareaProps}
          className={`
            w-full px-3 py-2 bg-gray-800/50 border rounded-md
            text-gray-200 placeholder-gray-500
            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
            transition-colors duration-${transitions.duration.medium} ${transitions.timing.default}
            ${error ? 'border-red-500' : 'border-gray-700'}
            ${className}
          `}
        />
        {error && <p className="text-sm text-red-500 mt-1">{error}</p>}
      </div>
    );
  },
);
FormTextarea.displayName = 'FormTextarea';

export default FormTextarea;
