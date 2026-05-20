import { ContentWorkerService } from './content-worker.service'

export interface UnifiedContentConfig {
  apiUrl?: string
  deployedVersionId?: string
  useCache?: boolean
  customHeaders?: Record<string, string>
}

export interface QueryOptions {
  language?: string
  includeFullContent?: boolean
  noCache?: boolean
  [key: string]: any
}

export interface ContentField {
  id: string
  field_key?: string
  field_type?: string
  value?: any
  [key: string]: any
}

export interface FullItemContent {
  id: string
  data?: Record<string, any>
  fields?: ContentField[]
  [key: string]: any
}

export interface FullSectionContent {
  id: string
  data?: Record<string, any>
  fields?: ContentField[]
  items?: FullItemContent[]
  [key: string]: any
}

export interface FullPageContent {
  id: string
  sections: FullSectionContent[]
  data?: Record<string, any>
  [key: string]: any
}

export class UnifiedContentService {
  private readonly worker: ContentWorkerService

  constructor(config: UnifiedContentConfig = {}) {
    this.worker = new ContentWorkerService(config)
  }

  getCacheStats(): { enabled: boolean; size: number } { return { enabled: false, size: 0 } }
  clearCache(): void {}

  async getProjects(_options: QueryOptions = {}): Promise<any[]> { return this.worker.getProjects() }
  async getProject(projectId: string, _options: QueryOptions = {}): Promise<any> { return this.worker.getProject(projectId) }
  async getPages(options: QueryOptions = {}): Promise<any[]> { return this.worker.getPages(options.projectId, options.language, options.parentId) }
  async getPagesByProject(projectId: string, options: QueryOptions = {}): Promise<any[]> { return this.worker.getPages(projectId, options.language, options.parentId) }
  async getPage(pageId: string, options: QueryOptions = {}): Promise<FullPageContent | any> {
    if (options.includeFullContent) return this.worker.getPageWithFullContent(pageId, options.projectId, options.language)
    return this.worker.getPage(pageId)
  }
  async getSections(options: QueryOptions = {}): Promise<any[]> { return this.worker.getSections({ projectId: options.projectId, templateId: options.templateId, languageCode: options.language }) }
  async getSectionsByPage(pageId: string, _options: QueryOptions = {}): Promise<any[]> { return this.worker.getPageSections(pageId) }
  async getSection(sectionId: string, _options: QueryOptions = {}): Promise<FullSectionContent | any> { return this.worker.getSection(sectionId) }
  async getItems(options: QueryOptions = {}): Promise<any[]> { return this.worker.getItems(options.templateId, options.language) }
  async getItemsBySection(sectionId: string, options: QueryOptions = {}): Promise<any[]> { return this.worker.getItems(options.templateId || sectionId, options.language) }
  async getItem(itemId: string, _options: QueryOptions = {}): Promise<FullItemContent | any> { return this.worker.getItem(itemId) }
}

export default UnifiedContentService
