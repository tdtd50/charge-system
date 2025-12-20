import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    redirect: '/login'
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('../views/Login.vue')
  },
  {
    path: '/admin',
    name: 'Admin',
    component: () => import('../views/Admin.vue'),
    redirect: '/admin/charge',
    children: [
      {
        path: 'charge',
        name: 'Charge',
        component: () => import('../views/Charge.vue')
      },
      {
        path: 'user',
        name: 'User',
        component: () => import('../views/UserManagement.vue')
      },
      {
        path: 'risk',
        name: 'Risk',
        component: () => import('../views/Risk.vue')
      }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// 路由守卫
router.beforeEach((to, from, next) => {
  const isLoggedIn = localStorage.getItem('adminInfo')

  if (to.path !== '/login' && !isLoggedIn) {
    next('/login')
  } else if (to.path === '/login' && isLoggedIn) {
    next('/admin')
  } else {
    next()
  }
})

export default router
