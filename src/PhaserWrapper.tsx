import { useEffect, useRef, useState } from "react";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { invoke } from "@tauri-apps/api/core";
import { usePetStore } from "./stores/petStore";
import { useSettingsStore } from "./stores/settingsStore";
import type { PetState } from "./types/pet";

const frameWidth = 192;
const frameHeight = 208;
const sheetWidth = 1536;
const sheetHeight = 1872;
const frameRate = 5;

type SpriteAnimation = {
    row: number;
    frames: number;
};

const stateAnimations: Record<PetState, SpriteAnimation> = {
    idle: { row: 0, frames: 6 },
    listening: { row: 6, frames: 6 },
    thinking: { row: 8, frames: 6 },
    speaking: { row: 3, frames: 4 },
    dragging: { row: 4, frames: 5 },
};

const idleAnimations: SpriteAnimation[] = [
    { row: 0, frames: 6 },
    { row: 3, frames: 4 },
    { row: 6, frames: 6 },
    { row: 8, frames: 6 },
];

interface PhaserWrapperProps {
    onClick: () => void;
    clickThrough: boolean;
}

function PhaserWrapper({ onClick, clickThrough }: PhaserWrapperProps) {
    const petState = usePetStore((s) => s.state);
    const setPetState = usePetStore((s) => s.setState);
    const scale = useSettingsStore((s) => s.settings.pet.scale);
    const displayWidth = Math.round(frameWidth * scale);
    const displayHeight = Math.round(frameHeight * scale);
    const [frame, setFrame] = useState(0);
    const [idleAnimationIndex, setIdleAnimationIndex] = useState(0);
    const [isDragging, setIsDragging] = useState(false);
    const dragStateRef = useRef<PetState>("idle");
    const pointerStartRef = useRef<{ x: number; y: number } | null>(null);
    const didDragRef = useRef(false);
    const petRef = useRef<HTMLDivElement>(null);
    const clickThroughRef = useRef(clickThrough);
    const hoverPollRef = useRef<ReturnType<typeof setInterval>>(undefined);

    clickThroughRef.current = clickThrough;

    const animation = petState === "idle" ? idleAnimations[idleAnimationIndex] : stateAnimations[petState];

    // Pet sprite bounds (centered horizontally, 60px from bottom)
    const petLeft = 150 - displayWidth / 2;
    const petTop = 400 - displayHeight - 60;

    // Hover detection via cursor position polling
    useEffect(() => {
        if (!clickThroughRef.current) return;

        hoverPollRef.current = setInterval(async () => {
            if (!clickThroughRef.current) return;
            try {
                const [cx, cy] = await invoke<[number, number]>("get_cursor_pos");
                const overPet =
                    cx >= petLeft && cx <= petLeft + displayWidth &&
                    cy >= petTop && cy <= petTop + displayHeight;
                if (overPet) {
                    await getCurrentWindow().setIgnoreCursorEvents(false);
                } else {
                    await getCurrentWindow().setIgnoreCursorEvents(true);
                }
            } catch {
                // Window might not exist during teardown
            }
        }, 100);

        return () => {
            if (hoverPollRef.current) clearInterval(hoverPollRef.current);
        };
    }, [petLeft, petTop, displayWidth, displayHeight]);

    // Handle click-through mode changes
    useEffect(() => {
        const win = getCurrentWindow();
        if (!clickThrough) {
            win.setIgnoreCursorEvents(false).catch(() => {});
        }
    }, [clickThrough]);

    useEffect(() => {
        setFrame(0);
        const interval = window.setInterval(() => {
            setFrame((current) => (current + 1) % animation.frames);
        }, 1000 / frameRate);

        return () => window.clearInterval(interval);
    }, [animation.frames, petState, idleAnimationIndex]);

    useEffect(() => {
        if (petState !== "idle") return;

        const interval = window.setInterval(() => {
            setIdleAnimationIndex((current) => (current + 1) % idleAnimations.length);
        }, 4200);

        return () => window.clearInterval(interval);
    }, [petState]);

    const handlePointerDown = (e: React.PointerEvent) => {
        if (e.button !== 0) return; // Only primary (left) button
        e.stopPropagation();
        dragStateRef.current = petState;
        didDragRef.current = false;
        pointerStartRef.current = { x: e.clientX, y: e.clientY };
        setIsDragging(true);
        setPetState("dragging");
        void getCurrentWindow().setIgnoreCursorEvents(false);
        // Don't call startDragging() yet — wait for actual mouse movement
    };

    const handlePointerMove = (e: React.PointerEvent) => {
        if (!pointerStartRef.current) return;
        const dx = e.clientX - pointerStartRef.current.x;
        const dy = e.clientY - pointerStartRef.current.y;
        if (!didDragRef.current && (Math.abs(dx) > 3 || Math.abs(dy) > 3)) {
            didDragRef.current = true;
            void getCurrentWindow().startDragging();
        }
    };

    const stopDrag = () => {
        if (!isDragging) return;
        const wasClick = !didDragRef.current;
        setIsDragging(false);
        setPetState(dragStateRef.current === "dragging" ? "idle" : dragStateRef.current);
        pointerStartRef.current = null;
        if (wasClick) {
            onClick();
        }
    };

    return (
        <div
            style={{
                position: "fixed",
                inset: 0,
                width: "100vw",
                height: "100vh",
                background: "transparent",
                pointerEvents: "none",
            }}
        >
            <div
                ref={petRef}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={stopDrag}
                onPointerCancel={stopDrag}
                onLostPointerCapture={stopDrag}
                style={{
                    position: "fixed",
                    left: `calc(50% - ${displayWidth / 2}px)`,
                    bottom: "60px",
                    width: `${displayWidth}px`,
                    height: `${displayHeight}px`,
                    overflow: "hidden",
                    cursor: isDragging ? "grabbing" : "grab",
                    pointerEvents: "auto",
                    touchAction: "none",
                    userSelect: "none",
                }}
            >
                <img
                    src="/sprites/paimon/spritesheet.png"
                    style={{
                        position: "absolute",
                        left: `${-frame * displayWidth}px`,
                        top: `${-animation.row * displayHeight}px`,
                        width: `${Math.round(sheetWidth * scale)}px`,
                        height: `${Math.round(sheetHeight * scale)}px`,
                        imageRendering: "pixelated",
                    }}
                    draggable={false}
                />
            </div>
        </div>
    );
}

export default PhaserWrapper;
