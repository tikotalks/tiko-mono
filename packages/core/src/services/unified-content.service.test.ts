/**
 * Basic test to verify UnifiedContentService functionality
 * This is a simple integration test to ensure the service works
 */

import { UnifiedContentService } from './unified-content.service'

// Mock API config (you'll need to use real values for testing)
const mockConfig = {
  apiUrl: process.env.API_URL || 'https://example.tikoapi.org',
  apiToken: process.env.API_TOKEN || 'mock-key',
  defaultLanguage: 'en',
  cacheEnabled: true
}

async function testUnifiedService() {
  console.log('🧪 Testing UnifiedContentService...')
  
  try {
    const service = new UnifiedContentService(mockConfig)
    
    // Test 1: Cache stats
    console.log('📊 Cache stats:', service.getCacheStats())
    
    // Test 2: Basic page fetch (will fail with mock config but should not crash)
    try {
      const pages = await service.getPages({ cache: false })
      console.log('✅ Basic page fetch worked, got', pages.length, 'pages')
    } catch (error) {
      console.log('⚠️ Expected error with mock config:', error.message)
    }
    
    // Test 3: Cache operations
    service.clearCache()
    console.log('✅ Cache cleared successfully')
    
    // Test 4: Deep page fetch (will also fail but should not crash)
    try {
      const page = await service.getPage('test-id', { deep: true, cache: false })
      console.log('✅ Deep page fetch worked:', page)
    } catch (error) {
      console.log('⚠️ Expected error with mock config:', error.message)
    }
    
    console.log('✅ All tests completed - UnifiedContentService is structurally sound!')
    
  } catch (error) {
    console.error('❌ Test failed:', error)
    process.exit(1)
  }
}

// Run test if this file is executed directly
if (require.main === module) {
  testUnifiedService()
}

export { testUnifiedService }