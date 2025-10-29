import React, { useState } from 'react';
import { authAPI, buildMediaUrl } from '../../services/api';
import { 
  Home, 
  BarChart3, 
  Building, 
  CreditCard, 
  Users, 
  AlertTriangle, 
  Settings, 
  HelpCircle, 
  Menu, 
  X, 
  Plus, 
  Search, 
  Filter,
  Bell,
  User,
  ChevronDown,
  Eye,
  Edit,
  Trash2,
  Mail,
  Phone,
  MapPin,
  DollarSign,
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Send,
  Download,
  Upload,
  LogOut,
  Shield,
  Smartphone,
  Monitor,
  Tablet,
  FileText
} from 'lucide-react';
const TenantSettings = () => {
  // Get user data from localStorage
  const userData = localStorage.getItem('userData') ? JSON.parse(localStorage.getItem('userData')) : {};

  // Account info state
  const [email, setEmail] = useState(userData.email || '');
  const [phone, setPhone] = useState(userData.phone_number || '');
  // Move-in date state
  const [moveInDate, setMoveInDate] = useState(userData.move_in_date ? userData.move_in_date.substring(0, 10) : '');
  const [moveInDateLoading, setMoveInDateLoading] = useState(false);
  const [moveInDateError, setMoveInDateError] = useState('');
  const [moveInDateSuccess, setMoveInDateSuccess] = useState('');
  const [accountLoading, setAccountLoading] = useState(false);
  const [accountError, setAccountError] = useState('');
  const [accountSuccess, setAccountSuccess] = useState('');

  // Password state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');

  // ID Document upload state
  const [idDocument, setIdDocument] = useState(null);
  const [documentLoading, setDocumentLoading] = useState(false);
  const [documentError, setDocumentError] = useState('');
  const [documentSuccess, setDocumentSuccess] = useState('');
  const [currentDocument, setCurrentDocument] = useState(userData.id_document || null);

  // Handle ID document upload
  const handleDocumentUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setDocumentError('File size must be less than 5MB');
      return;
    }

    // Validate file type
    const validTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
    if (!validTypes.includes(file.type)) {
      setDocumentError('Only PDF, JPEG, JPG, and PNG files are allowed');
      return;
    }

    setIdDocument(file);
    setDocumentError('');
  };

  // Submit ID document to backend
  const handleDocumentSubmit = async (e) => {
    e.preventDefault();
    if (!idDocument) {
      setDocumentError('Please select a document to upload');
      return;
    }

    setDocumentLoading(true);
    setDocumentError('');
    setDocumentSuccess('');

    try {
      // Convert file to base64
      const reader = new FileReader();
      reader.onload = async (event) => {
        const base64File = event.target.result;
        
        try {
          // Update user with new document
          const data = await authAPI.updateTenantAccount(userData.id, {
            id_document: base64File,
          });

          if (data && !data.errors) {
            setDocumentSuccess('ID document uploaded successfully!');
            setCurrentDocument(data.id_document);
            setIdDocument(null);
            // Update localStorage
            localStorage.setItem('userData', JSON.stringify({ ...userData, id_document: data.id_document }));
            // Reset file input
            document.getElementById('idDocumentInput').value = '';
          } else {
            setDocumentError(data.errors ? JSON.stringify(data.errors) : 'Failed to upload document.');
          }
        } catch (err) {
          const msg = err?.response?.data?.error || err?.response?.data?.detail || err?.message || 'Failed to upload document.';
          setDocumentError(msg);
        } finally {
          setDocumentLoading(false);
        }
      };

      reader.onerror = () => {
        setDocumentError('Failed to read file');
        setDocumentLoading(false);
      };

      reader.readAsDataURL(idDocument);
    } catch (err) {
      setDocumentError('An error occurred while processing the file');
      setDocumentLoading(false);
    }
  };

  // Get file name from URL
  const getFileName = (url) => {
    if (!url) return '';
    try {
      return url.split('/').pop() || 'ID Document';
    } catch {
      return 'ID Document';
    }
  };

  // Update account info handler
  const handleAccountUpdate = async (e) => {
    e.preventDefault();
    setAccountLoading(true);
    setAccountError('');
    setAccountSuccess('');
    try {
      const data = await authAPI.updateTenantAccount(userData.id, {
        email,
        phone_number: phone,
      });
      if (data && !data.errors) {
        setAccountSuccess('Account information updated successfully.');
        localStorage.setItem('userData', JSON.stringify({ ...userData, email, phone_number: phone }));
      } else {
        setAccountError(data.errors ? JSON.stringify(data.errors) : 'Failed to update account info.');
      }
    } catch (err) {
      const msg = err?.response?.data ? JSON.stringify(err.response.data) : (err?.message || 'Network error.');
      setAccountError(msg);
    }
    setAccountLoading(false);
  };

  // Update move-in date handler
  const handleMoveInDateUpdate = async (e) => {
    e.preventDefault();
    setMoveInDateLoading(true);
    setMoveInDateError('');
    setMoveInDateSuccess('');
    try {
      const data = await authAPI.updateTenantAccount(userData.id, {
        move_in_date: moveInDate,
      });
      if (data && !data.errors) {
        setMoveInDateSuccess('Move-in date updated successfully.');
        localStorage.setItem('userData', JSON.stringify({ ...userData, move_in_date: moveInDate }));
      } else {
        setMoveInDateError(data.errors ? JSON.stringify(data.errors) : 'Failed to update move-in date.');
      }
    } catch (err) {
      const msg = err?.response?.data ? JSON.stringify(err.response.data) : (err?.message || 'Network error.');
      setMoveInDateError(msg);
    }
    setMoveInDateLoading(false);
  };

  // Change password handler
  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPasswordLoading(true);
    setPasswordError('');
    setPasswordSuccess('');
    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match.');
      setPasswordLoading(false);
      return;
    }
    try {
      const data = await authAPI.changeTenantPassword(currentPassword, newPassword);
      if (data && !data.errors) {
        setPasswordSuccess('Password changed successfully.');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        setPasswordError(data.errors ? JSON.stringify(data.errors) : (data.detail || 'Failed to change password.'));
      }
    } catch (err) {
      const msg = err?.response?.data ? JSON.stringify(err.response.data) : (err?.message || 'Network error.');
      setPasswordError(msg);
    }
    setPasswordLoading(false);
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Settings</h1>

      {/* Account Settings */}
      <form className="bg-white p-6 rounded-lg shadow" onSubmit={handleAccountUpdate}>
        <h2 className="text-xl font-semibold mb-4">Account Settings</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
            <input
              type="tel"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <button type="submit" className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700" disabled={accountLoading}>
            {accountLoading ? 'Updating...' : 'Update Information'}
          </button>
          {accountError && <div className="text-red-600 mt-2">{accountError}</div>}
          {accountSuccess && <div className="text-green-600 mt-2">{accountSuccess}</div>}
        </div>
      </form>

      {/* Move-in Date Settings */}
      <form className="bg-white p-6 rounded-lg shadow mt-6" onSubmit={handleMoveInDateUpdate}>
        <h2 className="text-xl font-semibold mb-4">Move-in Date</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Date you started living in this property</label>
            <input
              type="date"
              value={moveInDate}
              onChange={e => setMoveInDate(e.target.value)}
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
              required
            />
            <p className="text-xs text-gray-500 mt-1">This date will be used for rent reminders if the landlord has not set a specific rent deadline.</p>
          </div>
          <button type="submit" className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700" disabled={moveInDateLoading}>
            {moveInDateLoading ? 'Saving...' : 'Save Move-in Date'}
          </button>
          {moveInDateError && <div className="text-red-600 mt-2">{moveInDateError}</div>}
          {moveInDateSuccess && <div className="text-green-600 mt-2">{moveInDateSuccess}</div>}
        </div>
      </form>

      {/* ID Document Upload */}
      <div className="bg-white p-6 rounded-lg shadow mt-6">
        <h2 className="text-xl font-semibold mb-4 flex items-center">
          <FileText className="w-6 h-6 mr-2 text-blue-600" />
          ID Document
        </h2>
        
        {/* Current Document Display */}
        {currentDocument && (
          <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <FileText className="w-5 h-5 text-blue-600 mr-2" />
                <div>
                  <p className="font-medium text-blue-900">Current Document</p>
                  <p className="text-sm text-blue-700">{getFileName(currentDocument)}</p>
                </div>
              </div>
              <a
                href={buildMediaUrl(currentDocument)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
              >
                <Eye className="w-4 h-4 mr-1" />
                View
              </a>
            </div>
          </div>
        )}

        {!currentDocument && (
          <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-start">
              <AlertCircle className="w-5 h-5 text-yellow-600 mr-2 mt-0.5" />
              <div>
                <p className="font-medium text-yellow-900">No ID document uploaded</p>
                <p className="text-sm text-yellow-700 mt-1">Upload your government ID for verification purposes.</p>
              </div>
            </div>
          </div>
        )}

        {/* Upload Form */}
        <form onSubmit={handleDocumentSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {currentDocument ? 'Replace ID Document' : 'Upload ID Document'}
            </label>
            <div className="flex items-center space-x-3">
              <input
                type="file"
                id="idDocumentInput"
                onChange={handleDocumentUpload}
                accept=".pdf,.jpg,.jpeg,.png"
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Supported formats: PDF, JPEG, JPG, PNG (Max 5MB)
            </p>
            {idDocument && (
              <div className="mt-2 flex items-center text-sm text-green-600">
                <CheckCircle className="w-4 h-4 mr-1" />
                Selected: {idDocument.name}
              </div>
            )}
          </div>

          <button 
            type="submit" 
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center"
            disabled={documentLoading || !idDocument}
          >
            {documentLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Uploading...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4 mr-2" />
                {currentDocument ? 'Replace Document' : 'Upload Document'}
              </>
            )}
          </button>

          {documentError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start">
              <AlertCircle className="w-5 h-5 text-red-500 mr-2 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700">{documentError}</p>
            </div>
          )}

          {documentSuccess && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg flex items-start">
              <CheckCircle className="w-5 h-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-green-700">{documentSuccess}</p>
            </div>
          )}
        </form>

        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start">
            <Shield className="w-5 h-5 text-blue-500 mr-2 mt-0.5" />
            <p className="text-sm text-blue-700">
              Your document will be securely stored and used for verification purposes only. 
              It will be visible to your landlord for identity confirmation.
            </p>
          </div>
        </div>
      </div>

      {/* Change Password */}
      <form className="bg-white p-6 rounded-lg shadow" onSubmit={handleChangePassword}>
        <h2 className="text-xl font-semibold mb-4">Change Password</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Current Password</label>
            <input
              type="password"
              value={currentPassword}
              onChange={e => setCurrentPassword(e.target.value)}
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">New Password</label>
            <input
              type="password"
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Confirm New Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <button type="submit" className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700" disabled={passwordLoading}>
            {passwordLoading ? 'Changing...' : 'Change Password'}
          </button>
          {passwordError && <div className="text-red-600 mt-2">{passwordError}</div>}
          {passwordSuccess && <div className="text-green-600 mt-2">{passwordSuccess}</div>}
        </div>
      </form>

      {/* Notifications (static for now) */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">Notifications</h2>
        <div className="space-y-3">
          <label className="flex items-center">
            <input type="checkbox" defaultChecked className="mr-3" />
            <span>Email notifications for rent reminders</span>
          </label>
          <label className="flex items-center">
            <input type="checkbox" defaultChecked className="mr-3" />
            <span>SMS notifications for maintenance updates</span>
          </label>
          <label className="flex items-center">
            <input type="checkbox" defaultChecked className="mr-3" />
            <span>Email notifications for announcements</span>
          </label>
        </div>
      </div>
    </div>
  );
};

export default TenantSettings;
