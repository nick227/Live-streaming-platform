import '../lib/env'
import { db } from '@streamyolo/db'
import { WalletReconciliationService } from '../services/WalletReconciliationService'

async function main() {
  const report = await new WalletReconciliationService().check()

  console.log(`Checked ${report.checkedWallets} wallets.`)

  if (report.issueCount === 0) {
    console.log('No wallet reconciliation issues found.')
    return
  }

  console.log(`Found ${report.issueCount} wallet reconciliation issue(s):`)
  console.table(
    report.issues.map((issue) => ({
      userId: issue.userId,
      username: issue.username,
      stored: issue.storedTokenBalance,
      ledgerSum: issue.ledgerSumTokenBalance,
      latestLedger: issue.latestLedgerBalanceAfter,
      reserved: issue.storedReservedTokenBalance,
      activeReserved: issue.activeReservedTokenBalance,
      sumDelta: issue.tokenBalanceDeltaFromLedgerSum,
      latestDelta: issue.tokenBalanceDeltaFromLatestLedger,
      reservedDelta: issue.reservedTokenBalanceDelta,
    })),
  )

  process.exitCode = 1
}

main()
  .catch((err) => {
    console.error(err)
    process.exitCode = 1
  })
  .finally(async () => {
    await db.$disconnect()
  })
