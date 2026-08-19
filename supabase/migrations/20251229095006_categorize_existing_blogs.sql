/*
  # Categoriseer alle bestaande blogs

  1. Doel
    - Alle bestaande blogs krijgen minimaal één categorie-tag
    - 4 hoofdcategorieën: ai-content, e-commerce, marketing, tutorials
    
  2. Aanpak
    - Bestaande tags worden behouden en aangevuld met categorie-tags
    - Blogs over AI, ChatGPT, automation → 'ai-content'
    - Blogs over B2B, sales, CRM, ROI → 'e-commerce'
    - Blogs over inbound, SEO, contentmarketing → 'marketing'
    - Blogs met how-to, gids, checklist → 'tutorials'
    
  3. Belangrijke notities
    - Blogs kunnen meerdere categorie-tags hebben
    - Bestaande tags blijven behouden voor specifieke filtering
*/

-- AI & Content Creatie
UPDATE blogs 
SET tags = array_append(tags, 'ai-content')
WHERE status = 'published' 
  AND NOT 'ai-content' = ANY(tags)
  AND (
    'AI' = ANY(tags) OR 
    'ChatGPT' = ANY(tags) OR 
    'systemprompt' = ANY(tags) OR
    'system prompt' = ANY(tags) OR
    'prompt engineering' = ANY(tags) OR
    'kunstmatige intelligentie' = ANY(tags) OR
    'AI-tools' = ANY(tags) OR
    'AI marketing' = ANY(tags) OR
    'AI-productiviteit' = ANY(tags) OR
    'AI op de werkvloer' = ANY(tags) OR
    'contentcreatie' = ANY(tags) OR
    title ILIKE '%AI%' OR
    title ILIKE '%ChatGPT%' OR
    title ILIKE '%systemprompt%'
  );

-- E-commerce & Online Verkoop
UPDATE blogs 
SET tags = array_append(tags, 'e-commerce')
WHERE status = 'published' 
  AND NOT 'e-commerce' = ANY(tags)
  AND (
    'B2B Marketing' = ANY(tags) OR
    'B2B' = ANY(tags) OR
    'CRM' = ANY(tags) OR
    'Sales' = ANY(tags) OR
    'sales funnel' = ANY(tags) OR
    'Marketing Funnel' = ANY(tags) OR
    'MQL' = ANY(tags) OR
    'leadgeneratie' = ANY(tags) OR
    'lead generation' = ANY(tags) OR
    'Leadgeneratie' = ANY(tags) OR
    'Lead Scoring' = ANY(tags) OR
    'Conversieratio' = ANY(tags) OR
    'conversie optimalisatie' = ANY(tags) OR
    'conversieoptimalisatie' = ANY(tags) OR
    title ILIKE '%B2B%' OR
    title ILIKE '%sales%' OR
    title ILIKE '%CRM%' OR
    title ILIKE '%ROI%' OR
    title ILIKE '%MQL%'
  );

-- Marketing & SEO
UPDATE blogs 
SET tags = array_append(tags, 'marketing')
WHERE status = 'published' 
  AND NOT 'marketing' = ANY(tags)
  AND (
    'inbound marketing' = ANY(tags) OR
    'content marketing' = ANY(tags) OR
    'contentmarketing' = ANY(tags) OR
    'contentstrategie' = ANY(tags) OR
    'content strategie' = ANY(tags) OR
    'Content Strategie' = ANY(tags) OR
    'marketing' = ANY(tags) OR
    'marketing strategie' = ANY(tags) OR
    'marketingstrategieën' = ANY(tags) OR
    'Marketingstrategieën' = ANY(tags) OR
    'marketingstrategie' = ANY(tags) OR
    'SEO' = ANY(tags) OR
    'email marketing' = ANY(tags) OR
    'e-mail marketing' = ANY(tags) OR
    'marketing automation' = ANY(tags) OR
    'digitale marketing' = ANY(tags) OR
    'digital marketing' = ANY(tags) OR
    'marketing trends' = ANY(tags) OR
    'marketing trends 2026' = ANY(tags) OR
    title ILIKE '%marketing%' OR
    title ILIKE '%SEO%' OR
    title ILIKE '%inbound%'
  );

-- Handleidingen & Tips
UPDATE blogs 
SET tags = array_append(tags, 'tutorials')
WHERE status = 'published' 
  AND NOT 'tutorials' = ANY(tags)
  AND (
    'checklist' = ANY(tags) OR
    'gids' = ANY(tags) OR
    'implementatie' = ANY(tags) OR
    'how-to' = ANY(tags) OR
    title ILIKE '%gids%' OR
    title ILIKE '%checklist%' OR
    title ILIKE '%handleiding%' OR
    title ILIKE '%tips%' OR
    title ILIKE '%best practices%' OR
    title ILIKE '%hoe %' OR
    title ILIKE '%stap-voor-stap%'
  );

-- Vang alle overige blogs op in marketing categorie (standaard)
UPDATE blogs 
SET tags = array_append(tags, 'marketing')
WHERE status = 'published' 
  AND NOT 'ai-content' = ANY(tags)
  AND NOT 'e-commerce' = ANY(tags)
  AND NOT 'marketing' = ANY(tags)
  AND NOT 'tutorials' = ANY(tags);
