import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config()

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase URL or key in environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkArticles() {
  console.log('Connecting to Supabase...\n')

  // Check content_articles table
  console.log('Checking content_articles table:')
  console.log('================================')

  const { data: articles, error: articlesError } = await supabase
    .from('content_articles')
    .select('*')
    .order('created_at', { ascending: false })

  if (articlesError) {
    console.error('Error fetching from content_articles:', articlesError.message)
  } else {
    console.log(`Found ${articles.length} articles in content_articles table\n`)

    if (articles.length > 0) {
      console.log('Article details:')
      articles.forEach((article, index) => {
        console.log(`\nArticle ${index + 1}:`)
        console.log(`  Title: ${article.title || 'N/A'}`)
        console.log(`  Slug: ${article.slug || 'N/A'}`)
        console.log(`  Page ID: ${article.page_id || 'N/A'}`)
        console.log(`  Is Published: ${article.is_published ?? 'N/A'}`)
        console.log(`  Created: ${article.created_at || 'N/A'}`)
      })
    }
  }

  console.log('\n\nChecking content_articles_details view:')
  console.log('=======================================')

  // Check content_articles_details view
  const { data: articleDetails, error: detailsError } = await supabase
    .from('content_articles_details')
    .select('*')
    .order('created_at', { ascending: false })

  if (detailsError) {
    console.error('Error fetching from content_articles_details:', detailsError.message)
  } else {
    console.log(`Found ${articleDetails.length} articles in content_articles_details view\n`)

    if (articleDetails.length > 0) {
      console.log('Article details from view:')
      articleDetails.forEach((article, index) => {
        console.log(`\nArticle ${index + 1}:`)
        console.log(`  Title: ${article.title || 'N/A'}`)
        console.log(`  Slug: ${article.slug || 'N/A'}`)
        console.log(`  Page ID: ${article.page_id || 'N/A'}`)
        console.log(`  Is Published: ${article.is_published ?? 'N/A'}`)
        console.log(`  Created: ${article.created_at || 'N/A'}`)
        // Check for additional fields that might be in the view
        if (article.page_slug) console.log(`  Page Slug: ${article.page_slug}`)
        if (article.page_title) console.log(`  Page Title: ${article.page_title}`)
      })
    }
  }
}

checkArticles().catch(console.error)
