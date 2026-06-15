import fs from 'fs'
import path from 'path'

const baseDir = 'c:\\wamp64\\www\\streamyolo\\apps\\server\\src'
const files = fs.readdirSync(baseDir, { recursive: true })
  .filter(f => f.endsWith('.ts'))
  .map(f => path.join(baseDir, f))
let totalReplacements = 0

files.forEach(file => {
  const content = fs.readFileSync(file, 'utf8')
  
  // Exclude lib/errors.ts
  if (file.endsWith('errors.ts')) return

  const regex = /throw\s*\{\s*statusCode:\s*(\d+),\s*message:\s*('[^']+'|`[^`]+`|"[^"]+")\s*\}/g
  
  if (regex.test(content)) {
    let newContent = content.replace(regex, 'throw httpError($1, $2)')
    
    // Calculate relative path to src/lib/errors
    const dir = path.dirname(file)
    const errorsPath = 'c:\\wamp64\\www\\streamyolo\\apps\\server\\src\\lib\\errors'
    let relPath = path.relative(dir, errorsPath).replace(/\\/g, '/')
    if (!relPath.startsWith('.')) relPath = './' + relPath
    
    // Add import if not present
    if (!newContent.includes('import { httpError }')) {
      newContent = `import { httpError } from '${relPath}'\n` + newContent
    }
    
    fs.writeFileSync(file, newContent, 'utf8')
    totalReplacements++
  }
})

console.log(`Patched ${totalReplacements} files.`)
