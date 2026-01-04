interface CrystalIconProps {
  className?: string;
  size?: number;
}

export const CrystalIcon = ({ className = '', size = 16 }: CrystalIconProps) => {
  return (
    <svg 
      viewBox="0 0 24 24" 
      width={size} 
      height={size} 
      className={className}
      fill="none"
    >
      <path 
        d="M12 2L3 9L12 22L21 9L12 2Z" 
        fill="url(#crystalGradient)" 
        stroke="url(#crystalStroke)" 
        strokeWidth="1.5"
      />
      <path 
        d="M3 9H21" 
        stroke="url(#crystalStroke)" 
        strokeWidth="1.5" 
        strokeLinecap="round"
      />
      <path 
        d="M12 2L8 9L12 22" 
        stroke="url(#crystalStroke)" 
        strokeWidth="1" 
        opacity="0.5"
      />
      <path 
        d="M12 2L16 9L12 22" 
        stroke="url(#crystalStroke)" 
        strokeWidth="1" 
        opacity="0.5"
      />
      <defs>
        <linearGradient id="crystalGradient" x1="12" y1="2" x2="12" y2="22" gradientUnits="userSpaceOnUse">
          <stop stopColor="#4FC3F7" />
          <stop offset="1" stopColor="#2196F3" />
        </linearGradient>
        <linearGradient id="crystalStroke" x1="12" y1="2" x2="12" y2="22" gradientUnits="userSpaceOnUse">
          <stop stopColor="#81D4FA" />
          <stop offset="1" stopColor="#1E88E5" />
        </linearGradient>
      </defs>
    </svg>
  );
};

interface CrystalBadgeProps {
  amount: number;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const CrystalBadge = ({ amount, size = 'md', className = '' }: CrystalBadgeProps) => {
  const sizeClasses = {
    sm: 'text-xs px-2 py-1',
    md: 'text-sm px-3 py-1.5',
    lg: 'text-base px-4 py-2',
  };
  
  const iconSizes = {
    sm: 12,
    md: 16,
    lg: 20,
  };

  return (
    <div className={`crystal-badge ${sizeClasses[size]} ${className}`}>
      <span className="font-semibold">{amount}</span>
      <CrystalIcon size={iconSizes[size]} />
    </div>
  );
};
