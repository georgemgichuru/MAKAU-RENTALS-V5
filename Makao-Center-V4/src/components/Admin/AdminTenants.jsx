import React, { useState, useEffect } from 'react';
import { useAppContext } from '../../context/AppContext';
import { useToast } from '../../context/ToastContext';
import EmailFormModal from './EmailFormModal';
import AssignUnitModal from './AssignUnitModal';
import { 
  Users, 
  AlertTriangle, 
  X, 
  Plus, 
  Search, 
  Eye,
  Edit,
  Trash2,
  Mail,
  Phone,
  DollarSign,
  Clock,
  CheckCircle,
  AlertCircle,
  Download,
  FileText,
  FileImage,
  Archive,
  Timer,
  ExternalLink,
  Home,
  Calendar,
  UserCheck,
  Ban
} from 'lucide-react';

const AdminTenants = () => {
  const { 
    tenants, 
    tenantsLoading,
    pendingApplications,
    units,
    refreshData
  } = useAppContext();
  
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState('active');
  const [searchTerm, setSearchTerm] = useState('');
  const [documentPreview, setDocumentPreview] = useState(null);
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [isAssignUnitModalOpen, setIsAssignUnitModalOpen] = useState(false);
  const [selectedTenant, setSelectedTenant] = useState(null);
  const [rejectingTenant, setRejectingTenant] = useState(null);

  const [removingTenant, setRemovingTenant] = useState(null); // Add this line

  // Debug logging
  useEffect(() => {
    console.log('🔍 AdminTenants Debug:', {
      tenantsCount: tenants?.length,
      tenants: tenants,
      pendingApplicationsCount: pendingApplications?.length,
      unitsCount: units?.length,
      activeTab,
      searchTerm
    });
  }, [tenants, pendingApplications, units, activeTab, searchTerm]);

  // FIXED: Enhanced filtering with better fallbacks
  const filteredTenants = (tenants || []).filter(tenant => {
    if (!tenant) return false;
    
    const matchesSearch = searchTerm === '' || 
      (tenant.full_name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (tenant.name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (tenant.email?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (tenant.phone_number || '').includes(searchTerm) ||
      (tenant.unit?.unit_number?.toLowerCase() || '').includes(searchTerm.toLowerCase());

    if (activeTab === 'active') {
      return matchesSearch && tenant.unit; // Has a unit assigned
    } else if (activeTab === 'all') {
      return matchesSearch;
    }
    return matchesSearch;
  });

  // FIXED: Enhanced pending applications filtering
  const filteredApplications = (pendingApplications || []).filter(app => {
    if (!app) return false;
    
    return searchTerm === '' || 
      (app.full_name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (app.name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (app.email?.toLowerCase() || '').includes(searchTerm.toLowerCase());
  });

  // FIXED: Enhanced statistics calculation
  const stats = {
    activeTenants: (tenants || []).filter(t => t?.unit).length,
    totalTenants: (tenants || []).length,
    pendingApplications: (pendingApplications || []).length,
    overdueRent: (tenants || []).filter(t => 
      t?.unit && parseFloat(t.unit.rent_remaining || 0) > 0
    ).length
  };

  // Function to handle the tenant signup link
  const handleTenantSignup = () => {
    const signupUrl = `${window.location.origin}/signup?user_type=tenant`;
    window.open(signupUrl, '_blank');
  };

  // Function to copy the signup link to clipboard
  const copySignupLink = async () => {
    const signupUrl = `${window.location.origin}/signup?user_type=tenant`;
    try {
      await navigator.clipboard.writeText(signupUrl);
      showToast('Signup link copied to clipboard!', 'success');
    } catch (err) {
      console.error('Failed to copy: ', err);
      showToast('Failed to copy link', 'error');
    }
  };

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0,
    }).format(amount || 0);
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('en-KE', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      });
    } catch (error) {
      return 'Invalid Date';
    }
  };

  // Get rent status
  const getRentStatus = (unit) => {
    if (!unit) return { status: 'unknown', color: 'gray', text: 'No unit' };
    
    const rentRemaining = parseFloat(unit.rent_remaining || 0);
    const rent = parseFloat(unit.rent || 0);
    
    if (rentRemaining === 0) {
      return { status: 'paid', color: 'green', text: 'Paid' };
    } else if (rentRemaining === rent) {
      return { status: 'due', color: 'yellow', text: 'Due' };
    } else if (rentRemaining > 0) {
      return { status: 'overdue', color: 'red', text: 'Overdue' };
    } else {
      return { status: 'unknown', color: 'gray', text: 'Unknown' };
    }
  };

  // Enhanced handle assign unit function
  const handleAssignUnit = (tenant) => {
    setSelectedTenant(tenant);
    setIsAssignUnitModalOpen(true);
  };

  // Handle remove tenant from unit
// Handle remove tenant from unit
const handleRemoveTenant = async (tenantId) => {
  setRemovingTenant(tenantId); // Add this line
  if (!tenantId) {
    showToast('Invalid tenant ID', 'error');
    return;
  }

  // Find the tenant to get their name for the confirmation message
  const tenant = tenants.find(t => t.id === tenantId);
  if (!tenant) {
    showToast('Tenant not found', 'error');
    return;
  }

  const tenantName = tenant.full_name || tenant.name || 'this tenant';
  
  if (!confirm(`Are you sure you want to remove ${tenantName} from their unit? This will make the unit available for new tenants.`)) {
    return;
  }

  try {
    showToast(`Removing ${tenantName} from unit...`, 'info');

    // Find the unit assigned to this tenant
    const assignedUnit = units.find(unit => 
      unit.tenant && unit.tenant.id === tenantId
    );

    if (!assignedUnit) {
      showToast('No unit assigned to this tenant', 'error');
      return;
    }

    // Call API to remove tenant from unit
    const response = await fetch(`http://127.0.0.1:8000/api/accounts/units/${assignedUnit.id}/remove-tenant/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
      },
      body: JSON.stringify({
        tenant_id: tenantId
      }),
    });

    if (response.ok) {
      showToast(`${tenantName} has been successfully removed from the unit`, 'success');
      
      // Refresh the data to reflect the changes
      await refreshData();
    } else {
      const errorData = await response.json();
      throw new Error(errorData.error || errorData.detail || 'Failed to remove tenant from unit');
    }
  } catch (error) {
    console.error('Error removing tenant:', error);
    
    // If the API endpoint doesn't exist, try alternative approach
    if (error.message.includes('Failed to fetch') || error.message.includes('404')) {
      await handleRemoveTenantFallback(tenantId, tenantName);
    } else {
      showToast(error.message || 'Failed to remove tenant from unit', 'error');
    }
  }finally {
    setRemovingTenant(null); // Add this line
  }
};

// Fallback method if the main API endpoint doesn't work
const handleRemoveTenantFallback = async (tenantId, tenantName) => {
  try {
    showToast('Trying alternative method to remove tenant...', 'info');

    // Alternative 1: Update the unit to remove tenant assignment
    const assignedUnit = units.find(unit => 
      unit.tenant && unit.tenant.id === tenantId
    );

    if (assignedUnit) {
      // Update unit to remove tenant
      const updateResponse = await fetch(`http://127.0.0.1:8000/api/accounts/units/${assignedUnit.id}/`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
        },
        body: JSON.stringify({
          tenant: null,
          is_available: true
        }),
      });

      if (updateResponse.ok) {
        showToast(`${tenantName} has been removed from the unit`, 'success');
        await refreshData();
        return;
      }
    }

    // Alternative 2: Use the update unit endpoint with PUT
    if (assignedUnit) {
      const putResponse = await fetch(`http://127.0.0.1:8000/api/accounts/units/${assignedUnit.id}/`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
        },
        body: JSON.stringify({
          ...assignedUnit,
          tenant: null,
          is_available: true
        }),
      });

      if (putResponse.ok) {
        showToast(`${tenantName} has been removed from the unit`, 'success');
        await refreshData();
        return;
      }
    }

    throw new Error('All removal methods failed');

  } catch (fallbackError) {
    console.error('Fallback removal failed:', fallbackError);
    showToast('Unable to remove tenant. Please check if the unit assignment API is working.', 'error');
  }
};

  // Handle reject tenant application
  const handleRejectTenant = async (tenant) => {
    if (!tenant || !tenant.id) {
      showToast('Invalid tenant data', 'error');
      return;
    }

    if (!confirm(`Are you sure you want to reject ${tenant.full_name}'s application? This action cannot be undone.`)) {
      return;
    }

    setRejectingTenant(tenant.id);
    
    try {
      // Call API to reject/delete the tenant application
      const response = await fetch(`http://127.0.0.1:8000/api/accounts/users/${tenant.id}/delete/`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
        },
      });

      if (response.ok) {
        showToast(`Application for ${tenant.full_name} has been rejected`, 'success');
        await refreshData();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to reject application');
      }
    } catch (error) {
      console.error('Error rejecting tenant:', error);
      showToast(error.message || 'Failed to reject application', 'error');
    } finally {
      setRejectingTenant(null);
    }
  };

  // Handle assign unit success
  const handleAssignSuccess = () => {
    showToast('Tenant successfully assigned to unit!', 'success');
    refreshData();
  };

  // FIXED: Enhanced loading state
  if (tenantsLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-gray-200 p-4 rounded-lg animate-pulse">
              <div className="h-6 bg-gray-300 rounded mb-2"></div>
              <div className="h-4 bg-gray-300 rounded"></div>
            </div>
          ))}
        </div>
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-white p-6 rounded-lg shadow animate-pulse">
            <div className="h-6 bg-gray-200 rounded mb-4"></div>
            <div className="h-4 bg-gray-200 rounded mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Tenant Management</h1>
          <p className="text-gray-600 mt-1">Manage current tenants and applications</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
          <button
            onClick={() => setIsEmailModalOpen(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center justify-center transition-colors"
          >
            <Mail className="w-5 h-5 mr-2" />
            Send Email
          </button>
          {/* Dropdown for tenant signup options */}
          <div className="relative group">
            <button className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center justify-center transition-colors w-full sm:w-auto">
              <Plus className="w-5 h-5 mr-2" />
              Add New Tenant
            </button>
            
            {/* Dropdown menu */}
            <div className="absolute right-0 mt-2 w-56 bg-white border border-gray-200 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10">
              <div className="py-2">
                <button
                  onClick={handleTenantSignup}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center transition-colors"
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Open Signup Form
                </button>
                <button
                  onClick={copySignupLink}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center transition-colors"
                >
                  <Mail className="w-4 h-4 mr-2" />
                  Copy Signup Link
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-600 text-sm font-medium">Active Tenants</p>
              <p className="text-2xl font-bold text-blue-900">{stats.activeTenants}</p>
            </div>
            <Users className="w-8 h-8 text-blue-600" />
          </div>
        </div>
        
        <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-yellow-600 text-sm font-medium">Pending Applications</p>
              <p className="text-2xl font-bold text-yellow-900">{stats.pendingApplications}</p>
            </div>
            <Clock className="w-8 h-8 text-yellow-600" />
          </div>
        </div>
        
        <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-red-600 text-sm font-medium">Overdue Rent</p>
              <p className="text-2xl font-bold text-red-900">{stats.overdueRent}</p>
            </div>
            <AlertTriangle className="w-8 h-8 text-red-600" />
          </div>
        </div>

        <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-600 text-sm font-medium">Total Tenants</p>
              <p className="text-2xl font-bold text-green-900">{stats.totalTenants}</p>
            </div>
            <UserCheck className="w-8 h-8 text-green-600" />
          </div>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search tenants by name, email, phone, or unit number..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('active')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'active'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Active Tenants ({stats.activeTenants})
          </button>
          <button
            onClick={() => setActiveTab('applications')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'applications'
                ? 'border-yellow-500 text-yellow-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Pending Applications ({stats.pendingApplications})
          </button>
          <button
            onClick={() => setActiveTab('all')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'all'
                ? 'border-gray-500 text-gray-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            All Tenants ({stats.totalTenants})
          </button>
        </nav>
      </div>

      {/* Active Tenants Tab */}
      {activeTab === 'active' && (
        <div className="bg-white rounded-lg shadow border border-gray-200">
          <div className="p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <Users className="mr-2 text-blue-600" />
              Active Tenants
            </h3>
            
            {filteredTenants.length === 0 ? (
              <div className="text-center py-12">
                <Users className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Active Tenants</h3>
                <p className="text-gray-500">
                  {searchTerm ? 'No tenants match your search criteria' : 'No tenants are currently assigned to units'}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b bg-gray-50">
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Tenant</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Unit</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Contact</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Rent Status</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Move-in Date</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTenants.map(tenant => {
                      const rentStatus = getRentStatus(tenant.unit);
                      
                      return (
                        <tr key={tenant.id} className="border-b hover:bg-gray-50 transition-colors">
                          <td className="py-3 px-4">
                            <div>
                              <p className="font-medium text-gray-900">{tenant.full_name || tenant.name}</p>
                              <p className="text-sm text-gray-600">{tenant.email}</p>
                              <p className="text-xs text-gray-500">ID: {tenant.id}</p>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            {tenant.unit ? (
                              <div>
                                <p className="font-medium text-gray-900">{tenant.unit.unit_number}</p>
                                <p className="text-sm text-gray-600">
                                  {formatCurrency(tenant.unit.rent)}/month
                                </p>
                              </div>
                            ) : (
                              <span className="text-gray-400 text-sm">No unit assigned</span>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            <div className="space-y-1">
                              <p className="flex items-center text-sm text-gray-600">
                                <Phone className="w-4 h-4 mr-1" /> 
                                {tenant.phone_number || 'N/A'}
                              </p>
                              {tenant.emergency_contact && (
                                <p className="text-xs text-gray-500">
                                  Emergency: {tenant.emergency_contact}
                                </p>
                              )}
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <div>
                              <p className="font-medium text-gray-900">
                                {tenant.unit ? formatCurrency(tenant.unit.rent_remaining) : 'N/A'}
                              </p>
                              <span className={`px-2 py-1 text-xs rounded-full ${
                                rentStatus.color === 'green' ? 'bg-green-100 text-green-800' :
                                rentStatus.color === 'yellow' ? 'bg-yellow-100 text-yellow-800' :
                                rentStatus.color === 'red' ? 'bg-red-100 text-red-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {rentStatus.text}
                              </span>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-sm text-gray-600">
                            {tenant.unit?.assigned_date ? formatDate(tenant.unit.assigned_date) : 'N/A'}
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex space-x-2">
                              <button 
                                className="text-blue-600 hover:text-blue-800 p-1 rounded transition-colors"
                                title="View Details"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              <button 
                                className="text-green-600 hover:text-green-800 p-1 rounded transition-colors"
                                title="Send Email"
                                onClick={() => setIsEmailModalOpen(true)}
                              >
                                <Mail className="w-4 h-4" />
                              </button>
                              <button 
                                className="text-red-600 hover:text-red-800 p-1 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                title="Remove from Unit"
                                onClick={() => handleRemoveTenant(tenant.id)}
                                disabled={rejectingTenant === tenant.id}
                              >
                                {rejectingTenant === tenant.id ? (
                                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600"></div>
                                ) : (
                                  <Trash2 className="w-4 h-4" />
                                )}
                                </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Pending Applications Tab */}
      {activeTab === 'applications' && (
        <div className="bg-white rounded-lg shadow border border-gray-200">
          <div className="p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <Clock className="mr-2 text-yellow-600" />
              Pending Applications
              {filteredApplications.length > 0 && (
                <span className="ml-2 bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full">
                  {filteredApplications.length} new
                </span>
              )}
            </h3>
            
            {filteredApplications.length === 0 ? (
              <div className="text-center py-12">
                <Clock className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Pending Applications</h3>
                <p className="text-gray-500 mb-4">
                  {searchTerm ? 'No applications match your search' : 'New tenant applications will appear here'}
                </p>
                <button
                  onClick={copySignupLink}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center mx-auto transition-colors"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Share Signup Link
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredApplications.map(application => (
                  <div key={application.id} className="border border-yellow-200 rounded-lg p-6 hover:bg-yellow-50 transition-colors">
                    <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4 mb-4">
                      <div className="flex-1">
                        <h4 className="text-lg font-semibold text-gray-900">{application.full_name || application.name}</h4>
                        <div className="flex flex-wrap items-center gap-2 mt-2 text-sm text-gray-600">
                          <span className="flex items-center">
                            <Mail className="w-4 h-4 mr-1" />
                            {application.email}
                          </span>
                          <span className="flex items-center">
                            <Phone className="w-4 h-4 mr-1" />
                            {application.phone_number || 'N/A'}
                          </span>
                          <span className="flex items-center">
                            <Calendar className="w-4 h-4 mr-1" />
                            Applied: {formatDate(application.date_joined)}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="px-3 py-1 bg-yellow-100 text-yellow-800 text-sm rounded-full font-medium">
                          Awaiting Assignment
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <h5 className="font-medium text-gray-900 mb-2">Contact Information</h5>
                        <div className="space-y-1">
                          <p><strong>Email:</strong> {application.email}</p>
                          <p><strong>Phone:</strong> {application.phone_number || 'Not provided'}</p>
                          {application.emergency_contact && (
                            <p><strong>Emergency Contact:</strong> {application.emergency_contact}</p>
                          )}
                          {application.government_id && (
                            <p><strong>Government ID:</strong> {application.government_id}</p>
                          )}
                        </div>
                      </div>
                      <div>
                        <h5 className="font-medium text-gray-900 mb-2">Preferences</h5>
                        <div className="space-y-1">
                          <p><strong>Reminder Mode:</strong> {application.reminder_mode || 'Not set'}</p>
                          <p><strong>Reminder Value:</strong> {application.reminder_value || 'Not set'}</p>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pt-4 mt-4 border-t border-yellow-200">
                      <div className="flex space-x-3">
                        <button
                          onClick={() => showToast('Document viewing coming soon', 'info')}
                          className="flex items-center text-blue-600 hover:text-blue-800 px-3 py-2 border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors"
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          View Documents
                        </button>
                        <button
                          onClick={() => showToast('Download functionality coming soon', 'info')}
                          className="flex items-center text-green-600 hover:text-green-800 px-3 py-2 border border-green-200 rounded-lg hover:bg-green-50 transition-colors"
                        >
                          <Download className="w-4 h-4 mr-1" />
                          Download All
                        </button>
                      </div>
                      
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleAssignUnit(application)}
                          className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center transition-colors"
                        >
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Assign Unit
                        </button>
                        <button
                          onClick={() => handleRejectTenant(application)}
                          disabled={rejectingTenant === application.id}
                          className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 flex items-center transition-colors disabled:opacity-50"
                        >
                          {rejectingTenant === application.id ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-1"></div>
                              Rejecting...
                            </>
                          ) : (
                            <>
                              <Ban className="w-4 h-4 mr-1" />
                              Reject
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* All Tenants Tab */}
      {activeTab === 'all' && (
        <div className="bg-white rounded-lg shadow border border-gray-200">
          <div className="p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <Users className="mr-2 text-gray-600" />
              All Tenants ({filteredTenants.length})
            </h3>
            
            {filteredTenants.length === 0 ? (
              <div className="text-center py-12">
                <Users className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Tenants Found</h3>
                <p className="text-gray-500">
                  {searchTerm ? 'No tenants match your search criteria' : 'No tenants in the system'}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b bg-gray-50">
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Tenant</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Unit</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Contact</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Rent Status</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Status</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTenants.map(tenant => {
                      const rentStatus = getRentStatus(tenant.unit);
                      const isActive = tenant.unit;
                      
                      return (
                        <tr key={tenant.id} className="border-b hover:bg-gray-50 transition-colors">
                          <td className="py-3 px-4">
                            <div>
                              <p className="font-medium text-gray-900">{tenant.full_name || tenant.name}</p>
                              <p className="text-sm text-gray-600">{tenant.email}</p>
                              <p className="text-xs text-gray-500">ID: {tenant.id}</p>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            {tenant.unit ? (
                              <div>
                                <p className="font-medium text-gray-900">{tenant.unit.unit_number}</p>
                                <p className="text-sm text-gray-600">
                                  {formatCurrency(tenant.unit.rent)}/month
                                </p>
                              </div>
                            ) : (
                              <span className="text-gray-400 text-sm">No unit assigned</span>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            <div className="space-y-1">
                              <p className="flex items-center text-sm text-gray-600">
                                <Phone className="w-4 h-4 mr-1" /> 
                                {tenant.phone_number || 'N/A'}
                              </p>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <div>
                              <p className="font-medium text-gray-900">
                                {tenant.unit ? formatCurrency(tenant.unit.rent_remaining) : 'N/A'}
                              </p>
                              <span className={`px-2 py-1 text-xs rounded-full ${
                                rentStatus.color === 'green' ? 'bg-green-100 text-green-800' :
                                rentStatus.color === 'yellow' ? 'bg-yellow-100 text-yellow-800' :
                                rentStatus.color === 'red' ? 'bg-red-100 text-red-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {rentStatus.text}
                              </span>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <span className={`px-2 py-1 text-xs rounded-full ${
                              isActive 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                              {isActive ? 'Active' : 'No Unit'}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex space-x-2">
                              <button 
                                className="text-blue-600 hover:text-blue-800 p-1 rounded transition-colors"
                                title="View Details"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              <button 
                                className="text-green-600 hover:text-green-800 p-1 rounded transition-colors"
                                title="Send Email"
                                onClick={() => setIsEmailModalOpen(true)}
                              >
                                <Mail className="w-4 h-4" />
                              </button>
                              {!isActive && (
                                <button 
                                  className="text-green-600 hover:text-green-800 p-1 rounded transition-colors"
                                  title="Assign Unit"
                                  onClick={() => handleAssignUnit(tenant)}
                                >
                                  <CheckCircle className="w-4 h-4" />
                                </button>
                              )}
                              {isActive && (
                                <button 
                                  className="text-red-600 hover:text-red-800 p-1 rounded transition-colors"
                                  title="Remove from Unit"
                                  onClick={() => handleRemoveTenant(tenant.id)}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modals */}
      <EmailFormModal 
        isOpen={isEmailModalOpen}
        onClose={() => setIsEmailModalOpen(false)}
        tenants={tenants}
      />
      
      {/* Add Assign Unit Modal */}
      <AssignUnitModal
        isOpen={isAssignUnitModalOpen}
        onClose={() => {
          setIsAssignUnitModalOpen(false);
          setSelectedTenant(null);
        }}
        tenant={selectedTenant}
        onAssignSuccess={handleAssignSuccess}
      />
    </div>
  );
};

export default AdminTenants;