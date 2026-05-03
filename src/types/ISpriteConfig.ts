/**
 * ISpriteConfig - Configuration for sprite sheet loading and animation registration.
 * Simplified for single-pet Phaser implementation.
 */
export interface ISpriteConfig {
    /** Unique identifier for the sprite */
    id: string;
    /** Display name of the sprite */
    name: string;
    /** URL to the sprite image */
    imageSrc: string;
    /** Frame size for square sprites (width = height) */
    frameSize?: number;
    /** Width of the spritesheet (alternative to frameSize) */
    width?: number;
    /** Height of the spritesheet (alternative to frameSize) */
    height?: number;
    /** Maximum number of frames in any single row (alternative to frameSize) */
    highestFrameMax?: number;
    /** Number of rows in the spritesheet (alternative to frameSize) */
    totalSpriteLine?: number;
    /** Animation states and their frame configuration */
    states: {
        [state: string]: {
            /** Starting frame (1-based, converted to 0-based internally) */
            start?: number;
            /** Ending frame (1-based, converted to 0-based internally) */
            end?: number;
            /** Sprite line for this state (1-based, converted to 0-based internally) */
            spriteLine?: number;
            /** Number of frames for this state */
            frameMax?: number;
        };
    };
}

/**
 * SpriteType enum for sprite classification.
 * Not currently used but available for future multi-pet support.
 */
export enum SpriteType {
    NORMAL = "normal",
    BOSS = "boss",
    ELITE = "elite",
}