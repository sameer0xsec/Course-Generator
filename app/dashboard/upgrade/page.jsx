'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';

function UpgradePage() {
  const router = useRouter();
  const { user } = useUser();
  const [loading, setLoading] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);

  // Pricing plans
  const plans = [
    {
      id: 'basic',
      name: 'Basic Plan',
      price: '$9.99',
      period: 'per month',
      features: [
        'Unlimited course generation',
        'Up to 100 chapters per course',
        'Basic AI content generation',
        'Email support'
      ]
    },
    {
      id: 'pro',
      name: 'Pro Plan',
      price: '$19.99',
      period: 'per month',
      features: [
        'Unlimited course generation',
        'Unlimited chapters per course',
        'Advanced AI content generation',
        'Priority support',
        'Course analytics',
        'Export to multiple formats'
      ],
      popular: true
    },
    {
      id: 'enterprise',
      name: 'Enterprise Plan',
      price: '$49.99',
      period: 'per month',
      features: [
        'Unlimited course generation',
        'Unlimited chapters per course',
        'Advanced AI content generation',
        '24/7 dedicated support',
        'Course analytics',
        'Export to multiple formats',
        'Team collaboration',
        'Custom integrations'
      ]
    }
  ];

  const handleUpgrade = async (plan) => {
    setLoading(true);
    setSelectedPlan(plan.id);
    
    try {
      // Create checkout session
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ planId: plan.id }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to create checkout session');
      }
      
      // In a real implementation, you would redirect to the payment gateway
      // For example, with Stripe:
      // window.location.href = data.sessionUrl;
      
      // For demo purposes, we'll redirect to the success page
      alert(`In a real implementation, this would redirect to a payment gateway. For demo purposes, we're proceeding to the success page.`);
      router.push(`/dashboard/upgrade/success?plan=${plan.id}&session_id=demo_session_${Date.now()}`);
    } catch (error) {
      console.error('Error creating checkout session:', error);
      alert(`Error: ${error.message}`);
    } finally {
      setLoading(false);
      setSelectedPlan(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">Upgrade Your Plan</h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Unlock advanced features and premium support to take your learning platform to the next level.
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Enhanced Features</h2>
          <p className="text-gray-600 mb-4">
            Upgrade to a paid plan to access advanced features like priority AI content generation, 
            detailed course analytics, and export options.
          </p>
          <div className="flex items-center">
            <svg className="w-5 h-5 text-yellow-500 mr-2" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd"></path>
            </svg>
            <span className="text-gray-600">Upgrade now to unlock premium features and support.</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {plans.map((plan) => (
            <div 
              key={plan.id}
              className={`bg-white rounded-xl shadow-lg p-6 border-2 ${
                plan.popular 
                  ? 'border-indigo-500 transform scale-105 relative' 
                  : 'border-gray-200'
              }`}
            >
              {plan.popular && (
                <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-indigo-500 text-white text-xs font-bold px-4 py-1 rounded-full">
                  MOST POPULAR
                </div>
              )}
              
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800 mb-2">{plan.name}</h2>
                <div className="mb-4">
                  <span className="text-3xl font-bold text-gray-800">{plan.price}</span>
                  <span className="text-gray-600"> {plan.period}</span>
                </div>
              </div>
              
              <ul className="mb-8 space-y-3">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-center">
                    <svg className="w-5 h-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                    <span className="text-gray-600">{feature}</span>
                  </li>
                ))}
              </ul>
              
              <Button
                onClick={() => handleUpgrade(plan)}
                disabled={loading && selectedPlan === plan.id}
                className={`w-full py-3 ${
                  plan.popular 
                    ? 'bg-indigo-600 hover:bg-indigo-700' 
                    : 'bg-gray-800 hover:bg-gray-900'
                } text-white rounded-lg transition-colors duration-300`}
              >
                {loading && selectedPlan === plan.id ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processing...
                  </span>
                ) : (
                  `Get ${plan.name}`
                )}
              </Button>
            </div>
          ))}
        </div>

        <div className="mt-12 bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Frequently Asked Questions</h2>
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold text-gray-800">What payment methods do you accept?</h3>
              <p className="text-gray-600">We accept all major credit cards including Visa, Mastercard, and American Express.</p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-800">Can I cancel my subscription anytime?</h3>
              <p className="text-gray-600">Yes, you can cancel your subscription at any time. You'll continue to have access until the end of your billing period.</p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-800">Do you offer refunds?</h3>
              <p className="text-gray-600">We offer a 30-day money-back guarantee for all new subscriptions.</p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-800">What are the benefits of upgrading?</h3>
              <p className="text-gray-600">Upgrading provides access to advanced features like priority AI generation, detailed analytics, export options, and premium support. All users can now create unlimited courses.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default UpgradePage;