import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import EmailFormModal from './Modals/EmailFormModal';
import WhatsAppFormModal from './Modals/WhatsAppFormModal';
import InvoiceModal from './Modals/InvoiceModal';
import CustomMessageModal from './Modals/CustomMessageModal';
import ShiftTenantModal from './Modals/ShiftTenantModal';
import { 
  Users, 
  User,
  X, 
  Eye,
  AlertTriangle,
  Trash2,
  Phone,
  CheckCircle,
  AlertCircle,
  Download,
  FileText,
  FileImage,
  Archive,
  Timer,
  FileDown,
  MessageSquare,
  Receipt,
  ArrowRightLeft,
  Mail,
  Plus,
  ExternalLink,
  Search,
  Clock,
  Bed,
  Key,
  DollarSign
} from 'lucide-react';
import { AppContext } from '../../context/AppContext';

const AdminTenants = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('active');
  const [searchTerm, setSearchTerm] = useState('');
  const [documentPreview, setDocumentPreview] = useState(null);
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [isWhatsAppModalOpen, setIsWhatsAppModalOpen] = useState(false);
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [isCustomMessageModalOpen, setIsCustomMessageModalOpen] = useState(false);
  const [isShiftTenantModalOpen, setIsShiftTenantModalOpen] = useState(false);
  const [selectedTenant, setSelectedTenant] = useState(null);
  const [dropdownOpen, setDropdownOpen] = useState(null);

  // safe defaults from context to avoid undefined errors
  const {
    mockTenants = [],
    mockPendingApplications = [],
    mockEvictedTenants = [],
    propertyUnits = [],
    transactions = []
  } = useContext(AppContext);

  // Log to debug data structure
  console.log('🔍 mockTenants data:', mockTenants);
  console.log('🔍 First tenant sample:', mockTenants[0]);
  console.log('🔍 Transactions:', transactions);
  console.log('🔍 Transactions count:', transactions?.length || 0);
  
  // Log deposit and rent type transactions for debugging
  const depositTransactions = (transactions || []).filter(t => t.type === 'deposit');
  const rentTransactions = (transactions || []).filter(t => t.type === 'rent');
  console.log('💰 Deposit transactions:', depositTransactions.length);
  console.log('🏠 Rent transactions:', rentTransactions.length);
  console.log('📊 Pending rent transactions:', rentTransactions.filter(t => t.status === 'pending' || t.status === 'Pending').length);
  
  // Helper function to check if tenant has paid deposit
  const hasDepositPaid = (tenant) => {
    // First check if API provides deposit_paid field
    if (typeof tenant.deposit_paid === 'boolean') {
      console.log(`💰 Deposit status from API for ${tenant.full_name || tenant.name}:`, tenant.deposit_paid);
      return tenant.deposit_paid;
    }
    
    // Otherwise check from transactions
    const depositPayments = (transactions || []).filter(t => 
      String(t.tenantId) === String(tenant.id) && 
      t.type === 'deposit' && 
      (t.status === 'completed' || t.status === 'Success')
    );
    console.log(`💰 Deposit from transactions for tenant ${tenant.id}:`, depositPayments.length > 0);
    return depositPayments.length > 0;
  };
  
  // Helper function to determine rent status based on transactions (like dashboard)
  const getRentStatus = (tenant) => {
    // First check if API provides rent_status field
    if (tenant.rent_status && tenant.rent_status !== 'no_unit') {
      console.log(`🏠 Rent status from API for ${tenant.full_name || tenant.name}:`, tenant.rent_status);
      return tenant.rent_status;
    }
    
    // Check from current_unit data
    const unit = tenant.current_unit || tenant.unit_data || tenant.unit;
    if (unit) {
      if (unit.rent_remaining === 0) {
        return 'paid';
      } else if (unit.rent_remaining === unit.rent) {
        return 'due';
      } else if (unit.rent_remaining > 0 && unit.rent_remaining < unit.rent) {
        return 'overdue';  // Partial payment = overdue
      }
    }
    
    // Fallback: check pending rent transactions (like dashboard does)
    const pendingRent = (transactions || []).filter(t => 
      String(t.tenantId) === String(tenant.id) && 
      t.type === 'rent' && 
      (t.status === 'pending' || t.status === 'Pending')
    );
    
    if (pendingRent.length > 0) {
      return 'overdue';  // Has pending rent payments = overdue
    }
    
    // Check if has completed rent payments
    const completedRent = (transactions || []).filter(t => 
      String(t.tenantId) === String(tenant.id) && 
      t.type === 'rent' && 
      (t.status === 'completed' || t.status === 'Success')
    );
    
    return completedRent.length > 0 ? 'paid' : 'due';
  };
  
  // Transform API data to component format
  const transformedTenants = (mockTenants || []).map(tenant => {
    // Check for unit data in different possible fields
    const unit = tenant.current_unit || tenant.unit_data || tenant.unit;
    const hasUnit = Boolean(unit);
    const depositPaid = hasDepositPaid(tenant);
    const rentStatus = getRentStatus(tenant);
    
    console.log(`🏠 Tenant: ${tenant.full_name || tenant.name}`);
    console.log(`   - Has unit: ${hasUnit}`);
    console.log(`   - Deposit paid: ${depositPaid} (from API: ${tenant.deposit_paid})`);
    console.log(`   - Rent status: ${rentStatus} (from API: ${tenant.rent_status})`);
    console.log(`   - Unit data:`, unit);
    
    return {
      id: tenant.id,
      name: tenant.full_name || tenant.name || 'Unknown Tenant',
      email: tenant.email || 'no-email@example.com',
      phone: tenant.phone_number || tenant.phone || 'N/A',
      room: unit?.unit_number || unit?.number || 'N/A',
      rentAmount: unit?.rent || unit?.rent_amount || 0,
      bookingId: tenant.id,
      joinDate: tenant.created_at || tenant.date_joined || '2024-01-01',
      // Tenant is active only if they have paid deposit
      status: depositPaid ? 'active' : 'inactive',
      // Determine rent status from payments or unit data
      rentStatus: rentStatus,
      isEstimated: tenant.isEstimated || false,
      // Keep all original data
      ...tenant
    };
  });
  
  console.log('✅ Transformed tenants:', transformedTenants.length);
  console.log('✅ Active tenants:', transformedTenants.filter(t => t.status === 'active').length);
  console.log('✅ Tenants with overdue/due rent:', transformedTenants.filter(t => t.rentStatus === 'overdue' || t.rentStatus === 'due').length);

  // Toggle dropdown for specific tenant
  const toggleDropdown = (tenantId) => {
    setDropdownOpen(dropdownOpen === tenantId ? null : tenantId);
  };

  // Handle viewing tenant transactions
  const handleViewTransactions = (tenant) => {
    navigate(`/admin/tenants/${tenant.id}/transactions`);
  };

  // Handle add invoice
  const handleAddInvoice = (tenant) => {
    setSelectedTenant(tenant);
    setIsInvoiceModalOpen(true);
    setDropdownOpen(null);
  };

  // Handle send custom message
  const handleSendCustomMessage = (tenant) => {
    setSelectedTenant(tenant);
    setIsCustomMessageModalOpen(true);
    setDropdownOpen(null);
  };

  // Handle download tenant statement (CSV) - now uses context transactions
  const handleDownloadStatement = (tenant) => {
    console.log('📥 DOWNLOAD CLICKED for tenant:', tenant);
    console.log('📊 All transactions available:', transactions);
    console.log('🆔 Looking for tenant ID:', tenant.id);
    console.log('🔍 Sample transaction to see structure:', transactions[0]);
    
    // Check all possible tenant ID fields in transactions
    const tenantTxns = (transactions || []).filter(t => {
      // Log each transaction's tenant-related fields to debug
      console.log('🔍 Checking transaction:', {
        id: t.id,
        tenantId: t.tenantId,
        tenant_id: t.tenant_id,
        tenant: t.tenant,
        tenant_obj: t.tenant_obj,
        'tenant?.id': t.tenant?.id,
        unit: t.unit,
        unit_id: t.unit_id
      });
      
      const matches = String(t.tenantId) === String(tenant.id) || 
                     String(t.tenant_id) === String(tenant.id) ||
                     String(t.tenant) === String(tenant.id) ||
                     String(t.tenant?.id) === String(tenant.id);
      if (matches) {
        console.log('✅ Transaction matched:', t);
      }
      return matches;
    });
    
    console.log('💳 Tenant transactions found:', tenantTxns.length);
    console.log('💳 Filtered transactions:', tenantTxns);
    
    if (tenantTxns.length === 0) {
      console.warn('⚠️ No transactions found for this tenant');
      alert(`No transactions found for ${tenant.name}. Transaction data may not be available yet.`);
      setDropdownOpen(null);
      return;
    }
    
    console.log('📝 Creating CSV content...');
    const headers = ['Date', 'Description', 'Amount (KSh)', 'Type', 'Reference', 'Method', 'Status'];
    const csvRows = [
      headers.join(','),
      ...tenantTxns.map(t => {
        const date = t.date || t.created_at || t.timestamp || new Date().toISOString().split('T')[0];
        const description = (t.description || t.desc || 'Payment').replace(/"/g, '""');
        const amount = t.amount || 0;
        const type = t.type || t.transaction_type || 'Payment';
        const reference = (t.reference || t.transaction_id || t.ref || 'N/A').replace(/"/g, '""');
        const method = (t.paymentMethod || t.payment_method || t.method || 'M-Pesa').replace(/"/g, '""');
        const status = t.status || 'Completed';
        
        return `${date},"${description}",${amount},${type},"${reference}","${method}",${status}`;
      })
    ];
    
    const csvContent = csvRows.join('\n');
    console.log('📄 CSV Content generated (first 500 chars):', csvContent.substring(0, 500));
    
    try {
      console.log('🔧 Creating blob...');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      console.log('🔧 Blob created, size:', blob.size);
      
      const url = window.URL.createObjectURL(blob);
      console.log('🔧 Blob URL created:', url);
      
      const fileName = `${tenant.name.replace(/\s+/g, '_')}_statement_${new Date().toISOString().split('T')[0]}.csv`;
      console.log('🔧 File name:', fileName);
      
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', fileName);
      link.style.display = 'none';
      
      console.log('🔧 Appending link to body...');
      document.body.appendChild(link);
      
      console.log('🔧 Triggering download...');
      link.click();
      
      console.log('✅ Download initiated successfully');
      
      // Clean up after a delay
      setTimeout(() => {
        console.log('🧹 Cleaning up...');
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        setDropdownOpen(null);
      }, 100);
      
      alert(`Statement with ${tenantTxns.length} transaction(s) is downloading for ${tenant.name}`);
    } catch (error) {
      console.error('❌ Download failed with error:', error);
      console.error('❌ Error stack:', error.stack);
      alert(`Failed to download statement: ${error.message}`);
      setDropdownOpen(null);
    }
  };

  // Handle shift tenant
  const handleShiftTenant = (tenant) => {
    setSelectedTenant(tenant);
    setIsShiftTenantModalOpen(true);
    setDropdownOpen(null);
  };

  // Handle delete tenant
  const handleDeleteTenant = (tenant) => {
    if (window.confirm(`Are you sure you want to delete ${tenant.name}? This action cannot be undone.`)) {
      console.log('Deleting tenant:', tenant.id);
      alert(`Tenant ${tenant.name} has been deleted.`);
      setDropdownOpen(null);
    }
  };

  // Function to handle the tenant signup link
  const handleTenantSignup = () => {
    const signupUrl = `${window.location.origin}/tenant/signup`;
    window.open(signupUrl, '_blank');
  };

  // Function to copy the signup link to clipboard
  const copySignupLink = async () => {
    const signupUrl = `${window.location.origin}/tenant/signup`;
    try {
      await navigator.clipboard.writeText(signupUrl);
      alert('Signup link copied to clipboard!');
    } catch (err) {
      console.error('Failed to copy: ', err);
    }
  };

  const handleViewDocuments = (documents, applicantName) => {
    setDocumentPreview({ documents, applicantName });
  };

  const handleDownloadDocument = (document, applicantName) => {
    console.log('Downloading document:', document.name, 'for', applicantName);
    alert(`Downloading ${document.name} for ${applicantName}`);
  };

  const handlePreviewDocument = (document) => {
    if (document.type === 'application/pdf') {
      const newWindow = window.open('', '_blank');
      newWindow.document.write(`
        <html>
          <head><title>${document.name}</title></head>
          <body style="margin:0; display:flex; justify-content:center; align-items:center; min-height:100vh; background:#f5f5f5;">
            <div style="text-align:center; padding:40px;">
              <h2>PDF Preview: ${document.name}</h2>
              <p>File Size: ${formatFileSize(document.size)}</p>
              <p style="color:#666;">In a real application, the PDF content would be displayed here.</p>
              <button onclick="window.close()" style="margin-top:20px; padding:10px 20px; background:#007bff; color:white; border:none; border-radius:4px; cursor:pointer;">Close</button>
            </div>
          </body>
        </html>
      `);
    } else if (document.type?.startsWith('image/')) {
      const newWindow = window.open('', '_blank');
      newWindow.document.write(`
        <html>
          <head><title>${document.name}</title></head>
          <body style="margin:0; display:flex; justify-content:center; align-items:center; min-height:100vh; background:#000;">
            <div style="text-align:center;">
              <h3 style="color:white; margin-bottom:20px;">${document.name}</h3>
              <div style="color:#ccc; margin-bottom:20px;">Image Preview - File Size: ${formatFileSize(document.size)}</div>
              <div style="color:#999;">In a real application, the image would be displayed here.</div>
              <button onclick="window.close()" style="margin-top:20px; padding:10px 20px; background:#007bff; color:white; border:none; border-radius:4px; cursor:pointer;">Close</button>
            </div>
          </body>
        </html>
      `);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (fileType) => {
    if (fileType === 'application/pdf') {
      return <FileText className="w-5 h-5 text-red-500" />;
    }
    if (fileType?.startsWith('image/')) {
      return <FileImage className="w-5 h-5 text-blue-500" />;
    }
    return <FileText className="w-5 h-5 text-gray-500" />;
  };

  // Document Preview Modal
  const DocumentPreviewModal = () => {
    if (!documentPreview) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
          <div className="flex justify-between items-center p-6 border-b">
            <h3 className="text-lg font-semibold">
              Documents for {documentPreview.applicantName}
            </h3>
            <button
              onClick={() => setDocumentPreview(null)}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
          
          <div className="p-6 max-h-[70vh] overflow-y-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {(documentPreview.documents || []).map((doc, index) => (
                <div key={index} className="border rounded-lg p-4 hover:bg-gray-50">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      {getFileIcon(doc.type)}
                      <div>
                        <p className="font-medium text-sm">{doc.name}</p>
                        <p className="text-xs text-gray-500">
                          {formatFileSize(doc.size)} • {doc.uploadedAt ? formatDate(doc.uploadedAt) : 'Recently uploaded'}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handlePreviewDocument(doc)}
                      className="flex-1 flex items-center justify-center px-3 py-2 text-sm bg-blue-50 text-blue-600 rounded hover:bg-blue-100"
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      Preview
                    </button>
                    <button
                      onClick={() => handleDownloadDocument(doc, documentPreview.applicantName)}
                      className="flex-1 flex items-center justify-center px-3 py-2 text-sm bg-green-50 text-green-600 rounded hover:bg-green-100"
                    >
                      <Download className="w-4 h-4 mr-1" />
                      Download
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <div className="flex justify-end space-x-3 p-6 border-t bg-gray-50">
            <button
              onClick={() => setDocumentPreview(null)}
              className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Close
            </button>
            <button
              onClick={() => {
                alert('Downloading all documents as ZIP file...');
              }}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 flex items-center"
            >
              <Download className="w-4 h-4 mr-1" />
              Download All
            </button>
          </div>
        </div>
      </div>
    );
  };

  const invoiceTemplate = (tenant) => 
  `Dear ${tenant.name},\n\nThis is a rent reminder for Room ${tenant.room}.\nYour rent amount is KSh ${Number(tenant.rentAmount || 0).toLocaleString()}.\nPlease make payment by the due date to avoid penalties.\n\nThank you,\nMakao Center Admin`;

  const predefinedMessages = [
    tenant => `Dear ${tenant.name}, your rent for Room ${tenant.room} is due. Please pay KSh ${Number(tenant.rentAmount || 0).toLocaleString()} as soon as possible.`,
    tenant => `Reminder: Rent for Room ${tenant.room} is overdue. Kindly clear your balance to avoid eviction.`,
    tenant => `Makao Center wishes you a great month! Remember, your rent for Room ${tenant.room} is KSh ${Number(tenant.rentAmount || 0).toLocaleString()}.`
  ];

  // Tenant Actions Dropdown Component
  const TenantActionsDropdown = ({ tenant, isOpen, onToggle }) => {
    return (
      <div className="relative">
        <button
          onClick={() => onToggle(tenant.id)}
          className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50"
        >
          Actions ▼
        </button>
        {isOpen && (
          <div className="absolute right-0 mt-2 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
            <div className="py-2">
              <button
                onClick={() => {
                  setSelectedTenant(tenant);
                  setDropdownOpen(null);
                  navigate(`/admin/tenants/${tenant.id}/details`);
                }}
                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
              >
                <User className="w-4 h-4 mr-2" />
                View Tenant Details
              </button>

              <button
                onClick={() => {
                  setSelectedTenant(tenant);
                  setDropdownOpen(null);
                  navigate(`/admin/tenants/${tenant.id}/transactions`);
                }}
                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
              >
                <Eye className="w-4 h-4 mr-2" />
                View Tenant Transactions
              </button>

              <button
                onClick={() => {
                  setSelectedTenant(tenant);
                  setDropdownOpen(null);
                  // Open Email modal with invoice template
                  setIsEmailModalOpen(true);
                }}
                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
              >
                <Receipt className="w-4 h-4 mr-2" />
                Add Invoice (via Email)
              </button>

              <button
                onClick={() => {
                  setSelectedTenant(tenant);
                  setDropdownOpen(null);
                  // Open Email modal for custom message
                  setIsEmailModalOpen(true);
                }}
                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
              >
                <MessageSquare className="w-4 h-4 mr-2" />
                Send Custom Message (via Email)
              </button>

              <button
                onClick={() => {
                  handleDownloadStatement(tenant);
                }}
                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
              >
                <FileDown className="w-4 h-4 mr-2" />
                Download Tenant Statement
              </button>

              <button
                onClick={() => {
                  setSelectedTenant(tenant);
                  setDropdownOpen(null);
                  // Open Email modal to notify tenant about shift
                  setIsEmailModalOpen(true);
                }}
                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
              >
                <ArrowRightLeft className="w-4 h-4 mr-2" />
                Shift Tenant (via Email)
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center flex-col text-center gap-7 sm:flex-row sm:gap-1">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Tenant Management</h1>
          <p className="text-gray-600">Manage current tenants and view recent applications</p>
        </div>
        <div className="flex gap-3 flex-col sm:flex-row">
          <button
            onClick={() => setIsEmailModalOpen(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center"
          >
            <Mail className="w-5 h-5 mr-2" />
            Send Email
          </button>
      
          <button
            onClick={() => alert('WhatsApp messaging is coming soon.')}
            className="bg-green-400 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center"
            title="This feature is coming soon"
          >
            <MessageSquare className="w-5 h-5 mr-2" />
            WhatsApp (Coming Soon)
          </button>
   
          <div className="relative group">
            <div className="absolute right-0 mt-2 w-56 bg-white border border-gray-200 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10">
              <div className="py-2">
                <button
                  onClick={handleTenantSignup}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Open Signup Form
                </button>
                <button
                  onClick={copySignupLink}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
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
        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-600 text-sm font-medium">Active Tenants</p>
              <p className="text-2xl font-bold text-blue-900">{transformedTenants.filter(t => t.status === 'active').length}</p>
            </div>
            <Users className="w-8 h-8 text-blue-600" />
          </div>
        </div>
        
        <div className="bg-red-50 p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-red-600 text-sm font-medium">Rent Overdue</p>
              <p className="text-2xl font-bold text-red-900">{transformedTenants.filter(t => t.rentStatus === 'overdue').length}</p>
            </div>
            <AlertTriangle className="w-8 h-8 text-red-600" />
          </div>
        </div>
        
        <div className="bg-yellow-50 p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-yellow-600 text-sm font-medium">Rent Due Soon</p>
              <p className="text-2xl font-bold text-yellow-900">{transformedTenants.filter(t => t.rentStatus === 'due').length}</p>
            </div>
            <Clock className="w-8 h-8 text-yellow-600" />
          </div>
        </div>
        
        <div className="bg-green-50 p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-600 text-sm font-medium">Rent Paid</p>
              <p className="text-2xl font-bold text-green-900">{transformedTenants.filter(t => t.rentStatus === 'paid').length}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="flex items-center space-x-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search tenants or applications..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
          />
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
            Active Tenants ({transformedTenants.filter(t => t.status === 'active').length})
          </button>
          <button
            onClick={() => setActiveTab('recent')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'recent'
                ? 'border-yellow-500 text-yellow-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Recently Joined Tenants ({(mockPendingApplications || []).length})
          </button>
          <button
            onClick={() => setActiveTab('all')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'all'
                ? 'border-gray-500 text-gray-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            All Tenants ({transformedTenants.length})
          </button>
        </nav>
      </div>

      {/* Active Tenants Tab */}
      {activeTab === 'active' && (
        <div className="bg-white rounded-lg shadow">
          <div className="p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <Users className="mr-2 text-blue-600" />
              Active Tenants
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b"><th className="text-left py-3 px-4">Tenant</th><th className="text-left py-3 px-4">Room</th><th className="text-left py-3 px-4">Contact</th><th className="text-left py-3 px-4">Rent Status</th><th className="text-left py-3 px-4">Actions</th></tr>
                </thead>
                <tbody>
                  {transformedTenants.filter(t => t.status === 'active').map(tenant => (
                    <tr key={tenant.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <div>
                          <p className="font-medium">{tenant.name}</p>
                          <p className="text-sm text-gray-600">{tenant.email}</p>
                          <p className="text-sm text-gray-600">ID: {tenant.bookingId}</p>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div>
                          <p className="font-medium">{tenant.room}</p>
                          <p className="text-sm text-gray-600">Since {new Date(tenant.joinDate || '2024-01-01').toLocaleDateString()}</p>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div>
                          <p className="flex items-center text-sm">
                            <Phone className="w-4 h-4 mr-1" /> {tenant.phone || '-'}
                          </p>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div>
                          <p className="font-medium">KSh {Number(tenant.rentAmount || 0).toLocaleString()}</p>
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            tenant.rentStatus === 'paid' ? 'bg-green-100 text-green-800' :
                            tenant.rentStatus === 'due' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {tenant.rentStatus === 'paid' ? 'Paid' : 
                             tenant.rentStatus === 'due' ? 'Due' : 'Overdue'}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <TenantActionsDropdown 
                          tenant={tenant}
                          isOpen={dropdownOpen === tenant.id}
                          onToggle={toggleDropdown}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Recent Tenants Tab */}
      {activeTab === 'recent' && (
        <div className="bg-white rounded-lg shadow">
          <div className="p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <Clock className="mr-2 text-yellow-600" />
              Recent Tenants
              {(mockPendingApplications || []).length > 0 && (
                <span className="ml-2 bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full">
                  {(mockPendingApplications || []).length} new
                </span>
              )}
            </h3>
            
            {(mockPendingApplications || []).length === 0 ? (
              <div className="text-center py-12">
                <Clock className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Pending Applications</h3>
                <p className="text-gray-500 mb-4">New tenant applications will appear here</p>
                <button
                  onClick={copySignupLink}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center mx-auto"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Share Signup Link
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {(mockPendingApplications || []).map(application => (
                  <div key={application.id} className="border rounded-lg p-6 hover:bg-gray-50">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <h4 className="text-lg font-semibold text-gray-900">{application.name}</h4>
                        <p className="text-sm text-gray-600">Application ID: {application.id}</p>
                        <p className="text-sm text-gray-500">Submitted: {formatDate(application.submittedAt)}</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full flex items-center">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Payment Completed
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <div>
                        <h5 className="font-medium text-gray-900 mb-2">Contact Information</h5>
                        <div className="space-y-1 text-sm">
                          <p className="flex items-center">
                            <Mail className="w-4 h-4 mr-2 text-gray-400" />
                            {application.email}
                          </p>
                          <p className="flex items-center">
                            <Phone className="w-4 h-4 mr-2 text-gray-400" />
                            {application.phone}
                          </p>
                          <p className="flex items-center">
                            <FileText className="w-4 h-4 mr-2 text-gray-400" />
                            ID: {application.governmentId}
                          </p>
                          <p className="flex items-center">
                            <Phone className="w-4 h-4 mr-2 text-gray-400" />
                            Emergency: {application.emergencyContact}
                          </p>
                        </div>
                      </div>

                      <div>
                        <h5 className="font-medium text-gray-900 mb-2">Room & Documents</h5>
                        <div className="space-y-1 text-sm">
                          <p className="font-medium">{application.roomTypeLabel}</p>
                          <p className="text-gray-600">Type: {application.roomType}</p>
                          <p className="flex items-center text-blue-600">
                            <FileText className="w-4 h-4 mr-1" />
                            {application.documents.length} document{application.documents.length > 1 ? 's' : ''}
                          </p>
                        </div>
                      </div>

                      <div>
                        <h5 className="font-medium text-gray-900 mb-2">Payment Details</h5>
                        <div className="space-y-1 text-sm">
                          <p className="font-medium text-green-600">
                            KSh {Number(application.paymentAmount || 0).toLocaleString()}
                          </p>
                          <p className="text-gray-600">Transaction: {application.transactionId}</p>
                          <p className="flex items-center text-green-600">
                            <CheckCircle className="w-4 h-4 mr-1" />
                            Verified
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-between items-center pt-4 border-t">
                      <div className="flex space-x-3">
                        <button
                          onClick={() => handleViewDocuments(application.documents, application.name)}
                          className="flex items-center text-blue-600 hover:text-blue-800 px-3 py-1 border border-blue-200 rounded hover:bg-blue-50"
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          View Documents ({application.documents.length})
                        </button>
                        <button
                          onClick={() => {
                            alert(`Downloading all documents for ${application.name}...`);
                          }}
                          className="flex items-center text-green-600 hover:text-green-800 px-3 py-1 border border-green-200 rounded hover:bg-green-50"
                        >
                          <Download className="w-4 h-4 mr-1" />
                          Download All
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
        <div className="bg-white rounded-lg shadow">
          <div className="p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <Users className="mr-2 text-gray-600" />
              All Tenants
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b"><th className="text-left py-3 px-4">Tenant</th><th className="text-left py-3 px-4">Room</th><th className="text-left py-3 px-4">Contact</th><th className="text-left py-3 px-4">Rent Status</th><th className="text-left py-3 px-4">Status</th><th className="text-left py-3 px-4">Actions</th></tr>
                </thead>
                <tbody>
                  {transformedTenants.map(tenant => (
                      <tr key={tenant.id} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-4">
                          <div>
                            <p className="font-medium">{tenant.name}</p>
                            <p className="text-sm text-gray-600">{tenant.email}</p>
                            <p className="text-sm text-gray-600">ID: {tenant.bookingId}</p>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div>
                            <p className="font-medium">{tenant.room}</p>
                            <p className="text-sm text-gray-600">Since {new Date(tenant.joinDate || '2024-01-01').toLocaleDateString()}</p>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div>
                            <p className="flex items-center text-sm">
                              <Phone className="w-4 h-4 mr-1" /> {tenant.phone || '-'}
                            </p>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div>
                            <p className="font-medium">KSh {Number(tenant.rentAmount || 0).toLocaleString()}</p>
                            <span className={`px-2 py-1 text-xs rounded-full ${
                              tenant.rentStatus === 'paid' ? 'bg-green-100 text-green-800' :
                              tenant.rentStatus === 'due' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {tenant.rentStatus === 'paid' ? 'Paid' : 
                               tenant.rentStatus === 'due' ? 'Due' : 'Overdue'}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            tenant.status === 'active' ? 'bg-green-100 text-green-800' :
                            tenant.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {tenant.status}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <TenantActionsDropdown 
                            tenant={tenant}
                            isOpen={dropdownOpen === tenant.id}
                            onToggle={toggleDropdown}
                          />
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Document Preview Modal */}
      <DocumentPreviewModal />
      
      {/* All Modals */}
      <EmailFormModal 
        isOpen={isEmailModalOpen}
        onClose={() => setIsEmailModalOpen(false)}
        tenants={transformedTenants}
      />
      <WhatsAppFormModal
        isOpen={isWhatsAppModalOpen}
        onClose={() => setIsWhatsAppModalOpen(false)}
        tenants={transformedTenants}
      />
      <InvoiceModal
        isOpen={isInvoiceModalOpen}
        onClose={() => setIsInvoiceModalOpen(false)}
        tenant={selectedTenant}
      />
      <CustomMessageModal
        isOpen={isCustomMessageModalOpen}
        onClose={() => setIsCustomMessageModalOpen(false)}
        tenant={selectedTenant}
      />
      <ShiftTenantModal
        isOpen={isShiftTenantModalOpen}
        onClose={() => setIsShiftTenantModalOpen(false)}
        tenant={selectedTenant}
        availableUnits={(propertyUnits || []).filter(u => u.isAvailable)}
      />
    </div>
  );
};

export default AdminTenants;