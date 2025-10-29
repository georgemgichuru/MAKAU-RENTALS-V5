import React, { useContext, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Mail, 
  Phone, 
  FileText, 
  Download, 
  Eye, 
  User,
  MapPin,
  Calendar,
  DollarSign,
  Home,
  AlertCircle,
  CheckCircle,
  FileImage,
  X
} from 'lucide-react';
import { AppContext } from '../../context/AppContext';
import { buildMediaUrl } from '../../services/api';

const TenantDetails = () => {
  const { tenantId } = useParams();
  const navigate = useNavigate();
  const { mockTenants, tenants, tenantsLoading } = useContext(AppContext);
  const [documentPreview, setDocumentPreview] = useState(null);

  // Find the tenant by ID - check both mockTenants and tenants from API
  const allTenants = mockTenants || tenants || [];
  const tenant = allTenants?.find(t => String(t.id) === String(tenantId));
  
  console.log('🔍 TenantDetails - tenantId:', tenantId);
  console.log('🔍 TenantDetails - allTenants:', allTenants.length);
  console.log('🔍 TenantDetails - found tenant:', tenant);

  // Mock detailed tenant data (in real app, this would come from backend)
  const detailedTenantData = {
    1: {
      governmentId: 'ID-12345678',
      emergencyContact: '+254734567890',
      emergencyName: 'Mary Doe (Mother)',
      joinDate: '2024-01-15',
      leaseEndDate: '2025-01-14',
      depositAmount: 4000,
      documents: [
        {
          name: 'National_ID.pdf',
          type: 'application/pdf',
          size: 1024000,
          uploadedAt: '2024-01-10T10:25:00'
        },
        {
          name: 'Employment_Letter.pdf',
          type: 'application/pdf',
          size: 2048000,
          uploadedAt: '2024-01-10T10:26:00'
        },
        {
          name: 'Passport_Photo.jpg',
          type: 'image/jpeg',
          size: 512000,
          uploadedAt: '2024-01-10T10:27:00'
        }
      ],
      previousAddress: '123 Old Street, Nairobi',
      occupation: 'Software Engineer',
      employer: 'Tech Solutions Ltd'
    },
    2: {
      governmentId: 'ID-87654321',
      emergencyContact: '+254745678901',
      emergencyName: 'Peter Smith (Brother)',
      joinDate: '2024-02-01',
      leaseEndDate: '2025-01-31',
      depositAmount: 6000,
      documents: [
        {
          name: 'ID_Card.pdf',
          type: 'application/pdf',
          size: 1536000,
          uploadedAt: '2024-01-25T14:15:00'
        },
        {
          name: 'Bank_Statement.pdf',
          type: 'application/pdf',
          size: 3072000,
          uploadedAt: '2024-01-25T14:16:00'
        }
      ],
      previousAddress: '456 Park Avenue, Nairobi',
      occupation: 'Marketing Manager',
      employer: 'Brand Agency Inc'
    },
    3: {
      governmentId: 'ID-11223344',
      emergencyContact: '+254756789012',
      emergencyName: 'Susan Johnson (Wife)',
      joinDate: '2024-01-20',
      leaseEndDate: '2025-01-19',
      depositAmount: 8000,
      documents: [
        {
          name: 'National_ID.pdf',
          type: 'application/pdf',
          size: 1024000,
          uploadedAt: '2024-01-15T09:00:00'
        }
      ],
      previousAddress: '789 Lake Road, Kisumu',
      occupation: 'Business Owner',
      employer: 'Self Employed'
    }
  };

  // Show loading state while tenants are being fetched
  if (tenantsLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading tenant details...</p>
        </div>
      </div>
    );
  }

  if (!tenant) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Tenant Not Found</h2>
          <p className="text-gray-600 mb-6">The tenant you're looking for doesn't exist.</p>
          <button
            onClick={() => navigate('/admin/tenants')}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
          >
            Back to Tenants
          </button>
        </div>
      </div>
    );
  }

  const details = detailedTenantData[tenantId] || {};

  // Prefer real ID document from API if available
  const realDocPath = tenant?.id_document;
  let apiDocuments = [];
  if (realDocPath) {
    const url = buildMediaUrl(realDocPath);
    const name = (() => {
      try { return url.split('/').pop() || 'ID Document'; } catch { return 'ID Document'; }
    })();
    const ext = name.split('.').pop()?.toLowerCase();
    const type = ext === 'pdf' ? 'application/pdf' : (ext ? `image/${ext}` : 'application/octet-stream');
    // Size is unknown without HEAD request; leave undefined
    apiDocuments = [{ name, type, size: undefined, uploadedAt: undefined, url }];
  }
  
  // Get tenant name safely
  const tenantName = tenant.full_name || tenant.name || 'Unknown Tenant';
  const tenantEmail = tenant.email || 'no-email@example.com';
  const tenantPhone = tenant.phone_number || tenant.phone || 'N/A';
  
  // Get unit info safely
  const unit = tenant.current_unit || tenant.unit_data || tenant.unit;
  const roomNumber = unit?.unit_number || unit?.number || tenant.room || 'N/A';
  const rentAmount = unit?.rent || unit?.rent_amount || tenant.rentAmount || 0;
  
  // Get status safely
  const tenantStatus = tenant.status || (tenant.deposit_paid ? 'active' : 'inactive');
  const rentStatus = tenant.rent_status || tenant.rentStatus || 'due';

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
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

  const handleDownloadDocument = (document) => {
    console.log('Downloading document:', document.name);
    alert(`Downloading ${document.name}`);
  };

  const handleDownloadAll = () => {
    alert(`Downloading all documents for ${tenant.name} as ZIP file...`);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-6 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <button
          onClick={() => navigate('/admin/tenants')}
          className="mb-6 flex items-center text-blue-600 hover:text-blue-800 font-medium"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Back to Tenants
        </button>

        <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-8">
            <div className="flex items-start justify-between">
              <div className="flex items-center">
                <div className="bg-white rounded-full p-3 mr-4">
                  <User className="w-8 h-8 text-blue-600" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-white mb-1">{tenantName}</h1>
                  <p className="text-blue-100">Tenant ID: {tenant.bookingId || tenant.id}</p>
                </div>
              </div>
              <div className="text-right">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  tenantStatus === 'active' ? 'bg-green-100 text-green-800' :
                  tenantStatus === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {tenantStatus === 'active' ? 'Active' : tenantStatus === 'pending' ? 'Pending' : 'Inactive'}
                </span>
              </div>
            </div>
          </div>

          {/* Contact Information Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-6 border-b">
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-3">Contact Information</h3>
              <div className="space-y-3">
                <div className="flex items-center">
                  <Mail className="w-5 h-5 text-gray-400 mr-3" />
                  <div>
                    <p className="text-sm text-gray-500">Email</p>
                    <p className="font-medium text-gray-900">{tenantEmail}</p>
                  </div>
                </div>
                <div className="flex items-center">
                  <Phone className="w-5 h-5 text-gray-400 mr-3" />
                  <div>
                    <p className="text-sm text-gray-500">Phone</p>
                    <p className="font-medium text-gray-900">{tenantPhone}</p>
                  </div>
                </div>
                <div className="flex items-center">
                  <FileText className="w-5 h-5 text-gray-400 mr-3" />
                  <div>
                    <p className="text-sm text-gray-500">Government ID</p>
                    <p className="font-medium text-gray-900">{details.governmentId || 'N/A'}</p>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-3">Property Details</h3>
              <div className="space-y-3">
                <div className="flex items-center">
                  <Home className="w-5 h-5 text-gray-400 mr-3" />
                  <div>
                    <p className="text-sm text-gray-500">Room Number</p>
                    <p className="font-medium text-gray-900">{roomNumber}</p>
                  </div>
                </div>
                <div className="flex items-center">
                  <DollarSign className="w-5 h-5 text-gray-400 mr-3" />
                  <div>
                    <p className="text-sm text-gray-500">Monthly Rent</p>
                    <p className="font-medium text-gray-900">KSh {Number(rentAmount).toLocaleString()}</p>
                  </div>
                </div>
                <div className="flex items-center">
                  <DollarSign className="w-5 h-5 text-gray-400 mr-3" />
                  <div>
                    <p className="text-sm text-gray-500">Deposit Paid</p>
                    <p className="font-medium text-gray-900">KSh {Number(details.depositAmount || 0).toLocaleString()}</p>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-3">Lease Information</h3>
              <div className="space-y-3">
                <div className="flex items-center">
                  <Calendar className="w-5 h-5 text-gray-400 mr-3" />
                  <div>
                    <p className="text-sm text-gray-500">Move-in Date</p>
                    <p className="font-medium text-gray-900">{formatDate(details.joinDate || tenant.joinDate)}</p>
                  </div>
                </div>
                <div className="flex items-center">
                  <Calendar className="w-5 h-5 text-gray-400 mr-3" />
                  <div>
                    <p className="text-sm text-gray-500">Lease End Date</p>
                    <p className="font-medium text-gray-900">{formatDate(details.leaseEndDate)}</p>
                  </div>
                </div>
                <div className="flex items-center">
                  <CheckCircle className="w-5 h-5 text-gray-400 mr-3" />
                  <div>
                    <p className="text-sm text-gray-500">Rent Status</p>
                    <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                      rentStatus === 'paid' ? 'bg-green-100 text-green-800' :
                      rentStatus === 'due' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {rentStatus === 'paid' ? 'Paid' : 
                       rentStatus === 'due' ? 'Due' : 'Overdue'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Additional Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 bg-gray-50">
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-3">Emergency Contact</h3>
              <div className="space-y-2">
                <div className="flex items-center">
                  <Phone className="w-5 h-5 text-gray-400 mr-3" />
                  <div>
                    <p className="font-medium text-gray-900">{details.emergencyName || 'N/A'}</p>
                    <p className="text-sm text-gray-600">{details.emergencyContact || 'N/A'}</p>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-3">Employment Information</h3>
              <div className="space-y-2">
                <div>
                  <p className="text-sm text-gray-500">Occupation</p>
                  <p className="font-medium text-gray-900">{details.occupation || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Employer</p>
                  <p className="font-medium text-gray-900">{details.employer || 'N/A'}</p>
                </div>
              </div>
            </div>

            {details.previousAddress && (
              <div className="md:col-span-2">
                <h3 className="text-sm font-medium text-gray-500 mb-3">Previous Address</h3>
                <div className="flex items-center">
                  <MapPin className="w-5 h-5 text-gray-400 mr-3" />
                  <p className="font-medium text-gray-900">{details.previousAddress}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Documents Section */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-900 flex items-center">
              <FileText className="w-6 h-6 mr-2 text-blue-600" />
              Documents ({(apiDocuments.length || 0) + (details.documents?.length || 0)})
            </h2>
            {(apiDocuments.length > 0 || (details.documents?.length > 0)) && (
              <button
                onClick={handleDownloadAll}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <Download className="w-4 h-4 mr-2" />
                Download All
              </button>
            )}
          </div>

          {apiDocuments.length === 0 && (!details.documents || details.documents.length === 0) ? (
            <div className="text-center py-12">
              <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No documents available</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...apiDocuments, ...(details.documents || [])].map((doc, index) => (
                <div key={index} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-2 flex-1 min-w-0">
                      {getFileIcon(doc.type)}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm text-gray-900 truncate">{doc.name}</p>
                        <p className="text-xs text-gray-500">
                          {formatFileSize(doc.size)}
                        </p>
                        {doc.uploadedAt && (
                          <p className="text-xs text-gray-400">
                            Uploaded: {formatDate(doc.uploadedAt)}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex space-x-2">
                    <button
                      onClick={() => {
                        if (doc.url) {
                          window.open(doc.url, '_blank');
                        } else {
                          handlePreviewDocument(doc);
                        }
                      }}
                      className="flex-1 flex items-center justify-center px-3 py-2 text-sm bg-blue-50 text-blue-600 rounded hover:bg-blue-100 transition-colors"
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      Preview
                    </button>
                    <button
                      onClick={() => {
                        if (doc.url) {
                          const a = document.createElement('a');
                          a.href = doc.url;
                          a.download = doc.name || 'document';
                          document.body.appendChild(a);
                          a.click();
                          document.body.removeChild(a);
                        } else {
                          handleDownloadDocument(doc);
                        }
                      }}
                      className="flex-1 flex items-center justify-center px-3 py-2 text-sm bg-green-50 text-green-600 rounded hover:bg-green-100 transition-colors"
                    >
                      <Download className="w-4 h-4 mr-1" />
                      Download
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="mt-6 flex justify-end space-x-4">
          <button
            onClick={() => navigate(`/admin/tenants/${tenant.id}/transactions`)}
            className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium"
          >
            View Transactions
          </button>
          <button
            onClick={() => navigate('/admin/tenants')}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
          >
            Back to Tenants
          </button>
        </div>
      </div>
    </div>
  );
};

export default TenantDetails;