export default defineEventHandler(async (event) => {
  const db = await getDb()

  const associations = await db.collection('associations').aggregate([
    {
      $lookup: {
        from: 'managers',
        localField: '_id',
        foreignField: 'association_id',
        as: 'manager_links'
      }
    },
    {
      $lookup: {
        from: 'users',
        localField: 'manager_links.user_id',
        foreignField: '_id',
        as: 'manager_details'
      }
    },
    {
      $project: {
        name: 1,
        slug: 1,
        theme_color: 1,
        logo_url: 1,
        created_at: 1,
        // Mappiamo i dettagli degli utenti trovati
        managers: {
          $map: {
            input: "$manager_details",
            as: "m",
            in: { name: "$$m.name", email: "$$m.email" }
          }
        }
      }
    },
    { $sort: { name: 1 } }
  ]).toArray()

  return associations
})