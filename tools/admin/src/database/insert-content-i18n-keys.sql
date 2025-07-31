-- Insert translation keys for Content Management System
-- This script adds all necessary translation keys for the content features

-- First, ensure the languages are active
UPDATE i18n_languages SET is_active = true WHERE code IN ('en', 'en-GB', 'en-US');

-- Helper function to insert translation key and values
CREATE OR REPLACE FUNCTION insert_translation(
  p_key TEXT,
  p_description TEXT,
  p_value_en TEXT,
  p_value_en_gb TEXT DEFAULT NULL,
  p_value_en_us TEXT DEFAULT NULL
) RETURNS void AS $$
BEGIN
  -- Insert the key
  INSERT INTO i18n_translation_keys (key, description)
  VALUES (p_key, p_description)
  ON CONFLICT (key) DO UPDATE SET description = EXCLUDED.description;
  
  -- Insert English translation
  INSERT INTO i18n_translations (key, language, value, is_approved)
  VALUES (p_key, 'en', p_value_en, true)
  ON CONFLICT (key, language) DO UPDATE SET value = EXCLUDED.value, is_approved = true;
  
  -- Insert British English translation
  INSERT INTO i18n_translations (key, language, value, is_approved)
  VALUES (p_key, 'en-GB', COALESCE(p_value_en_gb, p_value_en), true)
  ON CONFLICT (key, language) DO UPDATE SET value = EXCLUDED.value, is_approved = true;
  
  -- Insert American English translation
  INSERT INTO i18n_translations (key, language, value, is_approved)
  VALUES (p_key, 'en-US', COALESCE(p_value_en_us, p_value_en), true)
  ON CONFLICT (key, language) DO UPDATE SET value = EXCLUDED.value, is_approved = true;
END;
$$ LANGUAGE plpgsql;

-- =================== CONTENT PROJECTS ===================
SELECT insert_translation('admin.content.projects.title', 'Title for content projects page', 'Content Projects');
SELECT insert_translation('admin.content.projects.description', 'Description for content projects', 'Manage your content projects and their configuration');
SELECT insert_translation('admin.content.projects.create', 'Create project button', 'Create Project');
SELECT insert_translation('admin.content.projects.edit', 'Edit project button', 'Edit Project');
SELECT insert_translation('admin.content.projects.delete', 'Delete project button', 'Delete Project');
SELECT insert_translation('admin.content.projects.empty', 'Empty state message', 'No projects found. Create your first project to get started.');
SELECT insert_translation('admin.content.projects.loadError', 'Error loading projects', 'Failed to load projects');
SELECT insert_translation('admin.content.projects.createSuccess', 'Project created successfully', 'Project created successfully');
SELECT insert_translation('admin.content.projects.createError', 'Error creating project', 'Failed to create project');
SELECT insert_translation('admin.content.projects.updateSuccess', 'Project updated successfully', 'Project updated successfully');
SELECT insert_translation('admin.content.projects.updateError', 'Error updating project', 'Failed to update project');
SELECT insert_translation('admin.content.projects.deleteSuccess', 'Project deleted successfully', 'Project deleted successfully');
SELECT insert_translation('admin.content.projects.deleteError', 'Error deleting project', 'Failed to delete project');
SELECT insert_translation('admin.content.projects.deleteConfirm', 'Delete confirmation title', 'Delete Project');
SELECT insert_translation('admin.content.projects.deleteMessage', 'Delete confirmation message', 'Are you sure you want to delete "{name}"? This action cannot be undone.');
SELECT insert_translation('admin.content.projects.pageCount', 'Page count label', '{count} pages');
SELECT insert_translation('admin.content.projects.sectionCount', 'Section count label', '{count} sections');
SELECT insert_translation('admin.content.projects.namePlaceholder', 'Name field placeholder', 'Enter project name');
SELECT insert_translation('admin.content.projects.slugPlaceholder', 'Slug field placeholder', 'project-slug');
SELECT insert_translation('admin.content.projects.descriptionPlaceholder', 'Description field placeholder', 'Describe your project...');
SELECT insert_translation('admin.content.projects.slugError', 'Slug validation error', 'Slug can only contain lowercase letters, numbers, and hyphens');
SELECT insert_translation('admin.content.projects.languages', 'Languages section title', 'Languages');
SELECT insert_translation('admin.content.projects.languagesHelp', 'Languages help text', 'Select the languages this project will support');
SELECT insert_translation('admin.content.projects.languagesRequired', 'Languages validation error', 'Please select at least one language');
SELECT insert_translation('admin.content.projects.defaultLanguage', 'Default language label', 'Default Language');

