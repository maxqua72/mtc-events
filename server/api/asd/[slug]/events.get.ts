// server/api/asd/[slug]/events.get.ts
export default defineEventHandler(async (event) => {
    const slug = getRouterParam(event, 'slug')
    const db = await getDb()
    const now = new Date()

    // 1. Troviamo prima l'ASD per ottenere il suo ID univoco
    const asd = await db.collection('associations').findOne({ slug: slug })

    if (!asd) {
        throw createError({
            statusCode: 404,
            statusMessage: `Associazione ${slug} non trovata`,
        })
    }

    // 2. Cerchiamo tutti gli eventi collegati a questa associazione
    // Li ordiniamo per start_date (dal più recente o imminente)
    const events = await db.collection('events')
        .find({
            association_id: asd._id,
            is_published: true,
            $or: [
                // 1. Eventi futuri: la data di inizio è maggiore o uguale a ora
                { start_date: { $gte: now } },
                // 2. Eventi in corso: ora è tra inizio e fine
                {
                    start_date: { $lte: now },
                    end_date: { $gte: now }
                }
            ]

        })
        .sort({ start_date: 1 })
        .toArray()

    return events
})