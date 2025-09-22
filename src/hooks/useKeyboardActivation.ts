import { useCallback } from 'react';
import type { KeyboardEvent } from 'react';

const DEFAULT_ACTIVATION_KEYS = ['Enter', ' ', 'Space', 'Spacebar'] as const;

interface UseKeyboardActivationOptions<E extends HTMLElement> {
  keys?: readonly string[];
  onActivate?: (event: KeyboardEvent<E>) => void;
  preventDefault?: boolean;
  stopPropagation?: boolean;
}

export const useKeyboardActivation = <E extends HTMLElement = HTMLElement>(
  options: UseKeyboardActivationOptions<E> = {},
) => {
  const {
    keys = DEFAULT_ACTIVATION_KEYS,
    onActivate,
    preventDefault = true,
    stopPropagation = false,
  } = options;

  return useCallback(
    (event: KeyboardEvent<E>) => {
      if (!keys.includes(event.key)) {
        return;
      }

      if (preventDefault) {
        event.preventDefault();
      }

      if (stopPropagation) {
        event.stopPropagation();
      }

      if (onActivate) {
        onActivate(event);
        return;
      }

      const target = event.currentTarget as HTMLElement | null;
      if (target && typeof target.click === 'function') {
        target.click();
      }
    },
    [keys, onActivate, preventDefault, stopPropagation],
  );
};

export default useKeyboardActivation;
