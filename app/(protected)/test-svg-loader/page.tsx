// app/test-svg-loader/page.tsx
'use client';

import { useState } from 'react';
import { SvgPathLoader, SvgPathLoaderShowcase } from '@/components/ui/svg-path-loader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Shapes, Palette, Timer, Sparkles } from 'lucide-react';

export default function SvgPathLoaderTestPage() {
  const [selectedShape, setSelectedShape] = useState<'circle' | 'triangle' | 'square'>('circle');
  const [loaderSize, setLoaderSize] = useState(44);
  const [duration, setDuration] = useState(3);
  const [pathColor, setPathColor] = useState('#2F3545');
  const [dotColor, setDotColor] = useState('#5628EE');

  const shapes = [
    {
      id: 'circle' as const,
      name: 'Circle',
      desc: 'Smooth circular motion',
      icon: '●'
    },
    {
      id: 'triangle' as const,
      name: 'Triangle',
      desc: 'Three-point corner tracking',
      icon: '▲'
    },
    {
      id: 'square' as const,
      name: 'Square',
      desc: 'Four-corner path animation',
      icon: '■'
    }
  ];

  const colorPresets = [
    { name: 'Original', path: '#2F3545', dot: '#5628EE' },
    { name: 'Purple Dreams', path: '#1e1b4b', dot: '#a855f7' },
    { name: 'Ocean Blue', path: '#0c4a6e', dot: '#06b6d4' },
    { name: 'Forest Green', path: '#14532d', dot: '#10b981' },
    { name: 'Sunset', path: '#7c2d12', dot: '#f97316' },
    { name: 'Monochrome', path: '#18181b', dot: '#71717a' },
    { name: 'Pink Candy', path: '#831843', dot: '#ec4899' },
    { name: 'Golden Hour', path: '#78350f', dot: '#fbbf24' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F5F9FF] to-white dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto p-8 space-y-12">
        {/* Header */}
        <div className="text-center space-y-6 py-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-600 dark:text-purple-400 text-sm mb-4">
            <Sparkles className="w-4 h-4" />
            SVG Path Animation Loaders
          </div>
          <h1 className="text-7xl font-bold bg-gradient-to-r from-purple-600 via-blue-600 to-cyan-600 bg-clip-text text-transparent">
            SVG Path Loaders
          </h1>
          <p className="text-2xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
            Elegantni loader-i sa SVG stroke-dasharray animacijama i dot tracking-om
          </p>
        </div>

        {/* Main Preview */}
        <Card className="shadow-2xl border-0 bg-white dark:bg-gray-800 overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-950/30 dark:to-blue-950/30 border-b">
            <CardTitle className="flex items-center gap-3 text-2xl">
              <div className="p-2 rounded-xl bg-gradient-to-br from-purple-500 to-blue-500 text-white">
                <Shapes className="w-6 h-6" />
              </div>
              Live Preview
            </CardTitle>
            <CardDescription className="text-base">
              Shape: {selectedShape.charAt(0).toUpperCase() + selectedShape.slice(1)}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-16">
            <div className="flex items-center justify-center min-h-[200px] bg-gradient-to-br from-gray-50 to-white dark:from-gray-900 dark:to-gray-800 rounded-2xl">
              <SvgPathLoader
                shape={selectedShape}
                size={loaderSize}
                pathColor={pathColor}
                dotColor={dotColor}
                duration={duration}
              />
            </div>
          </CardContent>
        </Card>

        {/* Controls */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Shape Selection */}
          <Card className="shadow-lg border-0 bg-white dark:bg-gray-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <Shapes className="w-5 h-5 text-purple-500" />
                Shape Selection
              </CardTitle>
              <CardDescription>Izaberite oblik path animacije</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {shapes.map((shape) => (
                <button
                  key={shape.id}
                  onClick={() => setSelectedShape(shape.id)}
                  className={`w-full text-left p-4 rounded-xl border-2 transition-all duration-300 ${
                    selectedShape === shape.id
                      ? 'border-purple-500 bg-purple-50 dark:bg-purple-950/30 shadow-lg scale-102'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-3xl">{shape.icon}</span>
                      <div>
                        <div className="font-semibold">{shape.name}</div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">{shape.desc}</div>
                      </div>
                    </div>
                    {selectedShape === shape.id && (
                      <div className="w-3 h-3 rounded-full bg-purple-500 animate-pulse"></div>
                    )}
                  </div>
                </button>
              ))}
            </CardContent>
          </Card>

          {/* Size & Duration Controls */}
          <div className="space-y-6">
            <Card className="shadow-lg border-0 bg-white dark:bg-gray-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Shapes className="w-5 h-5 text-blue-500" />
                  Size Control
                </CardTitle>
                <CardDescription>Current: {loaderSize}px</CardDescription>
              </CardHeader>
              <CardContent>
                <Slider
                  value={[loaderSize]}
                  onValueChange={(value) => setLoaderSize(value[0])}
                  min={24}
                  max={120}
                  step={4}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-2">
                  <span>24px</span>
                  <span>120px</span>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-lg border-0 bg-white dark:bg-gray-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Timer className="w-5 h-5 text-cyan-500" />
                  Animation Speed
                </CardTitle>
                <CardDescription>Duration: {duration}s</CardDescription>
              </CardHeader>
              <CardContent>
                <Slider
                  value={[duration]}
                  onValueChange={(value) => setDuration(value[0])}
                  min={1}
                  max={8}
                  step={0.5}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-2">
                  <span>1s (Fast)</span>
                  <span>8s (Slow)</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Color Presets */}
        <Card className="shadow-lg border-0 bg-white dark:bg-gray-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <Palette className="w-5 h-5 text-pink-500" />
              Color Presets
            </CardTitle>
            <CardDescription>Brza promena boja za path i dot</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
              {colorPresets.map((preset) => (
                <button
                  key={preset.name}
                  onClick={() => {
                    setPathColor(preset.path);
                    setDotColor(preset.dot);
                  }}
                  className={`p-4 rounded-xl border-2 transition-all duration-300 group ${
                    pathColor === preset.path && dotColor === preset.dot
                      ? 'border-purple-500 bg-purple-50 dark:bg-purple-950/30 scale-105'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                  }`}
                >
                  <div className="flex flex-col items-center gap-2">
                    <div className="flex gap-1">
                      <div 
                        className="w-5 h-5 rounded-full border-2 border-white shadow-sm"
                        style={{ backgroundColor: preset.path }}
                      />
                      <div 
                        className="w-5 h-5 rounded-full border-2 border-white shadow-sm"
                        style={{ backgroundColor: preset.dot }}
                      />
                    </div>
                    <span className="text-xs font-medium text-center line-clamp-2">
                      {preset.name}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* All Shapes Showcase */}
        <Card className="shadow-lg border-0 bg-white dark:bg-gray-800">
          <CardHeader>
            <CardTitle>All Shapes</CardTitle>
            <CardDescription>
              Prikaz svih oblika sa trenutnim color preset-om
            </CardDescription>
          </CardHeader>
          <CardContent className="p-12">
            <SvgPathLoaderShowcase
              size={loaderSize}
              pathColor={pathColor}
              dotColor={dotColor}
              duration={duration}
            />
          </CardContent>
        </Card>

        {/* Usage Examples */}
        <Card className="shadow-lg border-0 bg-white dark:bg-gray-800">
          <CardHeader>
            <CardTitle>Kako Koristiti</CardTitle>
            <CardDescription>Primeri implementacije u vašoj aplikaciji</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-3">
              <h3 className="font-semibold text-lg text-purple-600 dark:text-purple-400">1. Single Loader</h3>
              <div className="bg-gray-900 rounded-lg p-4 font-mono text-sm overflow-x-auto">
                <pre className="text-green-400">
{`import { SvgPathLoader } from '@/components/ui/svg-path-loader';

<SvgPathLoader 
  shape="circle"
  size={44}
  pathColor="#2F3545"
  dotColor="#5628EE"
  duration={3}
/>`}
                </pre>
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="font-semibold text-lg text-blue-600 dark:text-blue-400">2. Showcase All Shapes</h3>
              <div className="bg-gray-900 rounded-lg p-4 font-mono text-sm overflow-x-auto">
                <pre className="text-green-400">
{`import { SvgPathLoaderShowcase } from '@/components/ui/svg-path-loader';

<SvgPathLoaderShowcase
  size={44}
  pathColor="#2F3545"
  dotColor="#5628EE"
  duration={3}
/>`}
                </pre>
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="font-semibold text-lg text-cyan-600 dark:text-cyan-400">3. In Loading State</h3>
              <div className="bg-gray-900 rounded-lg p-4 font-mono text-sm overflow-x-auto">
                <pre className="text-green-400">
{`{isLoading && (
  <div className="flex items-center justify-center p-8">
    <SvgPathLoader shape="triangle" size={60} />
  </div>
)}`}
                </pre>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8 pt-6 border-t">
              <div>
                <h4 className="font-semibold mb-3 text-orange-600 dark:text-orange-400">Props</h4>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start gap-2">
                    <code className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded text-xs">shape</code>
                    <span className="text-gray-600 dark:text-gray-400">'circle' | 'triangle' | 'square'</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <code className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded text-xs">size</code>
                    <span className="text-gray-600 dark:text-gray-400">number (default: 44)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <code className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded text-xs">pathColor</code>
                    <span className="text-gray-600 dark:text-gray-400">hex/rgba string</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <code className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded text-xs">dotColor</code>
                    <span className="text-gray-600 dark:text-gray-400">hex/rgba string</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <code className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded text-xs">duration</code>
                    <span className="text-gray-600 dark:text-gray-400">number (seconds)</span>
                  </li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-3 text-green-600 dark:text-green-400">Features</h4>
                <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                  <li className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    SVG stroke-dasharray animations
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    Synchronized dot tracking
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    Cubic bezier easing
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    3 geometric shapes
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    Fully customizable colors
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    Adjustable speed
                  </li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center py-8 text-gray-500 text-sm space-y-2">
          <p>SVG Path Animation Loaders • Pure CSS + SVG</p>
          <p className="text-xs">Implementirano u Next.js sa React komponenama</p>
        </div>
      </div>
    </div>
  );
}