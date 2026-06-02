import { createRouter, createWebHistory } from 'vue-router'
import { watch } from 'vue'
import { useAuthStore } from '@/auth/store'

export const router = createRouter({
  history: createWebHistory(),
  scrollBehavior: () => ({ top: 0 }),
  routes: [
    {
      path: '/',
      component: () => import('@/app-shell/AppLayout.vue'),
      children: [
        {
          path: '',
          name: 'home',
          component: () => import('@/characters/pages/CharacterListPage.vue'),
        },
        // Characters
        {
          path: 'characters/new',
          name: 'character-new',
          component: () => import('@/character-builder/pages/CharacterBuilderPage.vue'),
        },
        {
          path: 'characters/:id',
          name: 'character-sheet',
          component: () => import('@/characters/pages/CharacterSheetPage.vue'),
          props: true,
        },
        // Reference browsing
        {
          path: 'spells',
          name: 'spells',
          component: () => import('@/spells/pages/SpellBrowserPage.vue'),
        },
        {
          path: 'items',
          name: 'items',
          component: () => import('@/items/pages/ItemBrowserPage.vue'),
        },
        // Campaigns (auth required)
        {
          path: 'campaigns',
          name: 'campaigns',
          component: () => import('@/campaigns/pages/CampaignListPage.vue'),
          meta: { requiresAuth: true },
        },
        {
          path: 'campaigns/new',
          name: 'campaign-new',
          component: () => import('@/campaigns/pages/CampaignFormPage.vue'),
          meta: { requiresAuth: true },
        },
        {
          path: 'campaigns/:id',
          name: 'campaign-detail',
          component: () => import('@/campaigns/pages/CampaignDetailPage.vue'),
          props: true,
          meta: { requiresAuth: true },
        },
        // Auth
        {
          path: 'login',
          name: 'login',
          component: () => import('@/auth/pages/LoginPage.vue'),
        },
        {
          path: 'profile',
          name: 'profile',
          component: () => import('@/auth/pages/ProfilePage.vue'),
          meta: { requiresAuth: true },
        },
      ],
    },
    {
      path: '/:pathMatch(.*)*',
      name: 'not-found',
      component: () => import('@/app-shell/pages/NotFoundPage.vue'),
    },
  ],
})

router.beforeEach(async (to) => {
  if (to.meta.requiresAuth) {
    const auth = useAuthStore()
    if (auth.loading) {
      await new Promise<void>(resolve => {
        const stop = watch(() => auth.loading, (loading) => {
          if (!loading) { stop(); resolve() }
        })
      })
    }
    if (!auth.isAuthenticated) {
      return { name: 'login', query: { redirect: to.fullPath } }
    }
  }
})
