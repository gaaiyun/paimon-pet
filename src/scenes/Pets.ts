import { useSettingStore } from "../hooks/useSettingStore";
import { listen } from "@tauri-apps/api/event";
import {
    DispatchType,
    EventType,
    TRenderEventListener,
} from "../types/IEvents";
import {
    Direction,
    IWorldBounding,
    ISwitchStateOptions,
    Ease,
} from "../types/IPet";
import { info, error } from "@tauri-apps/plugin-log";
import { ConfigManager, InputManager } from "./manager";

// Default settings matching src-tauri configuration
const defaultSettings = {
    allowPetInteraction: true,
    allowPetAboveTaskbar: true,
    allowOverridePetScale: false,
    petScale: 1.0,
    allowPetClimbing: true,
};

interface PaimonPet extends Phaser.Types.Physics.Arcade.SpriteWithDynamicBody {
    direction?: Direction;
    availableStates: string[];
    canPlayRandomState: boolean;
    canRandomFlip: boolean;
    id: string;
}

/**
 * Pets - Main scene for rendering Paimon desktop pet.
 * Handles sprite creation, physics, drag interactions, and random state changes.
 */
export default class Pets extends Phaser.Scene {
    // Single Paimon pet instance
    private paimon: PaimonPet | null = null;
    private isFlipped: boolean = false;
    private frameCount: number = 0;

    private configManager: ConfigManager;
    private inputManager: InputManager;

    // App settings
    private allowPetInteraction: boolean;
    private allowPetAboveTaskbar: boolean;
    private allowOverridePetScale: boolean;
    private petScale: number;
    private allowPetClimbing: boolean;

    // Only available states: idle, running-right, running-left, waving, jumping, failed, waiting, running, review
    private readonly FORBIDDEN_RAND_STATE: string[] = [
        "fall",
        "climb",
        "crawl",
        "drag",
        "bounce",
    ];

    private readonly FRAME_RATE: number = 30;
    private readonly UPDATE_DELAY: number = 1000 / this.FRAME_RATE;
    private readonly PET_MOVE_VELOCITY: number = this.FRAME_RATE * 6;
    private readonly PET_MOVE_ACCELERATION: number = this.PET_MOVE_VELOCITY * 2;
    private readonly TWEEN_ACCELERATION: number = this.FRAME_RATE * 1.1;
    private readonly RAND_STATE_DELAY: number = 3000;
    private readonly FLIP_DELAY: number = 5000;

    // States that trigger climbing behavior
    private readonly CLIMB_STATES: string[] = ["climb", "crawl"];
    private isClimbingState: boolean = false;

    constructor() {
        super({ key: "Pets" });

        this.allowPetInteraction =
            useSettingStore.getState().allowPetInteraction ??
            defaultSettings.allowPetInteraction;
        this.allowPetAboveTaskbar =
            useSettingStore.getState().allowPetAboveTaskbar ??
            defaultSettings.allowPetAboveTaskbar;
        this.allowOverridePetScale =
            useSettingStore.getState().allowOverridePetScale ??
            defaultSettings.allowOverridePetScale;
        this.petScale =
            useSettingStore.getState().petScale ?? defaultSettings.petScale;
        this.allowPetClimbing =
            useSettingStore.getState().allowPetClimbing ??
            defaultSettings.allowPetClimbing;

        this.configManager = new ConfigManager({
            FRAME_RATE: this.FRAME_RATE,
        });
        this.inputManager = new InputManager();
    }

    preload(): void {
        this.configManager.setConfigManager({
            load: this.load,
            textures: this.textures,
            anims: this.anims,
        });

        this.inputManager.setInputManager(this.input);
        const spriteConfig = this.game.registry.get("spriteConfig");
        this.configManager.setSpriteConfig(spriteConfig);
        this.configManager.loadAllSpriteSheet();
    }

