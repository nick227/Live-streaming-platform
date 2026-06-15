import { describe, it, expect } from 'vitest'
import { buildTestApp, validateResponse } from './helpers'
import { db } from '@streamyolo/db'

const app = buildTestApp()

describe('listTokenPacks', () => {
  it('GET /token-packs', async () => {
    await db.tokenPack.create({ data: { name: 'Test Pack', priceCents: 1000, tokenAmount: 100 } })
    const res = await app.inject({
      method: 'GET',
      url: '/token-packs',
    })
    if (res.statusCode !== 200) {
      console.error(res.json())
    }
    expect(res.statusCode).toBe(200)
    await validateResponse('listTokenPacks', 200, res.json())
  })
})
