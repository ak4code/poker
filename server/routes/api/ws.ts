import {
  CARD_VALUES,
  ensureGcStarted,
  getRoom,
  joinRoom,
  registerPeer,
  resetVotes,
  revealVotes,
  serializeRoom,
  setVote,
  unregisterPeer,
  type CardValue,
  type RoomCredentials,
} from '../../utils/rooms'

type ClientMsg =
  | { type: 'join_room'; roomId: string; userName: string; credentials?: Partial<RoomCredentials> | null }
  | { type: 'vote'; cardValue: CardValue | null }
  | { type: 'reveal_votes' }
  | { type: 'reset_votes' }
  | { type: 'ping' }

interface PeerCtx {
  roomId?: string
  userId?: string
}

const peerCtx = new WeakMap<object, PeerCtx>()

function getCtx(peer: any): PeerCtx {
  let ctx = peerCtx.get(peer)
  if (!ctx) {
    ctx = {}
    peerCtx.set(peer, ctx)
  }
  return ctx
}

function encode(payload: unknown) {
  return typeof payload === 'string' ? payload : JSON.stringify(payload)
}

function send(peer: any, payload: unknown) {
  try {
    peer.send(encode(payload))
  } catch {
    return undefined
  }
}

function publish(peer: any, topic: string, payload: unknown) {
  try {
    peer.publish(topic, encode(payload))
  } catch {
    return undefined
  }
}

function subscribe(peer: any, topic: string) {
  try {
    peer.subscribe(topic)
    return true
  } catch {
    return false
  }
}

function broadcastRoom(peer: any, roomId: string) {
  const room = getRoom(roomId)
  if (!room) return
  const payload = JSON.stringify({ type: 'room_state_update', room: serializeRoom(room) })
  publish(peer, `room:${roomId}`, payload)
  send(peer, payload)
}

export default defineWebSocketHandler({
  open(peer) {
    ensureGcStarted()
    send(peer, { type: 'connected' })
  },

  message(peer, raw) {
    let msg: ClientMsg
    try {
      msg = JSON.parse(typeof raw === 'string' ? raw : raw.text())
    } catch {
      send(peer, { type: 'error', error: 'invalid_json' })
      return
    }

    const ctx = getCtx(peer)

    switch (msg.type) {
      case 'ping':
        send(peer, { type: 'pong' })
        return

      case 'join_room': {
        if (ctx.roomId || ctx.userId) {
          send(peer, { type: 'error', error: 'already_joined' })
          return
        }

        const { roomId, userName, credentials } = msg
        if (!roomId) {
          send(peer, { type: 'error', error: 'missing_room' })
          return
        }

        const joined = joinRoom(roomId, userName, credentials)
        if (!joined) {
          send(peer, { type: 'error', error: 'room_not_found' })
          return
        }

        const { room, user } = joined
        ctx.roomId = roomId
        ctx.userId = user.id
        registerPeer(peer.id, roomId, user.id)
        subscribe(peer, `room:${roomId}`)
        send(peer, {
          type: 'joined',
          roomId,
          userId: user.id,
          userToken: user.token,
          deck: CARD_VALUES,
        })
        broadcastRoom(peer, roomId)
        return
      }

      case 'vote': {
        if (!ctx.roomId || !ctx.userId) return
        setVote(ctx.roomId, ctx.userId, msg.cardValue)
        broadcastRoom(peer, ctx.roomId)
        return
      }

      case 'reveal_votes': {
        if (!ctx.roomId || !ctx.userId) return
        const room = revealVotes(ctx.roomId, ctx.userId)
        if (!room) {
          send(peer, { type: 'error', error: 'not_host' })
          return
        }
        publish(peer, `room:${ctx.roomId}`, { type: 'votes_revealed' })
        send(peer, { type: 'votes_revealed' })
        broadcastRoom(peer, ctx.roomId)
        return
      }

      case 'reset_votes': {
        if (!ctx.roomId || !ctx.userId) return
        const room = resetVotes(ctx.roomId, ctx.userId)
        if (!room) {
          send(peer, { type: 'error', error: 'not_host' })
          return
        }
        publish(peer, `room:${ctx.roomId}`, { type: 'votes_reset' })
        send(peer, { type: 'votes_reset' })
        broadcastRoom(peer, ctx.roomId)
        return
      }

      default:
        send(peer, { type: 'error', error: 'unknown_type' })
    }
  },

  close(peer) {
    const { room } = unregisterPeer(peer.id)
    if (!room) return
    const payload = JSON.stringify({ type: 'room_state_update', room: serializeRoom(room) })
    publish(peer, `room:${room.roomId}`, payload)
  },

  error(peer, err) {
    send(peer, { type: 'error', error: String((err as Error)?.message ?? err) })
  },
})