    create(): void {
        this.inputManager.turnOnIgnoreCursorEvents();

        // Set up physics world with gravity
        this.physics.world.setBoundsCollision(true, true, true, true);

        this.updatePetAboveTaskbar();

        // Create Paimon pet
        const spriteConfig = this.configManager.getSpriteConfig();
        if (spriteConfig.length > 0) {
            this.createPaimon(spriteConfig[0]);
        }

        // Drag events
        this.setupDragEvents();

        // World bounds collision
        this.setupWorldBoundsEvents();

        // Listen to setting changes
        this.setupSettingListeners();

        info("Pets scene loaded");
    }

    update(_time: number, delta: number): void {
        this.frameCount += delta;

        if (this.frameCount >= this.UPDATE_DELAY) {
            this.frameCount = 0;
            if (this.allowPetInteraction) {
                this.inputManager.checkIsMouseInOnPet();
            }

            // Handle random jump when climbing
            this.randomJumpIfClimbing();
        }
    }

    /**
     * Create the Paimon sprite with physics and interactivity
     */
    private createPaimon(sprite: any): void {
        this.configManager.registerSpriteStateAnimation(sprite);

        const randomX = Phaser.Math.Between(
            100,
            this.physics.world.bounds.width - 100
        );
        // Make pet spawn from top of screen
        const petY = 0 + this.configManager.getFrameSize(sprite).frameHeight;

        this.paimon = this.physics.add
            .sprite(randomX, petY, sprite.name)
            .setInteractive({
                draggable: true,
                pixelPerfect: true,
            }) as PaimonPet;

        // Apply scale
        this.allowOverridePetScale
            ? this.scalePet(this.petScale)
            : this.scalePet(defaultSettings.petScale);

        // Enable world bounds collision
        this.paimon.setCollideWorldBounds(true, 0, 0, true);

        // Store available states
        this.paimon.availableStates = Object.keys(sprite.states);
        this.paimon.canPlayRandomState = true;
        this.paimon.canRandomFlip = true;
        this.paimon.id = sprite.id as string;

        // Start with random state (jump from top)
        this.petJumpOrPlayRandomState();
    }

    /**
     * Set up drag event handlers
     */
    private setupDragEvents(): void {
        this.input.on(
            "drag",
            (pointer: Phaser.Input.Pointer, pet: PaimonPet, dragX: number, dragY: number) => {
                pet.x = dragX;
                pet.y = dragY;

                // pointer is used implicitly in drag handling
                void pointer;

                // Switch to drag animation if available
                if (
                    pet.anims &&
                    pet.anims.getName() !==
                        this.configManager.getStateName("drag", pet)
                ) {
                    if (pet.availableStates.includes("drag")) {
                        this.switchState("drag");
                    }
                }

                // Disable body when dragging so pet can go beyond screen
                // @ts-ignore
                if (pet.body!.enable) pet.body!.enable = false;

                // Flip based on drag direction
                if (pet.x > pet.input!.dragStartX) {
                    if (this.isFlipped) {
                        this.toggleFlipX(pet);
                        this.isFlipped = false;
                    }
                } else {
                    if (!this.isFlipped) {
                        this.toggleFlipX(pet);
                        this.isFlipped = true;
                    }
                }
            }
        );

        this.input.on("dragend", (pointer: any, pet: PaimonPet) => {
            // Add tween effect for smooth throw
            this.tweens.add({
                targets: pet,
                x: pet.x + pointer.velocity.x * this.TWEEN_ACCELERATION,
                y: pet.y + pointer.velocity.y * this.TWEEN_ACCELERATION,
                duration: 600,
                ease: Ease.QuartEaseOut,
                onComplete: () => {
                    if (!pet.body!.enable) {
                        pet.body!.enable = true;

                        setTimeout(() => {
                            switch (pet.anims.getName()) {
                                case this.configManager.getStateName(
                                    "climb",
                                    pet
                                ):
                                    this.updateDirection(Direction.UP);
                                    break;
                                case this.configManager.getStateName(
                                    "crawl",
                                    pet
                                ):
                                    this.updateDirection(
                                        pet.scaleX === -1
                                            ? Direction.UPSIDELEFT
                                            : Direction.UPSIDERIGHT
                                    );
                                    break;
                                default:
                                    return;
                            }
                        }, 50);
                    }
                },
            });

            // Handle pet beyond screen after drag
            this.petBeyondScreenSwitchClimb({
                up: this.getPetBoundTop(),
                down: this.getPetBoundDown(),
                left: this.getPetBoundLeft(),
                right: this.getPetBoundRight(),
            });
        });
    }

    /**
     * Set up world bounds collision events
     */
    private setupWorldBoundsEvents(): void {
        this.physics.world.on(
            "worldbounds",
            (
                _body: Phaser.Physics.Arcade.Body,
                up: boolean,
                down: boolean,
                left: boolean,
                right: boolean
            ) => {
                if (!this.paimon) return;

                // Handle crawl hitting bounds
                if (
                    this.paimon.anims &&
                    this.paimon.anims.getName() ===
                        this.configManager.getStateName("crawl", this.paimon)
                ) {
                    if (left || right) {
                        this.petJumpOrPlayRandomState();
                    }
                    return;
                }

                // Handle falling off top of screen
                if (up) {
                    if (!this.allowPetClimbing) {
                        this.petJumpOrPlayRandomState();
                        return;
                    }

                    if (this.paimon.availableStates.includes("crawl")) {
                        this.switchState("crawl");
                        this.isClimbingState = true;
                        return;
                    }
                    this.petJumpOrPlayRandomState();
                } else if (down) {
                    // Pet hit the ground
                    this.switchStateAfterPetJump();
                    this.petOnTheGroundPlayRandomState();
                }

                // Check if pet is beyond screen
                this.petBeyondScreenSwitchClimb({
                    up: up,
                    down: down,
                    left: left,
                    right: right,
                });
            }
        );
    }

    /**
     * Set up setting change listeners
     */
    private setupSettingListeners(): void {
        listen<any>(
            EventType.SettingWindowToPetOverlay,
            (event: TRenderEventListener) => {
                switch (event.payload.dispatchType) {
                    case DispatchType.SwitchAllowPetInteraction:
                        this.allowPetInteraction = event.payload
                            .value as boolean;
                        break;
                    case DispatchType.SwitchPetAboveTaskbar:
                        this.allowPetAboveTaskbar = event.payload
                            .value as boolean;
                        this.updatePetAboveTaskbar();
                        if (!this.allowPetAboveTaskbar && this.paimon) {
                            this.petJumpOrPlayRandomState();
                        }
                        break;
                    case DispatchType.OverridePetScale:
                        this.allowOverridePetScale = event.payload
                            .value as boolean;
                        this.allowOverridePetScale
                            ? this.scaleAllPets(this.petScale)
                            : this.scaleAllPets(defaultSettings.petScale);
                        break;
                    case DispatchType.SwitchAllowPetClimbing:
                        this.allowPetClimbing = event.payload.value as boolean;
                        if (!this.allowPetClimbing && this.paimon) {
                            this.petJumpOrPlayRandomState();
                        }
                        break;
                    case DispatchType.ChangePetScale:
                        this.petScale = event.payload.value as number;
                        this.scaleAllPets(this.petScale);
                        break;
                    default:
                        break;
                }
            }
        );
    }

    /**
     * Switch to a new state
     */
    switchState(
        state: string,
        options: ISwitchStateOptions = {
            repeat: -1,
            delay: 0,
            repeatDelay: 0,
        }
    ): void {
        if (!this.paimon) return;

        try {
            if (!this.paimon.anims) return;

            // Prevent climb/crawl if not allowed
            if (!this.allowPetClimbing) {
                if (state === "climb" || state === "crawl") return;
            }

            const animationKey = this.configManager.getStateName(
                state,
                this.paimon
            );

            // Don't restart if already playing
            if (
                this.paimon.anims &&
                this.paimon.anims.getName() === animationKey
            )
                return;

            if (!this.paimon.availableStates.includes(state)) return;

            this.paimon.anims.play({
                key: animationKey,
                repeat: options.repeat,
                delay: options.delay,
                repeatDelay: options.repeatDelay,
            });

            // Track climbing states
            if (this.CLIMB_STATES.includes(state)) {
                this.isClimbingState = true;
            } else {
                this.isClimbingState = false;
            }

            this.updateStateDirection(state);
        } catch (err: any) {
            error(err);
        }
    }

