<script setup lang="ts">
import { Eye, EyeOff } from 'lucide-vue-next'
import { useRoomStore } from '~/stores/room'

const emit = defineEmits<{ pick: [value: string | null] }>()

const store = useRoomStore()
const selected = computed(() => store.myVoteValue)
const deckVisible = ref(true)

function pick(v: string) {
  emit('pick', selected.value === v ? null : v)
}
</script>

<template>
  <section class="glass interactive-surface motion-enter rounded-2xl p-4 sm:p-6">
    <header :class="deckVisible ? 'mb-5' : ''">
      <div class="flex items-center justify-between gap-3">
        <h2 class="font-mono text-sm uppercase tracking-[0.2em] text-[var(--color-fg-muted)]">
          Ваша колода
        </h2>
        <button
          type="button"
          class="action-button focus-ring inline-flex shrink-0 items-center justify-center gap-2 rounded-lg px-3 py-2 font-mono text-xs hover:brightness-125"
          style="background: var(--color-surface-strong); border: 1px solid var(--color-border-strong); color: var(--color-fg);"
          @click="deckVisible = !deckVisible"
        >
          <EyeOff v-if="deckVisible" :size="14" />
          <Eye v-else :size="14" />
          {{ deckVisible ? 'Скрыть колоду' : 'Показать колоду' }}
        </button>
      </div>

      <div class="mt-1 min-h-4 font-mono text-xs text-[var(--color-fg-dim)]">
          <span v-if="!store.me?.canVote">ведущий не участвует в оценке</span>
          <span v-else-if="selected">
          выбрано: <span class="text-[var(--color-accent-blue)]">{{ selected }}</span>
        </span>
      </div>
    </header>

    <Transition name="deck-collapse">
      <div v-if="deckVisible" class="flex flex-wrap justify-center gap-3 sm:grid sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-9">
        <button
          v-for="(card, index) in store.deck"
          :key="card"
          type="button"
          class="group relative rounded-2xl stagger-enter basis-[calc((100%-3rem)/5)] sm:basis-auto"
          :style="{ animationDelay: `${index * 34}ms` }"
          @click="pick(card)"
        >
          <div class="flip-perspective aspect-[2/3] w-full">
            <div
              class="card-glow relative h-full w-full cursor-pointer overflow-hidden rounded-2xl border border-[var(--color-border)] transition-all duration-300 ease-out hover:-translate-y-2 hover:scale-[1.04] active:scale-[0.98]"
              :class="selected === card ? 'card-glow-active border-[var(--color-accent-blue)]/60' : ''"
              style="background: var(--color-surface); backdrop-filter: blur(12px);"
            >
              <div
                class="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                :class="selected === card ? 'opacity-100' : ''"
                style="background: linear-gradient(135deg, rgba(96, 165, 250, 0.18) 0%, rgba(167, 139, 250, 0.18) 100%);"
              />

              <div class="relative flex h-full items-center justify-center">
                <span
                  class="neon-text font-mono text-[var(--color-fg)] transition-transform duration-300 group-hover:scale-110"
                  :style="{ fontSize: card === '☕' ? '2.5rem' : '2rem' }"
                >
                  {{ card }}
                </span>
              </div>

              <div
                class="pointer-events-none absolute inset-x-0 bottom-0 h-1 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                :class="selected === card ? 'opacity-100' : ''"
                style="background: linear-gradient(90deg, var(--color-accent-blue) 0%, var(--color-accent-purple) 100%); box-shadow: 0 0 10px rgba(96, 165, 250, 0.8);"
              />

              <template v-if="selected === card">
                <span class="pointer-events-none absolute top-2 left-2 h-3 w-3 border-t-2 border-l-2 border-[var(--color-accent-blue)]" />
                <span class="pointer-events-none absolute top-2 right-2 h-3 w-3 border-t-2 border-r-2 border-[var(--color-accent-purple)]" />
                <span class="pointer-events-none absolute bottom-2 left-2 h-3 w-3 border-b-2 border-l-2 border-[var(--color-accent-purple)]" />
                <span class="pointer-events-none absolute bottom-2 right-2 h-3 w-3 border-b-2 border-r-2 border-[var(--color-accent-blue)]" />
              </template>
            </div>
          </div>
        </button>
      </div>
    </Transition>
  </section>
</template>
