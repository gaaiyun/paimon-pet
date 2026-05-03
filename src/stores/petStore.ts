import { create } from "zustand";
import type { PetState } from "../types/pet";

interface PetStore {
  state: PetState;

  setState: (newState: PetState) => void;
}

export const usePetStore = create<PetStore>((set) => ({
  state: "idle",

  setState: (newState) => set({ state: newState }),
}));
