/// <reference types="vite/client" />

declare module '*.svg' {
  import React = require('react');
  export const ReactComponent: React.FC<React.SVGProps<SVGSVGElement>>;
  const src: string;
  export default src;
}

interface ImportMetaEnv {
  readonly VITE_VAULT_PRIVATE_KEY: string
  readonly VITE_RPC_ENDPOINT: string
  readonly VITE_TOKEN_MINT: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
