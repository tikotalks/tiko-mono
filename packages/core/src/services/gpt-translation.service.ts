/**
 * GPT Translation Service
 * 
 * This service provides AI-powered translation capabilities using OpenAI's GPT models.
 * Currently returns placeholder translations - implement the actual GPT API calls
 * when you have an API key configured.
 */

export interface TranslationRequest {
  text: string;
  sourceLocale: string;
  targetLocale: string;
  context?: string; // Optional context about where this translation is used
}

export interface BatchTranslationRequest {
  texts: Array<{
    key: string;
    text: string;
    context?: string;
  }>;
  sourceLocale: string;
  targetLocale: string;
}

export interface MultiLanguageTranslationRequest {
  text: string;
  sourceLocale: string;
  targetLocales: string[];
  context?: string;
  key?: string;
}

class GPTTranslationService {
  private apiKey?: string;
  private model: string = 'gpt-4-turbo-preview';

  constructor() {
    // Try to get API key from environment
    if (typeof import.meta !== 'undefined' && import.meta.env?.VITE_OPEN_AI_KEY) {
      this.apiKey = import.meta.env.VITE_OPEN_AI_KEY;
    }
  }

  /**
   * Set the OpenAI API key
   */
  setApiKey(key: string) {
    this.apiKey = key;
  }

