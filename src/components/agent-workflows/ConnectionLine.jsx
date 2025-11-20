import React from 'react';

export default function ConnectionLine({ from, to, isDashed = false }) {
  const midX = (from.x + to.x) / 2;
  
  const path = `M ${from.x} ${from.y} C ${midX} ${from.y}, ${midX} ${to.y}, ${to.x} ${to.y}`;
  
  return (
    <g>
      <path
        d={path}
        stroke="#475569"
        strokeWidth="2"
        fill="none"
        strokeDasharray={isDashed ? "5,5" : "none"}
      />
      <path
        d={path}
        stroke="#3b82f6"
        strokeWidth="2"
        fill="none"
        opacity="0"
        className="hover:opacity-100 transition-opacity"
        strokeDasharray={isDashed ? "5,5" : "none"}
      />
      <circle cx={to.x} cy={to.y} r="4" fill="#3b82f6" />
    </g>
  );
}