// eslint-disable-next-line
import { knex } from 'knex'

declare module 'knex/types/tables' {
  interface User {
    id: string
    session_id: string
    email: string
    name: string
    created_at: Date
  }

  interface Meal {
    id: string
    user_id: string
    name: string
    description: string
    date: Date
    isOnDiet: boolean
    created_at?: Date
    updated_at?: Date
  }

  interface Tables {
    users: User
    meals: Meal
  }
}
