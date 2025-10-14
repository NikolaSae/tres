import React from 'react';

interface CubeLoaderProps {
  size?: number;
  color?: string;
  showText?: boolean;
  text?: string;
}

export const CubeLoader: React.FC<CubeLoaderProps> = ({
  size = 50,
  color = '#ffffff',
  showText = true,
  text = 'Loading'
}) => {
  const halfSize = size / 2;
  
  return (
    <div className="relative inline-block" style={{ width: size * 2, height: size * 2 }}>
      <style>{`
        @keyframes cubeFolding {
          0%, 10% {
            transform: perspective(140px) rotateX(-180deg);
            opacity: 0;
          }
          25%, 75% {
            transform: perspective(140px) rotateX(0deg);
            opacity: 1;
          }
          90%, 100% {
            transform: perspective(140px) rotateY(180deg);
            opacity: 0;
          }
        }
        
        @keyframes cubeText {
          100% {
            top: ${halfSize + 10}px;
          }
        }
        
        @keyframes cubeShadow {
          100% {
            bottom: -18px;
            width: ${size * 2}px;
          }
        }
        
        .cube-leaf::before {
          animation: cubeFolding 2.5s infinite linear both;
        }
        
        .cube-leaf-2::before {
          animation-delay: 0.3s;
        }
        
        .cube-leaf-3::before {
          animation-delay: 0.9s;
        }
        
        .cube-leaf-4::before {
          animation-delay: 0.6s;
        }
        
        .cube-loading-text {
          animation: cubeText 0.5s ease infinite alternate;
        }
        
        .cube-shadow {
          animation: cubeShadow 0.5s ease infinite alternate;
        }
      `}</style>
      
      {/* Cube Container */}
      <div 
        className="absolute inset-0 flex items-center justify-center"
        style={{ transform: 'rotate(45deg)' }}
      >
        <div className="inline-block" style={{ fontSize: 0, width: size, height: size }}>
          {/* Leaf 1 */}
          <span 
            className="cube-leaf inline-block relative"
            style={{ 
              width: halfSize, 
              height: halfSize,
              transform: 'scale(1.1)'
            }}
          >
            <span 
              className="absolute left-0 top-0 block"
              style={{
                width: halfSize,
                height: halfSize,
                backgroundColor: color,
                transformOrigin: '100% 100%'
              }}
            />
          </span>
          
          {/* Leaf 2 */}
          <span 
            className="cube-leaf cube-leaf-2 inline-block relative"
            style={{ 
              width: halfSize, 
              height: halfSize,
              transform: 'rotateZ(90deg) scale(1.1)'
            }}
          >
            <span 
              className="absolute left-0 top-0 block"
              style={{
                width: halfSize,
                height: halfSize,
                backgroundColor: `color-mix(in srgb, ${color} 95%, black)`,
                transformOrigin: '100% 100%'
              }}
            />
          </span>
          
          {/* Leaf 3 */}
          <span 
            className="cube-leaf cube-leaf-3 inline-block relative"
            style={{ 
              width: halfSize, 
              height: halfSize,
              transform: 'rotateZ(270deg) scale(1.1)'
            }}
          >
            <span 
              className="absolute left-0 top-0 block"
              style={{
                width: halfSize,
                height: halfSize,
                backgroundColor: `color-mix(in srgb, ${color} 95%, black)`,
                transformOrigin: '100% 100%'
              }}
            />
          </span>
          
          {/* Leaf 4 */}
          <span 
            className="cube-leaf cube-leaf-4 inline-block relative"
            style={{ 
              width: halfSize, 
              height: halfSize,
              transform: 'rotateZ(180deg) scale(1.1)'
            }}
          >
            <span 
              className="absolute left-0 top-0 block"
              style={{
                width: halfSize,
                height: halfSize,
                backgroundColor: `color-mix(in srgb, ${color} 90%, black)`,
                transformOrigin: '100% 100%'
              }}
            />
          </span>
        </div>
      </div>
      
      {/* Loading Text */}
      {showText && (
        <span 
          className="cube-loading-text block text-center absolute left-0 right-0 z-10"
          style={{
            fontSize: '12px',
            letterSpacing: '0.1em',
            color: color,
            top: halfSize
          }}
        >
          {text}
        </span>
      )}
      
      {/* Shadow */}
      <span 
        className="cube-shadow absolute left-0 right-0 mx-auto z-0"
        style={{
          bottom: '-20px',
          width: size * 1.8,
          height: '6px',
          backgroundColor: 'rgba(0, 0, 0, 0.1)',
          filter: 'blur(2px)',
          borderRadius: '100%'
        }}
      />
    </div>
  );
};

interface CubeLoaderShowcaseProps {
  size?: number;
}

export const CubeLoaderShowcase: React.FC<CubeLoaderShowcaseProps> = ({ size = 50 }) => {
  const colors = [
    { name: 'White', value: '#ffffff' },
    { name: 'Teal', value: '#2FAC9B' },
    { name: 'Purple', value: '#a855f7' },
    { name: 'Blue', value: '#3b82f6' },
    { name: 'Green', value: '#10b981' },
    { name: 'Orange', value: '#f97316' }
  ];
  
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-12">
      {colors.map((color) => (
        <div key={color.value} className="flex flex-col items-center gap-6">
          <div className="bg-[#1c1c1d] rounded-2xl p-8 w-full flex items-center justify-center min-h-[180px]">
            <CubeLoader size={size} color={color.value} />
          </div>
          <div className="text-center">
            <div className="font-semibold text-white">{color.name}</div>
            <div className="text-sm text-gray-400 font-mono">{color.value}</div>
          </div>
        </div>
      ))}
    </div>
  );
};