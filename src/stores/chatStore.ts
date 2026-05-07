import { create } from "zustand";
import type { ChatMessage } from "../types/pet";

/** Maximum number of messages retained in memory. */
const MAX_MESSAGES = 200;

/** Trim oldest messages when the list exceeds the cap. */
function trim(messages: ChatMessage[]): ChatMessage[] {
  return messages.length > MAX_MESSAGES ? messages.slice(-MAX_MESSAGES) : messages;
}

interface ChatStore {
  messages: ChatMessage[];
  isTyping: boolean;

  addMessage: (role: ChatMessage["role"], text: string) => void;
  appendToLastAssistant: (text: string) => void;
  setTyping: (isTyping: boolean) => void;
  clearMessages: () => void;
}

export const useChatStore = create<ChatStore>((set) => ({
  messages: [],
  isTyping: false,

  addMessage: (role, text) =>
    set((prev) => ({
      messages: trim([
        ...prev.messages,
        {
          id: crypto.randomUUID(),
          role,
          text,
          timestamp: Date.now(),
        },
      ]),
    })),

  appendToLastAssistant: (text) =>
    set((prev) => {
      const msgs = [...prev.messages];
      const lastIdx = msgs.length - 1;
      if (lastIdx >= 0 && msgs[lastIdx].role === "assistant") {
        msgs[lastIdx] = { ...msgs[lastIdx], text: msgs[lastIdx].text + text };
      } else {
        msgs.push({
          id: crypto.randomUUID(),
          role: "assistant",
          text,
          timestamp: Date.now(),
        });
      }
      return { messages: trim(msgs) };
    }),

  setTyping: (isTyping) => set({ isTyping }),

  clearMessages: () => set({ messages: [] }),
}));
