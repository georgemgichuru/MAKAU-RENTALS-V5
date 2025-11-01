import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Check,
  Crown,
  Building2,
  Users,
  TrendingUp,
  Shield,
  Zap,
  Star,
  Phone,
  Mail,
  Clock,
  AlertCircle
} from 'lucide-react';
import { subscriptionAPI, propertiesAPI } from '../../services/api';

const SubscriptionPage = () => {
  const navigate = useNavigate();
  const [currentPlan, setCurrentPlan] = useState(null);
  const [subscriptionData, setSubscriptionData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [totalUnits, setTotalUnits] = useState(0);
  const [daysRemaining, setDaysRemaining] = useState(null);

  // unified features for monthly subscription tiers
  const commonFeatures = [
    'Free updates forever',
    'Advanced tenant management',
    'Automated payment tracking',
    'Payment tracking & reminders',
    'Comprehensive reports & analytics',
    'Detailed reports',
    'Email notifications',
    'Priority support',
    'Data export capabilities'
  ];

  const pricingTiers = [
    { 
      id: 'tier1',
      min: 1, 
      max: 10, 
      price: 2000,  // Updated to match backend
      label: '1-10 Units',
      billingPeriod: 'month',
      features: commonFeatures
    },
    { 
      id: 'tier2',
      min: 11, 
      max: 20, 
      price: 2500,  // Updated to match backend
      label: '11-20 Units',
      billingPeriod: 'month',
      features: commonFeatures
    },
    { 
      id: 'tier3',
      min: 21, 
      max: 50, 
      price: 4500,  // Updated to match backend
      label: '21-50 Units',
      billingPeriod: 'month',
      features: commonFeatures
    },
    { 
      id: 'tier4',
      min: 51, 
      max: 100, 
      price: 7500,  // Updated to match backend
      label: '51-100 Units',
      billingPeriod: 'month',
      features: commonFeatures
    },
    { 
      id: 'tier5',
      min: 101, 
      max: Infinity, 
      price: 'custom', 
      label: '100+ Units - Enterprise',
      billingPeriod: 'custom',
      enterprise: true,
      contactNumber: '+254722714334',
      features: [
        'Unlimited rental units',
        'White-label solution',
        'Custom features',
        'Dedicated account manager',
        'SLA guarantee',
        'On-premise deployment option',
        'Custom training',
        'Contact us for pricing at +254722714334'
      ]
    }
  ];

  const oneTimePlan = {
    id: 'onetime',
    name: 'Lifetime Access',
    price: 40000,
    maxUnits: 50,
    features: [
      'Up to 50 rental units',
      'Lifetime access',
      'All premium features included',
      'Free updates forever',
      'Advanced tenant management',
      'Automated payment tracking',
      'Comprehensive reports & analytics',
      'Email notifications',
      'Priority support',
      'Data export capabilities',
      'Payment tracking & reminders',
      'Detailed reports',
      'No recurring fees',
      'Custom branding',
      'Data export capabilities'
    ],
    badge: 'Recommended'
  };

  const handleSelectPlan = (planId) => {
    console.log('Selected plan:', planId);
    
    // Handle enterprise tier separately
    if (planId === 'tier5') {
      window.location.href = 'tel:+254722714334';
      return;
    }
    
    // Map frontend plan IDs to backend plan names
    const planMapping = {
      'tier1': 'starter',   // 1-10 units -> starter
      'tier2': 'basic',     // 11-20 units -> basic
      'tier3': 'basic',     // 21-50 units -> basic (higher tier)
      'tier4': 'professional', // 51-100 units -> professional
      'onetime': 'onetime'  // Keep as is
    };
    
    // Find the plan details
    let planDetails = null;
    
    if (planId === 'onetime') {
      planDetails = {
        id: planMapping[planId] || planId,
        backendPlan: 'onetime',
        name: oneTimePlan.name,
        description: 'One-time payment, lifetime access',
        price: oneTimePlan.price,
        billingPeriod: 'one-time',
        features: oneTimePlan.features
      };
    } else {
      const tier = pricingTiers.find(t => t.id === planId);
      if (tier) {
        planDetails = {
          id: tier.id,
          backendPlan: planMapping[planId] || planId,
          name: tier.label,
          description: `Monthly subscription for ${tier.label.toLowerCase()}`,
          price: tier.price,
          billingPeriod: 'per month',
          features: tier.features
        };
      }
    }
    
    if (planDetails) {
      console.log('Plan details with backend mapping:', planDetails);
      // Navigate to payment page with plan details
      navigate('/admin/subscription/payment', { 
        state: { planDetails } 
      });
    }
  };

  const handleContactSales = () => {
    window.location.href = 'mailto:makaorentalmanagementsystem@gmail.com?subject=Enterprise%20Plan%20Inquiry';
  };

  // Fetch subscription status and unit count on mount
  useEffect(() => {
    const fetchSubscriptionData = async () => {
      try {
        setLoading(true);
        
        // Fetch subscription status
        const subResponse = await subscriptionAPI.getStatus();
        setSubscriptionData(subResponse.data);
        
        // Map backend plan to frontend plan ID
        const backendPlan = subResponse.data.plan?.toLowerCase();
        if (backendPlan === 'onetime') {
          setCurrentPlan('onetime');
        } else if (backendPlan === 'free') {
          // Free trial - set as no current paid plan
          setCurrentPlan('free');
        } else {
          // Map monthly plans to tiers
          setCurrentPlan(backendPlan);
        }
        
        // Calculate days remaining for free trial
        if (backendPlan === 'free' && subResponse.data.expiry_date) {
          const expiryDate = new Date(subResponse.data.expiry_date);
          const today = new Date();
          const diffTime = expiryDate - today;
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          setDaysRemaining(diffDays > 0 ? diffDays : 0);
        }
        
        // Fetch total units to determine billing tier
        const unitsResponse = await propertiesAPI.getUnits();
        const units = unitsResponse.data || [];
        setTotalUnits(units.length);
        
      } catch (error) {
        console.error('Error fetching subscription data:', error);
        // Set default to free if error
        setCurrentPlan('free');
      } finally {
        setLoading(false);
      }
    };

    fetchSubscriptionData();
  }, []);

  // Calculate suggested plan based on unit count
  const getSuggestedPlan = () => {
    if (totalUnits <= 10) return pricingTiers[0];
    if (totalUnits <= 20) return pricingTiers[1];
    if (totalUnits <= 50) return pricingTiers[2];
    if (totalUnits <= 100) return pricingTiers[3];
    return pricingTiers[4]; // Enterprise
  };

  const suggestedPlan = getSuggestedPlan();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading subscription details...</p>
        </div>
      </div>
    );
  }


  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Header */}
        <div className="text-center mb-8 sm:mb-12">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3 sm:mb-4">Subscription Plans</h1>
          <p className="text-base sm:text-lg text-gray-600 px-4">Choose the plan that fits your property portfolio</p>
        </div>

        {/* Free Trial Banner */}
        {currentPlan === 'free' && daysRemaining !== null && (
          <div className="mb-6 sm:mb-8 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4 sm:p-6">
            <div className="flex items-start gap-3">
              <Clock className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Free Trial Active - {daysRemaining} Days Remaining
                </h3>
                <p className="text-gray-700 mb-3">
                  You're currently on a <strong>30-day free trial</strong>. 
                  {totalUnits > 0 && (
                    <> You have <strong>{totalUnits} unit{totalUnits !== 1 ? 's' : ''}</strong> created.</>
                  )}
                </p>
                {totalUnits > 0 && (
                  <div className="bg-white rounded-md p-3 border border-blue-100">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-gray-900 mb-1">
                          After your trial ends:
                        </p>
                        {suggestedPlan.price === 'custom' ? (
                          <div>
                            <p className="text-sm text-gray-700">
                              You'll need <strong>{suggestedPlan.label}</strong> based on your current {totalUnits} unit{totalUnits !== 1 ? 's' : ''}.
                            </p>
                            <p className="text-sm text-amber-700 mt-2 font-semibold">
                              📞 Please contact us at <a href="tel:+254722714334" className="underline">+254722714334</a> for custom enterprise pricing.
                            </p>
                          </div>
                        ) : (
                          <div>
                            <p className="text-sm text-gray-700">
                              You'll be automatically enrolled in the <strong>{suggestedPlan.label}</strong> plan 
                              at <strong>KES {suggestedPlan.price.toLocaleString()}/month</strong> based on your current {totalUnits} unit{totalUnits !== 1 ? 's' : ''}.
                            </p>
                            <p className="text-sm text-gray-600 mt-2">
                              You can add more properties during your trial. Your billing will be adjusted based on your total units when the trial ends.
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* One-Time Purchase - Professional Design */}
        <div className="mb-8 sm:mb-12">
          <div className={`bg-white rounded-lg sm:rounded-xl shadow-sm border-2 ${
            currentPlan === 'onetime' ? 'border-blue-600' : 'border-gray-200'
          } overflow-hidden`}>
            {/* Header Badge */}
            {currentPlan === 'onetime' && (
              <div className="bg-blue-600 text-white text-center py-2 px-4">
                <span className="text-sm font-medium">Current Plan</span>
              </div>
            )}
            
            <div className="p-6 sm:p-8">
              {/* Plan Header */}
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 sm:gap-6 mb-6 sm:mb-8">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Crown className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
                    <span className="bg-blue-50 text-blue-700 text-xs sm:text-sm font-medium px-3 py-1 rounded-full">
                      {oneTimePlan.badge}
                    </span>
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">{oneTimePlan.name}</h2>
                  <p className="text-sm sm:text-base text-gray-600">One-time payment, lifetime value</p>
                </div>
                <div className="text-left sm:text-right">
                  <div className="text-3xl sm:text-4xl font-bold text-gray-900 mb-1">
                    KSh {oneTimePlan.price.toLocaleString()}
                  </div>
                  <div className="text-xs sm:text-sm text-gray-500">Pay once, use forever</div>
                </div>
              </div>

              {/* Key Metrics */}
              <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-6 sm:mb-8">
                <div className="bg-gray-50 rounded-lg p-4">
                  <Building2 className="w-5 h-5 text-gray-600 mb-2" />
                  <div className="text-xs text-gray-500 mb-1">Maximum Units</div>
                  <div className="text-xl sm:text-2xl font-bold text-gray-900">{oneTimePlan.maxUnits}</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <TrendingUp className="w-5 h-5 text-green-600 mb-2" />
                  <div className="text-xs text-gray-500 mb-1">Annual Savings</div>
                  <div className="text-xl sm:text-2xl font-bold text-gray-900">KSh 54K+</div>
                </div>
              </div>

              {/* Features Grid */}
              <div className="mb-6 sm:mb-8">
                <h3 className="text-sm font-semibold text-gray-900 mb-4">What's included</h3>
                <div className="grid sm:grid-cols-2 gap-3">
                  {oneTimePlan.features.map((feature, index) => (
                    <div key={index} className="flex items-start gap-2">
                      <Check className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-gray-700">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* CTA Button */}
              {currentPlan !== 'onetime' && (
                <button
                  onClick={() => handleSelectPlan('onetime')}
                  className="w-full bg-blue-600 text-white py-3 sm:py-4 rounded-lg font-semibold text-sm sm:text-base hover:bg-blue-700 transition-colors"
                >
                  Upgrade to Lifetime Access
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Monthly Plans */}
        <div className="mb-8 sm:mb-12">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6 px-4 sm:px-0">Monthly Subscriptions</h2>
          <div className="grid gap-4 sm:gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {pricingTiers.slice(0, 4).map((tier) => (
              <div
                key={tier.id}
                className={`bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow ${
                  tier.popular ? 'border-blue-500' : 'border-gray-200'
                }`}
              >
                <div className="p-5 sm:p-6">
                  {tier.popular && (
                    <div className="bg-blue-50 text-blue-700 text-xs font-medium px-3 py-1 rounded-full inline-block mb-4">
                      Popular
                    </div>
                  )}
                  
                  <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-3">{tier.label}</h3>
                  <div className="mb-5">
                    {tier.price === 'custom' ? (
                      <>
                        <span className="text-2xl sm:text-3xl font-bold text-amber-600">
                          Custom Pricing
                        </span>
                        <p className="text-xs sm:text-sm text-gray-600 mt-2">
                          Call {tier.contactNumber} for quote
                        </p>
                      </>
                    ) : (
                      <>
                        <span className="text-2xl sm:text-3xl font-bold text-gray-900">
                          KSh {tier.price.toLocaleString()}
                        </span>
                        <span className="text-sm text-gray-500 ml-1">/{tier.billingPeriod}</span>
                      </>
                    )}
                  </div>

                  <div className="space-y-2.5 mb-6">
                    {tier.features.map((feature, index) => (
                      <div key={index} className="flex items-start gap-2">
                        <Check className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                        <span className="text-xs sm:text-sm text-gray-600">{feature}</span>
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={() => handleSelectPlan(tier.id)}
                    className={`w-full py-2.5 sm:py-3 rounded-lg font-medium text-sm transition-colors ${
                      tier.popular
                        ? 'bg-blue-600 text-white hover:bg-blue-700'
                        : tier.enterprise
                        ? 'bg-amber-600 text-white hover:bg-amber-700'
                        : 'bg-gray-50 text-gray-900 hover:bg-gray-100 border border-gray-300'
                    }`}
                  >
                    {tier.enterprise ? 'Contact Us' : 'Select Plan'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Enterprise Plan */}
        <div className="bg-gray-900 rounded-lg sm:rounded-xl shadow-sm overflow-hidden mb-8 sm:mb-12">
          <div className="p-6 sm:p-8">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-3 sm:mb-4">
                  <Star className="w-6 h-6 sm:w-7 sm:h-7 text-yellow-400" />
                  <h3 className="text-2xl sm:text-3xl font-bold text-white">Enterprise</h3>
                </div>
                <p className="text-sm sm:text-base text-gray-300 mb-5">
                  Custom solutions for organizations managing 100+ units
                </p>
                <div className="grid sm:grid-cols-2 gap-2.5 sm:gap-3">
                  {pricingTiers[4].features.slice(0, 4).map((feature, index) => (
                    <div key={index} className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
                      <span className="text-xs sm:text-sm text-gray-300">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex-shrink-0">
                <button
                  onClick={handleContactSales}
                  className="w-full sm:w-auto bg-white text-gray-900 px-6 sm:px-8 py-3 sm:py-4 rounded-lg font-semibold text-sm sm:text-base hover:bg-gray-100 transition-colors"
                >
                  Contact Sales
                </button>
                <p className="text-xs sm:text-sm text-gray-400 mt-2 text-center sm:text-left">Custom pricing</p>
              </div>
            </div>
          </div>
        </div>

        {/* Support Section */}
        <div className="bg-white rounded-lg sm:rounded-xl shadow-sm border border-gray-200 p-6 sm:p-8 text-center">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3">Need Help Choosing?</h2>
          <p className="text-sm sm:text-base text-gray-600 mb-6 max-w-2xl mx-auto">
            Our team is here to help you find the perfect plan for your property management needs
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6">
            <a 
              href="mailto:support@makao.com" 
              className="flex items-center gap-2 text-sm sm:text-base text-gray-700 hover:text-blue-600 transition-colors"
            >
              <Mail className="w-5 h-5" />
              <span>makaorentalsmanagementsystem@gmail.com</span>
            </a>
            <a 
              href="tel:+254722714334" 
              className="flex items-center gap-2 text-sm sm:text-base text-gray-700 hover:text-blue-600 transition-colors"
            >
              <Phone className="w-5 h-5" />
              <span>+254 722 714 334</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionPage;