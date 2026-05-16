// auth.d.ts
import { User as BaseUser } from 'nuxt-auth-utils'
declare module 'nuxt-auth-utils' {
  interface User {
    id: string
    email: string
    is_admin: boolean
    managed_asds: Array<{
      asd_id: string
      asd_slug: string
      asd_name: string
      role: string
    }>
  }

  // Se vuoi tipizzare anche i dati extra della sessione (opzionale)
  interface UserSession {
    user: User
    loggedInAt: number
  }
}

export {}