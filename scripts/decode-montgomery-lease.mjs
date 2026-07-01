import { readFileSync } from 'fs'

const buf = readFileSync('data/lease_dataSource/TB Montgomery St/TB Montgomery Abstract.pdf')
const s = buf.toString('latin1')

// Hex strings
const hexRe = /<([0-9a-fA-F]+)>\s*Tj/g
const decoded = []
let m
while ((m = hexRe.exec(s)) !== null) {
  const hex = m[1]
  let text = ''
  for (let i = 0; i < hex.length; i += 2) {
    const code = parseInt(hex.slice(i, i + 2), 16)
    if (code >= 32 && code < 127) text += String.fromCharCode(code)
  }
  if (text.trim().length > 0) decoded.push(text)
}

console.log('Chunks:', decoded.length)
if (decoded.length > 0) {
  console.log(decoded.join('\n'))
}
