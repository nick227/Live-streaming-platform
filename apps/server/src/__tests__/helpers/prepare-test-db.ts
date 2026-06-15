import '../../lib/env'
import { existsSync } from 'fs'
import { resolve } from 'path'
import { spawnSync } from 'child_process'

function deriveTestDatabaseUrl(databaseUrl: string) {
  const parsed = new URL(databaseUrl)
  const databaseName = parsed.pathname.replace(/^\//, '')

  if (!databaseName || databaseName.endsWith('_test')) return databaseUrl

  parsed.pathname = `/${databaseName}_test`
  return parsed.toString()
}

const databaseUrl = process.env.TEST_DATABASE_URL ?? (process.env.DATABASE_URL ? deriveTestDatabaseUrl(process.env.DATABASE_URL) : undefined)

if (!databaseUrl) {
  throw new Error('DATABASE_URL is required to prepare the test database')
}

const url = new URL(databaseUrl)
const databaseName = url.pathname.replace(/^\//, '')

if (!databaseName) {
  throw new Error('DATABASE_URL must include a database name')
}

if (!/^[A-Za-z0-9_$]+$/.test(databaseName)) {
  throw new Error(`Refusing to create test database with unsupported name: ${databaseName}`)
}

const mysqlCandidates = [
  process.env.MYSQL_BIN,
  'mysql',
  'C:\\wamp64\\bin\\mysql\\mysql8.3.0\\bin\\mysql.exe',
  'C:\\wamp64\\bin\\mariadb\\mariadb11.3.2\\bin\\mariadb.exe',
  '/mnt/c/wamp64/bin/mysql/mysql8.3.0/bin/mysql.exe',
  '/mnt/c/wamp64/bin/mariadb/mariadb11.3.2/bin/mariadb.exe',
].filter(Boolean) as string[]

function run(command: string, args: string[], options?: { shell?: boolean; env?: NodeJS.ProcessEnv }) {
  const result = spawnSync(command, args, {
    cwd: resolve(__dirname, '../../../../..'),
    env: options?.env ?? process.env,
    shell: options?.shell ?? false,
    stdio: 'inherit',
  })

  if (result.error) throw result.error
  if (result.status !== 0) process.exit(result.status ?? 1)
}

function findMysql() {
  for (const candidate of mysqlCandidates) {
    if (candidate.includes('\\') || candidate.includes('/')) {
      if (existsSync(candidate)) return candidate
      continue
    }

    const result = spawnSync(candidate, ['--version'], { stdio: 'ignore' })
    if (result.status === 0) return candidate
  }

  throw new Error('Could not find mysql client. Set MYSQL_BIN to your mysql.exe path.')
}

const mysql = findMysql()
const mysqlArgs = [
  '--protocol=tcp',
  '-h',
  url.hostname || 'localhost',
  '-P',
  url.port || '3306',
  '-u',
  decodeURIComponent(url.username || 'root'),
]

if (url.password) {
  mysqlArgs.push(`--password=${decodeURIComponent(url.password)}`)
}

mysqlArgs.push('-e', `CREATE DATABASE IF NOT EXISTS \`${databaseName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`)
run(mysql, mysqlArgs)

const pnpm = process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm'
run(pnpm, ['--filter', '@streamyolo/db', 'exec', 'prisma', 'db', 'push', '--schema', 'prisma/schema.prisma', '--skip-generate'], {
  env: { ...process.env, DATABASE_URL: databaseUrl },
  shell: process.platform === 'win32',
})
