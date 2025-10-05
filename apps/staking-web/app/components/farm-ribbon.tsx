import type { CSSProperties } from 'react';

interface FarmRibbonProps {
  readonly height?: number; // px
  readonly backgroundHeight?: number; // px
  readonly tractorHeight?: number; // px
  readonly opacity?: number; // 0..1
  readonly className?: string;
  readonly style?: CSSProperties;
  readonly repeat?: boolean; // repeat-x background
  readonly withBackground?: boolean;
  readonly showTractor?: boolean;
}

export function FarmRibbon({
  height = 48,
  backgroundHeight = 48,
  tractorHeight = 22,
  opacity = 0.4,
  className,
  style,
  repeat = true,
  withBackground = true,
  showTractor = true,
}: FarmRibbonProps) {
  const containerStyle: CSSProperties = {
    height,
    ...style,
  };

  return (
    <div className={`relative w-screen pointer-events-none ${className ?? ''}`} style={containerStyle} aria-hidden>
      {/* Base ribbon surface */}
      <div className="absolute inset-0 rounded-xl border-2 border-border/40 bg-secondary/30 backdrop-blur-[1px]" style={{ opacity }} />

      {/* Tiled background (ground/sky) */}
      {withBackground ? (
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: 'url(/retro-farm-background.svg)',
            backgroundPosition: 'bottom left',
            backgroundRepeat: repeat ? ('repeat-x' as const) : ('no-repeat' as const),
            backgroundSize: `auto ${backgroundHeight}px`,
            imageRendering: 'pixelated',
            opacity,
          }}
        />
      ) : null}

      {/* Tiny moving tractor */}
      {showTractor ? (
        <div className="absolute bottom-0 left-0 right-0 animate-tractor" style={{ height: Math.max(tractorHeight + 12, 16) }}>
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: 'url(/retro-farm-tractor.svg)',
              backgroundPosition: 'center bottom',
              backgroundRepeat: 'no-repeat',
              backgroundSize: `auto ${tractorHeight}px`,
              imageRendering: 'pixelated',
              opacity: Math.min(opacity + 0.3, 0.85),
            }}
          />
          {/* Smoke */}
          <div className="absolute" style={{ bottom: Math.floor(tractorHeight * 0.9), left: '50%', transform: 'translateX(-12px)' }}>
            <div className="animate-smoke absolute h-1.5 w-1.5 rounded-full bg-gray-400/50 dark:bg-gray-300/40" style={{ animationDelay: '0s', filter: 'blur(1px)' }} />
            <div className="animate-smoke absolute h-1.5 w-1.5 rounded-full bg-gray-400/40 dark:bg-gray-300/30" style={{ animationDelay: '1s', filter: 'blur(1px)' }} />
          </div>
        </div>
      ) : null}
    </div>
  );
}
