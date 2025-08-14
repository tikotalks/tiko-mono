/**
 * Content Worker Service
 * 
 * A proxy implementation of ContentService that routes all calls through the Cloudflare Worker API.
 * This ensures the exact same business logic is used whether accessing content directly or through the worker.
 * The worker itself uses ContentService internally, so behavior is guaranteed to be identical.
 */

import type {
  ContentProject,
  SectionTemplate,
  ContentField,
  ContentPage,
  ContentSection,
  ContentData,
  ItemTemplate,
  Item,
  Language,
  ContentPageSection,
  FieldValue
} from './content.service'

export interface ContentWorkerConfig {
  apiUrl?: string
  deployedVersionId?: string
  useCache?: boolean
  customHeaders?: Record<string, string>
}

export class ContentWorkerService {
  private apiUrl: string
  private deployedVersionId?: string
  private useCache: boolean
  private customHeaders: Record<string, string>

  constructor(config: ContentWorkerConfig = {}) {
    this.apiUrl = config.apiUrl || (import.meta as any).env?.VITE_CONTENT_API_URL || 'https://content.tikoapi.org'
    this.deployedVersionId = config.deployedVersionId || (import.meta as any).env?.VITE_DEPLOYED_VERSION_ID
    this.useCache = config.useCache !== false
    this.customHeaders = config.customHeaders || {}
  }

