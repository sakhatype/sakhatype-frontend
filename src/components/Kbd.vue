<template>
  <div :class="['flex flex-col items-center gap-4', isDark ? 'opacity-40' : 'opacity-100']">
    <div class="mt-24 flex flex-col items-center gap-3">
      <KbdGroup>
        <Kbd>⇆ Tab</Kbd>
        <span class="text-muted-foreground pointer-events-none font-sans text-xs font-medium select-none">-</span>
        <span class="text-muted-foreground pointer-events-none font-sans text-xs font-medium select-none">Перезапустить тест</span>
      </KbdGroup>
      <div class="flex gap-6">
        <KbdGroup v-for="{ key, letter } in bindingsArray" :key="key">
          <Kbd>{{ key }}</Kbd>
          <span class="text-muted-foreground pointer-events-none font-sans text-xs font-medium select-none">-</span>
          <span class="text-muted-foreground pointer-events-none font-sans text-xs font-medium select-none">{{ letter }}</span>
        </KbdGroup>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Kbd, KbdGroup } from '@/components/ui/kbd'
import { useTheme } from '@/composables/useTheme'
import { useYakutKeyBindings } from '@/composables/useYakutKeyBindings'

const { isDark } = useTheme()
const { bindingsArray } = useYakutKeyBindings()
</script>