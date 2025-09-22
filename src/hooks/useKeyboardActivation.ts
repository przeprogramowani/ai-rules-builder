import { useCallback, useMemo } from 'react';
import type { KeyboardEvent, KeyboardEventHandler } from 'react';

type ActivationKey = 'Enter' | ' ' | 'Space' | 'Spacebar';

interface UseKeyboardActivationOptions {
  keys?: ReadonlyArray<ActivationKey>;
  preventDefault?: boolean;
  stopPropagation?: boolean;
}

const DEFAULT_ACTIVATION_KEYS: ReadonlyArray<ActivationKey> = ['Enter', ' ', 'Space', 'Spacebar'];

export const useKeyboardActivation = <T extends HTMLElement>(
  onActivate: (event: KeyboardEvent<T>) => void,
  options: UseKeyboardActivationOptions = {},
): KeyboardEventHandler<T> => {
  const {
    keys = DEFAULT_ACTIVATION_KEYS,
    preventDefault = true,
    stopPropagation = false,
  } = options;

  const keySet = useMemo(() => new Set(keys), [keys]);

  return useCallback<KeyboardEventHandler<T>>(
    (event) => {
      if (!keySet.has(event.key as ActivationKey)) {
        return;
      }

      if (preventDefault) {
        event.preventDefault();
      }

      if (stopPropagation) {
        event.stopPropagation();
      }

      onActivate(event);
    },
    [keySet, onActivate, preventDefault, stopPropagation],
  );
};

export default useKeyboardActivation;
