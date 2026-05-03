import { defineStore } from 'pinia'

export interface RoomUserView {
  id: string
  name: string
  canVote: boolean
  hasVoted: boolean
  online: boolean
  vote: string | null
}

export interface RoomSummary {
  count: number
  distribution: Record<string, number>
  min: { value: string; voters: string[] } | null
  max: { value: string; voters: string[] } | null
  consensus: string | null
  majority: { value: string; count: number; total: number } | null
}

export interface RoomView {
  roomId: string
  hostId: string
  hostCanVote: boolean
  status: 'voting' | 'revealed'
  users: RoomUserView[]
  summary: RoomSummary | null
  deck: string[]
}

export const useRoomStore = defineStore('room', {
  state: () => ({
    myUserId: '' as string,
    connected: false,
    joining: false,
    error: '' as string,
    flipTrigger: 0,
    resetTrigger: 0,
    pendingVote: null as string | null,
    room: null as RoomView | null,
  }),
  getters: {
    me(state): RoomUserView | null {
      return state.room?.users.find((u) => u.id === state.myUserId) ?? null
    },
    isHost(state): boolean {
      return !!state.room && state.room.hostId === state.myUserId
    },
    otherUsers(state): RoomUserView[] {
      return state.room?.users.filter((u) => u.id !== state.myUserId) ?? []
    },
    orderedUsers(state): RoomUserView[] {
      if (!state.room) return []
      return [...state.room.users].sort((a, b) => {
        if (a.id === state.room!.hostId) return -1
        if (b.id === state.room!.hostId) return 1
        if (a.id === state.myUserId) return -1
        if (b.id === state.myUserId) return 1
        return a.name.localeCompare(b.name)
      })
    },
    allVoted(state): boolean {
      if (!state.room) return false
      const online = state.room.users.filter((u) => u.online && u.canVote)
      return online.length > 0 && online.every((u) => u.hasVoted)
    },
    deck(state): string[] {
      return state.room?.deck ?? []
    },
    myVoteValue(state): string | null {
      const me = state.room?.users.find((u) => u.id === state.myUserId)
      if (!me) return state.pendingVote
      if (!me.canVote) return null
      if (state.room?.status === 'voting') return state.pendingVote ?? (me.hasVoted ? state.pendingVote : null)
      return me.vote
    },
  },
  actions: {
    setMyUserId(id: string) {
      this.myUserId = id
    },
    applyRoomState(room: RoomView) {
      this.room = room
      if (room.status === 'revealed') {
        const me = room.users.find((u) => u.id === this.myUserId)
        this.pendingVote = me?.vote ?? null
      } else {
        const me = room.users.find((u) => u.id === this.myUserId)
        if (!me?.hasVoted || !me.canVote) this.pendingVote = null
      }
    },
    setPendingVote(v: string | null) {
      this.pendingVote = v
    },
    triggerFlip() {
      this.flipTrigger += 1
    },
    triggerReset() {
      this.resetTrigger += 1
      this.pendingVote = null
    },
    setError(msg: string) {
      this.error = msg
    },
    setConnected(c: boolean) {
      this.connected = c
    },
    setJoining(j: boolean) {
      this.joining = j
    },
    reset() {
      this.room = null
      this.pendingVote = null
      this.error = ''
      this.connected = false
      this.joining = false
    },
  },
})
