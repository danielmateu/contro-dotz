import fs from 'fs'
import path from 'path'

const filePath = path.resolve('public', 'hucha.glb')
console.log('Ruta del archivo:', filePath)

if (!fs.existsSync(filePath)) {
  console.log('El archivo no existe!')
  process.exit(1)
}

const stats = fs.statSync(filePath)
console.log('Tamaño en bytes:', stats.size)

const fd = fs.openSync(filePath, 'r')
const buffer = Buffer.alloc(12)
fs.readSync(fd, buffer, 0, 12, 0)
fs.closeSync(fd)

const magic = buffer.readUInt32LE(0)
const version = buffer.readUInt32LE(4)
const length = buffer.readUInt32LE(8)

console.log('Magic header (HEX):', magic.toString(16))
console.log('Magic header (ASCII):', buffer.toString('ascii', 0, 4))
console.log('Version:', version)
console.log('Length in header:', length)

if (magic === 0x46546C67) {
  console.log('VALID GLB MAGIC HEADER!')
} else {
  console.log('INVALID GLB MAGIC HEADER! Expected 0x46546C67')
}
