<template>
  <div class="admin-dashboard">
    <h1>{{ t(keys.common.dashboard) }}</h1>
    <p>{{ t(keys.common.welcome) }} to the Admin Dashboard!</p>
    
    <div class="admin-actions">
      <h2>{{ t(keys.common.quickActions) }}</h2>
      <ul>
        <li @click="$router.push('/media')">Media Dashboard</li>
        <li @click="$router.push('/library')">Library</li>
        <li @click="$router.push('/upload')">Upload Media</li>
        <li>User Management</li>
        <li>Analytics</li>
        <li>Settings</li>
      </ul>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from '@tiko/ui'

const { t, keys } = useI18n()
</script>

<style lang="scss" scoped>
.admin-dashboard {
  padding: var(--space);
  
  h1 {
    color: var(--color-primary);
    margin-bottom: var(--space);
  }
  
  .admin-actions {
    margin-top: var(--space-lg);
    
    h2 {
      color: var(--color-secondary);
      margin-bottom: var(--space-s);
    }
    
    ul {
      list-style: none;
      padding: 0;
      
      li {
        padding: var(--space-s);
        background: var(--color-background-secondary);
        margin-bottom: var(--space-xs);
        border-radius: var(--border-radius);
        cursor: pointer;
        
        &:hover {
          background: var(--color-primary);
          color: var(--color-primary-text);
        }
      }
    }
  }
}
</style>