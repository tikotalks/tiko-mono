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

  const prompt = `Translate the following English text into the specified languages.
${contextPrompt}

Guidelines:
- Provide natural, culturally appropriate translations
- Maintain the same tone and formality level
- For UI text, keep translations concise
- Preserve any placeholders like {name}, {count}, etc.
- Use appropriate punctuation for each language

English text: "${text}"

Provide translations for these languages: ${targetLanguages.join(', ')}

Return ONLY a JSON object in this exact format:
{
  "${targetLanguages[0]}": "translation here",
  "${targetLanguages[1]}": "translation here"
  // ... continue for all languages
}

Do not include any explanation or additional text.`

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4-turbo-preview',
        messages: [
          {
            role: 'system',
            content: 'You are a professional translator specializing in UI/UX translations. You provide accurate, natural translations while maintaining consistency with technical terminology.'
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

    const data: OpenAITranslationResponse = await response.json()
    const content = data.choices[0].message.content

    // Parse the JSON response
    const translations = JSON.parse(content)
    
    return targetLanguages.map(lang => ({
      language: lang,
      translation: translations[lang] || text,
      confidence: translations[lang] ? 0.95 : 0
    }))
  } catch (error) {
    console.error('Translation error:', error)
    // Return original text for all languages on error
    return targetLanguages.map(lang => ({
      language: lang,
      translation: text,
      confidence: 0
    }))
  }
}