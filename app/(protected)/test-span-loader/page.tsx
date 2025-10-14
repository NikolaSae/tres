// app/test-span-loader/page.tsx
'use client';

import { useState } from 'react';
import { SpanLoader, SpanLoaderShowcase } from '@/components/ui/span-loader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Grid3x3, Palette, Sparkles, Zap } from 'lucide-react';

export default function SpanLoaderTestPage() {
  const [selectedVariant, setSelectedVariant] = useState<'loader1' | 'loader2' | 'loader3' | 'loader4' | 'loader5' | 'loader6' | 'loader7'>('loader1');
  const [loaderSize, setLoaderSize] = useState(15);
  const [loaderColor, setLoaderColor] = useState('#2FAC9B');

  const variants = [
    {
      id: 'loader1' as const,
      name: 'Scale Pulse',
      desc: 'Circles scaling in sequence',
      spans: 5,
      animation: 'scale',
      icon: '○'
    },
    {
      id: 'loader2' as const,
      name: '3D Rotate Y',
      desc: 'Horizontal axis rotation',
      spans: 5,
      animation: 'rotateY',
      icon: '◐'
    },
    {
      id: 'loader3' as const,
      name: '3D Rotate X',
      desc: 'Vertical axis flip',
      spans: 5,
      animation: 'rotateX',
      icon: '◑'
    },
    {
      id: 'loader4' as const,
      name: 'Bounce Push',
      desc: 'Vertical bounce effect',
      spans: 5,
      animation: 'push',
      icon: '●'
    },
    {
      id: 'loader5' as const,
      name: 'Pendulum',
      desc: 'Swinging bars effect',
      spans: 10,
      animation: 'rotateZ',
      icon: '║'
    },
    {
      id: 'loader6' as const,
      name: 'Perspective Curve',
      desc: '3D flip with perspective',
      spans: 5,
      animation: 'curve',
      icon: '▭'
    },
    {
      id: 'loader7' as const,
      name: 'Vertical Wave',
      desc: 'Stretching wave pattern',
      spans: 20,
      animation: 'temp',
      icon: '▪'
    }
  ];

  const colorPresets = [
    { name: 'Original Teal', value: '#2FAC9B' },
    { name: 'Purple', value: '#a855f7' },
    { name: 'Blue', value: '#3b82f6' },
    { name: 'Green', value: '#10b981' },
    { name: 'Orange', value: '#f97316' },
    { name: 'Pink', value: '#ec4899' },
    { name: 'Cyan', value: '#06b6d4' },
    { name: 'Red', value: '#ef4444' },
    { name: 'Yellow', value: '#eab308' },
    { name: 'Indigo', value: '#6366f1' }
  ];

  const currentVariant = variants.find(v => v.id === selectedVariant);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-[#1c1c1d] to-black text-white">
      <div className="container mx-auto p-8 space-y-12">
        {/* Header */}
        <div className="text-center space-y-6 py-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-teal-500/10 border border-teal-500/20 text-teal-400 text-sm mb-4">
            <Sparkles className="w-4 h-4" />
            Span-based CSS Animations
          </div>
          <h1 className="text-7xl font-bold bg-gradient-to-r from-teal-400 via-cyan-400 to-blue-500 bg-clip-text text-transparent">
            Span Animation Loaders
          </h1>
          <p className="text-2xl text-gray-400 max-w-3xl mx-auto">
            7 različitih CSS animacija sa span elementima i cubic-bezier easing funkcijama
          </p>
        </div>

        {/* Main Preview */}
        <Card className="shadow-2xl border-0 bg-gray-800/50 backdrop-blur overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-teal-500/10 to-cyan-500/10 border-b border-teal-500/20">
            <CardTitle className="flex items-center gap-3 text-2xl text-white">
              <div className="p-2 rounded-xl bg-gradient-to-br from-teal-500 to-cyan-500 text-white">
                <Zap className="w-6 h-6" />
              </div>
              Live Preview
            </CardTitle>
            <CardDescription className="text-gray-400 text-base">
              {currentVariant?.name} • {currentVariant?.spans} spans • {currentVariant?.animation} animation
            </CardDescription>
          </CardHeader>
          <CardContent className="p-16">
            <div className="flex items-center justify-center min-h-[150px] bg-[#1c1c1d] rounded-2xl">
              <SpanLoader
                variant={selectedVariant}
                color={loaderColor}
                size={loaderSize}
              />
            </div>
          </CardContent>
        </Card>

        {/* Controls */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Variant Selection */}
          <Card className="shadow-lg border-0 bg-gray-800/50 backdrop-blur lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-white">
                <Grid3x3 className="w-5 h-5 text-teal-400" />
                Izaberite Loader Tip
              </CardTitle>
              <CardDescription className="text-gray-400">7 različitih animacijskih stilova</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {variants.map((variant) => (
                <button
                  key={variant.id}
                  onClick={() => setSelectedVariant(variant.id)}
                  className={`w-full text-left p-4 rounded-xl border-2 transition-all duration-300 ${
                    selectedVariant === variant.id
                      ? 'border-teal-500 bg-teal-500/10 shadow-lg shadow-teal-500/20 scale-102'
                      : 'border-gray-700 hover:border-gray-600 bg-gray-800/30'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-3xl">{variant.icon}</span>
                      <div>
                        <div className="font-semibold text-white">{variant.name}</div>
                        <div className="text-sm text-gray-400">{variant.desc}</div>
                        <div className="flex gap-2 mt-1">
                          <span className="text-xs px-2 py-0.5 rounded-full bg-gray-700 text-gray-300">
                            {variant.spans} spans
                          </span>
                          <span className="text-xs px-2 py-0.5 rounded-full bg-gray-700 text-gray-300">
                            {variant.animation}
                          </span>
                        </div>
                      </div>
                    </div>
                    {selectedVariant === variant.id && (
                      <div className="w-3 h-3 rounded-full bg-teal-400 animate-pulse shadow-lg shadow-teal-400/50"></div>
                    )}
                  </div>
                </button>
              ))}
            </CardContent>
          </Card>

          {/* Size + Animation Info */}
          <div className="space-y-6">
            <Card className="shadow-lg border-0 bg-gray-800/50 backdrop-blur">
              <CardHeader>
                <CardTitle className="text-lg text-white">Span Size</CardTitle>
                <CardDescription className="text-gray-400">Current: {loaderSize}px</CardDescription>
              </CardHeader>
              <CardContent>
                <Slider
                  value={[loaderSize]}
                  onValueChange={(value) => setLoaderSize(value[0])}
                  min={8}
                  max={40}
                  step={1}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-2">
                  <span>8px</span>
                  <span>40px</span>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-lg border-0 bg-gradient-to-br from-teal-500/10 to-cyan-500/10 backdrop-blur border border-teal-500/20">
              <CardHeader>
                <CardTitle className="text-lg text-teal-400">Animation Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-gray-300">
                <div className="flex justify-between">
                  <span className="text-gray-400">Type:</span>
                  <span className="font-mono">{currentVariant?.animation}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Spans:</span>
                  <span className="font-mono">{currentVariant?.spans}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Easing:</span>
                  <span className="font-mono text-xs">cubic-bezier</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Color Presets */}
        <Card className="shadow-lg border-0 bg-gray-800/50 backdrop-blur">
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
                      ? 'border-teal-400 bg-teal-400/10 scale-110'
                      : 'border-gray-700 hover:border-gray-600'
                  }`}
                  title={preset.name}
                >
                  <div 
                    className="w-full aspect-square rounded-lg"
                    style={{ backgroundColor: preset.value }}
                  />
                  {loaderColor === preset.value && (
                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-teal-400 rounded-full animate-pulse"></div>
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

        {/* Showcase */}
        <Card className="shadow-lg border-0 bg-gray-800/50 backdrop-blur">
          <CardHeader>
            <CardTitle className="text-white">All 7 Loaders</CardTitle>
            <CardDescription className="text-gray-400">
              Prikaz svih loader-a sa trenutnim settings-ima
            </CardDescription>
          </CardHeader>
          <CardContent className="p-12">
            <SpanLoaderShowcase
              color={loaderColor}
              size={loaderSize}
            />
          </CardContent>
        </Card>

        {/* Usage Examples */}
        <Card className="shadow-lg border-0 bg-gray-800/50 backdrop-blur">
          <CardHeader>
            <CardTitle className="text-white">Kako Koristiti</CardTitle>
            <CardDescription className="text-gray-400">Primeri implementacije</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-3">
              <h3 className="font-semibold text-lg text-teal-400">1. Single Loader</h3>
              <div className="bg-black/50 rounded-lg p-4 font-mono text-sm overflow-x-auto">
                <pre className="text-green-400">
{`import { SpanLoader } from '@/components/ui/span-loader';

<SpanLoader 
  variant="loader1"
  color="#2FAC9B"
  size={15}
/>`}
                </pre>
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="font-semibold text-lg text-cyan-400">2. All Loaders Showcase</h3>
              <div className="bg-black/50 rounded-lg p-4 font-mono text-sm overflow-x-auto">
                <pre className="text-green-400">
{`import { SpanLoaderShowcase } from '@/components/ui/span-loader';

<SpanLoaderShowcase
  color="#a855f7"
  size={15}
/>`}
                </pre>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8 pt-6 border-t border-gray-700">
              <div>
                <h4 className="font-semibold mb-3 text-orange-400">Props</h4>
                <ul className="space-y-2 text-sm text-gray-300">
                  <li className="flex gap-2">
                    <code className="bg-gray-700 px-2 py-1 rounded text-xs">variant</code>
                    <span className="text-gray-400">'loader1' ... 'loader7'</span>
                  </li>
                  <li className="flex gap-2">
                    <code className="bg-gray-700 px-2 py-1 rounded text-xs">color</code>
                    <span className="text-gray-400">hex string</span>
                  </li>
                  <li className="flex gap-2">
                    <code className="bg-gray-700 px-2 py-1 rounded text-xs">size</code>
                    <span className="text-gray-400">number (px)</span>
                  </li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-3 text-green-400">7 Animation Types</h4>
                <ul className="space-y-1 text-sm text-gray-300">
                  <li>• Scale pulse (5 spans)</li>
                  <li>• 3D Y-rotation (5 spans)</li>
                  <li>• 3D X-flip (5 spans)</li>
                  <li>• Bounce push (5 spans)</li>
                  <li>• Pendulum swing (10 spans)</li>
                  <li>• Perspective curve (5 spans)</li>
                  <li>• Vertical wave (20 spans)</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center text-sm text-gray-600 pt-12 pb-6 border-t border-gray-800">
          <p>
            Built with <span className="text-teal-400">Tailwind</span>,{' '}
            <span className="text-cyan-400">Framer Motion</span> &{' '}
            <span className="text-pink-400">Lucide Icons</span>.
          </p>
          <p>© {new Date().getFullYear()} SpanLoader Showcase</p>
        </div>
      </div>
    </div>
  );
}
