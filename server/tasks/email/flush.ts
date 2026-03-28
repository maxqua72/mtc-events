// server/tasks/email/flush.ts
export default defineTask({
  meta: {
    name: "email:flush",
    description: "Invio massivo email in coda (priorità bassa/differite)",
  },
  async run() {
    const db = await getDb()
    const result = await processEmailQueue(db, 2) // Processa tutto fino a priorità 2
    return { result }
  },
})