#!/usr/bin/env node

/**
 * Script to verify and fix has_children flags in the database
 * 
 * Usage:
 *   node scripts/fix-has-children-flags.js
 *   
 * This script will:
 * 1. Connect to the Supabase database
 * 2. Find all items that have children but has_children = false
 * 3. Find all items that don't have children but has_children = true
 * 4. Fix the flags
 */

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Load environment variables
dotenv.config({ path: join(__dirname, '..', '.env') })

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables:')
  console.error('- VITE_SUPABASE_URL')
  console.error('- SUPABASE_SERVICE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function fixHasChildrenFlags() {
  console.log('🔍 Checking has_children flags...\n')

  try {
    // 1. Find items that have children but has_children = false
    console.log('📊 Finding items with children but has_children = false...')
    const { data: itemsNeedingTrue, error: error1 } = await supabase
      .rpc('find_items_needing_has_children_true')

    if (error1) {
      // If the function doesn't exist, use a direct query
      const { data: itemsWithChildren, error: error1Alt } = await supabase
        .from('items')
        .select('id, name')
        .eq('has_children', false)
        .filter('id', 'in', '(SELECT DISTINCT parent_id FROM items WHERE parent_id IS NOT NULL)')

      if (error1Alt) throw error1Alt

      if (itemsWithChildren && itemsWithChildren.length > 0) {
        console.log(`Found ${itemsWithChildren.length} items that need has_children = true`)
        
        // Update them
        for (const item of itemsWithChildren) {
          const { error: updateError } = await supabase
            .from('items')
            .update({ has_children: true })
            .eq('id', item.id)
          
          if (updateError) {
            console.error(`Failed to update ${item.name} (${item.id}):`, updateError.message)
          } else {
            console.log(`✅ Fixed: "${item.name}" now has has_children = true`)
          }
        }
      } else {
        console.log('✅ No items found that need has_children = true')
      }
    }

    // 2. Find items that don't have children but has_children = true
    console.log('\n📊 Finding items without children but has_children = true...')
    const { data: allItemsWithFlag, error: error2 } = await supabase
      .from('items')
      .select('id, name')
      .eq('has_children', true)

    if (error2) throw error2

    let itemsNeedingFalse = []
    for (const item of allItemsWithFlag || []) {
      const { count, error: countError } = await supabase
        .from('items')
        .select('id', { count: 'exact', head: true })
        .eq('parent_id', item.id)

      if (!countError && count === 0) {
        itemsNeedingFalse.push(item)
      }
    }

    if (itemsNeedingFalse.length > 0) {
      console.log(`Found ${itemsNeedingFalse.length} items that need has_children = false`)
      
      // Update them
      for (const item of itemsNeedingFalse) {
        const { error: updateError } = await supabase
          .from('items')
          .update({ has_children: false })
          .eq('id', item.id)
        
        if (updateError) {
          console.error(`Failed to update ${item.name} (${item.id}):`, updateError.message)
        } else {
          console.log(`✅ Fixed: "${item.name}" now has has_children = false`)
        }
      }
    } else {
      console.log('✅ No items found that need has_children = false')
    }

    // 3. Summary
    console.log('\n📈 Summary:')
    const { count: totalItems } = await supabase
      .from('items')
      .select('id', { count: 'exact', head: true })
    
    const { count: itemsWithChildren } = await supabase
      .from('items')
      .select('id', { count: 'exact', head: true })
      .eq('has_children', true)

    console.log(`Total items: ${totalItems}`)
    console.log(`Items with children: ${itemsWithChildren}`)
    console.log(`Percentage with children: ${((itemsWithChildren / totalItems) * 100).toFixed(1)}%`)

  } catch (error) {
    console.error('❌ Error:', error.message)
    process.exit(1)
  }
}

// Run the script
fixHasChildrenFlags()
  .then(() => {
    console.log('\n✅ Done!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Failed:', error)
    process.exit(1)
  })