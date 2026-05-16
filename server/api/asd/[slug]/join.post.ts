// Non importiamo modelli, usiamo l'istanza del database direttamente
import { ObjectId } from 'mongodb';
export default defineEventHandler(async (event) => {
  const asd_slug = getRouterParam(event, 'slug');
  const body = await readBody(event);
  const { id, role, t: token, legal_acceptance } = body;

  const db = await getDb()
  if (!db) {
    throw createError({ statusCode: 500, statusMessage: 'Database non disponibile' });
  }

  if (!id || !token || !legal_acceptance || !role || !token) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Dati incompleti.',
    });
  }

  // 1. Recuperiamo l'ASD per validare lo slug
  const asd = await db.collection('associations').findOne({ slug: asd_slug });
  if (!asd) throw createError({ statusCode: 404, statusMessage: 'ASD non trovata' });

  const collectionName = role === 'MANAGER' ? 'managers' : 'memberships';

  // Prepariamo il filtro di sicurezza: ID + Token
  const filter: any = { 
    _id: new ObjectId(id),
    association_id: asd._id // Fondamentale: l'ID deve appartenere a QUESTA ASD 
  };

  if (role === 'MANAGER') {
    filter.manager_token = token; 
  } else if (role === 'MEMBER'){
    // Per i soci verifichiamo lo short o il codice lungo
    filter.$or = [
      { short_token: token },
      { join_token:  token }
    ];
    filter.status = 'active'; // Solo soci attivi possono fare la join
  }

  const clientIp = getRequestIP(event, { xForwardedFor: true }) 
                 || event.node.req.socket.remoteAddress 
                 || 'unknown';

  // Arricchiamo il log legale con IP e timestamp del server
  const finalLegalData = {
    ...legal_acceptance,
    ip: clientIp,
    accepted_at: new Date()
  };

  const result = await db.collection(collectionName).findOneAndUpdate(
    filter, // Il doppio controllo avviene qui
    { 
      $set: { 
        //status: 'active', 
        legal_acceptance: finalLegalData
      } 
    },
    { returnDocument: 'after' }
  );

  if (!result) {
    // Se non troviamo il record, significa che la coppia ID/Token non è valida
    throw createError({ 
      statusCode: 401, 
      statusMessage: 'Validazione fallita: ID o Token non corrispondono.' 
    });
  }

  // Risposta coerente con i dati del database[cite: 1, 3]
  return {
    legal_acceptance: result.legal_acceptance,
    
  };

  
});