<!-- <script setup lang="ts"></script>

<template>
  <RouterView />
</template>

<style scoped></style> -->
<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { RouterView } from 'vue-router'
import { Monitor } from 'lucide-vue-next'

const isMobile = ref(false)

onMounted(() => {
  const userAgent = navigator.userAgent || navigator.vendor
  const mobileRegex = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i
  isMobile.value = mobileRegex.test(userAgent) || window.innerWidth <= 768
})
</script>

<template>
  <div v-if="isMobile" class="mobile-message">
    <div class="simple-message">
      <Monitor :size="80" color="#111111" class="icon" />
      <h1>Пожалуйста, используйте Desktop версию сайта</h1>
      <p>Этот сайт оптимизирован для просмотра на компьютерах</p>
    </div>
  </div>
  
  <RouterView v-else />
</template>

<style scoped>
.mobile-message {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100vh;
  background: white;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 20px;
  z-index: 9999;
}

.simple-message {
  animation: fadeIn 0.5s ease;
  text-align: center;
  display: flex;
  flex-wrap: wrap;
  max-width: 400px;
  justify-content: space-around;
}

.icon {
  margin-bottom: 24px;
  animation: float 3s ease-in-out infinite;
}

h1 {
  font-size: 24px;
  color: #363636;
  margin-bottom: 12px;
  font-weight: 600;
}

p {
  font-size: 16px;
  color: #6B7280;
  line-height: 1.5;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: scale(0.9);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

@keyframes float {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-10px);
  }
}
</style>
<!-- Стили остаются такими же -->