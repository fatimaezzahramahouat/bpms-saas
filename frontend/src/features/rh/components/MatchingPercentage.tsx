import { useEffect, useState } from 'react';

// Get color based on percentage
const getPercentageColor = (percentage: number): string => {
  if (percentage <= 30) return 'bg-red-500';
  if (percentage <= 70) return 'bg-yellow-500';
  return 'bg-green-500';
};

// Get text color based on percentage
const getTextColor = (percentage: number): string => {
  if (percentage <= 30) return 'text-red-500';
  if (percentage <= 70) return 'text-yellow-500';
  return 'text-green-500';
};

// Get stroke color for circular progress
const getStrokeColor = (percentage: number): string => {
  if (percentage <= 30) return '#ef4444';
  if (percentage <= 70) return '#eab308';
  return '#22c55e';
};

interface MatchingPercentageProps {
  percentage: number;
  showCircular?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function MatchingPercentage({ 
  percentage, 
  showCircular = true,
  size = 'md' 
}: MatchingPercentageProps) {
  const [animatedPercentage, setAnimatedPercentage] = useState(0);

  // Animate the percentage on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimatedPercentage(percentage);
    }, 100);
    return () => clearTimeout(timer);
  }, [percentage]);

  const sizeClasses = {
    sm: 'w-16 h-16',
    md: 'w-24 h-24',
    lg: 'w-32 h-32',
  };

  const strokeWidth = size === 'sm' ? 3 : size === 'md' ? 4 : 5;
  const radius = size === 'sm' ? 28 : size === 'md' ? 44 : 60;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (animatedPercentage / 100) * circumference;

  const textSizeClass = size === 'sm' ? 'text-xs' : size === 'md' ? 'text-sm' : 'text-base';

  return (
    <div className="flex items-center gap-4">
      {/* Circular Progress */}
      {showCircular && (
        <div className={`relative ${sizeClasses[size]}`}>
          <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
            {/* Background circle */}
            <circle
              cx="50"
              cy="50"
              r={radius}
              fill="none"
              stroke="currentColor"
              strokeWidth={strokeWidth}
              className="text-gray-200 dark:text-gray-700"
            />
            {/* Progress circle */}
            <circle
              cx="50"
              cy="50"
              r={radius}
              fill="none"
              stroke={getStrokeColor(percentage)}
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              className="transition-all duration-1000 ease-out"
            />
          </svg>
          {/* Percentage text */}
          <div className="absolute inset-0 flex items-center justify-center">
            <span className={`font-bold ${getTextColor(percentage)} ${textSizeClass}`}>
              {Math.round(animatedPercentage)}%
            </span>
          </div>
        </div>
      )}

      {/* Linear Progress Bar */}
      <div className="flex-1">
        <div className="flex items-center justify-between mb-1">
          <span className="text-sm text-[var(--text-secondary)]">Compatibilité</span>
          <span className={`text-sm font-semibold ${getTextColor(percentage)}`}>
            {Math.round(animatedPercentage)}%
          </span>
        </div>
        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <div
            className={`h-full ${getPercentageColor(percentage)} rounded-full transition-all duration-1000 ease-out`}
            style={{ width: `${animatedPercentage}%` }}
          />
        </div>
        <div className="flex justify-between mt-1 text-xs text-[var(--text-secondary)]">
          <span>0%</span>
          <span>30%</span>
          <span>70%</span>
          <span>100%</span>
        </div>
      </div>
    </div>
  );
}

export default MatchingPercentage;
