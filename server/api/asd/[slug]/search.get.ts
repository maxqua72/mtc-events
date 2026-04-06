// server/api/asd/[slug]/search.get.ts
export default defineEventHandler(async (event) => {
  // Estraiamo i parametri forzando il tipo
  const params = event.context.params as { slug: string }
  const slug = params?.slug
  
  const query = getQuery(event)
  const q = query.q as string || ''
  const includeMembers = query.includeMembers === 'true'

  if (!slug) {
    throw createError({ statusCode: 400, message: 'Missing ASD slug' })
  }

  const db = await getDb()
  const asd = await db.collection('associations').findOne({ slug: slug })

  const searchRegex = new RegExp(q as string, 'i')

  // 1. Ricerca sempre gli eventi (pubblici)
  const eventsPromise = db.collection('events').find({
    association_id: asd._id,
    $or: [
      { title: searchRegex },
      { category: searchRegex }
    ]
  }).limit(10).toArray()

  // 2. Ricerca i soci SOLO se richiesto (il controllo permessi finale andrebbe fatto qui con il token sessione)
  let members = []

  //console.log('Search query:', q, ' Include members:', includeMembers, ' Slug:', slug, ' Search regex:', searchRegex)
  if (includeMembers) {
    const searchString = q as string

    

    members = await db.collection('memberships').find({
      association_id: asd._id, // Assicurati che l'ID o slug corrisponda
      $or: [
        { name: searchRegex },
        { surname: searchRegex },
        { email: searchRegex },
        { member_code: searchRegex },
        // Ricerca combinata Nome + Cognome
        { 
        $expr: {
          $regexMatch: {
            input: { $concat: ["$name", " ", "$surname"] },
            regex: searchString,
            options: "i"
          }
        }
      }
      ]
    }).limit(10).toArray()
  }

  const [foundEvents, foundMembers] = await Promise.all([eventsPromise, members])

  return {
    events: foundEvents,
    members: foundMembers
  }
})