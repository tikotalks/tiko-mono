<template>
  <div class="admin-dashboard">
    <div class="admin-header">
      <h1>Admin Dashboard</h1>
      <router-link to="/" class="back-link">← Back to App</router-link>
    </div>

    <div class="admin-cards">
      <div class="admin-card" @click="$router.push('/admin/public-items')">
        <div class="card-icon">📋</div>
        <h3>Public Items</h3>
        <p>Manage public content and curation across all Tiko apps</p>
        <div class="card-action">Manage Items →</div>
      </div>

      <div class="admin-card" @click="$router.push('/admin/reports')">
        <div class="card-icon">🐛</div>
        <h3>Issue Reports</h3>
        <p>View and manage user-submitted bug reports and feature requests</p>
        <div class="card-action">View Reports →</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// No additional logic needed for this dashboard
</script>

<style scoped>
.admin-dashboard {
  max-width: 800px;
  margin: 0 auto;
  padding: 2rem;
}

.admin-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 3rem;
}

.admin-header h1 {
  margin: 0;
  color: #333;
  font-size: 2rem;
}

.back-link {
  color: #6c757d;
  text-decoration: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  transition: background-color 0.2s;
}

.back-link:hover {
  background: #f8f9fa;
  color: #495057;
}

.admin-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 2rem;
}

.admin-card {
  background: white;
  border-radius: 8px;
  padding: 2rem;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  cursor: pointer;
  transition: all 0.3s ease;
  border: 1px solid #e9ecef;
}

.admin-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
}

.card-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.admin-card h3 {
  margin: 0 0 1rem 0;
  color: #333;
  font-size: 1.5rem;
}

.admin-card p {
  color: #6c757d;
  margin: 0 0 1.5rem 0;
  line-height: 1.5;
}

.card-action {
  color: #007bff;
  font-weight: 600;
  font-size: 0.9rem;
}

@media (max-width: 768px) {
  .admin-dashboard {
    padding: 1rem;
  }
  
  .admin-header {
    flex-direction: column;
    align-items: stretch;
    gap: 1rem;
  }
  
  .admin-cards {
    grid-template-columns: 1fr;
  }
}
</style>