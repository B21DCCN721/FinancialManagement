import cron from "node-cron"
import { FastifyInstance } from "fastify"
import { processRecurringTransactionsService } from "../modules/transactions/transactions.service"

/**
 * Register all cron jobs on the Fastify server.
 * Called after server startup to ensure DB/Redis plugins are ready.
 */
export function registerScheduler(server: FastifyInstance) {
  // Run every day at 00:05 to process recurring transactions
  cron.schedule("5 0 * * *", async () => {
    server.log.info("[Scheduler] Starting daily recurring transaction processing...")
    try {
      await processRecurringTransactionsService(server)
      server.log.info("[Scheduler] Daily recurring transaction processing complete.")
    } catch (err) {
      server.log.error(`[Scheduler] Cron job error: ${err}`)
    }
  }, {
    timezone: "Asia/Ho_Chi_Minh",
  })

  server.log.info("[Scheduler] Cron jobs registered. Recurring tx job: daily at 00:05 (Asia/Ho_Chi_Minh)")
}
