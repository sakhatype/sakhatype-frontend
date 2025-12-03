<template>
  <div :class="['flex flex-col items-center gap-4', isDark ? 'opacity-40' : 'opacity-100']">
    <!-- <KbdGroup>
      <Kbd>⌘</Kbd>
      <Kbd>⇧</Kbd>
      <Kbd>⌥</Kbd>
      <Kbd>⌃</Kbd>
    </KbdGroup>
    <KbdGroup>
      <Kbd>Ctrl</Kbd>
      <span>+</span>
      <Kbd>B</Kbd>
    </KbdGroup> -->
    <div class="mt-24 flex flex-col items-center gap-3">
      <KbdGroup>
        <Kbd>⇆ Tab</Kbd>
        <span class="text-muted-foreground pointer-events-none font-sans text-xs font-medium select-none">-</span>
        <span class="text-muted-foreground pointer-events-none font-sans text-xs font-medium select-none">Перезапустить тест</span>
      </KbdGroup>
      <div class="flex gap-6">
        <KbdGroup>
          <Kbd>4</Kbd>
          <span class="text-muted-foreground pointer-events-none font-sans text-xs font-medium select-none">-</span>
          <span class="text-muted-foreground pointer-events-none font-sans text-xs font-medium select-none">ҥ</span>
        </KbdGroup>
        <KbdGroup>
          <Kbd>5</Kbd>
          <span class="text-muted-foreground pointer-events-none font-sans text-xs font-medium select-none">-</span>
          <span class="text-muted-foreground pointer-events-none font-sans text-xs font-medium select-none">ҕ</span>
        </KbdGroup>
        <KbdGroup>
          <Kbd>6</Kbd>
          <span class="text-muted-foreground pointer-events-none font-sans text-xs font-medium select-none">-</span>
          <span class="text-muted-foreground pointer-events-none font-sans text-xs font-medium select-none">ө</span>
        </KbdGroup>
        <KbdGroup>
          <Kbd>7</Kbd>
          <span class="text-muted-foreground pointer-events-none font-sans text-xs font-medium select-none">-</span>
          <span class="text-muted-foreground pointer-events-none font-sans text-xs font-medium select-none">һ</span>
        </KbdGroup>
        <KbdGroup>
          <Kbd>8</Kbd>
          <span class="text-muted-foreground pointer-events-none font-sans text-xs font-medium select-none">-</span>
          <span class="text-muted-foreground pointer-events-none font-sans text-xs font-medium select-none">ү</span>
        </KbdGroup>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Kbd, KbdGroup } from '@/components/ui/kbd'
import { useTheme } from '@/composables/useTheme'

const { isDark } = useTheme()
</script>