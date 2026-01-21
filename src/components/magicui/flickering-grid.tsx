"use client";

import { useEffect, useRef, useState } from "react";

interface FlickeringGridProps {
  squareSize?: number;
  gridGap?: number;
  flickerChance?: number;
  color?: string;
  width?: number;
  height?: number;
  className?: string;
  maxOpacity?: number;
}

export default function FlickeringGrid({
  squareSize = 4,
  gridGap = 6,
  flickerChance = 0.3,
  color = "rgb(0, 0, 0)",
  width,
  height,
  className,
  maxOpacity = 0.3,
}: FlickeringGridProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isInView, setIsInView] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const setupCanvas = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      
      canvas.width = (width || rect.width) * dpr;
      canvas.height = (height || rect.height) * dpr;
      
      canvas.style.width = `${width || rect.width}px`;
      canvas.style.height = `${height || rect.height}px`;
      
      ctx.scale(dpr, dpr);
    };

    setupCanvas();

    const cellSize = squareSize + gridGap;
    const cols = Math.ceil((width || canvas.width) / cellSize);
    const rows = Math.ceil((height || canvas.height) / cellSize);

    const grid: boolean[][] = Array.from({ length: rows }, () =>
      Array.from({ length: cols }, () => Math.random() < flickerChance)
    );

    let animationId: number;
    let lastTime = 0;
    const fps = 15; // Limit to 15 frames per second for slower, smoother animation
    const frameInterval = 1000 / fps;

    const animate = (currentTime: number) => {
      if (!isInView) return;

      const deltaTime = currentTime - lastTime;

      if (deltaTime >= frameInterval) {
        lastTime = currentTime - (deltaTime % frameInterval);

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Draw grid
        for (let row = 0; row < rows; row++) {
          for (let col = 0; col < cols; col++) {
            // Random flicker
            if (Math.random() < flickerChance) {
              grid[row][col] = !grid[row][col];
            }

            if (grid[row][col]) {
              const opacity = Math.random() * maxOpacity;
              ctx.fillStyle = color.replace("rgb(", "rgba(").replace(")", `, ${opacity})`);
              ctx.fillRect(
                col * cellSize,
                row * cellSize,
                squareSize,
                squareSize
              );
            }
          }
        }
      }

      animationId = requestAnimationFrame(animate);
    };

    animationId = requestAnimationFrame(animate);

    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
    };
  }, [
    squareSize,
    gridGap,
    flickerChance,
    color,
    width,
    height,
    maxOpacity,
    isInView,
  ]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsInView(entry.isIntersecting);
      },
      { threshold: 0 }
    );

    observer.observe(canvas);

    return () => {
      observer.disconnect();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className={className}
      style={{
        width: width || "100%",
        height: height || "100%",
      }}
    />
  );
}
