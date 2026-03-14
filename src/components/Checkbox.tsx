interface CheckboxProps {
  checked: boolean;
  indeterminate?: boolean;
  onChange: () => void;
  className?: string;
  theme: 'light' | 'dark';
}

export function Checkbox({ checked, indeterminate = false, onChange, className = '', theme }: CheckboxProps) {
  const isDark = theme === 'dark';
  const isActive = checked || indeterminate;

  return (
    <div
      className={`flex-shrink-0 cursor-pointer ${className}`}
      onMouseDown={(e) => {
        e.stopPropagation();
        e.preventDefault();
        onChange();
      }}
      onClick={(e) => {
        e.stopPropagation();
        e.preventDefault();
      }}
    >
      <div
        className={`w-4 h-4 rounded flex items-center justify-center border transition-colors ${
          isActive
            ? isDark
              ? 'bg-mist-500 border-mist-500'
              : 'bg-mist-600 border-mist-600'
            : isDark
              ? 'bg-mist-800 border-mist-600'
              : 'bg-white border-mist-300'
        }`}
      >
        {checked && (
          <svg viewBox="0 0 12 12" className="w-3 h-3 text-white" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M2 6l3 3 5-5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
        {indeterminate && !checked && (
          <svg viewBox="0 0 12 12" className="w-3 h-3 text-white" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M2 6h8" strokeLinecap="round" />
          </svg>
        )}
      </div>
    </div>
  );
}
