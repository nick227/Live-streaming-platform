import { describe, it, expect } from 'vitest'
import { buildTestApp, asAuth, testAdminId, testOtherUserId, createPayment, createTestCreator } from './helpers'

describe('scratch test', () => {
  const app = buildTestApp()
  it('create first creator', async () => {
    await createTestCreator(testOtherUserId)
    console.log('Created first creator')
  })

  it('create second creator', async () => {
    await createTestCreator(testOtherUserId)
    console.log('Created second creator')
  })
})
