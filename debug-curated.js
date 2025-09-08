// Simple debug script to check curated items loading
// Run this in the browser console on the sequence app

console.log('=== CURATED ITEMS DEBUG ===')

// Check settings
const settingsStr = localStorage.getItem('tiko_app_settings_sequence')
const settings = settingsStr ? JSON.parse(settingsStr) : {}
console.log('1. Current settings:', settings)
console.log('2. showCuratedItems enabled:', settings.showCuratedItems)

// Check auth
const sessionStr = localStorage.getItem('tiko_auth_session')
const session = sessionStr ? JSON.parse(sessionStr) : null
console.log('3. Current user ID:', session?.user?.id)

// Check if we can make API calls to get curated items
const SUPABASE_URL = 'https://xqjibuvlhfisvgvwgfbn.supabase.co'
const SUPABASE_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhxamlldXZsaGZpc3ZndndnZmJuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MDA2OTc3NjEsImV4cCI6MjAxNjI3Mzc2MX0.KK7-mUZH8QB7Ub2EyZ63T1rbyMD5Mxt8MfwQnFkYVYQ'

async function debugCuratedItems() {
  const userId = session?.user?.id
  if (!userId) {
    console.error('No user ID found')
    return
  }

  // Test 1: Check for any curated items in the database
  console.log('4. Testing API call for curated items...')

  try {
    const params = new URLSearchParams()
    params.append('app_name', 'eq.sequence')
    params.append('is_curated', 'eq.true')
    params.append('select', 'id,name,type,user_id,is_curated,parent_id')

    const response = await fetch(`${SUPABASE_URL}/rest/v1/items?${params.toString()}`, {
      headers: {
        'Content-Type': 'application/json',
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${session.access_token}`,
      },
    })

    const curatedItems = await response.json()
    console.log('5. Total curated items in DB:', curatedItems.length)
    console.log('6. Curated items:', curatedItems)

    // Test 2: Check user's own items vs curated items
    const ownItems = curatedItems.filter(item => item.user_id === userId)
    const othersCurated = curatedItems.filter(item => item.user_id !== userId)

    console.log("7. User's own curated items:", ownItems.length)
    console.log("8. Others' curated items visible to user:", othersCurated.length)

    // Test 3: Check if any curated sequences have children
    for (const item of othersCurated) {
      if (item.type === 'sequence' && !item.parent_id) {
        console.log(`9. Checking children for curated sequence "${item.name}" (${item.id})...`)

        const childParams = new URLSearchParams()
        childParams.append('parent_id', `eq.${item.id}`)
        childParams.append('app_name', 'eq.sequence')

        const childResponse = await fetch(
          `${SUPABASE_URL}/rest/v1/items?${childParams.toString()}`,
          {
            headers: {
              'Content-Type': 'application/json',
              apikey: SUPABASE_KEY,
              Authorization: `Bearer ${session.access_token}`,
            },
          }
        )

        const children = await childResponse.json()
        console.log(
          `   - "${item.name}" has ${children.length} children:`,
          children.map(c => ({ id: c.id, name: c.name, type: c.type }))
        )
      }
    }
  } catch (error) {
    console.error('API Error:', error)
  }
}

// Run the debug
debugCuratedItems()
