export {};

declare global {
  interface Window {
    leaps?: {
      onMenuCommand: (callback: (command: { type: string }) => void) => () => void;
    };
  }
}
