import { ISpriteConfig } from "../../types/ISpriteConfig";

/**
 * ConfigManager handles sprite sheet loading and animation registration for Phaser.
 * Manages sprite configs, loads spritesheets, and registers animations for pet states.
 */
export class ConfigManager {
    // Config for sprite sheet that's going to be loaded
    private spriteConfig: ISpriteConfig[] = [];
    // Phaser loader plugin
    private load: Phaser.Loader.LoaderPlugin | undefined;
    // Phaser texture manager
    private textures: Phaser.Textures.TextureManager | undefined;
    // Phaser anims manager
    private anims: Phaser.Animations.AnimationManager | undefined;
    // List of registered sprite names to avoid loading duplicate sprites
    private registeredName: Map<string, boolean> = new Map();

    // constants
    // fps for sprite animation
    public readonly FRAME_RATE: number;
    // repeat for sprite animation after it's done, -1 means repeat forever
    private readonly REPEAT: number = -1;

    constructor({
        FRAME_RATE = 9,
    }: {
        FRAME_RATE?: number;
    } = {}) {
        this.FRAME_RATE = FRAME_RATE;
    }

    /**
     * Set the Phaser managers for loading sprites and managing animations.
     */
    public setConfigManager({
        load,
        textures,
        anims,
    }: {
        load: Phaser.Loader.LoaderPlugin;
        textures: Phaser.Textures.TextureManager;
        anims: Phaser.Animations.AnimationManager;
    }): void {
        this.load = load;
        this.textures = textures;
        this.anims = anims;
    }

    /**
     * Set the sprite configuration for loading and animation registration.
     */
    public setSpriteConfig(spriteConfig: ISpriteConfig[]): void {
        this.spriteConfig = spriteConfig;
    }

    /**
     * Get the stored sprite configuration.
     */
    public getSpriteConfig(): ISpriteConfig[] {
        return this.spriteConfig;
    }

    /**
     * Load all spritesheets from the stored configuration.
     */
    public loadAllSpriteSheet(): void {
        try {
            if (!this.spriteConfig) {
                return;
            }

            this.spriteConfig.forEach((sprite) => {
                this.loadSpriteSheet(sprite);
            });
        } catch (error) {
            console.error("Error in ConfigManager loadAllSpriteSheet()", error);
        }
    }

    /**
     * Register animation for a specific sprite.
     */
    public registerSpriteStateAnimation(sprite: ISpriteConfig): void {
        if (!this.anims) {
            console.error("Anims manager is not set");
            return;
        }

        if (!this.load) {
            console.error("Loader manager is not set");
            return;
        }

        // avoid showing broken sprite
        if (!this.validatePetSprite(sprite)) {
            return;
        }

        // in case sprite hasn't loaded yet, we load it
        if (this.textures && !this.textures.exists(sprite.name)) {
            this.loadSpriteSheet(sprite);
            this.load.start();

            this.load.once("complete", () => {
                // if loaded, try to register state animation again
                this.registerSpriteStateAnimation(sprite);
            });
            return;
        }

        // convert sprite states to lowercase because it helps to avoid error
        // when user edits their own json file and types state in uppercase
        for (const state in sprite.states) {
            if (state.toLowerCase() !== state) {
                sprite.states[state.toLowerCase()] = sprite.states[state];
                delete sprite.states[state];
            }
        }

        // register state animations for the sprite
        for (const animationConfig of this.getAnimationConfigPerSprite(sprite)) {
            if (!this.anims.exists(animationConfig.key)) {
                this.anims.create(animationConfig);
            }
        }
    }

    /**
     * Get the actual animation key name for a given state and sprite.
     */
    public getStateName(
        state: string,
        pet: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody
    ): string {
        return `${state}-${pet.texture.key}`;
    }

    /**
     * Get the frame dimensions for a sprite configuration.
     */
    public getFrameSize(sprite: ISpriteConfig): {
        frameWidth: number;
        frameHeight: number;
    } {
        if (sprite.frameSize) {
            return {
                frameWidth: sprite.frameSize,
                frameHeight: sprite.frameSize,
            };
        }

        const frameWidth = sprite.width! / sprite.highestFrameMax!;
        const frameHeight = sprite.height! / sprite.totalSpriteLine!;
        return { frameWidth, frameHeight };
    }

