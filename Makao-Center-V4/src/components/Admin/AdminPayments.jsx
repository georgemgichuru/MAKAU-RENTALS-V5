import React, {useState, useContext} from 'react'
import {AppContext} from '../../context/AppContext';
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
  Percent,
  TrendingUp,
  RefreshCw
} from 'lucide-react';

const AdminPayments = () => {
  const {mockTenants, mockReports, propertyUnits} = useContext(AppContext);

  // Example payments data (replace with your actual payments data)
  const payments = [
    {
      id: 'PAY-001',
      client: 'John Doe',
      amount: 25000,
      date: '2024-03-15',
      method: 'M-Pesa',
      status: 'Completed'
    },
    {
      id: 'PAY-002',
      client: 'Jane Smith',
      amount: 35000,
      date: '2024-03-10',
      method: 'Bank Transfer',
      status: 'Processing'
    }
    // ...add all payments here or fetch from context/state
  ];

  const [editingUnit, setEditingUnit] = useState(null);
  const [units, setUnits] = useState(propertyUnits || []);
  const [bulkUpdateType, setBulkUpdateType] = useState('percentage');
  const [selectedRoomType, setSelectedRoomType] = useState('all');
  const [percentageIncrease, setPercentageIncrease] = useState('');
  const [fixedAmount, setFixedAmount] = useState('');
  const [showDisclaimer, setShowDisclaimer] = useState(false);

  const handlePriceUpdate = (unitId, newPrice) => {
    setUnits(units.map(unit => 
      unit.id === unitId ? { ...unit, rent: parseFloat(newPrice) } : unit
    ));
    setEditingUnit(null);
  };

  const getRoomTypes = () => {
    const types = [...new Set(units.map(unit => unit.type))];
    return types;
  };

  const handleBulkUpdate = () => {
    if (bulkUpdateType === 'percentage' && percentageIncrease) {
      const increase = parseFloat(percentageIncrease) / 100;
      setUnits(units.map(unit => {
        if (selectedRoomType === 'all' || unit.type === selectedRoomType) {
          return { ...unit, rent: Math.round(unit.rent * (1 + increase)) };
        }
        return unit;
      }));
    } else if (bulkUpdateType === 'fixed' && fixedAmount) {
      const amount = parseFloat(fixedAmount);
      setUnits(units.map(unit => {
        if (selectedRoomType === 'all' || unit.type === selectedRoomType) {
          return { ...unit, rent: Math.round(unit.rent + amount) };
        }
        return unit;
      }));
    }
    
    // Reset form
    setPercentageIncrease('');
    setFixedAmount('');
  };

  const previewBulkUpdate = () => {
    let affectedUnits = units.filter(unit => 
      selectedRoomType === 'all' || unit.type === selectedRoomType
    );
    
    if (bulkUpdateType === 'percentage' && percentageIncrease) {
      const increase = parseFloat(percentageIncrease) / 100;
      return affectedUnits.map(unit => ({
        ...unit,
        newRent: Math.round(unit.rent * (1 + increase))
      }));
    } else if (bulkUpdateType === 'fixed' && fixedAmount) {
      const amount = parseFloat(fixedAmount);
      return affectedUnits.map(unit => ({
        ...unit,
        newRent: Math.round(unit.rent + amount)
      }));
    }
    
    return [];
  };

  const previewData = previewBulkUpdate();

  // Download all payments as CSV
  const handleDownloadPaymentsCSV = () => {
    const headers = ['Payment ID', 'Client', 'Amount (KSh)', 'Date', 'Method', 'Status'];
    const csvRows = [
      headers.join(','),
      ...payments.map(p =>
        `${p.id},${p.client},${p.amount},${p.date},${p.method},${p.status}`
      )
    ];
    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'all_payments.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  // Modified bulk update handler
  const handleBulkUpdateClick = () => {
    setShowDisclaimer(true);
  };

  // Confirm and apply bulk update
  const handleConfirmBulkUpdate = () => {
    handleBulkUpdate();
    setShowDisclaimer(false);
  };

  // Cancel disclaimer
  const handleCancelDisclaimer = () => {
    setShowDisclaimer(false);
  };

  return (
    <div className="space-y-6 relative">
      {/* Disclaimer Modal */}
      {showDisclaimer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-opacity-40 backdrop-blur-sm">
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6">
            <div className="flex items-center mb-4">
              <AlertTriangle className="w-8 h-8 text-yellow-600 mr-3" />
              <h2 className="text-xl font-bold text-yellow-700">Confirm Bulk Price Update</h2>
            </div>
            <p className="text-gray-800 mb-6">
              <strong>Warning:</strong> All tenants will be notified of this price change. Are you sure you want to proceed?
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={handleCancelDisclaimer}
                className="px-4 py-2 rounded bg-gray-200 text-gray-700 hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmBulkUpdate}
                className="px-4 py-2 rounded bg-yellow-600 text-white hover:bg-yellow-700"
              >
                Confirm & Apply
              </button>
            </div>
          </div>
        </div>
      )}

      <h1 className="text-3xl font-bold text-gray-900">Payments</h1>

    

      <div className="bg-white p-6 rounded-lg shadow">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">All Payments</h2>
          <button
            onClick={handleDownloadPaymentsCSV}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center"
          >
            <Download className="w-5 h-5 mr-2" />
            Download CSV
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3 px-4">Payment ID</th>
                <th className="text-left py-3 px-4">Client</th>
                <th className="text-left py-3 px-4">Amount</th>
                <th className="text-left py-3 px-4">Date</th>
                <th className="text-left py-3 px-4">Method</th>
                <th className="text-left py-3 px-4">Status</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((p) => (
                <tr key={p.id} className="border-b">
                  <td className="py-3 px-4">{p.id}</td>
                  <td className="py-3 px-4">{p.client}</td>
                  <td className="py-3 px-4">KSh {p.amount.toLocaleString()}</td>
                  <td className="py-3 px-4">{p.date}</td>
                  <td className="py-3 px-4">{p.method}</td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      p.status === 'Completed' ? 'bg-green-100 text-green-800' :
                      p.status === 'Processing' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>{p.status}</span>
                  </td>
                
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow">
        <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold mb-4">Unit Rental Prices</h2>
        <input type="" placeholder='Search for unit' className='rounded solid-black' />
        </div>
      
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {units.map(unit => (
            <div key={unit.id} className="border rounded-lg p-4">
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-semibold">Unit {unit.unitNumber}</h3>
               
              </div>
              <p className="text-sm text-gray-600 mb-2">Type: {unit.type}</p>
              {unit.tenant && <p className="text-sm text-gray-600 mb-2">Tenant: {unit.tenant}</p>}
              
              <div className="flex items-center justify-between">
                {editingUnit === unit.id ? (
                  <div className="flex items-center space-x-2">
                    <input
                      type="number"
                      defaultValue={unit.rent}
                      className="w-24 p-1 border rounded"
                      onBlur={(e) => handlePriceUpdate(unit.id, e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          handlePriceUpdate(unit.id, e.target.value);
                        }
                      }}
                      autoFocus
                    />
                    <button
                      onClick={() => setEditingUnit(null)}
                      className="text-gray-600 hover:text-gray-800"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <span className="font-semibold">KSh {unit.rent.toLocaleString()}</span>
                    <button
                      onClick={() => setEditingUnit(unit.id)}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
        {/* Bulk Price Update Section */}
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="flex items-center mb-4">
          <TrendingUp className="w-6 h-6 text-blue-600 mr-2" />
          <h2 className="text-xl font-semibold">Bulk Price Update</h2>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Update Type
              </label>
              <select
                value={bulkUpdateType}
                onChange={(e) => setBulkUpdateType(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="percentage">Percentage Increase</option>
                <option value="fixed">Fixed Amount Increase</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Room Type
              </label>
              <select
                value={selectedRoomType}
                onChange={(e) => setSelectedRoomType(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Room Types</option>
                {getRoomTypes().map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>

            {bulkUpdateType === 'percentage' ? (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Percentage Increase (%)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={percentageIncrease}
                    onChange={(e) => setPercentageIncrease(e.target.value)}
                    placeholder="Enter percentage (e.g., 10)"
                    className="w-full p-2 pr-8 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <Percent className="w-4 h-4 absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                </div>
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fixed Amount Increase (KSh)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={fixedAmount}
                    onChange={(e) => setFixedAmount(e.target.value)}
                    placeholder="Enter amount (e.g., 2000)"
                    className="w-full p-2 pl-12 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">KSh</span>
                </div>
              </div>
            )}

            <button
              onClick={handleBulkUpdateClick}
              disabled={(!percentageIncrease && bulkUpdateType === 'percentage') || (!fixedAmount && bulkUpdateType === 'fixed')}
              className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Apply Bulk Update
            </button>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-medium text-gray-900 mb-3">Preview Changes</h3>
            {previewData.length > 0 ? (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {previewData.map(unit => (
                  <div key={unit.id} className="flex justify-between items-center py-2 border-b border-gray-200">
                    <div>
                      <span className="font-medium">{unit.unitNumber}</span>
                      <span className="text-sm text-gray-600 ml-2">({unit.type})</span>
                    </div>
                    <div className="text-sm">
                      <span className="text-gray-500">KSh {unit.rent.toLocaleString()}</span>
                      <span className="mx-2 text-gray-400">→</span>
                      <span className="font-medium text-green-600">KSh {unit.newRent.toLocaleString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-sm">
                {selectedRoomType === 'all' 
                  ? 'Enter an amount to preview changes for all units'
                  : `Enter an amount to preview changes for ${selectedRoomType} units`
                }
              </p>
            )}
            
            {previewData.length > 0 && (
              <div className="mt-3 pt-3 border-t border-gray-200">
                <div className="flex justify-between text-sm">
                  <span>Units affected:</span>
                  <span className="font-medium">{previewData.length}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Total increase:</span>
                  <span className="font-medium text-green-600">
                    KSh {previewData.reduce((sum, unit) => sum + (unit.newRent - unit.rent), 0).toLocaleString()}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPayments;