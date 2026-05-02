import { create } from "zustand";
import type { PetState, PetVisualState } from "../types/pet";

interface PetStore {
  state: PetState;
  visual: PetVisualState;

  setState: (newState: PetState) => void;
  setExpression: (expression: string) => void;
  setAnimation: (animation: string) => void;
  setScale: (scale: number) => void;
  setPosition: (x: number, y: number) => void;
  setLipSyncing: (isLipSyncing: boolean) => void;
}

export const usePetStore = create<PetStore>((set) => ({
  state: "idle",
  visual: {
    mode: "live2d",
    currentAnimation: "idle",
    currentExpression: "neutral",
    scale: 1.0,
    position: { x: 0, y: 0 },
    isLipSyncing: false,
  },

  setState: (newState) => set({ state: newState }),
  setExpression: (expression) =>
    set((prev) => ({ visual: { ...prev.visual, currentExpression: expression } })),
  setAnimation: (animation) =>
    set((prev) => ({ visual: { ...prev.visual, currentAnimation: animation } })),
  setScale: (scale) =>
    set((prev) => ({ visual: { ...prev.visual, scale } })),
  setPosition: (x, y) =>
    set((prev) => ({ visual: { ...prev.visual, position: { x, y } } })),
  setLipSyncing: (isLipSyncing) =>
    set((prev) => ({ visual: { ...prev.visual, isLipSyncing } })),
}));
