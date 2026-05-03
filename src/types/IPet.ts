/**
 * Direction enum for pet movement orientation.
 * Used to track and control pet facing direction during animations.
 */
export enum Direction {
    /** Facing right */
    RIGHT = "right",
    /** Facing left */
    LEFT = "left",
    /** Moving upward */
    UP = "up",
    /** Moving downward (falling) */
    DOWN = "down",
    /** Upside down facing left */
    UPSIDELEFT = "upsideleft",
    /** Upside down facing right */
    UPSIDERIGHT = "upsideright",
    /** Unknown or stationary direction */
    UNKNOWN = "unknown",
}

/**
 * World bounding box for collision detection.
 */
export interface IWorldBounding {
    /** Whether pet hit top boundary */
    up: boolean;
    /** Whether pet hit bottom boundary */
    down: boolean;
    /** Whether pet hit left boundary */
    left: boolean;
    /** Whether pet hit right boundary */
    right: boolean;
}

/**
 * Options for switching pet state/animation.
 */
export interface ISwitchStateOptions {
    /** Number of times to repeat the animation (-1 for infinite) */
    repeat?: number;
    /** Delay before starting the animation (ms) */
    delay?: number;
    /** Delay between repeats (ms) */
    repeatDelay?: number;
}

/**
 * Ease functions for tweens (Phaser compatible).
 */
export const Ease = {
    /** Quadratic ease out */
    QuadEaseOut: "Quad.easeOut",
    /** Quartic ease out */
    QuartEaseOut: "Quart.easeOut",
} as const;