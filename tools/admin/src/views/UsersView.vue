<template>
  <div :class="bemm()">
    <div :class="bemm('header')">
      <h1>{{ t(keys.admin.users.title) }}</h1>
      <div :class="bemm('actions')">
        <TInput
          v-model="searchQuery"
          :placeholder="t(keys.admin.users.searchPlaceholder)"
          :icon="Icons.SEARCH_L"
          :class="bemm('search')"
        />
        <TButton
          color="primary"
          :icon="Icons.USER_ADD"
          @click="showAddUserModal"
        >
          {{ t(keys.admin.users.addUser) }}
        </TButton>
      </div>
    </div>

    <div v-if="loading" :class="bemm('loading')">
      <TSpinner />
    </div>

    <div v-else :class="bemm('content')">
      <!-- User Stats -->
      <div :class="bemm('stats')">
        <TCard :class="bemm('stat-card')">
          <h3>{{ t(keys.admin.users.totalUsers) }}</h3>
          <p class="stat-value">{{ users.length }}</p>
        </TCard>
        <TCard :class="bemm('stat-card')">
          <h3>{{ t(keys.admin.users.activeUsers) }}</h3>
          <p class="stat-value">{{ activeUsersCount }}</p>
        </TCard>
        <TCard :class="bemm('stat-card')">
          <h3>{{ t(keys.admin.users.adminUsers) }}</h3>
          <p class="stat-value">{{ adminUsersCount }}</p>
        </TCard>
        <TCard :class="bemm('stat-card')">
          <h3>{{ t(keys.admin.users.newThisMonth) }}</h3>
          <p class="stat-value">{{ newUsersThisMonth }}</p>
        </TCard>
      </div>

      <!-- Users Table -->
      <TCard :class="bemm('table-card')">
        <table :class="bemm('table')">
          <thead>
            <tr>
              <th>{{ t(keys.admin.users.avatar) }}</th>
              <th>{{ t(keys.admin.users.name) }}</th>
              <th>{{ t(keys.admin.users.email) }}</th>
              <th>{{ t(keys.admin.users.role) }}</th>
              <th>{{ t(keys.admin.users.status) }}</th>
              <th>{{ t(keys.admin.users.joined) }}</th>
              <th>{{ t(keys.admin.users.lastActive) }}</th>
              <th>{{ t(keys.admin.users.actions) }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="user in filteredUsers" :key="user.id">
              <td>
                <div :class="bemm('avatar')">
                  <img v-if="user.avatar_url" :src="user.avatar_url" :alt="user.name" />
                  <TIcon v-else :name="Icons.USER" />
                </div>
              </td>
              <td>{{ user.name || user.username }}</td>
              <td>{{ user.email }}</td>
              <td>
                <TChip :color="getRoleColor(user.role)">
                  {{ user.role }}
                </TChip>
              </td>
              <td>
                <TChip :color="user.is_active ? 'success' : 'error'">
                  {{ user.is_active ? t(keys.admin.users.active) : t(keys.admin.users.inactive) }}
                </TChip>
              </td>
              <td>{{ formatDate(user.created_at) }}</td>
              <td>{{ formatDate(user.last_sign_in_at || user.updated_at) }}</td>
              <td>
                <div :class="bemm('table-actions')">
                  <TButton
                    type="ghost"
                    size="small"
                    :icon="Icons.FILE_EDIT"
                    @click="editUser(user)"
                  />
                  <TButton
                    type="ghost"
                    size="small"
                    :icon="Icons.LOCK"
                    @click="toggleUserStatus(user)"
                  />
                  <TButton
                    type="ghost"
                    size="small"
                    color="error"
                    :icon="Icons.MULTIPLY_M"
                    @click="deleteUser(user)"
                  />
                </div>
              </td>
            </tr>
          </tbody>
        </table>

        <div v-if="filteredUsers.length === 0" :class="bemm('empty')">
          <TIcon :name="Icons.USER_GROUPS" size="large" />
          <p>{{ t(keys.admin.users.noUsersFound) }}</p>
        </div>
      </TCard>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, inject } from 'vue'
import { useBemm } from 'bemm'
import { TCard, TButton, TIcon, TSpinner, TInput, TChip, ConfirmDialog, useI18n } from '@tiko/ui'
import { Icons } from 'open-icon'
import { userService } from '@tiko/core'
import type { PopupService, ToastService } from '@tiko/ui'
import type { UserProfile } from '@tiko/core'
import UserEditModal from '../components/UserEditModal.vue'


const bemm = useBemm('users-view')
const { keys, t } = useI18n()
const popupService = inject<PopupService>('popupService')
const toastService = inject<ToastService>('toastService')

const loading = ref(true)
const searchQuery = ref('')
const users = ref<UserProfile[]>([])

const filteredUsers = computed(() => {
  if (!searchQuery.value) return users.value

  const query = searchQuery.value.toLowerCase()
  return users.value.filter(user =>
    user.email.toLowerCase().includes(query) ||
    user.name?.toLowerCase().includes(query) ||
    user.username?.toLowerCase().includes(query) ||
    user.role.toLowerCase().includes(query)
  )
})

const activeUsersCount = computed(() =>
  users.value.filter(u => u.is_active).length
)

const adminUsersCount = computed(() =>
  users.value.filter(u => u.role === 'admin').length
)

const newUsersThisMonth = computed(() => {
  const oneMonthAgo = new Date()
  oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1)

  return users.value.filter(u =>
    new Date(u.created_at) > oneMonthAgo
  ).length
})

const formatDate = (dateString: string | undefined): string => {
  if (!dateString) return t(keys.common.never)
  return new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(new Date(dateString))
}