  /**
   * Make a request to the worker API
   * The worker will use the exact same ContentService logic server-side
   */
  private async makeWorkerRequest<T>(
    method: string, 
    params: Record<string, any> = {},
    skipCache = false
  ): Promise<T> {
    const url = new URL('/query', this.apiUrl)
    
    // Add query parameters
    if (this.deployedVersionId) {
      url.searchParams.set('deployedVersionId', this.deployedVersionId)
    }
    
    if (skipCache || !this.useCache) {
      url.searchParams.set('no-cache', 'true')
    }

    const response = await fetch(url.toString(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...this.customHeaders
      },
      body: JSON.stringify({
        method,
        params
      })
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Worker request failed: ${error}`)
    }

    const result = await response.json()
    
    if (result.error) {
      throw new Error(result.error)
    }

    return result.data
  }

  // =================== PROJECTS ===================
  // All methods simply proxy to the worker, which uses ContentService

  async getProjects(): Promise<ContentProject[]> {
    return this.makeWorkerRequest('getProjects')
  }

  async getProject(id: string): Promise<ContentProject | null> {
    return this.makeWorkerRequest('getProject', { id })
  }

  async getProjectBySlug(slug: string): Promise<ContentProject | null> {
    return this.makeWorkerRequest('getProjectBySlug', { slug })
  }

  // =================== PAGES ===================

  async getPages(projectId?: string, languageCode?: string, parentId?: string | null): Promise<ContentPage[]> {
    return this.makeWorkerRequest('getPages', { projectId, languageCode, parentId })
  }

  async getPage(id: string): Promise<ContentPage | null> {
    return this.makeWorkerRequest('getPage', { id })
  }

  async getPageBySlug(projectId: string, slug: string, languageCode: string): Promise<ContentPage | null> {
    return this.makeWorkerRequest('getPageBySlug', { projectId, slug, languageCode })
  }

  // =================== PAGE SECTIONS ===================

  async getPageSections(pageId: string): Promise<ContentPageSection[]> {
    return this.makeWorkerRequest('getPageSections', { pageId })
  }

  /**
   * Optimized method to get page with all content in minimal database queries
   * This reduces API calls from 20+ to just 1, dramatically improving performance
   */
  async getPageWithFullContent(pageIdOrSlug: string, projectId?: string, language?: string): Promise<any> {
    return this.makeWorkerRequest('getPageWithFullContent', { pageIdOrSlug, projectId, language })
  }

  // =================== SECTIONS ===================

  async getSection(id: string): Promise<ContentSection | null> {
    return this.makeWorkerRequest('getSection', { id })
  }

  async getSections(params?: { projectId?: string; templateId?: string; languageCode?: string }): Promise<ContentSection[]> {
    return this.makeWorkerRequest('getSections', params || {})
  }

  // =================== SECTION TEMPLATES ===================

  async getSectionTemplate(id: string): Promise<SectionTemplate | null> {
    return this.makeWorkerRequest('getSectionTemplate', { id })
  }

  async getSectionTemplates(projectId?: string, languageCode?: string | null): Promise<SectionTemplate[]> {
    return this.makeWorkerRequest('getSectionTemplates', { projectId, languageCode })
  }

  // =================== FIELDS ===================

  async getField(id: string): Promise<ContentField | null> {
    return this.makeWorkerRequest('getField', { id })
  }

  async getFields(sectionTemplateId?: string): Promise<ContentField[]> {
    return this.makeWorkerRequest('getFields', { sectionTemplateId })
  }

  async getFieldsBySectionTemplate(templateId: string): Promise<ContentField[]> {
    return this.makeWorkerRequest('getFieldsBySectionTemplate', { templateId })
  }

  async getFieldsByItemTemplate(templateId: string): Promise<ContentField[]> {
    return this.makeWorkerRequest('getFieldsByItemTemplate', { templateId })
  }

  // =================== CONTENT DATA ===================

  async getSectionContent(sectionId: string, languageCode?: string): Promise<ContentData[]> {
    return this.makeWorkerRequest('getSectionContent', { sectionId, languageCode })
  }

  async getSectionData(sectionId: string, languageCode?: string | null): Promise<Record<string, any>> {
    return this.makeWorkerRequest('getSectionData', { sectionId, languageCode })
  }

  async getFieldValues(pageId: string, languageCode: string): Promise<FieldValue[]> {
    return this.makeWorkerRequest('getFieldValues', { pageId, languageCode })
  }

  // =================== LANGUAGES ===================

  async getLanguages(): Promise<Language[]> {
    return this.makeWorkerRequest('getLanguages')
  }

  // =================== ITEMS ===================

  async getItems(templateId?: string, languageCode?: string | null): Promise<Item[]> {
    return this.makeWorkerRequest('getItems', { templateId, languageCode })
  }

  async getItemsByTemplate(templateId: string, languageCode?: string | null): Promise<Item[]> {
    return this.makeWorkerRequest('getItemsByTemplate', { templateId, languageCode })
  }

  async getItem(id: string): Promise<Item | null> {
    return this.makeWorkerRequest('getItem', { id })
  }

  async getItemBySlug(slug: string, languageCode?: string | null): Promise<Item | null> {
    return this.makeWorkerRequest('getItemBySlug', { slug, languageCode })
  }

  async getItemTranslation(baseItemId: string, languageCode: string): Promise<Item | null> {
    return this.makeWorkerRequest('getItemTranslation', { baseItemId, languageCode })
  }

  async getItemData(itemId: string, includeInherited = false): Promise<Record<string, any>> {
    return this.makeWorkerRequest('getItemData', { itemId, includeInherited })
  }

  async getLinkedItems(itemIds: string[], languageCode?: string): Promise<Item[]> {
    return this.makeWorkerRequest('getLinkedItems', { itemIds, languageCode })
  }

  // =================== ITEM TEMPLATES ===================

  async getItemTemplate(id: string): Promise<ItemTemplate | null> {
    return this.makeWorkerRequest('getItemTemplate', { id })
  }

  async getItemTemplates(): Promise<ItemTemplate[]> {
    return this.makeWorkerRequest('getItemTemplates')
  }

  // =================== WRITE OPERATIONS ===================
  // These are not supported in worker mode for security reasons

  async createProject(): Promise<never> {
    throw new Error('Write operations are not supported in worker mode')
  }

  async updateProject(): Promise<never> {
    throw new Error('Write operations are not supported in worker mode')
  }

  async deleteProject(): Promise<never> {
    throw new Error('Write operations are not supported in worker mode')
  }

  async createSectionTemplate(): Promise<never> {
    throw new Error('Write operations are not supported in worker mode')
  }

  async updateSectionTemplate(): Promise<never> {
    throw new Error('Write operations are not supported in worker mode')
  }

  async deleteSectionTemplate(): Promise<never> {
    throw new Error('Write operations are not supported in worker mode')
  }

  async createField(): Promise<never> {
    throw new Error('Write operations are not supported in worker mode')
  }

  async updateField(): Promise<never> {
    throw new Error('Write operations are not supported in worker mode')
  }

  async deleteField(): Promise<never> {
    throw new Error('Write operations are not supported in worker mode')
  }

  async createPage(): Promise<never> {
    throw new Error('Write operations are not supported in worker mode')
  }

  async updatePage(): Promise<never> {
    throw new Error('Write operations are not supported in worker mode')
  }

  async deletePage(): Promise<never> {
    throw new Error('Write operations are not supported in worker mode')
  }

  async createSection(): Promise<never> {
    throw new Error('Write operations are not supported in worker mode')
  }

  async updateSection(): Promise<never> {
    throw new Error('Write operations are not supported in worker mode')
  }

  async deleteSection(): Promise<never> {
    throw new Error('Write operations are not supported in worker mode')
  }

  async createContent(): Promise<never> {
    throw new Error('Write operations are not supported in worker mode')
  }

  async updateContent(): Promise<never> {
    throw new Error('Write operations are not supported in worker mode')
  }

  async deleteContent(): Promise<never> {
    throw new Error('Write operations are not supported in worker mode')
  }

  async setSectionData(): Promise<never> {
    throw new Error('Write operations are not supported in worker mode')
  }

  async createItem(): Promise<never> {
    throw new Error('Write operations are not supported in worker mode')
  }

  async updateItem(): Promise<never> {
    throw new Error('Write operations are not supported in worker mode')
  }

  async deleteItem(): Promise<never> {
    throw new Error('Write operations are not supported in worker mode')
  }

  async setItemData(): Promise<never> {
    throw new Error('Write operations are not supported in worker mode')
  }

  async createItemTemplate(): Promise<never> {
    throw new Error('Write operations are not supported in worker mode')
  }

  async updateItemTemplate(): Promise<never> {
    throw new Error('Write operations are not supported in worker mode')
  }

  async deleteItemTemplate(): Promise<never> {
    throw new Error('Write operations are not supported in worker mode')
  }

  // =================== CACHE MANAGEMENT ===================

  async refreshCache(method?: string, params?: Record<string, any>): Promise<void> {
    if (method && params) {
      await this.makeWorkerRequest(method, params, true) // Force cache refresh
    }
  }

  async clearCache(options: { authorization: string; versionId?: string; pattern?: string }): Promise<boolean> {
    const response = await fetch(`${this.apiUrl}/cache/clear`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${options.authorization}`,
        ...this.customHeaders
      },
      body: JSON.stringify({
        versionId: options.versionId,
        pattern: options.pattern
      })
    })

    return response.ok
  }
}