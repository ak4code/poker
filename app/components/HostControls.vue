<script setup lang="ts">
import { Eye, RefreshCw, Trash2 } from 'lucide-vue-next'
import { useRoomStore } from '~/stores/room'

const emit = defineEmits<{ reveal: []; reset: [] }>()
const store = useRoomStore()
const isRevealed = computed(() => store.room?.status === 'revealed')
const anyVoted = computed(() => !!store.room?.users.some((u) => u.canVote && u.hasVoted))
</script>

<template>
  <div class="flex w-full flex-wrap gap-2 sm:w-auto">
    <button
      v-if="!isRevealed"
      class="action-button focus-ring inline-flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2.5 font-mono text-sm disabled:cursor-not-allowed disabled:opacity-50 sm:flex-none sm:py-2"
      :disabled="!anyVoted"
      style="
        background: rgba(96, 165, 250, 0.18);
        backdrop-filter: blur(12px);
        border: 1px solid rgba(148, 163, 184, 0.2);
        color: #60a5fa;
      "
      @click="emit('reveal')"
    >
      <Eye :size="16" />
      Показать
    </button>
    <button
      v-else
      class="action-button focus-ring inline-flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2.5 font-mono text-sm sm:flex-none sm:py-2"
      style="
        background: linear-gradient(135deg, #60a5fa 0%, #a78bfa 100%);
        color: #ffffff;
        box-shadow: 0 0 20px rgba(96, 165, 250, 0.4);
      "
      @click="emit('reset')"
    >
      <RefreshCw :size="16" />
      Новый раунд
    </button>
    <button
      v-if="!isRevealed && anyVoted"
      class="action-button focus-ring inline-flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2.5 font-mono text-sm sm:flex-none sm:py-2"
      style="
        background: rgba(239, 68, 68, 0.16);
        backdrop-filter: blur(12px);
        border: 1px solid rgba(239, 68, 68, 0.3);
        color: #ef4444;
      "
      @click="emit('reset')"
    >
      <Trash2 :size="16" />
      Очистить
    </button>
  </div>
</template>
