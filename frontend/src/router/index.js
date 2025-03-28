import { createRouter, createWebHistory } from 'vue-router'
import HomePage from '@/components/HomePage.vue'

const routes = [
  {
    path: '/',
    name: 'home',
    component: HomePage
  },
  // ... routes อื่นๆ ยกเว้น SuperAdminActivities
]

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes
})

export default router 