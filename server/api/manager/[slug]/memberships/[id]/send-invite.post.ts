// server/api/manager/[slug]/memberships/[id]/send-invite.post.ts
import { ObjectId } from 'mongodb'

export default defineEventHandler(async (event) => {
  // Nota: params è dentro event.context, ma assicuriamoci di tipizzarlo bene
  const { id, slug } = event.context.params as { id: string, slug: string }
  const body = await readBody(event)
  const force_queue = body?.force_queue || false

  const db = await getDb()
  const isDev = process.env.NODE_ENV !== 'production'

  // 1. Recupero dati e statistiche aggiornate (Daily + Monthly)
  const [membership, asd, stats] = await Promise.all([
    db.collection('memberships').findOne({ _id: new ObjectId(id) }),
    db.collection('associations').findOne({ slug }),
    getEmailStats(db) // Ora restituisce dailySent, dailyLimit, monthlySent, monthlyLimit
  ])

  if (!membership || !asd) {
    throw createError({ statusCode: 404, message: 'Dati non trovati' })
  }

  // 2. CONTROLLO QUOTA (Sia giornaliera che mensile)
  const isDailyFull = stats.dailySent >= stats.dailyLimit
  const isMonthlyFull = stats.monthlySent >= stats.monthlyLimit

  if ((isDailyFull || isMonthlyFull) && !force_queue) {
    return {
      success: false,
      code: 'QUOTA_EXCEEDED',
      dailySent: stats.dailySent,
      dailyLimit: stats.dailyLimit,
      monthlySent: stats.monthlySent,
      monthlyLimit: stats.monthlyLimit,
      reason: isMonthlyFull ? 'monthly' : 'daily'
    }
  }

  // 3. Costruzione Link
  const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http'
  const host = getRequestHost(event)
  const joinLink = `${protocol}://${host}/${slug}/join?t=${membership.join_token}`

  // 4. Calcolo data di schedulazione
  // Se la quota è piena, programmiamo per l'inizio del giorno successivo
  const now = new Date()
  let scheduledAt = new Date()
  if (isMonthlyFull) {
    // Se la quota mensile è piena, programmiamo per il 1° del mese prossimo alle 09:00
    scheduledAt = new Date(now.getFullYear(), now.getMonth() + 1, 1, 9, 0, 0);
  }
  else if (isDailyFull) {
    // Se solo la quota giornaliera è piena, programmiamo per domani alle 09:00
    scheduledAt = new Date();
    scheduledAt.setDate(scheduledAt.getDate() + 1);
    scheduledAt.setHours(9, 0, 0, 0);
  }

  // 5. Preparazione email per la coda
  const emailData = {
    recipient: (isDev && process.env.RESEND_TEST_RECIPIENT) ? process.env.RESEND_TEST_RECIPIENT : membership.email,
    from: isDev ? 'MTC Events <onboarding@resend.dev>' : `"${asd.name}" <invito@events.mindthecheck.com>`,
    subject: `Benvenuto in ${asd.name} - Attiva la tua app`,
    body_html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: auto; border: 1px solid #eee; padding: 20px;">
          <h2 style="color: #2563eb;">Ciao ${membership.name}!</h2>
          <p>L'associazione <b>${asd.name}</b> ti ha invitato a unirti alla loro community su MintTheCheck Events.</p>
          <p>Per completare la tua iscrizione e vedere tutti gli eventi dell'associazione, clicca sul pulsante qui sotto:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${joinLink}" style="background-color: #2563eb; color: white; padding: 12px 25px; text-decoration: none; border-radius: 6px; font-weight: bold;">
              Attiva la mia Membership
            </a>
          </div>
          <p style="font-size: 12px; color: #666;">Se il pulsante non funziona, copia questo link nel tuo browser: <br>${joinLink}</p>
          ${isDev ? `<p style="color: red; font-size: 10px;">[MODALITÀ TEST] Destinatario originale: ${membership.email}</p>` : ''}
        </div>
      `,
    asd_slug: slug,
    status: 'pending',
    priority: 1,
    created_at: new Date(),
    scheduled_at: scheduledAt,
    type: 'invite'
  }

  await db.collection('email_queue').insertOne(emailData)

  // 6. INVIO IMMEDIATO (Solo se c'è spazio e non siamo in blocco)
  let queued = isDailyFull || isMonthlyFull
  if (!queued) {
    // Processa solo la priorità 1 (invio immediato manager)
    await processEmailQueue(db, 1)
  }

  return {
    success: true,
    queued: queued,
    message: queued ? 'Email messa in coda' : 'Email inviata'
  }
})
/*
import { Resend } from 'resend'
import { ObjectId } from 'mongodb'

const resend = new Resend(process.env.RESEND_API_KEY)

export default defineEventHandler(async (event) => {
  const { id, slug } = event.context.params as { id: string, slug: string }
  const isDev = process.env.NODE_ENV !== 'production'
  
  const db = await getDb()
  
  // 1. Recupero dati socio e associazione (per il nome reale)
  const [membership, asd] = await Promise.all([
    db.collection('memberships').findOne({ _id: new ObjectId(id) }),
    db.collection('associations').findOne({ slug })
  ])

  if (!membership || !asd) {
    throw createError({ statusCode: 404, statusMessage: 'Dati non trovati' })
  }

  // 2. Costruzione Link di Join Dinamico
  const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http'
  const host = getRequestHost(event)
  const joinLink = `${protocol}://${host}/${slug}/join?t=${membership.join_token}`

  // 3. Configurazione Mittente e Destinatario
  // In Dev, Resend accetta solo 'onboarding@resend.dev' come mittente
  const fromEmail = isDev 
    ? 'MTC Events <onboarding@resend.dev>' 
    : `"${asd.name}" <inviti@soci.mtc-events.it>`

  // In Dev, se non hai ancora verificato il dominio, puoi inviare SOLO alla tua mail di registrazione.
  // Se hai già verificato il dominio anche in locale, puoi usare direttamente membership.email.
  const toEmail = (isDev && process.env.RESEND_TEST_RECIPIENT) 
    ? process.env.RESEND_TEST_RECIPIENT 
    : membership.email

  try {
    const { data, error } = await resend.emails.send({
      from: fromEmail,
      to: [toEmail],
      subject: `Benvenuto in ${asd.name} - Attiva la tua tessera`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: auto; border: 1px solid #eee; padding: 20px;">
          <h2 style="color: #2563eb;">Ciao ${membership.name}!</h2>
          <p>L'associazione <b>${asd.name}</b> ti ha invitato a unirti alla loro community su MTC Events.</p>
          <p>Per completare la tua iscrizione e attivare la tua tessera digitale, clicca sul pulsante qui sotto:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${joinLink}" style="background-color: #2563eb; color: white; padding: 12px 25px; text-decoration: none; border-radius: 6px; font-weight: bold;">
              Attiva la mia Membership
            </a>
          </div>
          <p style="font-size: 12px; color: #666;">Se il pulsante non funziona, copia questo link nel tuo browser: <br>${joinLink}</p>
          ${isDev ? `<p style="color: red; font-size: 10px;">[MODALITÀ TEST] Destinatario originale: ${membership.email}</p>` : ''}
        </div>
      `
    })

    if (error) throw error

    return { success: true, messageId: data?.id }
  } catch (err) {
    console.error('Errore invio email:', err)
    throw createError({ statusCode: 500, statusMessage: 'Impossibile inviare l\'invito' })
  }
})
  */