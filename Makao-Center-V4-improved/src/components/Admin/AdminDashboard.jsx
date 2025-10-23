import React, {useContext, useState} from 'react'
import { 
  Users, 
  AlertTriangle, 
  Plus, 
  Mail,
  DollarSign,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';
import {AppContext} from '../../context/AppContext';
import { NavLink } from 'react-router-dom';
import EmailFormModal from './Modals/EmailFormModal';
import WhatsAppFormModal from './Modals/WhatsAppFormModal';

const AdminDashboard = ({ onEmailClick }) => {
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [isWhatsAppModalOpen, setWhatsAppModalOpen] = useState(false);
  const {mockTenants} = useContext(AppContext);
  // Function to handle the tenant signup link
  const handleTenantSignup = () => {
    // Get the current domain and create the public signup URL
    const signupUrl = `${window.location.origin}/tenant/signup`;
    
    // Open in new tab
    window.open(signupUrl, '_blank');
  };

  // Function to copy the signup link to clipboard
  const copySignupLink = async () => {
    const signupUrl = `${window.location.origin}/tenant/signup`;
    try {
      await navigator.clipboard.writeText(signupUrl);
      // You could add a toast notification here
      alert('Signup link copied to clipboard!');
    } catch (err) {
      console.error('Failed to copy: ', err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center flex-col sm:flex-row gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600">Manage your property and tenants</p>
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
          onClick={() => setWhatsAppModalOpen(true)}
          className="bg-green-400 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center"
        >
          <Mail className="w-5 h-5 mr-2" />
          Send WhatsApp
        </button>

          {/* Dropdown for tenant signup options */}
          <div className="relative group">
            {/* <button className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center">
              <Plus className="w-5 h-5 mr-2" />
              Add New Tenant
            </button> */}
            
            {/* Dropdown menu
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
            </div> */}
          </div>
        </div>
      </div>

      {/* Signup URL Display for Admin Reference */}
      {/* <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <h3 className="font-medium text-green-800 mb-2">Tenant Signup Link</h3>
        <div className="flex items-center justify-between flex-col sm:flex-row">
          <code className="text-sm text-green-700 text-wrap bg-green-100 px-2 py-1 rounded">
            {window.location.origin}/tenant/signup
          </code>
          <button
            onClick={copySignupLink}
            className="text-green-600 hover:text-green-800 text-sm font-medium"
          >
            Copy Link
          </button>
        </div>
        <p className="text-sm text-green-600 mt-2">
          Share this link with prospective tenants to allow them to sign up into the system
        </p>
      </div> */}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <NavLink 
            to={"/admin/tenants"}
          // close drawer on mobile when clicking a link
          onClick={() => {  
            if (typeof onClose === "function") onClose();
        }}>
        <div className="bg-blue-50 p-6 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
             
        
        <div className="cursor-pointer">
            <p className="text-blue-600 text-sm font-medium pb-3">Total Tenants</p>
            <p className="text-3xl pb-2 font-bold text-blue-900">2</p>
        </div>

     
            
            </div>
            <Users className="w-8 h-8 text-blue-600" />
          </div>
        </div>
           </NavLink>

        <div className="bg-green-50 p-6 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-600 text-sm font-medium pb-3">Monthly Revenue</p>
              <p className="text-3xl pb-2 font-bold text-green-900">KSh 55,000</p>
              <p className="text-green-600 text-sm">Expected monthly</p>
            </div>
            <DollarSign className="w-8 h-8 text-green-600" />
          </div>
        </div>

    <NavLink 
      to={"/admin/tenants"}
          // close drawer on mobile when clicking a link
          onClick={() => {  
            if (typeof onClose === "function") onClose();
        }}>
        <div className="bg-orange-50 p-6 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-600 text-sm font-medium pb-3">Rent Due</p>
              <p className="text-3xl pb-2 font-bold text-orange-900">KSh 5,000</p>
              <p className="text-orange-600 text-sm">Outstanding payments</p>
            </div>
            <AlertCircle className="w-8 h-8 text-orange-600" />
          </div>
        </div>

        </NavLink>

        <NavLink    
        to={"/admin/reports"}    
                // close drawer on mobile when clicking a link
                onClick={() => {
                  if (typeof onClose === "function") onClose();
              }}>
        <div className="bg-red-50 p-6 rounded-lg">
           
          <div className="flex items-center justify-between">
            <div>
             
                
         
                 <p className="text-red-600 text-sm font-medium pb-3">Open Reports</p>
           
             
              <p className="text-3xl pb-2 font-bold text-red-900">1</p>
              <p className="text-red-600 text-sm">Require attention</p>
            </div>
            <AlertTriangle className="w-8 h-8 text-red-600" />
          </div>
         
        </div>
            </NavLink>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
           <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Revenue Trend</h3>
          <div className="h-64 bg-gray-100 rounded-lg flex items-center justify-center">
            <p className="text-gray-500">Chart placeholder - Revenue over time</p>
          </div>
        </div>

       <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Recent Transactions</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <p className="font-medium">Mark Talamson</p>
                <p className="text-sm text-gray-600">2023-07-20</p>
              </div>
              <span className="text-green-600 font-medium">+KSh 35,000</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <p className="font-medium">Jeremy Shiroya</p>
                <p className="text-sm text-gray-600">2023-07-19</p>
              </div>
              <span className="text-red-600 font-medium">-KSh 12,050</span>
            </div>
          </div>
        </div>
      </div>
      <EmailFormModal 
  isOpen={isEmailModalOpen}
  onClose={() => setIsEmailModalOpen(false)}
  tenants={mockTenants}
/>
<WhatsAppFormModal
  isOpen={isWhatsAppModalOpen}
  onClose={() => setWhatsAppModalOpen(false)}
  tenants={mockTenants}
/>
    </div>
  );
};

export default AdminDashboard