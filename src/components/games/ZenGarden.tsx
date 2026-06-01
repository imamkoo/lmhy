"use client";

import { useEffect, useRef, useState } from "react";

type Stone = { x: number; y: number; id: number };

export function ZenGarden() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stones, setStones] = useState<Stone[]>([]);
  const nextId = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;

    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, "#fef3c7");
    grad.addColorStop(1, "#d6d3d1");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    for (const stone of stones) {
      ctx.beginPath();
      ctx.ellipse(stone.x, stone.y, 18, 12, 0, 0, Math.PI * 2);
      ctx.fillStyle = "#78716c";
      ctx.fill();
      ctx.strokeStyle = "#57534e";
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  }, [stones]);

  function handleClick(e: React.MouseEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;
    setStones((s) => [...s, { x, y, id: nextId.current++ }]);
  }

  return (
    <div className="space-y-4">
      <p className="text-center text-sm text-slate-600 dark:text-slate-400">
        Klik di kanvas untuk meletakkan batu. Nikmati ketenangan taman virtual Anda.
      </p>
      <canvas
        ref={canvasRef}
        width={600}
        height={400}
        onClick={handleClick}
        className="mx-auto w-full max-w-2xl cursor-crosshair rounded-2xl border border-slate-200 shadow-inner dark:border-slate-700"
      />
      <p className="text-center text-xs text-slate-500">
        Batu ditempatkan: {stones.length}
      </p>
      <button
        type="button"
        onClick={() => setStones([])}
        className="mx-auto block rounded-lg border border-slate-300 px-4 py-2 text-sm dark:border-slate-600"
      >
        Bersihkan taman
      </button>
    </div>
  );
}
