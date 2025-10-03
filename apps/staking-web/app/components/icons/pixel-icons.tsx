import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface PixelIconProps {
  readonly className?: string;
  readonly size?: number;
}

interface PixelIconBaseProps extends PixelIconProps {
  readonly children: ReactNode;
}

function PixelIconBase({ children, className, size = 24 }: PixelIconBaseProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      xmlns="http://www.w3.org/2000/svg"
      className={cn('fill-current drop-shadow-[0_0_4px_rgba(0,0,0,0.45)]', className)}
      shapeRendering="crispEdges"
      aria-hidden
    >
      {children}
    </svg>
  );
}

export function CoinPixelIcon({ className, size }: PixelIconProps) {
  return (
    <PixelIconBase className={className} size={size}>
      <rect x="3" y="2" width="10" height="12" fill="#fcca46" />
      <rect x="4" y="3" width="8" height="10" fill="#ffe066" />
      <rect x="5" y="4" width="6" height="8" fill="#fff3b0" />
      <rect x="2" y="4" width="1" height="8" fill="#ffb55a" />
      <rect x="13" y="4" width="1" height="8" fill="#ffb55a" />
      <rect x="4" y="7" width="8" height="2" fill="#ffb55a" />
      <rect x="6" y="6" width="4" height="4" fill="#fcca46" />
      <rect x="7" y="5" width="2" height="6" fill="#ffb55a" />
    </PixelIconBase>
  );
}

export function ChestPixelIcon({ className, size }: PixelIconProps) {
  return (
    <PixelIconBase className={className} size={size}>
      <rect x="1" y="5" width="14" height="8" fill="#8d5524" />
      <rect x="2" y="6" width="12" height="6" fill="#c68642" />
      <rect x="1" y="4" width="14" height="1" fill="#573719" />
      <rect x="3" y="7" width="10" height="4" fill="#a97132" />
      <rect x="7" y="4" width="2" height="9" fill="#ffd166" />
      <rect x="6" y="8" width="4" height="3" fill="#2b1706" />
      <rect x="5" y="9" width="6" height="1" fill="#ffd166" />
      <rect x="0" y="12" width="16" height="1" fill="#573719" />
    </PixelIconBase>
  );
}

export function KnightPixelIcon({ className, size }: PixelIconProps) {
  return (
    <PixelIconBase className={className} size={size}>
      <rect x="3" y="2" width="10" height="12" fill="#4a4dff" />
      <rect x="4" y="3" width="8" height="10" fill="#6b6eff" />
      <rect x="5" y="4" width="6" height="8" fill="#9396ff" />
      <rect x="6" y="5" width="4" height="6" fill="#c5c7ff" />
      <rect x="4" y="5" width="2" height="6" fill="#2c2e80" />
      <rect x="10" y="5" width="2" height="6" fill="#2c2e80" />
      <rect x="6" y="3" width="4" height="2" fill="#2c2e80" />
      <rect x="5" y="10" width="6" height="2" fill="#2c2e80" />
      <rect x="7" y="12" width="2" height="2" fill="#2c2e80" />
      <rect x="3" y="13" width="10" height="1" fill="#101133" />
    </PixelIconBase>
  );
}

export function HourglassPixelIcon({ className, size }: PixelIconProps) {
  return (
    <PixelIconBase className={className} size={size}>
      <rect x="3" y="1" width="10" height="2" fill="#ffd166" />
      <rect x="3" y="13" width="10" height="2" fill="#ffd166" />
      <rect x="4" y="3" width="8" height="10" fill="#361f6d" />
      <rect x="5" y="4" width="6" height="8" fill="#6b3db8" />
      <rect x="5" y="5" width="6" height="1" fill="#fcca46" />
      <rect x="7" y="5" width="2" height="4" fill="#fcca46" />
      <rect x="6" y="8" width="4" height="1" fill="#fcca46" />
      <rect x="6" y="9" width="4" height="1" fill="#6b3db8" />
      <rect x="7" y="10" width="2" height="1" fill="#6b3db8" />
      <rect x="6" y="11" width="4" height="1" fill="#fcca46" />
    </PixelIconBase>
  );
}

export function ChainBreakPixelIcon({ className, size }: PixelIconProps) {
  return (
    <PixelIconBase className={className} size={size}>
      <rect x="2" y="6" width="5" height="4" fill="#9b5de5" />
      <rect x="9" y="6" width="5" height="4" fill="#9b5de5" />
      <rect x="3" y="5" width="3" height="1" fill="#ff5cf4" />
      <rect x="10" y="5" width="3" height="1" fill="#ff5cf4" />
      <rect x="4" y="10" width="2" height="1" fill="#ff5cf4" />
      <rect x="10" y="10" width="2" height="1" fill="#ff5cf4" />
      <rect x="7" y="3" width="2" height="3" fill="#6cf6ff" />
      <rect x="7" y="10" width="2" height="3" fill="#6cf6ff" />
      <rect x="6" y="8" width="1" height="2" fill="#fcca46" />
      <rect x="9" y="7" width="1" height="1" fill="#fcca46" />
      <rect x="5" y="7" width="1" height="1" fill="#fcca46" />
    </PixelIconBase>
  );
}

export function SparklePixelIcon({ className, size }: PixelIconProps) {
  return (
    <PixelIconBase className={className} size={size}>
      <rect x="7" y="2" width="2" height="3" fill="#fff3b0" />
      <rect x="7" y="11" width="2" height="3" fill="#fff3b0" />
      <rect x="4" y="7" width="3" height="2" fill="#fff3b0" />
      <rect x="9" y="7" width="3" height="2" fill="#fff3b0" />
      <rect x="6" y="4" width="4" height="6" fill="#ffe066" />
      <rect x="5" y="5" width="2" height="4" fill="#ffd166" />
      <rect x="9" y="5" width="2" height="4" fill="#ffd166" />
    </PixelIconBase>
  );
}

export function NetworkPixelIcon({ className, size }: PixelIconProps) {
  return (
    <PixelIconBase className={className} size={size}>
      {/* Outer frame */}
      <rect x="2" y="2" width="12" height="12" fill="#2c2e80" />
      <rect x="3" y="3" width="10" height="10" fill="#361f6d" />
      {/* Nodes */}
      <rect x="4" y="4" width="2" height="2" fill="#6cf6ff" />
      <rect x="10" y="4" width="2" height="2" fill="#6cf6ff" />
      <rect x="4" y="10" width="2" height="2" fill="#6cf6ff" />
      <rect x="10" y="10" width="2" height="2" fill="#6cf6ff" />
      {/* Links */}
      <rect x="6" y="5" width="4" height="1" fill="#ff5cf4" />
      <rect x="5" y="6" width="1" height="4" fill="#ff5cf4" />
      <rect x="10" y="6" width="1" height="4" fill="#ff5cf4" />
      <rect x="6" y="10" width="4" height="1" fill="#ff5cf4" />
      {/* Center hub */}
      <rect x="7" y="7" width="2" height="2" fill="#fcca46" />
      <rect x="6" y="8" width="1" height="1" fill="#ffd166" />
      <rect x="9" y="8" width="1" height="1" fill="#ffd166" />
    </PixelIconBase>
  );
}
