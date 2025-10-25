import React, { useState } from 'react';
import { 
  MessageSquare,
  AlertCircle,
  Check,
  Info,
  Smartphone,
  Globe,
  Shield,
  Zap
} from 'lucide-react';

const SMSPurchasePage = () => {
  const [selectedPackage, setSelectedPackage] = useState(null);

  // SMS Packages based on Kenya market research
  const smsPackages = [
    {
      id: 'starter',
      name: 'Starter Pack',
      sms: 100,
      price: 500,
      pricePerSMS: 5.0,
      popular: false
    },
    {
      id: 'basic',
      name: 'Basic Pack',
      sms: 500,
      price: 2250,
      pricePerSMS: 4.5,
      popular: false
    },
    {
      id: 'standard',
      name: 'Standard Pack',
      sms: 1000,
      price: 4000,
      pricePerSMS: 4.0,
      popular: true,
      savings: '20% off'
    },
    {
      id: 'pro',
      name: 'Professional Pack',
      sms: 2500,
      price: 8750,
      pricePerSMS: 3.5,
      popular: false,
      savings: '30% off'
    },
    {
      id: 'business',
      name: 'Business Pack',
      sms: 5000,
      price: 15000,
      pricePerSMS: 3.0,
      popular: false,
      savings: '40% off'
    },
    {
      id: 'enterprise',
      name: 'Enterprise Pack',
      sms: 10000,
      price: 25000,
      pricePerSMS: 2.5,
      popular: false,
      savings: '50% off'
    }
  ];

  // Kenya SMS Provider Information
  const providers = [
    {
      name: 'Africa\'s Talking',
      costPerSMS: 'KSh 0.80 - KSh 5.00',
      features: ['Bulk SMS', 'Delivery reports', 'API access', 'Shortcodes available']
    },
    {
      name: 'Safaricom Bulk SMS',
      costPerSMS: 'KSh 1.00 - KSh 4.00',
      features: ['Direct operator', 'High delivery rates', 'Sender ID customization', 'Analytics']
    },
    {
      name: 'Twilio (Kenya)',
      costPerSMS: 'KSh 3.50 - KSh 6.00',
      features: ['Global reach', 'Programmable SMS', 'Two-way messaging', 'Enterprise support']
    }
  ];

  const handlePurchase = (pkg) => {
    setSelectedPackage(pkg);
    alert(`SMS Purchase feature coming soon!\n\nSelected: ${pkg.name}\nSMS Credits: ${pkg.sms}\nPrice: KSh ${pkg.price.toLocaleString()}`);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <MessageSquare className="w-12 h-12 text-purple-600" />
            <h1 className="text-4xl font-bold text-gray-900">SMS Credits</h1>
          </div>
          <p className="text-xl text-gray-600">Keep your tenants informed with instant SMS notifications</p>
        </div>

        {/* Feature Coming Soon Banner */}
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-6 mb-8 rounded-lg">
          <div className="flex items-start">
            <AlertCircle className="w-6 h-6 text-yellow-600 mr-3 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-lg font-semibold text-yellow-900 mb-2">SMS Feature Coming Soon</h3>
              <p className="text-yellow-800 mb-3">
                We're currently integrating SMS notification services into Makao Center. This feature will be available in the next update.
                Below is the pricing information for when the feature launches.
              </p>
              <p className="text-sm text-yellow-700">
                <strong>Expected Launch:</strong> Q1 2026 
              </p>
            </div>
          </div>
        </div>

        {/* SMS Benefits */}
        <div className="grid md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white p-6 rounded-lg shadow text-center">
            <Zap className="w-8 h-8 text-blue-600 mx-auto mb-3" />
            <h3 className="font-semibold text-gray-900 mb-1">Instant Delivery</h3>
            <p className="text-sm text-gray-600">Messages delivered within seconds</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow text-center">
            <Smartphone className="w-8 h-8 text-green-600 mx-auto mb-3" />
            <h3 className="font-semibold text-gray-900 mb-1">98% Open Rate</h3>
            <p className="text-sm text-gray-600">SMS has highest engagement rate compared to email or whatsapp messages</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow text-center">
            <Globe className="w-8 h-8 text-purple-600 mx-auto mb-3" />
            <h3 className="font-semibold text-gray-900 mb-1">All Networks</h3>
            <p className="text-sm text-gray-600">Safaricom, Airtel, Telkom support</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow text-center">
            <Shield className="w-8 h-8 text-orange-600 mx-auto mb-3" />
            <h3 className="font-semibold text-gray-900 mb-1">Reliable</h3>
            <p className="text-sm text-gray-600">99.9% delivery success rate</p>
          </div>
        </div>

        {/* SMS Packages */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">Choose Your SMS Package</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {smsPackages.map((pkg) => (
              <div
                key={pkg.id}
                className={`bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow relative ${
                  pkg.popular ? 'ring-2 ring-purple-500' : ''
                }`}
              >
                {pkg.popular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <span className="bg-purple-500 text-white text-xs font-bold px-4 py-1 rounded-full">
                      Most Popular
                    </span>
                  </div>
                )}
                
                {pkg.savings && (
                  <div className="absolute top-4 right-4">
                    <span className="bg-green-100 text-green-800 text-xs font-bold px-2 py-1 rounded">
                      {pkg.savings}
                    </span>
                  </div>
                )}

                <div className="text-center mb-4">
                  <MessageSquare className="w-12 h-12 text-purple-600 mx-auto mb-3" />
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{pkg.name}</h3>
                  <div className="mb-2">
                    <span className="text-4xl font-bold text-gray-900">KSh {pkg.price.toLocaleString()}</span>
                  </div>
                  <p className="text-gray-600 text-sm mb-1">{pkg.sms.toLocaleString()} SMS Credits</p>
                  <p className="text-gray-500 text-xs">KSh {pkg.pricePerSMS} per SMS</p>
                </div>

                <div className="space-y-2 mb-6">
                  <div className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-gray-700">Valid for 12 months</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-gray-700">All Kenyan networks</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-gray-700">Delivery reports included</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-gray-700">Custom sender ID</span>
                  </div>
                </div>

                <button
                  onClick={() => handlePurchase(pkg)}
                  disabled
                  className={`w-full py-3 rounded-lg font-semibold transition-colors ${
                    pkg.popular
                      ? 'bg-purple-600 text-white hover:bg-purple-700'
                      : 'bg-gray-600 text-white hover:bg-gray-700'
                  } opacity-50 cursor-not-allowed`}
                >
                  Coming Soon
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Provider Information */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
          <div className="flex items-center gap-3 mb-6">
            <Info className="w-6 h-6 text-blue-600" />
            <h2 className="text-2xl font-bold text-gray-900">SMS Provider Information</h2>
          </div>
          
          <p className="text-gray-600 mb-6">
            Makao Center will integrate with leading SMS providers in Kenya to ensure reliable message delivery.
            Our pricing is based on current market rates from top providers:
          </p>

          <div className="grid md:grid-cols-3 gap-6 mb-6">
            {providers.map((provider, index) => (
              <div key={index} className="border rounded-lg p-4">
                <h3 className="font-bold text-gray-900 mb-2">{provider.name}</h3>
                <p className="text-purple-600 font-semibold mb-3">{provider.costPerSMS}</p>
                <ul className="space-y-1">
                  {provider.features.map((feature, idx) => (
                    <li key={idx} className="text-sm text-gray-600 flex items-start gap-2">
                      <Check className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-semibold text-blue-900 mb-2">Implementation Details</h4>
            <ul className="space-y-2 text-sm text-blue-800">
              <li className="flex items-start gap-2">
                <Check className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                <span><strong>Integration Cost:</strong> KSh 8500-15000 one-time setup fee(depending on provider)</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                <span><strong>Monthly Minimum:</strong> Most providers require KSh 500 - 5,000 minimum monthly to spend on sms</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                <span><strong>Bulk Discount:</strong> Prices decrease significantly with volume (up to 50% off for 10,000+ SMS/month)</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                <span><strong>Delivery Rate:</strong> Up to 99% successful delivery for all major Kenyan networks</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Use Cases */}
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl shadow-lg p-8 text-white mb-8">
          <h2 className="text-2xl font-bold mb-6">SMS Notification Use Cases</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <MessageSquare className="w-5 h-5" />
                Automated Notifications
              </h3>
              <ul className="space-y-2 text-purple-100">
                <li>• Rent payment reminders</li>
                <li>• Payment confirmation receipts</li>
                <li>• Overdue payment alerts</li>
                <li>• Lease renewal reminders</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <MessageSquare className="w-5 h-5" />
                Property Updates
              </h3>
              <ul className="space-y-2 text-purple-100">
                <li>• Maintenance schedules</li>
                <li>• Emergency notifications</li>
                <li>• General announcements</li>
                <li>• Welcome messages for new tenants</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Early Access CTA */}
        <div className="bg-white rounded-xl shadow-lg p-8 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Get Access</h2>
          
          <button
            onClick={() => alert('Thank you for your interest! We\'ll notify you when SMS features are available.')}
            className="bg-purple-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-purple-700 transition-colors"
          >
            Register Interest
          </button>
          <p className="text-sm text-gray-500 mt-4">
            Questions? Contact us at sms-support@makao.com
          </p>
        </div>
      </div>
    </div>
  );
};

export default SMSPurchasePage;