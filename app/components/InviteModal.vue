<script setup lang="ts">
import QRCode from 'qrcode'
import { Check, Copy, X } from 'lucide-vue-next'

const props = defineProps<{ url: string }>()
const emit = defineEmits<{ close: [] }>()

const { theme } = useTheme()

const svgMarkup = ref('')
const copied = ref(false)
const generating = ref(true)
const copyFailed = ref(false)
let copiedTimer: ReturnType<typeof setTimeout> | null = null

function onKey(e: KeyboardEvent) {
  if (e.key === 'Escape') emit('close')
}

watch(
  [() => props.url, theme],
  async ([url, t]) => {
    if (!url) return
    generating.value = true
    try {
      svgMarkup.value = await QRCode.toString(url, {
        type: 'svg',
        margin: 1,
        errorCorrectionLevel: 'M',
        color: { dark: t === 'dark' ? '#e2e8f0' : '#0f172a', light: '#0000' },
      })
    } finally {
      generating.value = false
    }
  },
  { immediate: true },
)

async function copyLink() {
  if (!props.url) return

  copyFailed.value = false
  const ok = await copyToClipboard(props.url)
  copied.value = ok

  if (!ok) {
    copyFailed.value = true
    return
  }

  if (copiedTimer) clearTimeout(copiedTimer)
  copiedTimer = setTimeout(() => {
    copied.value = false
    copyFailed.value = false
  }, 1800)
}

async function copyToClipboard(value: string) {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(value)
      return true
    }
  } catch {
  }

  return copyWithTextarea(value)
}

function copyWithTextarea(value: string) {
  const textarea = document.createElement('textarea')
  textarea.value = value
  textarea.setAttribute('readonly', '')
  textarea.style.position = 'fixed'
  textarea.style.top = '-1000px'
  textarea.style.left = '-1000px'
  document.body.appendChild(textarea)
  textarea.select()
  textarea.setSelectionRange(0, textarea.value.length)

  try {
    return document.execCommand('copy')
  } finally {
    document.body.removeChild(textarea)
  }
}

function onBackdrop(e: MouseEvent) {
  if (e.target === e.currentTarget) emit('close')
}

onMounted(() => {
  window.addEventListener('keydown', onKey)
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKey)
  if (copiedTimer) clearTimeout(copiedTimer)
})
</script>

<template>
  <div
    class="motion-enter fixed inset-0 z-50 flex items-center justify-center p-4"
    style="background: rgba(15, 23, 42, 0.55); backdrop-filter: blur(20px);"
    @click="onBackdrop"
  >
    <div
      class="glass-strong motion-enter relative w-full max-w-sm rounded-2xl p-6"
      style="box-shadow: 0 0 40px rgba(96, 165, 250, 0.25);"
    >
      <button
        class="action-button focus-ring absolute top-3 right-3 grid h-8 w-8 place-items-center rounded-full text-[var(--color-fg-muted)] hover:text-[var(--color-fg)]"
        style="background: var(--color-surface-strong); border: 1px solid var(--color-border-strong);"
        aria-label="Закрыть"
        @click="emit('close')"
      >
        <X :size="16" />
      </button>

      <h3 class="brand-gradient mb-1 font-mono text-lg">Пригласить в комнату</h3>
      <p class="mb-5 font-mono text-xs text-[var(--color-fg-muted)]">
        Отсканируйте QR-код или поделитесь ссылкой.
      </p>

      <div class="relative mx-auto mb-5 aspect-square w-full max-w-[18rem]">
        <div
          class="absolute inset-0 rounded-2xl glow-pulse"
          style="background: linear-gradient(135deg, rgba(96, 165, 250, 0.25) 0%, rgba(167, 139, 250, 0.25) 100%);"
        />
        <div
          class="relative flex h-full w-full items-center justify-center rounded-2xl p-4"
          style="
            background: var(--color-surface-strong);
            backdrop-filter: blur(12px);
            border: 1px solid var(--color-border-strong);
          "
        >
          <div
            v-if="svgMarkup"
            class="h-full w-full [&>svg]:h-full [&>svg]:w-full"
            v-html="svgMarkup"
          />
          <div
            v-else-if="generating"
            class="font-mono text-xs text-[var(--color-fg-muted)]"
          >
            Генерируем…
          </div>
        </div>
        <span class="pointer-events-none absolute top-3 left-3 h-4 w-4 border-t-2 border-l-2 border-[var(--color-accent-blue)] opacity-70" />
        <span class="pointer-events-none absolute top-3 right-3 h-4 w-4 border-t-2 border-r-2 border-[var(--color-accent-purple)] opacity-70" />
        <span class="pointer-events-none absolute bottom-3 left-3 h-4 w-4 border-b-2 border-l-2 border-[var(--color-accent-purple)] opacity-70" />
        <span class="pointer-events-none absolute bottom-3 right-3 h-4 w-4 border-b-2 border-r-2 border-[var(--color-accent-blue)] opacity-70" />
      </div>

      <div
        class="mb-3 flex items-center gap-2 rounded-lg px-3 py-2 font-mono text-xs"
        style="background: var(--color-surface); border: 1px solid var(--color-border-strong); color: var(--color-fg-muted);"
      >
        <span class="truncate">{{ url }}</span>
      </div>

      <button
        class="action-button focus-ring inline-flex w-full items-center justify-center gap-2 rounded-lg py-3 font-mono text-sm hover:brightness-110"
        style="
          background: linear-gradient(135deg, #60a5fa 0%, #a78bfa 100%);
          color: #ffffff;
          box-shadow: 0 0 20px rgba(96, 165, 250, 0.4);
        "
        @click="copyLink"
      >
        <Check v-if="copied" :size="16" />
        <Copy v-else :size="16" />
        {{ copied ? 'Скопировано' : copyFailed ? 'Не удалось скопировать' : 'Скопировать ссылку' }}
      </button>
    </div>
  </div>
</template>
