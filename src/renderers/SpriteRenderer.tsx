import { useRef, useEffect } from "react";

interface SpriteRendererProps {
  scale: number;
  animation: string;
}

interface SpriteConfig {
  frameWidth: number;
  frameHeight: number;
  columns: number;
  rows: number;
  fps: number;
  states: Record<string, { row: number; frameMax: number }>;
}

/**
 * SpriteRenderer draws a sprite-sheet animation on an HTML Canvas.
 * It loads the spritesheet image and pet.json config, then cycles
 * frames based on the current animation state.
 */
export function SpriteRenderer({ scale, animation }: SpriteRendererProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const configRef = useRef<SpriteConfig | null>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const frameRef = useRef(0);
  const lastTimeRef = useRef(0);

  useEffect(() => {
    // Load sprite config
    fetch("/sprites/paimon/pet.json")
      .then((res) => res.json())
      .then((config: SpriteConfig) => {
        configRef.current = config;
      })
      .catch(() => {
        // Config not available — canvas stays blank
      });

    // Load spritesheet image
    const img = new Image();
    img.src = "/sprites/paimon/spritesheet.png";
    img.onload = () => {
      imageRef.current = img;
    };

    return () => {
      imageRef.current = null;
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const config = configRef.current;
    const img = imageRef.current;
    if (!config || !img) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = config.frameWidth * scale;
    canvas.height = config.frameHeight * scale;

    // Reset frame when animation changes
    frameRef.current = 0;
    lastTimeRef.current = 0;

    const interval = 1000 / config.fps;
    let animId: number;

    const draw = (timestamp: number) => {
      if (!ctx || !img || !config) return;

      const state = config.states[animation];
      if (!state) {
        animId = requestAnimationFrame(draw);
        return;
      }

      // Advance frame based on elapsed time
      if (timestamp - lastTimeRef.current >= interval) {
        frameRef.current = (frameRef.current + 1) % state.frameMax;
        lastTimeRef.current = timestamp;
      }

      const frame = frameRef.current;
      const col = frame % config.columns;
      const row = state.row;

      // Clear and draw the current frame
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(
        img,
        col * config.frameWidth,
        row * config.frameHeight,
        config.frameWidth,
        config.frameHeight,
        0,
        0,
        canvas.width,
        canvas.height,
      );

      animId = requestAnimationFrame(draw);
    };

    animId = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [scale, animation]);

  return <canvas ref={canvasRef} className="sprite-canvas" />;
}
