const { createClient } = require('@supabase/supabase-js')

// Supabase configuration
const supabaseUrl = 'http://localhost:54321'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function createTestCuratedCollections() {
  console.log('Creating test curated collections...')

  // First, let's check if we have any users to assign collections to
  const { data: users, error: userError } = await supabase.auth.admin.listUsers()
  
  if (userError) {
    console.error('Error fetching users:', userError)
    // Let's try to get any user ID from existing data
    const { data: existingCollections } = await supabase
      .from('media_collections')
      .select('user_id')
      .limit(1)
    
    if (existingCollections && existingCollections.length > 0) {
      console.log('Using existing user ID from collections:', existingCollections[0].user_id)
      const userId = existingCollections[0].user_id
      await createCollectionsForUser(userId)
    } else {
      console.log('No users found, creating collections with a dummy user ID...')
      // Use a dummy UUID - these collections will still be public and curated
      const dummyUserId = '00000000-0000-0000-0000-000000000001'
      await createCollectionsForUser(dummyUserId)
    }
    return
  }

  if (users && users.users.length > 0) {
    const userId = users.users[0].id
    console.log('Found user:', userId)
    await createCollectionsForUser(userId)
  } else {
    console.log('No users found, using dummy user ID')
    const dummyUserId = '00000000-0000-0000-0000-000000000001'
    await createCollectionsForUser(dummyUserId)
  }
}

async function createCollectionsForUser(userId) {
  const testCollections = [
    {
      name: 'Nature Photography',
      description: 'Stunning landscapes and wildlife photography from around the world',
      user_id: userId,
      is_public: true,
      is_curated: true,
      cover_image_url: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400'
    },
    {
      name: 'Urban Architecture',
      description: 'Modern cityscapes and architectural marvels',
      user_id: userId,
      is_public: true,
      is_curated: true,
      cover_image_url: 'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=400'
    },
    {
      name: 'Abstract Art',
      description: 'Creative abstract compositions and digital art',
      user_id: userId,
      is_public: true,
      is_curated: true,
      cover_image_url: 'https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=400'
    }
  ]

  for (const collection of testCollections) {
    console.log(`Creating collection: ${collection.name}`)
    
    const { data, error } = await supabase
      .from('media_collections')
      .insert(collection)
      .select()

    if (error) {
      console.error(`Error creating collection ${collection.name}:`, error)
    } else {
      console.log(`✅ Created collection: ${collection.name}`, data[0].id)
    }
  }

  // Check the results
  console.log('\nChecking created curated collections...')
  const { data: curatedCollections, error: checkError } = await supabase
    .from('media_collections')
    .select('id, name, is_public, is_curated')
    .eq('is_curated', true)
    .eq('is_public', true)

  if (checkError) {
    console.error('Error checking collections:', checkError)
  } else {
    console.log('Curated collections in database:', curatedCollections)
  }
}

// Run the script
createTestCuratedCollections().catch(console.error)