// router/index.ts
import { createRouter, createWebHistory } from 'vue-router'

// Импорт компонентов
import MainLayout from '@/layouts/Main.vue'
import HomePage from '@/views/HomePage.vue'
import Leaderboard from '@/views/Leaderboard.vue'
import Profile from '@/views/Profile.vue'

// Роуты с возможностью динамических параметров
const routes = [
  {
    path: '/',
    component: MainLayout,
    children: [
      {
        path: '', // Главная страница
        name: 'Home',
        component: HomePage,
      },
      {
        path: 'leaderboard/:filter?', // Динамический параметр filter (необязательный)
        name: 'Leaderboard',
        component: Leaderboard,
      },
      {
        path: 'profile', // Динамический параметр filter (необязательный)
        name: 'Profile',
        component: Profile,
      },
    ],
  },
]

// Создаем роутер
const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
})

export default router
