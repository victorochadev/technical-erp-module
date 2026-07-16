require('dotenv').config()
const { createClient } = require('@supabase/supabase-js')

if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
  throw new Error('SUPABASE_URL e SUPABASE_ANON_KEY precisam estar definidos no .env')
}

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY)

module.exports = supabase
