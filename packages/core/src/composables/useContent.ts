import { ref, computed } from 'vue'
import { contentService } from '../services/content.service'
import { ContentWorkerService } from '../services/content-worker.service'
import { processContentFields } from '../utils/field-processing'
import type { 
  ContentProject, 
  ContentSection, 
  ContentPage,
  ContentPageSection,
  ContentData,
  Language,
  SectionTemplate
} from '../services/content.service'

export interface UseContentOptions {
  projectId?: string
  projectSlug?: string
  autoFetchLanguages?: boolean
  useWorker?: boolean
  workerUrl?: string
  deployedVersionId?: string
  noCache?: boolean
}

export interface PageContent {
  page: ContentPage
  sections: Array<{
    pageSection: ContentPageSection
    section: ContentSection
    content: Record<string, ContentData[]>
  }>
}

export interface SectionContent {
  section: ContentSection
  content: Record<string, any>
}

export function useContent(options?: UseContentOptions) {
  // Parse options with defaults
  const opts: UseContentOptions = options || {}

  // Initialize service based on options
  const service = opts.useWorker 
    ? new ContentWorkerService({
        apiUrl: opts.workerUrl,
        deployedVersionId: opts.deployedVersionId,
        useCache: !opts.noCache
      })
    : contentService

  // State
  const currentProject = ref<ContentProject | null>(null)
  const projects = ref<ContentProject[]>([])
  const languages = ref<Language[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  // Cache for pages and content
  const pageCache = new Map<string, PageContent>()
  const sectionTemplateCache = new Map<string, SectionTemplate>()
  const sectionCache = new Map<string, ContentSection>()


  // Computed
  const projectId = computed(() => opts.projectId || currentProject.value?.id)

  // Load languages if needed
  async function loadLanguages() {
    if (languages.value.length === 0 && opts.autoFetchLanguages !== false) {
      try {
        const response = await service.getLanguages()
        languages.value = response
      } catch (err) {
        console.error('Failed to load languages:', err)
      }
    }
  }

  // Get a single page with all its content
  async function getPage(pageIdOrSlug: string, language?: string, skipCache = false): Promise<PageContent | null> {
    const cacheKey = `${pageIdOrSlug}-${language || 'default'}`
    
    // Check cache first (unless skipCache is true)
    if (!skipCache && pageCache.has(cacheKey)) {
      console.log(`[useContent] Returning cached page for key: ${cacheKey}`)
      return pageCache.get(cacheKey)!
    }

    // Wait for initialization if needed
    await initPromise

    loading.value = true
    error.value = null

    try {
      // Check if we can use the optimized method (only available in worker service)
      if (service instanceof ContentWorkerService) {
        console.log('🚀 [useContent] Using optimized getPageWithFullContent method')
        
        const result = await service.getPageWithFullContent(
          pageIdOrSlug,
          currentProject.value?.id,
          language || 'en'
        )
        
        if (!result) {
          throw new Error('Page not found')
        }

        // The optimized method returns already-processed data
        // Worker has already simplified the structure
        const processedResult: PageContent = result

        console.log(`🎯 [useContent] OPTIMIZED RESULT: ${processedResult.sections.length} sections loaded`)
        processedResult.sections.forEach((section, index) => {
          console.log(`   ${index}: ${section.section?.name || 'unknown'} (${Object.keys(section.content || {}).length} content fields)`)
        })

        // Cache the result
        pageCache.set(cacheKey, processedResult)
        
        return processedResult
      }

      // Fallback to the old method for direct service
      console.log('📊 [useContent] Using traditional multi-query method (direct service)')
      let page: ContentPage | null = null
      
      // Check if it's a UUID
      if (pageIdOrSlug.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
        // It's an ID
        page = await service.getPage(pageIdOrSlug)
      } else {
        // It's a slug - need project ID
        if (!currentProject.value?.id) {
          throw new Error('Project not initialized. Cannot query by slug without project.')
        }
        page = await service.getPageBySlug(
          currentProject.value.id,
          pageIdOrSlug,
          language || 'en'
        )
      }
      
      if (!page) {
        throw new Error('Page not found')
      }

      // Get page sections
      const pageSections = await service.getPageSections(page.id)
      console.log(`🔍 [useContent] Found ${pageSections.length} page sections for page ${page.id}:`, pageSections)
      
      // Check for null section_ids
      const nullSectionIds = pageSections.filter(ps => !ps.section_id)
      if (nullSectionIds.length > 0) {
        console.error(`❌ [useContent] ${nullSectionIds.length} page sections have NULL section_id:`, nullSectionIds)
      }
      
      // Load sections with their content
      const sectionsWithContent = (await Promise.all(
        pageSections.map(async (pageSection, index): Promise<{
          pageSection: ContentPageSection
          section: ContentSection
          content: Record<string, any>
        } | null> => {
          console.log(`🔧 [useContent] Processing pageSection ${index} (${pageSection.override_name}):`, pageSection)
          
          // Get section instance first
          let sectionInstance = null
          if (pageSection.section_id) {
            console.log(`🔍 [useContent] Loading section instance ${pageSection.section_id}...`)
            try {
              sectionInstance = await service.getSection(pageSection.section_id)
              console.log(`✅ [useContent] Section instance loaded:`, sectionInstance)
            } catch (error) {
              console.error(`❌ [useContent] Failed to load section instance ${pageSection.section_id}:`, error)
            }
          } else {
            console.error(`❌ [useContent] PageSection ${pageSection.override_name} has NULL section_id - cannot load!`)
          }
          
          if (!sectionInstance) {
            console.error(`❌ [useContent] No section instance found for pageSection:`, pageSection)
            console.error(`❌ [useContent] This section will be filtered out and NOT rendered on marketing site`)
            return null
          }
          
          // Get section template from the instance
          const sectionTemplateId = sectionInstance.section_template_id
          let sectionTemplate = sectionTemplateCache.get(sectionTemplateId)
          if (!sectionTemplate) {
            sectionTemplate = await service.getSectionTemplate(sectionTemplateId)
            if (sectionTemplate) {
              sectionTemplateCache.set(sectionTemplateId, sectionTemplate)
            }
          }

          // Get fields for this section template
          const fields = await service.getFieldsBySectionTemplate(sectionTemplateId)
          console.log(`🔍 [useContent] ALL FIELDS for template ${sectionTemplateId}:`)
          fields.forEach(field => {
            console.log(`  - Field: ${field.field_key} | Type: ${field.field_type} | ID: ${field.id}`)
          })
          
          let content: Record<string, any> = {}
          
          // If this page section references a section instance, load content from there
          if (pageSection.section_id && sectionInstance) {
            try {
              console.log(`🔍 [useContent] About to load content for section ${pageSection.section_id}`)
              console.log(`🔍 [useContent] Section instance:`, sectionInstance)
              
              // Load content from the section instance
              // IMPORTANT: Use the section instance's language_code, not the requested language
              // Global sections have language_code = null, language-specific sections have their own language_code
              const sectionLanguage = sectionInstance.language_code
              console.log(`🔍 [useContent] Loading content for section ${pageSection.section_id} with language: ${sectionLanguage || 'null (global)'}`)
              
              console.log(`🔍 [useContent] Calling service.getSectionData...`)
              const rawContent = await service.getSectionData(pageSection.section_id, sectionLanguage)
              console.log(`✅ [useContent] Loaded raw content from section instance ${pageSection.section_id}:`, rawContent)
              
              // Process fields for frontend consumption
              console.log(`🔧 [useContent] About to process fields for section ${pageSection.section_id}`)
              console.log(`🔧 [useContent] Raw content before processing:`, rawContent)
              console.log(`🔧 [useContent] Fields for processing:`, fields.map(f => ({ key: f.field_key, type: f.field_type })))
              
              // Check specifically for list fields
              const listFields = fields.filter(f => f.field_type === 'list')
              if (listFields.length > 0) {
                console.log(`📋 [useContent] Found ${listFields.length} list fields:`, listFields.map(f => f.field_key))
                listFields.forEach(field => {
                  const fieldValue = rawContent[field.field_key]
                  console.log(`📋 [useContent] List field '${field.field_key}':`, typeof fieldValue, fieldValue)
                })
              }
              
              content = await processContentFields(rawContent, fields, resolveLinkedItems, language || page?.language_code || 'en')
              console.log(`✅ [useContent] Processed content fields result:`, content)
              
              // Double-check list fields after processing
              if (listFields.length > 0) {
                listFields.forEach(field => {
                  const processedValue = content[field.field_key]
                  console.log(`📋 [useContent] After processing, '${field.field_key}':`, typeof processedValue, Array.isArray(processedValue) ? 'IS ARRAY' : 'NOT ARRAY', processedValue)
                })
              }
              if (Object.keys(content).length === 0) {
                console.warn(`⚠️ [useContent] Section instance ${pageSection.section_id} has no content data`)
              }
            } catch (error) {
              console.error(`❌ [useContent] Failed to load section instance data for ${pageSection.section_id}:`, error)
            }
          } else if (pageSection.section_id && !sectionInstance) {
            console.error(`❌ [useContent] Have section_id ${pageSection.section_id} but no section instance loaded`)
          } else {
            console.log(`❌ [useContent] No section_id found for pageSection ${pageSection.override_name}`)
          }
          
          // If no section instance or it failed, fall back to page-specific field values
          if (Object.keys(content).length === 0) {
            // Get field values for this page and language
            const fieldValues = await service.getFieldValues(page!.id, language || page!.language_code)
            
            // Convert values array to object keyed by field_key
            const rawContent: Record<string, any> = {}
            fieldValues
              .filter(v => v.section_template_id === sectionTemplateId)
              .forEach(v => {
                const field = fields.find(f => f.id === v.field_id)
                if (field) {
                  rawContent[field.field_key] = v.value
                }
              })
            
            // Process fields for frontend consumption
            console.log(`🔧 [useContent] About to process page-specific fields`)
            console.log(`🔧 [useContent] Raw page content before processing:`, rawContent)
            console.log(`🔧 [useContent] Fields for processing:`, fields.map(f => ({ key: f.field_key, type: f.field_type })))
            content = await processContentFields(rawContent, fields, resolveLinkedItems, language || page!.language_code)
            console.log(`✅ [useContent] Processed page content fields result:`, content)
          }

          return {
            pageSection: {
              ...pageSection
            },
            section: sectionInstance,
            content
          }
        })
      )).filter((section): section is {
        pageSection: ContentPageSection
        section: ContentSection
        content: Record<string, any>
      } => section !== null)

      const result: PageContent = {
        page,
        sections: sectionsWithContent,
        _cached_at: new Date().toISOString()
      } as PageContent & { _cached_at?: string }

      console.log(`🎯 [useContent] FINAL RESULT: ${sectionsWithContent.length} sections loaded for marketing site:`)
      sectionsWithContent.forEach((section, index) => {
        console.log(`   ${index}: ${section.section?.name || 'unknown'} (${Object.keys(section.content || {}).length} content fields)`)
      })
      
      if (sectionsWithContent.length === 0) {
        console.error(`❌ [useContent] NO SECTIONS WILL BE RENDERED! All sections were filtered out.`)
        console.error(`❌ [useContent] This is why the marketing site shows no sections after reorder.`)
      }

      // Cache the result
      pageCache.set(cacheKey, result)
      console.log(`[useContent] Cached page at ${(result as any)._cached_at}`)
      
      return result
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to load page'
      console.error('Failed to load page:', err)
      return null
    } finally {
      loading.value = false
    }
  }

  // Get multiple pages
  async function getPages(projectId?: string): Promise<ContentPage[]> {
    loading.value = true
    error.value = null

    try {
      const pages = await service.getPages(projectId || opts.projectId || currentProject.value?.id)
      return pages
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to load pages'
      console.error('Failed to load pages:', err)
      return []
    } finally {
      loading.value = false
    }
  }

  // Get a single section by ID or slug
  async function getSection(sectionIdOrSlug: string): Promise<ContentSection | null> {
    // Check cache first
    if (sectionCache.has(sectionIdOrSlug)) {
      return sectionCache.get(sectionIdOrSlug)!
    }

    loading.value = true
    error.value = null

    try {
      let section: ContentSection | null = await service.getSection(sectionIdOrSlug)
      
      if (section) {
        sectionCache.set(sectionIdOrSlug, section)
        sectionCache.set(section.id, section)
      }
      return section
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to load section'
      console.error('Failed to load section:', err)
      return null
    } finally {
      loading.value = false
    }
  }

  // Get content for a specific section
  async function getSectionContent(
    sectionId: string, 
    language?: string
  ): Promise<Record<string, ContentData[]>> {
    loading.value = true
    error.value = null

    try {
      const contentList = await service.getSectionContent(sectionId, language)
      
      // Group by field key
      const content: Record<string, ContentData[]> = {}
      contentList.forEach(item => {
        if (!content[item.field_key]) {
          content[item.field_key] = []
        }
        content[item.field_key].push(item)
      })
      
      return content
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to load content'
      console.error('Failed to load content:', err)
      return {}
    } finally {
      loading.value = false
    }
  }

  // Get project details
  async function getProject(projectIdOrSlug?: string): Promise<ContentProject | null> {
    const identifier = projectIdOrSlug || projectId.value
    if (!identifier) return null

    loading.value = true
    error.value = null

    try {
      let project: ContentProject | null
      
      // Try to get by slug first (more common use case)
      project = await service.getProjectBySlug(identifier)
      
      // If not found by slug, try by ID (UUID)
      if (!project && identifier.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
        project = await service.getProject(identifier)
      }
      
      if (project && !projectIdOrSlug) {
        currentProject.value = project
      }
      return project
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to load project'
      console.error('Failed to load project:', err)
      return null
    } finally {
      loading.value = false
    }
  }

  // Get all projects
  async function getProjects(): Promise<ContentProject[]> {
    loading.value = true
    error.value = null

    try {
      let projectsList: ContentProject[] = await service.getProjects()
      
      projects.value = projectsList
      return projectsList
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to load projects'
      console.error('Failed to load projects:', err)
      return []
    } finally {
      loading.value = false
    }
  }

  // Update content
  async function updateContent(
    contentId: string,
    updates: Partial<ContentData>
  ): Promise<void> {

    loading.value = true
    error.value = null

    try {
      await service.updateContent(contentId, updates)
      // Clear relevant caches
      pageCache.clear()
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to update content'
      console.error('Failed to update content:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  // Create new content
  async function createContent(
    sectionId: string,
    fieldKey: string,
    value: any,
    language?: string
  ): Promise<ContentData> {

    loading.value = true
    error.value = null

    try {
      const content = await service.createContent({
        section_id: sectionId,
        field_key: fieldKey,
        value,
        language_code: language
      })
      // Clear caches
      pageCache.clear()
      return content
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to create content'
      console.error('Failed to create content:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  // Clear caches
  function clearCache() {
    pageCache.clear()
    sectionTemplateCache.clear()
    sectionCache.clear()
  }

  // Initialize project
  async function initializeProject() {
    if (opts.projectSlug) {
      const project = await getProject(opts.projectSlug)
      if (project) {
        currentProject.value = project
      }
    } else if (opts.projectId) {
      const project = await getProject(opts.projectId)
      if (project) {
        currentProject.value = project
      }
    }
  }

  // Initialize on creation and wait for it
  const initPromise = initializeProject()
  if (!opts.useWorker) {
    loadLanguages()
  }

  // =================== ITEM METHODS ===================
  
  // Get a single item with automatic translation handling
  async function getItem(itemIdOrSlug: string, language?: string) {
    loading.value = true
    error.value = null
    
    try {
      // Regular flow
      let item = null
      
      // Try to find the item (base or translation)
      if (itemIdOrSlug.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
        item = await service.getItem(itemIdOrSlug)
      } else {
        // Find by slug - first try exact language match
        item = await service.getItemBySlug(itemIdOrSlug, language)
        
        // If not found, try base item
        if (!item && language) {
          item = await service.getItemBySlug(itemIdOrSlug, undefined)
        }
      }
      
      if (!item) return null
      
      // If we have a base item but need a translation
      if (!item.language_code && language) {
        const translation = await service.getItemTranslation(item.id, language)
        if (translation) {
          item = translation
        }
        // If no translation exists, we'll use base item with inheritance
      }
      
      // Get merged data (translated + inherited fields)
      console.log(`📦 [getItem] Getting data for item ${item.id}`)
      const data = await service.getItemData(item.id, true)
      console.log(`📦 [getItem] Raw item data:`, data)
      
      // Process fields
      const fields = await service.getFieldsByItemTemplate(item.item_template_id)
      console.log(`📦 [getItem] Fields for template ${item.item_template_id}:`, fields.map(f => f.field_key))
      const processedData = await processContentFields(data, fields, resolveLinkedItems, language)
      console.log(`📦 [getItem] Processed item data:`, processedData)
      
      return {
        item,
        data: processedData,
        isTranslation: !!item.base_item_id,
        baseItemId: item.base_item_id || item.id
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to load item'
      console.error('Failed to load item:', err)
      return null
    } finally {
      loading.value = false
    }
  }
  
  // Get multiple items
  async function getItems(templateId?: string, language?: string) {
    loading.value = true
    error.value = null
    
    try {
      const items = await service.getItems(templateId, language)
      return items
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to load items'
      console.error('Failed to load items:', err)
      return []
    } finally {
      loading.value = false
    }
  }
  
  // Resolve linked items with automatic translation
  async function resolveLinkedItems(itemIds: string[], language: string) {
    if (!itemIds || itemIds.length === 0) return []
    
    loading.value = true
    error.value = null
    
    try {
      // Regular flow
      console.log(`🔍 [resolveLinkedItems] Resolving ${itemIds.length} items with language:`, language)
      console.log(`🔍 [resolveLinkedItems] Item IDs:`, itemIds)
      
      // Ensure all items are strings
      const validItemIds = itemIds.filter(id => {
        if (typeof id !== 'string') {
          console.error(`❌ [resolveLinkedItems] Invalid item ID (not a string):`, id, typeof id)
          return false
        }
        return true
      })
      
      const resolvedItems = await Promise.all(
        validItemIds.map(async (itemId) => {
          console.log(`📦 [resolveLinkedItems] Resolving item:`, itemId)
          const result = await getItem(itemId, language)
          console.log(`✅ [resolveLinkedItems] Item ${itemId} resolved:`, result ? 'SUCCESS' : 'FAILED')
          if (result) {
            console.log(`📄 [resolveLinkedItems] Item data:`, { 
              name: result.item?.name, 
              hasData: !!result.data,
              dataKeys: result.data ? Object.keys(result.data) : []
            })
          }
          return result
        })
      )
      
      const filtered = resolvedItems.filter(Boolean)
      console.log(`🎯 [resolveLinkedItems] Returning ${filtered.length} resolved items`)
      return filtered
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to resolve linked items'
      console.error('Failed to resolve linked items:', err)
      return []
    } finally {
      loading.value = false
    }
  }
  
  // Create new item
  async function createItem(templateId: string, name: string, slug?: string) {

    loading.value = true
    error.value = null
    
    try {
      const item = await service.createItem({
        item_template_id: templateId,
        name,
        slug,
        is_active: true
      })
      return item
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to create item'
      console.error('Failed to create item:', err)
      throw err
    } finally {
      loading.value = false
    }
  }
  
  // Update item data
  async function updateItemData(itemId: string, data: Record<string, any>) {

    loading.value = true
    error.value = null
    
    try {
      await service.setItemData(itemId, data)
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to update item data'
      console.error('Failed to update item data:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  // Cache management methods
  async function refreshCache(method?: string, params?: Record<string, any>) {
    // UnifiedContentService has built-in caching
    // Clear local cache
    clearCache()
  }

  async function clearWorkerCache(authorization: string, versionId?: string) {
    // UnifiedContentService manages its own cache
    clearCache()
    return true
  }

  // Navigation helper
  const navigation = computed(() => {
    // Return a reactive computed that provides navigation items
    return {
      async getItems(language?: string) {
        if (!currentProject.value) {
          console.error('[useContent] No project set for navigation')
          return []
        }
        
        const pages = await getPages(currentProject.value.id)
        
        // Get language code from provided language or default to 'en'
        const languageCode = language ? language.split('-')[0] : 'en'
        
        // Filter pages for navigation
        const navPages = pages.filter(page => 
          page.show_in_navigation && 
          page.is_published && 
          page.language_code === languageCode &&
          !page.is_home
        )
        
        // Sort by navigation order
        navPages.sort((a, b) => a.navigation_order - b.navigation_order)
        
        // Convert to navigation items
        return navPages.map(page => ({
          name: page.title,
          link: `/${page.slug}`,
          slug: page.slug,
          id: page.id
        }))
      }
    }
  })

  return {
    // State
    currentProject: computed(() => currentProject.value),
    projects: computed(() => projects.value),
    languages: computed(() => languages.value),
    loading: computed(() => loading.value),
    error: computed(() => error.value),
    isUsingWorker: computed(() => opts.useWorker === true),
    
    // Navigation
    navigation,
    
    // Page/Section Methods
    getPage,
    getPages,
    getSection,
    getSectionContent,
    getProject,
    getProjects,
    updateContent,
    createContent,
    clearCache,
    
    // Item Methods
    getItem,
    getItems,
    resolveLinkedItems,
    createItem,
    updateItemData,
    
    // Worker-specific methods
    refreshCache,
    clearWorkerCache,
    
    // Project Management
    setProject: async (slugOrId: string) => {
      const project = await getProject(slugOrId)
      
      if (project) {
        currentProject.value = project
        clearCache()
      }
      
      return project
    }
  }
}

// Export types
export type { ContentProject, ContentSection, ContentPage, ContentData }
export { ContentWorkerService } from '../services/content-worker.service'