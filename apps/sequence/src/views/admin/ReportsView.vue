<template>
  <div class="reports-view">
    <div class="reports-header">
      <h1>Issue Reports</h1>
      <div class="reports-filters">
        <select v-model="filters.app" @change="loadReports">
          <option value="">All Apps</option>
          <option value="sequence">Sequence</option>
          <option value="cards">Cards</option>
          <option value="timer">Timer</option>
          <option value="yes-no">Yes-No</option>
          <option value="radio">Radio</option>
          <option value="todo">Todo</option>
          <option value="type">Type</option>
        </select>

        <select v-model="filters.type" @change="loadReports">
          <option value="">All Types</option>
          <option value="bug">Bug Report</option>
          <option value="feature">Feature Request</option>
          <option value="improvement">Improvement</option>
          <option value="other">Other</option>
        </select>

        <input
          v-model="filters.search"
          type="text"
          placeholder="Search descriptions..."
          @input="debounceSearch"
          class="search-input"
        />

        <button @click="refreshReports" class="refresh-btn" :disabled="loading">
          🔄 Refresh
        </button>
      </div>
    </div>

    <div v-if="loading" class="loading">
      Loading reports...
    </div>

    <div v-else-if="error" class="error">
      <p>Error loading reports: {{ error }}</p>
      <button @click="loadReports">Retry</button>
    </div>

    <div v-else-if="reports.length === 0" class="empty">
      <p>No reports found matching your criteria.</p>
    </div>

    <div v-else class="reports-list">
      <div class="reports-stats">
        <div class="stat">
          <span class="stat-number">{{ reports.length }}</span>
          <span class="stat-label">Total Reports</span>
        </div>
        <div class="stat">
          <span class="stat-number">{{ bugCount }}</span>
          <span class="stat-label">Bug Reports</span>
        </div>
        <div class="stat">
          <span class="stat-number">{{ featureCount }}</span>
          <span class="stat-label">Feature Requests</span>
        </div>
      </div>

      <div class="reports-table">
        <div class="table-header">
          <div class="col-date">Date</div>
          <div class="col-app">App</div>
          <div class="col-type">Type</div>
          <div class="col-description">Description</div>
          <div class="col-contact">Contact</div>
          <div class="col-actions">Actions</div>
        </div>

        <div
          v-for="report in paginatedReports"
          :key="report.id"
          class="table-row"
          :class="{ 'row-expanded': expandedReport === report.id }"
        >
          <div class="col-date">
            <div class="date-main">{{ formatDate(report.created_at) }}</div>
            <div class="date-time">{{ formatTime(report.created_at) }}</div>
          </div>

          <div class="col-app">
            <span class="app-badge" :data-app="report.app_name">
              {{ report.app_name }}
            </span>
          </div>

          <div class="col-type">
            <span class="type-badge" :data-type="report.issue_type">
              {{ formatType(report.issue_type) }}
            </span>
          </div>

          <div class="col-description">
            <div class="description-preview">
              {{ truncateText(report.description, 100) }}
            </div>
          </div>

          <div class="col-contact">
            <span v-if="report.user_email" class="contact-email">
              {{ report.user_email }}
            </span>
            <span v-else class="no-contact">No contact</span>
          </div>

          <div class="col-actions">
            <button
              @click="toggleExpand(report.id)"
              class="action-btn"
              :title="expandedReport === report.id ? 'Collapse' : 'View Details'"
            >
              {{ expandedReport === report.id ? '▲' : '▼' }}
            </button>
            <button
              v-if="report.user_email"
              @click="emailUser(report)"
              class="action-btn email-btn"
              title="Email User"
            >
              ✉️
            </button>
          </div>
        </div>

        <!-- Expanded Details -->
        <div
          v-for="report in paginatedReports"
          :key="`${report.id}-details`"
          v-show="expandedReport === report.id"
          class="report-details"
        >
          <div class="details-grid">
            <div class="detail-section">
              <h4>Full Description</h4>
              <p class="description-full">{{ report.description }}</p>
            </div>

            <div class="detail-section">
              <h4>Technical Information</h4>
              <div class="tech-info">
                <div class="tech-item">
                  <strong>Version:</strong>
                  {{ report.build_info?.version || 'Unknown' }}
                </div>
                <div class="tech-item">
                  <strong>Build:</strong>
                  {{ report.build_info?.buildNumber || 'Unknown' }}
                </div>
                <div class="tech-item">
                  <strong>Environment:</strong>
                  {{ report.build_info?.environment || 'Unknown' }}
                </div>
                <div class="tech-item">
                  <strong>User Agent:</strong>
                  {{ report.user_agent }}
                </div>
                <div v-if="report.metadata?.url" class="tech-item">
                  <strong>URL:</strong>
                  <a :href="report.metadata.url" target="_blank" rel="noopener">
                    {{ report.metadata.url }}
                  </a>
                </div>
                <div v-if="report.metadata?.timezone" class="tech-item">
                  <strong>Timezone:</strong>
                  {{ report.metadata.timezone }}
                </div>
                <div v-if="report.metadata?.screenResolution" class="tech-item">
                  <strong>Screen:</strong>
                  {{ report.metadata.screenResolution }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Pagination -->
      <div v-if="totalPages > 1" class="pagination">
        <button
          @click="currentPage = Math.max(1, currentPage - 1)"
          :disabled="currentPage === 1"
          class="page-btn"
        >
          ← Previous
        </button>

        <span class="page-info">
          Page {{ currentPage }} of {{ totalPages }}
          ({{ reports.length }} total reports)
        </span>

        <button
          @click="currentPage = Math.min(totalPages, currentPage + 1)"
          :disabled="currentPage === totalPages"
          class="page-btn"
        >
          Next →
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { formatDate, formatTime } from '@tiko/core'
import { ref, onMounted, computed } from 'vue'

interface IssueReport {
  id: string
  app_name: string
  issue_type: 'bug' | 'feature' | 'improvement' | 'other'
  description: string
  user_email?: string
  build_info?: {
    version?: string
    buildNumber?: string
    environment?: string
  }
  user_agent: string
  metadata?: {
    url?: string
    referrer?: string
    screenResolution?: string
    timezone?: string
  }
  created_at: string
  updated_at: string
}

// State
const reports = ref<IssueReport[]>([])
const loading = ref(false)
const error = ref<string | null>(null)
const expandedReport = ref<string | null>(null)
const currentPage = ref(1)
const reportsPerPage = 20

// Filters
const filters = ref({
  app: '',
  type: '',
  search: ''
})

// Computed
const bugCount = computed(() => reports.value.filter(r => r.issue_type === 'bug').length)
const featureCount = computed(() => reports.value.filter(r => r.issue_type === 'feature').length)

const filteredReports = computed(() => {
  let filtered = reports.value

  if (filters.value.app) {
    filtered = filtered.filter(r => r.app_name === filters.value.app)
  }

  if (filters.value.type) {
    filtered = filtered.filter(r => r.issue_type === filters.value.type)
  }

  if (filters.value.search) {
    const search = filters.value.search.toLowerCase()
    filtered = filtered.filter(r =>
      r.description.toLowerCase().includes(search) ||
      (r.user_email && r.user_email.toLowerCase().includes(search))
    )
  }

  return filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
})

const totalPages = computed(() => Math.ceil(filteredReports.value.length / reportsPerPage))

const paginatedReports = computed(() => {
  const start = (currentPage.value - 1) * reportsPerPage
  const end = start + reportsPerPage
  return filteredReports.value.slice(start, end)
})

// Methods
const loadReports = async () => {
  loading.value = true
  error.value = null

  try {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
    const supabaseKey = import.meta.env.VITE_SUPABASE_SERVICE_KEY

    const response = await fetch(`${supabaseUrl}/rest/v1/issue_reports?order=created_at.desc`, {
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch reports: ${response.status}`)
    }

    reports.value = await response.json()
    console.log(`Loaded ${reports.value.length} issue reports`)

    // Reset to first page when filters change
    currentPage.value = 1
  } catch (err) {
    console.error('Error loading reports:', err)
    error.value = err instanceof Error ? err.message : 'Unknown error'
  } finally {
    loading.value = false
  }
}

const refreshReports = () => {
  loadReports()
}

let searchTimeout: NodeJS.Timeout
const debounceSearch = () => {
  clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    currentPage.value = 1 // Reset to first page when searching
  }, 300)
}

const toggleExpand = (reportId: string) => {
  expandedReport.value = expandedReport.value === reportId ? null : reportId
}

const emailUser = (report: IssueReport) => {
  if (!report.user_email) return

  const subject = `Re: ${formatType(report.issue_type)} - ${report.app_name}`
  const body = `Hi,\n\nThank you for your ${report.issue_type} report regarding the ${report.app_name} app.\n\n`

  const mailtoUrl = `mailto:${report.user_email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
  window.open(mailtoUrl, '_blank')
}


const formatType = (type: string) => {
  const types = {
    bug: 'Bug Report',
    feature: 'Feature Request',
    improvement: 'Improvement',
    other: 'Other'
  }
  return types[type as keyof typeof types] || type
}

const truncateText = (text: string, maxLength: number) => {
  return text.length > maxLength ? text.substring(0, maxLength) + '...' : text
}

// Lifecycle
onMounted(() => {
  loadReports()
})
</script>

<style>
.reports-view {
  padding: 2rem;
  max-width: 1400px;
  margin: 0 auto;
}

.reports-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  flex-wrap: wrap;
  gap: 1rem;
}

.reports-header h1 {
  margin: 0;
  color: #333;
}

.reports-filters {
  display: flex;
  gap: 1rem;
  align-items: center;
  flex-wrap: wrap;
}

.reports-filters select,
.search-input {
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
}

.search-input {
  min-width: 200px;
}

.refresh-btn {
  padding: 0.5rem 1rem;
  background: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}

.refresh-btn:hover:not(:disabled) {
  background: #0056b3;
}

.refresh-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.loading,
.error,
.empty {
  text-align: center;
  padding: 3rem;
  color: #666;
}

.error {
  color: #dc3545;
}

.error button {
  margin-top: 1rem;
  padding: 0.5rem 1rem;
  background: #dc3545;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.reports-stats {
  display: flex;
  gap: 2rem;
  margin-bottom: 2rem;
  flex-wrap: wrap;
}

.stat {
  text-align: center;
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 8px;
  min-width: 120px;
}

.stat-number {
  display: block;
  font-size: 2rem;
  font-weight: bold;
  color: #007bff;
}

.stat-label {
  display: block;
  font-size: 0.875rem;
  color: #666;
  margin-top: 0.25rem;
}

.reports-table {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  overflow: hidden;
}

.table-header {
  display: grid;
  grid-template-columns: 120px 100px 140px 1fr 180px 100px;
  gap: 1rem;
  padding: 1rem;
  background: #f8f9fa;
  font-weight: bold;
  border-bottom: 1px solid #dee2e6;
}

.table-row {
  display: grid;
  grid-template-columns: 120px 100px 140px 1fr 180px 100px;
  gap: 1rem;
  padding: 1rem;
  border-bottom: 1px solid #f0f0f0;
  align-items: start;
}

.table-row:hover {
  background: #f8f9fa;
}

.row-expanded {
  background: #f0f8ff !important;
}

.col-date {
  font-size: 0.875rem;
}

.date-main {
  font-weight: 600;
  color: #333;
}

.date-time {
  color: #666;
  margin-top: 2px;
}

.app-badge,
.type-badge {
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
}

.app-badge[data-app="sequence"] { background: #e3f2fd; color: #1976d2; }
.app-badge[data-app="cards"] { background: #f3e5f5; color: #7b1fa2; }
.app-badge[data-app="timer"] { background: #e8f5e8; color: #388e3c; }
.app-badge[data-app="yes-no"] { background: #fff3e0; color: #f57c00; }
.app-badge[data-app="radio"] { background: #fce4ec; color: #c2185b; }
.app-badge[data-app="todo"] { background: #e0f2f1; color: #00796b; }
.app-badge[data-app="type"] { background: #f1f8e9; color: #558b2f; }

.type-badge[data-type="bug"] { background: #ffebee; color: #d32f2f; }
.type-badge[data-type="feature"] { background: #e8f5e8; color: #388e3c; }
.type-badge[data-type="improvement"] { background: #e3f2fd; color: #1976d2; }
.type-badge[data-type="other"] { background: #f5f5f5; color: #616161; }

.description-preview {
  font-size: 0.875rem;
  line-height: 1.4;
  color: #333;
}

.contact-email {
  font-size: 0.875rem;
  color: #007bff;
  word-break: break-all;
}

.no-contact {
  font-size: 0.875rem;
  color: #999;
  font-style: italic;
}

.col-actions {
  display: flex;
  gap: 0.5rem;
}

.action-btn {
  padding: 0.25rem 0.5rem;
  border: 1px solid #ddd;
  background: white;
  cursor: pointer;
  border-radius: 4px;
  font-size: 0.875rem;
}

.action-btn:hover {
  background: #f8f9fa;
}

.email-btn:hover {
  background: #007bff;
  color: white;
  border-color: #007bff;
}

.report-details {
  grid-column: 1 / -1;
  padding: 1rem;
  background: #f8f9fa;
  border-top: 1px solid #dee2e6;
  margin: 0 -1rem -1rem -1rem;
}

.details-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2rem;
}

.detail-section h4 {
  margin: 0 0 1rem 0;
  color: #333;
  font-size: 1rem;
}

.description-full {
  background: white;
  padding: 1rem;
  border-radius: 4px;
  margin: 0;
  white-space: pre-wrap;
  line-height: 1.5;
}

.tech-info {
  background: white;
  padding: 1rem;
  border-radius: 4px;
}

.tech-item {
  margin-bottom: 0.5rem;
  font-size: 0.875rem;
}

.tech-item strong {
  color: #333;
  margin-right: 0.5rem;
}

.tech-item a {
  color: #007bff;
  word-break: break-all;
}

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 1rem;
  margin-top: 2rem;
  padding: 1rem;
}

.page-btn {
  padding: 0.5rem 1rem;
  border: 1px solid #ddd;
  background: white;
  cursor: pointer;
  border-radius: 4px;
}

.page-btn:hover:not(:disabled) {
  background: #f8f9fa;
}

.page-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.page-info {
  color: #666;
  font-size: 0.875rem;
}

@media (max-width: 1024px) {
  .table-header,
  .table-row {
    grid-template-columns: 100px 80px 120px 1fr 80px;
  }

  .col-contact {
    display: none;
  }

  .details-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .reports-view {
    padding: 1rem;
  }

  .reports-header {
    flex-direction: column;
    align-items: stretch;
  }

  .reports-filters {
    justify-content: center;
  }

  .search-input {
    min-width: 150px;
  }

  .reports-stats {
    justify-content: center;
  }

  .table-header,
  .table-row {
    grid-template-columns: 1fr;
    gap: 0.5rem;
  }

  .table-row {
    padding: 1rem 0.5rem;
  }
}
</style>
