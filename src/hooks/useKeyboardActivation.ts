import { useCallback, useMemo } from 'react';
import type { KeyboardEvent as ReactKeyboardEvent } from 'react';

const DEFAULT_KEYS = ['Enter', ' '] as const;

type KeyboardActivationEvent<T extends HTMLElement> = ReactKeyboardEvent<T>;
type KeyboardActivationHandler<T extends HTMLElement> = (event: KeyboardActivationEvent<T>) => void;

type KeyboardActivationFactory<T extends HTMLElement> = (
  handler: KeyboardActivationHandler<T>,
) => KeyboardActivationHandler<T>;

interface UseKeyboardActivationOptions {
  keys?: readonly string[];
  preventDefault?: boolean;
  stopPropagation?: boolean;
}

/**
 * Shared helper to support activating interactive elements via keyboard input.
 * Handles common Enter/Space detection and default prevention so components only
 * need to supply their activation logic.
 */
export function useKeyboardActivation<T extends HTMLElement>(
  options: UseKeyboardActivationOptions = {},
): KeyboardActivationFactory<T> {
  const { keys = DEFAULT_KEYS, preventDefault = true, stopPropagation = false } = options;

  const keysSignature = useMemo(() => keys.join(','), [keys]);
  const keySet = useMemo(() => new Set(keys), [keysSignature]);

  return useCallback<KeyboardActivationFactory<T>>(
    (handler) => {
      return (event) => {
        if (keySet.has(event.key)) {
          if (preventDefault) {
            event.preventDefault();
          }
          if (stopPropagation) {
            event.stopPropagation();
          }
          handler(event);
        }
      };
    },
    [keySet, preventDefault, stopPropagation],
  );
}

export default useKeyboardActivation;
