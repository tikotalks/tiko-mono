import { onMounted } from 'vue';

export function usePrefetch() {
  onMounted(() => {
    // Only prefetch the worker endpoint if using worker
    if (import.meta.env.VITE_USE_CONTENT_WORKER === 'true') {
      const workerUrl = import.meta.env.VITE_CONTENT_API_URL;
      if (!workerUrl) return;

      // Check if hint already exists
      const existingHint = document.querySelector(`link[href*="${workerUrl}/query"]`);
      if (!existingHint) {
        const link = document.createElement('link');
        link.rel = 'prefetch';
        link.href = `${workerUrl}/query`;
        link.as = 'fetch';
        link.crossOrigin = 'anonymous';
        document.head.appendChild(link);
      }
    }

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