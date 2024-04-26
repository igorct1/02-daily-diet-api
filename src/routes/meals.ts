import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'
import { checkSessionExists } from '../middlewares/check-session-exists'
import { z } from 'zod'
import { knex } from '../database'
import { randomUUID } from 'crypto'

export async function mealsRoutes(app: FastifyInstance) {
  app.post(
    '/',
    {
      preHandler: [checkSessionExists],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { sessionId } = request.cookies

      const user = await knex('users')
        .select('id')
        .where('session_id', sessionId)
        .first()

      if (!user) {
        return reply.status(401).send({
          message: 'User not authenticated or does not exist',
        })
      }

      const mealValidationBodySchema = z.object({
        name: z.string(),
        description: z.string(),
        isOnDiet: z.boolean(),
      })

      const mealBodySchema = mealValidationBodySchema.parse(request.body)

      await knex('meals')
        .insert({
          id: randomUUID(),
          user_id: user.id,
          name: mealBodySchema.name,
          description: mealBodySchema.description,
          isOnDiet: mealBodySchema.isOnDiet,
          date: new Date(),
        })
        .returning('*')

      return reply.status(201).send()
    },
  )

  app.get(
    '',
    {
      preHandler: [checkSessionExists],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { sessionId } = request.cookies

      const user = await knex('users')
        .select('id')
        .where('session_id', sessionId)
        .first()

      if (!user) {
        return reply.status(404).send({
          message: 'You need to create an user to get meals information',
        })
      }

      const meals = await knex('meals').select('*').where('user_id', user.id)

      reply.status(200).send({
        meals,
      })
    },
  )
}
