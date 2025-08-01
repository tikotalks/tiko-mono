# Fix for Content Service Section Loading Issue

## Problem
The `getSection()` method in `content.service.ts` (lines 610-639) is querying the wrong table. It queries `content_section_templates` when it should be querying `content_section_instances`.

## Root Cause
When `useContent` composable calls `contentService.getSection(pageSection.section_id)` on line 154, it expects to get a section instance, but the method returns a section template instead.

## Solution

Add a new method `getSectionInstance()` to properly query section instances:

```typescript
// Add this method to content.service.ts around line 640

async getSectionInstance(id: string): Promise<ContentSection | null> {
  try {
    const result = await this.makeRequest(`/content_section_instances?id=eq.${id}`)
    
    if (!result.length) return null
    
    const instance = result[0]
    // Map to ContentSection format
    return {
      id: instance.id,
      section_template_id: instance.template_id,
      name: instance.name,
      slug: instance.slug,
      description: instance.description,
      language_code: instance.language_code,
      is_reusable: instance.is_reusable,
      is_active: instance.is_active,
      project_id: instance.project_id,
      created_at: instance.created_at,
      updated_at: instance.updated_at
    }
  } catch (error) {
    console.error('Error getting section instance:', error)
    return null
  }
}
```

Then update `useContent.ts` line 154 to use the new method:

```typescript
// Change line 154 from:
sectionInstance = await contentService.getSection(pageSection.section_id)

// To:
sectionInstance = await contentService.getSectionInstance(pageSection.section_id)
```

## Alternative Solution

If you want to keep using `getSection()`, update it to check both tables:

```typescript
async getSection(idOrSlug: string): Promise<ContentSection | null> {
  try {
    // First try section instances (most common case for section_id)
    let result = await this.makeRequest(`/content_section_instances?id=eq.${idOrSlug}`)
    
    if (result.length) {
      const instance = result[0]
      return {
        id: instance.id,
        section_template_id: instance.template_id,
        name: instance.name,
        slug: instance.slug,
        description: instance.description,
        language_code: instance.language_code,
        is_reusable: instance.is_reusable,
        is_active: instance.is_active,
        project_id: instance.project_id,
        created_at: instance.created_at,
        updated_at: instance.updated_at
      }
    }
    
    // Then try by slug in instances
    result = await this.makeRequest(`/content_section_instances?slug=eq.${idOrSlug}`)
    
    if (result.length) {
      const instance = result[0]
      return {
        id: instance.id,
        section_template_id: instance.template_id,
        name: instance.name,
        slug: instance.slug,
        description: instance.description,
        language_code: instance.language_code,
        is_reusable: instance.is_reusable,
        is_active: instance.is_active,
        project_id: instance.project_id,
        created_at: instance.created_at,
        updated_at: instance.updated_at
      }
    }
    
    // Finally fall back to templates (for backward compatibility)
    result = await this.makeRequest(`/content_section_templates?id=eq.${idOrSlug}`)
    if (!result.length) {
      result = await this.makeRequest(`/content_section_templates?slug=eq.${idOrSlug}`)
    }
    
    if (!result.length) return null
    
    const template = result[0]
    return {
      id: template.id,
      section_template_id: template.id, // Note: for templates, both IDs are the same
      name: template.name,
      slug: template.slug,
      description: template.description,
      language_code: template.language_code,
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
```

## Testing

After implementing the fix:

1. The marketing app should correctly load section instances instead of templates
2. The `section.id` should match the `section_id` from `content_page_sections` table
3. Content data should be properly loaded from `content_section_data` table