-- =================== CONTENT SECTIONS ===================
SELECT insert_translation('admin.content.sections.title', 'Title for content sections page', 'Section Templates');
SELECT insert_translation('admin.content.sections.description', 'Description for content sections', 'Create reusable section templates for your pages');
SELECT insert_translation('admin.content.sections.create', 'Create section button', 'Create Section');
SELECT insert_translation('admin.content.sections.edit', 'Edit section button', 'Edit Section');
SELECT insert_translation('admin.content.sections.delete', 'Delete section button', 'Delete Section');
SELECT insert_translation('admin.content.sections.empty', 'Empty state message', 'No section templates found. Create your first template to build pages.');
SELECT insert_translation('admin.content.sections.loadError', 'Error loading sections', 'Failed to load section templates');
SELECT insert_translation('admin.content.sections.createSuccess', 'Section created successfully', 'Section template created successfully');
SELECT insert_translation('admin.content.sections.createError', 'Error creating section', 'Failed to create section template');
SELECT insert_translation('admin.content.sections.updateSuccess', 'Section updated successfully', 'Section template updated successfully');
SELECT insert_translation('admin.content.sections.updateError', 'Error updating section', 'Failed to update section template');
SELECT insert_translation('admin.content.sections.deleteSuccess', 'Section deleted successfully', 'Section template deleted successfully');
SELECT insert_translation('admin.content.sections.deleteError', 'Error deleting section', 'Failed to delete section template');
SELECT insert_translation('admin.content.sections.deleteConfirm', 'Delete confirmation title', 'Delete Section Template');
SELECT insert_translation('admin.content.sections.deleteMessage', 'Delete confirmation message', 'Are you sure you want to delete "{name}"? This will affect all pages using this section.');
SELECT insert_translation('admin.content.sections.global', 'Global section indicator', 'Global');
SELECT insert_translation('admin.content.sections.reusable', 'Reusable section indicator', 'Reusable');
SELECT insert_translation('admin.content.sections.filterByLanguage', 'Language filter label', 'Filter by Language');
SELECT insert_translation('admin.content.sections.namePlaceholder', 'Name field placeholder', 'Enter section name');
SELECT insert_translation('admin.content.sections.slugPlaceholder', 'Slug field placeholder', 'section-slug');
SELECT insert_translation('admin.content.sections.descriptionPlaceholder', 'Description field placeholder', 'Describe this section template...');
SELECT insert_translation('admin.content.sections.slugError', 'Slug validation error', 'Slug can only contain lowercase letters, numbers, and hyphens');
SELECT insert_translation('admin.content.sections.componentType', 'Component type label', 'Component Type');
SELECT insert_translation('admin.content.sections.language', 'Language label', 'Language');
SELECT insert_translation('admin.content.sections.languagePlaceholder', 'Language field placeholder', 'Global (all languages)');
SELECT insert_translation('admin.content.sections.isReusable', 'Reusable checkbox label', 'Make this section reusable');
SELECT insert_translation('admin.content.sections.reusableHint', 'Reusable section hint', 'Reusable sections can be used across multiple pages');

-- Section types
SELECT insert_translation('admin.content.sections.types.hero', 'Hero section type', 'Hero');
SELECT insert_translation('admin.content.sections.types.text', 'Text section type', 'Text');
SELECT insert_translation('admin.content.sections.types.media', 'Media section type', 'Media');
SELECT insert_translation('admin.content.sections.types.gallery', 'Gallery section type', 'Gallery');
SELECT insert_translation('admin.content.sections.types.cards', 'Cards section type', 'Cards');
SELECT insert_translation('admin.content.sections.types.testimonials', 'Testimonials section type', 'Testimonials');
SELECT insert_translation('admin.content.sections.types.features', 'Features section type', 'Features');
SELECT insert_translation('admin.content.sections.types.cta', 'CTA section type', 'Call to Action');
SELECT insert_translation('admin.content.sections.types.faq', 'FAQ section type', 'FAQ');
SELECT insert_translation('admin.content.sections.types.custom', 'Custom section type', 'Custom');

