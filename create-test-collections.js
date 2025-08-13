#!/usr/bin/env node

/**
 * Script to create test curated collections for debugging
 * Run this script after ensuring you have Supabase set up and users in the database
 */

const { createClient } = require('@supabase/supabase-js')

// You'll need to replace these with your actual Supabase URL and anon key
const SUPABASE_URL = process.env.SUPABASE_URL || 'your-supabase-url'
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'your-supabase-anon-key'

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

const testCollections = [
  {
    name: 'Featured Nature Photography',
    description: 'A curated collection of stunning nature photographs from around the world. This collection showcases the beauty of natural landscapes, wildlife, and outdoor adventures.',
    is_public: true,
    is_curated: true,
    view_count: 42,
    like_count: 15,
    cover_image_url: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop'
  },
  {
    name: 'Urban Architecture',
    description: 'Modern architecture and city landscapes from around the globe. Featuring contemporary buildings, street art, and urban design.',
    is_public: true,
    is_curated: true,
    view_count: 67,
    like_count: 23,
    cover_image_url: 'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=800&h=600&fit=crop'
  },
  {
    name: 'Portrait Photography',
    description: 'Expressive portrait photography capturing human emotion and character. A diverse collection of professional portrait work.',
    is_public: true,
    is_curated: true,
    view_count: 89,
    like_count: 31,
    cover_image_url: 'https://images.unsplash.com/photo-1494790108755-2616b612b672?w=800&h=600&fit=crop'
  },
  {
    name: 'Street Photography',
    description: 'Candid moments from city streets around the world. Capturing everyday life, culture, and human interaction in urban environments.',
    is_public: true,
    is_curated: true,
    view_count: 156,
    like_count: 47,
    cover_image_url: 'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=800&h=600&fit=crop'
  }
]

async function createTestCollections() {
  try {
    console.log('Creating test curated collections...')
    
    // First, get a user ID to assign as owner
    const { data: users, error: userError } = await supabase
      .from('users')
      .select('id')
      .limit(1)
    
    if (userError) {
      console.error('Error fetching users:', userError)
      return
    }
    
    if (!users || users.length === 0) {
      console.error('No users found in database. Please create a user first.')
      return
    }
    
    const userId = users[0].id
    console.log(`Using user ID: ${userId}`)
    
    // Create test collections
    for (const collection of testCollections) {
      const { data, error } = await supabase
        .from('media_collections')
        .insert({
          user_id: userId,
          ...collection
        })
        .select()
      
      if (error) {
        console.error(`Error creating collection "${collection.name}":`, error)
      } else {
        console.log(`✅ Created collection: ${collection.name}`)
      }
    }
    
    console.log('\nTest collections created successfully!')
    
    // Verify collections were created
    const { data: curatedCollections, error: fetchError } = await supabase
      .from('media_collections')
      .select('*')
      .eq('is_curated', true)
      .eq('is_public', true)
    
    if (fetchError) {
      console.error('Error fetching curated collections:', fetchError)
    } else {
      console.log(`\nFound ${curatedCollections.length} curated collections in database:`)
      curatedCollections.forEach(col => {
        console.log(`- ${col.name} (ID: ${col.id})`)
      })
    }
    
  } catch (error) {
    console.error('Unexpected error:', error)
  }
}

// Run only if this file is executed directly
if (require.main === module) {
  createTestCollections()
}

module.exports = { createTestCollections }