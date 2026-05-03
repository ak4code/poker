<script setup lang="ts">
import { ArrowDown, ArrowUp, Sparkles, Users } from 'lucide-vue-next'
import { useRoomStore } from '~/stores/room'

const store = useRoomStore()
const summary = computed(() => store.room?.summary)

const sortedDistribution = computed(() => {
  if (!summary.value) return [] as { value: string; count: number }[]
  return Object.entries(summary.value.distribution)
    .map(([value, count]) => ({ value, count }))
    .sort((a, b) => b.count - a.count)
})

const headline = computed(() => {
  const s = summary.value
  if (!s) return null
  if (s.consensus) return { kind: 'consensus' as const, value: s.consensus }
  if (s.majority) return { kind: 'majority' as const, value: s.majority.value, count: s.majority.count, total: s.majority.total }
  return null
})

function joinNames(names: string[]): string {
  if (names.length <= 2) return names.join(', ')
  return `${names.slice(0, 2).join(', ')} +${names.length - 2}`
}
</script>

<template>
  <section v-if="summary" class="glass interactive-surface motion-enter rounded-2xl p-4 sm:p-6">
    <h2 class="mb-4 font-mono text-sm uppercase tracking-[0.2em] text-[var(--color-fg-muted)] sm:mb-5">
      Результаты раунда
    </h2>

    <div
      v-if="summary.count === 0"
      class="rounded-xl p-4 text-center font-mono text-sm text-[var(--color-fg-muted)]"
      style="background: rgba(15, 23, 42, 0.4); border: 1px solid var(--color-border);"
    >
      Численных оценок нет.
    </div>

    <template v-else>
      <div
        v-if="headline"
        class="glass interactive-surface mb-4 flex items-center gap-3 overflow-hidden rounded-xl p-4 sm:gap-4 sm:p-5"
        :style="{
          background: headline.kind === 'consensus'
            ? 'linear-gradient(135deg, rgba(52, 211, 153, 0.18), rgba(96, 165, 250, 0.12))'
            : 'linear-gradient(135deg, rgba(96, 165, 250, 0.18), rgba(167, 139, 250, 0.18))',
          border: '1px solid rgba(148, 163, 184, 0.2)',
        }"
      >
        <Sparkles
          :size="20"
          :class="headline.kind === 'consensus' ? 'text-[var(--color-success)]' : 'text-[var(--color-accent-blue)]'"
        />
        <div class="flex-1 min-w-0">
          <div class="font-mono text-[11px] uppercase tracking-wider text-[var(--color-fg-muted)]">
            {{ headline.kind === 'consensus' ? 'Консенсус' : 'Большинство' }}
          </div>
          <div class="font-mono text-xs text-[var(--color-fg-muted)]">
            <template v-if="headline.kind === 'consensus'">все согласны</template>
            <template v-else>{{ headline.count }} из {{ headline.total }} проголосовали так</template>
          </div>
        </div>
        <div
          class="font-mono text-4xl font-semibold neon-text sm:text-5xl"
          :class="headline.kind === 'consensus' ? '' : 'brand-gradient'"
          :style="headline.kind === 'consensus' ? { color: '#34d399' } : {}"
        >
          {{ headline.value }}
        </div>
      </div>

      <div class="grid gap-3 sm:grid-cols-2 sm:gap-4">
        <div class="glass interactive-surface flex items-center gap-3 rounded-xl p-4">
          <div
            class="grid h-10 w-10 shrink-0 place-items-center rounded-lg"
            style="background: rgba(52, 211, 153, 0.16); border: 1px solid rgba(52, 211, 153, 0.3); color: #34d399;"
          >
            <ArrowDown :size="18" />
          </div>
          <div class="flex-1 min-w-0">
            <div class="font-mono text-[11px] uppercase tracking-wider text-[var(--color-fg-muted)]">Самая низкая оценка</div>
            <div v-if="summary.min" class="flex items-baseline gap-2">
              <span class="font-mono text-2xl font-semibold text-[var(--color-fg)] neon-text">
                {{ summary.min.value }}
              </span>
              <span class="truncate font-mono text-xs text-[var(--color-fg-muted)]">
                {{ joinNames(summary.min.voters) }}
              </span>
            </div>
          </div>
        </div>

        <div class="glass interactive-surface flex items-center gap-3 rounded-xl p-4">
          <div
            class="grid h-10 w-10 shrink-0 place-items-center rounded-lg"
            style="background: rgba(239, 68, 68, 0.16); border: 1px solid rgba(239, 68, 68, 0.3); color: #f87171;"
          >
            <ArrowUp :size="18" />
          </div>
          <div class="flex-1 min-w-0">
            <div class="font-mono text-[11px] uppercase tracking-wider text-[var(--color-fg-muted)]">Самая высокая оценка</div>
            <div v-if="summary.max" class="flex items-baseline gap-2">
              <span class="font-mono text-2xl font-semibold text-[var(--color-fg)] neon-text">
                {{ summary.max.value }}
              </span>
              <span class="truncate font-mono text-xs text-[var(--color-fg-muted)]">
                {{ joinNames(summary.max.voters) }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div class="mt-5 glass interactive-surface rounded-xl p-4">
        <div class="mb-3 flex items-center gap-2 font-mono text-[11px] uppercase tracking-wider text-[var(--color-fg-muted)]">
          <Users :size="12" /> Распределение
        </div>
        <div class="grid gap-2">
          <div
            v-for="(row, index) in sortedDistribution"
            :key="row.value"
            class="stagger-enter flex items-center gap-3"
            :style="{ animationDelay: `${index * 70}ms` }"
          >
            <div class="w-8 text-right font-mono text-sm text-[var(--color-fg-muted)]">{{ row.value }}</div>
            <div class="h-2 flex-1 overflow-hidden rounded-full bg-[rgba(15,23,42,0.6)]">
              <div
                class="h-full rounded-full transition-all duration-700"
                :style="{
                  width: `${(row.count / Math.max(1, sortedDistribution[0].count)) * 100}%`,
                  background: 'linear-gradient(90deg, var(--color-accent-blue), var(--color-accent-purple))',
                }"
              />
            </div>
            <div class="w-6 text-right font-mono text-sm tabular-nums text-[var(--color-fg-muted)]">
              {{ row.count }}
            </div>
          </div>
        </div>
      </div>
    </template>
  </section>
</template>
