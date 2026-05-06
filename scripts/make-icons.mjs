// Generates solid-color square PNG icons for the PWA manifest.
// Pure Node, no native deps — uses zlib + manual PNG chunk assembly.
import { writeFileSync, mkdirSync } from 'node:fs'
import { deflateSync } from 'node:zlib'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const outDir = resolve(__dirname, '..', 'public')
mkdirSync(outDir, { recursive: true })

const crcTable = (() => {
  const t = new Uint32Array(256)
  for (let n = 0; n < 256; n++) {
    let c = n
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    t[n] = c >>> 0
  }
  return t
})()
const crc32 = (buf) => {
  let c = 0xffffffff
  for (let i = 0; i < buf.length; i++) c = crcTable[(c ^ buf[i]) & 0xff] ^ (c >>> 8)
  return (c ^ 0xffffffff) >>> 0
}
const u32 = (n) => {
  const b = Buffer.alloc(4)
  b.writeUInt32BE(n >>> 0, 0)
  return b
}
const chunk = (type, data) => {
  const t = Buffer.from(type, 'ascii')
  const crc = crc32(Buffer.concat([t, data]))
  return Buffer.concat([u32(data.length), t, data, u32(crc)])
}

function makeSolidPng(size, [r, g, b]) {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])
  const ihdr = chunk(
    'IHDR',
    Buffer.concat([u32(size), u32(size), Buffer.from([8, 2, 0, 0, 0])]),
  )
  const row = Buffer.alloc(1 + size * 3)
  for (let x = 0; x < size; x++) {
    row[1 + x * 3] = r
    row[2 + x * 3] = g
    row[3 + x * 3] = b
  }
  const raw = Buffer.alloc(row.length * size)
  for (let y = 0; y < size; y++) row.copy(raw, y * row.length)
  const idat = chunk('IDAT', deflateSync(raw))
  const iend = chunk('IEND', Buffer.alloc(0))
  return Buffer.concat([sig, ihdr, idat, iend])
}

const colour = [124, 58, 237] // matches manifest theme_color start

for (const size of [192, 512]) {
  const png = makeSolidPng(size, colour)
  const path = resolve(outDir, `icon-${size}.png`)
  writeFileSync(path, png)
  console.log(`wrote ${path} (${png.length} bytes)`)
}
