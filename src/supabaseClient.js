import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Error: Las variables de entorno REACT_APP_SUPABASE_URL y REACT_APP_SUPABASE_ANON_KEY deben estar configuradas');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
