import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig(async () => ({
  plugins: [react()],

  // Vite options tailored for Tauri development
  clearScreen: false,

  server: {
    port: 1420,
    strictPort: true,
    // Tauri expects a fixed port, fail if that port is not available
    hmr: {
      // Use websocket for HMR with Tauri
      protocol: "ws",
      host: "localhost",
    },
  },

  // Env variables starting with TAURI_ are exposed to the frontend
  envPrefix: ["VITE_", "TAURI_"],
}));
