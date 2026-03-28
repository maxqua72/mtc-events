import { Resend } from 'resend'
const resend = new Resend(process.env.RESEND_API_KEY)

export const getEmailStats = async (db: any) => {
  const now = new Date();
  
  // 1. Inizio della giornata (00:00:00)
  const startOfDay = new Date(now);
  startOfDay.setHours(0, 0, 0, 0);

  // 2. Inizio del mese corrente (1° giorno del mese alle 00:00:00)
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [dailySent, monthlySent] = await Promise.all([
    db.collection('email_logs').countDocuments({
      sent_at: { $gte: startOfDay },
      status: 'success'
    }),
    db.collection('email_logs').countDocuments({
      sent_at: { $gte: startOfMonth },
      status: 'success'
    })
  ]);

  return { 
    dailySent, 
    dailyLimit: 90,     // Resend Free è 100, stiamo cauti
    monthlySent, 
    monthlyLimit: 2800  // Resend Free è 3.000, stiamo cauti
  };
}

export const processEmailQueue = async (db: any, maxPriority = 2) => {
  const stats = await getEmailStats(db);
  
  // Controllo blocco Mensile
  if (stats.monthlySent >= stats.monthlyLimit) {
    console.error('--- BLOCCANTE: Quota MENSILE email esaurita ---');
    return { status: 'monthly_limit_reached' };
  }

  // Controllo blocco Giornaliero
  if (stats.dailySent >= stats.dailyLimit) {
    console.log('--- Quota GIORNALIERA email raggiunta ---');
    return { status: 'daily_limit_reached' };
  }

  // Calcoliamo quanti slot rimangono per oggi (o per il mese, il minore dei due)
  const slotsToday = stats.dailyLimit - stats.dailySent;
  const slotsMonth = stats.monthlyLimit - stats.monthlySent;
  const availableSlots = Math.min(slotsToday, slotsMonth, 10); // Non più di 10 per volta per sicurezza batch

  const queue = await db.collection('email_queue')
    .find({ 
      status: 'pending', 
      priority: { $lte: maxPriority },
      scheduled_at: { $lte: new Date() } 
    })
    .sort({ priority: 1, created_at: 1 })
    .limit(availableSlots)
    .toArray();

  if (queue.length === 0) return { status: 'empty_queue' };

  for (const mail of queue) {
    try {
      const { error } = await resend.emails.send({
        from: mail.from,
        to: [mail.recipient],
        subject: mail.subject,
        html: mail.body_html
      });

      if (error) throw error;

      await db.collection('email_queue').updateOne({ _id: mail._id }, { $set: { status: 'sent', sent_at: new Date() } });
      await db.collection('email_logs').insertOne({
        asd_slug: mail.asd_slug,
        sent_at: new Date(),
        status: 'success',
        type: mail.type || 'invite'
      });
    } catch (err: any) {
      console.error(`Errore invio a ${mail.recipient}:`, err.message);
      await db.collection('email_queue').updateOne(
        { _id: mail._id }, 
        { $set: { status: 'failed', error: err.message }, $inc: { attempts: 1 } }
      );
    }
  }
  
  return { status: 'success', processed: queue.length };
}