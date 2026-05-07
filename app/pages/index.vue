<script setup lang="ts">
import { Spade } from 'lucide-vue-next'

const name = useStoredName()
const submitting = ref(false)
const error = ref('')
const hostCanVote = ref(false)

onMounted(() => {
  const target = getActiveHostRoom() ?? getLastRoom()
  if (target && getRoomCredentials(target)) {
    navigateTo(`/room/${target}`)
  }
})

async function createRoom() {
  const trimmed = name.value.trim()
  if (!trimmed) {
    error.value = 'Введите имя'
    return
  }
  submitting.value = true
  error.value = ''
  try {
    const res = await $fetch<{ roomId: string; userId: string; userToken: string }>('/api/rooms', {
      method: 'POST',
      body: { name: trimmed, hostCanVote: hostCanVote.value },
    })
    saveRoomCredentials(res.roomId, { userId: res.userId, userToken: res.userToken })
    setActiveHostRoom(res.roomId)
    await navigateTo(`/room/${res.roomId}`)
  } catch (e: any) {
    error.value = e?.statusMessage || 'Не удалось создать комнату'
  } finally {
    submitting.value = false
  }
}

const previewCards = ['1', '2', '3', '5', '8', '13', '21', '?', '☕']
</script>

<template>
  <main class="relative z-10 mx-auto flex min-h-screen max-w-4xl flex-col items-center px-4 py-10 sm:py-16">
    <header class="motion-enter relative mb-10 text-center sm:mb-14">
      <div class="absolute right-0 top-0">
        <ThemeToggle />
      </div>
      <div class="mb-4 flex items-center justify-center gap-3">
        <div
          class="interactive-surface grid h-12 w-12 place-items-center rounded-xl border border-[var(--color-border-strong)]"
          style="background: var(--color-surface-strong); backdrop-filter: blur(12px);"
        >
          <Spade :size="22" class="text-[var(--color-accent-blue)] neon-text" />
        </div>
      </div>
      <h1 class="brand-gradient mb-2 text-4xl font-bold sm:text-5xl">Scrum Poker</h1>
      <p class="font-mono text-sm text-[var(--color-fg-muted)]">
        Покер для планирования
      </p>
    </header>

    <section
      class="glass-strong interactive-surface motion-enter w-full max-w-md rounded-2xl p-6 sm:p-8"
      style="box-shadow: 0 0 40px rgba(96, 165, 250, 0.15);"
    >
      <h2 class="font-mono text-lg text-[var(--color-fg)]">Создать комнату</h2>
      <p class="mt-1 font-mono text-xs text-[var(--color-fg-muted)]">
        Поделитесь ссылкой с командой и оценивайте задачи в реальном времени.
      </p>

      <form class="mt-6 space-y-4" @submit.prevent="createRoom">
        <label class="block">
          <span class="mb-1.5 block font-mono text-[11px] uppercase tracking-wider text-[var(--color-fg-muted)]">
            Ваше имя
          </span>
          <input
            v-model="name"
            placeholder="например, Алекс"
            maxlength="40"
            class="focus-ring w-full rounded-lg px-4 py-3 font-mono text-base text-[var(--color-fg)] placeholder-[var(--color-fg-dim)] outline-none transition duration-200 focus:-translate-y-0.5"
            style="background: var(--color-surface-strong); border: 1px solid var(--color-border-strong);"
          />
        </label>

        <label
          class="flex cursor-pointer items-center justify-between gap-3 rounded-lg px-3 py-3 transition duration-200 hover:brightness-125"
          style="background: var(--color-surface); border: 1px solid var(--color-border-strong);"
        >
          <span class="font-mono text-xs text-[var(--color-fg-muted)]">
            Ведущий голосует
          </span>
          <input
            v-model="hostCanVote"
            type="checkbox"
            class="h-4 w-4 accent-[var(--color-accent-blue)]"
          />
        </label>

        <p v-if="error" class="font-mono text-xs text-[var(--color-danger)]">{{ error }}</p>
        <button
          type="submit"
          :disabled="submitting"
          class="action-button focus-ring w-full rounded-lg py-3 font-mono text-sm hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
          style="
            background: linear-gradient(135deg, #60a5fa 0%, #a78bfa 100%);
            color: #ffffff;
            box-shadow: 0 0 20px rgba(96, 165, 250, 0.4);
          "
        >
          {{ submitting ? 'Создаём…' : 'Создать комнату' }}
        </button>
      </form>

      <p class="mt-6 border-t border-[var(--color-border)] pt-5 font-mono text-xs text-[var(--color-fg-muted)]">
        Уже есть комната? Откройте ссылку-приглашение.
      </p>
    </section>

    <div class="mt-12 grid w-full max-w-2xl grid-cols-3 gap-3 sm:grid-cols-9 sm:gap-2">
      <div
        v-for="(card, i) in previewCards"
        :key="card"
        class="glass card-glow interactive-surface stagger-enter flex aspect-[2/3] items-center justify-center rounded-xl font-mono text-xl text-[var(--color-fg-muted)]"
        :style="{ animationDelay: `${i * 80}ms` }"
      >
        {{ card }}
      </div>
    </div>
  </main>
</template>
