import React, { useState, useEffect } from 'react';
import { useAppContext } from '../../context/AppContext';
import { useToast } from '../../context/ToastContext';
import { Search, Home, DollarSign, Users, X, AlertTriangle } from 'lucide-react';

const AssignUnitModal = ({ 
  isOpen, 
  onClose, 
  tenant, 
  onAssignSuccess 
}) => {
  const { units, refreshData } = useAppContext();
  const { showToast } = useToast();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUnit, setSelectedUnit] = useState(null);
  const [assigning, setAssigning] = useState(false);
  const [availableUnits, setAvailableUnits] = useState([]);
  const [error, setError] = useState(null);

  // Filter available units
  useEffect(() => {
    if (isOpen) {
      const filtered = units.filter(unit => 
        unit.is_available && 
        (searchTerm === '' || 
         unit.unit_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
         unit.property?.name.toLowerCase().includes(searchTerm.toLowerCase()))
      );
      setAvailableUnits(filtered);
      setError(null);
    }
  }, [isOpen, units, searchTerm]);

  const handleAssignUnit = async () => {
    if (!selectedUnit || !tenant) return;

    setAssigning(true);
    setError(null);

    try {
      const response = await fetch(`http://127.0.0.1:8000/api/accounts/units/${selectedUnit.id}/assign/${tenant.id}/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
        },
      });

      const data = await response.json();

      if (response.ok) {
        showToast(`Successfully assigned ${tenant.full_name} to unit ${selectedUnit.unit_number}`, 'success');
        await refreshData();
        onAssignSuccess();
        onClose();
      } else {
        // Handle specific error cases
        if (data.error?.includes('not available')) {
          throw new Error('This unit is no longer available. Please select another unit.');
        } else if (data.error?.includes('already has unit')) {
          throw new Error('This tenant already has a unit assigned. Please remove them from their current unit first.');
        } else if (data.error?.includes('deposit')) {
          throw new Error('Tenant must pay deposit before being assigned to unit.');
        } else {
          throw new Error(data.error || data.detail || 'Failed to assign unit');
        }
      }
    } catch (error) {
      console.error('Error assigning unit:', error);
      setError(error.message);
      showToast(error.message || 'Failed to assign unit', 'error');
    } finally {
      setAssigning(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0,
    }).format(amount || 0);
  };

  // Close modal when clicking outside
  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget && !assigning) {
      onClose();
    }
  };

  // Close modal on Escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && !assigning) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, assigning, onClose]);

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Assign Unit to Tenant</h2>
            <p className="text-gray-600 mt-1">
              Assign a unit to {tenant?.full_name}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            disabled={assigning}
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mx-6 mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center">
              <AlertTriangle className="w-5 h-5 text-red-500 mr-2" />
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          </div>
        )}

        {/* Search */}
        <div className="p-6 border-b border-gray-200">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search available units by unit number or property name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={assigning}
            />
          </div>
        </div>

        {/* Available Units */}
        <div className="flex-1 overflow-y-auto max-h-96">
          {availableUnits.length === 0 ? (
            <div className="text-center py-12">
              <Home className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {searchTerm ? 'No units match your search' : 'No available units'}
              </h3>
              <p className="text-gray-500">
                {searchTerm 
                  ? 'Try adjusting your search terms' 
                  : 'All units are currently occupied or no units have been created yet'
                }
              </p>
            </div>
          ) : (
            <div className="p-6 space-y-3">
              {availableUnits.map(unit => (
                <div
                  key={unit.id}
                  className={`border rounded-lg p-4 cursor-pointer transition-all ${
                    selectedUnit?.id === unit.id
                      ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  } ${assigning ? 'opacity-50 cursor-not-allowed' : ''}`}
                  onClick={() => !assigning && setSelectedUnit(unit)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <div className="bg-blue-100 p-2 rounded-lg">
                          <Home className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900">
                            Unit {unit.unit_number}
                          </h4>
                          <p className="text-sm text-gray-600">
                            {unit.property?.name || 'Unknown Property'}
                          </p>
                          <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                            <span className="flex items-center">
                              <DollarSign className="w-4 h-4 mr-1" />
                              {formatCurrency(unit.rent)}/month
                            </span>
                            {unit.bedrooms > 0 && (
                              <span>{unit.bedrooms} bed{unit.bedrooms !== 1 ? 's' : ''}</span>
                            )}
                            {unit.bathrooms > 0 && (
                              <span>{unit.bathrooms} bath{unit.bathrooms !== 1 ? 's' : ''}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Available
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
          <div>
            {selectedUnit && (
              <p className="text-sm text-gray-600">
                Selected: <span className="font-semibold">Unit {selectedUnit.unit_number}</span>
              </p>
            )}
          </div>
          <div className="flex space-x-3">
            <button
              onClick={onClose}
              disabled={assigning}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleAssignUnit}
              disabled={!selectedUnit || assigning}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
            >
              {assigning ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Assigning...
                </>
              ) : (
                <>
                  <Users className="w-4 h-4 mr-2" />
                  Assign Unit
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AssignUnitModal;