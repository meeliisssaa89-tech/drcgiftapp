import { cn } from '@/lib/utils';

interface ToggleSwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  className?: string;
}

export const ToggleSwitch = ({ checked, onChange, label, className }: ToggleSwitchProps) => {
  return (
    <div className={cn("flex flex-col items-center gap-1", className)}>
      {label && <span className="text-xs text-muted-foreground">{label}</span>}
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cn(
          "w-11 h-6 rounded-full transition-all duration-300 relative",
          checked ? "bg-primary" : "bg-muted"
        )}
      >
        <div 
          className={cn(
            "absolute w-5 h-5 bg-white rounded-full top-0.5 transition-all duration-300 shadow-sm",
            checked ? "left-5" : "left-0.5"
          )}
        />
      </button>
    </div>
  );
};
