export {};

declare global {
  interface Window {
    leaps?: {
      app?: "leaps" | "pet";
      onMenuCommand: (callback: (command: { type: string }) => void) => () => void;
    };
  }
}
