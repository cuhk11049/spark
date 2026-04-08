/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_ICEMAN_API_BASE_URL?: string;
  readonly VITE_ICEMAN_HOST?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
