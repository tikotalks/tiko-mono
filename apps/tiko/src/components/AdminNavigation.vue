<template>
  <nav class="admin-navigation">
    <div class="admin-nav-header">
      <h2>Admin Panel</h2>
      <router-link to="/" class="back-link">← Back to App</router-link>
    </div>
    
    <div class="admin-nav-tabs">
      <router-link 
        to="/admin/public-items" 
        class="nav-tab"
        :class="{ active: $route.path === '/admin/public-items' }"
      >
        📋 Public Items
      </router-link>
      
      <router-link 
        to="/admin/reports" 
        class="nav-tab"
        :class="{ active: $route.path === '/admin/reports' }"
      >
        🐛 Issue Reports
      </router-link>
    </div>
  </nav>
</template>

<script setup lang="ts">
// No script needed for this simple navigation component
</script>

<style scoped>
.admin-navigation {
  background: #f8f9fa;
  border-bottom: 1px solid #dee2e6;
  padding: 1rem 2rem;
  margin-bottom: 2rem;
}

.admin-nav-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.admin-nav-header h2 {
  margin: 0;
  color: #333;
  font-size: 1.5rem;
}

.back-link {
  color: #6c757d;
  text-decoration: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  transition: background-color 0.2s;
}

.back-link:hover {
  background: #e9ecef;
  color: #495057;
}

.admin-nav-tabs {
  display: flex;
  gap: 0.5rem;
  border-bottom: 1px solid #dee2e6;
  padding-bottom: -1px;
}

.nav-tab {
  padding: 0.75rem 1.5rem;
  color: #6c757d;
  text-decoration: none;
  border-radius: 4px 4px 0 0;
  transition: all 0.2s;
  background: #e9ecef;
  border: 1px solid #dee2e6;
  border-bottom: none;
  margin-bottom: -1px;
}

.nav-tab:hover {
  color: #495057;
  background: #f8f9fa;
}

.nav-tab.active {
  background: white;
  color: #007bff;
  border-color: #dee2e6;
  font-weight: 600;
}

@media (max-width: 768px) {
  .admin-navigation {
    padding: 1rem;
  }
  
  .admin-nav-header {
    flex-direction: column;
    align-items: stretch;
    gap: 0.5rem;
  }
  
  .admin-nav-tabs {
    overflow-x: auto;
    white-space: nowrap;
  }
  
  .nav-tab {
    flex-shrink: 0;
  }
}
</style>