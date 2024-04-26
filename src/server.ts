import fastify from 'fastify'
import { env } from './env'

export const app = fastify()

app
  .listen({
    port: env.PORT,
  })
  .then(() => {
    console.log(`Server is running on port ${env.PORT}`)
  })
