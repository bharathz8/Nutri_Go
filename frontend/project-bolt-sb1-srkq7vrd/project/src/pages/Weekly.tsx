import React, { useState, useEffect } from 'react';
import { Calendar, TrendingUp, BarChart3, Target } from 'lucide-react';
import { useUser } from '../contexts/UserContext';
import { API_BASE_URL } from '../utils/api';

interface WeeklyData {
  week_start: string;
  week_end: string;
  daily_data: Array<{
    date: string;
    calories: number;
    protein: number;
    entries_count: number;
  }>;
  weekly_total_calories: number;
  average_daily_calories: number;
  daily_target: number;
  weekly_target: number;
}

const Weekly: React.FC = () => {
  const [weeklyData, setWeeklyData] = useState<WeeklyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [startDate, setStartDate] = useState(() => {
    const today = new Date();
    const monday = new Date(today.setDate(today.getDate() - today.getDay() + 1));
    return monday.toISOString().split('T')[0];
  });
  const { user } = useUser();

  useEffect(() => {
    if (user) {
      fetchWeeklySummary();
    }
  }, [user, startDate]);

  const fetchWeeklySummary = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/weekly-summary/${user.user_id}?start_date=${startDate}`);
      const data = await response.json();

      if (response.ok) {
        setWeeklyData(data);
      } else {
        setError(data.detail || 'Failed to fetch weekly summary');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const getWeekDay = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { weekday: 'short' });
  };

  const getProgressColor = (calories: number, target: number) => {
    const percentage = (calories / target) * 100;
    if (percentage < 80) return 'bg-red-500';
    if (percentage > 120) return 'bg-orange-500';
    return 'bg-emerald-500';
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Please Login</h2>
          <p className="text-gray-600 mb-6">You need to create a profile to view your weekly summary.</p>
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
          <p className="text-gray-600">Loading your weekly summary...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Error</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={fetchWeeklySummary}
            className="bg-gradient-to-r from-emerald-500 to-blue-500 text-white px-6 py-3 rounded-lg font-semibold hover:from-emerald-600 hover:to-blue-600 transition-all"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Weekly Summary</h1>
          <p className="text-gray-600">Track your nutrition progress over the week.</p>
        </div>

        {/* Week Selector */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-8">
          <div className="flex flex-col sm:flex-row items-center justify-between">
            <div className="flex items-center space-x-3 mb-4 sm:mb-0">
              <Calendar className="w-6 h-6 text-emerald-600" />
              <h2 className="text-xl font-semibold text-gray-900">
                Week of {weeklyData && formatDate(weeklyData.week_start)}
              </h2>
            </div>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              title="Select week start date (Monday)"
            />
          </div>
        </div>

        {weeklyData && (
          <>
            {/* Weekly Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-white rounded-2xl shadow-xl p-6">
                <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center mb-4">
                  <Target className="w-6 h-6 text-emerald-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-1">
                  {Math.round(weeklyData.weekly_total_calories)}
                </h3>
                <p className="text-gray-600 text-sm">Total Calories This Week</p>
                <p className="text-xs text-gray-500 mt-1">
                  Target: {Math.round(weeklyData.weekly_target)}
                </p>
              </div>

              <div className="bg-white rounded-2xl shadow-xl p-6">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                  <TrendingUp className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-1">
                  {Math.round(weeklyData.average_daily_calories)}
                </h3>
                <p className="text-gray-600 text-sm">Average Daily Calories</p>
                <p className="text-xs text-gray-500 mt-1">
                  Target: {Math.round(weeklyData.daily_target)}
                </p>
              </div>

              <div className="bg-white rounded-2xl shadow-xl p-6">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                  <BarChart3 className="w-6 h-6 text-purple-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-1">
                  {weeklyData.daily_data.filter(day => day.entries_count > 0).length}
                </h3>
                <p className="text-gray-600 text-sm">Days with Food Entries</p>
                <p className="text-xs text-gray-500 mt-1">
                  out of 7 days
                </p>
              </div>
            </div>

            {/* Daily Breakdown Chart */}
            <div className="bg-white rounded-2xl shadow-xl p-6 mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Daily Calorie Breakdown</h3>
              
              <div className="space-y-4">
                {weeklyData.daily_data.map((day, index) => {
                  const percentage = Math.min(100, (day.calories / weeklyData.daily_target) * 100);
                  const colorClass = getProgressColor(day.calories, weeklyData.daily_target);
                  
                  return (
                    <div key={index} className="flex items-center space-x-4">
                      <div className="w-12 text-sm font-medium text-gray-600">
                        {getWeekDay(day.date)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm text-gray-600">
                            {formatDate(day.date)}
                          </span>
                          <span className="text-sm font-medium text-gray-900">
                            {Math.round(day.calories)} cal
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-3">
                          <div
                            className={`h-3 rounded-full transition-all ${colorClass}`}
                            style={{ width: `${percentage}%` }}
                          ></div>
                        </div>
                      </div>
                      <div className="w-12 text-right">
                        <span className="text-xs text-gray-500">
                          {day.entries_count} entries
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Weekly Progress Analysis */}
            <div className="bg-white rounded-2xl shadow-xl p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Weekly Progress Analysis</h3>
              
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Calorie Tracking</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Weekly Total:</span>
                      <span className="font-medium">{Math.round(weeklyData.weekly_total_calories)} cal</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Weekly Target:</span>
                      <span className="font-medium">{Math.round(weeklyData.weekly_target)} cal</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Variance:</span>
                      <span className={`font-medium ${
                        weeklyData.weekly_total_calories >= weeklyData.weekly_target 
                          ? 'text-emerald-600' 
                          : 'text-red-600'
                      }`}>
                        {weeklyData.weekly_total_calories >= weeklyData.weekly_target ? '+' : ''}
                        {Math.round(weeklyData.weekly_total_calories - weeklyData.weekly_target)} cal
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Consistency</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Days Tracked:</span>
                      <span className="font-medium">
                        {weeklyData.daily_data.filter(day => day.entries_count > 0).length}/7
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Total Entries:</span>
                      <span className="font-medium">
                        {weeklyData.daily_data.reduce((sum, day) => sum + day.entries_count, 0)}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Avg. Entries/Day:</span>
                      <span className="font-medium">
                        {Math.round(weeklyData.daily_data.reduce((sum, day) => sum + day.entries_count, 0) / 7 * 10) / 10}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 p-4 bg-emerald-50 rounded-lg">
                <h4 className="font-medium text-emerald-800 mb-2">Weekly Insights</h4>
                <ul className="text-sm text-emerald-700 space-y-1">
                  {weeklyData.weekly_total_calories < weeklyData.weekly_target * 0.8 && (
                    <li>• Consider increasing your calorie intake to meet your daily targets.</li>
                  )}
                  {weeklyData.weekly_total_calories > weeklyData.weekly_target * 1.2 && (
                    <li>• You're consistently exceeding your calorie targets. Consider portion control.</li>
                  )}
                  {weeklyData.daily_data.filter(day => day.entries_count > 0).length < 5 && (
                    <li>• Try to track your food intake more consistently for better insights.</li>
                  )}
                  {weeklyData.daily_data.filter(day => day.entries_count > 0).length >= 6 && (
                    <li>• Great consistency in tracking your food intake this week!</li>
                  )}
                </ul>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Weekly;