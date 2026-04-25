import React from 'react';
import { cn } from '../lib/utils';

interface LogoProps {
  className?: string;
  showText?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export default function Logo({ className, showText = true, size = 'md' }: LogoProps) {
  const sizes = {
    sm: 'h-6',
    md: 'h-8',
    lg: 'h-12',
  };

  const iconSizes = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  };

  const textSizes = {
    sm: 'text-base',
    md: 'text-xl',
    lg: 'text-3xl',
  };

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className={cn("relative flex-shrink-0", iconSizes[size])}>
        <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
          {/* Main Logo Path - "S" */}
          <path 
            d="M50 25 C30 25 25 40 40 45 C55 50 60 65 40 70" 
            stroke="currentColor" 
            strokeWidth="14" 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            className="text-slate-900 dark:text-white"
          />
          {/* Main Logo Path - "A" */}
          <path 
            d="M55 70 L70 30 L85 70" 
            stroke="#2563EB" 
            strokeWidth="14" 
            strokeLinecap="round" 
            strokeLinejoin="round" 
          />
          {/* Code Symbol Overlay */}
          <rect x="42" y="45" width="20" height="12" rx="4" fill="#2563EB" />
          <text 
            x="52" 
            y="54" 
            fill="white" 
            fontSize="10" 
            fontWeight="black" 
            textAnchor="middle"
          >
            &lt;/&gt;
          </text>
        </svg>
      </div>
      {showText && (
        <span className={cn("font-black tracking-tighter text-slate-900 dark:text-white", textSizes[size])}>
          Script<span className="text-blue-600">Asssist</span>
        </span>
      )}
    </div>
  );
}