-- Section fields
SELECT insert_translation('admin.content.sections.fields', 'Fields section title', 'Section Fields');
SELECT insert_translation('admin.content.sections.fieldsHelp', 'Fields help text', 'Define the fields that will be available in this section');
SELECT insert_translation('admin.content.sections.newField', 'New field placeholder', 'New Field');
SELECT insert_translation('admin.content.sections.addField', 'Add field button', 'Add Field');
SELECT insert_translation('admin.content.sections.fieldKey', 'Field key label', 'Field Key');
SELECT insert_translation('admin.content.sections.fieldKeyPlaceholder', 'Field key placeholder', 'field_key');
SELECT insert_translation('admin.content.sections.fieldLabel', 'Field label label', 'Field Label');
SELECT insert_translation('admin.content.sections.fieldLabelPlaceholder', 'Field label placeholder', 'Field Label');
SELECT insert_translation('admin.content.sections.fieldType', 'Field type label', 'Field Type');
SELECT insert_translation('admin.content.sections.translatable', 'Translatable checkbox label', 'Translatable');
SELECT insert_translation('admin.content.sections.selectOptions', 'Select options label', 'Select Options');
SELECT insert_translation('admin.content.sections.selectOptionsPlaceholder', 'Select options placeholder', 'value|Label (one per line)');

-- Field types
SELECT insert_translation('admin.content.sections.fieldTypes.text', 'Text field type', 'Text');
SELECT insert_translation('admin.content.sections.fieldTypes.textarea', 'Textarea field type', 'Text Area');
SELECT insert_translation('admin.content.sections.fieldTypes.richtext', 'Rich text field type', 'Rich Text');
SELECT insert_translation('admin.content.sections.fieldTypes.number', 'Number field type', 'Number');
SELECT insert_translation('admin.content.sections.fieldTypes.boolean', 'Boolean field type', 'Boolean');
SELECT insert_translation('admin.content.sections.fieldTypes.select', 'Select field type', 'Select');
SELECT insert_translation('admin.content.sections.fieldTypes.media', 'Media field type', 'Media');
SELECT insert_translation('admin.content.sections.fieldTypes.mediaList', 'Media list field type', 'Media List');
SELECT insert_translation('admin.content.sections.fieldTypes.list', 'List field type', 'List');
SELECT insert_translation('admin.content.sections.fieldTypes.object', 'Object field type', 'Object');

-- =================== CONTENT PAGES ===================
SELECT insert_translation('admin.content.pages.title', 'Title for content pages', 'Pages');
SELECT insert_translation('admin.content.pages.description', 'Description for content pages', 'Create and manage pages for your projects');
SELECT insert_translation('admin.content.pages.comingSoon', 'Coming soon message', 'Page management coming soon...');
SELECT insert_translation('admin.content.pages.create', 'Create page button', 'Create Page');
SELECT insert_translation('admin.content.pages.edit', 'Edit page button', 'Edit Page');
SELECT insert_translation('admin.content.pages.delete', 'Delete page button', 'Delete Page');
SELECT insert_translation('admin.content.pages.publish', 'Publish page button', 'Publish');
SELECT insert_translation('admin.content.pages.unpublish', 'Unpublish page button', 'Unpublish');
SELECT insert_translation('admin.content.pages.preview', 'Preview page button', 'Preview');
SELECT insert_translation('admin.content.pages.draft', 'Draft status', 'Draft');
SELECT insert_translation('admin.content.pages.published', 'Published status', 'Published');
SELECT insert_translation('admin.content.pages.empty', 'Empty state message', 'No pages found. Create your first page to get started.');
SELECT insert_translation('admin.content.pages.emptyDescription', 'Empty state description', 'Pages are where your content comes to life. Start by creating your first page.');
SELECT insert_translation('admin.content.pages.createFirst', 'Create first page button', 'Create Your First Page');
SELECT insert_translation('admin.content.pages.loadError', 'Error loading pages', 'Failed to load pages');
SELECT insert_translation('admin.content.pages.createSuccess', 'Page created successfully', 'Page created successfully');
SELECT insert_translation('admin.content.pages.createError', 'Error creating page', 'Failed to create page');
SELECT insert_translation('admin.content.pages.updateSuccess', 'Page updated successfully', 'Page updated successfully');
SELECT insert_translation('admin.content.pages.updateError', 'Error updating page', 'Failed to update page');
SELECT insert_translation('admin.content.pages.deleteSuccess', 'Page deleted successfully', 'Page deleted successfully');
SELECT insert_translation('admin.content.pages.deleteError', 'Error deleting page', 'Failed to delete page');
SELECT insert_translation('admin.content.pages.deleteConfirm', 'Delete confirmation title', 'Delete Page');
SELECT insert_translation('admin.content.pages.deleteWarning', 'Delete page warning', 'Are you sure you want to delete "{title}"? This action cannot be undone.');

