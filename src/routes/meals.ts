import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'
import { checkSessionExists } from '../middlewares/check-session-exists'

export async function mealsRoutes(app: FastifyInstance) {
  app.post(
    '/',
    {
      preHandler: [checkSessionExists],
    },
    async () => {},
  )
}
