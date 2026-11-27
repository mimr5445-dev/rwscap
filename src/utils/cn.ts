import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/** Class-name merging utility enforced by the `baseline-ui` skill */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
