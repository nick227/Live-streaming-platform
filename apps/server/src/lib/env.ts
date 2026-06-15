import { existsSync, readFileSync } from 'fs'
import { resolve } from 'path'

function loadEnvFile(path: string) {
  if (!existsSync(path)) return false

  const lines = readFileSync(path, 'utf8').split(/\r?\n/)
  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue

    const separatorIndex = trimmed.indexOf('=')
    if (separatorIndex === -1) continue

    const key = trimmed.slice(0, separatorIndex).trim()
    let value = trimmed.slice(separatorIndex + 1).trim()
    if (!key || process.env[key] !== undefined) continue

    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1)
    }

    process.env[key] = value
  }

  return true
}

const candidates = [
  resolve(process.cwd(), '../../.env'),
  resolve(__dirname, '../../../../.env'),
]

for (const candidate of candidates) {
  if (loadEnvFile(candidate)) break
}

function deriveTestDatabaseUrl(databaseUrl: string) {
  const url = new URL(databaseUrl)
  const databaseName = url.pathname.replace(/^\//, '')

  if (!databaseName || databaseName.endsWith('_test')) return databaseUrl

  url.pathname = `/${databaseName}_test`
  return url.toString()
}

if (process.env.NODE_ENV === 'test' && process.env.DATABASE_URL) {
  process.env.DATABASE_URL = process.env.TEST_DATABASE_URL ?? deriveTestDatabaseUrl(process.env.DATABASE_URL)
}

if (process.env.NODE_ENV === 'test') {
  process.env.STORAGE_ENDPOINT = ''
}
