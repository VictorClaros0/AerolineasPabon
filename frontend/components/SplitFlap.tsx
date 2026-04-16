import React, { useEffect, useState } from 'react';

export default function SplitFlap({ text, length = 10, align = "left", colorClass = "text-white" }: { text: string, length?: number, align?: "left"|"right"|"center", colorClass?: string }) {
  const [displayed, setDisplayed] = useState(Array(length).fill(''));

  useEffect(() => {
    let padded = text.substring(0, length);
    if (align === "left") padded = padded.padEnd(length, ' ');
    else if (align === "right") padded = padded.padStart(length, ' ');
    else padded = padded.padEnd(length, ' '); // center approx for simplicity
    
    let current = Array(length).fill('');
    let i = 0;
    
    const interval = setInterval(() => {
      if (i < length) {
        current[i] = padded[i];
        setDisplayed([...current]);
        i++;
      } else {
        clearInterval(interval);
      }
    }, 40); // Fast flap speed
    return () => clearInterval(interval);
  }, [text, length, align]);

  return (
    <div className="flex gap-[1px]">
      {displayed.map((char, i) => (
        <div key={i} className={`w-5 h-7 bg-[#111] border border-gray-800 rounded flex items-center justify-center font-mono font-black text-xs relative overflow-hidden shadow-[inset_0_2px_4px_rgba(0,0,0,1)] ${colorClass}`}>
          <div className="absolute top-1/2 w-full h-[1px] bg-black/80 z-10 shadow-[0_1px_2px_rgba(0,0,0,0.5)]" />
          <span className="drop-shadow-md z-0">{char === ' ' ? '\u00A0' : char}</span>
        </div>
      ))}
    </div>
  );
}
