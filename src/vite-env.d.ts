/// <reference types="vite/client" />

declare global {
  interface ImportMetaEnv {
    readonly VITE_GOOGLE_SHEET_ID?: string;
    readonly VITE_GOOGLE_SHEET_NAME?: string;
    readonly VITE_GOOGLE_CLIENT_ID?: string;
    readonly VITE_GOOGLE_AUTH_SCRIPT_URL?: string;
  }

  interface ImportMeta {
    readonly env: ImportMetaEnv;
  }
}

export {};