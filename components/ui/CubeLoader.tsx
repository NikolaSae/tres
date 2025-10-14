'use client';
import React from 'react';
import './CubeLoader.css';

interface CubeLoaderProps {
  size?: number;
  color?: string;
  loadingText?: string;
  shadowColor?: string;
}

const CubeLoader: React.FC<CubeLoaderProps> = ({
  size = 50,
  color = '#fff',
  loadingText = 'Loading',
  shadowColor = 'rgba(0,0,0,0.1)',
}) => {
  return (
    <div
      className="cube-wrapper"
      style={{
        width: size * 2,
        height: size * 2,
        '--shadow-color': shadowColor,
      } as React.CSSProperties}
    >
      <div className="cube-folding">
        <span className="leaf1" style={{ backgroundColor: color }}></span>
        <span className="leaf2" style={{ backgroundColor: color }}></span>
        <span className="leaf3" style={{ backgroundColor: color }}></span>
        <span className="leaf4" style={{ backgroundColor: color }}></span>
      </div>
      <span className="loading" data-name="Loading">
        {loadingText}
      </span>
    </div>
  );
};

export default CubeLoader;
