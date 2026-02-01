import { useState, useRef, ReactNode } from 'react';
import { RightOutlined } from '@ant-design/icons';

interface SubmenuProps {
  label: string;
  icon?: ReactNode;
  children: ReactNode;
  theme: 'light' | 'dark';
}

export function Submenu({ label, icon, children, theme }: SubmenuProps) {
  const [showSubmenu, setShowSubmenu] = useState(false);
  const [openLeft, setOpenLeft] = useState(false);
  const triggerRef = useRef<HTMLDivElement>(null);

  const handleMouseEnter = () => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      const submenuWidth = 160; // w-40 = 10rem = 160px
      const spaceOnRight = window.innerWidth - rect.right;
      setOpenLeft(spaceOnRight < submenuWidth + 20);
    }
    setShowSubmenu(true);
  };

  const handleMouseLeave = () => {
    setShowSubmenu(false);
  };

  const isDark = theme === 'dark';

  return (
    <div
      ref={triggerRef}
      className="relative"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <button
        tabIndex={-1}
        className={`w-full px-3 py-1.5 text-left text-sm flex items-center justify-between ${
          isDark ? 'text-gray-200 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-100'
        }`}
      >
        <span className="flex items-center gap-2">
          {icon}
          {label}
        </span>
        <RightOutlined className="text-xs" />
      </button>

      {showSubmenu && (
        <div
          className={`absolute top-0 py-1 min-w-40 rounded-lg shadow-lg z-30 border ${
            openLeft ? 'right-full mr-1' : 'left-full ml-1'
          } ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}
        >
          {children}
        </div>
      )}
    </div>
  );
}

interface SubmenuItemProps {
  children: ReactNode;
  onClick: () => void;
  theme: 'light' | 'dark';
}

export function SubmenuItem({ children, onClick, theme }: SubmenuItemProps) {
  const isDark = theme === 'dark';

  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      tabIndex={-1}
      className={`w-full px-3 py-1.5 text-left text-sm whitespace-nowrap ${
        isDark ? 'text-gray-200 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-100'
      }`}
    >
      {children}
    </button>
  );
}
