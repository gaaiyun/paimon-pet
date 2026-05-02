import { useRef, useEffect } from "react";

interface Live2DRendererProps {
  scale: number;
  expression: string;
}

/**
 * Live2DRenderer creates a PIXI Application and loads a Live2D model.
 * It falls back silently when the model files are not available.
 */
export function Live2DRenderer({ scale, expression }: Live2DRendererProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const appRef = useRef<any>(null);
  const modelRef = useRef<any>(null);

  useEffect(() => {
    let mounted = true;

    const init = async () => {
      try {
        // Dynamic imports so the module is only loaded when needed
        const PIXI = await import("pixi.js");
        const { Live2DModel } = await import("pixi-live2d-display");

        // pixi-live2d-display requires global PIXI reference
        (window as any).PIXI = PIXI;

        if (!mounted || !containerRef.current) return;

        const app = new PIXI.Application({
          backgroundAlpha: 0,
          resizeTo: containerRef.current,
          antialias: true,
        });
        containerRef.current.appendChild(app.view as any);
        appRef.current = app;

        // Attempt to load the Live2D model (may not exist yet)
        try {
          const model = await Live2DModel.from(
            "/live2d/paimon/paimon.model3.json",
          );
          if (!mounted) return;

          model.scale.set(scale);
          app.stage.addChild(model);
          modelRef.current = model;
        } catch {
          // Model files not available — silent fallback
          console.info("[Live2DRenderer] Model not found, rendering skipped");
        }
      } catch {
        // PIXI or live2d module not available — silent fallback
        console.info("[Live2DRenderer] Live2D dependencies not available");
      }
    };

    init();

    return () => {
      mounted = false;
      try {
        if (modelRef.current) {
          modelRef.current = null;
        }
        if (appRef.current) {
          appRef.current.destroy(true);
          appRef.current = null;
        }
      } catch {
        // Cleanup errors are non-critical
      }
    };
  }, []);

  // Update scale when it changes
  useEffect(() => {
    if (modelRef.current) {
      modelRef.current.scale.set(scale);
    }
  }, [scale]);

  // Update expression when it changes
  useEffect(() => {
    if (modelRef.current && expression) {
      try {
        modelRef.current.expression(expression);
      } catch {
        // Expression may not be defined on the model
      }
    }
  }, [expression]);

  return <div ref={containerRef} className="live2d-container" />;
}
