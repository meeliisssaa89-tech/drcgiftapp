import { cn } from '@/lib/utils';

interface ProgressBarProps {
  progress: number;
  max: number;
  showLabel?: boolean;
  className?: string;
}

export const ProgressBar = ({ progress, max, showLabel = true, className = '' }: ProgressBarProps) => {
  const percentage = Math.min((progress / max) * 100, 100);
  
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <div className="flex-1 progress-bar">
        <div 
          className="progress-fill" 
          style={{ width: `${percentage}%` }} 
        />
      </div>
      {showLabel && (
        <span className="text-sm text-muted-foreground whitespace-nowrap">
          {progress}/{max}
        </span>
      )}
    </div>
  );
};

interface ProgressBarPercentProps {
  percentage: number;
  className?: string;
}

export const ProgressBarPercent = ({ percentage, className = '' }: ProgressBarPercentProps) => {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <div className="flex-1 progress-bar">
        <div 
          className="progress-fill" 
          style={{ width: `${percentage}%` }} 
        />
      </div>
      <span className="text-sm text-muted-foreground whitespace-nowrap">
        {percentage}%
      </span>
    </div>
  );
};
