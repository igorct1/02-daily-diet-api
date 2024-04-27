import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'
import { checkSessionExists } from '../middlewares/check-session-exists'
import { z } from 'zod'
import { knex } from '../database'
import { randomUUID } from 'crypto'

export async function mealsRoutes(app: FastifyInstance) {
  // new
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
  // all
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
          message: 'You need to create an user to get meals information.',
        })
      }

      const meals = await knex('meals').select('*').where('user_id', user.id)

      reply.status(200).send({
        meals,
      })
    },
  )
  // specific
  app.get(
    '/:id',
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
          message: 'You need an active session to edit this meal.',
        })
      }

      const mealParamsValidationSchema = z.object({
        id: z.string(),
      })

      const { id } = mealParamsValidationSchema.parse(request.params)

      const selectedMeal = await knex('meals')
        .select('*')
        .where('user_id', user.id)
        .where('id', id)
        .first()

      if (selectedMeal?.user_id !== user.id)
        return reply.status(404).send({
          message: "You're trying to access a meal u are not the owner.",
        })

      return reply.status(200).send({
        selectedMeal,
      })
    },
  )

  // edit specific
  app.put(
    '/:id',
    {
      preHandler: [checkSessionExists],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { sessionId } = request.cookies

      const user = await knex('users')
        .select('*')
        .where('session_id', sessionId)
        .first()

      if (!user) {
        return reply.status(404).send({
          message: 'You need an active session to edit this meal.',
        })
      }

      const mealsBodyValidationSchema = z.object({
        name: z.string().optional(),
        description: z.string().optional(),
        isOnDiet: z.boolean().optional(),
      })

      const mealsParamsValidationSchema = z.object({
        id: z.string(),
      })

      const { description, isOnDiet, name } = mealsBodyValidationSchema.parse(
        request.body,
      )
      const { id } = mealsParamsValidationSchema.parse(request.params)

      const selectedMealToEdit = await knex('meals')
        .where('id', id)
        .select('user_id')
        .first()

      if (user.id !== selectedMealToEdit?.user_id) {
        return reply.status(404).send({
          message: "You're trying to edit an meal that u are not allowed to.",
        })
      }

      await knex('meals').where('id', id).update({
        name,
        description,
        isOnDiet,
        updated_at: new Date(),
      })

      return reply.status(200).send()
    },
  )
}
