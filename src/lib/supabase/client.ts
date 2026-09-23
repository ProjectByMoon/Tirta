import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = String(import.meta.env.VITE_SUPABASE_URL || '').trim().replace(/\/$/, '')
const SUPABASE_PUBLISHABLE_KEY = String(import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim()

export const isSupabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_PUBLISHABLE_KEY)

// Do not ship a real fallback project. The inert endpoint keeps the module
// import-safe so the app can render a configuration error instead of crashing
// before React mounts when deployment variables are missing.
const clientUrl = SUPABASE_URL || 'https://invalid.local'
const clientKey = SUPABASE_PUBLISHABLE_KEY || 'missing-anon-key'

export const supabase = createClient(clientUrl, clientKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
})
