import React, { useState, useEffect } from 'react';
import { Calendar, Target, TrendingUp, Award, AlertCircle } from 'lucide-react';
import { useUser } from '../contexts/UserContext';
import { API_BASE_URL } from '../utils/api';

interface DailyIntake {
  date: string;
  total_calories: number;
  total_protein: number;
  total_carbs: number;
  total_fat: number;
  daily_calorie_target: number;
  calories_remaining: number;
  completion_percentage: number;
  entries_count: number;
  entries: Array<{
    id: number;
    product_name: string;
    calories: number;
    meal_type: string;
    quantity: number;
  }>;
}

const Dashboard: React.FC = () => {
  const [dailyData, setDailyData] = useState<DailyIntake | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const { user } = useUser();

  useEffect(() => {
    if (user) {
      fetchDailyIntake();
    }
  }, [user, selectedDate]);

  const fetchDailyIntake = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/daily-intake/${user.user_id}?date=${selectedDate}`);
      const data = await response.json();

      if (response.ok) {
        setDailyData(data);
      } else {
        setError(data.detail || 'Failed to fetch daily intake');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Please Login</h2>
          <p className="text-gray-600 mb-6">You need to create a profile to view your dashboard.</p>
          <a
            href="/register"
            className="bg-gradient-to-r from-emerald-500 to-blue-500 text-white px-6 py-3 rounded-lg font-semibold hover:from-emerald-600 hover:to-blue-600 transition-all"
          >
            Create Profile
          </a>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-r from-emerald-500 to-blue-500 rounded-full animate-pulse mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Error</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={fetchDailyIntake}
            className="bg-gradient-to-r from-emerald-500 to-blue-500 text-white px-6 py-3 rounded-lg font-semibold hover:from-emerald-600 hover:to-blue-600 transition-all"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const getMealTypeColor = (mealType: string) => {
    switch (mealType) {
      case 'breakfast': return 'bg-yellow-100 text-yellow-800';
      case 'lunch': return 'bg-green-100 text-green-800';
      case 'dinner': return 'bg-blue-100 text-blue-800';
      default: return 'bg-purple-100 text-purple-800';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome back, {user.user_id}!
          </h1>
          <p className="text-gray-600">Track your daily nutrition and stay on top of your health goals.</p>
        </div>

        {/* Date Selector */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-8">
          <div className="flex flex-col sm:flex-row items-center justify-between">
            <div className="flex items-center space-x-3 mb-4 sm:mb-0">
              <Calendar className="w-6 h-6 text-emerald-600" />
              <h2 className="text-xl font-semibold text-gray-900">Daily Overview</h2>
            </div>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            />
          </div>
        </div>

        {dailyData && (
          <>
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-white rounded-2xl shadow-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center">
                    <Target className="w-6 h-6 text-emerald-600" />
                  </div>
                  <span className="text-sm font-medium text-emerald-600">
                    {Math.round(dailyData.completion_percentage)}%
                  </span>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-1">
                  {Math.round(dailyData.total_calories)}
                </h3>
                <p className="text-gray-600 text-sm">
                  of {dailyData.daily_calorie_target} calories
                </p>
                <div className="w-full bg-gray-200 rounded-full h-2 mt-3">
                  <div
                    className="bg-gradient-to-r from-emerald-500 to-emerald-600 h-2 rounded-full transition-all"
                    style={{ width: `${Math.min(100, dailyData.completion_percentage)}%` }}
                  ></div>
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-1">
                  {Math.round(dailyData.total_protein)}g
                </h3>
                <p className="text-gray-600 text-sm">Protein</p>
              </div>

              <div className="bg-white rounded-2xl shadow-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                    <Award className="w-6 h-6 text-yellow-600" />
                  </div>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-1">
                  {Math.round(dailyData.total_carbs)}g
                </h3>
                <p className="text-gray-600 text-sm">Carbohydrates</p>
              </div>

              <div className="bg-white rounded-2xl shadow-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                    <Target className="w-6 h-6 text-purple-600" />
                  </div>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-1">
                  {Math.round(dailyData.total_fat)}g
                </h3>
                <p className="text-gray-600 text-sm">Total Fat</p>
              </div>
            </div>

            {/* Calories Remaining */}
            <div className="bg-white rounded-2xl shadow-xl p-6 mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Daily Progress</h3>
              <div className="flex items-center justify-between mb-4">
                <span className="text-gray-600">Calories Remaining</span>
                <span className={`text-2xl font-bold ${
                  dailyData.calories_remaining >= 0 ? 'text-emerald-600' : 'text-red-600'
                }`}>
                  {Math.abs(Math.round(dailyData.calories_remaining))}
                  {dailyData.calories_remaining < 0 && ' over'}
                </span>
              </div>
              {dailyData.calories_remaining < 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-red-700 text-sm">
                    You've exceeded your daily calorie target. Consider lighter meals or increased activity.
                  </p>
                </div>
              )}
            </div>

            {/* Today's Entries */}
            <div className="bg-white rounded-2xl shadow-xl p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">
                Today's Food Entries ({dailyData.entries_count})
              </h3>
              
              {dailyData.entries.length === 0 ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Calendar className="w-8 h-8 text-gray-400" />
                  </div>
                  <p className="text-gray-600 mb-4">No food entries for this day yet.</p>
                  <a
                    href="/analyze"
                    className="bg-gradient-to-r from-emerald-500 to-blue-500 text-white px-6 py-3 rounded-lg font-semibold hover:from-emerald-600 hover:to-blue-600 transition-all inline-block"
                  >
                    Add Your First Entry
                  </a>
                </div>
              ) : (
                <div className="space-y-4">
                  {dailyData.entries.map((entry) => (
                    <div
                      key={entry.id}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex items-center space-x-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getMealTypeColor(entry.meal_type)}`}>
                          {entry.meal_type}
                        </span>
                        <div>
                          <h4 className="font-medium text-gray-900">{entry.product_name}</h4>
                          <p className="text-sm text-gray-600">Quantity: {entry.quantity}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-gray-900">{Math.round(entry.calories)} cal</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Dashboard;