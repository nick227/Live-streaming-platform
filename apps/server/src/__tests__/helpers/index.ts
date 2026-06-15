import { beforeAll, beforeEach, afterAll } from 'vitest'
import Fastify, { type FastifyInstance } from 'fastify'
import cookie from '@fastify/cookie'
import openapiGlue from 'fastify-openapi-glue'
import SwaggerParser from '@apidevtools/swagger-parser'
import Ajv from 'ajv'
import addFormats from 'ajv-formats'
import { resolve } from 'path'
import { db } from '@streamyolo/db'
import * as handlers from '../../handlers'

export const testUserId      = '00000000-0000-0000-0000-000000000001'
export const testOtherUserId = '00000000-0000-0000-0000-000000000002'

const specPath = resolve(__dirname, '../../../../../packages/api-spec/openapi.yaml')

let derefSpec: any
async function getSpec() {
  if (!derefSpec) derefSpec = await SwaggerParser.dereference(specPath)
  return derefSpec
}

const ajv = new Ajv({ allErrors: true, strict: false })
addFormats(ajv)

async function seedTestUsers() {
  await db.user.createMany({
    data: [
      {
        id: testUserId,
        email: 'alice@test.local',
        passwordHash: 'x',
        username: 'alice',
        displayName: 'Alice',
      },
      {
        id: testOtherUserId,
        email: 'bob@test.local',
        passwordHash: 'x',
        username: 'bob',
        displayName: 'Bob',
      },
    ],
    skipDuplicates: true,
  })
}

export function buildTestApp() {
  const app: FastifyInstance = Fastify()

  beforeAll(async () => {
    await app.register(cookie, {
      secret: process.env.COOKIE_SECRET ?? 'test-cookie-secret-at-least-32-characters',
    })
    await app.register(openapiGlue, {
      specification: specPath,
      service: handlers,
      securityHandlers: {
        async bearerAuth(request: any) {
          const id = request.headers.authorization?.replace('Bearer ', '')
          if (!id) throw { statusCode: 401, message: 'Unauthorized' }
          request.user = await db.user.findUniqueOrThrow({ where: { id } })
        },
        async adminAuth(request: any) {
          const id = request.headers.authorization?.replace('Bearer ', '')
          if (!id) throw { statusCode: 401, message: 'Unauthorized' }
          request.user = await db.user.findUniqueOrThrow({ where: { id } })
          if (request.user.role !== 'ADMIN') throw { statusCode: 403, message: 'Forbidden' }
        },
      },
      noAdditional: true,
    } as any)
    await app.ready()
  })

  beforeEach(async () => {
    await seedTestUsers()
  })

  afterAll(() => app.close())

  return app
}

export function asAuth(userId: string) {
  return { Authorization: `Bearer ${userId}` }
}

export async function validateResponse(operationId: string, status: number, body: unknown) {
  const spec = await getSpec()
  for (const pathItem of Object.values<any>(spec.paths ?? {})) {
    for (const op of Object.values<any>(pathItem)) {
      if (op.operationId !== operationId) continue
      const schema = op.responses?.[status]?.content?.['application/json']?.schema
      if (!schema) return
      const validate = ajv.compile(schema)
      if (!validate(body)) {
        throw new Error(
          `${operationId} ${status} response does not match spec:\n` +
          JSON.stringify(validate.errors, null, 2)
        )
      }
      return
    }
  }
}