    /**
     * Update direction based on movement state
     */
    private updateStateDirection(state: string): void {
        if (!this.paimon) return;

        let direction = Direction.UNKNOWN;

        switch (state) {
            case "running-right":
                direction = Direction.RIGHT;
                break;
            case "running-left":
                direction = Direction.LEFT;
                break;
            case "running":
                direction = this.paimon.scaleX < 0 ? Direction.LEFT : Direction.RIGHT;
                break;
            case "jump":
            case "jumping":
                this.toggleFlipX(this.paimon);
                direction = Direction.DOWN;
                break;
            case "climb":
                direction = Direction.UP;
                break;
            case "crawl":
                this.paimon.scaleX > 0
                    ? (direction = Direction.UPSIDELEFT)
                    : (direction = Direction.UPSIDERIGHT);
                break;
            default:
                direction = Direction.UNKNOWN;
                break;
        }

        this.updateDirection(direction);
    }

    /**
     * Update pet direction and movement
     */
    private updateDirection(direction: Direction): void {
        if (!this.paimon) return;

        this.paimon.direction = direction;
        this.updateMovement();
    }

    /**
     * Apply velocity and acceleration based on direction
     */
    private updateMovement(): void {
        if (!this.paimon) return;

        switch (this.paimon.direction) {
            case Direction.RIGHT:
                this.paimon.setVelocity(this.PET_MOVE_VELOCITY, 0);
                this.paimon.setAcceleration(0);
                this.setPetLookToTheLeft(false);
                break;
            case Direction.LEFT:
                this.paimon.setVelocity(-this.PET_MOVE_VELOCITY, 0);
                this.paimon.setAcceleration(0);
                this.setPetLookToTheLeft(true);
                break;
            case Direction.UP:
                this.paimon.setVelocity(0, -this.PET_MOVE_VELOCITY);
                this.paimon.setAcceleration(0);
                break;
            case Direction.DOWN:
                this.paimon.setVelocity(0, this.PET_MOVE_VELOCITY);
                this.paimon.setAcceleration(0, this.PET_MOVE_ACCELERATION);
                break;
            case Direction.UPSIDELEFT:
                this.paimon.setVelocity(-this.PET_MOVE_VELOCITY);
                this.paimon.setAcceleration(0);
                this.setPetLookToTheLeft(true);
                break;
            case Direction.UPSIDERIGHT:
                this.paimon.setVelocity(
                    this.PET_MOVE_VELOCITY,
                    -this.PET_MOVE_VELOCITY
                );
                this.paimon.setAcceleration(0);
                this.setPetLookToTheLeft(false);
                break;
            case Direction.UNKNOWN:
                this.paimon.setVelocity(0);
                this.paimon.setAcceleration(0);
                break;
            default:
                this.paimon.setVelocity(0);
                this.paimon.setAcceleration(0);
                break;
        }

        // Disable gravity when moving up
        const isMovingUp = [
            Direction.UP,
            Direction.UPSIDELEFT,
            Direction.UPSIDERIGHT,
        ].includes(this.paimon.direction as Direction);

        // @ts-ignore
        this.paimon.body!.setAllowGravity(!isMovingUp);

        if (this.paimon.direction === Direction.UP) {
            this.paimon.setVelocityX(0);
        }
    }

    /**
     * Set pet to look left or right
     */
    private setPetLookToTheLeft(lookToTheLeft: boolean): void {
        if (!this.paimon) return;

        if (lookToTheLeft) {
            if (this.paimon.scaleX > 0) {
                this.toggleFlipX(this.paimon);
            }
            return;
        }

        if (this.paimon.scaleX < 0) {
            this.toggleFlipX(this.paimon);
        }
    }

    /**
     * Toggle horizontal flip
     */
    private toggleFlipX(pet: PaimonPet): void {
        // Using scale instead of flipX because flipX doesn't flip hitbox
        pet.scaleX > 0 ? pet.setOffset(pet.width, 0) : pet.setOffset(0, 0);
        pet.setScale(pet.scaleX * -1, pet.scaleY);
    }

