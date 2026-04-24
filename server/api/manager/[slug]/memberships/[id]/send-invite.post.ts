// server/api/manager/[slug]/memberships/[id]/send-invite.post.ts
import { ObjectId } from 'mongodb'
import QRCode from 'qrcode'

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

  // Usiamo la nostra utility per mostrare il token formattato (XXX-XXX)
  const visualToken = showToken(membership.short_token)
  
  // GENERA IL QR CODE
  // Questo è l'URL della tua nuova API "immagine"
  const qrImageUrl = `${protocol}://${host}/api/qr/${membership.join_token}?slug=${slug}`


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
    // VERSIONE TEXT (Obbligatoria per migliorare la deliverability)
    //body_text: `Ciao ${membership.name}! Il tuo codice per accedere a ${asd.name} è: ${visualToken}. Attiva qui: ${joinLink}`,
    /*
    body_html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: auto; border: 1px solid #eee; padding: 20px;">
          <h2 style="color: #2563eb;">Ciao ${membership.name}!</h2>
          <p>L'associazione <b>${asd.name}</b> ti ha invitato a unirti alla loro community su MindTheCheck Events.</p>
          <p>Per completare la tua iscrizione e vedere tutti gli eventi dell'associazione, clicca sul pulsante o scansiona il codice QR qui sotto dal tuo smartphone:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${joinLink}" style="background-color: #2563eb; color: white; padding: 12px 25px; text-decoration: none; border-radius: 6px; font-weight: bold;">
              Attiva la mia Membership
            </a>
          </div>
          <div style="text-align: center;">
            <p>Scansiona il codice per attivare:</p>
            <div style="margin: 20px 0;">
              <img src="${qrImageUrl}" width="150" height="150" alt="QR Code" style="display: block; margin: auto;" />
            </div>
            <p style="font-size: 10px; color: #999;">ID: ${membership.join_token}</p>
          </div>
          <p style="font-size: 12px; color: #666;">Se il pulsante non funziona, copia questo link nel tuo browser: <br>${joinLink}</p>
          ${isDev ? `<p style="color: red; font-size: 10px;">[MODALITÀ TEST] Destinatario originale: ${membership.email}</p>` : ''}
        </div>
      `,
      */
    body_html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: auto; border: 1px solid #eee; padding: 30px; border-radius: 12px;">
          <div style="text-align: center; margin-bottom: 20px;">
             <h2 style="color: #1a1a1a; margin-bottom: 5px;">Ciao ${membership.name}!</h2>
             <p style="color: #666;">Benvenuto nell'app ufficiale di <b>${asd.name}</b>.</p>
          </div>
          
          <div style="background-color: #f9fafb; border: 1px solid #e5e7eb; padding: 20px; border-radius: 8px; text-align: center; margin: 25px 0;">
            <p style="font-size: 10px; text-transform: uppercase; letter-spacing: 1px; color: #9ca3af; margin: 0 0 10px 0;">Codice Attivazione</p>
            <div style="font-family: monospace; font-size: 32px; font-weight: bold; letter-spacing: 6px; color: #111827;">
              ${visualToken}
            </div>
          </div>

          <div style="text-align: center; margin: 30px 0;">
            <p style="font-size: 14px; color: #4b5563; margin-bottom: 20px;">Scansiona il QR o clicca il pulsante per attivare la tessera:</p>
            <div style="margin-bottom: 25px;">
              <img src="${qrImageUrl}" width="140" height="140" alt="QR Code" style="display: block; margin: auto; border: 4px solid #fff; shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);" />
            </div>
            <a href="${joinLink}" style="background-color: #111827; color: #fbbf24; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 14px; text-transform: uppercase; letter-spacing: 1px; display: inline-block;">
              Attiva Membership
            </a>
          </div>

          <p style="font-size: 11px; color: #9ca3af; text-align: center; margin-top: 40px;">
            Associazione: ${asd.name}<br>
            ${isDev ? `[TEST] Destinatario originale: ${membership.email}` : ''}
          </p>
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
