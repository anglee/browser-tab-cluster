import { ReactNode } from 'react';
import { Tooltip as AntTooltip } from 'antd';

interface TooltipProps {
  text: ReactNode;
  children: ReactNode;
  theme: 'light' | 'dark';
  position?: 'bottom' | 'bottom-right' | 'top';
  flex1?: boolean;
  wrap?: boolean;
}

const PLACEMENT_MAP = {
  'bottom': 'bottom',
  'bottom-right': 'bottomRight',
  'top': 'top',
} as const;

export function Tooltip({ text, children, position = 'bottom', flex1 = false, wrap = false }: TooltipProps) {
  const placement = PLACEMENT_MAP[position];

  const overlayInnerStyle = wrap
    ? { maxWidth: '20rem', wordBreak: 'break-all' as const, whiteSpace: 'pre-line' as const }
    : undefined;

  const tooltip = (
    <AntTooltip
      title={text}
      placement={placement}
      mouseEnterDelay={0.3}
      overlayInnerStyle={overlayInnerStyle}
    >
      {children}
    </AntTooltip>
  );

  if (flex1) {
    return <div className="flex-1 min-w-0">{tooltip}</div>;
  }

  return tooltip;
}
