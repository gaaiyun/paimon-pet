import { useEffect, useRef, useState } from "react";
import Phaser from "phaser";
import Pets from "./scenes/Pets";
import { getCurrentWindow } from "@tauri-apps/api/window";
import paimonConfig from "./config/paimon.json";

/**
 * PhaserWrapper - React component that wraps the Phaser game for Paimon desktop pet.
 * Handles Phaser.Game lifecycle, configuration, and cleanup.
 */
function PhaserWrapper() {
    const phaserDom = useRef<HTMLDivElement>(null);
    const [screenWidth, setScreenWidth] = useState(window.screen.width);
    const [screenHeight, setScreenHeight] = useState(window.screen.height);

    useEffect(() => {
        if (!phaserDom.current) return;

        const handleResize = () => {
            setScreenWidth(window.screen.width);
            setScreenHeight(window.screen.height);
        };

        window.addEventListener("resize", handleResize);

        // Ensure that if component remount user will still be able to touch their screen
        getCurrentWindow().setIgnoreCursorEvents(true);

        const spriteConfig = [
            {
                ...paimonConfig,
                id: "paimon",
            },
        ];

        const phaserConfig: Phaser.Types.Core.GameConfig = {
            type: Phaser.AUTO,
            parent: phaserDom.current,
            backgroundColor: "#ffffff0",
            transparent: true,
            roundPixels: true,
            antialias: true,
            scale: {
                mode: Phaser.Scale.ScaleModes.RESIZE,
                width: screenWidth,
                height: screenHeight,
            },
            physics: {
                default: "arcade",
                arcade: {
                    debug: false,
                    gravity: { y: 200, x: 0 },
                },
            },
            fps: {
                target: 30,
                min: 30,
                smoothStep: true,
            },
            scene: [Pets],
            audio: {
                noAudio: true,
            },
            callbacks: {
                preBoot: (game) => {
                    game.registry.set("spriteConfig", spriteConfig);
                },
            },
        };

        const game = new Phaser.Game(phaserConfig);

        return () => {
            game.destroy(true);
            // Reset the dom
            if (phaserDom.current !== null) {
                phaserDom.current.innerHTML = "";
            }
            window.removeEventListener("resize", handleResize);
        };
    }, [screenWidth, screenHeight]);

    return (
        <>
            <div ref={phaserDom} />
        </>
    );
}

export default PhaserWrapper;