    /**
     * Scale the pet
     */
    private scalePet(scaleValue: number): void {
        if (!this.paimon) return;

        const scaleX = this.paimon.scaleX > 0 ? scaleValue : -scaleValue;
        const scaleY = this.paimon.scaleY > 0 ? scaleValue : -scaleValue;
        this.paimon.setScale(scaleX, scaleY);
    }

    /**
     * Scale all pets (for settings update)
     */
    private scaleAllPets(scaleValue: number): void {
        this.scalePet(scaleValue);
        if (this.paimon) {
            this.petJumpOrPlayRandomState();
        }
    }

    /**
     * Get a random state from available states
     */
    private getOneRandomState(): string {
        if (!this.paimon) return "idle";

        let randomStateIndex;

        do {
            randomStateIndex = Phaser.Math.Between(
                0,
                this.paimon.availableStates.length - 1
            );
        } while (
            this.FORBIDDEN_RAND_STATE.includes(
                this.paimon.availableStates[randomStateIndex]
            )
        );

        return this.paimon.availableStates[randomStateIndex];
    }

    /**
     * Play a random state with delay to prevent spamming
     */
    private playRandomState(): void {
        if (!this.paimon || !this.paimon.canPlayRandomState) return;

        this.switchState(this.getOneRandomState());
        this.paimon.canPlayRandomState = false;

        setTimeout(() => {
            if (this.paimon) {
                this.paimon.canPlayRandomState = true;
            }
        }, this.RAND_STATE_DELAY);
    }

    /**
     * Handle state after pet lands from a jump
     */
    private switchStateAfterPetJump(): void {
        if (!this.paimon) return;

        if (
            this.paimon.anims &&
            this.paimon.anims.getName() !==
                this.configManager.getStateName("jump", this.paimon) &&
            this.paimon.anims.getName() !==
                this.configManager.getStateName("jumping", this.paimon)
        )
            return;

        if (this.paimon.availableStates.includes("fall")) {
            this.switchState("fall", { repeat: 0 });

            this.paimon.canPlayRandomState = false;
            this.paimon.on("animationcomplete", () => {
                if (this.paimon) {
                    this.paimon.canPlayRandomState = true;
                    this.playRandomState();
                }
            });
            return;
        }

        this.playRandomState();
    }

    /**
     * Get ground position
     */
    private getPetGroundPosition(): number {
        if (!this.paimon) return 0;
        return (
            this.physics.world.bounds.height -
            this.paimon.height * Math.abs(this.paimon.scaleY) * this.paimon.originY
        );
    }

    /**
     * Get top position
     */
    private getPetTopPosition(): number {
        if (!this.paimon) return 0;
        return this.paimon.height * Math.abs(this.paimon.scaleY) * this.paimon.originY;
    }

    /**
     * Get left position
     */
    private getPetLeftPosition(): number {
        if (!this.paimon) return 0;
        return this.paimon.width * Math.abs(this.paimon.scaleX) * this.paimon.originX;
    }

    /**
     * Get right position
     */
    private getPetRightPosition(): number {
        if (!this.paimon) return 0;
        return (
            this.physics.world.bounds.width -
            this.paimon.width * Math.abs(this.paimon.scaleX) * this.paimon.originX
        );
    }

    /**
     * Check if pet is at ground
     */
    private getPetBoundDown(): boolean {
        if (!this.paimon) return false;
        return this.paimon.y >= this.getPetGroundPosition();
    }

    /**
     * Check if pet is at left edge
     */
    private getPetBoundLeft(): boolean {
        if (!this.paimon) return false;
        return this.paimon.x <= this.getPetLeftPosition();
    }

    /**
     * Check if pet is at right edge
     */
    private getPetBoundRight(): boolean {
        if (!this.paimon) return false;
        return this.paimon.x >= this.getPetRightPosition();
    }

    /**
     * Check if pet is at top edge
     */
    private getPetBoundTop(): boolean {
        if (!this.paimon) return false;
        return this.paimon.y <= this.getPetTopPosition();
    }

