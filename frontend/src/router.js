import Vue from 'vue'
import Router from 'vue-router'
import Home from './components/Home.vue'
import VueHead from "vue-head";

Vue.use(VueHead);
Vue.use(Router);

export default new Router({
  mode: 'history',
  base: process.env.BASE_URL,
  routes: [
    {
      path: '/',
      name: 'home',
      component: Home
    },
    {
      path: '/login/',
      name: 'login',
      component: () => import('./components/Login.vue')
    },
    {
      path: '/logout/',
      name: 'logout',
      component: () => import('./components/Logout.vue')
    },
    {
      path: '/dashboard/',
      name: 'dashboard',
      component: () => import('./components/Dashboard.vue')
    },
    {
      path: '/dashboard/new/',
      name: 'newserver',
      component: () => import('./components/NewServer.vue')
    },
    {
      path: '/dashboard/edit/:sid',
      name: 'editserver',
      component: () => import('./components/EditServer.vue')
    }
  ]
})
