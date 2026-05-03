import { useRoomStore } from '~/stores/room'
import { saveRoomCredentials, type RoomCredentials } from './useRoomIdentity'

type ServerMsg =
  | { type: 'connected' }
  | { type: 'joined'; roomId: string; userId: string; userToken: string; deck: string[] }
  | { type: 'room_state_update'; room: any }
  | { type: 'votes_revealed' }
  | { type: 'votes_reset' }
  | { type: 'pong' }
  | { type: 'error'; error: string }

export interface StartOpts {
  roomId: string
  userName: string
  credentials?: RoomCredentials | null
}

export function useRoomSocket() {
  const store = useRoomStore()

  let ws: WebSocket | null = null
  let manualClose = false
  let reconnectTimer: ReturnType<typeof setTimeout> | null = null
  let pingTimer: ReturnType<typeof setInterval> | null = null
  let reconnectAttempts = 0
  let active: StartOpts | null = null

  function url() {
    const proto = location.protocol === 'https:' ? 'wss:' : 'ws:'
    return `${proto}//${location.host}/api/ws`
  }

  function send(payload: unknown) {
    if (ws && ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify(payload))
  }

  function connect() {
    if (!active || import.meta.server) return
    store.setJoining(true)

    ws = new WebSocket(url())

    ws.addEventListener('open', () => {
      reconnectAttempts = 0
      store.setConnected(true)
      send({
        type: 'join_room',
        roomId: active!.roomId,
        userName: active!.userName,
        credentials: active!.credentials,
      })
      pingTimer = setInterval(() => send({ type: 'ping' }), 25_000)
    })

    ws.addEventListener('message', (ev) => {
      let msg: ServerMsg
      try {
        msg = JSON.parse(ev.data)
      } catch {
        return
      }
      switch (msg.type) {
        case 'joined':
          active = {
            roomId: msg.roomId,
            userName: active?.userName ?? '',
            credentials: { userId: msg.userId, userToken: msg.userToken },
          }
          store.setMyUserId(msg.userId)
          saveRoomCredentials(msg.roomId, { userId: msg.userId, userToken: msg.userToken })
          store.setJoining(false)
          break
        case 'room_state_update':
          store.applyRoomState(msg.room)
          store.setJoining(false)
          break
        case 'votes_revealed':
          store.triggerFlip()
          break
        case 'votes_reset':
          store.triggerReset()
          break
        case 'error':
          store.setError(msg.error)
          if (msg.error === 'room_not_found') store.setJoining(false)
          break
      }
    })

    ws.addEventListener('close', () => {
      store.setConnected(false)
      if (pingTimer) {
        clearInterval(pingTimer)
        pingTimer = null
      }
      if (manualClose || !active) return
      reconnectAttempts += 1
      const delay = Math.min(1000 * 2 ** Math.min(reconnectAttempts, 5), 15_000)
      reconnectTimer = setTimeout(connect, delay)
    })
  }

  function start(opts: StartOpts) {
    if (active) return
    active = opts
    manualClose = false
    if (opts.credentials?.userId) store.setMyUserId(opts.credentials.userId)
    connect()
  }

  function stop() {
    manualClose = true
    active = null
    if (reconnectTimer) clearTimeout(reconnectTimer)
    if (pingTimer) clearInterval(pingTimer)
    ws?.close()
    ws = null
    store.reset()
  }

  function vote(cardValue: string | null) {
    store.setPendingVote(cardValue)
    send({ type: 'vote', cardValue })
  }
  function reveal() {
    send({ type: 'reveal_votes' })
  }
  function reset() {
    send({ type: 'reset_votes' })
  }

  return { start, stop, vote, reveal, reset }
}
