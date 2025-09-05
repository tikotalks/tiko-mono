import { ref, computed, type Ref, type ComputedRef } from 'vue'
import { defineStore } from 'pinia'
import { contentService, logger } from '@tiko/core'

// Debug contentService
console.log('contentService imported:', contentService)
console.log('contentService type:', typeof contentService)
console.log('contentService methods:', contentService ? Object.keys(contentService) : 'null')
console.log('contentService prototype:', contentService ? Object.getOwnPropertyNames(Object.getPrototypeOf(contentService)) : 'null')

import type {
  ContentProject,
  SectionTemplate,
  ItemTemplate,
  ContentField,
  ContentPage,
  ContentSection,
  Item,
  ContentArticle,
  NavigationMenu,
  NavigationItem,
  Language,
  PageSection
} from '@tiko/core'

interface LoadingStates {
  projects: boolean
  pages: boolean
  sections: boolean
  sectionTemplates: boolean
  itemTemplates: boolean
  items: boolean
  navigation: boolean
  media: boolean
  articles: boolean
  languages: boolean
}

interface CacheTimestamps {
  projects?: number
  pages?: number
  sections?: number
  sectionTemplates?: number
  itemTemplates?: number
  items?: number
  navigation?: number
  media?: number
  articles?: number
  languages?: number
}

// Extended page type with children for tree structure
interface PageWithChildren extends ContentPage {
  children?: PageWithChildren[]
}

// Extended navigation item with children
interface NavigationItemWithChildren extends NavigationItem {
  children?: NavigationItemWithChildren[]
}

const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

