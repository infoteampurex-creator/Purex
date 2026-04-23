import { Check } from 'lucide-react';
import { cn } from '@/lib/cn';

interface StepperProps {
  steps: string[];
  current: number;
}

export function BookingStepper({ steps, current }: StepperProps) {
  return (
    <div className="flex items-center gap-2 md:gap-4 w-full mb-8 md:mb-12">
      {steps.map((label, i) => {
        const isDone = i < current;
        const isActive = i === current;
        return (
          <div key={label} className="flex-1 flex items-center gap-2 md:gap-3 min-w-0">
            <div
              className={cn(
                'flex-shrink-0 w-8 h-8 md:w-9 md:h-9 rounded-full border-2 flex items-center justify-center transition-all duration-300',
                isDone && 'bg-accent border-accent text-bg',
                isActive && 'border-accent text-accent bg-accent/10 scale-110',
                !isDone && !isActive && 'border-border text-text-dim'
              )}
            >
              {isDone ? (
                <Check size={14} strokeWidth={3} />
              ) : (
                <span className="font-mono text-[11px] font-bold">{i + 1}</span>
              )}
            </div>
            <div
              className={cn(
                'hidden md:block font-mono text-[10px] uppercase tracking-[0.14em] font-bold truncate transition-colors',
                isActive ? 'text-accent' : isDone ? 'text-text' : 'text-text-dim'
              )}
            >
              {label}
            </div>
            {i < steps.length - 1 && (
              <div
                className={cn(
                  'flex-1 h-px transition-colors',
                  isDone ? 'bg-accent' : 'bg-border'
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
