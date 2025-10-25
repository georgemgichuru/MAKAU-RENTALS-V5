import React from 'react'
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
  Tablet
} from 'lucide-react';
const AdminHelp = () => {
  const faqs = [
    {
      question: "How do I add a new tenant?",
      answer: "Click on 'Add New Tenant' in the Tenants section. This will open the tenant registration form where you can input all necessary details."
    },
    {
      question: "How do I update rental prices?",
      answer: "Go to the Payments section and click on 'Unit Rental Prices'. You can edit the rent amount for each unit by clicking the edit icon next to the price."
    },
    {
      question: "How do I handle maintenance requests?",
      answer: "All maintenance requests appear in the 'Reports & Issues' section. You can update the status of each request and tenants will be notified automatically."
    },
    {
      question: "How do I send emails to tenants?",
      answer: "Use the 'Send Email' button available in multiple sections. You can choose to email all tenants or select specific tenants."
    }
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">Help & Support</h1>
      <p className="text-gray-600">Frequently asked questions and support resources</p>

      <div className="bg-white rounded-lg shadow">
        <div className="p-6">
          <h2 className="text-xl font-semibold mb-6">Frequently Asked Questions</h2>
          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div key={index} className="border-b pb-4">
                <h3 className="font-medium text-gray-900 mb-2">{faq.question}</h3>
                <p className="text-gray-600">{faq.answer}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="p-6">
          <h2 className="text-xl font-semibold mb-4">Contact Support</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <Mail className="w-8 h-8 mx-auto mb-2 text-blue-600" />
              <h3 className="font-medium">Email Support</h3>
              <p className="text-sm text-gray-600">support@makaorentals.com</p>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <Phone className="w-8 h-8 mx-auto mb-2 text-green-600" />
              <h3 className="font-medium">Phone Support</h3>
              <p className="text-sm text-gray-600">+254 712 345 678</p>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <HelpCircle className="w-8 h-8 mx-auto mb-2 text-purple-600" />
              <h3 className="font-medium">Documentation</h3>
              <p className="text-sm text-gray-600">View user guides</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminHelp
