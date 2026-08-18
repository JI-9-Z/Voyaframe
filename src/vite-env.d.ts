/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_PUBLIC_BASE?: string
  readonly VITE_SITE_URL?: string
  readonly VITE_OPERATOR_NAME?: string
  readonly VITE_CONTACT_EMAIL?: string
  readonly VITE_ICP_NUMBER?: string
  readonly VITE_PUBLIC_SECURITY_NUMBER?: string
  readonly VITE_PUBLIC_SECURITY_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
