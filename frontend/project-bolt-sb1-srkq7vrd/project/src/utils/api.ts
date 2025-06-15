export const API_BASE_URL = 'http://localhost:8000';

export const apiRequest = async (endpoint: string, options?: RequestInit) => {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  });

  if (!response.ok) {
    throw new Error(`API request failed: ${response.status}`);
  }

  return response.json();
};

// FIXED: Translation utility function with proper request body format
export const translateText = async (text: string, targetLanguage: string): Promise<string> => {
  try {
    // Don't translate if target is English or text is empty
    if (targetLanguage === 'english' || !text.trim()) {
      return text;
    }

    console.log('🌐 Translating:', {
      textLength: text.length,
      targetLanguage,
      textPreview: text.substring(0, 50) + '...'
    });

    // Send data in request body as JSON (matching backend expectation)
    const response = await fetch(`${API_BASE_URL}/translate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: text.trim(),
        target_language: targetLanguage
      })
    });

    if (response.ok) {
      const data = await response.json();
      console.log('✅ Translation API response:', {
        originalLength: data.original_text?.length || 0,
        translatedLength: data.translated_text?.length || 0,
        language: data.target_language,
        success: true
      });
      
      return data.translated_text || text;
    } else {
      const errorData = await response.json().catch(() => ({ detail: 'Unknown error' }));
      console.error('❌ Translation API failed:', {
        status: response.status,
        error: errorData.detail || 'Unknown error'
      });
      return text; // Return original text if translation fails
    }
  } catch (error) {
    console.error('❌ Translation network error:', error);
    return text; // Return original text if translation fails
  }
};

// FIXED: Cache for supported languages - changed type to eliminate null
let languagesCache: Record<string, string> = {};

export const getSupportedLanguages = async (): Promise<Record<string, string>> => {
  // Return cached languages if available
  if (Object.keys(languagesCache).length > 0) {
    return languagesCache;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/languages`);
    if (response.ok) {
      const data = await response.json();
      languagesCache = data.supported_languages || {};
      return languagesCache;
    }
    return {};
  } catch (error) {
    console.error('Failed to fetch supported languages:', error);
    return {};
  }
};
