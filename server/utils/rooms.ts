import { randomUUID } from 'node:crypto'

export const CARD_VALUES = ['1', '2', '3', '5', '8', '13', '21', '?', '☕'] as const
export type CardValue = (typeof CARD_VALUES)[number]
export type RoomStatus = 'voting' | 'revealed'

export interface RoomUser {
  id: string
  token: string
  name: string
  vote: CardValue | null
  hasVoted: boolean
  online: boolean
}

export interface Room {
  roomId: string
  hostId: string
  hostCanVote: boolean
  status: RoomStatus
  users: Map<string, RoomUser>
  createdAt: number
  emptySince: number | null
}

export interface RoomCredentials {
  userId: string
  userToken: string
}

export interface RoomSummary {
  count: number
  distribution: Record<string, number>
  min: { value: string; voters: string[] } | null
  max: { value: string; voters: string[] } | null
  consensus: string | null
  majority: { value: string; count: number; total: number } | null
}

const rooms = new Map<string, Room>()
const peerIndex = new Map<string, { roomId: string; userId: string }>()
const userPeers = new Map<string, Set<string>>()

function userPeersKey(roomId: string, userId: string) {
  return `${roomId}::${userId}`
}

function generateRoomId() {
  const seg = () => Math.random().toString(36).slice(2, 6)
  return `${seg()}-${seg()}`
}

function generateUserId() {
  return `u_${randomUUID()}`
}

function generateUserToken() {
  return randomUUID()
}

function createRoomUser(name: string): RoomUser {
  return {
    id: generateUserId(),
    token: generateUserToken(),
    name: normalizeUserName(name),
    vote: null,
    hasVoted: false,
    online: false,
  }
}

function normalizeUserName(name: string) {
  return name.trim().slice(0, 40) || 'Player'
}

function getValidUser(room: Room, credentials?: Partial<RoomCredentials> | null) {
  if (!credentials?.userId || !credentials.userToken) return null
  const user = room.users.get(credentials.userId)
  return user?.token === credentials.userToken ? user : null
}

function touchPresence(room: Room) {
  room.emptySince = [...room.users.values()].some((u) => u.online) ? null : Date.now()
}

function canUserVote(room: Room, userId: string) {
  return room.hostCanVote || room.hostId !== userId
}

export function createRoom(hostName: string, hostCanVote: boolean): { room: Room; credentials: RoomCredentials } {
  let roomId = generateRoomId()
  while (rooms.has(roomId)) roomId = generateRoomId()

  const host = createRoomUser(hostName)
  const room: Room = {
    roomId,
    hostId: host.id,
    hostCanVote,
    status: 'voting',
    users: new Map([[host.id, host]]),
    createdAt: Date.now(),
    emptySince: Date.now(),
  }
  rooms.set(roomId, room)
  return { room, credentials: { userId: host.id, userToken: host.token } }
}

export function getRoom(roomId: string): Room | undefined {
  return rooms.get(roomId)
}

export function joinRoom(
  roomId: string,
  userName: string,
  credentials?: Partial<RoomCredentials> | null,
): { room: Room; user: RoomUser } | null {
  const room = rooms.get(roomId)
  if (!room) return null

  let user = getValidUser(room, credentials)
  if (!user) {
    user = createRoomUser(userName)
    room.users.set(user.id, user)
  }

  user.name = normalizeUserName(userName)
  user.online = true
  touchPresence(room)

  return { room, user }
}

export function setVote(roomId: string, userId: string, value: CardValue | null): Room | null {
  const room = rooms.get(roomId)
  if (!room) return null
  if (room.status !== 'voting') return room
  const user = room.users.get(userId)
  if (!user) return room
  if (!canUserVote(room, userId)) {
    user.vote = null
    user.hasVoted = false
    return room
  }

  if (value === null) {
    user.vote = null
    user.hasVoted = false
  } else if ((CARD_VALUES as readonly string[]).includes(value)) {
    user.vote = value
    user.hasVoted = true
  }
  return room
}

export function revealVotes(roomId: string, requesterId: string): Room | null {
  const room = rooms.get(roomId)
  if (!room || room.hostId !== requesterId) return null
  room.status = 'revealed'
  return room
}

export function resetVotes(roomId: string, requesterId: string): Room | null {
  const room = rooms.get(roomId)
  if (!room || room.hostId !== requesterId) return null
  room.status = 'voting'
  for (const u of room.users.values()) {
    u.vote = null
    u.hasVoted = false
  }
  return room
}

