/**
 * Content Management Service
 * 
 * Handles all content-related operations including:
 * - Managing projects, pages, sections, and fields
 * - Storing and retrieving multilingual content
 * - Template management
 */

import { authService } from './auth.service'
import { logger } from '../utils/logger'

export interface ContentProject {
  id: string
  name: string
  slug: string
  description?: string
  languages: string[]
  default_language: string
  settings?: Record<string, any>
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface SectionTemplate {
  id: string
  name: string
  slug: string
  description?: string
  language_code?: string // null = global
  component_type: string
  is_reusable: boolean
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface ContentField {
  id: string
  section_template_id: string
  field_key: string
  label: string
  field_type: 'text' | 'textarea' | 'richtext' | 'number' | 'boolean' | 'select' | 'media' | 'media_list' | 'list' | 'object'
  is_required: boolean
  is_translatable: boolean
  default_value?: any
  validation_rules?: Record<string, any>
  config?: Record<string, any>
  order_index: number
}

export interface PageTemplate {
  id: string
  project_id: string
  name: string
  slug: string
  description?: string
  default_sections?: string[]
  page_fields?: Record<string, any>
  is_active: boolean
}

export interface ContentPage {
  id: string
  project_id: string
  template_id?: string
  parent_id?: string
  language_code: string
  slug: string
  title: string
  full_path: string
  is_home: boolean
  is_published: boolean
  page_data?: Record<string, any>
  seo_title?: string
  seo_description?: string
  seo_image?: string
  created_at: string
  updated_at: string
  published_at?: string
}

export interface PageSection {
  page_id: string
  section_template_id: string
  order_index: number
  override_name?: string
}

export interface FieldValue {
  id: string
  page_id: string
  section_template_id?: string
  field_id: string
  language_code: string
  value: any
}

// Additional types needed by useContent composable
export interface ContentSection {
  id: string
  section_template_id: string
  name: string
  slug: string
  description?: string
  language_code?: string
  component_type: string
  is_reusable: boolean
  is_active: boolean
  project_id?: string
  created_at: string
  updated_at: string
}

export interface ContentPageSection {
  page_id: string
  section_id: string
  section_template_id: string
  order_index: number
  override_name?: string
  content_data?: ContentData
}

export interface ContentData {
  id: string
  section_id: string
  field_key: string
  value: any
  language_code: string
  created_at: string
  updated_at: string
}

export interface Language {
  code: string
  name: string
  native_name?: string
  is_active: boolean
}

class ContentService {
  private baseUrl: string

  constructor() {
    this.baseUrl = import.meta.env.VITE_SUPABASE_URL + '/rest/v1'
  }

  private async makeRequest(endpoint: string, options: RequestInit = {}) {
    try {
      const session = await authService.getSession()
      const token = session?.access_token || null
      
      const url = `${this.baseUrl}${endpoint}`
      
      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
          'Authorization': token ? `Bearer ${token}` : '',
          'Prefer': 'return=representation',
          ...options.headers,
        },
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error(`Content API Error: ${response.status} - ${errorText}`)
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      return response.json()
    } catch (error) {
      console.error('Content service error:', error)
      throw error
    }
  }

  // =================== PROJECTS ===================

  async getProjects(): Promise<ContentProject[]> {
    return this.makeRequest('/content_projects?is_active=eq.true&order=name.asc')
  }

  async getProject(id: string): Promise<ContentProject> {
    const result = await this.makeRequest(`/content_projects?id=eq.${id}`)
    return result[0]
  }

  async getProjectBySlug(slug: string): Promise<ContentProject> {
    const result = await this.makeRequest(`/content_projects?slug=eq.${slug}`)
    return result[0]
  }

  async createProject(project: Omit<ContentProject, 'id' | 'created_at' | 'updated_at'>): Promise<ContentProject> {
    const result = await this.makeRequest('/content_projects', {
      method: 'POST',
      body: JSON.stringify(project),
    })
    return Array.isArray(result) ? result[0] : result
  }

  async updateProject(id: string, updates: Partial<ContentProject>): Promise<void> {
    await this.makeRequest(`/content_projects?id=eq.${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    })
  }

  async deleteProject(id: string): Promise<void> {
    await this.makeRequest(`/content_projects?id=eq.${id}`, {
      method: 'DELETE',
    })
  }

  // =================== SECTION TEMPLATES ===================

  async getSectionTemplates(projectId?: string, languageCode?: string): Promise<SectionTemplate[]> {
    let query = '/content_section_templates?is_active=eq.true'
    
    // Filter by language - include global (null) and specific language
    if (languageCode) {
      query += `&or=(language_code.is.null,language_code.eq.${languageCode})`
    }
    
    query += '&order=name.asc'
    
    return this.makeRequest(query)
  }

  async getSectionTemplate(id: string): Promise<SectionTemplate> {
    const result = await this.makeRequest(`/content_section_templates?id=eq.${id}`)
    return result[0]
  }

  async createSectionTemplate(data: Omit<SectionTemplate, 'id' | 'created_at' | 'updated_at'> & { fields?: Omit<ContentField, 'id' | 'section_template_id'>[] }): Promise<SectionTemplate> {
    const { fields, ...template } = data
    
    const result = await this.makeRequest('/content_section_templates', {
      method: 'POST',
      body: JSON.stringify(template),
    })
    const createdSection = Array.isArray(result) ? result[0] : result
    
    // Create fields if provided
    if (fields && fields.length > 0) {
      try {
        await Promise.all(
          fields.map(field =>
            this.createField({
              ...field,
              section_template_id: createdSection.id
            })
          )
        )
      } catch (error) {
        // If field creation fails, delete the section
        await this.deleteSectionTemplate(createdSection.id)
        throw error
      }
    }
    
    return createdSection
  }

  async updateSectionTemplate(id: string, updates: Partial<SectionTemplate> & { fields?: Omit<ContentField, 'id' | 'section_template_id'>[] }): Promise<void> {
    const { fields, ...templateUpdates } = updates
    
    // Update the section template
    await this.makeRequest(`/content_section_templates?id=eq.${id}`, {
      method: 'PATCH',
      body: JSON.stringify(templateUpdates),
    })
    
    // Handle fields if provided
    if (fields !== undefined) {
      try {
        // Get existing fields
        const existingFields = await this.getFieldsBySectionTemplate(id)
        
        // Delete all existing fields
        await Promise.all(
          existingFields.map(field => this.deleteField(field.id))
        )
        
        // Create new fields
        if (fields.length > 0) {
          await Promise.all(
            fields.map(field =>
              this.createField({
                ...field,
                section_template_id: id
              })
            )
          )
        }
      } catch (error) {
        console.error('Failed to update fields for section template:', error)
        // Don't throw - template update succeeded even if field update failed
      }
    }
  }

  async deleteSectionTemplate(id: string): Promise<void> {
    await this.makeRequest(`/content_section_templates?id=eq.${id}`, {
      method: 'DELETE',
    })
  }

  // =================== FIELDS ===================

  async getFieldsBySectionTemplate(sectionTemplateId: string): Promise<ContentField[]> {
    return this.makeRequest(
      `/content_fields?section_template_id=eq.${sectionTemplateId}&order=order_index.asc`
    )
  }

  async createField(field: Omit<ContentField, 'id'>): Promise<ContentField> {
    const result = await this.makeRequest('/content_fields', {
      method: 'POST',
      body: JSON.stringify(field),
    })
    return Array.isArray(result) ? result[0] : result
  }

  async updateField(id: string, updates: Partial<ContentField>): Promise<void> {
    await this.makeRequest(`/content_fields?id=eq.${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    })
  }

  async deleteField(id: string): Promise<void> {
    await this.makeRequest(`/content_fields?id=eq.${id}`, {
      method: 'DELETE',
    })
  }

  // =================== PAGE TEMPLATES ===================

  async getPageTemplates(projectId: string): Promise<PageTemplate[]> {
    return this.makeRequest(
      `/content_page_templates?project_id=eq.${projectId}&is_active=eq.true&order=name.asc`
    )
  }

  async createPageTemplate(template: Omit<PageTemplate, 'id'>): Promise<PageTemplate> {
    const result = await this.makeRequest('/content_page_templates', {
      method: 'POST',
      body: JSON.stringify(template),
    })
    return Array.isArray(result) ? result[0] : result
  }

  // =================== PAGES ===================

  async getPages(projectId?: string, languageCode?: string): Promise<ContentPage[]> {
    let query = '/content_pages?'
    
    if (projectId) {
      query += `project_id=eq.${projectId}&`
    }
    
    if (languageCode) {
      query += `language_code=eq.${languageCode}&`
    }
    
    query += 'order=full_path.asc'
    
    return this.makeRequest(query)
  }

  async getPage(id: string): Promise<ContentPage> {
    const result = await this.makeRequest(`/content_pages?id=eq.${id}`)
    return result[0]
  }

  async getPageBySlug(projectId: string, slug: string, languageCode: string): Promise<ContentPage> {
    const result = await this.makeRequest(
      `/content_pages?project_id=eq.${projectId}&slug=eq.${slug}&language_code=eq.${languageCode}`
    )
    return result[0]
  }

  async createPage(page: Omit<ContentPage, 'id' | 'full_path' | 'created_at' | 'updated_at'>): Promise<ContentPage> {
    const result = await this.makeRequest('/content_pages', {
      method: 'POST',
      body: JSON.stringify(page),
    })
    return Array.isArray(result) ? result[0] : result
  }

  async updatePage(id: string, updates: Partial<ContentPage>): Promise<void> {
    await this.makeRequest(`/content_pages?id=eq.${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    })
  }

  async deletePage(id: string): Promise<void> {
    await this.makeRequest(`/content_pages?id=eq.${id}`, {
      method: 'DELETE',
    })
  }

  // =================== PAGE SECTIONS ===================

  async getPageSections(pageId: string): Promise<ContentPageSection[]> {
    const sections = await this.makeRequest(
      `/content_page_sections?page_id=eq.${pageId}&order=order_index.asc`
    )
    
    // Map PageSection to ContentPageSection format
    return sections.map((s: any) => ({
      page_id: s.page_id,
      section_id: s.section_template_id,
      section_template_id: s.section_template_id,
      order_index: s.order_index,
      override_name: s.override_name,
      content_data: undefined
    }))
  }

  async setPageSections(pageId: string, sections: any[]): Promise<void> {
    // Delete existing sections
    await this.makeRequest(`/content_page_sections?page_id=eq.${pageId}`, {
      method: 'DELETE',
    })

    // Insert new sections
    if (sections.length > 0) {
      const sectionsWithPageId = sections.map(s => {
        // Clean up the data - only send what the database expects
        const { page_id, ...sectionData } = s
        return {
          page_id: pageId,
          section_template_id: sectionData.section_template_id,
          order_index: sectionData.order_index || 0,
          override_name: sectionData.override_name || null
        }
      })
      await this.makeRequest('/content_page_sections', {
        method: 'POST',
        body: JSON.stringify(sectionsWithPageId),
      })
    }
  }

  // =================== FIELD VALUES ===================

  async getFieldValues(pageId: string, languageCode: string): Promise<FieldValue[]> {
    return this.makeRequest(
      `/content_field_values?page_id=eq.${pageId}&language_code=eq.${languageCode}`
    )
  }

  async setFieldValue(value: Omit<FieldValue, 'id'>): Promise<void> {
    // Upsert the field value
    await this.makeRequest('/content_field_values', {
      method: 'POST',
      body: JSON.stringify(value),
      headers: {
        'Prefer': 'resolution=merge-duplicates'
      }
    })
  }

  async setFieldValues(values: Omit<FieldValue, 'id'>[]): Promise<void> {
    if (values.length === 0) return

    // Upsert all field values
    await this.makeRequest('/content_field_values', {
      method: 'POST',
      body: JSON.stringify(values),
      headers: {
        'Prefer': 'resolution=merge-duplicates'
      }
    })
  }

  // =================== LANGUAGES ===================

  async getLanguages(): Promise<Language[]> {
    // This would typically come from a languages table or configuration
    // For now, return a default set of languages
    return [
      { code: 'en', name: 'English', native_name: 'English', is_active: true },
      { code: 'es', name: 'Spanish', native_name: 'Español', is_active: true },
      { code: 'fr', name: 'French', native_name: 'Français', is_active: true },
      { code: 'de', name: 'German', native_name: 'Deutsch', is_active: true },
      { code: 'it', name: 'Italian', native_name: 'Italiano', is_active: true },
      { code: 'pt', name: 'Portuguese', native_name: 'Português', is_active: true },
      { code: 'nl', name: 'Dutch', native_name: 'Nederlands', is_active: true },
      { code: 'ru', name: 'Russian', native_name: 'Русский', is_active: true },
      { code: 'pl', name: 'Polish', native_name: 'Polski', is_active: true },
      { code: 'sv', name: 'Swedish', native_name: 'Svenska', is_active: true },
      { code: 'ro', name: 'Romanian', native_name: 'Română', is_active: true },
      { code: 'el', name: 'Greek', native_name: 'Ελληνικά', is_active: true }
    ]
  }

  // =================== SECTION INSTANCES ===================

  async getSections(projectId?: string, languageCode?: string): Promise<ContentSection[]> {
    let query = '/content_sections?is_active=eq.true'
    
    if (projectId) {
      query += `&project_id=eq.${projectId}`
    }
    
    if (languageCode) {
      query += `&language_code=eq.${languageCode}`
    }
    
    query += '&order=name.asc'
    
    return this.makeRequest(query)
  }

  async createSection(data: Omit<ContentSection, 'id' | 'created_at' | 'updated_at'>): Promise<ContentSection> {
    const result = await this.makeRequest('/content_sections', {
      method: 'POST',
      body: JSON.stringify(data),
    })
    return Array.isArray(result) ? result[0] : result
  }

  async updateSection(id: string, updates: Partial<ContentSection>): Promise<void> {
    await this.makeRequest(`/content_sections?id=eq.${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    })
  }

  async deleteSection(id: string): Promise<void> {
    await this.makeRequest(`/content_sections?id=eq.${id}`, {
      method: 'DELETE',
    })
  }

  // =================== SECTIONS (Alias for Section Templates) ===================

  async getSection(idOrSlug: string): Promise<ContentSection | null> {
    try {
      // Try to get by ID first
      let result = await this.makeRequest(`/content_section_templates?id=eq.${idOrSlug}`)
      if (!result.length) {
        // Try by slug
        result = await this.makeRequest(`/content_section_templates?slug=eq.${idOrSlug}`)
      }
      
      if (!result.length) return null
      
      const template = result[0]
      // Map SectionTemplate to ContentSection format
      return {
        id: template.id,
        name: template.name,
        slug: template.slug,
        description: template.description,
        language_code: template.language_code,
        component_type: template.component_type,
        is_reusable: template.is_reusable,
        is_active: template.is_active,
        created_at: template.created_at,
        updated_at: template.updated_at
      }
    } catch (error) {
      console.error('Error getting section:', error)
      return null
    }
  }

  async getSectionContent(sectionId: string, language?: string): Promise<ContentData[]> {
    try {
      // This would query a content_data table
      // For now, return empty array as the table structure might not exist yet
      console.warn('getSectionContent not fully implemented - requires content_data table')
      return []
    } catch (error) {
      console.error('Error getting section content:', error)
      return []
    }
  }

  async updateContent(contentId: string, updates: Partial<ContentData>): Promise<void> {
    try {
      // This would update a content_data table
      console.warn('updateContent not fully implemented - requires content_data table')
    } catch (error) {
      console.error('Error updating content:', error)
      throw error
    }
  }

  async createContent(data: {
    section_id: string
    field_key: string
    value: any
    language_code?: string
  }): Promise<ContentData> {
    try {
      // This would create in a content_data table
      console.warn('createContent not fully implemented - requires content_data table')
      
      // Return a mock ContentData for now
      return {
        id: `mock-${Date.now()}`,
        section_id: data.section_id,
        field_key: data.field_key,
        value: data.value,
        language_code: data.language_code || 'en',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    } catch (error) {
      console.error('Error creating content:', error)
      throw error
    }
  }

  // =================== CONTENT RETRIEVAL ===================

  async getPageContent(projectSlug: string, pageSlug: string, languageCode: string): Promise<{
    page: ContentPage
    sections: Array<{
      template: SectionTemplate
      fields: ContentField[]
      values: Record<string, any>
    }>
  }> {
    // Get project
    const projects = await this.makeRequest(`/content_projects?slug=eq.${projectSlug}`)
    if (!projects.length) throw new Error('Project not found')
    const project = projects[0]

    // Get page
    const page = await this.getPageBySlug(project.id, pageSlug, languageCode)
    if (!page) throw new Error('Page not found')

    // Get page sections - map PageSection to ContentPageSection format
    const rawPageSections = await this.getPageSections(page.id)
    const pageSections: ContentPageSection[] = rawPageSections.map(ps => ({
      page_id: ps.page_id,
      section_id: ps.section_template_id, // Map template_id to section_id
      section_template_id: ps.section_template_id,
      order_index: ps.order_index,
      override_name: ps.override_name,
      content_data: undefined // Would come from field values
    }))

    // Get section templates
    const sectionIds = pageSections.map(ps => ps.section_template_id)
    const sections = await Promise.all(sectionIds.map(id => this.getSectionTemplate(id)))

    // Get fields and values for each section
    const sectionsWithContent = await Promise.all(
      sections.map(async (template, index) => {
        const fields = await this.getFieldsBySectionTemplate(template.id)
        const values = await this.getFieldValues(page.id, languageCode)
        
        // Convert values array to object keyed by field_key
        const valueMap: Record<string, any> = {}
        values
          .filter(v => v.section_template_id === template.id)
          .forEach(v => {
            const field = fields.find(f => f.id === v.field_id)
            if (field) {
              valueMap[field.field_key] = v.value
            }
          })

        return {
          template,
          fields,
          values: valueMap
        }
      })
    )

    return {
      page,
      sections: sectionsWithContent
    }
  }
}

// Export singleton instance
export const contentService = new ContentService()