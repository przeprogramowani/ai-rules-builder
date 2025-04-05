import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * A utility function that merges multiple class names together
 * and ensures that Tailwind classes are properly merged
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
