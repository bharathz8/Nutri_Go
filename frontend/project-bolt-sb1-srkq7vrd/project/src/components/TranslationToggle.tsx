import React, { useState, useEffect, useRef } from 'react';
import { Languages, Loader, CheckCircle } from 'lucide-react';
import { translateText } from '../utils/api';

interface TranslationToggleProps {
  text: string;
  currentLanguage: string;
  onTranslatedText: (translatedText: string, language: string) => void;
  className?: string;
}

// Cache supported languages globally to prevent multiple API calls
let cachedLanguages: Record<string, string> = {};
let languagesFetchPromise: Promise<Record<string, string>> | null = null;

const getSupportedLanguagesOnce = async (): Promise<Record<string, string>> => {
  if (Object.keys(cachedLanguages).length > 0) {
    return cachedLanguages;
  }
  
  if (languagesFetchPromise) {
    return languagesFetchPromise;
  }

  languagesFetchPromise = fetch('http://localhost:8000/languages')
    .then(response => response.json())
    .then(data => {
      cachedLanguages = data.supported_languages || {};
      languagesFetchPromise = null;
      return cachedLanguages;
    })
    .catch(error => {
      console.error('Failed to fetch supported languages:', error);
      languagesFetchPromise = null;
      return {};
    });

  return languagesFetchPromise;
};

const TranslationToggle: React.FC<TranslationToggleProps> = ({
  text,
  currentLanguage,
  onTranslatedText,
  className = ""
}) => {
  const [isTranslating, setIsTranslating] = useState(false);
  const [showLanguageMenu, setShowLanguageMenu] = useState(false);
  const [translationStatus, setTranslationStatus] = useState<string>('');
  const componentMounted = useRef(true);

  const languages = [
    { code: 'english', name: 'English', native: 'English' },
    { code: 'hindi', name: 'Hindi', native: 'हिंदी' },
    { code: 'tamil', name: 'Tamil', native: 'தமிழ்' },
    { code: 'telugu', name: 'Telugu', native: 'తెలుగు' },
    { code: 'kannada', name: 'Kannada', native: 'ಕನ್ನಡ' },
    { code: 'malayalam', name: 'Malayalam', native: 'മലയാളം' },
    { code: 'bengali', name: 'Bengali', native: 'বাংলা' },
    { code: 'gujarati', name: 'Gujarati', native: 'ગુજરાતી' },
    { code: 'marathi', name: 'Marathi', native: 'मराठी' },
    { code: 'punjabi', name: 'Punjabi', native: 'ਪੰਜਾਬੀ' },
    { code: 'urdu', name: 'Urdu', native: 'اردو' }
  ];

  useEffect(() => {
    componentMounted.current = true;
    
    // Only fetch languages once when component mounts
    getSupportedLanguagesOnce().catch(console.error);

    return () => {
      componentMounted.current = false;
    };
  }, []);

  const handleTranslate = async (targetLanguage: string) => {
    if (targetLanguage === currentLanguage || !text.trim() || isTranslating) {
      setShowLanguageMenu(false);
      return;
    }

    setIsTranslating(true);
    setShowLanguageMenu(false);
    
    const targetLangName = languages.find(l => l.code === targetLanguage)?.native || targetLanguage;
    setTranslationStatus(`Translating to ${targetLangName}...`);

    try {
      console.log('🔄 Starting translation:', {
        textLength: text.length,
        targetLanguage,
        currentLanguage
      });

      const translatedText = await translateText(text, targetLanguage);
      
      if (!componentMounted.current) return;

      if (translatedText && translatedText !== text) {
        onTranslatedText(translatedText, targetLanguage);
        setTranslationStatus('✅ Translation completed!');
        console.log('✅ Translation successful');
        
        // Clear status after 2 seconds
        setTimeout(() => {
          if (componentMounted.current) {
            setTranslationStatus('');
          }
        }, 2000);
      } else {
        setTranslationStatus('⚠️ Translation failed - showing original');
        setTimeout(() => {
          if (componentMounted.current) {
            setTranslationStatus('');
          }
        }, 3000);
      }
    } catch (error) {
      console.error('❌ Translation failed:', error);
      if (componentMounted.current) {
        setTranslationStatus('❌ Translation error');
        setTimeout(() => {
          if (componentMounted.current) {
            setTranslationStatus('');
          }
        }, 3000);
      }
    } finally {
      if (componentMounted.current) {
        setIsTranslating(false);
      }
    }
  };

  const getCurrentLanguageName = () => {
    const lang = languages.find(l => l.code === currentLanguage);
    return lang ? lang.native : 'English';
  };

  return (
    <div className={`relative ${className}`}>
      <button
        onClick={() => setShowLanguageMenu(!showLanguageMenu)}
        disabled={isTranslating}
        className="flex items-center space-x-2 px-3 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
        title={translationStatus || "Change language"}
      >
        {isTranslating ? (
          <Loader className="w-4 h-4 animate-spin text-emerald-600" />
        ) : translationStatus.includes('completed') ? (
          <CheckCircle className="w-4 h-4 text-green-600" />
        ) : (
          <Languages className="w-4 h-4 text-emerald-600" />
        )}
        <span className="text-sm font-medium text-gray-700">
          {getCurrentLanguageName()}
        </span>
      </button>

      {/* Translation Status */}
      {translationStatus && (
        <div className="absolute top-full left-0 mt-1 px-3 py-1 bg-gray-800 text-white text-xs rounded shadow-lg z-50 whitespace-nowrap">
          {translationStatus}
        </div>
      )}

      {showLanguageMenu && !isTranslating && (
        <div className="absolute top-full left-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-40 max-h-64 overflow-y-auto">
          <div className="p-2 border-b border-gray-100">
            <p className="text-xs text-gray-500 font-medium">Select Language</p>
          </div>
          {languages.map((language) => (
            <button
              key={language.code}
              onClick={() => handleTranslate(language.code)}
              disabled={isTranslating}
              className={`w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-b-0 disabled:opacity-50 ${
                currentLanguage === language.code 
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                  : 'text-gray-700'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex flex-col">
                  <span className="font-medium">{language.native}</span>
                  <span className="text-xs text-gray-500">{language.name}</span>
                </div>
                {currentLanguage === language.code && (
                  <CheckCircle className="w-4 h-4 text-emerald-600" />
                )}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default TranslationToggle;