  /**
   * Translate a single text
   */
  async translate(request: TranslationRequest): Promise<string> {
    console.log('GPT Translation Request:', request);
    
    if (!this.apiKey) {
      console.warn('No OpenAI API key configured. Using placeholder translation.');
      return `[AUTO-${request.targetLocale}] ${request.text}`;
    }

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model: this.model,
          messages: [
            {
              role: 'system',
              content: `You are a professional translator for a children's educational app. Translate the following text from ${this.getLanguageName(request.sourceLocale)} to ${this.getLanguageName(request.targetLocale)}. 
                       Maintain a friendly, clear tone suitable for children and parents. If there are any placeholders like {name} or {count}, keep them exactly as-is.
                       Return ONLY the translated text, no explanations or notes.
                       ${request.context ? `Context: ${request.context}` : ''}`
            },
            {
              role: 'user',
              content: request.text
            }
          ],
          temperature: 0.3, // Lower temperature for more consistent translations
          max_tokens: 500
        })
      });

      if (!response.ok) {
        const error = await response.json();
        console.error('OpenAI API error:', error);
        throw new Error(error.error?.message || 'Translation failed');
      }

      const data = await response.json();
      return data.choices[0].message.content.trim();
    } catch (error) {
      console.error('Translation error:', error);
      // Fallback to placeholder
      return `[AUTO-${request.targetLocale}] ${request.text}`;
    }
  }

  /**
   * Translate multiple texts in a single request (more efficient)
   */
  async translateBatch(request: BatchTranslationRequest): Promise<Record<string, string>> {
    console.log('GPT Batch Translation Request:', request);

    if (!this.apiKey) {
      console.warn('No OpenAI API key configured. Using placeholder translations.');
      const results: Record<string, string> = {};
      for (const item of request.texts) {
        results[item.key] = `[AUTO-${request.targetLocale}] ${item.text}`;
      }
      return results;
    }

    try {
      // Format all texts into a single prompt for efficiency
      const prompt = request.texts.map((item, index) => 
        `${index + 1}. [${item.key}]: "${item.text}"${item.context ? ` (Context: ${item.context})` : ''}`
      ).join('\n');

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model: this.model,
          messages: [
            {
              role: 'system',
              content: `You are a professional translator for a children's educational app. Translate the following texts from ${this.getLanguageName(request.sourceLocale)} to ${this.getLanguageName(request.targetLocale)}.
                       Return the translations in the EXACT same format, with the number and key preserved.
                       Maintain a friendly, clear tone suitable for children and parents. Keep any placeholders like {name} or {count} exactly as-is.
                       Format: "1. [key]: "translation""`
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.3,
          max_tokens: 3000
        })
      });

      if (!response.ok) {
        const error = await response.json();
        console.error('OpenAI API error:', error);
        throw new Error(error.error?.message || 'Batch translation failed');
      }

      const data = await response.json();
      const responseText = data.choices[0].message.content;
      
      // Parse the response and map back to keys
      const results: Record<string, string> = {};
      const lines = responseText.split('\n');
      for (const line of lines) {
        // Match pattern: 1. [key]: "translation"
        const match = line.match(/^\d+\.\s*\[([^\]]+)\]:\s*["'](.+)["']$/);
        if (match) {
          results[match[1]] = match[2];
        }
      }
      
      // Fill in any missing translations with placeholders
      for (const item of request.texts) {
        if (!results[item.key]) {
          console.warn(`No translation returned for key: ${item.key}`);
          results[item.key] = `[AUTO-${request.targetLocale}] ${item.text}`;
        }
      }
      
      return results;
    } catch (error) {
      console.error('Batch translation error:', error);
      // Fallback to placeholder
      const results: Record<string, string> = {};
      for (const item of request.texts) {
        results[item.key] = `[AUTO-${request.targetLocale}] ${item.text}`;
      }
      return results;
    }
  }

  /**
   * Translate a single text to multiple languages in one request
   */
  async translateToMultipleLanguages(request: MultiLanguageTranslationRequest): Promise<Record<string, string>> {
    console.log('GPT Multi-language Translation Request:', request);
    
    if (!this.apiKey) {
      console.warn('No OpenAI API key configured. Using placeholder translations.');
      const results: Record<string, string> = {};
      for (const locale of request.targetLocales) {
        results[locale] = `[AUTO-${locale}] ${request.text}`;
      }
      return results;
    }

    try {
      // Create a prompt that asks for translations to all target languages at once
      const targetLanguages = request.targetLocales.map(locale => 
        `${locale}: ${this.getLanguageName(locale)}`
      ).join('\n');

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model: this.model,
          messages: [
            {
              role: 'system',
              content: `You are a professional translator for a children's educational app. 
                       Translate the given text from ${this.getLanguageName(request.sourceLocale)} to the following languages:
                       ${targetLanguages}
                       
                       Return the translations in JSON format with locale codes as keys.
                       Maintain a friendly, clear tone suitable for children and parents.
                       Keep any placeholders like {name} or {count} exactly as-is.
                       Return ONLY valid JSON, no markdown formatting, no code blocks, no additional text.
                       Do NOT wrap the JSON in \`\`\`json or any other markdown.
                       Example format: {"fr": "Bonjour", "de": "Hallo"}
                       ${request.context ? `Context: ${request.context}` : ''}`
            },
            {
              role: 'user',
              content: request.text
            }
          ],
          temperature: 0.3,
          max_tokens: 2000
        })
      });

      if (!response.ok) {
        const error = await response.json();
        console.error('OpenAI API error:', error);
        throw new Error(error.error?.message || 'Multi-language translation failed');
      }

      const data = await response.json();
      const responseText = data.choices[0].message.content;
      
      try {
        // Clean up the response - GPT sometimes includes markdown code blocks
        let cleanedResponse = responseText.trim();
        
        // Remove markdown code blocks if present
        if (cleanedResponse.startsWith('```json')) {
          cleanedResponse = cleanedResponse.substring(7); // Remove ```json
        } else if (cleanedResponse.startsWith('```')) {
          cleanedResponse = cleanedResponse.substring(3); // Remove ```
        }
        
        if (cleanedResponse.endsWith('```')) {
          cleanedResponse = cleanedResponse.substring(0, cleanedResponse.length - 3); // Remove trailing ```
        }
        
        cleanedResponse = cleanedResponse.trim();
        
        // Parse the JSON response
        const translations = JSON.parse(cleanedResponse);
        
        // Validate all requested languages are present
        const results: Record<string, string> = {};
        for (const locale of request.targetLocales) {
          if (translations[locale]) {
            results[locale] = translations[locale];
          } else {
            console.warn(`No translation returned for locale: ${locale}`);
            results[locale] = `[AUTO-${locale}] ${request.text}`;
          }
        }
        
        return results;
      } catch (parseError) {
        console.error('Failed to parse translation response:', parseError);
        console.error('Response was:', responseText);
        // Fallback to placeholders
        const results: Record<string, string> = {};
        for (const locale of request.targetLocales) {
          results[locale] = `[AUTO-${locale}] ${request.text}`;
        }
        return results;
      }
    } catch (error) {
      console.error('Multi-language translation error:', error);
      // Fallback to placeholders
      const results: Record<string, string> = {};
      for (const locale of request.targetLocales) {
        results[locale] = `[AUTO-${locale}] ${request.text}`;
      }
      return results;
    }
  }

  /**
   * Get human-readable language name from locale code
   */
  private getLanguageName(locale: string): string {
    const languageNames: Record<string, string> = {
      'en': 'English',
      'en-GB': 'British English',
      'en-US': 'American English',
      'fr': 'French',
      'fr-FR': 'French (France)',
      'fr-CA': 'Canadian French',
      'de': 'German',
      'de-DE': 'German (Germany)',
      'de-AT': 'German (Austria)',
      'de-CH': 'German (Switzerland)',
      'es': 'Spanish',
      'es-ES': 'Spanish (Spain)',
      'es-MX': 'Spanish (Mexico)',
      'it': 'Italian',
      'pt': 'Portuguese',
      'pt-PT': 'Portuguese (Portugal)',
      'pt-BR': 'Portuguese (Brazil)',
      'nl': 'Dutch',
      'pl': 'Polish',
      'ru': 'Russian',
      'sv': 'Swedish',
      'no': 'Norwegian',
      'da': 'Danish',
      'fi': 'Finnish',
      'el': 'Greek',
      'ro': 'Romanian',
      'bg': 'Bulgarian',
      'cs': 'Czech',
      'sk': 'Slovak',
      'sl': 'Slovenian',
      'hr': 'Croatian',
      'hu': 'Hungarian',
      'et': 'Estonian',
      'lv': 'Latvian',
      'lt': 'Lithuanian',
      'mt': 'Maltese',
      'ga': 'Irish',
      'cy': 'Welsh',
      'is': 'Icelandic',
      'hy': 'Armenian',
      // Add more as needed
    };

    return languageNames[locale] || locale;
  }

  /**
   * Estimate cost for translation (based on GPT-4 pricing)
   */
  estimateCost(texts: string[], model: string = this.model): number {
    // Rough estimation based on average tokens
    const totalChars = texts.reduce((sum, text) => sum + text.length, 0);
    const estimatedTokens = totalChars / 4; // Rough estimate: 1 token ≈ 4 chars
    
    // GPT-4 pricing (as of 2024)
    const pricing = {
      'gpt-4-turbo-preview': { input: 0.01, output: 0.03 }, // per 1K tokens
      'gpt-3.5-turbo': { input: 0.0005, output: 0.0015 }
    };

    const price = pricing[model as keyof typeof pricing] || pricing['gpt-4-turbo-preview'];
    
    // Assume output is similar length to input
    const inputCost = (estimatedTokens / 1000) * price.input;
    const outputCost = (estimatedTokens / 1000) * price.output;
    
    return inputCost + outputCost;
  }
}

// Export singleton instance
export const gptTranslationService = new GPTTranslationService();