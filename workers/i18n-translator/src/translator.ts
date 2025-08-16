import type { OpenAITranslationResponse, TranslationResult, DatabaseLanguage } from './types'

export async function translateWithOpenAI(
  text: string,
  targetLanguages: string[],
  context: string | undefined,
  apiKey: string
): Promise<TranslationResult[]> {
  const contextPrompt = context 
    ? `\n\nContext: ${context}` 
    : ''

  const prompt = `You must translate the text into multiple languages and return ONLY valid JSON.

English text to translate: "${text}"
${contextPrompt}

Target languages: ${targetLanguages.join(', ')}

CRITICAL: Return ONLY a valid JSON object with NO additional text before or after.
The response must start with { and end with }

Example format:
{
  "fr": "Bonjour",
  "es": "Hola",
  "de": "Hallo"
}

Guidelines:
- Natural, culturally appropriate translations
- Keep UI text concise
- Preserve placeholders like {name}, {count}
- Use proper punctuation for each language
- ONLY return the JSON object, nothing else`

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are a JSON translation API. You ONLY return valid JSON objects containing translations. Never include explanations, comments, or any text outside the JSON structure. You are a professional translator specializing in UI/UX translations.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 2000
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`OpenAI API error: ${response.status} - ${errorText}`)
    }

    let data: OpenAITranslationResponse
    try {
      data = await response.json()
    } catch (jsonError) {
      const text = await response.text()
      throw new Error(`Failed to parse OpenAI response as JSON. Raw response: ${text}`)
    }
    
    console.log('Full OpenAI response:', JSON.stringify(data, null, 2))
    
    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      throw new Error(`Invalid OpenAI response structure. Data: ${JSON.stringify(data)}`)
    }
    
    const content = data.choices[0].message.content
    
    if (!content) {
      throw new Error(`OpenAI returned empty content. Full response: ${JSON.stringify(data)}`)
    }
    
    console.log('OpenAI response content:', content)
    console.log('Requested languages:', targetLanguages)

    // Extract JSON from the response (AI might include extra text)
    let translations: Record<string, string>
    try {
      // First try direct parsing
      translations = JSON.parse(content)
    } catch (e) {
      // If that fails, try to extract JSON from the content
      const jsonMatch = content.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        try {
          translations = JSON.parse(jsonMatch[0])
        } catch (parseError) {
          console.error('Failed to parse extracted JSON:', jsonMatch[0])
          throw new Error(`Invalid JSON in response. Raw content: ${content}`)
        }
      } else {
        console.error('Could not extract JSON from response:', content)
        throw new Error(`No JSON found in response. Raw content: ${content}`)
      }
    }
    
    return targetLanguages.map(lang => ({
      language: lang,
      translation: translations[lang] || text,
      confidence: translations[lang] ? 0.95 : 0
    }))
  } catch (error) {
    console.error('Translation error:', error)
    console.error('Error details:', error instanceof Error ? error.message : 'Unknown error')
    // Throw the error instead of silently returning original text
    throw error
  }
}