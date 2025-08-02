import type { ImageMetadata } from './types'

export function buildVisionPrompt({ title }: { title?: string }): string {
  return `Analyze this image and return valid JSON metadata following the strict global
rules and field-specific instructions below.${title ? `

IMPORTANT CONTEXT: The image has been titled "${title}". Use this as
context to better understand what the subject is. For example, if the title says "Bao Bun" and you see a
round food item, it's a bao bun, not a hamburger.` : ''}

### GLOBAL RULES (apply to all fields)
- ❌ Do NOT mention that it is an image, drawing, cartoon, illustration, or character.
- ❌ Do NOT include style or emotion words like: "cute", "adorable", "funny",
"playful", "design", "cartoon", "mascot", "illustration", "character", "art", or "concept".
- ❌ Do NOT use self-referential phrases like "This is", "This image shows", or "In the picture".
- ✅ Focus only on what the subject *is*, not how it looks or is styled.
- ✅ Use simple, factual, child-friendly language that a young kid can understand.

### OUTPUT FORMAT (JSON)
Return a JSON object in this format:

{
  "title": "A short, clear name of the subject.${title ? ` If appropriate, you can use or refine the provided title: '${title}'.` : ''} Example: 'Lion', 'Dim Sum', 'Fire Truck'. Do NOT include any adjectives or style words.",

  "description": "2–3 short sentences about the subject. Describe what it is, what it does, where it comes from, or what it's made of. Use friendly and simple language for children. Never mention the style or that it is an image.",

  "tags": [
    "10–15 short keywords someone might use to search for the subject. All should be related to the real content. Do NOT include style words like 'cute', 'illustration', 'cartoon', etc."
  ],

  "categories": [
    "5–8 broad categories the subject fits into. Use general terms like: 'animals', 'food', 'people', 'nature', 'vehicles', 'toys', 'tools', 'plants', 'places', 'clothing'. Never include: 'art', 'illustration', 'characters', or 'design'."
  ]
}

Only return the JSON. Do not include any explanation, formatting, or markdown.`
}

export function parseVisionResponse(content: string): ImageMetadata | null {
  try {
    const jsonMatch = content.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      const analysis = JSON.parse(jsonMatch[0])
      return {
        title: analysis.title || '',
        description: analysis.description || '',
        tags: Array.isArray(analysis.tags) ? analysis.tags : [],
        categories: Array.isArray(analysis.categories) ? analysis.categories : []
      }
    }
    return null
  } catch (error) {
    return null
  }
}