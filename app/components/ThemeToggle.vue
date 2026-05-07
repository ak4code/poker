<script setup lang="ts">
import { Moon, Sun } from 'lucide-vue-next'

const { theme, toggle } = useTheme()
</script>

<template>
  <button
    type="button"
    class="action-button focus-ring inline-flex h-9 w-9 items-center justify-center rounded-lg hover:brightness-125"
    style="background: var(--color-surface-strong); backdrop-filter: blur(12px); border: 1px solid var(--color-border-strong); color: var(--color-fg);"
    :aria-label="theme === 'dark' ? 'Включить светлую тему' : 'Включить тёмную тему'"
    :title="theme === 'dark' ? 'Светлая тема' : 'Тёмная тема'"
    @click="toggle"
  >
    <Sun v-if="theme === 'dark'" :size="16" />
    <Moon v-else :size="16" />
  </button>
</template>