// app/test-nested-spinner/page.tsx
'use client';

import { useState } from 'react';
import { NestedSpinner, NestedSpinnerShowcase } from '@/components/ui/nested-spinner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Layers, Palette, MousePointer2, Play } from 'lucide-react';

export default function NestedSpinnerTestPage() {
  const [selectedVariant, setSelectedVariant] = useState<'loader1' | 'loader2' | 'loader3' | 'loader4'>('loader1');
  const [spinnerSize, setSpinnerSize] = useState(150);
  const [primaryColor, setPrimaryColor] = useState('rgba(0, 0, 0, .5)');
  const [secondaryColor, setSecondaryColor] = useState('rgba(0, 0, 255, .5)');

  const variants = [
    { 
      id: 'loader1' as const, 
      name: 'Loader 1', 
      desc: 'Linear rotation - Top & Bottom borders',
      features: ['Grey top border', 'Blue bottom border', 'Linear 3.5s rotation']
    },
    { 
      id: 'loader2' as const, 
      name: 'Loader 2', 
      desc: 'Linear rotation - Top & Sides',
      features: ['Blue top border', 'Grey left & right', 'Linear 3.5s rotation']
    },
    { 
      id: 'loader3' as const, 
      name: 'Loader 3', 
      desc: 'Cubic Bezier Easing',
      features: ['Grey top border', 'Blue left border', 'Cubic bezier easing']
    },
    { 
      id: 'loader4' as const, 
      name: 'Loader 4', 
      desc: 'Color Transition',
      features: ['10 nested levels', 'Color morphing', '4s smooth transition']
    }
  ];

  const colorPresets = [
    { name: 'Original', primary: 'rgba(0, 0, 0, .5)', secondary: 'rgba(0, 0, 255, .5)' },
    { name: 'Purple', primary: 'rgba(147, 51, 234, .5)', secondary: 'rgba(236, 72, 153, .5)' },
    { name: 'Cyan', primary: 'rgba(6, 182, 212, .5)', secondary: 'rgba(59, 130, 246, .5)' },
    { name: 'Green', primary: 'rgba(34, 197, 94, .5)', secondary: 'rgba(16, 185, 129, .5)' },
    { name: 'Orange', primary: 'rgba(249, 115, 22, .5)', secondary: 'rgba(239, 68, 68, .5)' },
    { name: 'Monochrome', primary: 'rgba(0, 0, 0, .3)', secondary: 'rgba(0, 0, 0, .7)' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto p-8 space-y-12">
        {/* Header */}
        <div className="text-center space-y-4 py-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 text-sm mb-4">
            <Layers className="w-4 h-4" />
            CSS3 Nested Border Loaders
          </div>
          <h1 className="text-6xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
            Nested Border Spinners
          </h1>
          <p className="text-2xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
            Elegantan dizajn sa nested div elementima i border animacijama
          </p>
          <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
            <MousePointer2 className="w-4 h-4" />
            <span>Hover preko spinner-a da pauziraš animaciju</span>
          </div>
        </div>

        {/* Main Preview */}
        <Card className="shadow-2xl border-0 bg-white dark:bg-gray-800 overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/30 dark:to-purple-950/30 border-b">
            <CardTitle className="flex items-center gap-3 text-2xl">
              <div className="p-2 rounded-xl bg-gradient-to-br from-blue-500 to-purple-500 text-white">
                <Play className="w-6 h-6" />
              </div>
              Live Preview
            </CardTitle>
            <CardDescription className="text-base">
              Trenutno odabran: {variants.find(v => v.id === selectedVariant)?.name}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-12">
            <div className="flex items-center justify-center min-h-[300px] bg-gradient-to-br from-gray-50 to-white dark:from-gray-900 dark:to-gray-800 rounded-xl">
              <NestedSpinner
                variant={selectedVariant}
                size={spinnerSize}
                primaryColor={primaryColor}
                secondaryColor={secondaryColor}
              />
            </div>
          </CardContent>
        </Card>

        {/* Controls */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Variant Selection */}
          <Card className="shadow-lg border-0 bg-white dark:bg-gray-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <Layers className="w-5 h-5 text-blue-500" />
                Izaberite Variant
              </CardTitle>
              <CardDescription>4 različita stila nested border animacija</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {variants.map((variant) => (
                <button
                  key={variant.id}
                  onClick={() => setSelectedVariant(variant.id)}
                  className={`w-full text-left p-4 rounded-xl border-2 transition-all duration-300 ${
                    selectedVariant === variant.id
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/30 shadow-lg scale-102'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="space-y-1 flex-1">
                      <div className="font-semibold text-base">{variant.name}</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">{variant.desc}</div>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {variant.features.map((feature, idx) => (
                          <span 
                            key={idx}
                            className="text-xs px-2 py-1 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400"
                          >
                            {feature}
                          </span>
                        ))}
                      </div>
                    </div>
                    {selectedVariant === variant.id && (
                      <div className="w-3 h-3 rounded-full bg-blue-500 animate-pulse ml-2 flex-shrink-0"></div>
                    )}
                  </div>
                </button>
              ))}
            </CardContent>
          </Card>

          {/* Size & Color Controls */}
          <div className="space-y-6">
            {/* Size Control */}
            <Card className="shadow-lg border-0 bg-white dark:bg-gray-800">
              <CardHeader>
                <CardTitle className="text-lg">Veličina Spinner-a</CardTitle>
                <CardDescription>Trenutna veličina: {spinnerSize}px</CardDescription>
              </CardHeader>
              <CardContent>
                <Slider
                  value={[spinnerSize]}
                  onValueChange={(value) => setSpinnerSize(value[0])}
                  min={80}
                  max={300}
                  step={10}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-2">
                  <span>80px</span>
                  <span>300px</span>
                </div>
              </CardContent>
            </Card>

            {/* Color Presets */}
            <Card className="shadow-lg border-0 bg-white dark:bg-gray-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Palette className="w-5 h-5 text-purple-500" />
                  Color Presets
                </CardTitle>
                <CardDescription>Brza promena boja</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3">
                  {colorPresets.map((preset) => (
                    <button
                      key={preset.name}
                      onClick={() => {
                        setPrimaryColor(preset.primary);
                        setSecondaryColor(preset.secondary);
                      }}
                      className={`p-3 rounded-xl border-2 transition-all duration-300 ${
                        primaryColor === preset.primary && secondaryColor === preset.secondary
                          ? 'border-purple-500 bg-purple-50 dark:bg-purple-950/30'
                          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <div 
                          className="w-4 h-4 rounded-full border" 
                          style={{ backgroundColor: preset.primary }}
                        />
                        <div 
                          className="w-4 h-4 rounded-full border" 
                          style={{ backgroundColor: preset.secondary }}
                        />
                      </div>
                      <div className="text-sm font-medium">{preset.name}</div>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* All Variants Showcase */}
        <Card className="shadow-lg border-0 bg-white dark:bg-gray-800">
          <CardHeader>
            <CardTitle>Svi Varianti</CardTitle>
            <CardDescription>
              Prikaz svih 4 loader stila sa trenutnim color preset-om
            </CardDescription>
          </CardHeader>
          <CardContent className="p-8">
            <NestedSpinnerShowcase
              size={150}
              primaryColor={primaryColor}
              secondaryColor={secondaryColor}
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
              <h3 className="font-semibold text-lg text-blue-600 dark:text-blue-400">1. Osnovana Upotreba</h3>
              <div className="bg-gray-900 rounded-lg p-4 font-mono text-sm overflow-x-auto">
                <pre className="text-green-400">
{`import { NestedSpinner } from '@/components/ui/nested-spinner';

<NestedSpinner 
  variant="loader1"
  size={150}
  primaryColor="rgba(0, 0, 0, .5)"
  secondaryColor="rgba(0, 0, 255, .5)"
/>`}
                </pre>
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="font-semibold text-lg text-purple-600 dark:text-purple-400">2. Showcase svih varianti</h3>
              <div className="bg-gray-900 rounded-lg p-4 font-mono text-sm overflow-x-auto">
                <pre className="text-green-400">
{`import { NestedSpinnerShowcase } from '@/components/ui/nested-spinner';

<NestedSpinnerShowcase
  size={150}
  primaryColor="rgba(147, 51, 234, .5)"
  secondaryColor="rgba(236, 72, 153, .5)"
/>`}
                </pre>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6 pt-6 border-t">
              <div>
                <h4 className="font-semibold mb-3 text-orange-600 dark:text-orange-400">Props</h4>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start gap-2">
                    <code className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded text-xs">variant</code>
                    <span className="text-gray-600 dark:text-gray-400">'loader1' | 'loader2' | 'loader3' | 'loader4'</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <code className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded text-xs">size</code>
                    <span className="text-gray-600 dark:text-gray-400">number (default: 150)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <code className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded text-xs">primaryColor</code>
                    <span className="text-gray-600 dark:text-gray-400">rgba string</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <code className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded text-xs">secondaryColor</code>
                    <span className="text-gray-600 dark:text-gray-400">rgba string</span>
                  </li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-3 text-green-600 dark:text-green-400">Features</h4>
                <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                  <li className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    Nested div struktura (6-10 nivoa)
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    Border-only animacije
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    Pause on hover
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    Različiti timing funkcije
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    Color morphing (loader4)
                  </li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center py-8 text-gray-500 text-sm space-y-2">
          <p>Original CSS3 Nested Border Loaders • Implementirano u Next.js + React</p>
          <p className="text-xs">Hover preko bilo kog spinner-a da pauziraš animaciju</p>
        </div>
      </div>
    </div>
  );
}