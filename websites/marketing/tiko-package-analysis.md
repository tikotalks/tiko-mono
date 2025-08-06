# Tiko Package Usage Analysis for Marketing Website

## Summary

The marketing website uses a minimal subset of `@tiko/core` and `@tiko/ui` packages:

### @tiko/core (7 unique imports)
- **contentService** - Main content API service
- **useContent** - Content composable for loading pages/sections
- **useImages** - Image management composable
- **useImageUrl** - Image URL optimization utilities
- **UnifiedContentService** - Optimized content service
- **ContentSection** (type) - Section data type
- **PageContent** (type) - Page data type

### @tiko/ui (8 unique imports)
- **TFramework** - Main app framework wrapper
- **TButton** - Button component
- **TButtonGroup** - Button group component
- **TCard** - Card component
- **TIcon** - Icon component
- **TLogo** - Logo component
- **useI18n** - Internationalization composable
- **FrameworkConfig** (type) - Framework configuration type

## SSR-Blocking Issues Identified

### Critical SSR Blockers

1. **TFramework Component** (`@tiko/ui`)
   - Uses `sessionStorage` (lines 138, 282)
   - Uses `document.documentElement` for theme application (lines 324-335)
   - Uses `window.location.reload()` (line 283)
   - Heavy Pinia store integration that expects client-side initialization
   - **Impact**: Cannot be used in SSR environment without significant refactoring

2. **useI18n Composable** (`@tiko/ui`)
   - Uses `localStorage` for locale persistence (lines 146, 147, 161)
   - Uses `navigator.language` for browser locale detection (line 388)
   - **Impact**: Needs SSR-safe guards or server-side alternatives

3. **useImages Composable** (`@tiko/core`)
   - Uses `onMounted` and `onUnmounted` lifecycle hooks (lines 151, 156)
   - Event bus system that may not work in SSR
   - **Impact**: Lifecycle hooks need SSR-safe implementation

### Potential SSR Issues

1. **useContent Composable** (`@tiko/core`)
   - No direct browser API usage found
   - But depends on services that might use browser APIs
   - Uses Vue reactivity which needs proper SSR hydration

2. **UI Components** (TButton, TCard, TIcon, TLogo)
   - Need to verify if they have any browser API usage
   - May have CSS-in-JS or dynamic styling that needs SSR handling

## Quantification of Usage vs Refactoring Needs

### What the Marketing Site Actually Uses:
- **7 imports from @tiko/core** (out of potentially hundreds of exports)
- **8 imports from @tiko/ui** (out of 50+ components)
- **Total: ~15 imports** from massive monorepo packages

### Refactoring Requirements:

#### Option 1: Fix SSR Issues in Existing Packages
**Effort Required:**
- Refactor TFramework to be SSR-safe: **High complexity**
- Make useI18n SSR-compatible: **Medium complexity**
- Update useImages for SSR: **Low-Medium complexity**
- Test all changes across entire monorepo: **Very High effort**

**Risks:**
- Breaking changes for other apps using these packages
- Increased bundle size with SSR guards
- Maintenance burden of dual client/server code paths

#### Option 2: Create Marketing-Specific Implementations
**Effort Required:**
- Create lightweight SSR-safe alternatives: **Medium complexity**
- Only implement what marketing actually needs: **Low complexity**
- No risk to other apps: **Zero risk**

### Recommendation

Given that the marketing website uses **less than 1%** of the total package exports, creating marketing-specific implementations is far more efficient than refactoring the entire packages for SSR compatibility.

## Specific SSR-Safe Replacements Needed

1. **Framework/Layout Component**
   - Remove auth, Pinia, and theme management
   - Simple layout wrapper with slots

2. **I18n Solution**
   - Static translations without localStorage
   - Server-side locale detection via headers

3. **Content Loading**
   - SSR-compatible content fetching
   - Static or edge-cached content

4. **UI Components**
   - Simple, SSR-safe versions of TButton, TCard, TIcon, TLogo
   - No client-side state or browser APIs

## Conclusion

The marketing website's minimal usage of @tiko packages (~15 imports) makes it inefficient to refactor entire packages for SSR. Creating targeted, lightweight replacements for just these 15 imports would be:
- Faster to implement
- Lower risk
- Better performance
- Easier to maintain

The effort to make @tiko/core and @tiko/ui fully SSR-compatible would be disproportionate to the benefit, especially since 99% of the packages' functionality isn't used by the marketing site.