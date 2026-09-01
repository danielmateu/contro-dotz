import fs from 'fs'
import path from 'path'
import { createClient } from '@supabase/supabase-js'

const envPath = path.resolve(process.cwd(), '.env')
let envContent = ''
try {
  envContent = fs.readFileSync(envPath, 'utf8')
} catch (e) {
  envContent = fs.readFileSync(path.resolve(process.cwd(), '.env.local'), 'utf8')
}

const env = {}
envContent.split('\n').forEach(line => {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/)
  if (match) {
    let value = (match[2] || '').trim()
    if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1)
    env[match[1]] = value
  }
})

// Check if service role key exists or use standard key
const supabaseUrl = env['NEXT_PUBLIC_SUPABASE_URL']
const supabaseKey = env['SUPABASE_SERVICE_ROLE_KEY'] || env['NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY']

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkSchema() {
  console.log('Testing select on messages...')
  const { data, error } = await supabase.from('messages').select('*').limit(1)
  console.log('Messages columns:', data ? Object.keys(data[0] || {}) : 'no data', 'Error:', error)
  
  console.log('Testing select on expenses...')
  const { data: expData, error: expErr } = await supabase.from('expenses').select('*').limit(1)
  console.log('Expenses columns:', expData ? Object.keys(expData[0] || {}) : 'no data', 'Error:', expErr)
}

checkSchema()
