<template>
  <div :class="bemm()">

    <HeroSection
      :content="{
        title: 'Everyone deserves a voice.',
        content: 'Tiko is a free, open-source platform full of simple communication apps, made for anyone who struggles to express themselves.'
      }"
      :section="null"
      :class="bemm('hero')"
    />


    <AboutSection
      :content="{
        title: 'Communication made simple, accessible, and free.',
        image: '73a22d73-0baa-46b1-b812-5f8f4c47970b',
        body: `
        Millions of people struggle to communicate. Some can't speak. Some find words hard to access. Others simply do
n’t have the right tools. Most of the apps out there are expensive, complex, or full of clutter. They're built for systems, not for people.

**Tiko is here to fix that.**

It started with one child who needed help to express himself. What followed was the idea that communication tools should be free, simple, and made for real people. Not just children, but anyone who wants to connect.

Tiko is not one big app. It's a growing set of small, focused tools. Each one does a single thing well. No logins. No ads. No confusion. Just tap, speak, and be heard.

We believe that communication is a basic human right. That’s why everything we build is open source, free for everyone, and shaped by the people who use it.

_Tiko is a movement. And it’s just getting started._
        `
      }"
      :class="bemm('about')"
    />


    <ImageBlockSection
      :content="{
        items: [{
          image: 'b40ac007-447c-4e75-9849-ee236f0f80af',
          color: 'red',
        }, {
          image: '12b28832-b58e-4073-a260-af38607fc666',
          color: 'beige',
        }
        ]
      }"
      :section="null"
      :class="bemm('image-block')"
    />

    <AppsSection
      :content="{
        title: 'One app for every need.',
        body: appsBody,
        image: 'b0c1f8d2-3c4e-4f5a-9b6e-7c8d9e0f1a2b',
        apps: [{
          title: 'Yes/No',
          description: 'A simple app for answering yes or no questions.',
          image: '48fd33af-f51e-4431-9923-d9d8a7333225',
          link: '/apps/yes-no',
          color: 'red'
        }, {
          title: 'Food Choices',
          description: 'An app for selecting food options.',
          image: '961c280f-391f-4eb0-b59f-6764cb52bf93',
          link: '/apps/food-choices',
          color: 'blue'
        }, {
          title: 'Sentence Builder',
          description: 'An app for building sentences with symbols.',
          image: '4994e6b8-7909-4700-aa28-37da5068a033',
          link: '/apps/sentence-builder',
          color: 'green'
        }, {
          title: 'Emotion Selector',
          description: 'An app for selecting emotions with symbols.',
          image: '680d3370-8114-4deb-baf2-fdbad3aa4568',
          link: '/apps/emotion-selector',
          color: 'purple'
        },{
          title: 'Action Describer',
          description: 'An app for describing actions with symbols.',
          image: 'e0efbade-df94-4aa6-80a6-c3dd2a1d7090',
          link: '/apps/action-describer',
          color: 'orange'
        }, {
          title: 'More coming soon...',
          description: 'We’re always adding new apps based on user feedback.',
          image: 'd8dd1834-656e-40b1-950d-3bb3def14145',
          link: '/apps',
          color: 'brown'
        },
        {
          title: 'Tiko Web',
          description: 'Access all Tiko apps in your browser.',
          image: '5de438c4-b8ee-470c-919b-e2c73ef632b6',
          link: '/apps/web',
          color: 'turquoise'
        },
        {
          title: 'Tiko Desktop',
          description: 'Download Tiko for your computer.',
          image: 'fadacc44-cf30-466e-962b-fc87362980f9',
          link: '/apps/desktop',
          color: 'coral'
        },
        {
          title: 'Tiko Mobile',
          description: 'Get Tiko on your phone or tablet.',
          image: 'd92c05c9-be8a-4670-8b05-e37442abf88f',
          link: '/apps/mobile',
          color: 'violet'
        }

      ]
      }"
      :section="null"
      :class="bemm('apps')"
    />

    <FundingSection
      :content="{
        title: 'Help us keep it free for everyone.',
        subtitle: `Tiko is built to stay free — no subscriptions, no ads, and no locked features.`,
        body: `But creating high-quality, accessible apps takes time, effort, and resources. Funding helps us build more apps, reach more languages, improve accessibility, and support the people who make it all possible.

We’re supported through public grants, ethical sponsorships, and community contributions. Whether you're an individual, a foundation, or an organization, your help makes a real difference.

Every contribution counts. Whether it’s time, money, or spreading the word — you can be part of it.
`,
        image: '0145f4a8-304d-4076-a8f7-d160aeac8d9f',
        ctas: [{
          text: 'Support Tiko',
          link: '/support-now',
          color: 'primary',
          type: 'default',
          size: 'large'
        },{
          text: 'Learn more',
          link: '/sponsors',
          type: 'outline',
          color: 'primary',
          size: 'large'
        }]

      }"
      :section="null"
      :class="bemm('funding')"
      />

    <!-- Loading State -->
    <div v-if="loading" :class="bemm('loading')">
      <div :class="bemm('loading-spinner')"></div>
    </div>

   <pre>{{ pageData }}</pre>
    <!-- Dynamic Sections -->
    <template v-if="!loading && pageData?.sections?.length">

      <SectionRenderer
        v-for="section in pageData.sections"
        :key="section.section.id"
        :section="section.section"
        :content="section.content"
        :show-debug="true"
      />
    </template>

    <!-- Error State -->
    <div v-else-if="!loading && error" :class="bemm('error')">
      <p>{{ error }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useBemm } from 'bemm'
