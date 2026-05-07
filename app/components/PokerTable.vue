<script setup lang="ts">
import { Crown, LoaderCircle, User, UsersRound } from 'lucide-vue-next'
import { useRoomStore } from '~/stores/room'

const store = useRoomStore()
const isRevealed = computed(() => store.room?.status === 'revealed')
const onlineCount = computed(() => store.orderedUsers.filter((u) => u.online).length)
const voters = computed(() => {
  const list = store.orderedUsers.filter((u) => u.canVote)
  if (!isRevealed.value) return list
  const order = store.room?.deck ?? []
  const rank = (vote: string | null) => {
    if (vote == null) return 9999
    const idx = order.indexOf(vote)
    return idx === -1 ? 9999 : idx
  }
  return list.slice().sort((a, b) => {
    const diff = rank(a.vote) - rank(b.vote)
    if (diff !== 0) return diff
    return a.name.localeCompare(b.name)
  })
})
const onlineVotersCount = computed(() => voters.value.filter((u) => u.online).length)
const waitingForVoters = computed(() => !isRevealed.value && onlineVotersCount.value === 0)

function hasSelectedCard(user: { hasVoted: boolean; vote: string | null }) {
  return store.room?.status === 'voting'
    ? user.hasVoted
    : user.hasVoted && user.vote !== null
}
</script>

<template>
  <section class="glass interactive-surface motion-enter rounded-2xl p-4 sm:p-6">
    <header class="mb-4 flex items-center justify-between sm:mb-5">
      <div class="flex items-center gap-2">
        <span
          class="inline-block h-2 w-2 rounded-full"
          :class="isRevealed ? 'bg-[var(--color-success)]' : 'bg-[var(--color-warn)] pulse-soft'"
        />
        <h2 class="font-mono text-xs uppercase tracking-[0.2em] text-[var(--color-fg-muted)] sm:text-sm">
          {{ isRevealed ? 'Карты открыты' : 'Идёт голосование' }}
        </h2>
      </div>
      <span class="font-mono text-xs text-[var(--color-fg-dim)]">
        {{ onlineCount }} {{ onlineCount === 1 ? 'игрок' : 'игроков' }}
      </span>
    </header>

    <Transition name="fade-scale" mode="out-in">
      <div
        v-if="waitingForVoters"
        class="glass motion-enter flex min-h-48 flex-col items-center justify-center rounded-xl p-6 text-center"
        style="background: var(--color-surface); border: 1px solid var(--color-border-strong);"
      >
        <div class="relative mb-4 grid h-14 w-14 place-items-center rounded-full border border-[var(--color-border-strong)]">
          <LoaderCircle :size="28" class="animate-spin text-[var(--color-accent-blue)]" />
          <UsersRound :size="16" class="absolute text-[var(--color-fg)]" />
        </div>
        <div class="font-mono text-sm text-[var(--color-fg)]">Ожидаем игроков</div>
        <div class="mt-1 max-w-xs font-mono text-xs text-[var(--color-fg-muted)]">
          Голосование начнётся, когда в комнате появится хотя бы один участник.
        </div>
      </div>

      <TransitionGroup
        v-else
        name="list-motion"
        tag="div"
        class="flex flex-col gap-2 sm:grid sm:grid-cols-3 sm:gap-3 md:grid-cols-4 lg:grid-cols-5"
      >
        <div
          v-for="(u, index) in voters"
          :key="u.id"
          class="stagger-enter rounded-xl p-3"
          :class="[
            hasSelectedCard(u) ? 'border border-lime-400/70' : 'border border-transparent',
            !u.online ? 'opacity-50' : '',
            'flex items-center gap-3 sm:flex-col sm:gap-0 sm:p-3',
          ]"
          :style="{ animationDelay: `${index * 45}ms` }"
        >
          <div class="shrink-0 sm:order-1 sm:mb-3 sm:flex sm:justify-center">
            <PokerCard
              :state="!u.canVote ? 'empty' : u.hasVoted ? 'face' : 'thinking'"
              :value="u.vote"
              :flipped="isRevealed && u.hasVoted"
              :transparent-back="isRevealed"
              size="sm"
              class="sm:!w-16 sm:!h-auto sm:!aspect-[2/3] sm:!text-2xl"
            />
          </div>

          <div class="flex min-w-0 flex-1 flex-col gap-1 sm:order-2 sm:flex-none sm:items-center sm:gap-1">
            <div class="flex min-w-0 items-center gap-2">
              <Crown
                v-if="store.room && u.id === store.room.hostId"
                :size="14"
                class="shrink-0 text-[var(--color-accent-purple)]"
              />
              <User v-else :size="14" class="shrink-0 text-[var(--color-accent-blue)]" />
              <span class="truncate font-mono text-sm text-[var(--color-fg)]">{{ u.name }}</span>
              <span
                v-if="u.id === store.myUserId"
                class="ml-1 shrink-0 rounded-md bg-[rgba(96,165,250,0.15)] px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wider text-[var(--color-accent-blue)]"
              >
                Это Вы
              </span>
            </div>
            <div class="flex items-center gap-1.5">
              <span
                class="inline-block h-1.5 w-1.5 rounded-full"
                :class="u.online ? 'bg-[var(--color-success)]' : 'bg-[var(--color-fg-dim)]'"
              />
              <span class="font-mono text-[11px] text-[var(--color-fg-dim)]">
                {{ !u.online ? 'offline' : !u.canVote ? 'ведущий' : u.hasVoted ? 'проголосовал' : 'думает' }}
              </span>
            </div>
          </div>
        </div>
      </TransitionGroup>
    </Transition>
  </section>
</template>
