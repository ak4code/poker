<script setup lang="ts">
useHead({
  script: [
    {
      innerHTML:
        "(function(){try{var t=localStorage.getItem('poker.theme');var prefersLight=window.matchMedia&&window.matchMedia('(prefers-color-scheme: light)').matches;var dark=t==='dark'||(!t&&!prefersLight);if(dark)document.documentElement.classList.add('dark')}catch(e){}})()",
      tagPosition: 'head',
    },
  ],
})
</script>

<template>
  <div class="min-h-screen">
    <NuxtRouteAnnouncer />
    <NuxtPage />
  </div>
</template>