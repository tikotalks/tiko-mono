import { ref, computed } from 'vue'
import { contentService } from '../services/content.service'
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
}

export interface PageContent {
  page: ContentPage
  sections: Array<{
    pageSection: ContentPageSection
    section: ContentSection
    content: Record<string, ContentData[]>
  }>
}

export function useContent(options?: UseContentOptions) {
  // Parse options with defaults
  const opts: UseContentOptions = options || {}

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
        const response = await contentService.getLanguages()
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
      let page: ContentPage | null = null
      
      // Check if it's a UUID
      if (pageIdOrSlug.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
        // It's an ID
        page = await contentService.getPage(pageIdOrSlug)
      } else {
        // It's a slug - need project ID
        if (!currentProject.value?.id) {
          throw new Error('Project not initialized. Cannot query by slug without project.')
        }
        page = await contentService.getPageBySlug(
          currentProject.value.id,
          pageIdOrSlug,
          language || 'en'
        )
      }
      
      if (!page) {
        throw new Error('Page not found')
      }

      // Get page sections
      const pageSections = await contentService.getPageSections(page.id)
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
              sectionInstance = await contentService.getSection(pageSection.section_id)
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
            sectionTemplate = await contentService.getSectionTemplate(sectionTemplateId)
            if (sectionTemplate) {
              sectionTemplateCache.set(sectionTemplateId, sectionTemplate)
            }
          }

          // Get fields for this section template
          const fields = await contentService.getFieldsBySectionTemplate(sectionTemplateId)
          
          let content: Record<string, any> = {}
          
          // If this page section references a section instance, load content from there
          if (pageSection.section_id) {
            try {
              // Load content from the section instance
              content = await contentService.getSectionData(pageSection.section_id, language || page?.language_code || 'en')
              console.log(`✅ [useContent] Loaded content from section instance ${pageSection.section_id}:`, content)
              if (Object.keys(content).length === 0) {
                console.warn(`⚠️ [useContent] Section instance ${pageSection.section_id} has no content data`)
              }
            } catch (error) {
              console.error(`❌ [useContent] Failed to load section instance data for ${pageSection.section_id}:`, error)
            }
          } else {
            console.log(`❌ [useContent] No section_id found for pageSection ${pageSection.override_name}`)
          }
          
          // If no section instance or it failed, fall back to page-specific field values
          if (Object.keys(content).length === 0) {
            // Get field values for this page and language
            const fieldValues = await contentService.getFieldValues(page!.id, language || page!.language_code)
            
            // Convert values array to object keyed by field_key
            fieldValues
              .filter(v => v.section_template_id === sectionTemplateId)
              .forEach(v => {
                const field = fields.find(f => f.id === v.field_id)
                if (field) {
                  content[field.field_key] = v.value
                }
              })
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
      const pages = await contentService.getPages(projectId || opts.projectId || currentProject.value?.id)
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
      const section = await contentService.getSection(sectionIdOrSlug)
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
      const contentList = await contentService.getSectionContent(sectionId, language)
      
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
      // Try to get by slug first (more common use case)
      let project = await contentService.getProjectBySlug(identifier)
      
      // If not found by slug, try by ID (UUID)
      if (!project && identifier.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
        project = await contentService.getProject(identifier)
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
      const projectsList = await contentService.getProjects()
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
      await contentService.updateContent(contentId, updates)
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
      const content = await contentService.createContent({
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
      const project = await contentService.getProjectBySlug(opts.projectSlug)
      if (project) {
        currentProject.value = project
      }
    } else if (opts.projectId) {
      const project = await contentService.getProject(opts.projectId)
      if (project) {
        currentProject.value = project
      }
    }
  }

  // Initialize on creation and wait for it
  const initPromise = initializeProject()
  loadLanguages()

  return {
    // State
    currentProject: computed(() => currentProject.value),
    projects: computed(() => projects.value),
    languages: computed(() => languages.value),
    loading: computed(() => loading.value),
    error: computed(() => error.value),
    
    // Methods
    getPage,
    getPages,
    getSection,
    getSectionContent,
    getProject,
    getProjects,
    updateContent,
    createContent,
    clearCache,
    setProject: async (slugOrId: string) => {
      // Try as slug first
      let project = await contentService.getProjectBySlug(slugOrId)
      
      // If not found and looks like UUID, try as ID
      if (!project && slugOrId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
        project = await contentService.getProject(slugOrId)
      }
      
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