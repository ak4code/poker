const NAME_KEY = 'sp:userName'
const HOST_ROOM_KEY = 'sp:hostRoom'
const LAST_ROOM_KEY = 'sp:lastRoom'

export interface RoomCredentials {
  userId: string
  userToken: string
}

export function useStoredName() {
  const stored = import.meta.client ? localStorage.getItem(NAME_KEY) ?? '' : ''
  const name = ref(stored)
  watch(name, (v) => {
    if (import.meta.client) {
      if (v) localStorage.setItem(NAME_KEY, v)
      else localStorage.removeItem(NAME_KEY)
    }
  })
  return name
}

function credentialsKey(roomId: string) {
  return `sp:room:${roomId}:credentials`
}

function parseCredentials(raw: string): RoomCredentials | null {
  try {
    const parsed = JSON.parse(raw) as Partial<RoomCredentials>
    if (parsed.userId && parsed.userToken) {
      return { userId: parsed.userId, userToken: parsed.userToken }
    }
  } catch {
    return null
  }

  return null
}

export function getRoomCredentials(roomId: string): RoomCredentials | null {
  if (import.meta.server) return null

  const raw = localStorage.getItem(credentialsKey(roomId))
  if (!raw) return null

  const credentials = parseCredentials(raw)
  if (credentials) return credentials

  localStorage.removeItem(credentialsKey(roomId))
  return null
}

export function saveRoomCredentials(roomId: string, credentials: RoomCredentials) {
  if (import.meta.server) return
  localStorage.setItem(credentialsKey(roomId), JSON.stringify(credentials))
}

export function clearRoomCredentials(roomId: string) {
  if (import.meta.server) return
  localStorage.removeItem(credentialsKey(roomId))
}

export function getActiveHostRoom(): string | null {
  if (import.meta.server) return null
  return localStorage.getItem(HOST_ROOM_KEY)
}

export function setActiveHostRoom(roomId: string) {
  if (import.meta.server) return
  localStorage.setItem(HOST_ROOM_KEY, roomId)
}

export function clearActiveHostRoom(roomId?: string) {
  if (import.meta.server) return
  if (roomId && localStorage.getItem(HOST_ROOM_KEY) !== roomId) return
  localStorage.removeItem(HOST_ROOM_KEY)
}

export function getLastRoom(): string | null {
  if (import.meta.server) return null
  return localStorage.getItem(LAST_ROOM_KEY)
}

export function setLastRoom(roomId: string) {
  if (import.meta.server) return
  localStorage.setItem(LAST_ROOM_KEY, roomId)
}

export function clearLastRoom(roomId?: string) {
  if (import.meta.server) return
  if (roomId && localStorage.getItem(LAST_ROOM_KEY) !== roomId) return
  localStorage.removeItem(LAST_ROOM_KEY)
}