export function registerPeer(peerId: string, roomId: string, userId: string) {
  peerIndex.set(peerId, { roomId, userId })
  const key = userPeersKey(roomId, userId)
  const set = userPeers.get(key) ?? new Set<string>()
  set.add(peerId)
  userPeers.set(key, set)
}

export function unregisterPeer(peerId: string): { room: Room | null; userId: string | null; userOffline: boolean } {
  const ref = peerIndex.get(peerId)
  if (!ref) return { room: null, userId: null, userOffline: false }
  peerIndex.delete(peerId)

  const key = userPeersKey(ref.roomId, ref.userId)
  const set = userPeers.get(key)
  if (set) {
    set.delete(peerId)
    if (set.size === 0) userPeers.delete(key)
  }

  const stillOnline = (userPeers.get(key)?.size ?? 0) > 0
  const room = rooms.get(ref.roomId) ?? null
  if (room && !stillOnline) {
    const user = room.users.get(ref.userId)
    if (user) user.online = false
    touchPresence(room)
  }
  return { room, userId: ref.userId, userOffline: !stillOnline }
}

export function maybeTransferHost(room: Room): boolean {
  const host = room.users.get(room.hostId)
  if (host?.online) return false
  const nextOnline = [...room.users.values()].find((u) => u.online)
  if (!nextOnline) return false
  room.hostId = nextOnline.id
  if (!room.hostCanVote) {
    nextOnline.vote = null
    nextOnline.hasVoted = false
  }
  return true
}

function buildRoomSummary(room: Room): RoomSummary {
  const distribution: Record<string, number> = {}
  const numericVotes: Array<{ name: string; value: string; num: number }> = []

  for (const user of room.users.values()) {
    if (user.vote == null) continue
    distribution[user.vote] = (distribution[user.vote] ?? 0) + 1

    const num = Number(user.vote)
    if (Number.isFinite(num)) {
      numericVotes.push({ name: user.name, value: user.vote, num })
    }
  }

  const min = buildExtremeVote(numericVotes, 'min')
  const max = buildExtremeVote(numericVotes, 'max')
  const { consensus, majority } = buildAgreement(numericVotes.length, distribution)

  return { count: numericVotes.length, distribution, min, max, consensus, majority }
}

function buildExtremeVote(votes: Array<{ name: string; value: string; num: number }>, direction: 'min' | 'max') {
  if (votes.length === 0) return null

  const target = direction === 'min'
    ? Math.min(...votes.map((v) => v.num))
    : Math.max(...votes.map((v) => v.num))

  return {
    value: String(target),
    voters: votes.filter((v) => v.num === target).map((v) => v.name),
  }
}

function buildAgreement(totalNumericVotes: number, distribution: Record<string, number>) {
  let consensus: string | null = null
  let majority: RoomSummary['majority'] = null

  const numericDistribution = Object.entries(distribution)
    .filter(([value]) => Number.isFinite(Number(value)))
    .sort((a, b) => b[1] - a[1])

  const [top] = numericDistribution
  if (!top || totalNumericVotes === 0) return { consensus, majority }

  const [value, count] = top
  if (count === totalNumericVotes) {
    consensus = value
  } else if (totalNumericVotes >= 3 && count === totalNumericVotes - 1) {
    majority = { value, count, total: totalNumericVotes }
  }

  return { consensus, majority }
}

export function serializeRoom(room: Room) {
  const isRevealed = room.status === 'revealed'
  const users = [...room.users.values()].map((u) => ({
    id: u.id,
    name: u.name,
    canVote: canUserVote(room, u.id),
    hasVoted: u.hasVoted,
    online: u.online,
    vote: isRevealed ? u.vote : null,
  }))

  return {
    roomId: room.roomId,
    hostId: room.hostId,
    hostCanVote: room.hostCanVote,
    status: room.status,
    users,
    summary: isRevealed ? buildRoomSummary(room) : null,
    deck: CARD_VALUES,
  }
}

const GC_INTERVAL_MS = 5 * 60 * 1000
const ROOM_TTL_MS = 30 * 60 * 1000
let gcStarted = false
export function ensureGcStarted() {
  if (gcStarted) return
  gcStarted = true
  setInterval(() => {
    const now = Date.now()
    for (const [id, room] of rooms) {
      if (room.emptySince && now - room.emptySince > ROOM_TTL_MS) {
        rooms.delete(id)
      }
    }
  }, GC_INTERVAL_MS).unref?.()
}