    /**
     * Update world bounds based on taskbar setting
     */
    private updatePetAboveTaskbar(): void {
        if (this.allowPetAboveTaskbar) {
            const taskbarHeight = window.screen.height - window.screen.availHeight;
            this.physics.world.setBounds(
                0,
                0,
                window.screen.width,
                window.screen.height - taskbarHeight
            );
            return;
        }

        this.physics.world.setBounds(
            0,
            0,
            window.screen.width,
            window.screen.height
        );
    }

    /**
     * Make pet jump or play random state
     */
    private petJumpOrPlayRandomState(): void {
        if (!this.paimon) return;

        if (
            this.paimon.availableStates.includes("jump") ||
            this.paimon.availableStates.includes("jumping")
        ) {
            this.switchState("jumping");
            return;
        }

        this.switchState(this.getOneRandomState());
    }

    /**
     * Play random state when pet is on the ground
     */
    private petOnTheGroundPlayRandomState(): void {
        if (!this.paimon) return;

        switch (this.paimon.anims.getName()) {
            case this.configManager.getStateName("climb", this.paimon):
                return;
            case this.configManager.getStateName("crawl", this.paimon):
                return;
            case this.configManager.getStateName("drag", this.paimon):
                return;
            case this.configManager.getStateName("jump", this.paimon):
            case this.configManager.getStateName("jumping", this.paimon):
                return;
        }

        const random = Phaser.Math.Between(0, 2000);

        // Walking state behavior
        if (
            this.paimon.anims &&
            (this.paimon.anims.getName() ===
                this.configManager.getStateName("running", this.paimon) ||
                this.paimon.anims.getName() ===
                    this.configManager.getStateName("running-right", this.paimon) ||
                this.paimon.anims.getName() ===
                    this.configManager.getStateName("running-left", this.paimon))
        ) {
            if (random >= 0 && random <= 5) {
                this.switchState("idle");
                setTimeout(() => {
                    if (
                        this.paimon &&
                        this.paimon.anims &&
                        this.paimon.anims.getName() !==
                            this.configManager.getStateName("idle", this.paimon)
                    )
                        return;
                    this.switchState("running");
                }, Phaser.Math.Between(3000, 6000));
                return;
            }
        } else {
            // Enhanced random state for non-walking states
            if (random >= 777 && random <= 800) {
                this.playRandomState();
                return;
            }
        }

        // Random flip
        if (random >= 888 && random <= 890) {
            if (this.paimon && this.paimon.canRandomFlip) {
                this.toggleFlipXThenUpdateDirection();
                this.paimon.canRandomFlip = false;

                setTimeout(() => {
                    if (this.paimon) {
                        this.paimon.canRandomFlip = true;
                    }
                }, this.FLIP_DELAY);
            }
        } else if (random >= 777 && random <= 780) {
            this.playRandomState();
        } else if (random >= 170 && random <= 175) {
            this.switchState("running");
        }
    }

    /**
     * Toggle flip and update direction
     */
    private toggleFlipXThenUpdateDirection(): void {
        if (!this.paimon) return;

        this.toggleFlipX(this.paimon);

        switch (this.paimon.direction) {
            case Direction.RIGHT:
                this.updateDirection(Direction.LEFT);
                break;
            case Direction.LEFT:
                this.updateDirection(Direction.RIGHT);
                break;
            case Direction.UPSIDELEFT:
                this.updateDirection(Direction.UPSIDERIGHT);
                break;
            case Direction.UPSIDERIGHT:
                this.updateDirection(Direction.UPSIDELEFT);
                break;
            default:
                break;
        }
    }