import { useContent, type PageContent } from '@tiko/core'
import { useI18n } from '@tiko/ui'
import { ref, onMounted, watch } from 'vue'
import SectionRenderer from '../components/SectionRenderer.vue'
import HeroSection from '@/components/sections/HeroSection.vue'
import AboutSection from '@/components/sections/AboutSection.vue'
import FundingSection from '@/components/sections/FundingSection.vue'
import AppsSection from '@/components/sections/AppsSection.vue'
import ImageBlockSection from '@/components/sections/ImageBlockSection.vue'

const bemm = useBemm('home-view')
const { locale } = useI18n()
const content = useContent({ projectSlug: 'marketing' })

// Page content
const pageData = ref<PageContent | null>(null)
const loading = ref(true)
const error = ref<string | null>(null)

// Function to load content for current language
async function loadContent() {
  try {
    loading.value = true
    error.value = null

    // Get language code from locale (e.g., 'en-GB' -> 'en')
    const languageCode = locale.value.split('-')[0]
    console.log(`Loading page content for marketing project in ${languageCode}...`)

    // Try to get the home page for current language
    // CRITICAL: skipCache=true to bypass cache and get fresh data from DB
    console.log(`🏠 [HomeView] Loading fresh page data for 'home' in ${languageCode}...`)
    const page = await content.getPage('home', languageCode, true)
    console.log('Page response:', page)

    if (page) {
      pageData.value = page
      console.log('Page data loaded:', pageData.value)
    } else {
      // Try to list all pages to see what's available
      const allPages = await content.getPages()
      console.log('Available pages:', allPages)
      error.value = `No content found for "home" page in ${languageCode}. Available pages logged to console.`
    }
  } catch (err) {
    console.error('Failed to load page content:', err)
    error.value = `Failed to load content: ${err instanceof Error ? err.message : 'Unknown error'}`
  } finally {
    loading.value = false
  }
}

// Load content on mount
onMounted(() => {
  loadContent()
})

// Reload content when language changes
watch(locale, () => {
  loadContent()
})

const appsBody = `
Tiko is not one app. It’s a collection of tiny, purpose-built tools. Each app is focused on a single task, whether it's answering yes or no, choosing food, building a sentence, or pointing to an emotion.

This philosophy is what makes Tiko unique. Instead of one complex interface trying to do everything, we create focused apps that are clear and easy to use. Each app is designed for one goal, so there's no clutter, no menus to learn, and no distractions. Just tap and go.

This also means we can move fast. When someone says, "We need an app that lets someone choose their favorite toy, we can build it. When a teacher says, "I need a tool to help students describe actions," we can add it. Tiko grows with its users.

Apps are designed to work across devices. Whether on a tablet, phone, or desktop, everything works instantly and without setup. No accounts required. No internet needed once installed.

_Communication should be simple. So we build simple tools — and as many as needed.`
</script>

<style lang="scss">
.home-view {
  // Loading state
  &__loading {
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 100vh;
    padding: var(--space-2xl);
  }

  &__loading-spinner {
    width: 48px;
    height: 48px;
    border: 4px solid var(--color-primary-20);
    border-top-color: var(--color-primary);
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }

  &__error {
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 100vh;
    padding: var(--space-2xl);
    color: var(--color-error);
  }
}
</style>
