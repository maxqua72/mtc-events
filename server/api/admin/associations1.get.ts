// server/api/admin/associations.get.ts
export default defineEventHandler(async (event) => {
  const db = await getDb()

  const associations = await db.collection('associations').aggregate([
    {
      $lookup: {
        from: 'managers',
        localField: '_id',
        foreignField: 'association_id',
        as: 'managers_list'
      }
    },
    {
      $lookup: {
        from: 'users',
        localField: 'managers_list.user_id',
        foreignField: '_id',
        as: 'manager_details'
      }
    },
    {
      $project: {
        name: 1,
        slug: 1,
        theme_color: 1,
        // Restituiamo solo email e nome dei manager per la lista
        managers: {
          $map: {
            input: '$manager_details',
            as: 'm',
            in: { email: '$$m.email', name: '$$m.name' }
          }
        }
      }
    }
  ]).toArray()

  return associations
})