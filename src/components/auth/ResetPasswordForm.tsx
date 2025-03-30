import React, { useState } from 'react';
import { transitions } from '../../styles/theme';
import AuthInput from './AuthInput';

interface ResetPasswordFormProps {
  onSubmit: (email: string) => void;
}

export const ResetPasswordForm: React.FC<ResetPasswordFormProps> = ({ onSubmit }) => {
  const [email, setEmail] = useState('');
  const [errors, setErrors] = useState<{ email?: string }>({});
  const [isSubmitted, setIsSubmitted] = useState(false);

  const validateForm = () => {
    const newErrors: { email?: string } = {};

    if (!email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Invalid email format';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      onSubmit(email);
      setIsSubmitted(true);
    }
  };

  if (isSubmitted) {
    return (
      <div className="text-center space-y-4">
        <div className="text-green-400">
          If an account exists for {email}, you will receive password reset instructions.
        </div>
        <a
          href="/auth/login"
          className={`
            inline-block text-blue-400 hover:text-blue-300
            transition-colors duration-${transitions.duration.medium}
          `}
        >
          Return to login
        </a>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="text-sm text-gray-400 mb-4">
        Enter your email address and we'll send you instructions to reset your password.
      </div>

      <AuthInput
        id="email"
        label="Email address"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Enter your email"
        error={errors.email}
        autoComplete="email"
      />

      <button
        type="submit"
        className={`
          w-full flex justify-center py-2 px-4 border border-transparent rounded-md
          text-sm font-medium text-white bg-blue-600 hover:bg-blue-700
          focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
          transition-colors duration-${transitions.duration.medium} ${transitions.timing.default}
        `}
      >
        Send reset instructions
      </button>

      <div className="text-center text-sm">
        <a
          href="/auth/login"
          className="text-blue-400 hover:text-blue-300 transition-colors duration-${transitions.duration.medium}"
        >
          Back to login
        </a>
      </div>
    </form>
  );
};

export default ResetPasswordForm;
