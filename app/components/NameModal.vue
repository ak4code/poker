<script setup lang="ts">
const props = defineProps<{ initial?: string; title?: string; cta?: string }>()
const emit = defineEmits<{ submit: [name: string]; cancel: [] }>()

const name = ref(props.initial ?? '')
const error = ref('')

function submit() {
  const trimmed = name.value.trim()
  if (!trimmed) {
    error.value = 'Введите имя'
    return
  }
  if (trimmed.length > 40) {
    error.value = 'Максимум 40 символов'
    return
  }
  emit('submit', trimmed)
}
</script>

<template>
  <div
    class="motion-enter fixed inset-0 z-50 flex items-center justify-center px-4"
    style="background: rgba(15, 23, 42, 0.95); backdrop-filter: blur(20px);"
  >
    <div
      class="glass-strong motion-enter w-full max-w-md rounded-2xl p-6"
      style="box-shadow: 0 0 40px rgba(96, 165, 250, 0.2);"
    >
      <h3 class="brand-gradient mb-1 font-mono text-xl">{{ title ?? 'Введите ваше имя' }}</h3>
      <p class="mb-5 font-mono text-xs text-[var(--color-fg-muted)]">
        Будет видно остальным участникам комнаты.
      </p>
      <form @submit.prevent="submit">
        <input
          v-model="name"
          autofocus
          maxlength="40"
          placeholder="Имя участника"
          class="focus-ring w-full rounded-lg px-4 py-3 font-mono text-base text-[var(--color-fg)] placeholder-[var(--color-fg-dim)] outline-none transition duration-200 focus:-translate-y-0.5"
          style="
            background: rgba(15, 23, 42, 0.6);
            border: 1px solid rgba(148, 163, 184, 0.2);
          "
        />
        <p v-if="error" class="mt-2 font-mono text-xs text-[var(--color-danger)]">{{ error }}</p>
        <button
          type="submit"
          class="action-button focus-ring mt-5 w-full rounded-lg py-3 font-mono text-sm hover:brightness-110"
          :style="{
            background: name.trim()
              ? 'linear-gradient(135deg, #60a5fa 0%, #a78bfa 100%)'
              : 'rgba(30, 41, 59, 0.6)',
            color: name.trim() ? '#ffffff' : '#64748b',
            boxShadow: name.trim() ? '0 0 20px rgba(96, 165, 250, 0.4)' : 'none',
            border: '1px solid rgba(148, 163, 184, 0.2)',
            cursor: name.trim() ? 'pointer' : 'not-allowed',
          }"
        >
          {{ cta ?? 'Продолжить' }}
        </button>
      </form>
    </div>
  </div>
</template>
