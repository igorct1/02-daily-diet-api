import fastify from 'fastify'

export const app = fastify()

app
  .listen({
    port: 3333,
  })
  .then(() => {
    console.log('SERVER IS RUNNING!')
  })
