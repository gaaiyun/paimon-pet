import { getCurrentWindow } from "@tauri-apps/api/window";

/**
 * InputManager - Handles mouse input and cursor events for the pet window.
 * Provides click-through functionality when mouse is not over pets.
 */
export class InputManager {
    private input: Phaser.Input.InputPlugin | undefined;
    private isIgnoreCursorEvents: boolean = false;

    private readonly IGNORE_CURSOR_EVENTS_DELAY: number = 50;

    /**
     * Set the Phaser input plugin for mouse detection.
     * @param input - Phaser InputPlugin instance
     */
    public setInputManager(input: Phaser.Input.InputPlugin): void {
        this.input = input;
    }

    /**
     * Check if mouse is over a pet and toggle cursor events accordingly.
     * Called periodically to update click-through state.
     */
    public checkIsMouseInOnPet(): void {
        try {
            if (!this.input) {
                return;
            }

            // Check if any pet is under the current pointer position
            if (this.detectMouseOverPet()) {
                this.turnOffIgnoreCursorEvents();
                return;
            }

            this.turnOnIgnoreCursorEvents();
        } catch (error) {
            console.error("Error in InputManager checkIsMouseInOnPet():", error);
        }
    }

    /**
     * Disable click-through - mouse events are captured by the window.
     */
    public turnOffIgnoreCursorEvents(): void {
        try {
            if (this.isIgnoreCursorEvents) {
                getCurrentWindow().setIgnoreCursorEvents(false).then(() => {
                    this.isIgnoreCursorEvents = false;
                });
            }
        } catch (error) {
            console.error("Error in InputManager turnOffIgnoreCursorEvents():", error);
        }
    }

    /**
     * Enable click-through - mouse events pass through the window.
     * Uses a slight delay to avoid crashes from rapid calls.
     */
    public turnOnIgnoreCursorEvents(): void {
        try {
            if (!this.isIgnoreCursorEvents) {
                setTimeout(() => {
                    getCurrentWindow().setIgnoreCursorEvents(true).then(() => {
                        this.isIgnoreCursorEvents = true;
                    });
                }, this.IGNORE_CURSOR_EVENTS_DELAY);
            }
        } catch (error) {
            console.error("Error in InputManager turnOnIgnoreCursorEvents():", error);
        }
    }

    /**
     * Detect if the mouse pointer is over any pet sprite.
     * Uses Phaser's hitTestPointer to check sprite under cursor.
     * @returns true if mouse is over a pet, false otherwise
     */
    private detectMouseOverPet(): boolean {
        try {
            if (!this.input) {
                return false;
            }

            // Use hitTestPointer to check if pointer is over any interactive sprite
            // This returns an array of all objects the pointer is currently over
            return this.input.hitTestPointer(this.input.activePointer).length > 0;
        } catch (error) {
            console.error("Error in InputManager detectMouseOverPet():", error);
            return false;
        }
    }
}