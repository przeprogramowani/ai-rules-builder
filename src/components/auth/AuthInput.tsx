import React, { useEffect, useRef } from 'react';
import { transitions } from '../../styles/theme';

interface AuthInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  onAutofill?: (value: string) => void;
}

const AuthInput = React.forwardRef<HTMLInputElement, AuthInputProps>(
  ({ label, error, id, onAutofill, ...inputProps }, ref) => {
    const internalRef = useRef<HTMLInputElement | null>(null);
    const lastValueRef = useRef<string>('');
    const autofillDetectedRef = useRef<boolean>(false);

    // Combine external and internal refs
    const setRefs = (element: HTMLInputElement | null) => {
      internalRef.current = element;
      if (typeof ref === 'function') {
        ref(element);
      } else if (ref) {
        ref.current = element;
      }
    };

    // Centralized autofill check logic
    const checkAndTriggerAutofill = (input: HTMLInputElement) => {
      if (!input.value || autofillDetectedRef.current || !onAutofill) return false;

      const isAutofilled =
        input.matches(':-webkit-autofill') ||
        input.hasAttribute('data-com-onepassword-filled') ||
        input.hasAttribute('data-lastpass-icon-root') ||
        input.hasAttribute('data-dashlane-uid') ||
        input.hasAttribute('data-bwautofill') || // Bitwarden
        (input.value !== lastValueRef.current && input.value.length > 0);

      if (isAutofilled && input.value !== lastValueRef.current) {
        autofillDetectedRef.current = true;
        lastValueRef.current = input.value;
        onAutofill(input.value);
        return true;
      }

      return false;
    };

    // Method 1: CSS animation detection (works for 1Password, Chrome autofill)
    const handleAnimationStart = (e: React.AnimationEvent<HTMLInputElement>) => {
      if (e.animationName === 'onAutoFillStart') {
        checkAndTriggerAutofill(e.currentTarget);
      }
    };

    // Method 2: Input event listener (works for most password managers)
    const handleInput = (e: React.FormEvent<HTMLInputElement>) => {
      const value = e.currentTarget.value;
      if (!value) {
        autofillDetectedRef.current = false;
      }
      lastValueRef.current = value;
      checkAndTriggerAutofill(e.currentTarget);
    };

    // Method 3: Change event listener
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      if (!value) {
        autofillDetectedRef.current = false;
      }
      lastValueRef.current = value;
      checkAndTriggerAutofill(e.target);

      if (inputProps.onChange) {
        inputProps.onChange(e);
      }
    };

    // Method 4: Focus event (LastPass often autofills on focus)
    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
      // Update ref before checking
      lastValueRef.current = e.target.value;
      // Check immediately on focus
      checkAndTriggerAutofill(e.target);

      // Also check a few times rapidly after focus
      const rafIds: number[] = [];
      let frameCount = 0;
      const maxFrames = 10; // Check for ~160ms at 60fps

      const checkOnFrame = () => {
        if (frameCount++ < maxFrames && !autofillDetectedRef.current) {
          if (internalRef.current) {
            checkAndTriggerAutofill(internalRef.current);
          }
          rafIds.push(requestAnimationFrame(checkOnFrame));
        }
      };

      rafIds.push(requestAnimationFrame(checkOnFrame));

      if (inputProps.onFocus) {
        inputProps.onFocus(e);
      }
    };

    // Method 5: Blur event (some password managers autofill on blur)
    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      lastValueRef.current = e.target.value;
      checkAndTriggerAutofill(e.target);

      if (inputProps.onBlur) {
        inputProps.onBlur(e);
      }
    };

    // Method 6: Aggressive early detection
    useEffect(() => {
      if (!internalRef.current || !onAutofill) return;

      const input = internalRef.current;
      const rafIds: number[] = [];
      const timers: ReturnType<typeof setTimeout>[] = [];

      // Immediate check
      checkAndTriggerAutofill(input);

      // Use requestAnimationFrame for ultra-fast checking (runs every ~16ms at 60fps)
      let frameCount = 0;
      const maxFrames = 30; // Check for ~500ms at 60fps

      const checkOnAnimationFrame = () => {
        if (frameCount++ < maxFrames && !autofillDetectedRef.current) {
          if (internalRef.current) {
            checkAndTriggerAutofill(internalRef.current);
          }
          rafIds.push(requestAnimationFrame(checkOnAnimationFrame));
        }
      };

      rafIds.push(requestAnimationFrame(checkOnAnimationFrame));

      // Backup setTimeout checks at strategic intervals
      const timeoutIntervals = [50, 150, 300, 500, 800, 1200, 2000];
      timeoutIntervals.forEach((delay) => {
        timers.push(
          setTimeout(() => {
            if (internalRef.current && !autofillDetectedRef.current) {
              checkAndTriggerAutofill(internalRef.current);
            }
          }, delay),
        );
      });

      // Method 7: MutationObserver for direct DOM changes
      const observer = new MutationObserver(() => {
        if (internalRef.current) {
          checkAndTriggerAutofill(internalRef.current);
        }
      });

      observer.observe(input, {
        attributes: true,
        attributeFilter: [
          'value',
          'data-com-onepassword-filled',
          'data-lastpass-icon-root',
          'data-dashlane-uid',
          'data-bwautofill',
        ],
      });

      // Method 8: Check on page visibility change (user returns to tab)
      const handleVisibilityChange = () => {
        if (document.visibilityState === 'visible' && internalRef.current) {
          checkAndTriggerAutofill(internalRef.current);
        }
      };

      document.addEventListener('visibilitychange', handleVisibilityChange);

      return () => {
        rafIds.forEach((id) => cancelAnimationFrame(id));
        timers.forEach(clearTimeout);
        observer.disconnect();
        document.removeEventListener('visibilitychange', handleVisibilityChange);
      };
    }, [onAutofill]);

    return (
      <div className="space-y-1">
        <label className="block text-sm font-medium text-gray-300" htmlFor={id}>
          {label}
        </label>
        <input
          id={id}
          ref={setRefs}
          {...inputProps}
          onAnimationStart={handleAnimationStart}
          onInput={handleInput}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
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
