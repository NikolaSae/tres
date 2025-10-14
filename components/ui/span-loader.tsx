// components/ui/span-loader.tsx
'use client';

interface SpanLoaderProps {
  variant?: 'loader1' | 'loader2' | 'loader3' | 'loader4' | 'loader5' | 'loader6' | 'loader7';
  color?: string;
  size?: number;
  className?: string;
}

export const SpanLoader = ({
  variant = 'loader1',
  color = '#2FAC9B',
  size = 15,
  className = ''
}: SpanLoaderProps) => {
  // Number of spans for each variant
  const spanCounts = {
    loader1: 5,
    loader2: 5,
    loader3: 5,
    loader4: 5,
    loader5: 10,
    loader6: 5,
    loader7: 20
  };

  const spanCount = spanCounts[variant];

  return (
    <>
      <div 
        className={`span-loader ${variant} ${className}`}
        style={{
          '--loader-color': color,
          '--loader-size': `${size}px`
        } as React.CSSProperties}
      >
        {Array.from({ length: spanCount }).map((_, i) => (
          <span key={i}></span>
        ))}
      </div>

      <style jsx>{`
        .span-loader {
          display: inline-block;
          margin: 0 16px;
        }

        .span-loader span {
          display: inline-block;
          height: var(--loader-size);
          width: var(--loader-size);
          background: var(--loader-color);
          border-radius: 0px;
        }

        /* Loader 1 - Scale animation with border radius */
        .loader1 span {
          border-radius: 500px;
        }
        .loader1 span:nth-child(1) { animation: scale 1s 0.1s infinite cubic-bezier(0.600, -0.280, 0.735, 0.045); }
        .loader1 span:nth-child(2) { animation: scale 1s 0.2s infinite cubic-bezier(0.600, -0.280, 0.735, 0.045); }
        .loader1 span:nth-child(3) { animation: scale 1s 0.3s infinite cubic-bezier(0.600, -0.280, 0.735, 0.045); }
        .loader1 span:nth-child(4) { animation: scale 1s 0.4s infinite cubic-bezier(0.600, -0.280, 0.735, 0.045); }
        .loader1 span:nth-child(5) { animation: scale 1s 0.5s infinite cubic-bezier(0.600, -0.280, 0.735, 0.045); }

        /* Loader 2 - RotateY animation */
        .loader2 span:nth-child(1) { animation: rotateY 4s 0.3s infinite cubic-bezier(0.650, 0.030, 0.735, 0.045); }
        .loader2 span:nth-child(2) { animation: rotateY 4s 0.6s infinite cubic-bezier(0.650, 0.030, 0.735, 0.045); }
        .loader2 span:nth-child(3) { animation: rotateY 4s 0.9s infinite cubic-bezier(0.650, 0.030, 0.735, 0.045); }
        .loader2 span:nth-child(4) { animation: rotateY 4s 1.2s infinite cubic-bezier(0.650, 0.030, 0.735, 0.045); }
        .loader2 span:nth-child(5) { animation: rotateY 4s 1.5s infinite cubic-bezier(0.650, 0.030, 0.735, 0.045); }

        /* Loader 3 - RotateX animation */
        .loader3 span:nth-child(1) { animation: rotateX 2s 0.1s infinite cubic-bezier(0.650, 0.030, 0.735, 0.045); }
        .loader3 span:nth-child(2) { animation: rotateX 2s 0.2s infinite cubic-bezier(0.650, 0.030, 0.735, 0.045); }
        .loader3 span:nth-child(3) { animation: rotateX 2s 0.3s infinite cubic-bezier(0.650, 0.030, 0.735, 0.045); }
        .loader3 span:nth-child(4) { animation: rotateX 2s 0.4s infinite cubic-bezier(0.650, 0.030, 0.735, 0.045); }
        .loader3 span:nth-child(5) { animation: rotateX 2s 0.5s infinite cubic-bezier(0.650, 0.030, 0.735, 0.045); }

        /* Loader 4 - Push/bounce animation */
        .loader4 span {
          border-radius: 500px;
        }
        .loader4 span:nth-child(1) { animation: push 1s 0.05s infinite cubic-bezier(0.005, 0.560, 0.580, 1.590); }
        .loader4 span:nth-child(2) { animation: push 1s 0.10s infinite cubic-bezier(0.005, 0.560, 0.580, 1.590); }
        .loader4 span:nth-child(3) { animation: push 1s 0.15s infinite cubic-bezier(0.005, 0.560, 0.580, 1.590); }
        .loader4 span:nth-child(4) { animation: push 1s 0.20s infinite cubic-bezier(0.005, 0.560, 0.580, 1.590); }
        .loader4 span:nth-child(5) { animation: push 1s 0.25s infinite cubic-bezier(0.005, 0.560, 0.580, 1.590); }

        /* Loader 5 - RotateZ pendulum */
        .loader5 span {
          border-radius: 500px;
          transform-origin: 50% 0%;
          width: calc(var(--loader-size) / 6);
          height: calc(var(--loader-size) * 2);
          margin: 0 calc(var(--loader-size) / 6);
        }
        .loader5 span:nth-child(1) { animation: rotateZ 1s 0.05s infinite cubic-bezier(0.005, 0.560, 0.580, 1.590); }
        .loader5 span:nth-child(2) { animation: rotateZ 1s 0.10s infinite cubic-bezier(0.005, 0.560, 0.580, 1.590); }
        .loader5 span:nth-child(3) { animation: rotateZ 1s 0.15s infinite cubic-bezier(0.005, 0.560, 0.580, 1.590); }
        .loader5 span:nth-child(4) { animation: rotateZ 1s 0.20s infinite cubic-bezier(0.005, 0.560, 0.580, 1.590); }
        .loader5 span:nth-child(5) { animation: rotateZ 1s 0.25s infinite cubic-bezier(0.005, 0.560, 0.580, 1.590); }
        .loader5 span:nth-child(6) { animation: rotateZ 1s 0.30s infinite cubic-bezier(0.005, 0.560, 0.580, 1.590); }
        .loader5 span:nth-child(7) { animation: rotateZ 1s 0.35s infinite cubic-bezier(0.005, 0.560, 0.580, 1.590); }
        .loader5 span:nth-child(8) { animation: rotateZ 1s 0.40s infinite cubic-bezier(0.005, 0.560, 0.580, 1.590); }
        .loader5 span:nth-child(9) { animation: rotateZ 1s 0.45s infinite cubic-bezier(0.005, 0.560, 0.580, 1.590); }
        .loader5 span:nth-child(10) { animation: rotateZ 1s 0.50s infinite cubic-bezier(0.005, 0.560, 0.580, 1.590); }

        /* Loader 6 - Curve/flip animation */
        .loader6 span {
          transform-origin: 0 50%;
          perspective: 100px;
        }
        .loader6 span:nth-child(1) { animation: curve 1s 0.5s infinite; }
        .loader6 span:nth-child(2) { animation: curve 1s 1.0s infinite; }
        .loader6 span:nth-child(3) { animation: curve 1s 1.5s infinite; }
        .loader6 span:nth-child(4) { animation: curve 1s 2.0s infinite; }
        .loader6 span:nth-child(5) { animation: curve 1s 2.5s infinite; }

        /* Loader 7 - Vertical stretch */
        .loader7 span {
          width: calc(var(--loader-size) / 2);
          height: calc(var(--loader-size) / 2);
          margin: 0 2px;
        }
        ${Array.from({ length: 20 }, (_, i) => `
        .loader7 span:nth-child(${i + 1}) { animation: temp 1s ${(i + 1) * 0.05}s infinite cubic-bezier(0.005, 0.560, 0.580, 1.590); }
        `).join('')}

        /* Keyframes */
        @keyframes scale {
          0% { transform: scale(0.0); }
          25% { transform: scale(0.9, 0.9); filter: brightness(1.3); }
          50% { transform: scale(1, 1); margin: 0 3px; }
          100% { transform: scale(0.0); }
        }

        @keyframes rotateY {
          0% { transform: rotateY(0deg); }
          50% { transform: rotateY(90deg); filter: brightness(1.3); }
          100% { transform: rotateY(0deg); }
        }

        @keyframes rotateX {
          0% { transform: rotateX(0deg); }
          50% { transform: rotateX(90deg) scale(0.5, 0.5); filter: brightness(1.3); }
          100% { transform: rotateX(0deg); }
        }

        @keyframes push {
          0% { transform: translateX(0px) scale(0.9, 0.6); }
          50% { transform: translateY(-20px) scale(0.7, 1.1); filter: brightness(1.2); }
          100% { transform: translateX(0px) scale(0.9, 0.6); }
        }

        @keyframes rotateZ {
          0% { transform: rotateZ(-20deg); }
          50% { transform: rotateZ(20deg) scaleY(1.2); filter: brightness(1.2); }
          100% { transform: rotateZ(-20deg); }
        }

        @keyframes curve {
          0% { transform: rotateY(-90deg) perspective(50px); filter: brightness(0.8); }
          50% { transform: rotateY(0deg); filter: brightness(1.2); }
          100% { transform: rotateY(90deg) perspective(50px); transform-origin: 100% 50%; filter: brightness(0.8); }
        }

        @keyframes temp {
          0% { }
          50% { transform: scale(1, 5); filter: brightness(0.8); }
          100% { }
        }
      `}</style>
    </>
  );
};

// Showcase all variants
export const SpanLoaderShowcase = ({
  color = '#2FAC9B',
  size = 15
}: {
  color?: string;
  size?: number;
}) => {
  const variants: Array<'loader1' | 'loader2' | 'loader3' | 'loader4' | 'loader5' | 'loader6' | 'loader7'> = [
    'loader1', 'loader2', 'loader3', 'loader4', 'loader5', 'loader6', 'loader7'
  ];

  const descriptions = {
    loader1: 'Scale pulse animation',
    loader2: '3D Y-axis rotation',
    loader3: '3D X-axis flip',
    loader4: 'Bounce push effect',
    loader5: 'Pendulum swing',
    loader6: 'Perspective curve flip',
    loader7: 'Vertical stretch wave'
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
      {variants.map((variant, idx) => (
        <div key={variant} className="text-center space-y-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-8 shadow-lg flex items-center justify-center min-h-[120px]">
            <SpanLoader
              variant={variant}
              color={color}
              size={size}
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