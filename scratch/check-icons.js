import fs from 'fs'
import path from 'path'

const dir = path.resolve('node_modules/lucide-react/dist/esm/icons')
if (fs.existsSync(dir)) {
  const files = fs.readdirSync(dir)
  const matches = files.filter(f => f.includes('message'))
  console.log('Matching icons:', matches)
} else {
  console.log('Directory not found')
}
