<template>
  <PageContent 
    :page-slug="pageSlug" 
    @page-not-found="handlePageNotFound"
  />
</template>

<script setup lang="ts">
import { computed } from 'vue';
import PageContent from '../components/PageContent.vue';
import { useRoute, useRouter } from 'vue-router';

const route = useRoute();
const router = useRouter();

// Extract page slug from route params
const pageSlug = computed(() => {
  const viewParam = route.params.view;
  if (Array.isArray(viewParam)) {
    return viewParam[0] || '';
  }
  return viewParam || '';
});

// Handle page not found
function handlePageNotFound(slug: string) {
  console.log(`[ContentView] Page not found: ${slug}`);
  // Navigate to 404 page
  router.push({
    name: 'notFound',
    params: { pathMatch: route.path.substring(1).split('/') }
  });
}
</script>

