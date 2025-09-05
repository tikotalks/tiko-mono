# Content Store Usage

The content store manages all content-related data for the admin tool, including projects, pages, sections, templates, items, navigation, and articles.

## Basic Usage

```vue
<script setup lang="ts">
import { onMounted } from 'vue'
import { useContentStore } from '@/stores'

const contentStore = useContentStore()

// Load data on mount
onMounted(async () => {
  await contentStore.loadProjects()
  await contentStore.loadLanguages()
})

// Access reactive data
const projects = contentStore.projects
const loading = contentStore.loading.projects
const error = contentStore.error

// Use computed properties
const activeProject = contentStore.activeProject
const pageTree = contentStore.pageTree

// Set active project
function selectProject(projectId: string) {
  contentStore.setActiveProject(projectId)
  contentStore.loadPages(projectId)
}

// Create new content
async function createNewPage() {
  try {
    const page = await contentStore.createPage({
      project_id: contentStore.activeProjectId,
      title: 'New Page',
      slug: 'new-page',
      language_code: contentStore.activeLanguageCode,
      is_published: false
    })
    console.log('Created page:', page)
  } catch (err) {
    console.error('Failed to create page:', err)
  }
}

// Search functionality
function searchContent(query: string) {
  const pages = contentStore.searchPages(query)
  const articles = contentStore.searchArticles(query)
  return { pages, articles }
}
</script>

<template>
  <div>
    <div v-if="loading">Loading projects...</div>
    <div v-else-if="error">Error: {{ error }}</div>
    <div v-else>
      <select @change="selectProject($event.target.value)">
        <option value="">Select a project</option>
        <option 
          v-for="project in projects" 
          :key="project.id" 
          :value="project.id"
        >
          {{ project.name }}
        </option>
      </select>
      
      <div v-if="activeProject">
        <h2>{{ activeProject.name }}</h2>
        <ul>
          <li v-for="page in pageTree" :key="page.id">
            {{ page.title }}
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>
```

## Features

### Caching
- Data is cached for 5 minutes by default
- Force refresh: `await contentStore.loadProjects(true)`
- Clear all cache: `contentStore.clearCache()`
- Refresh all data: `await contentStore.refreshAll()`

### Loading States
Each data type has its own loading state:
```ts
contentStore.loading.projects // boolean
contentStore.loading.pages // boolean
contentStore.loading.sections // boolean
// etc...
```

### Hierarchical Data
- **Page Tree**: `contentStore.pageTree` returns pages organized in a tree structure
- **Navigation Tree**: Navigation items are automatically organized by parent-child relationships
- **Item Translations**: Base items and their translations are linked

### Batch Operations
Some operations support batch updates:
- `batchUpdatePageSections(pageId, sections)`
- `batchUpdateFields(templateId, templateType, fields)`

### Search and Filtering
- Find by slug: `findProjectBySlug()`, `findPageBySlug()`
- Search: `searchPages()`, `searchArticles()`
- Computed filters: `globalSections`, `reusableSections`, `activeLanguages`, etc.

## Store Structure

The store uses Vue 3 composition API with TypeScript:

- **State**: Reactive refs for data storage
- **Computed**: Derived data like filtered lists and hierarchical structures  
- **Actions**: Async functions for API calls and data manipulation
- **Helpers**: Utility functions for common operations

## Error Handling

All actions handle errors internally and update the `error` ref:
```ts
if (contentStore.error) {
  console.error('Store error:', contentStore.error)
}
```

Actions that create/update/delete also throw errors for component-level handling:
```ts
try {
  await contentStore.createProject({ name: 'New Project' })
} catch (err) {
  // Handle error in component
}
```