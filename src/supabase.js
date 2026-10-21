import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://uwagknzzivazxtjtqlvk.supabase.co'
const supabaseAnonKey = 'sb_publishable_CvIkoFksb97Q3H0q-oEbmw_gMo372pF'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)