const getRoleColor = (role: string): string => {
  switch (role) {
    case 'admin': return 'error'
    case 'moderator': return 'warning'
    default: return 'primary'
  }
}

const showAddUserModal = () => {
  popupService?.open({
    component: UserEditModal,
    props: {
      onSave: async (user: UserProfile) => {
        // Refresh the user list
        await loadUsers()
      }
    }
  })
}

const editUser = (user: UserProfile) => {
  popupService?.open({
    component: UserEditModal,
    props: {
      user,
      onSave: async (updatedUser: UserProfile) => {
        // Update the user in the list
        const index = users.value.findIndex(u => u.id === updatedUser.id)
        if (index !== -1) {
          users.value[index] = updatedUser
        }
      }
    }
  })
}

const toggleUserStatus = async (user: UserProfile) => {
  const action = user.is_active ? 'deactivate' : 'activate'

  popupService?.open({
    component: ConfirmDialog,
    props: {
      title: t(keys.admin.users[`confirm${action.charAt(0).toUpperCase() + action.slice(1)}Title`]),
      message: t(keys.admin.users[`confirm${action.charAt(0).toUpperCase() + action.slice(1)}Message`], { name: user.name || user.email }),
      confirmLabel: t(keys.admin.users[action]),
      cancelLabel: t(keys.common.cancel),
      confirmColor: user.is_active ? 'warning' : 'success',
      icon: Icons.LOCK,
      onConfirm: async () => {
        try {
          const updatedUser = await userService.toggleUserStatus(user.id)

          // Update the user in the list
          const index = users.value.findIndex(u => u.id === user.id)
          if (index !== -1) {
            users.value[index] = updatedUser
          }

          toastService?.show({
            message: t(keys.admin.users[`${action}Success`], { name: user.name || user.email }),
            type: 'success'
          })
        } catch (error) {
          toastService?.show({
            message: t(keys.admin.users[`${action}Error`]),
            type: 'error'
          })
        }
      }
    }
  })
}

const loadUsers = async () => {
  try {
    users.value = await userService.getAllUsers()
  } catch (error) {
    console.error('Failed to load users:', error)
    toastService?.show({
      message: t(keys.admin.users.loadError),
      type: 'error'
    })
  }
}

const deleteUser = (user: UserProfile) => {
  popupService?.open({
    component: ConfirmDialog,
    props: {
      title: t(keys.admin.users.confirmDeleteTitle),
      message: t(keys.admin.users.confirmDeleteMessage, { name: user.name || user.email }),
      confirmLabel: t(keys.admin.users.delete),
      cancelLabel: t(keys.common.cancel),
      confirmColor: 'error',
      icon: Icons.ALERT_CIRCLE,
      onConfirm: async () => {
        try {
          await userService.deleteUser(user.id)

          // Remove the user from the list
          users.value = users.value.filter(u => u.id !== user.id)

          toastService?.show({
            message: t(keys.admin.users.deleteSuccess, { name: user.name || user.email }),
            type: 'success'
          })
        } catch (error) {
          toastService?.show({
            message: t(keys.admin.users.deleteError),
            type: 'error'
          })
        }
      }
    }
  })
}

onMounted(async () => {
  try {
    // Check if current user is admin
    const isAdmin = await userService.isCurrentUserAdmin()
    if (!isAdmin) {
      toastService?.show({
        message: t(keys.admin.users.noPermission),
        type: 'error'
      })
      loading.value = false
      return
    }

    // Load all users
    await loadUsers()
  } catch (error) {
    console.error('Failed to load users:', error)
    toastService?.show({
      message: t(keys.admin.users.loadError),
      type: 'error'
    })
  } finally {
    loading.value = false
  }
})
</script>

<style lang="scss">
.users-view {
  padding: var(--space);

  &__header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: var(--space-l);

    h1 {
      font-size: var(--font-size-xl);
      font-weight: 600;
    }
  }

  &__actions {
    display: flex;
    gap: var(--space);
    align-items: center;
  }

  &__search {
    width: 300px;
  }

  &__loading {
    display: flex;
    justify-content: center;
    align-items: center;
    padding: var(--space-xl);
  }

  &__content {
    display: flex;
    flex-direction: column;
    gap: var(--space-l);
  }

  &__stats {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: var(--space);
  }

  &__stat-card {
    text-align: center;

    h3 {
      font-size: var(--font-size-s);
      color: var(--color-text-secondary);
      margin-bottom: var(--space-xs);
      font-weight: normal;
    }

    .stat-value {
      font-size: var(--font-size-2xl);
      font-weight: bold;
      color: var(--color-primary);
    }
  }

  &__table-card {
    overflow-x: auto;
  }

  &__table {
    width: 100%;
    border-collapse: collapse;

    th {
      text-align: left;
      padding: var(--space);
      font-weight: 600;
      color: var(--color-text-secondary);
      border-bottom: 2px solid var(--color-border);
      font-size: var(--font-size-s);
    }

    td {
      padding: var(--space);
      border-bottom: 1px solid var(--color-border);
    }

    tr:hover {
      background: var(--color-background-secondary);
    }
  }

  &__avatar {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    overflow: hidden;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--color-background-secondary);

    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .t-icon {
      font-size: 1.5rem;
      color: var(--color-text-secondary);
    }
  }

  &__table-actions {
    display: flex;
    gap: var(--space-xs);
  }

  &__empty {
    text-align: center;
    padding: var(--space-xl);
    color: var(--color-text-secondary);

    .t-icon {
      margin-bottom: var(--space);
      opacity: 0.5;
    }

    p {
      font-size: var(--font-size);
    }
  }
}
</style>