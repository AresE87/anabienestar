import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://rnbyxwcrtulxctplerqs.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJuYnl4d2NydHVseGN0cGxlcnFzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE0MjQ3MjIsImV4cCI6MjA4NzAwMDcyMn0.gwWyvyqk8431wvejeswrnxND1g_EpMRNVx8JllU7o-g'

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    storageKey: 'anabienestar-auth',
    autoRefreshToken: true,
    detectSessionInUrl: true,
    flowType: 'implicit',
    // Desactivar Web Locks API (se cuelga en ciertas redes/navegadores)
    lock: async (_name, _acquireTimeout, fn) => fn(),
  },
})
