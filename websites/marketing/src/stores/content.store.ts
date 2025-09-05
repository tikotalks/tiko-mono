import { ref, computed, shallowRef } from 'vue'
import { defineStore } from 'pinia'
import { useContent } from '@tiko/core'
import type { NavigationMenu, NavigationItem, ContentProject, ContentPage } from '@tiko/core'

interface PageCacheEntry {
  page: any // Full page with sections
  timestamp: number
  ttl: number // Time to live in milliseconds
}

interface NavigationState {
  headerMenu: NavigationMenu | null
  footerMenu: NavigationMenu | null
  mobileMenu: NavigationMenu | null
  allMenus: NavigationMenu[]
}

export const useContentStore = defineStore('content', () => {
  // Initialize content service with worker
  const content = useContent({
    projectSlug: 'marketing',
    useWorker: import.meta.env.VITE_USE_CONTENT_WORKER === 'true',
    workerUrl: import.meta.env.VITE_CONTENT_API_URL,
    deployedVersionId: import.meta.env.VITE_DEPLOYED_VERSION_ID,
    noCache: false
  })

  // State
  const currentProject = ref<ContentProject | null>(null)
  const navigation = ref<NavigationState>({
    headerMenu: null,
    footerMenu: null,
    mobileMenu: null,
    allMenus: []
  })
  const pageCache = shallowRef<Map<string, PageCacheEntry>>(new Map())
  const preloadQueue = ref<Set<string>>(new Set())
  const loading = ref({
    navigation: false,
    project: false,
    pages: new Map<string, boolean>()
  })
  const errors = ref<Map<string, Error>>(new Map())

  // Cache TTL (5 minutes default)
  const DEFAULT_CACHE_TTL = 5 * 60 * 1000

  // Initialize project
  async function initializeProject() {
    if (currentProject.value || loading.value.project) return
    
    loading.value.project = true
    try {
      const project = await content.getProject('marketing')
      if (project) {
        currentProject.value = project
        console.log('[ContentStore] Marketing project initialized:', project.id)
        
        // Load navigation immediately after project init
        await loadAllNavigation()
      } else {
        console.error('[ContentStore] Marketing project not found')
        throw new Error('Marketing project not found')
      }
    } catch (error) {
      console.error('[ContentStore] Failed to initialize project:', error)
      errors.value.set('project', error as Error)
      throw error
    } finally {
      loading.value.project = false
    }
  }

  // Load all navigation menus
  async function loadAllNavigation() {
    if (!currentProject.value) {
      await initializeProject()
    }
    
    loading.value.navigation = true
    try {
      console.log('[ContentStore] Loading all navigation menus...')
      
      // Load all menus in parallel
      const [headerMenu, footerMenu, mobileMenu] = await Promise.all([
        content.getNavigationMenuBySlug('main-header-menu', currentProject.value?.id),
        content.getNavigationMenuBySlug('main-footer-menu', currentProject.value?.id),
        content.getNavigationMenuBySlug('main-mobile-menu', currentProject.value?.id)
      ])

      // Store menus
      navigation.value = {
        headerMenu,
        footerMenu,
        mobileMenu,
        allMenus: [headerMenu, footerMenu, mobileMenu].filter(Boolean)
      }

      console.log('[ContentStore] Navigation loaded:', {
        header: !!headerMenu,
        footer: !!footerMenu,
        mobile: !!mobileMenu
      })

      // Extract all pages from navigation for preloading
      const pagesToPreload = new Set<string>()
      navigation.value.allMenus.forEach(menu => {
        if (menu?.items) {
          extractPagesFromNavItems(menu.items, pagesToPreload)
        }
      })

      // Add to preload queue
      pagesToPreload.forEach(pageId => preloadQueue.value.add(pageId))
      
      // Start preloading in background
      setTimeout(() => processPreloadQueue(), 1000)

      return navigation.value
    } catch (error) {
      console.error('[ContentStore] Failed to load navigation:', error)
      errors.value.set('navigation', error as Error)
      throw error
    } finally {
      loading.value.navigation = false
    }
  }

  // Extract page IDs from navigation items recursively
  function extractPagesFromNavItems(items: NavigationItem[], pageSet: Set<string>) {
    items.forEach(item => {
      if (item.type === 'page' && item.page_id) {
        pageSet.add(item.page_id)
      }
      if (item.items?.length) {
        extractPagesFromNavItems(item.items, pageSet)
      }
    })
  }

  // Get a specific navigation menu (with caching)
  async function getNavigationMenu(slug: string): Promise<NavigationMenu | null> {
    // Check if already loaded
    switch (slug) {
      case 'main-header-menu':
        return navigation.value.headerMenu
      case 'main-footer-menu':
        return navigation.value.footerMenu
      case 'main-mobile-menu':
        return navigation.value.mobileMenu
    }

    // Otherwise load it
    if (!currentProject.value) {
      await initializeProject()
    }
    
    try {
      const menu = await content.getNavigationMenuBySlug(slug, currentProject.value?.id)
      console.log(`[ContentStore] Loaded menu "${slug}":`, menu)
      return menu
    } catch (error) {
      console.error(`[ContentStore] Failed to load menu "${slug}":`, error)
      return null
    }
  }

  // Get page with caching
  async function getPage(pageIdOrSlug: string, language?: string, forceRefresh = false): Promise<any> {
    const cacheKey = `${pageIdOrSlug}-${language || 'en'}`
    
    // Check cache first
    if (!forceRefresh) {
      const cached = pageCache.value.get(cacheKey)
      if (cached && Date.now() - cached.timestamp < cached.ttl) {
        console.log(`[ContentStore] Returning cached page: ${cacheKey}`)
        return cached.page
      }
    }

    // Mark as loading
    loading.value.pages.set(cacheKey, true)
    
    try {
      console.log(`[ContentStore] Loading page: ${cacheKey}`)
      const page = await content.getPage(pageIdOrSlug, language)
      
      if (page) {
        // Update cache
        const newCache = new Map(pageCache.value)
        newCache.set(cacheKey, {
          page,
          timestamp: Date.now(),
          ttl: DEFAULT_CACHE_TTL
        })
        pageCache.value = newCache
        
        console.log(`[ContentStore] Page cached: ${cacheKey}`)
      }
      
      return page
    } catch (error) {
      console.error(`[ContentStore] Failed to load page ${cacheKey}:`, error)
      errors.value.set(`page-${cacheKey}`, error as Error)
      throw error
    } finally {
      loading.value.pages.delete(cacheKey)
    }
  }

  // Preload a page
  async function preloadPage(pageIdOrSlug: string, language?: string) {
    const cacheKey = `${pageIdOrSlug}-${language || 'en'}`
    
    // Skip if already cached or loading
    if (pageCache.value.has(cacheKey) || loading.value.pages.has(cacheKey)) {
      return
    }

    // Add to queue for background loading
    preloadQueue.value.add(cacheKey)
    processPreloadQueue()
  }

  // Process preload queue in background
  async function processPreloadQueue() {
    if (preloadQueue.value.size === 0) return
    
    // Take one item from queue
    const cacheKey = preloadQueue.value.values().next().value
    preloadQueue.value.delete(cacheKey)
    
    // Parse cache key
    const [pageIdOrSlug, language] = cacheKey.split('-')
    
    try {
      // Load page (will be cached automatically)
      await getPage(pageIdOrSlug, language === 'en' ? undefined : language)
      console.log(`[ContentStore] Preloaded: ${cacheKey}`)
    } catch (error) {
      console.warn(`[ContentStore] Preload failed for ${cacheKey}:`, error)
    }
    
    // Continue processing queue after a delay
    if (preloadQueue.value.size > 0) {
      setTimeout(() => processPreloadQueue(), 500)
    }
  }

  // Clear cache
  function clearPageCache() {
    pageCache.value = new Map()
    console.log('[ContentStore] Page cache cleared')
  }

  // Get cache stats
  const cacheStats = computed(() => ({
    pageCount: pageCache.value.size,
    totalSize: JSON.stringify(Array.from(pageCache.value.values())).length,
    oldestEntry: Math.min(...Array.from(pageCache.value.values()).map(e => e.timestamp)) || 0
  }))

  return {
    // State
    currentProject: computed(() => currentProject.value),
    navigation: computed(() => navigation.value),
    loading: computed(() => loading.value),
    errors: computed(() => errors.value),
    cacheStats,
    
    // Navigation
    headerMenu: computed(() => navigation.value.headerMenu),
    footerMenu: computed(() => navigation.value.footerMenu),
    mobileMenu: computed(() => navigation.value.mobileMenu),
    
    // Methods
    initializeProject,
    loadAllNavigation,
    getNavigationMenu,
    getNavigationMenuBySlug: getNavigationMenu, // Alias
    getPage,
    preloadPage,
    clearPageCache,
    
    // Direct access to content methods
    content
  }
})