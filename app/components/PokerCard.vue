<script setup lang="ts">
interface Props {
  value?: string | null
  state: 'face' | 'back' | 'empty' | 'thinking'
  selected?: boolean
  size?: 'sm' | 'md' | 'lg'
  flipped?: boolean
  interactive?: boolean
  transparentBack?: boolean
}
const props = withDefaults(defineProps<Props>(), {
  size: 'md',
  selected: false,
  flipped: false,
  interactive: false,
  transparentBack: false,
  value: null,
})

const sizeClasses = computed(() => {
  switch (props.size) {
    case 'sm':
      return 'w-12 h-[4.5rem] text-lg'
    case 'lg':
      return 'w-full aspect-[2/3] text-7xl'
    case 'md':
    default:
      return 'w-16 aspect-[2/3] text-2xl'
  }
})
</script>

<template>
  <div
    class="flip-perspective select-none"
    :class="[sizeClasses, interactive ? 'cursor-pointer transition-transform duration-200 hover:-translate-y-1' : '']"
  >
    <div class="flip-inner h-full w-full" :class="{ 'is-revealed': flipped }">
      <div
        class="flip-face flip-front rounded-2xl"
        :class="[
          state === 'empty'
            ? 'border-2 border-dashed border-[var(--color-border-strong)] bg-transparent'
            : state === 'thinking'
              ? 'glass pulse-soft'
              : 'glass card-glow',
          selected ? 'card-glow-active' : '',
        ]"
      >
        <span v-if="state === 'thinking'" class="font-mono text-sm text-[var(--color-fg-dim)]">…</span>
        <span v-else-if="state === 'empty'" class="font-mono text-sm text-[var(--color-fg-dim)]">—</span>
        <span
          v-else
          class="font-mono text-[var(--color-accent-blue)]"
          :style="{ opacity: 0.45, fontSize: size === 'lg' ? '5rem' : size === 'sm' ? '1.5rem' : '2rem' }"
        >?</span>
      </div>
      <div
        class="flip-face flip-back rounded-2xl font-mono"
        :class="[
          transparentBack
            ? 'border border-[rgba(148,163,184,0.16)] bg-transparent shadow-none'
            : 'glass card-glow',
          selected ? 'card-glow-active' : '',
        ]"
      >
        <span class="neon-text" :class="value === '☕' ? 'scale-110' : ''">{{ value ?? '—' }}</span>
      </div>
    </div>
  </div>
</template>
