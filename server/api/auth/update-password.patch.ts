import { scryptSync, randomBytes, timingSafeEqual } from 'node:crypto';

export default defineEventHandler(async (event) => {
  const { username, oldPassword, newPassword } = await readBody(event);
  const db = await getDb();

  // 1. Recupero l'utente
  const user = await db.collection('users').findOne({ 
    "credentials.username": username 
  });

  if (!user || !user.credentials) {
    throw createError({ 
      statusCode: 404, 
      statusMessage: 'Utente non trovato.' 
    });
  }

  // 2. Verifica della password attuale (vecchia o provvisoria)
  const { password_hash, salt } = user.credentials;
  const verifyHash = scryptSync(oldPassword, salt, 64).toString('hex');

  const isMatch = timingSafeEqual(
    Buffer.from(password_hash, 'hex'),
    Buffer.from(verifyHash, 'hex')
  );

  if (!isMatch) {
    throw createError({ 
      statusCode: 401, 
      statusMessage: 'La password attuale non è corretta.' 
    });
  }

  // 3. Generazione nuovi dati di sicurezza (Nuovo Salt + Nuovo Hash)
  const newSalt = randomBytes(16).toString('hex');
  const newHash = scryptSync(newPassword, newSalt, 64).toString('hex');

  // 4. Aggiornamento sul database
  await db.collection('users').updateOne(
    { _id: user._id },
    { 
      $set: { 
        "credentials.password_hash": newHash,
        "credentials.salt": newSalt,
        "must_change_password": false,
        "updated_at": new Date()
      } 
    }
  );

  // 5. Restituiamo i permessi per il login automatico dopo il cambio
  const permissions = {
    is_admin: user.is_admin || false,
    email: user.email,
    managed_asds: user.managed_asds || []
  };

  return {
    success: true,
    permissions
  };
});