    /**
     * Load a single spritesheet into Phaser.
     */
    private loadSpriteSheet(sprite: ISpriteConfig): void {
        if (!this.load) {
            console.error("Loader manager is not set");
            return;
        }

        // if sprite name is duplicate, we skip it
        if (this.checkDuplicateName(sprite.name)) {
            return;
        }
        // if pet sprite is not valid, we skip it
        if (!this.validatePetSprite(sprite)) {
            return;
        }

        this.load.spritesheet({
            key: sprite.name,
            url: sprite.imageSrc,
            frameConfig: this.getFrameSize(sprite),
        });
    }

    /**
     * Generate animation configuration for each state of a sprite.
     */
    private getAnimationConfigPerSprite(sprite: ISpriteConfig): {
        key: string;
        frames: Phaser.Types.Animations.AnimationFrame[];
        frameRate: number;
        repeat: number;
    }[] {
        if (!sprite.states) {
            return [];
        }

        if (!this.anims) {
            console.error("Anims manager is not set");
            return [];
        }

        const animationConfig = [];
        const highestFrameMax = this.getHighestFrameMax(sprite);

        for (const state in sprite.states) {
            // we accept two types of state input: start/end or spriteLine/frameMax
            // -1 because phaser frame starts from 0
            const start =
                sprite.states[state].start !== undefined
                    ? sprite.states[state].start! - 1
                    : (sprite.states[state].spriteLine! - 1) * highestFrameMax;
            const end =
                sprite.states[state].end !== undefined
                    ? sprite.states[state].end! - 1
                    : start + sprite.states[state].frameMax! - 1;

            animationConfig.push({
                key: `${state}-${sprite.name}`,
                frames: this.anims.generateFrameNumbers(sprite.name, {
                    start: start,
                    end: end,
                    first: start,
                }),
                frameRate: this.FRAME_RATE,
                repeat: this.REPEAT,
            });
        }

        return animationConfig;
    }

    /**
     * Get the highest frame count across all states of a sprite.
     */
    private getHighestFrameMax(sprite: ISpriteConfig): number {
        if (sprite.highestFrameMax) {
            return sprite.highestFrameMax;
        }

        let highestFrameMax = 0;
        for (const state in sprite.states) {
            if (!sprite.states[state].frameMax!) {
                return 0;
            }
            highestFrameMax = Math.max(
                highestFrameMax,
                sprite.states[state].frameMax!
            );
        }

        return highestFrameMax;
    }

    /**
     * Check if a sprite name is already registered.
     */
    private checkDuplicateName(name: string): boolean {
        if (this.registeredName.has(name)) {
            console.warn(`Sprite name ${name} is already registered`);
            return true;
        }
        this.registeredName.set(name, true);
        return false;
    }

    /**
     * Validate that a sprite configuration has all required fields.
     */
    private validatePetSprite(sprite: ISpriteConfig): boolean {
        if (!sprite.name || !sprite.imageSrc || !sprite.states) {
            console.error(`Invalid sprite config: ${sprite.name ?? "unknown name"}`);
            return false;
        }

        // we accept two types of size: frameSize only, or width/height/highestFrameMax/totalSpriteLine
        if (
            !sprite.frameSize &&
            (!sprite.width ||
                !sprite.height ||
                !sprite.highestFrameMax ||
                !sprite.totalSpriteLine)
        ) {
            console.error(`Invalid sprite config: ${sprite.name}`);
            return false;
        }

        for (const state in sprite.states) {
            if (
                (!sprite.states[state].spriteLine ||
                    !sprite.states[state].frameMax) &&
                (!sprite.states[state].start || !sprite.states[state].end)
            ) {
                console.error(`Invalid sprite config: ${sprite.name}`);
                return false;
            }
        }

        return true;
    }
}
