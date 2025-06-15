import React, { useState, useEffect } from 'react';
import { User, Edit, Save, X, Calculator, Target } from 'lucide-react';
import { useUser } from '../contexts/UserContext';
import { API_BASE_URL } from '../utils/api';

interface UserStats {
  bmi: number;
  bmi_category: string;
  daily_calorie_target: number;
}

const Profile: React.FC = () => {
  const { user, setUser } = useUser();
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (user) {
      fetchUserProfile();
    }
  }, [user]);

  const fetchUserProfile = async () => {
    if (!user) return;

    try {
      const response = await fetch(`${API_BASE_URL}/user/${user.user_id}`);
      const data = await response.json();

      if (response.ok) {
        setUserStats({
          bmi: data.bmi,
          bmi_category: data.bmi_category,
          daily_calorie_target: data.daily_calorie_target
        });
      } else {
        setError(data.detail || 'Failed to fetch profile');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getBMIColor = (category: string) => {
    switch (category.toLowerCase()) {
      case 'underweight': return 'text-blue-600 bg-blue-50';
      case 'normal weight': return 'text-emerald-600 bg-emerald-50';
      case 'overweight': return 'text-yellow-600 bg-yellow-50';
      case 'obese': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getActivityLevelDisplay = (level: string) => {
    const levels = {
      'sedentary': 'Sedentary (little/no exercise)',
      'light': 'Light (light exercise 1-3 days/week)',
      'moderate': 'Moderate (moderate exercise 3-5 days/week)',
      'active': 'Active (hard exercise 6-7 days/week)',
      'very_active': 'Very Active (very hard exercise/physical job)'
    };
    return levels[level as keyof typeof levels] || level;
  };

  const getGoalDisplay = (goal: string) => {
    const goals = {
      'lose': 'Lose Weight',
      'maintain': 'Maintain Weight',
      'gain': 'Gain Weight'
    };
    return goals[goal as keyof typeof goals] || goal;
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Please Login</h2>
          <p className="text-gray-600 mb-6">You need to create a profile to view this page.</p>
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
          <p className="text-gray-600">Loading your profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-gradient-to-r from-emerald-500 to-blue-500 rounded-full flex items-center justify-center">
                <User className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">{user.user_id}</h1>
                <p className="text-gray-600">Your nutrition profile</p>
              </div>
            </div>
            <button
              onClick={() => setEditing(!editing)}
              className="flex items-center space-x-2 px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors"
            >
              {editing ? <X className="w-4 h-4" /> : <Edit className="w-4 h-4" />}
              <span>{editing ? 'Cancel' : 'Edit Profile'}</span>
            </button>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <p className="text-red-600">{error}</p>
            </div>
          )}

          {/* Health Metrics */}
          {userStats && (
            <div className="grid md:grid-cols-3 gap-6">
              <div className="bg-emerald-50 rounded-lg p-6">
                <div className="flex items-center space-x-3 mb-3">
                  <Calculator className="w-6 h-6 text-emerald-600" />
                  <h3 className="font-semibold text-emerald-800">BMI</h3>
                </div>
                <p className="text-3xl font-bold text-emerald-600 mb-1">
                  {userStats.bmi}
                </p>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getBMIColor(userStats.bmi_category)}`}>
                  {userStats.bmi_category}
                </span>
              </div>

              <div className="bg-blue-50 rounded-lg p-6">
                <div className="flex items-center space-x-3 mb-3">
                  <Target className="w-6 h-6 text-blue-600" />
                  <h3 className="font-semibold text-blue-800">Daily Calories</h3>
                </div>
                <p className="text-3xl font-bold text-blue-600 mb-1">
                  {userStats.daily_calorie_target}
                </p>
                <p className="text-sm text-blue-700">Target per day</p>
              </div>

              <div className="bg-purple-50 rounded-lg p-6">
                <div className="flex items-center space-x-3 mb-3">
                  <User className="w-6 h-6 text-purple-600" />
                  <h3 className="font-semibold text-purple-800">Goal</h3>
                </div>
                <p className="text-lg font-bold text-purple-600 mb-1">
                  {getGoalDisplay(user.goal)}
                </p>
                <p className="text-sm text-purple-700">Current objective</p>
              </div>
            </div>
          )}
        </div>

        {/* Profile Details */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Profile Details</h2>
          
          <div className="grid md:grid-cols-2 gap-8">
            {/* Basic Information */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Age</label>
                  <p className="text-gray-900 font-medium">{user.age} years</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
                  <p className="text-gray-900 font-medium capitalize">{user.gender}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Height</label>
                  <p className="text-gray-900 font-medium">{user.height} cm</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Weight</label>
                  <p className="text-gray-900 font-medium">{user.weight} kg</p>
                </div>
              </div>
            </div>

            {/* Activity & Goals */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Activity & Goals</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Activity Level</label>
                  <p className="text-gray-900 font-medium">{getActivityLevelDisplay(user.activity_level)}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Goal</label>
                  <p className="text-gray-900 font-medium">{getGoalDisplay(user.goal)}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Preferred Language</label>
                  <p className="text-gray-900 font-medium capitalize">{user.preferred_language}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Dietary Restrictions */}
          {user.dietary_restrictions.length > 0 && (
            <div className="mt-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Dietary Restrictions</h3>
              <div className="flex flex-wrap gap-2">
                {user.dietary_restrictions.map((restriction, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-sm font-medium"
                  >
                    {restriction}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Health Conditions */}
          {user.health_conditions.length > 0 && (
            <div className="mt-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Health Conditions</h3>
              <div className="flex flex-wrap gap-2">
                {user.health_conditions.map((condition, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm font-medium"
                  >
                    {condition}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="mt-8 grid md:grid-cols-3 gap-4">
          <a
            href="/analyze"
            className="bg-gradient-to-r from-emerald-500 to-emerald-600 text-white p-6 rounded-2xl shadow-xl hover:from-emerald-600 hover:to-emerald-700 transition-all transform hover:scale-105 text-center"
          >
            <h3 className="text-lg font-semibold mb-2">Analyze Food</h3>
            <p className="text-emerald-100">Scan a nutrition label</p>
          </a>
          <a
            href="/dashboard"
            className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-6 rounded-2xl shadow-xl hover:from-blue-600 hover:to-blue-700 transition-all transform hover:scale-105 text-center"
          >
            <h3 className="text-lg font-semibold mb-2">View Dashboard</h3>
            <p className="text-blue-100">Check daily progress</p>
          </a>
          <a
            href="/weekly"
            className="bg-gradient-to-r from-purple-500 to-purple-600 text-white p-6 rounded-2xl shadow-xl hover:from-purple-600 hover:to-purple-700 transition-all transform hover:scale-105 text-center"
          >
            <h3 className="text-lg font-semibold mb-2">Weekly Summary</h3>
            <p className="text-purple-100">View weekly trends</p>
          </a>
        </div>
      </div>
    </div>
  );
};

export default Profile;