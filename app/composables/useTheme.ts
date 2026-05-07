const THEME_KEY = 'poker.theme'

export type Theme = 'light' | 'dark'

const theme = ref<Theme>('dark')
let initialized = false

function apply(t: Theme) {
  if (typeof document === 'undefined') return
  document.documentElement.classList.toggle('dark', t === 'dark')
}

export function useTheme() {
  if (import.meta.client && !initialized) {
    initialized = true
    const stored = localStorage.getItem(THEME_KEY) as Theme | null
    if (stored === 'light' || stored === 'dark') {
      theme.value = stored
    } else if (window.matchMedia('(prefers-color-scheme: light)').matches) {
      theme.value = 'light'
    }
    apply(theme.value)
  }

  function toggle() {
    theme.value = theme.value === 'dark' ? 'light' : 'dark'
    if (import.meta.client) {
      localStorage.setItem(THEME_KEY, theme.value)
      apply(theme.value)
    }
  }

  return { theme, toggle }
}