import * as React from 'react';

export function DebuggingDot({
  x,
  y,
  color,
  label,
}: {
  x: number;
  y: number;
  color: string;
  label?: string;
}) {
  return (
    <div
      style={{
        position: 'absolute',
        left: x - 5,
        top: y - 5,
        backgroundColor: color,
        width: '10px',
        height: '10px',
        zIndex: 1000,
      }}
    >
      {label}
    </div>
  );
}
