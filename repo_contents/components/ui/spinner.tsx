// components/ui/spinner.tsx
import { Loader2 } from 'lucide-react'; // Pretpostavka da koristiš lucide-react za ikonice
import { cn } from '@/lib/utils'; // Pretpostavka da imaš utility funkciju za spajanje klasa (npr. iz Shadcn UI setupa)
import React from 'react'; // Eksplicitno uvezi React

interface SpinnerProps {
  className?: string; // Omogućava dodavanje dodatnih CSS klasa
}

/**
 * A simple spinner component using Lucide React Loader2 icon.
 * Displays a spinning loading indicator.
 */
export const Spinner: React.FC<SpinnerProps> = ({ className }) => {
  return (
    // Koristi cn za spajanje podrazumevanih klasa (animate-spin) sa prosleđenim klasama
    <Loader2 className={cn('h-4 w-4 animate-spin', className)} />
  );
};

// Ako NE koristiš `lucide-react` i `@/lib/utils/cn`, možeš koristiti jednostavniju SVG verziju:
/*
export const Spinner: React.FC<SpinnerProps> = ({ className }) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`animate-spin ${className}`} // Koristi template literal za spajanje klasa
    >
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  );
};
*/