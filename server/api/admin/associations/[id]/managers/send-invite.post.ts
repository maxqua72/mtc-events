import { ObjectId } from 'mongodb'

export default defineEventHandler(async (event) => {
  const asdId = getRouterParam(event, 'id')
  const body = await readBody(event)
  const email = body?.email?.toLowerCase().trim()
  const force_queue = body?.force_queue || false

  const db = await getDb()
  const isDev = process.env.NODE_ENV !== 'production'

  if (!asdId || !email) {
    throw createError({ statusCode: 400, message: 'ID ASD o Email mancanti' })
  }

  // 1. Recupero dati (User, ASD, Ruolo Manager e Statistiche Email)
  const [user, asd, stats] = await Promise.all([
    db.collection('users').findOne({ email }),
    db.collection('associations').findOne({ _id: new ObjectId(asdId) }),
    getEmailStats(db) 
  ])

  if (!user || !asd) {
    throw createError({ statusCode: 404, message: 'Dati non trovati' })
  }

  // Recuperiamo il token specifico dalla collezione managers
  const managerRelation = await db.collection('managers').findOne({
    user_id: user._id,
    association_id: asd._id
  })

  if (!managerRelation || !managerRelation.manager_token) {
    throw createError({ statusCode: 404, message: 'Token manager non trovato' })
  }

  // 2. CONTROLLO QUOTA (Daily + Monthly)
  const isDailyFull = stats.dailySent >= stats.dailyLimit
  const isMonthlyFull = stats.monthlySent >= stats.monthlyLimit

  if ((isDailyFull || isMonthlyFull) && !force_queue) {
    return {
      success: false,
      code: 'QUOTA_EXCEEDED',
      reason: isMonthlyFull ? 'monthly' : 'daily'
    }
  }

  // 3. Costruzione Link e Formattazione Token
  const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http'
  const host = getRequestHost(event)
  // Il link punta alla pagina di join dell'ASD specifica
  const joinLink = `${protocol}://${host}/${asd.slug}/join?t=${managerRelation.manager_token}`
  
  // Usiamo la nostra utility per mostrare il token formattato (XXX-XXX-XXX)
  const visualToken = showManagerToken(managerRelation.manager_token)

  // 4. Calcolo data di schedulazione
  const now = new Date()
  let scheduledAt = new Date()
  if (isMonthlyFull) {
    scheduledAt = new Date(now.getFullYear(), now.getMonth() + 1, 1, 9, 0, 0)
  } else if (isDailyFull) {
    scheduledAt = new Date()
    scheduledAt.setDate(scheduledAt.getDate() + 1)
    scheduledAt.setHours(9, 0, 0, 0)
  }

  // 5. Preparazione email per la coda
  const emailData = {
    recipient: (isDev && process.env.RESEND_TEST_RECIPIENT) ? process.env.RESEND_TEST_RECIPIENT : user.email,
    from: isDev ? 'MTC Events <onboarding@resend.dev>' : `"${asd.name}" <sistema@events.mindthecheck.com>`,
    subject: `Accesso Manager: ${asd.name}`,
    //body_text: `Ciao ${user.name}! Il tuo codice per accedere come MANAGER a ${asd.name} è: ${visualToken}. `,
    body_html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: auto; border: 1px solid #eee; padding: 30px; border-radius: 12px;">
          <div style="text-align: center; margin-bottom: 20px;">
             <h2 style="color: #1a1a1a; margin-bottom: 5px;">Ciao ${user.name}!</h2>
             <p style="color: #666;">Sei stato nominato <b>Manager</b> per l'associazione <b>${asd.name}</b>.</p>
          </div>
          
          <div style="background-color: #f9fafb; border: 1px solid #e5e7eb; padding: 20px; border-radius: 8px; text-align: center; margin: 25px 0;">
            <p style="font-size: 10px; text-transform: uppercase; letter-spacing: 1px; color: #9ca3af; margin: 0 0 10px 0;">Il tuo Codice di Accesso</p>
            <div style="font-family: monospace; font-size: 28px; font-weight: bold; letter-spacing: 4px; color: #111827;">
              ${visualToken}
            </div>
          </div>

          <p style="font-size: 14px; color: #4b5563; line-height: 1.6;">
            Puoi accedere alla tua dashboard cliccando sul pulsante qui sotto e inserendo il codice, oppure scansionando il QR code se presente nella pagina di login.
          </p>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${joinLink}" style="background-color: #111827; color: #fbbf24; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 14px; text-transform: uppercase; letter-spacing: 1px;">
              Accedi alla Dashboard
            </a>
          </div>

          <p style="font-size: 11px; color: #9ca3af; text-align: center; margin-top: 40px;">
            Se non hai richiesto tu questo accesso, contatta l'amministratore di sistema.<br>
            ${isDev ? `[TEST] Destinatario originale: ${user.email}` : ''}
          </p>
        </div>
      `,
    asd_slug: asd.slug,
    status: 'pending',
    priority: 1, // Priorità alta per gli inviti manager
    created_at: new Date(),
    scheduled_at: scheduledAt,
    type: 'manager_invite'
  }

  await db.collection('email_queue').insertOne(emailData)

  // 6. INVIO IMMEDIATO
  let queued = isDailyFull || isMonthlyFull
  if (!queued) {
    await processEmailQueue(db, 1)
  }

  return {
    success: true,
    queued: queued,
    message: queued ? 'Email messa in coda' : 'Email inviata con successo'
  }
})