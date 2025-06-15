import React, { useState, useRef } from 'react';
import { Camera, Upload, Loader, AlertTriangle, Info, Languages } from 'lucide-react';
import { useUser } from '../contexts/UserContext';
import { API_BASE_URL } from '../utils/api';
import TranslationToggle from '../components/TranslationToggle';

interface NutritionData {
  product_name: string;
  serving_size: string;
  calories: number;
  protein: number;
  total_carbohydrates: number;
  total_fat: number;
  sodium: number;
  ingredients_list: string[];
}

interface AnalysisResult {
  extracted_nutrition: NutritionData;
  health_analysis: {
    health_warnings: string[];
    nutritional_assessment: string;
    recommendations: string[];
    daily_intake_analysis: string;
  };
  comprehensive_summary: string;
  ingredient_explanation: string;
  language_used: string;
}

const Analyze: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [mealType, setMealType] = useState('snack');
  const [language, setLanguage] = useState('english');
  const [translatedSummary, setTranslatedSummary] = useState('');
  const [translatedIngredients, setTranslatedIngredients] = useState('');
  const [currentSummaryLanguage, setCurrentSummaryLanguage] = useState('english');
  const [currentIngredientsLanguage, setCurrentIngredientsLanguage] = useState('english');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user } = useUser();

  const languages = [
    { code: 'english', name: 'English' },
    { code: 'hindi', name: 'हिंदी' },
    { code: 'tamil', name: 'தமிழ்' },
    { code: 'telugu', name: 'తెలుగు' },
    { code: 'kannada', name: 'ಕನ್ನಡ' },
    { code: 'malayalam', name: 'മലയാളം' },
    { code: 'bengali', name: 'বাংলা' },
    { code: 'gujarati', name: 'ગુજરાતી' },
    { code: 'marathi', name: 'मराठी' },
    { code: 'punjabi', name: 'ਪੰਜਾਬੀ' }
  ];

  const handleFileSelect = (file: File) => {
    if (file.size > 10 * 1024 * 1024) {
      setError('File size must be less than 10MB');
      return;
    }

    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }

    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setError('');
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const handleAnalyze = async () => {
    if (!selectedFile) {
      setError('Please select an image first');
      return;
    }

    setLoading(true);
    setError('');
    setResult(null);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('user_id', user?.user_id || '');
      formData.append('quantity', quantity.toString());
      formData.append('meal_type', mealType);
      formData.append('preferred_language', language);

      const response = await fetch(`${API_BASE_URL}/analyze-nutrition`, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        setResult(data);
        setTranslatedSummary(data.comprehensive_summary);
        setTranslatedIngredients(data.ingredient_explanation);
        setCurrentSummaryLanguage(data.language_used);
        setCurrentIngredientsLanguage(data.language_used);
      } else {
        setError(data.detail || 'Analysis failed');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const resetAnalysis = () => {
    setSelectedFile(null);
    setPreviewUrl('');
    setResult(null);
    setError('');
    setTranslatedSummary('');
    setTranslatedIngredients('');
    setCurrentSummaryLanguage('english');
    setCurrentIngredientsLanguage('english');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSummaryTranslation = (translatedText: string, targetLanguage: string) => {
    setTranslatedSummary(translatedText);
    setCurrentSummaryLanguage(targetLanguage);
  };

  const handleIngredientsTranslation = (translatedText: string, targetLanguage: string) => {
    setTranslatedIngredients(translatedText);
    setCurrentIngredientsLanguage(targetLanguage);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Analyze Nutrition Label</h1>
          <p className="text-gray-600">Upload a photo of any food product's nutrition label</p>
        </div>

        {!result ? (
          <div className="bg-white rounded-2xl shadow-xl p-8">
            {/* File Upload Area */}
            <div
              className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-emerald-400 transition-colors"
              onDrop={handleDrop}
              onDragOver={handleDragOver}
            >
              {previewUrl ? (
                <div className="space-y-4">
                  <img
                    src={previewUrl}
                    alt="Preview"
                    className="max-w-full max-h-64 mx-auto rounded-lg shadow-md"
                  />
                  <button
                    onClick={resetAnalysis}
                    className="text-gray-500 hover:text-gray-700 underline"
                  >
                    Choose different image
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto">
                    <Camera className="w-8 h-8 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-lg font-medium text-gray-900 mb-2">
                      Drop your image here, or click to browse
                    </p>
                    <p className="text-gray-500">
                      Supports JPG, PNG up to 10MB
                    </p>
                  </div>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="bg-emerald-500 text-white px-6 py-3 rounded-lg hover:bg-emerald-600 transition-colors inline-flex items-center space-x-2"
                  >
                    <Upload className="w-5 h-5" />
                    <span>Choose File</span>
                  </button>
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>

            {/* Analysis Options */}
            {selectedFile && (
              <div className="mt-8 space-y-6">
                <div className="grid md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Quantity
                    </label>
                    <input
                      type="number"
                      value={quantity}
                      onChange={(e) => setQuantity(parseFloat(e.target.value) || 1)}
                      min="0.1"
                      step="0.1"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Meal Type
                    </label>
                    <select
                      value={mealType}
                      onChange={(e) => setMealType(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    >
                      <option value="breakfast">Breakfast</option>
                      <option value="lunch">Lunch</option>
                      <option value="dinner">Dinner</option>
                      <option value="snack">Snack</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Languages className="w-4 h-4 inline mr-1" />
                      Language
                    </label>
                    <select
                      value={language}
                      onChange={(e) => setLanguage(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    >
                      {languages.map(lang => (
                        <option key={lang.code} value={lang.code}>
                          {lang.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <button
                  onClick={handleAnalyze}
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-emerald-500 to-blue-500 text-white py-4 px-6 rounded-lg font-semibold hover:from-emerald-600 hover:to-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 transition-all shadow-lg flex items-center justify-center space-x-2"
                >
                  {loading ? (
                    <>
                      <Loader className="w-5 h-5 animate-spin" />
                      <span>Analyzing...</span>
                    </>
                  ) : (
                    <>
                      <Camera className="w-5 h-5" />
                      <span>Analyze Nutrition</span>
                    </>
                  )}
                </button>
              </div>
            )}

            {error && (
              <div className="mt-6 bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center space-x-2">
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                  <p className="text-red-600">{error}</p>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* Results Display */
          <div className="space-y-6">
            {/* Product Info */}
            <div className="bg-white rounded-2xl shadow-xl p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Analysis Results</h2>
              
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Product Information</h3>
                  <div className="space-y-2">
                    <p><span className="font-medium">Product:</span> {result.extracted_nutrition.product_name}</p>
                    <p><span className="font-medium">Serving Size:</span> {result.extracted_nutrition.serving_size}</p>
                    <p><span className="font-medium">Quantity:</span> {quantity}</p>
                    <p><span className="font-medium">Language:</span> {result.language_used}</p>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Nutrition Facts</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="bg-emerald-50 p-3 rounded-lg">
                      <p className="font-medium text-emerald-800">Calories</p>
                      <p className="text-2xl font-bold text-emerald-600">{Math.round(result.extracted_nutrition.calories * quantity)}</p>
                    </div>
                    <div className="bg-blue-50 p-3 rounded-lg">
                      <p className="font-medium text-blue-800">Protein</p>
                      <p className="text-2xl font-bold text-blue-600">{Math.round(result.extracted_nutrition.protein * quantity)}g</p>
                    </div>
                    <div className="bg-yellow-50 p-3 rounded-lg">
                      <p className="font-medium text-yellow-800">Carbs</p>
                      <p className="text-2xl font-bold text-yellow-600">{Math.round(result.extracted_nutrition.total_carbohydrates * quantity)}g</p>
                    </div>
                    <div className="bg-purple-50 p-3 rounded-lg">
                      <p className="font-medium text-purple-800">Fat</p>
                      <p className="text-2xl font-bold text-purple-600">{Math.round(result.extracted_nutrition.total_fat * quantity)}g</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Health Warnings */}
            {result.health_analysis.health_warnings.length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-2xl p-6">
                <h3 className="text-lg font-semibold text-red-800 mb-4 flex items-center">
                  <AlertTriangle className="w-5 h-5 mr-2" />
                  Health Warnings
                </h3>
                <ul className="space-y-2">
                  {result.health_analysis.health_warnings.map((warning, index) => (
                    <li key={index} className="text-red-700 flex items-start space-x-2">
                      <span className="text-red-500 mt-1">•</span>
                      <span>{warning}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Comprehensive Summary with Translation */}
            <div className="bg-white rounded-2xl shadow-xl p-8">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                  <Info className="w-5 h-5 mr-2 text-blue-600" />
                  Comprehensive Analysis
                </h3>
                <TranslationToggle
                  text={result.comprehensive_summary}
                  currentLanguage={currentSummaryLanguage}
                  onTranslatedText={handleSummaryTranslation}
                />
              </div>
              <div className="prose max-w-none">
                <pre className="whitespace-pre-wrap text-gray-700 font-sans">
                  {translatedSummary}
                </pre>
              </div>
            </div>

            {/* Ingredient Explanations with Translation */}
            {result.ingredient_explanation && (
              <div className="bg-white rounded-2xl shadow-xl p-8">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Ingredient Explanations
                  </h3>
                  <TranslationToggle
                    text={result.ingredient_explanation}
                    currentLanguage={currentIngredientsLanguage}
                    onTranslatedText={handleIngredientsTranslation}
                  />
                </div>
                <div className="prose max-w-none">
                  <pre className="whitespace-pre-wrap text-gray-700 font-sans">
                    {translatedIngredients}
                  </pre>
                </div>
              </div>
            )}

            {/* Recommendations */}
            {result.health_analysis.recommendations.length > 0 && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6">
                <h3 className="text-lg font-semibold text-emerald-800 mb-4">
                  Recommendations
                </h3>
                <ul className="space-y-2">
                  {result.health_analysis.recommendations.map((rec, index) => (
                    <li key={index} className="text-emerald-700 flex items-start space-x-2">
                      <span className="text-emerald-500 mt-1">✓</span>
                      <span>{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={resetAnalysis}
                className="flex-1 bg-gray-500 text-white py-3 px-6 rounded-lg font-semibold hover:bg-gray-600 transition-colors"
              >
                Analyze Another Product
              </button>
              {user && (
                <button
                  onClick={() => window.location.href = '/dashboard'}
                  className="flex-1 bg-gradient-to-r from-emerald-500 to-blue-500 text-white py-3 px-6 rounded-lg font-semibold hover:from-emerald-600 hover:to-blue-600 transition-all"
                >
                  View Dashboard
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Analyze;