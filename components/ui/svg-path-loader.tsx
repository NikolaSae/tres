// components/ui/svg-path-loader.tsx
'use client';

interface SvgPathLoaderProps {
  shape?: 'circle' | 'triangle' | 'square';
  size?: number;
  pathColor?: string;
  dotColor?: string;
  duration?: number;
  className?: string;
}

export const SvgPathLoader = ({
  shape = 'circle',
  size = 44,
  pathColor = '#2F3545',
  dotColor = '#5628EE',
  duration = 3,
  className = ''
}: SvgPathLoaderProps) => {
  const renderShape = () => {
    switch (shape) {
      case 'circle':
        return (
          <svg viewBox="0 0 80 80">
            <circle cx="40" cy="40" r="32"></circle>
          </svg>
        );
      case 'triangle':
        return (
          <svg viewBox="0 0 86 80">
            <polygon points="43 8 79 72 7 72"></polygon>
          </svg>
        );
      case 'square':
        return (
          <svg viewBox="0 0 80 80">
            <rect x="8" y="8" width="64" height="64"></rect>
          </svg>
        );
    }
  };

  const loaderClass = shape === 'triangle' ? 'svg-loader triangle' : 'svg-loader';
  const loaderWidth = shape === 'triangle' ? size * 1.09 : size; // Triangle is slightly wider

  return (
    <>
      <div 
        className={`${loaderClass} ${className}`}
        style={{
          '--path': pathColor,
          '--dot': dotColor,
          '--duration': `${duration}s`,
          '--size': `${size}px`,
          '--loader-width': `${loaderWidth}px`
        } as React.CSSProperties}
      >
        {renderShape()}
      </div>

      <style jsx>{`
        .svg-loader {
          --path: ${pathColor};
          --dot: ${dotColor};
          --duration: ${duration}s;
          width: var(--loader-width, var(--size));
          height: var(--size);
          position: relative;
          display: inline-block;
        }

        .svg-loader:before {
          content: '';
          width: 6px;
          height: 6px;
          border-radius: 50%;
          position: absolute;
          display: block;
          background: var(--dot);
          top: 37px;
          left: 19px;
          transform: translate(-18px, -18px);
          animation: dotRect var(--duration) cubic-bezier(0.785, 0.135, 0.15, 0.86) infinite;
        }

        .svg-loader.triangle:before {
          left: 21px;
          transform: translate(-10px, -18px);
          animation: dotTriangle var(--duration) cubic-bezier(0.785, 0.135, 0.15, 0.86) infinite;
        }

        .svg-loader svg {
          display: block;
          width: 100%;
          height: 100%;
        }

        .svg-loader svg rect,
        .svg-loader svg polygon,
        .svg-loader svg circle {
          fill: none;
          stroke: var(--path);
          stroke-width: 10px;
          stroke-linejoin: round;
          stroke-linecap: round;
        }

        .svg-loader svg polygon {
          stroke-dasharray: 145 76 145 76;
          stroke-dashoffset: 0;
          animation: pathTriangle var(--duration) cubic-bezier(0.785, 0.135, 0.15, 0.86) infinite;
        }

        .svg-loader svg rect {
          stroke-dasharray: 192 64 192 64;
          stroke-dashoffset: 0;
          animation: pathRect var(--duration) cubic-bezier(0.785, 0.135, 0.15, 0.86) infinite;
        }

        .svg-loader svg circle {
          stroke-dasharray: 150 50 150 50;
          stroke-dashoffset: 75;
          animation: pathCircle var(--duration) cubic-bezier(0.785, 0.135, 0.15, 0.86) infinite;
        }

        @keyframes pathTriangle {
          33% {
            stroke-dashoffset: 74;
          }
          66% {
            stroke-dashoffset: 147;
          }
          100% {
            stroke-dashoffset: 221;
          }
        }

        @keyframes dotTriangle {
          33% {
            transform: translate(0, 0);
          }
          66% {
            transform: translate(10px, -18px);
          }
          100% {
            transform: translate(-10px, -18px);
          }
        }

        @keyframes pathRect {
          25% {
            stroke-dashoffset: 64;
          }
          50% {
            stroke-dashoffset: 128;
          }
          75% {
            stroke-dashoffset: 192;
          }
          100% {
            stroke-dashoffset: 256;
          }
        }

        @keyframes dotRect {
          25% {
            transform: translate(0, 0);
          }
          50% {
            transform: translate(18px, -18px);
          }
          75% {
            transform: translate(0, -36px);
          }
          100% {
            transform: translate(-18px, -18px);
          }
        }

        @keyframes pathCircle {
          25% {
            stroke-dashoffset: 125;
          }
          50% {
            stroke-dashoffset: 175;
          }
          75% {
            stroke-dashoffset: 225;
          }
          100% {
            stroke-dashoffset: 275;
          }
        }
      `}</style>
    </>
  );
};

// Showcase all three shapes
export const SvgPathLoaderShowcase = ({
  size = 44,
  pathColor = '#2F3545',
  dotColor = '#5628EE',
  duration = 3
}: {
  size?: number;
  pathColor?: string;
  dotColor?: string;
  duration?: number;
}) => {
  const shapes: Array<'circle' | 'triangle' | 'square'> = ['circle', 'triangle', 'square'];
  
  const descriptions = {
    circle: 'Circular path with smooth rotation',
    triangle: 'Triangular path with corner tracking',
    square: 'Square path with 90° turns'
  };

  return (
    <div className="flex items-center justify-center gap-12 flex-wrap">
      {shapes.map((shape) => (
        <div key={shape} className="text-center space-y-4">
          <div className="flex items-center justify-center min-h-[100px]">
            <SvgPathLoader
              shape={shape}
              size={size}
              pathColor={pathColor}
              dotColor={dotColor}
              duration={duration}
            />
          </div>
          <div>
            <h3 className="font-semibold capitalize">{shape}</h3>
            <p className="text-xs text-muted-foreground">{descriptions[shape]}</p>
          </div>
        </div>
      ))}
    </div>
  );
};