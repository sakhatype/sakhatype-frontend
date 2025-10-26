/// <reference types="vite/client" />

// Декларация для импорта .vue файлов
declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  // Типизация, которую вы импортируете
  const component: DefineComponent<{}, {}, any>
  export default component
}
