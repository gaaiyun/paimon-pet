import { create } from "zustand";
import type { ChatMessage } from "../types/pet";

interface ChatStore {
  messages: ChatMessage[];
  isTyping: boolean;

  addMessage: (role: ChatMessage["role"], text: string) => void;
  setTyping: (isTyping: boolean) => void;
  clearMessages: () => void;
}

export const useChatStore = create<ChatStore>((set) => ({
  messages: [],
  isTyping: false,

  addMessage: (role, text) =>
    set((prev) => ({
      messages: [
        ...prev.messages,
        {
          id: crypto.randomUUID(),
          role,
          text,
          timestamp: Date.now(),
        },
      ],
    })),

  setTyping: (isTyping) => set({ isTyping }),

  clearMessages: () => set({ messages: [] }),
}));
