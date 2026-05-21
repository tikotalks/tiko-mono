-- Insert test articles for marketing website
-- First, we need to find the page ID for the "updates" page

DO $$
DECLARE
  updates_page_id UUID;
  articles_page_id UUID;
BEGIN
  -- Get the updates page ID (try 'update' first, then 'updates')
  SELECT id INTO updates_page_id
  FROM content_pages
  WHERE slug = 'update' AND project_id = (SELECT id FROM content_projects WHERE slug = 'marketing')
  LIMIT 1;

  -- If not found, try 'updates'
  IF updates_page_id IS NULL THEN
    SELECT id INTO updates_page_id
    FROM content_pages
    WHERE slug = 'updates' AND project_id = (SELECT id FROM content_projects WHERE slug = 'marketing')
    LIMIT 1;
  END IF;
  
  -- Get the articles page ID (if it exists)
  SELECT id INTO articles_page_id 
  FROM content_pages 
  WHERE slug = 'articles' AND project_id = (SELECT id FROM content_projects WHERE slug = 'marketing')
  LIMIT 1;
  
  -- Insert test articles for the updates page
  IF updates_page_id IS NOT NULL THEN
    INSERT INTO content_articles (page_id, language_code, title, slug, short, content, category, tags, image_url, published_at, is_published) VALUES
    (
      updates_page_id, 
      'en', 
      'Introducing Our New Content Management System', 
      'new-cms-launch',
      'We are excited to announce the launch of our new content management system that makes it easier than ever to manage your website content.',
      '# Introducing Our New Content Management System

We are thrilled to announce the launch of our brand new content management system (CMS) that revolutionizes how you manage your website content.

## Key Features

- **Intuitive Interface**: A clean, modern interface that makes content management a breeze
- **Multi-language Support**: Easily manage content in multiple languages
- **Real-time Updates**: See your changes reflected instantly
- **Flexible Content Types**: Create any type of content you need

## What This Means for You

This new system empowers you to:
1. Update content faster than ever before
2. Collaborate seamlessly with your team
3. Maintain consistency across all your pages

Stay tuned for more updates as we continue to enhance the platform!',
      'Product Update',
      ARRAY['cms', 'product', 'announcement', 'features'],
      'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&q=80',
      NOW() - INTERVAL '2 days',
      true
    ),
    (
      updates_page_id,
      'en',
      'Performance Improvements and Bug Fixes',
      'performance-improvements-q1-2024',
      'We have rolled out significant performance improvements and fixed several bugs to enhance your experience.',
      '# Performance Improvements and Bug Fixes

Our engineering team has been hard at work optimizing the platform for better performance and stability.

## Performance Enhancements

### Faster Load Times
- Pages now load 40% faster on average
- Image optimization reduces bandwidth usage by 60%
- Improved caching strategies for instant content delivery

### Database Optimizations
- Query performance improved by 3x
- Reduced server response times
- Better handling of concurrent users

## Bug Fixes

We have addressed the following issues:
- Fixed navigation menu display on mobile devices
- Resolved content saving issues in certain browsers
- Corrected language switching behavior
- Fixed date formatting in various locales

## Looking Ahead

We continue to monitor performance metrics and user feedback to ensure the best possible experience. Thank you for your patience as we work to improve the platform!',
      'Technical Update',
      ARRAY['performance', 'optimization', 'bugfix', 'technical'],
      'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&q=80',
      NOW() - INTERVAL '1 week',
      true
    ),
    (
      updates_page_id,
      'en',
      'New Team Members Join Our Growing Company',
      'welcome-new-team-members',
      'We are delighted to welcome three new talented individuals to our team who will help us deliver even better products and services.',
      '# New Team Members Join Our Growing Company

We are excited to introduce the newest members of our growing team!

## Meet Our New Team Members

### Sarah Chen - Senior Frontend Developer
Sarah brings over 8 years of experience in building scalable web applications. She previously worked at Tech Innovators Inc. where she led the development of their flagship product''s user interface.

### Michael Rodriguez - UX Designer
Michael joins us with a passion for creating intuitive and accessible user experiences. His portfolio includes work for several Fortune 500 companies and award-winning design projects.

### Emily Thompson - Content Strategist
Emily will be helping us shape our content strategy and ensure our messaging resonates with our audience. She has a background in digital marketing and has helped numerous startups build their brand voice.

## What This Means for Our Customers

With these talented individuals joining our team, we''re better positioned than ever to:
- Deliver innovative features faster
- Improve the user experience across all our products
- Create more engaging and helpful content

Please join us in welcoming Sarah, Michael, and Emily to the team!',
      'Company News',
      ARRAY['team', 'hiring', 'company', 'growth'],
      'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&q=80',
      NOW() - INTERVAL '3 weeks',
      true
    );
    
    -- Insert articles for different languages
    INSERT INTO content_articles (page_id, language_code, title, slug, short, content, category, tags, image_url, published_at, is_published) VALUES
    (
      updates_page_id,
      'nl',
      'Introductie van ons nieuwe Content Management Systeem',
      'nieuw-cms-lancering',
      'We zijn verheugd de lancering van ons nieuwe content management systeem aan te kondigen dat het beheren van uw website-inhoud gemakkelijker maakt dan ooit.',
      '# Introductie van ons nieuwe Content Management Systeem

We zijn verheugd de lancering van ons gloednieuwe content management systeem (CMS) aan te kondigen dat een revolutie teweegbrengt in hoe u uw website-inhoud beheert.

## Belangrijkste kenmerken

- **Intuïtieve interface**: Een schone, moderne interface die contentbeheer tot een fluitje van een cent maakt
- **Meertalige ondersteuning**: Beheer gemakkelijk inhoud in meerdere talen
- **Real-time updates**: Zie uw wijzigingen direct weergegeven
- **Flexibele inhoudstypen**: Maak elk type inhoud dat u nodig heeft

Blijf op de hoogte voor meer updates terwijl we het platform blijven verbeteren!',
      'Product Update',
      ARRAY['cms', 'product', 'aankondiging', 'functies'],
      'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&q=80',
      NOW() - INTERVAL '2 days',
      true
    );
  END IF;
  
  -- Similar articles for the articles page if it exists
  IF articles_page_id IS NOT NULL THEN
    INSERT INTO content_articles (page_id, language_code, title, slug, short, content, category, tags, image_url, published_at, is_published) VALUES
    (
      articles_page_id,
      'en',
      'Best Practices for Modern Web Development',
      'best-practices-web-development',
      'Learn the essential best practices that every modern web developer should follow to build scalable and maintainable applications.',
      '# Best Practices for Modern Web Development

Building modern web applications requires following established best practices to ensure scalability, maintainability, and performance.

## Code Organization

### Component-Based Architecture
Break your application into reusable components. This promotes:
- Code reusability
- Easier testing
- Better maintainability
- Clearer separation of concerns

### Follow SOLID Principles
- **Single Responsibility**: Each module should have one reason to change
- **Open/Closed**: Open for extension, closed for modification
- **Liskov Substitution**: Derived classes must be substitutable for their base classes
- **Interface Segregation**: Many client-specific interfaces are better than one general-purpose interface
- **Dependency Inversion**: Depend on abstractions, not concretions

## Performance Optimization

### Lazy Loading
- Load components and resources only when needed
- Implement code splitting for better initial load times
- Use intersection observers for image lazy loading

### Caching Strategies
- Implement service workers for offline functionality
- Use browser caching effectively
- Consider CDN for static assets

## Security Best Practices

### Input Validation
- Always validate user input on both client and server
- Sanitize data before storing or displaying
- Use parameterized queries to prevent SQL injection

### Authentication & Authorization
- Implement proper authentication mechanisms
- Use secure session management
- Follow the principle of least privilege

## Conclusion

By following these best practices, you''ll build applications that are not only functional but also scalable, secure, and maintainable. Remember, the key is consistency and continuous improvement.',
      'Tutorial',
      ARRAY['development', 'best-practices', 'web', 'programming'],
      'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=800&q=80',
      NOW() - INTERVAL '5 days',
      true
    );
  END IF;
END $$;

-- Create or update the view for articles with page information
CREATE OR REPLACE VIEW content_articles_details AS
SELECT 
  a.*,
  p.title as page_title,
  p.slug as page_slug
FROM content_articles a
LEFT JOIN content_pages p ON a.page_id = p.id;