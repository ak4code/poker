<script setup lang="ts">
import { LogOut, Share2, Spade } from 'lucide-vue-next'
import { useRoomStore } from '~/stores/room'

const route = useRoute()
const roomId = computed(() => String(route.params.id))

const store = useRoomStore()
const storedName = useStoredName()

const showNameModal = ref(false)
const showInviteModal = ref(false)

const socketCtl = useRoomSocket()
onBeforeUnmount(() => socketCtl.stop())
onBeforeUnmount(() => store.reset())

function startSocket(name: string) {
  socketCtl.start({
    roomId: roomId.value,
    userName: name,
    credentials: getRoomCredentials(roomId.value),
  })
}

onMounted(() => {
  const n = storedName.value.trim()
  if (n) startSocket(n)
  else showNameModal.value = true
})

function onNameSubmit(n: string) {
  storedName.value = n
  showNameModal.value = false
  startSocket(n)
}

function handlePick(value: string | null) {
  socketCtl.vote(value)
}

async function leaveRoom() {
  socketCtl.stop()
  clearRoomCredentials(roomId.value)
  clearActiveHostRoom(roomId.value)
  clearLastRoom(roomId.value)
  await navigateTo('/')
}

watch(
  () => store.error,
  (err) => {
    if (err === 'room_not_found') {
      clearRoomCredentials(roomId.value)
      clearActiveHostRoom(roomId.value)
      clearLastRoom(roomId.value)
    }
  },
)

const inviteUrl = computed(() => {
  if (typeof window === 'undefined') return ''
  return `${location.origin}/room/${roomId.value}`
})

const showDeck = computed(() => store.me?.canVote !== false)
</script>

<template>
  <main class="relative z-10 mx-auto min-h-screen max-w-5xl px-3 pt-5 pb-12 sm:px-4 sm:pt-8">
    <NameModal
      v-if="showNameModal"
      :initial="storedName"
      title="Войти в комнату"
      cta="Присоединиться"
      @submit="onNameSubmit"
    />

    <InviteModal
      v-if="showInviteModal"
      :url="inviteUrl"
      @close="showInviteModal = false"
    />

    <header class="motion-enter mb-5 flex flex-wrap items-center justify-between gap-3 sm:mb-6">
      <button
        type="button"
        class="action-button focus-ring flex items-center gap-3 rounded-lg text-left hover:brightness-125"
        aria-label="Открыть QR-код комнаты"
        @click="showInviteModal = true"
      >
        <div
          class="grid h-9 w-9 place-items-center rounded-lg border border-[var(--color-border-strong)]"
          style="background: var(--color-surface-strong); backdrop-filter: blur(12px);"
        >
          <Spade :size="16" class="text-[var(--color-accent-blue)]" />
        </div>
        <div>
          <div class="font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--color-fg-muted)]">
            Комната
          </div>
          <div class="font-mono text-sm text-[var(--color-fg)]">{{ roomId }}</div>
        </div>
      </button>
      <div class="flex items-center gap-2">
        <span
          v-if="!store.connected"
          class="rounded-full px-3 py-1 font-mono text-[11px]"
          style="background: rgba(251, 191, 36, 0.12); border: 1px solid rgba(251, 191, 36, 0.3); color: #fbbf24;"
        >
          {{ store.joining ? 'Подключение…' : 'Переподключение…' }}
        </span>
        <button
          class="action-button focus-ring inline-flex items-center gap-2 rounded-lg px-3 py-2 font-mono text-xs hover:brightness-125"
          style="background: var(--color-surface-strong); backdrop-filter: blur(12px); border: 1px solid var(--color-border-strong); color: var(--color-fg);"
          @click="showInviteModal = true"
        >
          <Share2 :size="14" />
          <span class="hidden sm:inline">Пригласить</span>
        </button>
        <ThemeToggle />
      </div>
    </header>

    <div
      v-if="store.error === 'room_not_found'"
      class="motion-enter rounded-2xl p-6 text-center"
      style="background: rgba(239, 68, 68, 0.10); border: 1px solid rgba(239, 68, 68, 0.30);"
    >
      <h2 class="font-mono text-lg" style="color: #fca5a5">Комната не найдена</h2>
      <p class="mt-1 font-mono text-xs text-[var(--color-fg-muted)]">
        Возможно, она была закрыта. Попросите ведущего создать новую.
      </p>
      <NuxtLink
        to="/"
        class="action-button mt-4 inline-block rounded-lg px-4 py-2 font-mono text-sm hover:brightness-110"
        style="background: linear-gradient(135deg, #60a5fa 0%, #a78bfa 100%); color: #fff;"
      >
        На главную
      </NuxtLink>
    </div>

    <div v-else-if="store.room" class="space-y-4 sm:space-y-5">
      <CardDeck v-if="showDeck" @pick="handlePick" />

      <div
        v-if="store.isHost"
        class="glass interactive-surface motion-enter flex flex-col gap-3 rounded-2xl p-4 sm:flex-row sm:items-center sm:justify-between"
      >
        <div class="font-mono text-[11px] uppercase tracking-[0.2em] text-[var(--color-fg-muted)]">
          Управление раундом
        </div>
        <HostControls @reveal="socketCtl.reveal()" @reset="socketCtl.reset()" />
      </div>

      <PokerTable />

      <ResultsSummary v-if="store.room.status === 'revealed'" />

      <div class="flex justify-center border-t border-[var(--color-border)] pt-6">
        <button
          type="button"
          class="action-button focus-ring inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 font-mono text-sm hover:brightness-125"
          style="background: var(--color-surface-strong); border: 1px solid var(--color-border-strong); color: var(--color-fg);"
          @click="leaveRoom"
        >
          <LogOut :size="16" />
          Выйти из комнаты
        </button>
      </div>
    </div>

    <div
      v-else-if="!showNameModal"
      class="glass motion-enter rounded-2xl p-12 text-center font-mono text-sm text-[var(--color-fg-muted)]"
    >
      Подключаемся к комнате…
    </div>
  </main>
</template>