    /**
     * Random jump when pet is climbing
     */
    private randomJumpIfClimbing(): void {
        if (!this.paimon || !this.isClimbingState) return;

        switch (this.paimon.anims.getName()) {
            case this.configManager.getStateName("drag", this.paimon):
            case this.configManager.getStateName("jump", this.paimon):
            case this.configManager.getStateName("jumping", this.paimon):
                return;
        }

        const random = Phaser.Math.Between(0, 500);

        // Random jump trigger
        if (random === 78) {
            let newPetX = this.paimon.x;

            // Add opposite X direction when climbing
            if (
                this.paimon.anims &&
                this.paimon.anims.getName() ===
                    this.configManager.getStateName("climb", this.paimon)
            ) {
                newPetX =
                    this.paimon.scaleX < 0
                        ? Phaser.Math.Between(this.paimon.x, 500)
                        : Phaser.Math.Between(
                              this.paimon.x,
                              this.physics.world.bounds.width - 500
                          );
            }

            // Disable body to prevent shaking
            // @ts-ignore
            if (this.paimon.body!.enable) this.paimon.body!.enable = false;

            this.switchState("jumping");

            // Tween animation for smooth jump
            this.tweens.add({
                targets: this.paimon,
                x: newPetX,
                y: this.getPetGroundPosition(),
                duration: 3000,
                ease: Ease.QuadEaseOut,
                onComplete: () => {
                    if (this.paimon) {
                        // @ts-ignore
                        if (!this.paimon.body!.enable) {
                            // @ts-ignore
                            this.paimon.body!.enable = true;
                            this.switchStateAfterPetJump();
                        }
                    }
                },
            });
            return;
        }

        // Random pause when climbing
        if (random >= 0 && random <= 5) {
            if (
                this.paimon.anims &&
                this.paimon.anims.getName() ===
                    this.configManager.getStateName("climb", this.paimon)
            ) {
                this.paimon.anims.pause();
                this.updateDirection(Direction.UNKNOWN);
                // @ts-ignore
                this.paimon.body!.allowGravity = false;

                setTimeout(() => {
                    if (
                        this.paimon &&
                        this.paimon.anims &&
                        !this.paimon.anims.isPlaying
                    ) {
                        this.paimon.anims.resume();
                        this.updateDirection(Direction.UP);
                    }
                }, Phaser.Math.Between(3000, 6000));
                return;
            } else if (
                this.paimon.anims &&
                this.paimon.anims.getName() ===
                    this.configManager.getStateName("crawl", this.paimon)
            ) {
                this.paimon.anims.pause();
                this.updateDirection(Direction.UNKNOWN);
                // @ts-ignore
                this.paimon.body!.allowGravity = false;

                setTimeout(() => {
                    if (
                        this.paimon &&
                        this.paimon.anims &&
                        !this.paimon.anims.isPlaying
                    ) {
                        this.paimon.anims.resume();
                        this.updateDirection(
                            this.paimon.scaleX < 0
                                ? Direction.UPSIDELEFT
                                : Direction.UPSIDERIGHT
                        );
                    }
                }, Phaser.Math.Between(3000, 6000));
                return;
            }
        }
    }

    /**
     * Handle pet beyond screen switching climb states
     */
    private petBeyondScreenSwitchClimb(worldBounding: IWorldBounding): void {
        if (!this.paimon) return;

        // Skip if already climbing
        switch (this.paimon.anims.getName()) {
            case this.configManager.getStateName("climb", this.paimon):
            case this.configManager.getStateName("crawl", this.paimon):
                return;
        }

        if (worldBounding.left || worldBounding.right) {
            if (
                this.paimon.availableStates.includes("climb") &&
                this.allowPetClimbing
            ) {
                this.switchState("climb");

                const lastPetX = this.paimon.x;

                if (worldBounding.left) {
                    this.paimon.setPosition(
                        lastPetX - this.getPetLeftPosition(),
                        this.paimon.y
                    );
                    this.setPetLookToTheLeft(true);
                } else {
                    this.paimon.setPosition(
                        lastPetX + this.getPetRightPosition(),
                        this.paimon.y
                    );
                    this.setPetLookToTheLeft(false);
                }
            } else {
                if (worldBounding.down) {
                    this.toggleFlipXThenUpdateDirection();
                } else {
                    this.petJumpOrPlayRandomState();
                }
            }
        } else {
            if (worldBounding.down) {
                // On ground after drag
                if (
                    this.paimon.anims &&
                    this.paimon.anims.getName() ===
                        this.configManager.getStateName("drag", this.paimon)
                ) {
                    this.switchState(this.getOneRandomState());
                }
            } else {
                this.petJumpOrPlayRandomState();
            }
        }
    }
}