<template>
  <footer class="py-3 sm:py-5 flex flex-wrap items-center justify-between gap-2">
    <Button 
      class="select-none cursor-pointer text-xs sm:text-sm" 
      variant="outline"
      @click="isModalOpen = true"
    >
      <Settings :size="14" /><span>Якутский ввод</span>
    </Button>

    <div class="flex items-center gap-1 sm:gap-2">
      <!-- Кнопка звука -->
      <Button
        class="select-none cursor-pointer flex items-center gap-1 text-xs sm:text-sm px-2 sm:px-3"
        variant="outline"
        @click="toggleSound"
      >
        <component :is="soundEnabled ? Volume2 : VolumeX" :size="14" />
        <span class="hidden sm:inline">{{ soundEnabled ? 'Вкл' : 'Выкл' }}</span>
      </Button>

      <DropdownMenu>
        <DropdownMenuTrigger as-child>
          <Button class="select-none cursor-pointer text-xs sm:text-sm px-2 sm:px-3" variant="outline">
            <Palette />
            <span class="hidden sm:inline">{{ isDark ? 'Темная' : 'Светлая' }}</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent class="w-40 sm:w-56">
          <DropdownMenuItem
            @click="!isDark || toggleDark()"
            :disabled="!isDark"
            class="select-none cursor-pointer"
          >
            <span>Светлая тема</span>
          </DropdownMenuItem>
          <DropdownMenuItem
            @click="isDark || toggleDark()"
            :disabled="isDark"
            class="select-none cursor-pointer"
          >
            <span>Тёмная тема</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>

    <!-- Модалка настроек якутского ввода -->
    <Dialog v-model:open="isModalOpen">
      <DialogContent class="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Якутский ввод</DialogTitle>
          <DialogDescription>
          Изменения сохраняются автоматически.
          </DialogDescription>
        </DialogHeader>
        
        <KeyBindingsSettings />

        <DialogFooter class="sm:justify-start">
          <DialogClose as-child>
            <Button variant="secondary">
              Закрыть
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </footer>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useTheme } from '@/composables/useTheme'
import { useSound } from '@/shared/composables/useSound'
import { Settings, Volume2, VolumeX, Palette } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from '@/components/ui/dialog'
import KeyBindingsSettings from '@/components/KeyBindingsSettings.vue'

const { isDark, toggleDark } = useTheme()
const { soundEnabled, toggleSound } = useSound()

const isModalOpen = ref(false)
</script>
