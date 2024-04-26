import { FastifyReply, FastifyRequest } from 'fastify'

export async function checkSessionExists(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const sessionId = request.cookies.sessionId

  if (!sessionId) {
    return reply.status(404).send({
      message: 'Anauthorized',
    })
  }
}