-- Page form fields
SELECT insert_translation('admin.content.pages.titlePlaceholder', 'Title placeholder', 'Enter page title');
SELECT insert_translation('admin.content.pages.path', 'Path label', 'Page Path');
SELECT insert_translation('admin.content.pages.pathPlaceholder', 'Path placeholder', '/about-us');
SELECT insert_translation('admin.content.pages.pathError', 'Path validation error', 'Path must start with / and contain only lowercase letters, numbers, and hyphens');
SELECT insert_translation('admin.content.pages.descriptionPlaceholder', 'Description placeholder', 'Brief description of the page...');
SELECT insert_translation('admin.content.pages.project', 'Project label', 'Project');
SELECT insert_translation('admin.content.pages.projectPlaceholder', 'Project placeholder', 'Select a project');
SELECT insert_translation('admin.content.pages.template', 'Template label', 'Page Template');
SELECT insert_translation('admin.content.pages.templatePlaceholder', 'Template placeholder', 'Select a template (optional)');
SELECT insert_translation('admin.content.pages.noTemplate', 'No template option', 'No template');
SELECT insert_translation('admin.content.pages.metaTitle', 'Meta title label', 'Meta Title');
SELECT insert_translation('admin.content.pages.metaTitlePlaceholder', 'Meta title placeholder', 'SEO page title');
SELECT insert_translation('admin.content.pages.metaDescription', 'Meta description label', 'Meta Description');
SELECT insert_translation('admin.content.pages.metaDescriptionPlaceholder', 'Meta description placeholder', 'SEO page description...');
SELECT insert_translation('admin.content.pages.publishedHint', 'Published hint', 'Published pages are visible to visitors');
SELECT insert_translation('admin.content.pages.isHome', 'Is home page label', 'Set as Home Page');
SELECT insert_translation('admin.content.pages.isHomeHint', 'Is home hint', 'Make this the default page for the project');

-- Page sections
SELECT insert_translation('admin.content.pages.sections', 'Sections title', 'Page Sections');
SELECT insert_translation('admin.content.pages.sectionsHelp', 'Sections help text', 'Add and arrange content sections for this page');
SELECT insert_translation('admin.content.pages.addSection', 'Add section button', 'Add Section');
SELECT insert_translation('admin.content.pages.sectionTemplate', 'Section template label', 'Section Template');
SELECT insert_translation('admin.content.pages.sectionTemplatePlaceholder', 'Section template placeholder', 'Choose a section template');
SELECT insert_translation('admin.content.pages.sectionKey', 'Section key label', 'Section Key');
SELECT insert_translation('admin.content.pages.sectionKeyPlaceholder', 'Section key placeholder', 'unique-section-key');
SELECT insert_translation('admin.content.pages.templatePreview', 'Template preview title', 'Template Preview');

-- Drop the helper function
DROP FUNCTION IF EXISTS insert_translation;