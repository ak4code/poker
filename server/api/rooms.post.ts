import { createRoom, ensureGcStarted } from '../utils/rooms'

export default defineEventHandler(async (event) => {
  ensureGcStarted()
  const body = await readBody<{ name?: string; hostCanVote?: boolean }>(event)
  const name = (body?.name ?? '').trim()
  const hostCanVote = body?.hostCanVote !== false

  if (!name) throw createError({ statusCode: 400, statusMessage: 'name required' })
  if (name.length > 40) throw createError({ statusCode: 400, statusMessage: 'name too long' })

  const { room, credentials } = createRoom(name, hostCanVote)
  return { roomId: room.roomId, hostId: room.hostId, ...credentials }
})
