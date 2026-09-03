import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'

const envPath = path.resolve(process.cwd(), '.env')
const envContent = fs.readFileSync(envPath, 'utf8')
const env = {}
envContent.split('\n').forEach(line => {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/)
  if (match) {
    const key = match[1]
    let value = match[2] || ''
    if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1)
    env[key] = value
  }
})

const supabase = createClient(env['NEXT_PUBLIC_SUPABASE_URL'], env['NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY'])

async function checkInvitations() {
  console.log('--- INVITATIONS ---')
  const { data: invs, error } = await supabase.from('invitations').select('*, households(name)').order('created_at', { ascending: false })
  console.log('Invitations error:', error)
  console.log('Invitations data:', invs)

  console.log('--- HOUSEHOLD MEMBERS ---')
  const { data: members, error: memErr } = await supabase.from('household_members').select('*, profiles(email, display_name), households(name)')
  console.log('Members error:', memErr)
  console.log('Members data:', members)
}

checkInvitations()
