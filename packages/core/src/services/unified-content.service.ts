/**
 * Unified Content Service
 * 
 * Single source of truth for content operations with:
 * - Deep resolution via database joins
 * - Multi-level caching
 * - Unified field processing
 * - One API for both worker and client
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { processContentFields } from '../utils/field-processing'

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface UnifiedContentConfig {
  supabaseUrl: string
  supabaseKey: string
  cacheEnabled?: boolean
  defaultLanguage?: string
}

export interface QueryOptions {
  language?: string
  deep?: boolean
  cache?: boolean
  cacheKey?: string
}

export interface FullPageContent {
  page: {
    id: string
    name: string
    slug: string
    project_id: string
    created_at: string
    updated_at: string
  }
  sections: FullSectionContent[]
  metadata?: {
    total_sections: number
    cache_key?: string
    query_time?: number
  }
}

export interface FullSectionContent {
  section: {
    id: string
    name: string
    slug: string
    section_template_id: string
    template_name?: string
    component_type?: string
  }
  content: Record<string, any>
  fields: ContentField[]
  items?: FullItemContent[]
  order_index?: number
  override_name?: string
}

export interface FullItemContent {
  item: {
    id: string
    name: string
    slug: string
    item_template_id: string
  }
  content: Record<string, any>
  fields: ContentField[]
}

export interface ContentField {
  id: string
  field_key: string
  field_type: string
  is_translatable: boolean
  config?: Record<string, any>
}

export interface CacheEntry<T> {
  data: T
  expires: number
  language: string
  created_at: number
}

// ============================================================================
// CACHE MANAGER
// ============================================================================

class ContentCacheManager {
  private memoryCache = new Map<string, CacheEntry<any>>()
  private readonly DEFAULT_TTL = 5 * 60 * 1000 // 5 minutes

  get<T>(key: string): T | null {
    const entry = this.memoryCache.get(key)
    if (!entry) return null
    
    if (Date.now() > entry.expires) {
      this.memoryCache.delete(key)
      return null
    }
    
    console.log(`📦 [Cache] HIT: ${key}`)
    return entry.data
  }

  set<T>(key: string, data: T, ttl = this.DEFAULT_TTL): void {
    const entry: CacheEntry<T> = {
      data,
      expires: Date.now() + ttl,
      language: 'en', // TODO: extract from key
      created_at: Date.now()
    }
    
    this.memoryCache.set(key, entry)
    console.log(`💾 [Cache] SET: ${key} (TTL: ${ttl}ms)`)
  }

  invalidate(key: string): void {
    this.memoryCache.delete(key)
    console.log(`🗑️ [Cache] INVALIDATED: ${key}`)
  }

  invalidatePattern(pattern: string): void {
    const regex = new RegExp(pattern.replace('*', '.*'))
    let count = 0
    
    for (const key of this.memoryCache.keys()) {
      if (regex.test(key)) {
        this.memoryCache.delete(key)
        count++
      }
    }
    
    console.log(`🗑️ [Cache] INVALIDATED ${count} keys matching pattern: ${pattern}`)
  }

  clear(): void {
    this.memoryCache.clear()
    console.log(`🗑️ [Cache] CLEARED all entries`)
  }

  getStats() {
    return {
      size: this.memoryCache.size,
      entries: Array.from(this.memoryCache.keys())
    }
  }
}

// ============================================================================
// UNIFIED CONTENT SERVICE
// ============================================================================

export class UnifiedContentService {
  private supabase: SupabaseClient
  private cache: ContentCacheManager
  private defaultLanguage: string

  constructor(config: UnifiedContentConfig) {
    this.supabase = createClient(config.supabaseUrl, config.supabaseKey)
    this.cache = new ContentCacheManager()
    this.defaultLanguage = config.defaultLanguage || 'en'
  }

  // ========================================================================
  // PROJECT ENDPOINTS
  // ========================================================================

  /**
   * GET /projects
   * Get all projects
   */
  async getProjects(options: QueryOptions = {}): Promise<any[]> {
    const cacheKey = `projects:all:${options.language || this.defaultLanguage}`
    
    if (options.cache !== false) {
      const cached = this.cache.get<any[]>(cacheKey)
      if (cached) return cached
    }

    console.log(`🔍 [UnifiedContent] Fetching all projects`)
    const startTime = Date.now()

    const { data, error } = await this.supabase
      .from('content_projects')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      throw new Error(`Failed to fetch projects: ${error.message}`)
    }

    const queryTime = Date.now() - startTime
    console.log(`✅ [UnifiedContent] Fetched ${data.length} projects in ${queryTime}ms`)

    if (options.cache !== false) {
      this.cache.set(cacheKey, data)
    }

    return data
  }

  /**
   * GET /project?project_id=:id&deep=true
   * Get single project with optional deep resolution
   */
  async getProject(projectId: string, options: QueryOptions = {}): Promise<any> {
    const cacheKey = `project:${projectId}:${options.language || this.defaultLanguage}:deep:${!!options.deep}`
    
    if (options.cache !== false) {
      const cached = this.cache.get(cacheKey)
      if (cached) return cached
    }

    console.log(`🔍 [UnifiedContent] Fetching project ${projectId} (deep: ${!!options.deep})`)
    const startTime = Date.now()

    if (options.deep) {
      return this.getProjectWithFullContent(projectId, options)
    }

    const { data, error } = await this.supabase
      .from('content_projects')
      .select('*')
      .eq('id', projectId)
      .single()

    if (error) {
      throw new Error(`Failed to fetch project: ${error.message}`)
    }

    const queryTime = Date.now() - startTime
    console.log(`✅ [UnifiedContent] Fetched project in ${queryTime}ms`)

    if (options.cache !== false) {
      this.cache.set(cacheKey, data)
    }

    return data
  }

  // ========================================================================
  // PAGE ENDPOINTS  
  // ========================================================================

  /**
   * GET /pages
   * Get all pages
   */
  async getPages(options: QueryOptions = {}): Promise<any[]> {
    const cacheKey = `pages:all:${options.language || this.defaultLanguage}`
    
    if (options.cache !== false) {
      const cached = this.cache.get<any[]>(cacheKey)
      if (cached) return cached
    }

    console.log(`🔍 [UnifiedContent] Fetching all pages`)
    const startTime = Date.now()

    const { data, error } = await this.supabase
      .from('content_pages')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      throw new Error(`Failed to fetch pages: ${error.message}`)
    }

    const queryTime = Date.now() - startTime
    console.log(`✅ [UnifiedContent] Fetched ${data.length} pages in ${queryTime}ms`)

    if (options.cache !== false) {
      this.cache.set(cacheKey, data)
    }

    return data
  }

  /**
   * GET /pages?project_id=:id
   * Get pages by project
   */
  async getPagesByProject(projectId: string, options: QueryOptions = {}): Promise<any[]> {
    const cacheKey = `pages:project:${projectId}:${options.language || this.defaultLanguage}`
    
    if (options.cache !== false) {
      const cached = this.cache.get<any[]>(cacheKey)
      if (cached) return cached
    }

    console.log(`🔍 [UnifiedContent] Fetching pages for project ${projectId}`)
    const startTime = Date.now()

    const { data, error } = await this.supabase
      .from('content_pages')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false })

    if (error) {
      throw new Error(`Failed to fetch pages for project: ${error.message}`)
    }

    const queryTime = Date.now() - startTime
    console.log(`✅ [UnifiedContent] Fetched ${data.length} pages for project in ${queryTime}ms`)

    if (options.cache !== false) {
      this.cache.set(cacheKey, data)
    }

    return data
  }

  /**
   * GET /page?page_id=:id&deep=true&lang_id=:lang
   * Get single page with optional deep resolution
   */
  async getPage(pageId: string, options: QueryOptions = {}): Promise<FullPageContent | any> {
    const language = options.language || this.defaultLanguage
    const cacheKey = `page:${pageId}:${language}:deep:${!!options.deep}`
    
    if (options.cache !== false) {
      const cached = this.cache.get(cacheKey)
      if (cached) return cached
    }

    console.log(`🔍 [UnifiedContent] Fetching page ${pageId} (deep: ${!!options.deep}, lang: ${language})`)
    const startTime = Date.now()

    if (options.deep) {
      return this.getPageWithFullContent(pageId, options)
    }

    const { data, error } = await this.supabase
      .from('content_pages')
      .select('*')
      .eq('id', pageId)
      .single()

    if (error) {
      throw new Error(`Failed to fetch page: ${error.message}`)
    }

    const queryTime = Date.now() - startTime
    console.log(`✅ [UnifiedContent] Fetched page in ${queryTime}ms`)

    if (options.cache !== false) {
      this.cache.set(cacheKey, data)
    }

    return data
  }

  // ========================================================================
  // SECTION ENDPOINTS
  // ========================================================================

  /**
   * GET /sections
   * Get all sections
   */
  async getSections(options: QueryOptions = {}): Promise<any[]> {
    const cacheKey = `sections:all:${options.language || this.defaultLanguage}`
    
    if (options.cache !== false) {
      const cached = this.cache.get<any[]>(cacheKey)
      if (cached) return cached
    }

    console.log(`🔍 [UnifiedContent] Fetching all sections`)
    const startTime = Date.now()

    const { data, error } = await this.supabase
      .from('content_sections')
      .select(`
        *,
        content_section_templates (
          name,
          component_type
        )
      `)
      .order('created_at', { ascending: false })

    if (error) {
      throw new Error(`Failed to fetch sections: ${error.message}`)
    }

    const queryTime = Date.now() - startTime
    console.log(`✅ [UnifiedContent] Fetched ${data.length} sections in ${queryTime}ms`)

    if (options.cache !== false) {
      this.cache.set(cacheKey, data)
    }

    return data
  }

  /**
   * GET /sections?page_id=:id
   * Get sections by page
   */
  async getSectionsByPage(pageId: string, options: QueryOptions = {}): Promise<any[]> {
    const cacheKey = `sections:page:${pageId}:${options.language || this.defaultLanguage}`
    
    if (options.cache !== false) {
      const cached = this.cache.get<any[]>(cacheKey)
      if (cached) return cached
    }

    console.log(`🔍 [UnifiedContent] Fetching sections for page ${pageId}`)
    const startTime = Date.now()

    const { data, error } = await this.supabase
      .from('content_page_sections')
      .select(`
        order_index,
        override_name,
        content_sections (
          *,
          content_section_templates (
            name,
            component_type
          )
        )
      `)
      .eq('page_id', pageId)
      .order('order_index', { ascending: true })

    if (error) {
      throw new Error(`Failed to fetch sections for page: ${error.message}`)
    }

    const queryTime = Date.now() - startTime
    console.log(`✅ [UnifiedContent] Fetched ${data.length} sections for page in ${queryTime}ms`)

    if (options.cache !== false) {
      this.cache.set(cacheKey, data)
    }

    return data
  }

  /**
   * GET /section?section_id=:id&deep=true&lang_id=:lang
   * Get single section with optional deep resolution
   */
  async getSection(sectionId: string, options: QueryOptions = {}): Promise<FullSectionContent | any> {
    const language = options.language || this.defaultLanguage
    const cacheKey = `section:${sectionId}:${language}:deep:${!!options.deep}`
    
    if (options.cache !== false) {
      const cached = this.cache.get(cacheKey)
      if (cached) return cached
    }

    console.log(`🔍 [UnifiedContent] Fetching section ${sectionId} (deep: ${!!options.deep}, lang: ${language})`)
    const startTime = Date.now()

    if (options.deep) {
      return this.getSectionWithFullContent(sectionId, options)
    }

    const { data, error } = await this.supabase
      .from('content_sections')
      .select(`
        *,
        content_section_templates (
          name,
          component_type
        )
      `)
      .eq('id', sectionId)
      .single()

    if (error) {
      throw new Error(`Failed to fetch section: ${error.message}`)
    }

    const queryTime = Date.now() - startTime
    console.log(`✅ [UnifiedContent] Fetched section in ${queryTime}ms`)

    if (options.cache !== false) {
      this.cache.set(cacheKey, data)
    }

    return data
  }

  // ========================================================================
  // ITEM ENDPOINTS
  // ========================================================================

  /**
   * GET /items
   * Get all items
   */
  async getItems(options: QueryOptions = {}): Promise<any[]> {
    const cacheKey = `items:all:${options.language || this.defaultLanguage}`
    
    if (options.cache !== false) {
      const cached = this.cache.get<any[]>(cacheKey)
      if (cached) return cached
    }

    console.log(`🔍 [UnifiedContent] Fetching all items`)
    const startTime = Date.now()

    const { data, error } = await this.supabase
      .from('content_items')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      throw new Error(`Failed to fetch items: ${error.message}`)
    }

    const queryTime = Date.now() - startTime
    console.log(`✅ [UnifiedContent] Fetched ${data.length} items in ${queryTime}ms`)

    if (options.cache !== false) {
      this.cache.set(cacheKey, data)
    }

    return data
  }

  /**
   * GET /items?section_id=:id
   * Get items by section
   */
  async getItemsBySection(sectionId: string, options: QueryOptions = {}): Promise<any[]> {
    const language = options.language || this.defaultLanguage
    const cacheKey = `items:section:${sectionId}:${language}`
    
    if (options.cache !== false) {
      const cached = this.cache.get<any[]>(cacheKey)
      if (cached) return cached
    }

    console.log(`🔍 [UnifiedContent] Fetching items for section ${sectionId}`)
    const startTime = Date.now()

    const { data, error } = await this.supabase
      .rpc('get_items_by_section', {
        input_section_id: sectionId,
        input_language_code: language
      })

    if (error) {
      throw new Error(`Failed to fetch items for section: ${error.message}`)
    }

    const queryTime = Date.now() - startTime
    console.log(`✅ [UnifiedContent] Fetched items for section in ${queryTime}ms`)

    // Process the flat data into structured format
    const processedItems = this.processItemsData(data)

    if (options.cache !== false) {
      this.cache.set(cacheKey, processedItems)
    }

    return processedItems
  }

  /**
   * GET /item?item_id=:id&deep=true&lang_id=:lang
   * Get single item with optional deep resolution
   */
  async getItem(itemId: string, options: QueryOptions = {}): Promise<FullItemContent | any> {
    const language = options.language || this.defaultLanguage
    const cacheKey = `item:${itemId}:${language}:deep:${!!options.deep}`
    
    if (options.cache !== false) {
      const cached = this.cache.get(cacheKey)
      if (cached) return cached
    }

    console.log(`🔍 [UnifiedContent] Fetching item ${itemId} (deep: ${!!options.deep}, lang: ${language})`)
    const startTime = Date.now()

    if (options.deep) {
      return this.getItemWithFullContent(itemId, options)
    }

    const { data, error } = await this.supabase
      .from('content_items')
      .select('*')
      .eq('id', itemId)
      .single()

    if (error) {
      throw new Error(`Failed to fetch item: ${error.message}`)
    }

    const queryTime = Date.now() - startTime
    console.log(`✅ [UnifiedContent] Fetched item in ${queryTime}ms`)

    if (options.cache !== false) {
      this.cache.set(cacheKey, data)
    }

    return data
  }

  // ========================================================================
  // PRIVATE METHODS - DEEP RESOLUTION
  // ========================================================================

  private async getProjectWithFullContent(projectId: string, options: QueryOptions): Promise<any> {
    // TODO: Implement deep project resolution
    throw new Error('Deep project resolution not yet implemented')
  }

  private async getSectionWithFullContent(sectionId: string, options: QueryOptions): Promise<FullSectionContent> {
    const language = options.language || this.defaultLanguage
    const startTime = Date.now()

    console.log(`🚀 [UnifiedContent] Deep fetching section ${sectionId} with language ${language}`)

    // Use optimized database function
    const { data, error } = await this.supabase
      .rpc('get_section_with_full_content', {
        input_section_id: sectionId,
        input_language_code: language
      })

    if (error) {
      throw new Error(`Failed to fetch section with full content: ${error.message}`)
    }

    if (!data || data.length === 0) {
      throw new Error(`Section ${sectionId} not found`)
    }

    // Process the data
    const processedSection = await this.processSectionDataFromRPC(data, language)
    
    const queryTime = Date.now() - startTime
    console.log(`✅ [UnifiedContent] Deep fetched section in ${queryTime}ms`)

    return processedSection
  }

  private async getItemWithFullContent(itemId: string, options: QueryOptions): Promise<FullItemContent> {
    const language = options.language || this.defaultLanguage
    const startTime = Date.now()

    console.log(`🚀 [UnifiedContent] Deep fetching item ${itemId} with language ${language}`)

    // Use optimized database function
    const { data, error } = await this.supabase
      .rpc('get_item_with_content', {
        input_item_id: itemId,
        input_language_code: language
      })

    if (error) {
      throw new Error(`Failed to fetch item with content: ${error.message}`)
    }

    if (!data || data.length === 0) {
      throw new Error(`Item ${itemId} not found`)
    }

    // Process the data
    const processedItem = await this.processItemDataFromRPC(data, language)
    
    const queryTime = Date.now() - startTime
    console.log(`✅ [UnifiedContent] Deep fetched item in ${queryTime}ms`)

    return processedItem
  }

  private async processSectionDataFromRPC(rawData: any[], language: string): Promise<FullSectionContent> {
    if (!rawData || rawData.length === 0) {
      throw new Error('No section data to process')
    }

    const firstRow = rawData[0]
    
    // Extract section info
    const section = {
      id: firstRow.section_id,
      name: firstRow.section_name,
      slug: firstRow.section_slug,
      section_template_id: firstRow.section_template_id,
      template_name: firstRow.template_name,
      component_type: firstRow.component_type
    }

    // Extract unique fields
    const fieldsMap = new Map<string, ContentField>()
    const rawContent: Record<string, any> = {}

    rawData.forEach(row => {
      if (row.field_key) {
        // Prefer translated content
        if (row.field_language === language || (!rawContent[row.field_key] && !row.field_language)) {
          rawContent[row.field_key] = row.field_value
        }

        // Collect unique fields
        if (!fieldsMap.has(row.field_key)) {
          fieldsMap.set(row.field_key, {
            id: `${row.section_template_id}_${row.field_key}`, // Generate ID
            field_key: row.field_key,
            field_type: row.field_type,
            is_translatable: row.is_translatable,
            config: row.field_config
          })
        }
      }
    })

    const fields = Array.from(fieldsMap.values())

    // Process field values using existing logic
    const processedContent = await processContentFields(
      rawContent, 
      fields,
      undefined, // No linked items resolution yet
      language
    )

    // Extract linked items if present
    const items: FullItemContent[] = []
    const linkedItemsData = firstRow.linked_items
    if (linkedItemsData && Array.isArray(linkedItemsData)) {
      // Process linked items (simplified for now)
      items.push(...linkedItemsData.map((itemData: any) => ({
        item: {
          id: itemData.id,
          name: itemData.name,
          slug: itemData.slug,
          item_template_id: itemData.item_template_id
        },
        content: {},
        fields: []
      })))
    }

    return {
      section,
      content: processedContent,
      fields,
      items
    }
  }

  private async processItemDataFromRPC(rawData: any[], language: string): Promise<FullItemContent> {
    if (!rawData || rawData.length === 0) {
      throw new Error('No item data to process')
    }

    const firstRow = rawData[0]
    
    // Extract item info
    const item = {
      id: firstRow.item_id,
      name: firstRow.item_name,
      slug: firstRow.item_slug,
      item_template_id: firstRow.item_template_id
    }

    // Extract unique fields and content
    const fieldsMap = new Map<string, ContentField>()
    const rawContent: Record<string, any> = {}

    rawData.forEach(row => {
      if (row.field_key) {
        // Prefer translated content (item language vs requested language)
        if (row.item_language === language || (!rawContent[row.field_key] && !row.item_language)) {
          rawContent[row.field_key] = row.field_value
        }

        // Collect unique fields
        if (!fieldsMap.has(row.field_key)) {
          fieldsMap.set(row.field_key, {
            id: `${row.item_template_id}_${row.field_key}`, // Generate ID
            field_key: row.field_key,
            field_type: row.field_type,
            is_translatable: row.is_translatable,
            config: row.field_config
          })
        }
      }
    })

    const fields = Array.from(fieldsMap.values())

    // Process field values using existing logic
    const processedContent = await processContentFields(
      rawContent, 
      fields,
      undefined, // No nested linked items for now
      language
    )

    return {
      item,
      content: processedContent,
      fields
    }
  }

  private processItemsData(rawData: any[]): FullItemContent[] {
    if (!rawData || rawData.length === 0) return []

    const itemsMap = new Map<string, FullItemContent>()

    rawData.forEach(row => {
      if (!itemsMap.has(row.item_id)) {
        itemsMap.set(row.item_id, {
          item: {
            id: row.item_id,
            name: row.item_name,
            slug: row.item_slug,
            item_template_id: row.item_template_id
          },
          content: {},
          fields: []
        })
      }

      const item = itemsMap.get(row.item_id)!
      
      if (row.field_key) {
        // Add content
        item.content[row.field_key] = row.field_value

        // Add field definition if not exists
        if (!item.fields.find(f => f.field_key === row.field_key)) {
          item.fields.push({
            id: `${row.item_template_id}_${row.field_key}`,
            field_key: row.field_key,
            field_type: row.field_type,
            is_translatable: row.is_translatable
          })
        }
      }
    })

    return Array.from(itemsMap.values())
  }

  private async getPageWithFullContent(pageId: string, options: QueryOptions): Promise<FullPageContent> {
    const language = options.language || this.defaultLanguage
    const startTime = Date.now()

    console.log(`🚀 [UnifiedContent] Deep fetching page ${pageId} with language ${language}`)

    // Step 1: Get page with sections using optimized join
    const { data: pageData, error: pageError } = await this.supabase
      .rpc('get_page_with_sections_working', {
        input_page_id: pageId
      })

    if (pageError) {
      throw new Error(`Failed to fetch page with sections: ${pageError.message}`)
    }

    if (!pageData || pageData.length === 0) {
      throw new Error(`Page ${pageId} not found`)
    }

    // Step 2: Process the joined data
    const processedPage = await this.processPageData(pageData, language)
    
    const queryTime = Date.now() - startTime
    processedPage.metadata = {
      ...processedPage.metadata,
      query_time: queryTime
    }

    console.log(`✅ [UnifiedContent] Deep fetched page with ${processedPage.sections.length} sections in ${queryTime}ms`)

    // Cache the result
    const cacheKey = `page:${pageId}:${language}:deep:true`
    if (options.cache !== false) {
      this.cache.set(cacheKey, processedPage)
    }

    return processedPage
  }

  private async processPageData(rawData: any[], language: string): Promise<FullPageContent> {
    if (!rawData || rawData.length === 0) {
      throw new Error('No page data to process')
    }

    // Extract page info from first row
    const firstRow = rawData[0]
    const page = {
      id: firstRow.page_id,
      name: firstRow.page_name,
      slug: firstRow.page_slug,
      project_id: firstRow.project_id,
      created_at: firstRow.page_created_at,
      updated_at: firstRow.page_updated_at
    }

    // Group sections
    const sectionMap = new Map<string, any>()
    
    rawData.forEach(row => {
      if (!row.section_id) return // Page has no sections
      
      if (!sectionMap.has(row.section_id)) {
        sectionMap.set(row.section_id, {
          section: {
            id: row.section_id,
            name: row.section_name,
            slug: row.section_slug,
            section_template_id: row.section_template_id,
            template_name: row.template_name,
            component_type: row.component_type
          },
          content: {},
          fields: [],
          items: [],
          order_index: row.order_index,
          override_name: row.override_name
        })
      }
    })

    // Process each section's content
    const sections: FullSectionContent[] = []
    for (const sectionData of sectionMap.values()) {
      const processedSection = await this.processSectionContent(sectionData, language)
      sections.push(processedSection)
    }

    // Sort sections by order_index
    sections.sort((a, b) => (a.order_index || 0) - (b.order_index || 0))

    return {
      page,
      sections,
      metadata: {
        total_sections: sections.length,
        cache_key: `page:${page.id}:${language}:deep:true`
      }
    }
  }

  private async processSectionContent(sectionData: any, language: string): Promise<FullSectionContent> {
    const sectionId = sectionData.section.id
    
    // Get section content data using working function
    const { data: contentData, error: contentError } = await this.supabase
      .rpc('get_section_content_working', {
        input_section_id: sectionId
      })

    if (contentError) {
      console.warn(`Failed to fetch content for section ${sectionId}:`, contentError)
    }

    // Process field values
    const fields: ContentField[] = []
    const rawContent: Record<string, any> = {}
    
    if (contentData) {
      contentData.forEach((item: any) => {
        // Prefer translated content over default
        if (item.language_code === language || (!rawContent[item.field_key] && !item.language_code)) {
          rawContent[item.field_key] = item.value
        }
        
        // Collect unique fields
        if (item.content_fields && !fields.find(f => f.id === item.content_fields.id)) {
          fields.push({
            id: item.content_fields.id,
            field_key: item.content_fields.field_key,
            field_type: item.content_fields.field_type,
            is_translatable: item.content_fields.is_translatable,
            config: item.content_fields.config
          })
        }
      })
    }

    // Process fields using existing field processing logic
    const processedContent = await processContentFields(
      rawContent, 
      fields,
      undefined, // No linked items resolution for now
      language
    )

    return {
      ...sectionData,
      content: processedContent,
      fields
    }
  }

  // ========================================================================
  // CACHE MANAGEMENT
  // ========================================================================

  clearCache(): void {
    this.cache.clear()
  }

  invalidateCache(pattern: string): void {
    this.cache.invalidatePattern(pattern)
  }

  getCacheStats() {
    return this.cache.getStats()
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export default UnifiedContentService