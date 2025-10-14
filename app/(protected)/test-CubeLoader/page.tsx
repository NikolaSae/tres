'use client';

import React, { useState } from 'react';
import { Slider } from '@/components/ui/slider';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Box, Palette, Sparkles, Type, Zap } from 'lucide-react';

// Cube Loader Component
interface CubeLoaderProps {
  size?: number;
  color?: string;
  showText?: boolean;
  text?: string;
}

const CubeLoader: React.FC<CubeLoaderProps> = ({
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
          content: "";
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
              className="absolute left-0 top-0 block before:content-['']"
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
              className="absolute left-0 top-0 block before:content-['']"
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
              className="absolute left-0 top-0 block before:content-['']"
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
              className="absolute left-0 top-0 block before:content-['']"
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

// Showcase Component
interface CubeLoaderShowcaseProps {
  size?: number;
}

const CubeLoaderShowcase: React.FC<CubeLoaderShowcaseProps> = ({ size = 50 }) => {
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

// Main Test Page
export default function CubeLoaderTestPage() {
  const [loaderSize, setLoaderSize] = useState(50);
  const [loaderColor, setLoaderColor] = useState('#ffffff');
  const [showText, setShowText] = useState(true);
  const [loadingText, setLoadingText] = useState('Loading');

  const colorPresets = [
    { name: 'White', value: '#ffffff' },
    { name: 'Teal', value: '#2FAC9B' },
    { name: 'Purple', value: '#a855f7' },
    { name: 'Blue', value: '#3b82f6' },
    { name: 'Green', value: '#10b981' },
    { name: 'Orange', value: '#f97316' },
    { name: 'Pink', value: '#ec4899' },
    { name: 'Cyan', value: '#06b6d4' },
    { name: 'Red', value: '#ef4444' },
    { name: 'Yellow', value: '#eab308' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-[#0072ff] to-cyan-500 text-white">
      <div className="container mx-auto p-8 space-y-12">
        {/* Header */}
        <div className="text-center space-y-6 py-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/20 text-white text-sm mb-4">
            <Sparkles className="w-4 h-4" />
            3D CSS Transform Animation
          </div>
          <h1 className="text-7xl font-bold">
            Cube Flipping Loader
          </h1>
          <p className="text-2xl text-white/80 max-w-3xl mx-auto">
            3D perspektivna animacija sa 4 cube leaf-a i cubic-bezier easing funkcijom
          </p>
        </div>

        {/* Main Preview */}
        <Card className="shadow-2xl border-0 bg-white/10 backdrop-blur-xl overflow-hidden">
          <CardHeader className="bg-white/5 border-b border-white/10">
            <CardTitle className="flex items-center gap-3 text-2xl text-white">
              <div className="p-2 rounded-xl bg-gradient-to-br from-white/20 to-white/10 text-white">
                <Zap className="w-6 h-6" />
              </div>
              Live Preview
            </CardTitle>
            <CardDescription className="text-white/70 text-base">
              Cube folding animation • 4 leaves • 3D perspective transform
            </CardDescription>
          </CardHeader>
          <CardContent className="p-16">
            <div className="flex items-center justify-center min-h-[200px] bg-black/30 rounded-2xl backdrop-blur-sm">
              <CubeLoader
                size={loaderSize}
                color={loaderColor}
                showText={showText}
                text={loadingText}
              />
            </div>
          </CardContent>
        </Card>

        {/* Controls */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Size Control */}
          <Card className="shadow-lg border-0 bg-white/10 backdrop-blur-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-white">
                <Box className="w-5 h-5 text-cyan-300" />
                Cube Size
              </CardTitle>
              <CardDescription className="text-white/70">Current: {loaderSize}px</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Slider
                value={[loaderSize]}
                onValueChange={(value) => setLoaderSize(value[0])}
                min={30}
                max={100}
                step={5}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-white/60">
                <span>30px</span>
                <span>100px</span>
              </div>
            </CardContent>
          </Card>

          {/* Text Controls */}
          <Card className="shadow-lg border-0 bg-white/10 backdrop-blur-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-white">
                <Type className="w-5 h-5 text-purple-300" />
                Loading Text
              </CardTitle>
              <CardDescription className="text-white/70">Customize loader text</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showText}
                    onChange={(e) => setShowText(e.target.checked)}
                    className="w-4 h-4 rounded accent-cyan-400"
                  />
                  <span className="text-white">Show Text</span>
                </label>
              </div>
              <input
                type="text"
                value={loadingText}
                onChange={(e) => setLoadingText(e.target.value)}
                disabled={!showText}
                placeholder="Loading"
                className="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/40 disabled:opacity-50"
              />
            </CardContent>
          </Card>
        </div>

        {/* Color Presets */}
        <Card className="shadow-lg border-0 bg-white/10 backdrop-blur-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-white">
              <Palette className="w-5 h-5 text-pink-300" />
              Color Presets
            </CardTitle>
            <CardDescription className="text-white/70">Brza promena boje cube-a</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-5 md:grid-cols-10 gap-3">
              {colorPresets.map((preset) => (
                <button
                  key={preset.value}
                  onClick={() => setLoaderColor(preset.value)}
                  className={`group relative p-3 rounded-xl border-2 transition-all duration-300 ${
                    loaderColor === preset.value
                      ? 'border-white bg-white/20 scale-110'
                      : 'border-white/30 hover:border-white/50'
                  }`}
                  title={preset.name}
                >
                  <div 
                    className="w-full aspect-square rounded-lg"
                    style={{ backgroundColor: preset.value }}
                  />
                  {loaderColor === preset.value && (
                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-white rounded-full animate-pulse shadow-lg shadow-white/50"></div>
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

        {/* Animation Details */}
        <Card className="shadow-lg border-0 bg-white/10 backdrop-blur-xl">
          <CardHeader>
            <CardTitle className="text-white">Animation Details</CardTitle>
            <CardDescription className="text-white/70">
              Kako funkcioniše cube folding animacija
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <h3 className="font-semibold text-lg text-cyan-300">Struktura</h3>
                <ul className="space-y-2 text-sm text-white/80">
                  <li className="flex items-start gap-2">
                    <span className="text-cyan-400 mt-0.5">•</span>
                    <span><strong>4 Leaf elementa</strong> - svaki predstavlja jednu stranu kocke</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-cyan-400 mt-0.5">•</span>
                    <span><strong>45° rotacija</strong> - ceo wrapper je rotiran za dijamantski efekat</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-cyan-400 mt-0.5">•</span>
                    <span><strong>Scale(1.1)</strong> - svaki leaf je uvećan za smooth prelaz</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-cyan-400 mt-0.5">•</span>
                    <span><strong>Transform-origin</strong> - 100% 100% za rotaciju iz ugla</span>
                  </li>
                </ul>
              </div>
              
              <div className="space-y-3">
                <h3 className="font-semibold text-lg text-purple-300">Keyframes</h3>
                <div className="bg-black/30 rounded-lg p-4 font-mono text-xs text-white/90 space-y-1">
                  <div><span className="text-cyan-400">0-10%:</span> rotateX(-180deg), opacity 0</div>
                  <div><span className="text-green-400">25-75%:</span> rotateX(0deg), opacity 1</div>
                  <div><span className="text-orange-400">90-100%:</span> rotateY(180deg), opacity 0</div>
                  <div className="mt-3 pt-3 border-t border-white/20">
                    <span className="text-pink-400">Duration:</span> 2.5s infinite linear
                  </div>
                  <div><span className="text-yellow-400">Delays:</span> 0s, 0.3s, 0.6s, 0.9s</div>
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-white/20">
              <h3 className="font-semibold text-lg text-green-300 mb-3">Dodatni Efekti</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-white/80">
                <div className="bg-black/20 rounded-lg p-4">
                  <div className="font-semibold text-white mb-2">💬 Loading Text</div>
                  <div>Vertikalna animacija (0.5s ease alternate) za "breathing" efekat</div>
                </div>
                <div className="bg-black/20 rounded-lg p-4">
                  <div className="font-semibold text-white mb-2">🌑 Shadow</div>
                  <div>Blur shadow koji se širi/skuplja sinhronizovano sa tekstom</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Showcase */}
        <Card className="shadow-lg border-0 bg-white/10 backdrop-blur-xl">
          <CardHeader>
            <CardTitle className="text-white">Color Variations</CardTitle>
            <CardDescription className="text-white/70">
              Prikaz cube loader-a u različitim bojama
            </CardDescription>
          </CardHeader>
          <CardContent className="p-12">
            <CubeLoaderShowcase size={loaderSize} />
          </CardContent>
        </Card>

        {/* Usage Examples */}
        <Card className="shadow-lg border-0 bg-white/10 backdrop-blur-xl">
          <CardHeader>
            <CardTitle className="text-white">Kako Koristiti</CardTitle>
            <CardDescription className="text-white/70">Primeri implementacije</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-3">
              <h3 className="font-semibold text-lg text-cyan-300">1. Basic Loader</h3>
              <div className="bg-black/30 rounded-lg p-4 font-mono text-sm overflow-x-auto">
                <pre className="text-green-300">
{`import { CubeLoader } from '@/components/ui/cube-loader';

<CubeLoader 
  size={50}
  color="#ffffff"
  showText={true}
  text="Loading"
/>`}
                </pre>
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="font-semibold text-lg text-purple-300">2. Showcase All Colors</h3>
              <div className="bg-black/30 rounded-lg p-4 font-mono text-sm overflow-x-auto">
                <pre className="text-green-300">
{`import { CubeLoaderShowcase } from '@/components/ui/cube-loader';

<CubeLoaderShowcase size={50} />`}
                </pre>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8 pt-6 border-t border-white/20">
              <div>
                <h4 className="font-semibold mb-3 text-orange-300">Props</h4>
                <ul className="space-y-2 text-sm text-white/80">
                  <li className="flex gap-2">
                    <code className="bg-black/30 px-2 py-1 rounded text-xs">size</code>
                    <span className="text-white/60">number (default: 50px)</span>
                  </li>
                  <li className="flex gap-2">
                    <code className="bg-black/30 px-2 py-1 rounded text-xs">color</code>
                    <span className="text-white/60">hex string (default: '#ffffff')</span>
                  </li>
                  <li className="flex gap-2">
                    <code className="bg-black/30 px-2 py-1 rounded text-xs">showText</code>
                    <span className="text-white/60">boolean (default: true)</span>
                  </li>
                  <li className="flex gap-2">
                    <code className="bg-black/30 px-2 py-1 rounded text-xs">text</code>
                    <span className="text-white/60">string (default: 'Loading')</span>
                  </li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-3 text-green-300">Features</h4>
                <ul className="space-y-1 text-sm text-white/80">
                  <li>• 3D perspective transform (140px)</li>
                  <li>• 4 animated leaves with delays</li>
                  <li>• Smooth rotateX/rotateY transitions</li>
                  <li>• Breathing text animation</li>
                  <li>• Dynamic shadow effect</li>
                  <li>• Fully customizable colors</li>
                  <li>• Responsive sizing</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center text-sm text-white/60 pt-12 pb-6 border-t border-white/20">
          <p>
            Original design by{' '}
            <a 
              href="https://codepen.io/nikhil8krishnan" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-white hover:underline"
            >
              Nikhil Krishnan
            </a>
            {' '}• Adapted with React & Tailwind CSS
          </p>
          <p className="mt-2">Made with ♥ for modern web applications</p>
        </div>
      </div>
    </div>
  );
}