'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { Button } from '@/components/ui/button';
import { useRouter, useSearchParams } from 'next/navigation';
import { useUser } from '@clerk/nextjs';

function UpgradeSuccessContent() {
  const router = useRouter();
  const { user } = useUser();
  const searchParams = useSearchParams();
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPaymentStatus = async () => {
      try {
        const sessionId = searchParams.get('session_id');
        const planId = searchParams.get('plan');

        if (!sessionId || !planId) {
          router.push('/dashboard/upgrade');
          return;
        }

        setPlan(planId);

        const response = await fetch(`/api/checkout?session_id=${sessionId}&plan=${planId}`);
        if (!response.ok) {
          throw new Error('Failed to verify payment');
        }

        const data = await response.json();
        if (data.success) {
          setPlan(data.plan);
        }
      } catch (error) {
        console.error('Error verifying payment:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPaymentStatus();
  }, [router, searchParams]);

  const getPlanName = (planId) => {
    switch (planId) {
      case 'basic': return 'Basic Plan';
      case 'pro': return 'Pro Plan';
      case 'enterprise': return 'Enterprise Plan';
      default: return 'Unknown Plan';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Verifying your payment...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-xl shadow-lg p-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
            </svg>
          </div>

          <h1 className="text-3xl font-bold text-gray-800 mb-4">Payment Successful!</h1>

          <p className="text-gray-600 mb-6">
            Thank you, <span className="font-semibold">{user?.fullName}</span>! Your payment has been processed successfully.
          </p>

          <div className="bg-indigo-50 rounded-lg p-6 mb-8">
            <h2 className="text-xl font-bold text-gray-800 mb-2">Plan Details</h2>
            <p className="text-2xl font-bold text-indigo-600 mb-4">{getPlanName(plan)}</p>
            <p className="text-gray-600">
              You now have access to all premium features including <strong>unlimited course generation</strong>.
              Your plan will renew automatically each month.
            </p>
          </div>

          <div className="bg-green-50 rounded-lg p-4 mb-8">
            <h3 className="font-bold text-green-800 mb-2">🎉 Unlimited Courses Unlocked!</h3>
            <p className="text-green-700">
              You can now create as many courses as you want without any limitations.
              Start creating your next course right away!
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              onClick={() => router.push('/dashboard')}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg"
            >
              Go to Dashboard
            </Button>
            <Button
              onClick={() => router.push('/create-course')}
              variant="outline"
              className="border-indigo-600 text-indigo-600 hover:bg-indigo-50 px-6 py-3 rounded-lg"
            >
              Create New Course
            </Button>
          </div>

          <p className="text-gray-500 text-sm mt-8">
            A confirmation email has been sent to {user?.primaryEmailAddress?.emailAddress}
          </p>
        </div>
      </div>
    </div>
  );
}

export default function UpgradeSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    }>
      <UpgradeSuccessContent />
    </Suspense>
  );
}
