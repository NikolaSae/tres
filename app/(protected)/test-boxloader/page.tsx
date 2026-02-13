'use client';
import React, { useState } from 'react';
import { Slider } from '@/components/ui/slider';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Box, Palette, Sparkles, Zap, Layers } from 'lucide-react';

// 3D Boxes Loader Component
interface BoxesLoaderProps {
  primaryColor?: string;
  size?: number;
  speed?: number;
}

const BoxesLoader: React.FC<BoxesLoaderProps> = ({
  primaryColor = 'rgba(39, 94, 254, 1)',
  size = 1,
  speed = 3
}) => {
  const primaryLight = primaryColor.replace(/rgba?\((\d+),\s*(\d+),\s*(\d+).*\)/, (_, r, g, b) => {
    return `rgb(${Math.min(255, parseInt(r) + 30)}, ${Math.min(255, parseInt(g) + 30)}, ${Math.min(255, parseInt(b) + 30)})`;
  });
  
  const primaryRgba = primaryColor.replace(/[\d.]+\)$/g, '0)');

  return (
    <div style={{ transform: `scale(${size})`, transformOrigin: 'center' }}>
      <style>{`
        @keyframes mask-anim {
          0%, 65% { opacity: 0; }
          66%, 100% { opacity: 1; }
        }
        
        @keyframes ground-anim {
          0%, 65% {
            transform: rotateX(90deg) rotateY(0deg) translate(-48px, -120px) translateZ(100px) scale(0);
          }
          75%, 90% {
            transform: rotateX(90deg) rotateY(0deg) translate(-48px, -120px) translateZ(100px) scale(1);
          }
          100% {
            transform: rotateX(90deg) rotateY(0deg) translate(-48px, -120px) translateZ(100px) scale(0);
          }
        }
        
        @keyframes ground-shine-anim {
          0%, 70% { opacity: 0; }
          75%, 87% { opacity: 0.2; }
          100% { opacity: 0; }
        }
        
        ${[0, 1, 2, 3, 4, 5, 6, 7].map(i => {
          const delay = i * 4;
          return `
            @keyframes box-move${i} {
              ${12 + delay}% {
                transform: translate(var(--x), var(--y));
              }
              ${25 + delay}%, 52% {
                transform: translate(0, 0);
              }
              80% {
                transform: translate(0, -32px);
              }
              90%, 100% {
                transform: translate(0, 188px);
              }
            }
            
            @keyframes box-scale${i} {
              ${6 + delay}% {
                transform: rotateY(-47deg) rotateX(-15deg) rotateZ(15deg) scale(0);
              }
              ${14 + delay}%, 100% {
                transform: rotateY(-47deg) rotateX(-15deg) rotateZ(15deg) scale(1);
              }
            }
            
            .boxes-loader-box${i} {
              animation: box-move${i} ${speed}s linear forwards infinite;
            }
            
            .boxes-loader-box${i} > div {
              animation: box-scale${i} ${speed}s ease forwards infinite;
            }
          `;
        }).join('\n')}
        
        .boxes-loader-mask {
          animation: mask-anim ${speed}s linear forwards infinite;
        }
        
        .boxes-loader-ground-main {
          animation: ground-anim ${speed}s linear forwards infinite;
        }
        
        .boxes-loader-ground-shine {
          animation: ground-shine-anim ${speed}s linear forwards infinite;
        }
      `}</style>
      
      <div 
        className="relative"
        style={{
          width: '200px',
          height: '320px',
          transformStyle: 'preserve-3d'
        }}
      >
        {/* Mask elements */}
        <div
          className="boxes-loader-mask absolute"
          style={{
            content: '',
            width: '320px',
            height: '140px',
            right: '32%',
            bottom: '-11px',
            background: '#121621',
            transform: 'translateZ(200px) rotate(20.5deg)',
            opacity: 0
          }}
        />
        <div
          className="boxes-loader-mask absolute"
          style={{
            content: '',
            width: '320px',
            height: '140px',
            left: '32%',
            bottom: '-11px',
            background: '#121621',
            transform: 'translateZ(200px) rotate(-20.5deg)',
            opacity: 0
          }}
        />
        
        {/* Ground */}
        <div
          className="absolute"
          style={{
            left: '-50px',
            bottom: '-120px',
            transformStyle: 'preserve-3d',
            transform: 'rotateY(-47deg) rotateX(-15deg) rotateZ(15deg) scale(1)'
          }}
        >
          <div
            className="boxes-loader-ground-main relative"
            style={{
              width: '200px',
              height: '200px',
              background: `linear-gradient(45deg, ${primaryColor} 0%, ${primaryColor} 50%, ${primaryLight} 50%, ${primaryLight} 100%)`,
              transformStyle: 'preserve-3d',
              transform: 'rotateX(90deg) rotateY(0deg) translate(-48px, -120px) translateZ(100px) scale(0)'
            }}
          >
            {/* Ground shine effects */}
            <div
              className="boxes-loader-ground-shine absolute"
              style={{
                width: '156px',
                height: '300px',
                opacity: 0,
                background: `linear-gradient(${primaryColor}, ${primaryRgba})`,
                transform: 'rotateX(90deg) rotateY(0deg) translate(44px, 162px) translateZ(-50px)'
              }}
            />
            <div
              className="boxes-loader-ground-shine absolute"
              style={{
                width: '156px',
                height: '300px',
                opacity: 0,
                background: `linear-gradient(${primaryColor}, ${primaryRgba})`,
                transform: 'rotateX(90deg) rotateY(90deg) translate(0, 177px) translateZ(150px)'
              }}
            />
          </div>
        </div>
        
        {/* 8 Boxes */}
        {[
          { x: -220, y: -120, left: 58, top: 108 },
          { x: -260, y: 120, left: 25, top: 120 },
          { x: 120, y: -190, left: 58, top: 64 },
          { x: 280, y: -40, left: 91, top: 120 },
          { x: 60, y: 200, left: 58, top: 132 },
          { x: -220, y: -120, left: 25, top: 76 },
          { x: -260, y: 120, left: 91, top: 76 },
          { x: -240, y: 200, left: 58, top: 87 }
        ].map((box, i) => (
          <div
            key={i}
            className={`boxes-loader-box${i} absolute`}
            style={{
              '--x': `${box.x}px`,
              '--y': `${box.y}px`,
              left: `${box.left}px`,
              top: `${box.top}px`,
              transform: 'translate(var(--x), var(--y))'
            } as React.CSSProperties}
          >
            <div
              className="relative"
              style={{
                backgroundColor: primaryColor,
                width: '48px',
                height: '48px',
                transformStyle: 'preserve-3d',
                transform: 'rotateY(-47deg) rotateX(-15deg) rotateZ(15deg) scale(0)'
              }}
            >
              {/* Top face */}
              <div
                className="absolute"
                style={{
                  backgroundColor: primaryColor,
                  width: '48px',
                  height: '48px',
                  transform: 'rotateX(90deg) rotateY(0deg) translate(0, -24px) translateZ(24px)',
                  filter: 'brightness(1.2)'
                }}
              />
              {/* Side face */}
              <div
                className="absolute"
                style={{
                  backgroundColor: primaryColor,
                  width: '48px',
                  height: '48px',
                  transform: 'rotateX(0deg) rotateY(90deg) translate(24px, 0) translateZ(24px)',
                  filter: 'brightness(1.4)'
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Showcase Component
interface BoxesLoaderShowcaseProps {
  size?: number;
  speed?: number;
}

const BoxesLoaderShowcase: React.FC<BoxesLoaderShowcaseProps> = ({ 
  size = 1, 
  speed = 3 
}) => {
  const colors = [
    { name: 'Blue', value: 'rgba(39, 94, 254, 1)' },
    { name: 'Purple', value: 'rgba(168, 85, 247, 1)' },
    { name: 'Cyan', value: 'rgba(6, 182, 212, 1)' },
    { name: 'Green', value: 'rgba(16, 185, 129, 1)' },
    { name: 'Orange', value: 'rgba(249, 115, 22, 1)' },
    { name: 'Pink', value: 'rgba(236, 72, 153, 1)' }
  ];
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
      {colors.map((color) => (
        <div key={color.value} className="flex flex-col items-center gap-6">
          <div className="bg-[#121621] rounded-2xl p-8 w-full flex items-center justify-center min-h-[400px]">
            <BoxesLoader primaryColor={color.value} size={size} speed={speed} />
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

// Main Test Page
export default function BoxesLoaderTestPage() {
  const [loaderSize, setLoaderSize] = useState(1);
  const [loaderSpeed, setLoaderSpeed] = useState(3);
  const [loaderColor, setLoaderColor] = useState('rgba(39, 94, 254, 1)');

  const colorPresets = [
    { name: 'Original Blue', value: 'rgba(39, 94, 254, 1)' },
    { name: 'Purple', value: 'rgba(168, 85, 247, 1)' },
    { name: 'Cyan', value: 'rgba(6, 182, 212, 1)' },
    { name: 'Green', value: 'rgba(16, 185, 129, 1)' },
    { name: 'Orange', value: 'rgba(249, 115, 22, 1)' },
    { name: 'Pink', value: 'rgba(236, 72, 153, 1)' },
    { name: 'Red', value: 'rgba(239, 68, 68, 1)' },
    { name: 'Yellow', value: 'rgba(234, 179, 8, 1)' },
    { name: 'Teal', value: 'rgba(20, 184, 166, 1)' },
    { name: 'Indigo', value: 'rgba(99, 102, 241, 1)' }
  ];

  return (
    <div className="min-h-screen bg-[#121621] text-white">
      <div className="container mx-auto p-8 space-y-12">
        {/* Header */}
        <div className="text-center space-y-6 py-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm mb-4">
            <Sparkles className="w-4 h-4" />
            Advanced 3D CSS Animation
          </div>
          <h1 className="text-7xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-500 bg-clip-text text-transparent">
            3D Boxes Loader
          </h1>
          <p className="text-2xl text-gray-400 max-w-3xl mx-auto">
            8 kutija koje se slažu u 3D perspektivi sa dinamičkim transform animacijama
          </p>
        </div>

        {/* Main Preview */}
        <Card className="shadow-2xl border-0 bg-gray-800/50 backdrop-blur-xl overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border-b border-blue-500/20">
            <CardTitle className="flex items-center gap-3 text-2xl text-white">
              <div className="p-2 rounded-xl bg-gradient-to-br from-blue-500 to-purple-500 text-white">
                <Zap className="w-6 h-6" />
              </div>
              Live Preview
            </CardTitle>
            <CardDescription className="text-gray-400 text-base">
              8 animated boxes • 3D perspective • Ground platform • Dynamic transforms
            </CardDescription>
          </CardHeader>
          <CardContent className="p-16">
            <div className="flex items-center justify-center min-h-[400px] bg-[#121621] rounded-2xl">
              <BoxesLoader
                primaryColor={loaderColor}
                size={loaderSize}
                speed={loaderSpeed}
              />
            </div>
          </CardContent>
        </Card>

        {/* Controls */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Size Control */}
          <Card className="shadow-lg border-0 bg-gray-800/50 backdrop-blur-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-white">
                <Box className="w-5 h-5 text-cyan-400" />
                Loader Scale
              </CardTitle>
              <CardDescription className="text-gray-400">Current: {loaderSize.toFixed(2)}x</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Slider
                value={[loaderSize]}
                onValueChange={(value) => setLoaderSize(value[0])}
                min={0.5}
                max={1.5}
                step={0.05}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-500">
                <span>0.5x</span>
                <span>1.5x</span>
              </div>
            </CardContent>
          </Card>

          {/* Speed Control */}
          <Card className="shadow-lg border-0 bg-gray-800/50 backdrop-blur-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-white">
                <Layers className="w-5 h-5 text-purple-400" />
                Animation Speed
              </CardTitle>
              <CardDescription className="text-gray-400">Duration: {loaderSpeed}s</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Slider
                value={[loaderSpeed]}
                onValueChange={(value) => setLoaderSpeed(value[0])}
                min={1}
                max={6}
                step={0.5}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-500">
                <span>Fast (1s)</span>
                <span>Slow (6s)</span>
              </div>
            </CardContent>
          </Card>

          {/* Info Card */}
          <Card className="shadow-lg border-0 bg-gradient-to-br from-blue-500/10 to-purple-500/10 backdrop-blur-xl border border-blue-500/20">
            <CardHeader>
              <CardTitle className="text-lg text-blue-400">Animation Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-gray-300">
              <div className="flex justify-between">
                <span className="text-gray-400">Boxes:</span>
                <span className="font-mono">8</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Perspective:</span>
                <span className="font-mono">preserve-3d</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Transform:</span>
                <span className="font-mono text-xs">rotateY/X/Z</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Faces:</span>
                <span className="font-mono">3 per box</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Color Presets */}
        <Card className="shadow-lg border-0 bg-gray-800/50 backdrop-blur-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-white">
              <Palette className="w-5 h-5 text-pink-400" />
              Color Presets
            </CardTitle>
            <CardDescription className="text-gray-400">Brza promena boje loader-a</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-5 md:grid-cols-10 gap-3">
              {colorPresets.map((preset) => (
                <button
                  key={preset.value}
                  onClick={() => setLoaderColor(preset.value)}
                  className={`group relative p-3 rounded-xl border-2 transition-all duration-300 ${
                    loaderColor === preset.value
                      ? 'border-blue-400 bg-blue-400/10 scale-110'
                      : 'border-gray-700 hover:border-gray-600'
                  }`}
                  title={preset.name}
                >
                  <div 
                    className="w-full aspect-square rounded-lg"
                    style={{ backgroundColor: preset.value }}
                  />
                  {loaderColor === preset.value && (
                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-blue-400 rounded-full animate-pulse"></div>
                  )}
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="text-xs font-medium px-2 py-1 bg-black/80 rounded whitespace-nowrap">
                      {preset.name}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Technical Breakdown */}
        <Card className="shadow-lg border-0 bg-gray-800/50 backdrop-blur-xl">
          <CardHeader>
            <CardTitle className="text-white">Kako Funkcioniše</CardTitle>
            <CardDescription className="text-gray-400">
              Tehnički detalji 3D boxes animacije
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <h3 className="font-semibold text-lg text-cyan-400">Box Structure</h3>
                <ul className="space-y-2 text-sm text-gray-300">
                  <li className="flex items-start gap-2">
                    <span className="text-cyan-400 mt-0.5">•</span>
                    <span><strong>8 Box elemenata</strong> - svaki sa različitim starting position</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-cyan-400 mt-0.5">•</span>
                    <span><strong>3 strane (faces)</strong> - main, top, side sa brightness filter</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-cyan-400 mt-0.5">•</span>
                    <span><strong>preserve-3d</strong> - omogućava 3D prostor za child elemente</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-cyan-400 mt-0.5">•</span>
                    <span><strong>Staggered delays</strong> - svaki box kreće sa 4% offsetom</span>
                  </li>
                </ul>
              </div>
              
              <div className="space-y-3">
                <h3 className="font-semibold text-lg text-purple-400">Animation Phases</h3>
                <div className="bg-black/30 rounded-lg p-4 font-mono text-xs text-gray-300 space-y-1">
                  <div><span className="text-cyan-400">Phase 1:</span> Dolaze sa različitih pozicija</div>
                  <div><span className="text-green-400">Phase 2:</span> Scale od 0 do 1 (pojavljuju se)</div>
                  <div><span className="text-yellow-400">Phase 3:</span> Svi se centriraju na (0, 0)</div>
                  <div><span className="text-orange-400">Phase 4:</span> Dizanje na -32px (lift)</div>
                  <div><span className="text-pink-400">Phase 5:</span> Padaju na 188px (ground)</div>
                  <div className="mt-3 pt-3 border-t border-gray-700">
                    <span className="text-blue-400">Ground:</span> Pojavljuje se pre pada
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-gray-700">
              <h3 className="font-semibold text-lg text-green-400 mb-3">Advanced Features</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-300">
                <div className="bg-black/20 rounded-lg p-4">
                  <div className="font-semibold text-white mb-2">🎯 Ground Platform</div>
                  <div>Gradient ground sa shine efektima za realističan 3D look</div>
                </div>
                <div className="bg-black/20 rounded-lg p-4">
                  <div className="font-semibold text-white mb-2">🎭 Mask Effect</div>
                  <div>Dva masking elementa sakrivaju boxove tokom prelaza</div>
                </div>
                <div className="bg-black/20 rounded-lg p-4">
                  <div className="font-semibold text-white mb-2">💡 Brightness</div>
                  <div>Top: 1.2x, Side: 1.4x za 3D dubinu</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Showcase */}
        <Card className="shadow-lg border-0 bg-gray-800/50 backdrop-blur-xl">
          <CardHeader>
            <CardTitle className="text-white">Color Variations</CardTitle>
            <CardDescription className="text-gray-400">
              Prikaz loader-a u različitim bojama
            </CardDescription>
          </CardHeader>
          <CardContent className="p-12">
            <BoxesLoaderShowcase size={loaderSize} speed={loaderSpeed} />
          </CardContent>
        </Card>

        {/* Usage Examples */}
        <Card className="shadow-lg border-0 bg-gray-800/50 backdrop-blur-xl">
          <CardHeader>
            <CardTitle className="text-white">Kako Koristiti</CardTitle>
            <CardDescription className="text-gray-400">Primeri implementacije</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-3">
              <h3 className="font-semibold text-lg text-cyan-400">1. Basic Loader</h3>
              <div className="bg-black/30 rounded-lg p-4 font-mono text-sm overflow-x-auto">
                <pre className="text-green-400">
{`import { BoxesLoader } from '@/components/ui/boxes-loader';

<BoxesLoader 
  primaryColor="rgba(39, 94, 254, 1)"
  size={1}
  speed={3}
/>`}
                </pre>
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="font-semibold text-lg text-purple-400">2. Color Showcase</h3>
              <div className="bg-black/30 rounded-lg p-4 font-mono text-sm overflow-x-auto">
                <pre className="text-green-400">
{`import { BoxesLoaderShowcase } from '@/components/ui/boxes-loader';

<BoxesLoaderShowcase 
  size={1}
  speed={3}
/>`}
                </pre>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8 pt-6 border-t border-gray-700">
              <div>
                <h4 className="font-semibold mb-3 text-orange-400">Props</h4>
                <ul className="space-y-2 text-sm text-gray-300">
                  <li className="flex gap-2">
                    <code className="bg-gray-700 px-2 py-1 rounded text-xs">primaryColor</code>
                    <span className="text-gray-400">rgba string</span>
                  </li>
                  <li className="flex gap-2">
                    <code className="bg-gray-700 px-2 py-1 rounded text-xs">size</code>
                    <span className="text-gray-400">scale multiplier (0.5-1.5)</span>
                  </li>
                  <li className="flex gap-2">
                    <code className="bg-gray-700 px-2 py-1 rounded text-xs">speed</code>
                    <span className="text-gray-400">animation duration (1-6s)</span>
                  </li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-3 text-green-400">Features</h4>
                <ul className="space-y-1 text-sm text-gray-300">
                  <li>• 8 animated 3D boxes</li>
                  <li>• Ground platform with shine</li>
                  <li>• Staggered animation delays</li>
                  <li>• 3 faces per box (main, top, side)</li>
                  <li>• Mask effect for smooth transitions</li>
                  <li>• Fully customizable colors & speed</li>
                  <li>• Responsive scaling</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center text-sm text-gray-600 pt-12 pb-6 border-t border-gray-800">
          <p>
            Original design by{' '}
            <a 
              href="https://dribbble.com/shots/7227469-3D-Boxes-Loader" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-400 hover:underline"
            >
              Dribbble
            </a>
            {' '}• Built with React & Tailwind CSS
          </p>
          <p className="mt-2">Advanced 3D CSS Transforms & Animations</p>
        </div>
      </div>
    </div>
  );
}