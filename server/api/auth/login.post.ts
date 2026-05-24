import { scryptSync, timingSafeEqual } from 'node:crypto';

export default defineEventHandler(async (event) => {
  const { username, password } = await readBody(event);
  const db = await getDb();

  // 1. Cerchiamo l'utente (Admin o Manager con credenziali)
  const user = await db.collection('users').findOne({
    "credentials.username": username
  });

  if (!user || !user.credentials) {
    throw createError({ statusCode: 401, statusMessage: 'Credenziali non valide.' });
  }

  // 2. Confronto dell'Hash (Protezione contro attacchi a tempo)
  const { password_hash, salt } = user.credentials;
  const inputHash = scryptSync(password, salt, 64).toString('hex');

  // Usiamo timingSafeEqual per prevenire attacchi di tipo side-channel
  const isMatch = timingSafeEqual(
    Buffer.from(password_hash, 'hex'),
    Buffer.from(inputHash, 'hex')
  );

  if (!isMatch) {
    throw createError({ statusCode: 401, statusMessage: 'Credenziali non valide.' });
  }

  // 3. Controllo Password Provvisoria
  console.log('Utente autenticato:', user.email, 'must_change_password:', user.must_change_password)
  if (user.must_change_password) {
    // Restituiamo un successo parziale o un codice specifico 
    // per obbligare il frontend a mostrare il modulo "Cambio Password"
    return {
      must_change_password: true,
      temp_token: "token_temporaneo_per_cambio_pwd", // Opzionale per sicurezza
      email: user.email
    };
  }

  /*
  // 4. Login Success (Generazione Permessi)
  // Qui ricicliamo la logica esistente per i permessi
  const permissions = {
    is_admin: user.is_admin || false,
    email: user.email,
    managed_asds: user.managed_asds || []
  };

  return {
    success: true,
    permissions
  };
  */
  // --- MODIFICA SOLUZIONE 10 ---

  // 4. Prepariamo i dati per il cookie blindato
  // 4a. Recuperiamo le ASD dal DB (gestendo il fallback se l'array non esiste)
  const rawManagedAsds = user.managed_asds || [];

  // 4b. BONIFICA DATI (De-duplicazione preventiva)
  // Se sul DB l'utente ha array duplicati storici, li filtriamo all'istante usando lo slug come chiave
  const cleanedMap = new Map(
    rawManagedAsds.map((item: any) => [item.asd_slug, item])
  );
  const cleanedManagedAsds = Array.from(cleanedMap.values());


  // Questi sono i dati che useUserSession() leggerà nel frontend
  const sessionUser = {
    id: user._id.toString(),
    email: user.email,
    is_admin: user.is_admin || false,
    managed_asds: cleanedManagedAsds,
    name: user.name || 'Admin' // Aggiungi campi utili se ne hai
  };

  // 5. SIGILLIAMO IL COOKIE (Fondamentale!)
  // Questa funzione imposta l'header Set-Cookie crittografato nella risposta
  console.log('Dati che sto per scrivere nel cookie:', sessionUser);
  await setUserSession(event, {
    user: sessionUser,
    loggedInAt: new Date().toISOString()
  });

  // 6. Login Success
  return {
    success: true,
    permissions: sessionUser // Restituiamo comunque i dati per lo store Pinia
  };
});