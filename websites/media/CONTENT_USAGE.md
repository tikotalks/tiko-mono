# Using Dynamic Content on the Marketing Website

The marketing website now supports dynamic content loading using the `useContent` composable from `@tiko/core`.

## How it Works

1. **App Initialization**: The App.vue initializes the content project on mount:
   ```typescript
   const content = useContent()
   onMounted(async () => {
     await content.setProject('marketing')
   })
   ```

2. **HomeView Implementation**: The homepage loads content dynamically:
   - Fetches the 'home' page on component mount
   - Looks for specific sections: hero, features, apps, parents
   - Falls back to hardcoded content if CMS content is not available

3. **Dynamic Section Rendering**: When CMS content is available, sections are rendered using the `SectionRenderer` component.

## Content Structure

To use dynamic content, create the following structure in your CMS:

### Project
- Key: `marketing`
- Name: Marketing Website

### Page
- Key: `home`
- Sections:

#### Hero Section
- Key: `hero`
- Content fields:
  - `title`: Main headline
  - `subtitle`: Subheadline text
  - `ctaText`: Button text
  - `ctaLink`: Button link (internal or external)

#### Features Section
- Key: `features`
- Content fields:
  - `title`: Section title
  - `items`: Array of features with:
    - `icon`: Icon name from Icons enum
    - `title`: Feature title (or `titleKey` for i18n)
    - `description`: Feature description (or `descriptionKey` for i18n)

#### Apps Section
- Key: `apps`
- Content fields:
  - `title`: Section title
  - `items`: Array of apps with:
    - `id`: App identifier
    - `name`: App name
    - `description`: App description
    - `icon`: Icon name from Icons enum
    - `url`: App URL

#### Parents Section
- Key: `parents`
- Content fields:
  - `title`: Section title
  - `description`: Section description
  - `items`: Array of parent features with:
    - `icon`: Icon name from Icons enum
    - `title`: Feature title (or `titleKey` for i18n)
    - `description`: Feature description (or `descriptionKey` for i18n)

## Fallback Behavior

If no content is found in the CMS, the website will use the hardcoded content with i18n translation keys. This ensures the website always displays content even if the CMS is unavailable.

## Adding New Sections

To add new section types:

1. Create a new component in `/src/components/sections/`
2. Add it to the `sectionComponents` map in `SectionRenderer.vue`
3. Create the corresponding template in your CMS

## Testing

1. Ensure your Supabase connection is configured
2. Create the content structure in your CMS
3. Run the marketing website: `pnpm dev`
4. The homepage should now load content dynamically