<template>
  <footer class="px-8 py-5 flex items-center justify-between">
    <Button class="select-none cursor-pointer" variant="outline">
      <MessageCircleQuestionMark :size="14" /><span>Якутский ввод</span>
    </Button>

    <div class="flex items-center gap-2">
      <!-- Кнопка звука с переключением -->
      <Button
        class="select-none cursor-pointer flex items-center gap-1"
        variant="outline"
        @click="toggleSound"
      >
        <component :is="soundEnabled ? Volume2 : VolumeX" :size="14" />
        <span>{{ soundEnabled ? 'Вкл' : 'Выкл' }}</span>
      </Button>

      <DropdownMenu>
        <DropdownMenuTrigger as-child>
          <Button class="select-none cursor-pointer" variant="outline">
            <Palette />
            <span>{{ isDark ? 'Темная тема' : 'Светлая тема' }}</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent class="w-56">
          <DropdownMenuItem
            @click="toggleDark()"
            :disabled="!isDark"
            class="select-none cursor-pointer"
          >
            <span>Светлая тема</span>
          </DropdownMenuItem>
          <DropdownMenuItem
            @click="toggleDark()"
            :disabled="isDark"
            class="select-none cursor-pointer"
          >
            <span>Тёмная тема</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  </footer>
</template>

<script setup lang="ts">
import { useTheme } from '@/composables/useTheme'
import { useSound } from '@/shared/composables/useSound'
import { MessageCircleQuestionMark, Volume2, VolumeX, Palette } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

const { isDark, toggleDark } = useTheme()
const { soundEnabled, toggleSound } = useSound()
</script>
