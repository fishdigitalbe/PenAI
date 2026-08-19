import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://lwezzcpvuspezufndvzo.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx3ZXp6Y3B2dXNwZXp1Zm5kdnpvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk5MTcwNjUsImV4cCI6MjA3NTQ5MzA2NX0.k6baXY4qFj5lF9xOBSnUPJo2Wen6MxwpX9JgkikFn20'

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
})