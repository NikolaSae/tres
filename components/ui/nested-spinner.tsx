// components/ui/nested-spinner.tsx
'use client';

interface NestedSpinnerProps {
  variant?: 'loader1' | 'loader2' | 'loader3' | 'loader4';
  size?: number;
  primaryColor?: string;
  secondaryColor?: string;
  className?: string;
}

export const NestedSpinner = ({
  variant = 'loader1',
  size = 150,
  primaryColor = 'rgba(0, 0, 0, .5)',
  secondaryColor = 'rgba(0, 0, 255, .5)',
  className = ''
}: NestedSpinnerProps) => {
  // Generate nested divs based on variant
  const nestingLevels = variant === 'loader4' ? 10 : 6;

  return (
    <>
      <div 
        className={`nested-spinner ${variant} ${className}`}
        style={{
          '--spinner-size': `${size}px`,
          '--primary-color': primaryColor,
          '--secondary-color': secondaryColor
        } as React.CSSProperties}
      >
        {/* Manually create nested structure for better control */}
        {nestingLevels >= 1 && <div className="nested-level">
          {nestingLevels >= 2 && <div className="nested-level">
            {nestingLevels >= 3 && <div className="nested-level">
              {nestingLevels >= 4 && <div className="nested-level">
                {nestingLevels >= 5 && <div className="nested-level">
                  {nestingLevels >= 6 && <div className="nested-level">
                    {nestingLevels >= 7 && <div className="nested-level">
                      {nestingLevels >= 8 && <div className="nested-level">
                        {nestingLevels >= 9 && <div className="nested-level">
                          {nestingLevels >= 10 && <div className="nested-level"></div>}
                        </div>}
                      </div>}
                    </div>}
                  </div>}
                </div>}
              </div>}
            </div>}
          </div>}
        </div>}
      </div>

      <style jsx>{`
        * {
          box-sizing: border-box;
        }

        .nested-spinner {
          position: relative;
          margin: 0 auto;
          width: var(--spinner-size);
          height: var(--spinner-size);
          display: block;
          overflow: hidden;
          border-radius: 50%;
          padding: 8px;
          border: 2px solid transparent;
          will-change: transform;
        }

        .nested-level {
          height: 100%;
          border-radius: 50%;
          padding: 8px;
          border: 2px solid transparent;
          will-change: transform;
          box-sizing: border-box;
        }

        /* Hover pause */
        .nested-spinner:hover,
        .nested-spinner:hover .nested-level {
          animation-play-state: paused !important;
        }

        /* Loader 1 - Grey top/bottom, Blue bottom/top alternating */
        .loader1,
        .loader1 .nested-level {
          border-top-color: var(--primary-color);
          border-bottom-color: var(--secondary-color);
          animation: rotate linear 3.5s infinite;
        }

        /* Loader 2 - Blue top, Grey left/right */
        .loader2,
        .loader2 .nested-level {
          border-top-color: var(--secondary-color);
          border-left-color: var(--primary-color);
          border-right-color: var(--primary-color);
          animation: rotate linear 3.5s infinite;
        }

        /* Loader 3 - Grey top, Blue left with easing */
        .loader3,
        .loader3 .nested-level {
          border-top-color: var(--primary-color);
          border-left-color: var(--secondary-color);
          animation: rotate cubic-bezier(.55, .38, .21, .88) 3s infinite;
        }

        /* Loader 4 - Color changing animation */
        .loader4,
        .loader4 .nested-level {
          padding: 4px;
          animation: rotate2 4s infinite linear;
        }

        @keyframes rotate {
          0% {
            transform: rotate(0deg);
          }
          50% {
            transform: rotate(180deg);
          }
          100% {
            transform: rotate(360deg);
          }
        }

        @keyframes rotate2 {
          0% {
            transform: rotate(0deg);
            border-top-color: var(--primary-color);
          }
          50% {
            transform: rotate(180deg);
            border-top-color: var(--secondary-color);
          }
          100% {
            transform: rotate(360deg);
            border-top-color: var(--primary-color);
          }
        }
      `}</style>
    </>
  );
};

// Showcase component with all variants
export const NestedSpinnerShowcase = ({
  size = 150,
  primaryColor = 'rgba(0, 0, 0, .5)',
  secondaryColor = 'rgba(0, 0, 255, .5)'
}: {
  size?: number;
  primaryColor?: string;
  secondaryColor?: string;
}) => {
  const variants: Array<'loader1' | 'loader2' | 'loader3' | 'loader4'> = [
    'loader1',
    'loader2', 
    'loader3',
    'loader4'
  ];

  const descriptions = {
    loader1: 'Linear rotation with top/bottom borders',
    loader2: 'Linear rotation with top & side borders',
    loader3: 'Cubic bezier easing with top/left borders',
    loader4: 'Color transition animation with more nesting'
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
      {variants.map((variant, idx) => (
        <div key={variant} className="text-center space-y-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-8 shadow-lg flex items-center justify-center min-h-[200px]">
            <NestedSpinner 
              variant={variant}
              size={size}
              primaryColor={primaryColor}
              secondaryColor={secondaryColor}
            />
          </div>
          <div>
            <h3 className="font-semibold text-lg">Loader {idx + 1}</h3>
            <p className="text-sm text-muted-foreground">{descriptions[variant]}</p>
          </div>
        </div>
      ))}
    </div>
  );
};