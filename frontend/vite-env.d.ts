/// \u003creference types="vite/client" />

interface ImportMetaEnv {
    readonly VITE_PRIMARY_AI_API_KEY?: string
    readonly VITE_GOOGLE_AI_API_KEY?: string
    readonly VITE_GEMINI_API_KEY?: string
}

interface ImportMeta {
    readonly env: ImportMetaEnv
}
