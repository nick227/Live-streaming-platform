import { AdminService } from './src/services/AdminService'
import { db } from '@streamyolo/db'
import { buildTestApp, testAdminId } from './src/__tests__/helpers/index'

async function run() {
  const admin = new AdminService()
  try {
    const res = await admin.listRooms({})
    console.log(res)
  } catch (err) {
    console.error(err)
  }
}
run()
