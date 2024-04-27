import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'
import { knex } from '../database'
import { z } from 'zod'
import { randomUUID } from 'crypto'
import { checkSessionExists } from '../middlewares/check-session-exists'

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

  app.get(
    '/metrics',
    {
      preHandler: [checkSessionExists],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { sessionId } = request.cookies

      const user = await knex('users')
        .where('session_id', sessionId)
        .select('id')
        .first()

      const mealsFromSpecificUser = await knex('meals')
        .where('user_id', user?.id)
        .select('*')

      const mealsOnDiet = mealsFromSpecificUser.filter((meal) => {
        return meal.isOnDiet
      })

      let bestSequence = 0
      let currentSequence = 0

      for (const meal of mealsFromSpecificUser) {
        if (meal.isOnDiet) {
          currentSequence++
          if (currentSequence > bestSequence) {
            bestSequence = currentSequence
          }
        } else {
          currentSequence = 0
        }
      }

      reply.send({
        metrics: {
          totalMeals: mealsFromSpecificUser.length,
          mealsOnDiet: mealsOnDiet.length,
          mealsOffDiet: mealsFromSpecificUser.length - mealsOnDiet.length,
          bestSequence,
        },
      })
    },
  )
}
