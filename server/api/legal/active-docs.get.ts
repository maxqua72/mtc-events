// server/api/legal/active-docs.get.ts

export default defineEventHandler(async (event) => {
  const db = await getDb()

  if (!db) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Connessione al database non disponibile',
    });
  }

  try {
    const docs = await db.collection('legal_documents')
      .find({ is_active: true })
      .toArray();

    // Tipizziamo sia l'accumulatore (acc) che l'elemento (doc)
    const mappedDocs = docs.reduce((acc: Record<string, any>, doc: any) => {
      acc[doc.type] = {
        version: doc.version,
        hash: doc.hash,
        content_html: doc.content_html,
        url: doc.file_url,
        updated_at: doc.updated_at
      };
      return acc;
    }, {});

    return mappedDocs;

  } catch (error) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Errore nel recupero dei documenti legali',
    });
  }
});