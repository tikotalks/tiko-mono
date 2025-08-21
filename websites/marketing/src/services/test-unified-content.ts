/**
 * Test the new UnifiedContentService with the marketing site
 */

import { UnifiedContentService } from '@tiko/core'

// Use the same config as the existing content service
const config = {
  supabaseUrl: import.meta.env.VITE_SUPABASE_URL || 'https://kejvhvszhevfwgsztedf.supabase.co',
  supabaseKey: import.meta.env.VITE_SUPABASE_PUBLIC || 'your-anon-key',
  defaultLanguage: 'en'
}

export async function testUnifiedContentService() {
  console.log('🧪 Testing UnifiedContentService with marketing site...')
  
  try {
    const service = new UnifiedContentService(config)
    
    // Test 1: Get the marketing page with deep resolution
    console.log('📄 Testing deep page fetch...')
    const pageId = '6b8793ed-ced1-4cbf-9447-185250e562d5' // Marketing home page ID
    
    const page = await service.getPage(pageId, { 
      deep: true, 
      language: 'en' 
    })
    
    console.log('✅ Deep page fetch successful!')
    console.log('📊 Page data:', {
      name: page.page?.name,
      sectionsCount: page.sections?.length,
      queryTime: page.metadata?.query_time
    })
    
    // Log each section's content
    if (page.sections) {
      page.sections.forEach((section: any, index: number) => {
        console.log(`🔸 Section ${index + 1}: ${section.section?.name}`)
        console.log(`   Template: ${section.section?.template_name}`)
        console.log(`   Content keys: ${Object.keys(section.content || {}).join(', ')}`)
        console.log(`   Items count: ${section.items?.length || 0}`)
      })
    }
    
    return page
    
  } catch (error) {
    console.error('❌ Test failed:', error)
    throw error
  }
}

export async function compareWithOldService() {
  console.log('⚖️ Comparing UnifiedContentService with current implementation...')
  
  // This would compare performance and results with the current useContent
  // For now, just test the new service
  return testUnifiedContentService()
}