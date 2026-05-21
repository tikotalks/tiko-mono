-- Function to extract the first paragraph from content
CREATE OR REPLACE FUNCTION extract_first_paragraph(content TEXT) 
RETURNS TEXT AS $$
DECLARE
  first_para TEXT;
  content_clean TEXT;
BEGIN
  -- Return empty string if content is null or empty
  IF content IS NULL OR content = '' THEN
    RETURN '';
  END IF;
  
  -- Remove leading/trailing whitespace
  content_clean := TRIM(content);
  
  -- Try to find the first paragraph by looking for double newline
  first_para := SPLIT_PART(content_clean, E'\n\n', 1);
  
  -- If no double newline found, try single newline
  IF first_para = content_clean THEN
    first_para := SPLIT_PART(content_clean, E'\n', 1);
  END IF;
  
  -- If the paragraph starts with HTML tags, try to extract text content
  -- Remove common HTML tags
  first_para := REGEXP_REPLACE(first_para, '<[^>]*>', '', 'g');
  
  -- Remove markdown headers
  first_para := REGEXP_REPLACE(first_para, '^#+\s+', '', 'g');
  
  -- Remove markdown bold/italic
  first_para := REGEXP_REPLACE(first_para, '\*{1,2}([^*]+)\*{1,2}', '\1', 'g');
  first_para := REGEXP_REPLACE(first_para, '_{1,2}([^_]+)_{1,2}', '\1', 'g');
  
  -- Trim the result
  first_para := TRIM(first_para);
  
  -- Limit to reasonable length (e.g., 300 characters)
  IF LENGTH(first_para) > 300 THEN
    first_para := SUBSTRING(first_para FROM 1 FOR 297) || '...';
  END IF;
  
  RETURN first_para;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Update the view to use the extraction function when short is empty
CREATE OR REPLACE VIEW content_articles_details AS
SELECT 
  a.id,
  a.page_id,
  a.language_code,
  a.title,
  -- Use the short field if available, otherwise extract from content
  CASE 
    WHEN a.short IS NOT NULL AND a.short != '' THEN a.short
    ELSE extract_first_paragraph(a.content)
  END as short,
  a.content,
  a.tags,
  a.category,
  a.slug,
  a.is_published,
  a.published_at,
  a.created_at,
  a.updated_at,
  p.title as page_title,
  p.slug as page_slug,
  p.full_path as page_path,
  pr.name as project_name,
  pr.slug as project_slug
FROM content_articles a
JOIN content_pages p ON a.page_id = p.id
JOIN content_projects pr ON p.project_id = pr.id;

-- Grant permissions to the view
GRANT SELECT ON content_articles_details TO public;
GRANT SELECT ON content_articles_details TO authenticated;