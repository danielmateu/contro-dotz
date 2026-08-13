import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'

// Read .env file
const envPath = path.resolve(process.cwd(), '.env')
const envContent = fs.readFileSync(envPath, 'utf8')
const env = {}
envContent.split('\n').forEach(line => {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/)
  if (match) {
    const key = match[1]
    let value = match[2] || ''
    if (value.startsWith('"') && value.endsWith('"')) {
      value = value.slice(1, -1)
    }
    env[key] = value
  }
})

const supabaseUrl = env['NEXT_PUBLIC_SUPABASE_URL']
const supabaseKey = env['NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY']

console.log('URL:', supabaseUrl)
console.log('Key:', supabaseKey ? 'exists' : 'missing')

const supabase = createClient(supabaseUrl, supabaseKey)

async function check() {
  const { data, error } = await supabase.from('profiles').select('*').limit(1)
  if (error) {
    console.error('Error fetching profiles:', error)
  } else {
    console.log('Profiles structure:', data)
  }
}

check()
