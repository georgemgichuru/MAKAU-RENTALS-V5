import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTenantToast } from '../../context/TenantToastContext';
import { useAuth } from '../../context/AuthContext';
import { Send, AlertTriangle, Home, Wifi, Droplets, Zap, Shield, Volume2, Wrench } from 'lucide-react';

// API service functions
const reportAPI = {
  createReport: async (reportData) => {
    const response = await fetch('/api/reports/create/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('access_token')}`
      },
      body: JSON.stringify(reportData)
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Failed to create report');
    }
    
    return response.json();
  }
};

const authAPI = {
  getCurrentUser: async () => {
    const response = await fetch('/api/auth/me/', {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('access_token')}`
      }
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch user data');
    }
    
    return response.json();
  }
};

const TenantReportIssue = () => {
  const navigate = useNavigate();
  const { showToast } = useTenantToast();
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    issue_category: '',
    priority_level: '',
    issue_title: '',
    description: '',
    unit: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentTenant, setCurrentTenant] = useState(null);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(true);

  // Load tenant data on component mount
  useEffect(() => {
    const loadTenantData = async () => {
      if (user?.id) {
        try {
          setLoading(true);
          const tenantData = await authAPI.getCurrentUser();
          const userUnit = tenantData.unit || {};
          
          setCurrentTenant({
            id: tenantData.id,
            name: tenantData.full_name || `${tenantData.first_name} ${tenantData.last_name}`,
            email: tenantData.email,
            room: userUnit.unit_number || 'N/A',
            phone: tenantData.phone_number,
            status: tenantData.is_active ? 'active' : 'inactive',
            unitId: userUnit.id
          });

          // Set unit ID in form data
          if (userUnit.id) {
            setFormData(prev => ({ ...prev, unit: userUnit.id }));
          }
        } catch (error) {
          console.error('Error loading tenant data:', error);
          showToast('Failed to load tenant data', 'error');
        } finally {
          setLoading(false);
        }
      }
    };

    loadTenantData();
  }, [user, showToast]);

  // Form validation
  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.issue_category) {
      newErrors.issue_category = "Issue category is required";
    }
    
    if (!formData.priority_level) {
      newErrors.priority_level = "Priority level is required";
    }
    
    if (!formData.issue_title?.trim()) {
      newErrors.issue_title = "Issue title is required";
    } else if (formData.issue_title.length < 5) {
      newErrors.issue_title = "Issue title must be at least 5 characters";
    }
    
    if (!formData.description?.trim()) {
      newErrors.description = "Description is required";
    } else if (formData.description.length < 10) {
      newErrors.description = "Please provide a more detailed description (at least 10 characters)";
    }
    
    if (!formData.unit) {
      newErrors.unit = "Unit information is missing";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      showToast('Please fix the form errors before submitting.', 'error');
      return;
    }

    setIsSubmitting(true);
    setErrors({});

    try {
      // Prepare report payload for API - matching backend Report model
      const payload = {
        unit: formData.unit, // Unit ID from tenant's assigned unit
        issue_category: formData.issue_category,
        priority_level: formData.priority_level,
        issue_title: formData.issue_title,
        description: formData.description
        // tenant field is automatically set by backend from authenticated user
      };

      // Submit report to backend API
      const response = await reportAPI.createReport(payload);

      console.log('Report submitted successfully:', response);

      // Show success toast
      showToast('Report submitted successfully! The landlord has been notified.', 'success');

      // Reset form
      setFormData(prev => ({
        ...prev,
        issue_category: '',
        priority_level: '',
        issue_title: '',
        description: ''
      }));

      // Navigate back to dashboard after 2 seconds
      setTimeout(() => {
        navigate('/tenant');
      }, 2000);

    } catch (error) {
      console.error('Error submitting report:', error);
      
      // Handle specific error cases
      if (error.message.includes('unit is not assigned')) {
        showToast('You are not assigned to any unit. Please contact the landlord.', 'error');
      } else if (error.message.includes('permission')) {
        showToast('You do not have permission to submit reports for this unit.', 'error');
      } else {
        showToast(error.message || 'Error submitting report. Please try again.', 'error');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }));
    }
  };

  // Category options with icons
  const categoryOptions = [
    { value: 'electrical', label: 'Electrical', icon: Zap, description: 'Power outages, wiring issues, sockets' },
    { value: 'plumbing', label: 'Plumbing', icon: Droplets, description: 'Leaks, clogged drains, water pressure' },
    { value: 'noise', label: 'Noise', icon: Volume2, description: 'Loud neighbors, construction noise' },
    { value: 'safety/violence', label: 'Safety/Violence', icon: Shield, description: 'Security concerns, emergencies' },
    { value: 'wifi', label: 'WiFi', icon: Wifi, description: 'Internet connectivity, network issues' },
    { value: 'maintenance', label: 'Maintenance', icon: Wrench, description: 'General repairs, cleaning, upkeep' }
  ];

  // Priority options with colors
  const priorityOptions = [
    { value: 'low', label: 'Low', color: 'text-green-600 bg-green-100', description: 'Minor issue, not urgent' },
    { value: 'medium', label: 'Medium', color: 'text-yellow-600 bg-yellow-100', description: 'Should be addressed soon' },
    { value: 'high', label: 'High', color: 'text-orange-600 bg-orange-100', description: 'Needs attention within 24 hours' },
    { value: 'urgent', label: 'Urgent', color: 'text-red-600 bg-red-100', description: 'Emergency - requires immediate attention' }
  ];

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
          <h2 className="text-lg font-medium text-gray-900">Loading report form...</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="flex items-center justify-center mb-4">
          <div className="p-3 bg-red-100 rounded-full">
            <AlertTriangle className="w-8 h-8 text-red-600" />
          </div>
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Report an Issue</h1>
        <p className="text-gray-600 text-lg">Submit a maintenance request or report a problem with your unit</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Form */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Issue Details</h2>
              <p className="text-gray-600 mt-1">Please provide detailed information about the issue you're experiencing</p>
            </div>

            {/* Tenant Information */}
            <div className="p-6 bg-blue-50 border-b border-blue-100">
              <div className="flex items-center mb-3">
                <Home className="w-5 h-5 text-blue-600 mr-2" />
                <h3 className="font-medium text-blue-900">Your Information</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <span className="text-sm font-medium text-blue-700">Tenant Name:</span>
                  <p className="text-blue-900 font-semibold">{currentTenant?.name || 'Not available'}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-blue-700">Unit Number:</span>
                  <p className="text-blue-900 font-semibold">{currentTenant?.room || 'Not assigned'}</p>
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* Issue Category */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Issue Category *
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {categoryOptions.map((category) => {
                    const Icon = category.icon;
                    return (
                      <button
                        key={category.value}
                        type="button"
                        onClick={() => handleInputChange('issue_category', category.value)}
                        className={`p-4 border-2 rounded-lg text-left transition-all ${
                          formData.issue_category === category.value
                            ? 'border-red-500 bg-red-50 ring-2 ring-red-200'
                            : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex items-start space-x-3">
                          <Icon className={`w-5 h-5 mt-0.5 ${
                            formData.issue_category === category.value ? 'text-red-600' : 'text-gray-500'
                          }`} />
                          <div className="flex-1">
                            <div className="font-medium text-gray-900">{category.label}</div>
                            <div className="text-sm text-gray-500 mt-1">{category.description}</div>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
                {errors.issue_category && (
                  <p className="mt-2 text-sm text-red-600">{errors.issue_category}</p>
                )}
              </div>

              {/* Priority Level */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Priority Level *
                </label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {priorityOptions.map((priority) => (
                    <button
                      key={priority.value}
                      type="button"
                      onClick={() => handleInputChange('priority_level', priority.value)}
                      className={`p-3 border-2 rounded-lg text-center transition-all ${
                        formData.priority_level === priority.value
                          ? 'border-red-500 bg-red-50 ring-2 ring-red-200'
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <div className={`text-xs font-semibold px-2 py-1 rounded-full ${priority.color}`}>
                        {priority.label}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">{priority.description}</div>
                    </button>
                  ))}
                </div>
                {errors.priority_level && (
                  <p className="mt-2 text-sm text-red-600">{errors.priority_level}</p>
                )}
              </div>

              {/* Issue Title */}
              <div>
                <label htmlFor="issue_title" className="block text-sm font-medium text-gray-700 mb-2">
                  Issue Title *
                </label>
                <input
                  id="issue_title"
                  type="text"
                  value={formData.issue_title}
                  onChange={(e) => handleInputChange('issue_title', e.target.value)}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 ${
                    errors.issue_title ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="Brief, descriptive title of the issue"
                  maxLength={255}
                />
                {errors.issue_title && (
                  <p className="mt-2 text-sm text-red-600">{errors.issue_title}</p>
                )}
              </div>

              {/* Description */}
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                  Detailed Description *
                </label>
                <textarea
                  id="description"
                  rows={6}
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 ${
                    errors.description ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="Please provide as much detail as possible:
• When did the issue start?
• What have you tried so far?
• How is it affecting your daily routine?
• Any specific locations or times when it occurs?"
                />
                {errors.description && (
                  <p className="mt-2 text-sm text-red-600">{errors.description}</p>
                )}
                <p className="mt-2 text-sm text-gray-500">
                  The more details you provide, the faster we can help resolve your issue.
                </p>
              </div>

              {/* Submit Buttons */}
              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => navigate('/tenant')}
                  className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center justify-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5 mr-2" />
                      Submit Report
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Sidebar - Help Information */}
        <div className="space-y-6">
          {/* Emergency Notice */}
          <div className="bg-red-50 border border-red-200 rounded-xl p-4">
            <div className="flex items-start space-x-3">
              <Shield className="w-5 h-5 text-red-600 mt-0.5" />
              <div>
                <h3 className="font-semibold text-red-900 text-sm">Emergency Situations</h3>
                <p className="text-red-700 text-sm mt-1">
                  For immediate safety threats, fire, or medical emergencies, call emergency services first.
                </p>
              </div>
            </div>
          </div>

          {/* What Happens Next */}
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
            <h3 className="font-semibold text-gray-900 text-sm mb-3">What Happens Next?</h3>
            <div className="space-y-3">
              <div className="flex items-start space-x-2">
                <div className="w-5 h-5 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-red-600 text-xs font-bold">1</span>
                </div>
                <p className="text-gray-700 text-sm">You'll receive a confirmation email</p>
              </div>
              <div className="flex items-start space-x-2">
                <div className="w-5 h-5 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-red-600 text-xs font-bold">2</span>
                </div>
                <p className="text-gray-700 text-sm">Landlord reviews and prioritizes your report</p>
              </div>
              <div className="flex items-start space-x-2">
                <div className="w-5 h-5 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-red-600 text-xs font-bold">3</span>
                </div>
                <p className="text-gray-700 text-sm">You'll receive updates on the resolution progress</p>
              </div>
            </div>
          </div>

          {/* Response Times */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <h3 className="font-semibold text-blue-900 text-sm mb-3">Expected Response Times</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-blue-700">Urgent:</span>
                <span className="text-blue-900 font-medium">Within 2 hours</span>
              </div>
              <div className="flex justify-between">
                <span className="text-blue-700">High:</span>
                <span className="text-blue-900 font-medium">Within 24 hours</span>
              </div>
              <div className="flex justify-between">
                <span className="text-blue-700">Medium:</span>
                <span className="text-blue-900 font-medium">2-3 business days</span>
              </div>
              <div className="flex justify-between">
                <span className="text-blue-700">Low:</span>
                <span className="text-blue-900 font-medium">5-7 business days</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TenantReportIssue;