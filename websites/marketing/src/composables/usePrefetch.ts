import { onMounted } from 'vue';

export function usePrefetch() {
  onMounted(() => {
    // Add prefetch hints for common API routes
    const apiRoutes = [
      '/query', // Worker API endpoint
      '/content_pages',
      '/content_sections',
      '/content_section_templates',
      '/content_fields',
      '/content_section_data'
    ];

    // Inject prefetch hints into head
    apiRoutes.forEach(route => {
      const contentApiUrl = import.meta.env.VITE_USE_CONTENT_WORKER === 'true' 
        ? import.meta.env.VITE_CONTENT_API_URL 
        : import.meta.env.VITE_SUPABASE_URL;
      
      if (!contentApiUrl) return;

      // Check if hint already exists
      const existingHint = document.querySelector(`link[href*="${route}"]`);
      if (existingHint) return;

      const link = document.createElement('link');
      link.rel = 'prefetch';
      link.href = `${contentApiUrl}${route}`;
      link.as = 'fetch';
      link.crossOrigin = 'anonymous';
      document.head.appendChild(link);
    });

    // Prefetch route chunks for faster navigation
    const routes = ['about', 'apps', 'sponsors'];
    routes.forEach(route => {
      // Vue Router dynamically imports route components
      // This will trigger Vite to prefetch the route chunks
      import(`../views/${route.charAt(0).toUpperCase() + route.slice(1)}View.vue`).catch(() => {
        // Silently fail if route doesn't exist
      });
    });
  });
}