/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Omit in dev to use Vite proxy (/api). If set to API origin only, /api is appended automatically. */
  readonly VITE_API_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
