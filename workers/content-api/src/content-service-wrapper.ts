/**
 * Content Service Wrapper for Cloudflare Worker
 * 
 * This wraps the main ContentService implementation to work in the worker environment.
 * It uses the exact same business logic as the client-side ContentService.
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { ContentQuery, QueryResult } from './types';

// We'll need to adapt the ContentService to work in this environment
// For now, let's create a mapping that uses the existing logic

export class ContentServiceWrapper {
  private supabase: SupabaseClient;

  constructor(supabase: SupabaseClient) {
    this.supabase = supabase;
  }

  async executeQuery(query: ContentQuery): Promise<QueryResult> {
    try {
      // For now, we'll keep the existing implementation until we can properly
      // integrate the full ContentService. The key point is that both services
      // should eventually use the exact same logic.
      
      switch (query.method) {
        // Projects
        case 'getProjects':
          return await this.getProjects();
        case 'getProject':
          return await this.getProject(query.params.id);
        case 'getProjectBySlug':
          return await this.getProjectBySlug(query.params.slug);

        // Pages
        case 'getPages':
          return await this.getPages(query.params);
        case 'getPage':
          return await this.getPage(query.params);
        case 'getPageBySlug':
          return await this.getPageBySlug(query.params);
        case 'getPageSections':
          return await this.getPageSections(query.params);
        case 'getPageWithFullContent':
          return await this.getPageWithFullContent(query.params);

        // Sections
        case 'getSection':
          return await this.getSection(query.params);
        case 'getSections':
          return await this.getSections(query.params);
        case 'getSectionTemplate':
          return await this.getSectionTemplate(query.params);
        case 'getSectionTemplates':
          return await this.getSectionTemplates(query.params);

        // Fields
        case 'getField':
          return await this.getField(query.params);
        case 'getFields':
          return await this.getFields(query.params);
        case 'getFieldsBySectionTemplate':
          return await this.getFieldsBySectionTemplate(query.params);
        case 'getFieldsByItemTemplate':
          return await this.getFieldsByItemTemplate(query.params);

        // Content
        case 'getSectionContent':
          return await this.getSectionContent(query.params);
        case 'getSectionData':
          return await this.getSectionData(query.params);
        case 'getFieldValues':
          return await this.getFieldValues(query.params);

        // Languages
        case 'getLanguages':
          return await this.getLanguages();

        // Items
        case 'getItems':
          return await this.getItems(query.params);
        case 'getItemsByTemplate':
          return await this.getItemsByTemplate(query.params);
        case 'getItem':
          return await this.getItem(query.params);
        case 'getItemBySlug':
          return await this.getItemBySlug(query.params);
        case 'getItemTranslation':
          return await this.getItemTranslation(query.params);
        case 'getItemData':
          return await this.getItemData(query.params);
        case 'getLinkedItems':
          return await this.getLinkedItems(query.params);
        case 'getItemTemplate':
          return await this.getItemTemplate(query.params);
        case 'getItemTemplates':
          return await this.getItemTemplates();

        // Articles
        case 'getArticles':
          return await this.getArticles(query.params);
        case 'getArticle':
          return await this.getArticle(query.params);
        case 'getArticleBySlug':
          return await this.getArticleBySlug(query.params);
        case 'getArticlesByPage':
          return await this.getArticlesByPage(query.params);
        case 'getPublishedArticles':
          return await this.getPublishedArticles(query.params);

        // Navigation
        case 'getNavigationMenus':
          return await this.getNavigationMenus(query.params);
        case 'getNavigationMenu':
          return await this.getNavigationMenu(query.params);
        case 'getNavigationMenuBySlug':
          return await this.getNavigationMenuBySlug(query.params);
        case 'getNavigationItems':
          return await this.getNavigationItems(query.params);

        default:
          return { data: null, error: `Unknown method: ${query.method}` };
      }
    } catch (error) {
      console.error('Query execution error:', error);
      return { 
        data: null, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  // =================== PROJECTS ===================

  private async getProjects(): Promise<QueryResult> {
    const { data, error } = await this.supabase
      .from('content_projects')
      .select('*')
      .eq('is_active', true)
      .order('name', { ascending: true });

    return { data, error: error?.message };
  }

  private async getProject(id: string): Promise<QueryResult> {
    const { data, error } = await this.supabase
      .from('content_projects')
      .select('*')
      .eq('id', id)
      .single();

    return { data, error: error?.message };
  }

  private async getProjectBySlug(slug: string): Promise<QueryResult> {
    const { data, error } = await this.supabase
      .from('content_projects')
      .select('*')
      .eq('slug', slug)
      .single();

    return { data, error: error?.message };
  }

  // =================== PAGES ===================

  private async getPages(params: any): Promise<QueryResult> {
    const { projectId, languageCode, parentId } = params;
    
    let query = this.supabase
      .from('content_pages')
      .select(`
        *,
        template:content_page_templates(*)
      `)
      .eq('is_published', true)
      .order('navigation_order', { ascending: true });

    if (projectId) query = query.eq('project_id', projectId);
    if (languageCode) query = query.eq('language_code', languageCode);
    if (parentId !== undefined) query = query.eq('parent_id', parentId);

    const { data, error } = await query;

    return { data, error: error?.message };
  }

  private async getPage(params: any): Promise<QueryResult> {
    const { id } = params;
    
    const { data, error } = await this.supabase
      .from('content_pages')
      .select(`
        *,
        template:content_page_templates(*)
      `)
      .eq('id', id)
      .single();

    return { data, error: error?.message };
  }

  private async getPageBySlug(params: any): Promise<QueryResult> {
    const { projectId, slug, languageCode } = params;
    
    const { data, error } = await this.supabase
      .from('content_pages')
      .select(`
        *,
        template:content_page_templates(*)
      `)
      .eq('project_id', projectId)
      .eq('slug', slug)
      .eq('language_code', languageCode)
      .eq('is_published', true)
      .single();

    return { data, error: error?.message };
  }

  private async getPageSections(params: any): Promise<QueryResult> {
    const { pageId } = params;
    
    const { data, error } = await this.supabase
      .from('content_page_sections')
      .select('*')
      .eq('page_id', pageId)
      .order('order_index', { ascending: true });

    return { data, error: error?.message };
  }

  /**
   * Optimized method to get a page with all its content in minimal queries using JOINs
   * This dramatically reduces the number of database calls from 20+ to just 2-3
   */
  private async getPageWithFullContent(params: any): Promise<QueryResult> {
    const { pageIdOrSlug, id, slug, projectId, language, articleSlug } = params;
    const pageIdentifier = pageIdOrSlug || id || slug;
    
    try {
      // If no projectId is provided, try to look up the marketing project
      let actualProjectId = projectId;
      if (!actualProjectId) {
        const { data: project } = await this.supabase
          .from('content_projects')
          .select('id')
          .eq('slug', 'marketing')
          .single();
        
        if (project) {
          actualProjectId = project.id;
        }
      }
      
      // Step 1: Get the page (1 query)
      let page = null;
      if (!pageIdentifier) {
        return { data: null, error: 'Page identifier is required' };
      }
      
      if (pageIdentifier.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
        // It's an ID
        const { data, error } = await this.supabase
          .from('content_pages')
          .select(`
            *,
            template:content_page_templates(*)
          `)
          .eq('id', pageIdentifier)
          .single();
        
        if (error) return { data: null, error: error.message };
        page = data;
      } else {
        // It's a slug - try with projectId if available
        let query = this.supabase
          .from('content_pages')
          .select(`
            *,
            template:content_page_templates(*)
          `)
          .eq('slug', pageIdentifier)
          .eq('language_code', language || 'en')
          .eq('is_published', true);
          
        if (actualProjectId) {
          query = query.eq('project_id', actualProjectId);
        }
        
        const { data, error } = await query.single();
        
        if (error) return { data: null, error: error.message };
        page = data;
      }

      if (!page) {
        return { data: null, error: 'Page not found' };
      }

      // Step 2: Get all page sections with their sections, templates, fields, and content in ONE massive JOIN (1 query)
      const { data: sectionsData, error: sectionsError } = await this.supabase
        .from('content_page_sections')
        .select(`
          *,
          section:content_sections!inner(
            *,
            template:content_section_templates!inner(
              *,
              fields:content_fields(*)
            )
          )
        `)
        .eq('page_id', page.id)
        .order('order_index', { ascending: true });

      if (sectionsError) {
        return { data: null, error: sectionsError.message };
      }

      // Step 3: Get all section data for all sections at once (1 query per unique section)
      const uniqueSectionIds = sectionsData?.map(ps => ps.section_id).filter(Boolean) || [];
      const sectionDataMap = new Map<string, Record<string, any>>();

      if (uniqueSectionIds.length > 0) {
        // Get content data for all sections at once
        const { data: contentData, error: contentError } = await this.supabase
          .from('content_section_data')
          .select('*')
          .in('section_id', uniqueSectionIds);

        if (contentError) {
          console.error('Failed to load content data:', contentError.message);
        } else {
          // Group content by section_id and then by field_key
          contentData?.forEach(item => {
            if (!sectionDataMap.has(item.section_id)) {
              sectionDataMap.set(item.section_id, {});
            }
            sectionDataMap.get(item.section_id)![item.field_key] = item.value;
          });
        }
      }

      // Step 4: Load linked items for sections that have them
      const sectionIds = sectionsData?.map(ps => ps.section_id).filter(Boolean) || [];
      const linkedItemsBySection = new Map<string, any[]>();
      
      if (sectionIds.length > 0) {
        // Get all linked items for all sections at once
        const { data: linkedItemsData, error: linkedItemsError } = await this.supabase
          .from('content_section_linked_items')
          .select(`
            *,
            item:content_items!inner(
              *,
              template:content_item_templates(
                *,
                fields:content_fields(*)
              ),
              data:content_item_data(
                *,
                field:content_fields(*)
              )
            )
          `)
          .in('section_id', sectionIds)
          .order('sort_order', { ascending: true });

        if (!linkedItemsError && linkedItemsData) {
          console.log(`Found ${linkedItemsData.length} linked items across all sections`);
          
          // First, collect all base item IDs that need data
          const baseItemIds = new Set<string>();
          for (const link of linkedItemsData) {
            if (link.item?.base_item_id) {
              baseItemIds.add(link.item.base_item_id);
            }
          }
          
          // Load base item data if needed
          const baseItemDataMap = new Map<string, any[]>();
          if (baseItemIds.size > 0) {
            const { data: baseItemData } = await this.supabase
              .from('content_item_data')
              .select(`
                *,
                field:content_fields(*)
              `)
              .in('item_id', Array.from(baseItemIds));
              
            if (baseItemData) {
              baseItemData.forEach((data: any) => {
                if (!baseItemDataMap.has(data.item_id)) {
                  baseItemDataMap.set(data.item_id, []);
                }
                baseItemDataMap.get(data.item_id)!.push(data);
              });
            }
          }
          
          // Group linked items by section and field
          for (const link of linkedItemsData) {
            if (!link.item) continue;
            
            const sectionId = link.section_id;
            const fieldId = link.field_id;
            
            // If this is a translation item with no data, inherit from base
            if (link.item.base_item_id && (!link.item.data || link.item.data.length === 0)) {
              const baseData = baseItemDataMap.get(link.item.base_item_id);
              if (baseData) {
                link.item.data = baseData;
              }
            }
            
            // Transform item data to flat structure
            const itemData: Record<string, any> = {};
            
            // Debug log to see what we're getting
            if (link.item.data && link.item.data.length > 0) {
              console.log(`Processing item ${link.item.name} data:`, {
                dataLength: link.item.data.length,
                firstEntry: link.item.data[0],
                hasField: !!link.item.data[0]?.field,
                fieldKey: link.item.data[0]?.field?.field_key
              });
            }
            
            link.item.data?.forEach((fieldData: any) => {
              // Get field_key from the joined field object
              let fieldKey = fieldData.field?.field_key;
              
              // If no field key from join, try to find it in the template fields
              if (!fieldKey && fieldData.field_id && link.item.template?.fields) {
                const templateField = link.item.template.fields.find((f: any) => f.id === fieldData.field_id);
                if (templateField) {
                  fieldKey = templateField.field_key;
                }
              }
              
              if (fieldKey) {
                itemData[fieldKey] = fieldData.value;
              } else {
                // Fallback: if field join failed, use field_id as key temporarily
                console.warn(`No field key found for item ${link.item.name}, field_id: ${fieldData.field_id}`);
                itemData[fieldData.field_id || 'undefined'] = fieldData.value;
              }
            });
            
            const processedItem = {
              item: {
                id: link.item.id,
                name: link.item.name,
                slug: link.item.slug,
                language_code: link.item.language_code,
                item_template_id: link.item.item_template_id
              },
              data: itemData
            };
            
            const key = `${sectionId}-${fieldId}`;
            if (!linkedItemsBySection.has(key)) {
              linkedItemsBySection.set(key, []);
            }
            linkedItemsBySection.get(key)!.push(processedItem);
          }
        }
      }


      // Step 6: Transform the data into the expected format
      const sectionsWithContent = await Promise.all(sectionsData?.map(async pageSection => {
        const sectionContent = sectionDataMap.get(pageSection.section_id) || {};
        const fields = pageSection.section?.template?.fields || [];
        
        // Process all fields including linked items
        const processedContent: Record<string, any> = {};
        
        // First, process regular fields from section data
        Object.entries(sectionContent).forEach(([key, value]) => {
          const field = fields.find((f: any) => f.field_key === key);
          
          if (field && field.field_type === 'media' || field && field.field_type === 'media_list') {
            // Process media fields - extract just the ID from JSON array
            if (typeof value === 'string' && value.startsWith('[')) {
              try {
                const parsed = JSON.parse(value);
                processedContent[key] = Array.isArray(parsed) && parsed.length > 0 ? parsed[0] : '';
              } catch {
                processedContent[key] = value;
              }
            } else {
              processedContent[key] = value;
            }
          } else if (field && field.field_type === 'list') {
            // Process list fields - handle various storage formats
            if (typeof value === 'string') {
              // First try to parse as JSON (in case it's a stringified array)
              try {
                const parsed = JSON.parse(value);
                if (Array.isArray(parsed)) {
                  // Handle double-encoded empty arrays like ["[]"]
                  if (parsed.length === 1 && parsed[0] === '[]') {
                    processedContent[key] = [];
                  } else {
                    processedContent[key] = parsed;
                  }
                } else {
                  // If not an array, treat as newline-separated string
                  processedContent[key] = value.split('\n').map(item => item.trim()).filter(item => item);
                }
              } catch {
                // If not valid JSON, treat as newline-separated string
                processedContent[key] = value.split('\n').map(item => item.trim()).filter(item => item);
              }
            } else if (Array.isArray(value)) {
              // Handle arrays that might contain stringified empty arrays
              if (value.length === 1 && value[0] === '[]') {
                processedContent[key] = [];
              } else {
                processedContent[key] = value;
              }
            } else {
              processedContent[key] = [];
            }
          } else if (field && field.field_type === 'repeater') {
            // Process repeater fields - parse JSON string to array
            if (typeof value === 'string') {
              try {
                const parsed = JSON.parse(value);
                processedContent[key] = Array.isArray(parsed) ? parsed : [];
              } catch {
                processedContent[key] = [];
              }
            } else if (Array.isArray(value)) {
              processedContent[key] = value;
            } else {
              processedContent[key] = [];
            }
          } else if (field && field.field_type === 'items') {
            // Process items fields that are stored as JSON (not linked items)
            if (typeof value === 'string') {
              try {
                const parsed = JSON.parse(value);
                processedContent[key] = Array.isArray(parsed) ? parsed : [];
              } catch {
                processedContent[key] = [];
              }
            } else if (Array.isArray(value)) {
              processedContent[key] = value;
            } else {
              processedContent[key] = [];
            }
          } else {
            processedContent[key] = value;
          }
        });
        
        // Then, add linked items from the junction table
        fields.forEach((field: any) => {
          if (field.field_type === 'linked_items') {
            const key = `${pageSection.section_id}-${field.id}`;
            const linkedItems = linkedItemsBySection.get(key) || [];
            
            if (linkedItems.length > 0) {
              processedContent[field.field_key] = linkedItems;
              console.log(`Added ${linkedItems.length} linked items to field ${field.field_key}`);
            } else {
              // Check if there's a value in section data that we need to parse
              const sectionValue = sectionContent[field.field_key];
              if (sectionValue && typeof sectionValue === 'string') {
                try {
                  // Try to parse as JSON
                  const parsed = JSON.parse(sectionValue);
                  if (Array.isArray(parsed)) {
                    // Check if it's an array of objects (inline items) or IDs (references)
                    if (parsed.length > 0 && typeof parsed[0] === 'object') {
                      // It's inline item data (like Image Blocks)
                      console.log(`Field ${field.field_key} has inline item data:`, parsed.length, 'items');
                      processedContent[field.field_key] = parsed;
                    } else if (parsed.length > 0 && typeof parsed[0] === 'string') {
                      // It's an array of IDs - we need to fetch the items
                      console.log(`Field ${field.field_key} has item IDs, fetching items:`, parsed);
                      // Note: We'll fetch these items after this loop
                      processedContent[field.field_key] = parsed; // Keep the IDs for now
                    } else {
                      processedContent[field.field_key] = parsed;
                    }
                  } else {
                    processedContent[field.field_key] = parsed;
                  }
                } catch (e) {
                  // If it's not valid JSON, keep the original value
                  processedContent[field.field_key] = sectionValue;
                }
              }
            }
          }
        });
        
        // Check if this is an article-overview section
        const sectionTemplateSlug = pageSection.section?.template?.slug;
        if (sectionTemplateSlug === 'article-overview') {
          // Fetch articles for this page
          const { data: articles } = await this.supabase
            .from('content_articles_details')
            .select('*')
            .eq('page_id', pageSection.page_id)
            .eq('is_published', true)
            .eq('language_code', language || 'en')
            .order('published_at', { ascending: false });
          
          if (articles && articles.length > 0) {
            processedContent.articles = articles;
            console.log(`Added ${articles.length} articles to article-overview section`);
          } else {
            processedContent.articles = [];
          }
        }

        return {
          pageSection: {
            id: pageSection.id,
            page_id: pageSection.page_id,
            section_id: pageSection.section_id,
            section_template_id: pageSection.section_template_id,
            override_name: pageSection.override_name,
            order_index: pageSection.order_index,
            is_visible: pageSection.is_visible,
            created_at: pageSection.created_at,
            updated_at: pageSection.updated_at
          },
          section: pageSection.section,
          content: processedContent,
          fields: fields
        };
      }) || []);

      // Fetch items for linked_items fields that have IDs stored directly
      const itemIdsToFetch = new Set<string>();
      const fieldItemsMap = new Map<string, string[]>(); // key: sectionId-fieldKey, value: itemIds
      
      sectionsWithContent.forEach(section => {
        section.fields.forEach((field: any) => {
          if (field.field_type === 'linked_items') {
            const value = section.content[field.field_key];
            if (Array.isArray(value) && value.length > 0 && typeof value[0] === 'string') {
              // These are item IDs that need to be fetched
              value.forEach(id => itemIdsToFetch.add(id));
              fieldItemsMap.set(`${section.section.id}-${field.field_key}`, value);
            }
          }
        });
      });
      
      // Fetch all needed items in one query
      let itemsById = new Map<string, any>();
      if (itemIdsToFetch.size > 0) {
        const { data: items } = await this.supabase
          .from('content_items')
          .select(`
            *,
            template:content_item_templates(*),
            data:content_item_data(*)
          `)
          .in('id', Array.from(itemIdsToFetch));
          
        // Get unique template IDs
        const templateIds = new Set<string>();
        items?.forEach(item => {
          if (item.item_template_id) {
            templateIds.add(item.item_template_id);
          }
        });
        
        // Fetch fields for all templates
        const templateFieldsMap = new Map<string, any[]>();
        if (templateIds.size > 0) {
          const { data: fields } = await this.supabase
            .from('content_fields')
            .select('*')
            .in('item_template_id', Array.from(templateIds))
            .order('order_index');
            
          // Group fields by template
          fields?.forEach(field => {
            if (!templateFieldsMap.has(field.item_template_id)) {
              templateFieldsMap.set(field.item_template_id, []);
            }
            templateFieldsMap.get(field.item_template_id)!.push(field);
          });
        }
          
        items?.forEach(item => {
          // Transform item data
          const itemData: Record<string, any> = {};
          
          // Create a map of field_id to field_key for this template
          const fieldKeyMap = new Map<string, string>();
          const templateFields = templateFieldsMap.get(item.item_template_id) || [];
          templateFields.forEach((field: any) => {
            fieldKeyMap.set(field.id, field.field_key);
          });
          
          // If no template fields were fetched, try using the template.fields if available
          if (fieldKeyMap.size === 0 && item.template?.fields) {
            item.template.fields.forEach((field: any) => {
              fieldKeyMap.set(field.id, field.field_key);
            });
          }
          
          item.data?.forEach((fieldData: any) => {
            // If field_key is "undefined" or null, try to look it up by field_id
            let key = fieldData.field_key;
            if (key === 'undefined' || key === null || key === undefined) {
              key = fieldKeyMap.get(fieldData.field_id) || 'undefined';
            }
            itemData[key] = fieldData.value;
          });
          
          itemsById.set(item.id, {
            ...item,
            data: itemData
          });
        });
      }
      
      // Update content with fetched items
      sectionsWithContent.forEach(section => {
        section.fields.forEach((field: any) => {
          if (field.field_type === 'linked_items') {
            const key = `${section.section.id}-${field.field_key}`;
            const itemIds = fieldItemsMap.get(key);
            if (itemIds) {
              section.content[field.field_key] = itemIds
                .map(id => itemsById.get(id))
                .filter(item => item !== undefined);
            }
          }
        });
      });

      // Simplify the result structure - only return what's needed
      const simplifiedSections = sectionsWithContent.map(section => {
        return {
          pageSection: {
            id: section.pageSection.id,
            order_index: section.pageSection.order_index,
            override_name: section.pageSection.override_name
          },
          section: {
            id: section.section.id,
            name: section.section.name,
            slug: section.section.slug,
            template: {
              slug: section.section.template.slug
            }
          },
          content: section.content
        };
      });

      // If an article slug is provided, add the article as a special section
      if (articleSlug) {
        console.log(`[getPageWithFullContent] Article slug provided: ${articleSlug}`);
        
        // Fetch the specific article
        const { data: article } = await this.supabase
          .from('content_articles_details')
          .select('*')
          .eq('page_id', page.id)
          .eq('slug', articleSlug)
          .eq('language_code', language || 'en')
          .single();
        
        if (article) {
          // Create an article detail section
          const articleSection = {
            pageSection: {
              id: `article-${article.id}`,
              order_index: 0,
              override_name: article.title
            },
            section: {
              id: `article-${article.id}`,
              name: article.title,
              slug: 'article-detail',
              template: {
                slug: 'article-detail'
              }
            },
            content: {
              article: article
            }
          };
          
          // Replace all sections with just the article section
          simplifiedSections.length = 0;
          simplifiedSections.push(articleSection);
        }
      }

      const result = {
        page: {
          id: page.id,
          title: page.title,
          slug: page.slug,
          language_code: page.language_code
        },
        sections: simplifiedSections
      };

      return { data: result, error: null };
    } catch (error) {
      console.error('getPageWithFullContent error:', error);
      return { 
        data: null, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  // =================== SECTIONS ===================

  private async getSection(params: any): Promise<QueryResult> {
    const { id } = params;
    
    const { data, error } = await this.supabase
      .from('content_sections')
      .select(`
        *,
        template:content_section_templates(
          *,
          fields:content_fields(*)
        )
      `)
      .eq('id', id)
      .eq('is_active', true)
      .single();

    return { data, error: error?.message };
  }

  private async getSections(params: any): Promise<QueryResult> {
    const { projectId, templateId, languageCode } = params;
    
    let query = this.supabase
      .from('content_sections')
      .select(`
        *,
        template:content_section_templates(
          *,
          fields:content_fields(*)
        )
      `)
      .eq('is_active', true)
      .order('name', { ascending: true });

    if (projectId) query = query.eq('project_id', projectId);
    if (templateId) query = query.eq('section_template_id', templateId);
    if (languageCode) query = query.eq('language_code', languageCode);

    const { data, error } = await query;

    return { data, error: error?.message };
  }

  private async getSectionTemplate(params: any): Promise<QueryResult> {
    const { id } = params;
    
    const { data, error } = await this.supabase
      .from('content_section_templates')
      .select('*')
      .eq('id', id)
      .single();

    return { data, error: error?.message };
  }

  private async getSectionTemplates(params: any): Promise<QueryResult> {
    const { projectId, languageCode } = params;
    
    let query = this.supabase
      .from('content_section_templates')
      .select('*')
      .eq('is_active', true);

    // Include global (null) and specific language templates
    if (languageCode) {
      query = query.or(`language_code.is.null,language_code.eq.${languageCode}`);
    }

    query = query.order('name', { ascending: true });

    const { data, error } = await query;

    return { data, error: error?.message };
  }

  // =================== FIELDS ===================

  private async getField(params: any): Promise<QueryResult> {
    const { id } = params;
    
    const { data, error } = await this.supabase
      .from('content_fields')
      .select('*')
      .eq('id', id)
      .single();

    return { data, error: error?.message };
  }

  private async getFields(params: any): Promise<QueryResult> {
    const { sectionTemplateId } = params;
    
    let query = this.supabase
      .from('content_fields')
      .select('*')
      .order('order_index', { ascending: true });

    if (sectionTemplateId) {
      query = query.eq('section_template_id', sectionTemplateId);
    }

    const { data, error } = await query;

    return { data, error: error?.message };
  }

  private async getFieldsBySectionTemplate(params: any): Promise<QueryResult> {
    const { templateId } = params;
    
    const { data, error } = await this.supabase
      .from('content_fields')
      .select('*')
      .eq('section_template_id', templateId)
      .order('order_index', { ascending: true });

    return { data, error: error?.message };
  }

  private async getFieldsByItemTemplate(params: any): Promise<QueryResult> {
    const { templateId } = params;
    
    const { data, error } = await this.supabase
      .from('content_fields')
      .select('*')
      .eq('item_template_id', templateId)
      .order('order_index', { ascending: true });

    return { data, error: error?.message };
  }

  // =================== CONTENT DATA ===================

  private async getSectionContent(params: any): Promise<QueryResult> {
    const { sectionId, languageCode } = params;
    
    let query = this.supabase
      .from('content_data')
      .select('*')
      .eq('section_id', sectionId);

    if (languageCode) {
      query = query.eq('language_code', languageCode);
    }

    const { data, error } = await query;

    return { data, error: error?.message };
  }

  private async getSectionData(params: any): Promise<QueryResult> {
    const { sectionId, languageCode } = params;
    
    let query = this.supabase
      .from('content_section_data')
      .select('*')
      .eq('section_id', sectionId);

    // Handle language code properly - null means global, string means specific language
    if (languageCode !== undefined) {
      if (languageCode === null) {
        // For global sections with null language_code
        query = query.is('language_code', null);
      } else {
        // For language-specific sections
        query = query.eq('language_code', languageCode);
      }
    }

    const { data, error } = await query;

    if (error) {
      return { data: null, error: error.message };
    }

    // Transform array to object keyed by field_key
    const content: Record<string, any> = {};
    data?.forEach(item => {
      content[item.field_key] = item.value;
    });

    return { data: content, error: null };
  }

  private async getFieldValues(params: any): Promise<QueryResult> {
    const { pageId, languageCode } = params;
    
    const { data, error } = await this.supabase
      .from('content_field_values')
      .select(`
        *,
        field:content_fields(*)
      `)
      .eq('page_id', pageId)
      .eq('language_code', languageCode);

    return { data, error: error?.message };
  }

  // =================== LANGUAGES ===================

  private async getLanguages(): Promise<QueryResult> {
    const { data, error } = await this.supabase
      .from('languages')
      .select('*')
      .eq('is_active', true)
      .order('name', { ascending: true });

    return { data, error: error?.message };
  }

  // =================== ITEMS ===================

  private async getItems(params: any): Promise<QueryResult> {
    const { templateId, languageCode } = params;
    
    let query = this.supabase
      .from('content_items')
      .select(`
        *,
        template:content_item_templates(
          *,
          fields:content_fields(*)
        ),
        data:content_item_data(*)
      `)
      .eq('is_active', true)
      .order('order_index', { ascending: true });

    if (templateId) {
      query = query.eq('item_template_id', templateId);
    }
    if (languageCode !== undefined) {
      query = query.eq('language_code', languageCode);
    }

    const { data, error } = await query;

    if (error) {
      return { data: null, error: error.message };
    }

    // Transform item data
    const transformedItems = data?.map(item => {
      const itemData: Record<string, any> = {};
      
      // Create a map of field_id to field_key for this template
      const fieldKeyMap = new Map<string, string>();
      item.template?.fields?.forEach((field: any) => {
        fieldKeyMap.set(field.id, field.field_key);
      });
      
      item.data?.forEach((fieldData: any) => {
        // If field_key is "undefined" or null, try to look it up by field_id
        let key = fieldData.field_key;
        if (key === 'undefined' || key === null || key === undefined) {
          key = fieldKeyMap.get(fieldData.field_id) || fieldData.field_key || 'undefined';
        }
        itemData[key] = fieldData.value;
      });
      
      return {
        ...item,
        data: itemData
      };
    });

    return { data: transformedItems, error: null };
  }

  private async getItemsByTemplate(params: any): Promise<QueryResult> {
    const { templateId, languageCode } = params;
    
    let query = this.supabase
      .from('content_items')
      .select(`
        *,
        template:content_item_templates!inner(
          *,
          fields:content_fields(*)
        ),
        data:content_item_data(*)
      `)
      .eq('item_template_id', templateId)
      .eq('is_active', true)
      .order('order_index', { ascending: true });

    if (languageCode !== undefined) {
      query = query.eq('language_code', languageCode);
    }

    const { data, error } = await query;

    if (error) {
      return { data: null, error: error.message };
    }

    // Transform item data
    const transformedItems = data?.map(item => {
      const itemData: Record<string, any> = {};
      
      // Create a map of field_id to field_key for this template
      const fieldKeyMap = new Map<string, string>();
      item.template?.fields?.forEach((field: any) => {
        fieldKeyMap.set(field.id, field.field_key);
      });
      
      item.data?.forEach((fieldData: any) => {
        // If field_key is "undefined" or null, try to look it up by field_id
        let key = fieldData.field_key;
        if (key === 'undefined' || key === null || key === undefined) {
          key = fieldKeyMap.get(fieldData.field_id) || fieldData.field_key || 'undefined';
        }
        itemData[key] = fieldData.value;
      });
      
      return {
        ...item,
        data: itemData
      };
    });

    return { data: transformedItems, error: null };
  }

  private async getItem(params: any): Promise<QueryResult> {
    const { id } = params;
    
    const { data, error } = await this.supabase
      .from('content_items')
      .select(`
        *,
        template:content_item_templates(
          *,
          fields:content_fields(*)
        ),
        data:content_item_data(*)
      `)
      .eq('id', id)
      .single();

    if (error) {
      return { data: null, error: error.message };
    }

    // Transform item data
    const itemData: Record<string, any> = {};
    
    // Create a map of field_id to field_key for this template
    const fieldKeyMap = new Map<string, string>();
    data.template?.fields?.forEach((field: any) => {
      fieldKeyMap.set(field.id, field.field_key);
    });
    
    data.data?.forEach((fieldData: any) => {
      // If field_key is "undefined" or null, try to look it up by field_id
      let key = fieldData.field_key;
      if (key === 'undefined' || key === null || key === undefined) {
        key = fieldKeyMap.get(fieldData.field_id) || fieldData.field_key || 'undefined';
      }
      itemData[key] = fieldData.value;
    });

    return { 
      data: {
        ...data,
        data: itemData
      }, 
      error: null 
    };
  }

  private async getItemBySlug(params: any): Promise<QueryResult> {
    const { slug, languageCode } = params;
    
    let query = this.supabase
      .from('content_items')
      .select(`
        *,
        template:content_item_templates(
          *,
          fields:content_fields(*)
        ),
        data:content_item_data(*)
      `)
      .eq('slug', slug);

    if (languageCode !== undefined) {
      query = query.eq('language_code', languageCode);
    }

    const { data, error } = await query.single();

    if (error) {
      return { data: null, error: error.message };
    }

    // Transform item data
    const itemData: Record<string, any> = {};
    
    // Create a map of field_id to field_key for this template
    const fieldKeyMap = new Map<string, string>();
    data.template?.fields?.forEach((field: any) => {
      fieldKeyMap.set(field.id, field.field_key);
    });
    
    data.data?.forEach((fieldData: any) => {
      // If field_key is "undefined" or null, try to look it up by field_id
      let key = fieldData.field_key;
      if (key === 'undefined' || key === null || key === undefined) {
        key = fieldKeyMap.get(fieldData.field_id) || fieldData.field_key || 'undefined';
      }
      itemData[key] = fieldData.value;
    });

    return { 
      data: {
        ...data,
        data: itemData
      }, 
      error: null 
    };
  }

  private async getItemTranslation(params: any): Promise<QueryResult> {
    const { baseItemId, languageCode } = params;
    
    const { data, error } = await this.supabase
      .from('content_items')
      .select(`
        *,
        template:content_item_templates(
          *,
          fields:content_fields(*)
        ),
        data:content_item_data(*)
      `)
      .eq('base_item_id', baseItemId)
      .eq('language_code', languageCode)
      .single();

    if (error) {
      return { data: null, error: error.message };
    }

    // Transform item data
    const itemData: Record<string, any> = {};
    
    // Create a map of field_id to field_key for this template
    const fieldKeyMap = new Map<string, string>();
    data.template?.fields?.forEach((field: any) => {
      fieldKeyMap.set(field.id, field.field_key);
    });
    
    data.data?.forEach((fieldData: any) => {
      // If field_key is "undefined" or null, try to look it up by field_id
      let key = fieldData.field_key;
      if (key === 'undefined' || key === null || key === undefined) {
        key = fieldKeyMap.get(fieldData.field_id) || fieldData.field_key || 'undefined';
      }
      itemData[key] = fieldData.value;
    });

    return { 
      data: {
        ...data,
        data: itemData
      }, 
      error: null 
    };
  }

  private async getItemData(params: any): Promise<QueryResult> {
    const { itemId, includeInherited } = params;
    
    const { data: itemDataArray, error } = await this.supabase
      .from('content_item_data')
      .select('*')
      .eq('item_id', itemId);

    if (error) {
      return { data: null, error: error.message };
    }

    // Transform to object
    const data: Record<string, any> = {};
    itemDataArray?.forEach(item => {
      data[item.field_key] = item.value;
    });

    // If includeInherited is true and this is a translation, merge with base item data
    if (includeInherited) {
      // First get the item to check if it's a translation
      const { data: item } = await this.supabase
        .from('content_items')
        .select('base_item_id')
        .eq('id', itemId)
        .single();

      if (item?.base_item_id) {
        // Get base item data
        const { data: baseDataArray } = await this.supabase
          .from('content_item_data')
          .select('*')
          .eq('item_id', item.base_item_id);

        // Merge base data (but don't override existing translated fields)
        baseDataArray?.forEach(item => {
          if (!(item.field_key in data)) {
            data[item.field_key] = item.value;
          }
        });
      }
    }

    return { data, error: null };
  }

  private async getLinkedItems(params: any): Promise<QueryResult> {
    const { itemIds, languageCode } = params;
    
    if (!itemIds || itemIds.length === 0) {
      return { data: [], error: null };
    }

    let query = this.supabase
      .from('content_items')
      .select(`
        *,
        template:content_item_templates(
          *,
          fields:content_fields(*)
        ),
        data:content_item_data(*)
      `)
      .in('id', itemIds);

    const { data, error } = await query;

    if (error) {
      return { data: null, error: error.message };
    }

    // Transform items and handle translations
    const transformedItems = await Promise.all(
      data.map(async (item) => {
        // If we need a specific language and this item doesn't match
        if (languageCode && item.language_code !== languageCode && !item.language_code) {
          // Try to find a translation
          const { data: translation } = await this.supabase
            .from('content_items')
            .select(`
              *,
              template:content_item_templates(
                *,
                fields:content_fields(*)
              ),
              data:content_item_data(*)
            `)
            .eq('base_item_id', item.id)
            .eq('language_code', languageCode)
            .single();

          if (translation) {
            item = translation;
          }
        }

        // Transform item data
        const itemData: Record<string, any> = {};
        item.data?.forEach((fieldData: any) => {
          itemData[fieldData.field_key] = fieldData.value;
        });

        return {
          ...item,
          data: itemData
        };
      })
    );

    return { data: transformedItems, error: null };
  }

  private async getItemTemplate(params: any): Promise<QueryResult> {
    const { id } = params;
    
    const { data, error } = await this.supabase
      .from('content_item_templates')
      .select('*')
      .eq('id', id)
      .single();

    return { data, error: error?.message };
  }

  private async getItemTemplates(): Promise<QueryResult> {
    const { data, error } = await this.supabase
      .from('content_item_templates')
      .select('*')
      .eq('is_active', true)
      .order('name', { ascending: true });

    return { data, error: error?.message };
  }

  // =================== ARTICLES ===================

  private async getArticles(params: any): Promise<QueryResult> {
    const { pageId } = params;
    
    let query = this.supabase
      .from('content_articles_details')
      .select('*')
      .order('published_at', { ascending: false });

    if (pageId) {
      query = query.eq('page_id', pageId);
    }

    const { data, error } = await query;
    return { data, error: error?.message };
  }

  private async getArticle(params: any): Promise<QueryResult> {
    const { id } = params;
    
    const { data, error } = await this.supabase
      .from('content_articles')
      .select('*')
      .eq('id', id)
      .single();

    return { data, error: error?.message };
  }

  private async getArticleBySlug(params: any): Promise<QueryResult> {
    const { pageId, languageCode, slug } = params;
    
    const { data, error } = await this.supabase
      .from('content_articles')
      .select('*')
      .eq('page_id', pageId)
      .eq('language_code', languageCode)
      .eq('slug', slug)
      .single();

    return { data, error: error?.message };
  }

  private async getArticlesByPage(params: any): Promise<QueryResult> {
    const { pageId, languageCode } = params;
    
    let query = this.supabase
      .from('content_articles_details')
      .select('*')
      .eq('page_id', pageId)
      .order('published_at', { ascending: false });

    if (languageCode) {
      query = query.eq('language_code', languageCode);
    }

    const { data, error } = await query;
    return { data, error: error?.message };
  }

  private async getPublishedArticles(params: any): Promise<QueryResult> {
    const { pageId, languageCode } = params;
    
    let query = this.supabase
      .from('content_articles_details')
      .select('*')
      .eq('is_published', true)
      .order('published_at', { ascending: false });

    if (pageId) {
      query = query.eq('page_id', pageId);
    }
    if (languageCode) {
      query = query.eq('language_code', languageCode);
    }

    const { data, error } = await query;
    return { data, error: error?.message };
  }

  // =================== NAVIGATION ===================

  private async getNavigationMenus(params: any = {}): Promise<QueryResult> {
    const { projectId } = params;
    
    let query = this.supabase
      .from('content_navigation_menus')
      .select(`
        *,
        items:content_navigation_items(*)
      `)
      .order('name', { ascending: true });

    if (projectId) {
      query = query.eq('project_id', projectId);
    }

    const { data, error } = await query;

    if (error) {
      return { data: null, error: error.message };
    }

    // Process menu items to build the hierarchical structure
    const processedMenus = data?.map(menu => ({
      ...menu,
      items: this.buildNavigationTree(menu.items || [])
    }));

    return { data: processedMenus, error: null };
  }

  private async getNavigationMenu(params: any): Promise<QueryResult> {
    const { id } = params;
    
    const { data, error } = await this.supabase
      .from('content_navigation_menus')
      .select(`
        *,
        items:content_navigation_items(
          *,
          page:content_pages(
            id,
            slug,
            title
          )
        )
      `)
      .eq('id', id)
      .single();

    if (error) {
      return { data: null, error: error.message };
    }

    // Process navigation items to include page slugs
    const processNavigationItems = (items: any[]): any[] => {
      return items.map(item => {
        const processedItem = { ...item };
        
        // For page items, add the page slug from the joined data for easier access
        if (item.type === 'page' && item.page) {
          processedItem.page_slug = item.page.slug;
          // Keep the full page object for complete information
          processedItem.page = item.page;
        }
        
        return processedItem;
      });
    };

    // Build hierarchical structure for items with page slugs
    const processedMenu = {
      ...data,
      items: this.buildNavigationTree(processNavigationItems(data.items || []))
    };

    return { data: processedMenu, error: null };
  }

  private async getNavigationMenuBySlug(params: any): Promise<QueryResult> {
    const { slug, projectId } = params;
    
    if (!slug) {
      return { data: null, error: 'Missing required parameter: slug' };
    }
    
    let query = this.supabase
      .from('content_navigation_menus')
      .select(`
        *,
        items:content_navigation_items(
          *,
          page:content_pages(
            id,
            slug,
            title
          )
        )
      `)
      .eq('slug', slug);

    if (projectId) {
      query = query.eq('project_id', projectId);
    }

    const { data, error } = await query.single();

    if (error) {
      return { data: null, error: error.message };
    }

    // Process navigation items to include page slugs
    const processNavigationItems = (items: any[]): any[] => {
      return items.map(item => {
        const processedItem = { ...item };
        
        // For page items, add the page slug from the joined data for easier access
        if (item.type === 'page' && item.page) {
          processedItem.page_slug = item.page.slug;
          // Keep the full page object for complete information
          processedItem.page = item.page;
        }
        
        return processedItem;
      });
    };

    // Build hierarchical structure for items with page slugs
    const processedMenu = {
      ...data,
      items: this.buildNavigationTree(processNavigationItems(data.items || []))
    };

    return { data: processedMenu, error: null };
  }

  private async getNavigationItems(params: any): Promise<QueryResult> {
    const { menuId } = params;
    
    const { data, error } = await this.supabase
      .from('content_navigation_items')
      .select('*')
      .eq('menu_id', menuId)
      .eq('is_visible', true)
      .order('order_index', { ascending: true });

    if (error) {
      return { data: null, error: error.message };
    }

    // Build hierarchical structure
    const tree = this.buildNavigationTree(data || []);

    return { data: tree, error: null };
  }

  // Helper method to build hierarchical navigation tree
  private buildNavigationTree(items: any[]): any[] {
    const itemMap = new Map();
    const rootItems: any[] = [];

    // First pass: create a map of all items (preserve all properties including page data)
    items.forEach(item => {
      itemMap.set(item.id, { ...item, items: [] });
    });

    // Second pass: build the tree structure
    items.forEach(item => {
      const currentItem = itemMap.get(item.id);
      
      if (item.parent_id && itemMap.has(item.parent_id)) {
        // Add to parent's children
        const parent = itemMap.get(item.parent_id);
        parent.items.push(currentItem);
      } else {
        // Root level item
        rootItems.push(currentItem);
      }
    });

    // Sort root items by order_index
    rootItems.sort((a, b) => (a.order_index || 0) - (b.order_index || 0));
    
    // Sort children recursively
    const sortChildren = (items: any[]) => {
      items.forEach(item => {
        if (item.items && item.items.length > 0) {
          item.items.sort((a: any, b: any) => (a.order_index || 0) - (b.order_index || 0));
          sortChildren(item.items);
        }
      });
    };
    
    sortChildren(rootItems);

    return rootItems;
  }
}