import { ReactNode } from 'react';

interface TooltipProps {
  text: string;
  children: ReactNode;
  theme: 'light' | 'dark';
  position?: 'bottom' | 'bottom-right';
  flex1?: boolean;
  wrap?: boolean;
}

export function Tooltip({ text, children, theme, position = 'bottom', flex1 = false, wrap = false }: TooltipProps) {
  const isDark = theme === 'dark';

  const positionClasses = position === 'bottom-right'
    ? 'right-0 top-full mt-1'
    : 'left-0 top-full mt-1';

  return (
    <div className={`relative group/tooltip ${flex1 ? 'flex-1 min-w-0' : ''}`}>
      {children}
      <div
        className={`absolute ${positionClasses} px-2 py-1 text-xs rounded shadow-lg z-50
          opacity-0 group-hover/tooltip:opacity-100 transition-opacity delay-300
          pointer-events-none ${wrap ? 'max-w-xs break-all' : 'whitespace-nowrap'}
          ${isDark ? 'bg-gray-700 text-gray-200' : 'bg-gray-800 text-white'}`}
      >
        {text}
      </div>
    </div>
  );
}