export const useContentStore = defineStore('content', () => {
  // State
  const projects: Ref<ContentProject[]> = ref([])
  const pages: Ref<ContentPage[]> = ref([])
  const sections: Ref<ContentSection[]> = ref([])
  const sectionTemplates: Ref<SectionTemplate[]> = ref([])
  const itemTemplates: Ref<ItemTemplate[]> = ref([])
  const items: Ref<Item[]> = ref([])
  const navigationMenus: Ref<NavigationMenu[]> = ref([])
  const articles: Ref<ContentArticle[]> = ref([])
  const languages: Ref<Language[]> = ref([])
  const fields: Ref<ContentField[]> = ref([])
  
  const loading: Ref<LoadingStates> = ref({
    projects: false,
    pages: false,
    sections: false,
    sectionTemplates: false,
    itemTemplates: false,
    items: false,
    navigation: false,
    media: false,
    articles: false,
    languages: false
  })
  
  const error: Ref<string | null> = ref(null)
  const cacheTimestamps: Ref<CacheTimestamps> = ref({})
  const activeProjectId: Ref<string | null> = ref(null)
  const activeLanguageCode: Ref<string> = ref('en')
  
  // Computed - Projects
  const activeProject: ComputedRef<ContentProject | null> = computed(() => 
    projects.value.find(p => p.id === activeProjectId.value) || null
  )
  
  const projectsSortedByName: ComputedRef<ContentProject[]> = computed(() => 
    [...projects.value].sort((a, b) => a.name.localeCompare(b.name))
  )
  
  // Computed - Pages
  const pagesByProject: ComputedRef<Map<string, ContentPage[]>> = computed(() => {
    const map = new Map<string, ContentPage[]>()
    pages.value.forEach(page => {
      const list = map.get(page.project_id) || []
      list.push(page)
      map.set(page.project_id, list)
    })
    return map
  })
  
  const pagesForActiveProject: ComputedRef<ContentPage[]> = computed(() => 
    activeProjectId.value ? (pagesByProject.value.get(activeProjectId.value) || []) : []
  )
  
  const pageTree: ComputedRef<PageWithChildren[]> = computed(() => {
    const rootPages = pagesForActiveProject.value.filter(p => !p.parent_id)
    return buildPageTree(rootPages, pagesForActiveProject.value)
  })
  
  // Computed - Sections
  const globalSections: ComputedRef<ContentSection[]> = computed(() => 
    sections.value.filter(s => !s.project_id)
  )
  
  const reusableSections: ComputedRef<ContentSection[]> = computed(() => 
    sections.value.filter(s => s.is_reusable)
  )
  
  // Computed - Templates
  const globalSectionTemplates: ComputedRef<SectionTemplate[]> = computed(() => 
    sectionTemplates.value.filter(t => !t.language_code)
  )
  
  // Computed - Items
  const itemsByTemplate: ComputedRef<Map<string, Item[]>> = computed(() => {
    const map = new Map<string, Item[]>()
    items.value.forEach(item => {
      const list = map.get(item.item_template_id) || []
      list.push(item)
      map.set(item.item_template_id, list)
    })
    return map
  })
  
  const baseItems: ComputedRef<Item[]> = computed(() => 
    items.value.filter(i => !i.base_item_id && !i.language_code)
  )
  
  // Computed - Navigation
  const globalNavigationMenus: ComputedRef<NavigationMenu[]> = computed(() => 
    navigationMenus.value.filter(m => !m.project_id)
  )
  
  // Computed - Languages
  const activeLanguages: ComputedRef<Language[]> = computed(() => 
    languages.value.filter(l => l.is_active)
  )
  
  // Helper functions
  function buildPageTree(rootPages: ContentPage[], allPages: ContentPage[]): PageWithChildren[] {
    const pageMap = new Map(allPages.map(p => [p.id, { ...p } as PageWithChildren]))
    const tree: PageWithChildren[] = []
    
    rootPages.forEach(page => {
      const treeNode = buildPageNode(page.id, pageMap)
      if (treeNode) tree.push(treeNode)
    })
    
    return tree.sort((a, b) => a.navigation_order - b.navigation_order)
  }
  
  function buildPageNode(
    pageId: string, 
    pageMap: Map<string, PageWithChildren>
  ): PageWithChildren | null {
    const page = pageMap.get(pageId)
    if (!page) return null
    
    const children = Array.from(pageMap.values())
      .filter(p => p.parent_id === pageId)
      .map(child => buildPageNode(child.id, pageMap))
      .filter((node): node is PageWithChildren => node !== null)
    
    return {
      ...page,
      children: children.sort((a, b) => a.navigation_order - b.navigation_order)
    }
  }
  
  function isCacheValid(key: keyof CacheTimestamps): boolean {
    const timestamp = cacheTimestamps.value[key]
    if (!timestamp) return false
    return Date.now() - timestamp < CACHE_DURATION
  }
  
  function setCacheTimestamp(key: keyof CacheTimestamps): void {
    cacheTimestamps.value[key] = Date.now()
  }
  
  // Generic error handler
  function handleError(message: string, err: unknown): void {
    error.value = err instanceof Error ? err.message : message
    if (logger) {
      logger.error('content-store', message, err)
    } else {
      console.error(`[content-store] ${message}`, err)
    }
  }
  
  // Generic success logger
  function logSuccess(message: string, data?: Record<string, unknown>): void {
    if (logger) {
      logger.info('content-store', message, data)
    } else {
      console.info(`[content-store] ${message}`, data)
    }
  }
  
  // Actions - Projects
  async function loadProjects(force = false): Promise<void> {
    if (!force && isCacheValid('projects')) return
    
    loading.value.projects = true
    error.value = null
    
    try {
      projects.value = await contentService.getProjects()
      setCacheTimestamp('projects')
      logSuccess('Projects loaded', { count: projects.value.length })
    } catch (err) {
      handleError('Failed to load projects', err)
    } finally {
      loading.value.projects = false
    }
  }
  
  async function createProject(data: Partial<ContentProject>): Promise<ContentProject> {
    try {
      const newProject = await contentService.createProject(data)
      projects.value.push(newProject)
      logSuccess('Project created', { id: newProject.id, name: newProject.name })
      return newProject
    } catch (err) {
      handleError('Failed to create project', err)
      throw err
    }
  }
  
  async function updateProject(id: string, data: Partial<ContentProject>): Promise<ContentProject> {
    try {
      const updated = await contentService.updateProject(id, data)
      const index = projects.value.findIndex(p => p.id === id)
      if (index !== -1) {
        projects.value[index] = updated
      }
      logSuccess('Project updated', { id })
      return updated
    } catch (err) {
      handleError('Failed to update project', err)
      throw err
    }
  }
  
  async function deleteProject(id: string): Promise<void> {
    try {
      await contentService.deleteProject(id)
      projects.value = projects.value.filter(p => p.id !== id)
      logSuccess('Project deleted', { id })
    } catch (err) {
      handleError('Failed to delete project', err)
      throw err
    }
  }
  
  // Actions - Pages
  async function loadPages(projectId?: string, force = false): Promise<void> {
    if (!force && isCacheValid('pages')) return
    
    loading.value.pages = true
    error.value = null
    
    try {
      const loadedPages = projectId 
        ? await contentService.getPages(projectId)
        : await contentService.getPages()
      
      if (projectId) {
        pages.value = pages.value.filter(p => p.project_id !== projectId).concat(loadedPages)
      } else {
        pages.value = loadedPages
      }
      
      setCacheTimestamp('pages')
      logSuccess('Pages loaded', { count: loadedPages.length, projectId })
    } catch (err) {
      handleError('Failed to load pages', err)
    } finally {
      loading.value.pages = false
    }
  }
  
  async function createPage(data: Partial<ContentPage>): Promise<ContentPage> {
    try {
      const newPage = await contentService.createPage(data)
      pages.value.push(newPage)
      logSuccess('Page created', { id: newPage.id, title: newPage.title })
      return newPage
    } catch (err) {
      handleError('Failed to create page', err)
      throw err
    }
  }
  
  async function updatePage(id: string, data: Partial<ContentPage>): Promise<ContentPage> {
    try {
      const updated = await contentService.updatePage(id, data)
      const index = pages.value.findIndex(p => p.id === id)
      if (index !== -1) {
        pages.value[index] = updated
      }
      logSuccess('Page updated', { id })
      return updated
    } catch (err) {
      handleError('Failed to update page', err)
      throw err
    }
  }
  
  async function deletePage(id: string): Promise<void> {
    try {
      await contentService.deletePage(id)
      pages.value = pages.value.filter(p => p.id !== id)
      logSuccess('Page deleted', { id })
    } catch (err) {
      handleError('Failed to delete page', err)
      throw err
    }
  }
  
  // Actions - Section Templates
  async function loadSectionTemplates(force = false): Promise<void> {
    if (!force && isCacheValid('sectionTemplates')) return
    
    loading.value.sectionTemplates = true
    error.value = null
    
    try {
      sectionTemplates.value = await contentService.getSectionTemplates()
      setCacheTimestamp('sectionTemplates')
      logSuccess('Section templates loaded', { count: sectionTemplates.value.length })
    } catch (err) {
      handleError('Failed to load section templates', err)
    } finally {
      loading.value.sectionTemplates = false
    }
  }
  
  async function createSectionTemplate(data: Partial<SectionTemplate>): Promise<SectionTemplate> {
    try {
      const newTemplate = await contentService.createSectionTemplate(data)
      sectionTemplates.value.push(newTemplate)
      logSuccess('Section template created', { id: newTemplate.id, name: newTemplate.name })
      return newTemplate
    } catch (err) {
      handleError('Failed to create section template', err)
      throw err
    }
  }
  
  // Actions - Sections
  async function loadSections(force = false): Promise<void> {
    if (!force && isCacheValid('sections')) return
    
    loading.value.sections = true
    error.value = null
    
    try {
      sections.value = await contentService.getSections()
      setCacheTimestamp('sections')
      logSuccess('Sections loaded', { count: sections.value.length })
    } catch (err) {
      handleError('Failed to load sections', err)
    } finally {
      loading.value.sections = false
    }
  }
  
  async function createSection(data: Partial<ContentSection>): Promise<ContentSection> {
    try {
      const newSection = await contentService.createSection(data)
      sections.value.push(newSection)
      logSuccess('Section created', { id: newSection.id, name: newSection.name })
      return newSection
    } catch (err) {
      handleError('Failed to create section', err)
      throw err
    }
  }
  
  async function addSectionToPage(
    pageId: string, 
    sectionId: string, 
    position?: number
  ): Promise<void> {
    try {
      await contentService.addSectionToPage(pageId, { 
        section_id: sectionId, 
        order_index: position || 0 
      })
      logSuccess('Section added to page', { pageId, sectionId })
    } catch (err) {
      handleError('Failed to add section to page', err)
      throw err
    }
  }
  
  // Actions - Item Templates
  async function loadItemTemplates(force = false): Promise<void> {
    if (!force && isCacheValid('itemTemplates')) return
    
    loading.value.itemTemplates = true
    error.value = null
    
    try {
      itemTemplates.value = await contentService.getItemTemplates()
      setCacheTimestamp('itemTemplates')
      logSuccess('Item templates loaded', { count: itemTemplates.value.length })
    } catch (err) {
      handleError('Failed to load item templates', err)
    } finally {
      loading.value.itemTemplates = false
    }
  }
  
  async function createItemTemplate(data: Partial<ItemTemplate>): Promise<ItemTemplate> {
    try {
      const newTemplate = await contentService.createItemTemplate(data)
      itemTemplates.value.push(newTemplate)
      logSuccess('Item template created', { id: newTemplate.id, name: newTemplate.name })
      return newTemplate
    } catch (err) {
      handleError('Failed to create item template', err)
      throw err
    }
  }
  
  // Actions - Items
  async function loadItems(templateId?: string, force = false): Promise<void> {
    if (!force && isCacheValid('items')) return
    
    loading.value.items = true
    error.value = null
    
    try {
      const loadedItems = templateId
        ? await contentService.getItemsByTemplate(templateId)
        : await contentService.getItems()
      
      if (templateId) {
        items.value = items.value.filter(i => i.item_template_id !== templateId).concat(loadedItems)
      } else {
        items.value = loadedItems
      }
      
      setCacheTimestamp('items')
      logSuccess('Items loaded', { count: loadedItems.length, templateId })
    } catch (err) {
      handleError('Failed to load items', err)
    } finally {
      loading.value.items = false
    }
  }
  
  async function createItem(data: Partial<Item>): Promise<Item> {
    try {
      const newItem = await contentService.createItem(data)
      items.value.push(newItem)
      logSuccess('Item created', { id: newItem.id, name: newItem.name })
      return newItem
    } catch (err) {
      handleError('Failed to create item', err)
      throw err
    }
  }
  
  // Actions - Navigation
  async function loadNavigationMenus(projectId?: string, force = false): Promise<void> {
    if (!force && isCacheValid('navigation')) return
    
    loading.value.navigation = true
    error.value = null
    
    try {
      const loadedMenus = projectId
        ? await contentService.getNavigationMenus(projectId)
        : await contentService.getNavigationMenus()
      
      // Load items for each menu
      for (const menu of loadedMenus) {
        menu.items = await contentService.getNavigationItems(menu.id)
      }
      
      if (projectId) {
        navigationMenus.value = navigationMenus.value
          .filter(m => m.project_id !== projectId)
          .concat(loadedMenus)
      } else {
        navigationMenus.value = loadedMenus
      }
      
      setCacheTimestamp('navigation')
      logSuccess('Navigation menus loaded', { count: loadedMenus.length, projectId })
    } catch (err) {
      handleError('Failed to load navigation menus', err)
    } finally {
      loading.value.navigation = false
    }
  }
  
  async function createNavigationMenu(data: Partial<NavigationMenu>): Promise<NavigationMenu> {
    try {
      const newMenu = await contentService.createNavigationMenu(data)
      newMenu.items = []
      navigationMenus.value.push(newMenu)
      logSuccess('Navigation menu created', { id: newMenu.id, name: newMenu.name })
      return newMenu
    } catch (err) {
      handleError('Failed to create navigation menu', err)
      throw err
    }
  }
  
  async function createNavigationItem(
    menuId: string, 
    data: Partial<NavigationItem>
  ): Promise<NavigationItem> {
    try {
      console.log('🔵 Creating navigation item:', { menuId, data })
      const newItem = await contentService.createNavigationItem({ ...data, menu_id: menuId })
      console.log('🟢 Created item:', newItem)
      
      // Reload the menu items to get the fresh data from server
      const menu = navigationMenus.value.find(m => m.id === menuId)
      if (menu) {
        const beforeCount = menu.items?.length || 0
        menu.items = await contentService.getNavigationItems(menuId)
        const afterCount = menu.items?.length || 0
        console.log('🔄 Refreshed menu items:', { beforeCount, afterCount })
      }
      logSuccess('Navigation item created', { id: newItem.id, menuId })
      return newItem
    } catch (err) {
      handleError('Failed to create navigation item', err)
      throw err
    }
  }

  async function deleteNavigationMenu(menuId: string): Promise<void> {
    try {
      await contentService.deleteNavigationMenu(menuId)
      const index = navigationMenus.value.findIndex(m => m.id === menuId)
      if (index > -1) {
        navigationMenus.value.splice(index, 1)
      }
      logSuccess('Navigation menu deleted', { menuId })
    } catch (err) {
      handleError('Failed to delete navigation menu', err)
      throw err
    }
  }

  async function updateNavigationItem(
    itemId: string,
    data: Partial<NavigationItem>
  ): Promise<NavigationItem> {
    try {
      const updatedItem = await contentService.updateNavigationItem(itemId, data)
      
      // Find which menu contains this item and refresh it
      for (const menu of navigationMenus.value) {
        if (menu.items) {
          const hasItem = findItemInTree(menu.items, itemId)
          if (hasItem) {
            menu.items = await contentService.getNavigationItems(menu.id)
            break
          }
        }
      }
      
      logSuccess('Navigation item updated', { itemId })
      return updatedItem
    } catch (err) {
      handleError('Failed to update navigation item', err)
      throw err
    }
  }

  // Helper function to find if an item exists in a tree
  function findItemInTree(items: NavigationItemWithChildren[], itemId: string): boolean {
    for (const item of items) {
      if (item.id === itemId) return true
      if (item.children) {
        const found = findItemInTree(item.children, itemId)
        if (found) return true
      }
    }
    return false
  }

  async function deleteNavigationItem(itemId: string): Promise<void> {
    try {
      await contentService.deleteNavigationItem(itemId)
      // Remove the item from all menus
      navigationMenus.value.forEach(menu => {
        if (menu.items) {
          menu.items = removeItemFromTree(menu.items, itemId)
        }
      })
      logSuccess('Navigation item deleted', { itemId })
    } catch (err) {
      handleError('Failed to delete navigation item', err)
      throw err
    }
  }

  async function moveNavigationItem(
    itemId: string, 
    fromMenuId: string, 
    toMenuId: string
  ): Promise<void> {
    try {
      // Update the item's menu_id and reset parent_id to null (root level)
      await contentService.updateNavigationItem(itemId, { 
        menu_id: toMenuId,
        parent_id: null 
      })
      
      // Refresh both affected menus
      const fromMenu = navigationMenus.value.find(m => m.id === fromMenuId)
      const toMenu = navigationMenus.value.find(m => m.id === toMenuId)
      
      if (fromMenu) {
        fromMenu.items = await contentService.getNavigationItems(fromMenuId)
      }
      if (toMenu) {
        toMenu.items = await contentService.getNavigationItems(toMenuId)
      }
      
      logSuccess('Navigation item moved', { itemId, fromMenuId, toMenuId })
    } catch (err) {
      handleError('Failed to move navigation item', err)
      throw err
    }
  }

  async function copyNavigationItem(
    itemId: string, 
    fromMenuId: string, 
    toMenuId: string
  ): Promise<NavigationItem> {
    try {
      // Get the original item
      const fromMenu = navigationMenus.value.find(m => m.id === fromMenuId)
      let originalItem: NavigationItem | undefined
      
      if (fromMenu?.items) {
        const findInTree = (items: NavigationItemWithChildren[]): NavigationItem | undefined => {
          for (const item of items) {
            if (item.id === itemId) return item
            if (item.children) {
              const found = findInTree(item.children)
              if (found) return found
            }
          }
          return undefined
        }
        originalItem = findInTree(fromMenu.items)
      }
      
      if (!originalItem) {
        throw new Error('Original item not found')
      }
      
      // Create a copy with new menu_id, no parent_id, and no id
      const itemData = {
        menu_id: toMenuId,
        label: originalItem.label,
        type: originalItem.type,
        page_id: originalItem.page_id,
        url: originalItem.url,
        target: originalItem.target,
        parent_id: null, // Place at root level
        icon: originalItem.icon,
        css_class: originalItem.css_class,
        is_visible: originalItem.is_visible,
      }
      
      // Create the new item using the service method directly
      const newItem = await contentService.createNavigationItem({ ...itemData, menu_id: toMenuId })
      
      // Refresh the target menu to show the new item
      const toMenu = navigationMenus.value.find(m => m.id === toMenuId)
      if (toMenu) {
        toMenu.items = await contentService.getNavigationItems(toMenuId)
      }
      
      logSuccess('Navigation item copied', { originalItemId: itemId, newItemId: newItem.id, fromMenuId, toMenuId })
      return newItem
    } catch (err) {
      handleError('Failed to copy navigation item', err)
      throw err
    }
  }

  async function reorderNavigationItems(
    menuId: string,
    updates: Array<{ id: string; order_index: number; parent_id: string | null }>
  ): Promise<void> {
    try {
      // Update each item's order and parent
      await Promise.all(
        updates.map(update =>
          contentService.updateNavigationItem(update.id, {
            order_index: update.order_index,
            parent_id: update.parent_id
          })
        )
      )
      
      // Refresh the menu to show the new order
      const menu = navigationMenus.value.find(m => m.id === menuId)
      if (menu) {
        menu.items = await contentService.getNavigationItems(menuId)
      }
      
      logSuccess('Navigation items reordered', { menuId, itemCount: updates.length })
    } catch (err) {
      handleError('Failed to reorder navigation items', err)
      throw err
    }
  }

  function removeItemFromTree(items: NavigationItemWithChildren[], itemId: string): NavigationItemWithChildren[] {
    return items.filter(item => {
      if (item.id === itemId) {
        return false
      }
      if (item.children) {
        item.children = removeItemFromTree(item.children, itemId)
      }
      return true
    })
  }
  
  function buildNavigationTree(items: NavigationItem[]): NavigationItemWithChildren[] {
    const itemMap = new Map(
      items.map(i => [i.id, { ...i, children: [] } as NavigationItemWithChildren])
    )
    const tree: NavigationItemWithChildren[] = []
    
    items.forEach(item => {
      const mappedItem = itemMap.get(item.id)
      if (!mappedItem) return
      
      if (item.parent_id) {
        const parent = itemMap.get(item.parent_id)
        if (parent && parent.children) {
          parent.children.push(mappedItem)
        }
      } else {
        tree.push(mappedItem)
      }
    })
    
    // Sort by order_index at each level
    const sortItems = (itemList: NavigationItemWithChildren[]): void => {
      itemList.sort((a, b) => a.order_index - b.order_index)
      itemList.forEach(item => {
        if (item.children && item.children.length > 0) {
          sortItems(item.children)
        }
      })
    }
    
    sortItems(tree)
    return tree
  }
  
  // Actions - Articles
  async function loadArticles(pageId?: string, force = false): Promise<void> {
    if (!force && isCacheValid('articles')) return
    
    loading.value.articles = true
    error.value = null
    
    try {
      const loadedArticles = pageId
        ? await contentService.getArticlesByPage(pageId)
        : await contentService.getArticles()
      
      if (pageId) {
        articles.value = articles.value.filter(a => a.page_id !== pageId).concat(loadedArticles)
      } else {
        articles.value = loadedArticles
      }
      
      setCacheTimestamp('articles')
      logSuccess('Articles loaded', { count: loadedArticles.length, pageId })
    } catch (err) {
      handleError('Failed to load articles', err)
    } finally {
      loading.value.articles = false
    }
  }
  
  async function createArticle(data: Partial<ContentArticle>): Promise<ContentArticle> {
    try {
      const newArticle = await contentService.createArticle(data)
      articles.value.push(newArticle)
      logSuccess('Article created', { id: newArticle.id, title: newArticle.title })
      return newArticle
    } catch (err) {
      handleError('Failed to create article', err)
      throw err
    }
  }
  
  // Actions - Languages
  async function loadLanguages(force = false): Promise<void> {
    if (!force && isCacheValid('languages')) return
    
    loading.value.languages = true
    error.value = null
    
    try {
      languages.value = await contentService.getLanguages()
      setCacheTimestamp('languages')
      logSuccess('Languages loaded', { count: languages.value.length })
    } catch (err) {
      handleError('Failed to load languages', err)
    } finally {
      loading.value.languages = false
    }
  }
  
  // Actions - Fields
  async function createField(data: Partial<ContentField>): Promise<ContentField> {
    try {
      const newField = await contentService.createField(data)
      fields.value.push(newField)
      logSuccess('Field created', { id: newField.id, key: newField.field_key })
      return newField
    } catch (err) {
      handleError('Failed to create field', err)
      throw err
    }
  }
  
  async function updateField(id: string, data: Partial<ContentField>): Promise<ContentField> {
    try {
      const updated = await contentService.updateField(id, data)
      const index = fields.value.findIndex(f => f.id === id)
      if (index !== -1) {
        fields.value[index] = updated
      }
      logSuccess('Field updated', { id })
      return updated
    } catch (err) {
      handleError('Failed to update field', err)
      throw err
    }
  }
  
  // Search/Find helpers
  function findProjectBySlug(slug: string): ContentProject | undefined {
    return projects.value.find(p => p.slug === slug)
  }
  
  function findPageBySlug(slug: string, projectId?: string): ContentPage | undefined {
    const pagesToSearch = projectId 
      ? pagesByProject.value.get(projectId) || []
      : pages.value
    return pagesToSearch.find(p => p.slug === slug)
  }
  
  function searchPages(query: string): ContentPage[] {
    const lowerQuery = query.toLowerCase()
    return pages.value.filter(p => 
      p.title.toLowerCase().includes(lowerQuery) ||
      p.slug.toLowerCase().includes(lowerQuery) ||
      (p.seo_description && p.seo_description.toLowerCase().includes(lowerQuery))
    )
  }
  
  function searchArticles(query: string): ContentArticle[] {
    const lowerQuery = query.toLowerCase()
    return articles.value.filter(a => 
      a.title.toLowerCase().includes(lowerQuery) ||
      a.content.toLowerCase().includes(lowerQuery) ||
      a.tags.some(t => t.toLowerCase().includes(lowerQuery))
    )
  }
  
  // Utility functions
  function clearCache(): void {
    cacheTimestamps.value = {}
    logSuccess('Cache cleared')
  }
  
  async function refreshAll(): Promise<void> {
    await Promise.all([
      loadProjects(true),
      loadPages(undefined, true),
      loadSections(true),
      loadSectionTemplates(true),
      loadItemTemplates(true),
      loadItems(undefined, true),
      loadNavigationMenus(undefined, true),
      loadArticles(undefined, true),
      loadLanguages(true)
    ])
    logSuccess('All content refreshed')
  }
  
  function setActiveProject(projectId: string | null): void {
    activeProjectId.value = projectId
    logSuccess('Active project set', { projectId })
  }
  
  function setActiveLanguage(languageCode: string): void {
    activeLanguageCode.value = languageCode
    logSuccess('Active language set', { languageCode })
  }
  
  return {
    // State
    projects,
    pages,
    sections,
    sectionTemplates,
    itemTemplates,
    items,
    navigationMenus,
    articles,
    languages,
    fields,
    loading,
    error,
    activeProjectId,
    activeLanguageCode,
    
    // Computed
    activeProject,
    projectsSortedByName,
    pagesByProject,
    pagesForActiveProject,
    pageTree,
    globalSections,
    reusableSections,
    globalSectionTemplates,
    itemsByTemplate,
    baseItems,
    globalNavigationMenus,
    activeLanguages,
    
    // Actions - Projects
    loadProjects,
    createProject,
    updateProject,
    deleteProject,
    
    // Actions - Pages
    loadPages,
    createPage,
    updatePage,
    deletePage,
    
    // Actions - Sections
    loadSections,
    createSection,
    addSectionToPage,
    
    // Actions - Section Templates
    loadSectionTemplates,
    createSectionTemplate,
    
    // Actions - Item Templates
    loadItemTemplates,
    createItemTemplate,
    
    // Actions - Items
    loadItems,
    createItem,
    
    // Actions - Navigation
    loadNavigationMenus,
    createNavigationMenu,
    createNavigationItem,
    updateNavigationItem,
    deleteNavigationMenu,
    deleteNavigationItem,
    moveNavigationItem,
    copyNavigationItem,
    reorderNavigationItems,
    
    // Actions - Articles
    loadArticles,
    createArticle,
    
    // Actions - Languages
    loadLanguages,
    
    // Actions - Fields
    createField,
    updateField,
    
    // Search/Find helpers
    findProjectBySlug,
    findPageBySlug,
    searchPages,
    searchArticles,
    
    // Utility
    clearCache,
    refreshAll,
    setActiveProject,
    setActiveLanguage
  }
})