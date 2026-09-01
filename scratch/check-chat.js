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

const supabase = createClient(env['NEXT_PUBLIC_SUPABASE_URL'], env['NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY'])

async function run() {
  console.log('--- MESSAGES ---')
  const { data: msgs, error: msgErr } = await supabase.from('messages').select('*').order('created_at', { ascending: false }).limit(5)
  console.log('Messages error:', msgErr)
  console.log('Messages count/data:', msgs?.length, msgs)

  console.log('--- EXPENSES ---')
  const { data: exps, error: expErr } = await supabase.from('expenses').select('*').order('created_at', { ascending: false }).limit(5)
  console.log('Expenses error:', expErr)
  console.log('Expenses count/data:', exps?.length, exps)
}

run()
