import React from 'react';
import { Link } from 'react-router-dom';
import { Camera, Brain, Globe, Shield, BarChart3, Users } from 'lucide-react';
import { useUser } from '../contexts/UserContext';

const Home: React.FC = () => {
  const { isLoggedIn } = useUser();

  const features = [
    {
      icon: Camera,
      title: 'AI-Powered Image Analysis',
      description: 'Simply snap a photo of any food product and get instant, detailed nutrition information.'
    },
    {
      icon: Brain,
      title: 'Smart Health Insights',
      description: 'Get personalized health warnings and recommendations based on your profile and eating habits.'
    },
    {
      icon: Globe,
      title: 'Multi-Language Support',
      description: 'Access nutrition information in multiple Indian languages with simple explanations.'
    },
    {
      icon: Shield,
      title: 'Scientific Explanations',
      description: 'Understand complex scientific ingredients with easy-to-understand explanations.'
    },
    {
      icon: BarChart3,
      title: 'Daily & Weekly Tracking',
      description: 'Monitor your nutrition intake with detailed daily and weekly progress reports.'
    },
    {
      icon: Users,
      title: 'Personalized Experience',
      description: 'Customized recommendations based on your age, weight, height, and health goals.'
    }
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-emerald-50 via-blue-50 to-emerald-50 py-20 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            Smart Nutrition Tracking with{' '}
            <span className="bg-gradient-to-r from-emerald-600 to-blue-600 bg-clip-text text-transparent">
              AI Power
            </span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto leading-relaxed">
            Take a photo of any food product and get instant nutrition analysis, health warnings, 
            and personalized recommendations in your preferred language.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {!isLoggedIn ? (
              <>
                <Link
                  to="/register"
                  className="bg-gradient-to-r from-emerald-500 to-emerald-600 text-white px-8 py-4 rounded-xl font-semibold hover:from-emerald-600 hover:to-emerald-700 transform hover:scale-105 transition-all shadow-lg hover:shadow-xl"
                >
                  Get Started Free
                </Link>
                <Link
                  to="/analyze"
                  className="bg-white text-emerald-600 px-8 py-4 rounded-xl font-semibold border-2 border-emerald-500 hover:bg-emerald-50 transform hover:scale-105 transition-all"
                >
                  Try Demo
                </Link>
              </>
            ) : (
              <>
                <Link
                  to="/analyze"
                  className="bg-gradient-to-r from-emerald-500 to-emerald-600 text-white px-8 py-4 rounded-xl font-semibold hover:from-emerald-600 hover:to-emerald-700 transform hover:scale-105 transition-all shadow-lg hover:shadow-xl"
                >
                  Analyze Food Now
                </Link>
                <Link
                  to="/dashboard"
                  className="bg-white text-blue-600 px-8 py-4 rounded-xl font-semibold border-2 border-blue-500 hover:bg-blue-50 transform hover:scale-105 transition-all"
                >
                  View Dashboard
                </Link>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Why Choose Nutrigo?
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Advanced AI technology meets personalized nutrition tracking to help you make informed food choices.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div
                  key={index}
                  className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 hover:shadow-lg hover:border-emerald-200 transition-all group"
                >
                  <div className="w-12 h-12 bg-gradient-to-r from-emerald-500 to-blue-500 rounded-xl flex items-center justify-center mb-6 group-hover:shadow-lg transition-shadow">
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-4 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              How It Works
            </h2>
            <p className="text-lg text-gray-600">
              Three simple steps to better nutrition awareness
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: '1',
                title: 'Snap a Photo',
                description: 'Take a clear picture of the nutrition label on any food product'
              },
              {
                step: '2',
                title: 'AI Analysis',
                description: 'Our AI extracts and analyzes all nutrition information instantly'
              },
              {
                step: '3',
                title: 'Get Insights',
                description: 'Receive personalized health recommendations and track your intake'
              }
            ].map((item, index) => (
              <div key={index} className="text-center">
                <div className="w-16 h-16 bg-gradient-to-r from-emerald-500 to-blue-500 rounded-full flex items-center justify-center text-white text-2xl font-bold mb-6 mx-auto">
                  {item.step}
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">
                  {item.title}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-gradient-to-r from-emerald-500 to-blue-600">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Ready to Transform Your Nutrition Journey?
          </h2>
          <p className="text-xl text-emerald-100 mb-8">
            Join thousands of users who are making smarter food choices with Nutrigo.
          </p>
          {!isLoggedIn ? (
            <Link
              to="/register"
              className="bg-white text-emerald-600 px-8 py-4 rounded-xl font-semibold hover:bg-gray-50 transform hover:scale-105 transition-all shadow-lg inline-block"
            >
              Start Your Free Journey
            </Link>
          ) : (
            <Link
              to="/analyze"
              className="bg-white text-emerald-600 px-8 py-4 rounded-xl font-semibold hover:bg-gray-50 transform hover:scale-105 transition-all shadow-lg inline-block"
            >
              Analyze Your First Product
            </Link>
          )}
        </div>
      </section>
    </div>
  );
};

export default Home;