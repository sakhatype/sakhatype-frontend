import { ref, onMounted, onBeforeUnmount } from 'vue'

export function useMobileDetect() {
  const isMobile = ref(false)
  
  const checkMobile = () => {
    const userAgent = navigator.userAgent || navigator.vendor
    const mobileRegex = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i
    
    // Проверяем user agent и ширину экрана
    isMobile.value = mobileRegex.test(userAgent) || window.innerWidth <= 768
  }
  
  onMounted(() => {
    checkMobile()
    window.addEventListener('resize', checkMobile)
  })
  
  onBeforeUnmount(() => {
    window.removeEventListener('resize', checkMobile)
  })
  
  return { isMobile, checkMobile }
}