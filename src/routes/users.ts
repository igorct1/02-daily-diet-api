import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'
import { knex } from '../database'
import { z } from 'zod'
import { randomUUID } from 'crypto'

export async function usersRoutes(app: FastifyInstance) {
  app.post('/', async (request: FastifyRequest, reply: FastifyReply) => {
    const userValidationBodySchema = z.object({
      email: z.string().email(),
      name: z.string(),
    })

    const user = userValidationBodySchema.parse(request.body)

    let sessionId = request.cookies.sessionId

    if (!sessionId) {
      sessionId = randomUUID()

      reply.setCookie('sessionId', sessionId, {
        path: '/',
        maxAge: 60 * 60 * 24 * 7, // 7 days
      })
    }

    await knex('users').insert({
      id: randomUUID(),
      email: user.email,
      name: user.name,
      session_id: sessionId,
    })

    reply.status(201).send(user)
  })
}
