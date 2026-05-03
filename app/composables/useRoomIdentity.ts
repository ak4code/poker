const NAME_KEY = 'sp:userName'

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

  const raw = sessionStorage.getItem(credentialsKey(roomId))
  if (!raw) return null

  const credentials = parseCredentials(raw)
  if (credentials) return credentials

  sessionStorage.removeItem(credentialsKey(roomId))
  return null
}

export function saveRoomCredentials(roomId: string, credentials: RoomCredentials) {
  if (import.meta.server) return
  sessionStorage.setItem(credentialsKey(roomId), JSON.stringify(credentials))
}
