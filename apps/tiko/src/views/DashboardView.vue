<template>
  <TAppLayout 
    :title="t('dashboard.title')" 
    :show-header="true" 
    app-name="tiko" 
    @profile="handleProfile"
    @settings="handleSettings" 
    @logout="handleLogout"
  >
    <template #app-controls>
      <!-- Login/Logout button -->
      <TButton 
        v-if="!isAuthenticated"
        :icon="Icons.USER" 
        type="outline" 
        color="primary"
        @click="handleLogin"
        :aria-label="t('auth.signIn')"
      >
        {{ t('auth.signIn') }}
      </TButton>
    </template>

    <div :class="bemm('container')">
      <!-- Welcome Section -->
      <div :class="bemm('welcome')" v-if="isAuthenticated">
        <h1 :class="bemm('welcome-title')">{{ t('dashboard.welcome', { name: userName }) }}</h1>
        <p :class="bemm('welcome-subtitle')">{{ t('dashboard.chooseApp') }}</p>
      </div>
      
      <div :class="bemm('welcome')" v-else>
        <h1 :class="bemm('welcome-title')">{{ t('dashboard.welcomeGuest') }}</h1>
        <p :class="bemm('welcome-subtitle')">{{ t('dashboard.signInForBest') }}</p>
      </div>

      <!-- App Grid -->
      <div :class="bemm('apps-section')">
        <TCardGrid 
          :cards="appCards" 
          :show-arrows="false" 
          :edit-mode="false"
          :is-loading="isLoading"
          @card-click="handleAppClick"
        />
      </div>

      <!-- SSO Section for authenticated users -->
      <div :class="bemm('sso-section')" v-if="isAuthenticated">
        <h2 :class="bemm('section-title')">{{ t('dashboard.ssoTitle') }}</h2>
        <p :class="bemm('section-subtitle')">{{ t('dashboard.ssoDescription') }}</p>
      </div>
    </div>
  </TAppLayout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useBemm } from 'bemm';
import { useRouter, useRoute } from 'vue-router';
import {
  TButton,
  TAppLayout,
  TCardGrid,
  type TCardTile
} from '@tiko/ui';
import { useI18n } from '@tiko/core';
import { useAuthStore } from '@tiko/core';
import { Icons } from 'open-icon';
import { appsService } from '../services/apps.service';
import { ssoService } from '../services/sso.service';

const bemm = useBemm('dashboard-view');
const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();
const { t } = useI18n();

// Reactive state
const isLoading = ref(false);
const appCards = ref<TCardTile[]>([]);

// Computed properties
const isAuthenticated = computed(() => authStore.isAuthenticated);
const userName = computed(() => {
  const user = authStore.user;
  if (user?.user_metadata?.full_name) {
    return user.user_metadata.full_name;
  }
  if (user?.email) {
    return user.email.split('@')[0];
  }
  return t('common.user');
});

// Event handlers
const handleProfile = () => {
  console.log('Profile clicked');
};

const handleSettings = () => {
  console.log('Settings clicked');
};

const handleLogout = () => {
  console.log('User logged out');
};

const handleLogin = () => {
  // Navigate to login or open login modal
  console.log('Login clicked');
};

const handleAppClick = async (card: TCardTile) => {
  if (card.url) {
    try {
      // Get the full app data for SSO URL generation
      const app = await appsService.getApp(card.id);
      if (!app) {
        window.location.href = card.url;
        return;
      }

      // Generate SSO URL with token if authenticated
      const ssoUrl = appsService.generateSSOUrl(
        app, 
        isAuthenticated.value ? authStore.session?.access_token : undefined
      );
      
      window.location.href = ssoUrl;
    } catch (error) {
      console.error('Failed to navigate to app:', error);
      // Fallback to direct navigation
      window.location.href = card.url;
    }
  }
};

// Data loading
const loadApps = async () => {
  isLoading.value = true;
  
  try {
    // Load apps from the apps service
    appCards.value = await appsService.getAppsAsCards();
  } catch (error) {
    console.error('Failed to load apps:', error);
    appCards.value = [];
  } finally {
    isLoading.value = false;
  }
};

// SSO handling
const handleSSORequest = async () => {
  const requestId = route.query.request_id as string;
  const appId = route.query.app_id as string;
  const returnUrl = route.query.return_url as string;

  if (requestId && appId && returnUrl) {
    try {
      const ssoResponse = await ssoService.handleSSORequest(requestId, appId, returnUrl);
      
      if (ssoResponse.success) {
        // User is authenticated, redirect back with tokens
        const redirectUrl = new URL(returnUrl);
        redirectUrl.searchParams.set('sso_token', ssoResponse.accessToken!);
        if (ssoResponse.refreshToken) {
          redirectUrl.searchParams.set('sso_refresh_token', ssoResponse.refreshToken);
        }
        redirectUrl.searchParams.set('sso_request_id', requestId);
        redirectUrl.searchParams.set('sso_success', 'true');
        
        window.location.href = redirectUrl.toString();
        return;
      } else if (ssoResponse.error === 'Authentication required') {
        // User needs to login, SSO request is stored for later
        console.log('User needs to authenticate for SSO');
        // The SSO request is now stored in sessionStorage
        // After successful login, completeSSOFlow will be called
      }
    } catch (error) {
      console.error('SSO request handling failed:', error);
    }
  }
};

// Watch for authentication changes to complete SSO flow
watch(
  () => authStore.isAuthenticated,
  async (isAuthenticated) => {
    if (isAuthenticated) {
      // Try to complete any pending SSO flow
      const completed = await ssoService.completeSSOFlow();
      if (completed) {
        console.log('SSO flow completed successfully');
        // The page will redirect, so we don't need to do anything else
      }
    }
  }
);

// Initialize
onMounted(async () => {
  await loadApps();
  
  // Handle SSO request if present
  if (route.path === '/sso' || route.query.request_id) {
    await handleSSORequest();
  }
});
</script>

<style lang="scss" scoped>
.dashboard-view {
  &__container {
    padding: var(--space);
    max-width: 1200px;
    margin: 0 auto;
    display: flex;
    flex-direction: column;
    gap: var(--space-xl);
  }

  &__welcome {
    text-align: center;
    padding: var(--space-xl) 0;
  }

  &__welcome-title {
    font-size: var(--font-size-xxl);
    font-weight: 700;
    color: var(--color-text);
    margin-bottom: var(--space);
  }

  &__welcome-subtitle {
    font-size: var(--font-size-lg);
    color: var(--color-text-muted);
    font-weight: 400;
  }

  &__apps-section {
    width: 100%;
  }

  &__sso-section {
    background: var(--color-background-secondary);
    border: 2px solid var(--color-border);
    border-radius: var(--border-radius);
    padding: var(--space-xl);
    text-align: center;
  }

  &__section-title {
    font-size: var(--font-size-xl);
    font-weight: 600;
    color: var(--color-text);
    margin-bottom: var(--space);
  }

  &__section-subtitle {
    font-size: var(--font-size);
    color: var(--color-text-muted);
    font-weight: 400;
  }
}

// Responsive design
@media (max-width: 768px) {
  .dashboard-view {
    &__container {
      padding: var(--space);
      gap: var(--space-lg);
    }

    &__welcome {
      padding: var(--space-lg) 0;
    }

    &__welcome-title {
      font-size: var(--font-size-xl);
    }

    &__welcome-subtitle {
      font-size: var(--font-size);
    }
  }
}
</style>