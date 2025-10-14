'use client';

import { useState } from 'react';
import CubeLoader from '@/components/ui/CubeLoader';

export default function CubeLoaderTestPage() {
  const [size, setSize] = useState(50);
  const [color, setColor] = useState('#ffffff');
  const [loadingText, setLoadingText] = useState('Loading');
  const [shadowColor, setShadowColor] = useState('rgba(0,0,0,0.1)');

  const colorPresets = [
    '#ffffff', '#f97316', '#3b82f6', '#10b981', '#ec4899', '#06b6d4', '#ef4444', '#eab308', '#6366f1'
  ];

  const shadowPresets = [
    'rgba(0,0,0,0.1)', 'rgba(0,0,0,0.2)', 'rgba(0,0,0,0.3)', 'rgba(255,255,255,0.2)'
  ];

  return (
    <div className="min-h-screen bg-gradient-to-l from-[#00c6ff] to-[#0072ff] flex flex-col items-center justify-center text-white p-8 space-y-12">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-5xl font-light font-[Archivo_Narrow]">Cube Folding Loader</h1>
        <p className="text-lg text-gray-100 max-w-xl mx-auto">
          3D cube folding loader sa interaktivnim kontrolama
        </p>
      </div>

      {/* Loader */}
      <CubeLoader size={size} color={color} loadingText={loadingText} shadowColor={shadowColor} />

      {/* Controls */}
      <div className="w-full max-w-lg space-y-6">
        {/* Size Slider */}
        <div className="bg-black/50 p-4 rounded-xl">
          <label className="block text-sm text-gray-300 mb-2">Size: {size}px</label>
          <input
            type="range"
            min={20}
            max={150}
            value={size}
            onChange={(e) => setSize(Number(e.target.value))}
            className="w-full"
          />
        </div>

        {/* Loader Color */}
        <div className="bg-black/50 p-4 rounded-xl">
          <label className="block text-sm text-gray-300 mb-2">Loader Color</label>
          <div className="flex flex-wrap gap-3">
            {colorPresets.map((c) => (
              <button
                key={c}
                onClick={() => setColor(c)}
                className={`w-8 h-8 rounded-full border-2 ${
                  color === c ? 'border-white scale-110' : 'border-gray-700'
                }`}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
        </div>

        {/* Loading Text */}
        <div className="bg-black/50 p-4 rounded-xl">
          <label className="block text-sm text-gray-300 mb-2">Loading Text</label>
          <input
            type="text"
            value={loadingText}
            onChange={(e) => setLoadingText(e.target.value)}
            className="w-full p-2 rounded bg-gray-800 text-white border border-gray-600"
          />
        </div>

        {/* Shadow Color */}
        <div className="bg-black/50 p-4 rounded-xl">
          <label className="block text-sm text-gray-300 mb-2">Shadow Color</label>
          <div className="flex flex-wrap gap-3">
            {shadowPresets.map((c) => (
              <button
                key={c}
                onClick={() => setShadowColor(c)}
                className={`w-8 h-8 rounded-full border-2 ${
                  shadowColor === c ? 'border-white scale-110' : 'border-gray-700'
                }`}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="fixed bottom-4 text-xs text-center text-white/80 w-full">
        Made with <span className="text-pink-500 text-sm">♥</span> by{' '}
        <a
          href="https://codepen.io/nikhil8krishnan"
          target="_blank"
          className="underline hover:text-white"
        >
          Nikhil Krishnan
        </a>
      </div>
    </div>
  );
}
