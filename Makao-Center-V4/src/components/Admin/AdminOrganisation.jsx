import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Bed, 
  Key,
  DollarSign,
  AlertTriangle,
  X,
  Building2,
  Plus,
  Trash2,
  Home,
  MapPin,
  Edit,
  CheckCircle,
  Ban
} from 'lucide-react';
import { useAppContext } from '../../context/AppContext';
import { useToast } from '../../context/ToastContext';
import { NavLink } from "react-router-dom";

// Confirmation Dialog Component
const ConfirmationDialog = ({ isOpen, onClose, onConfirm, unit, actionType }) => {
  if (!isOpen) return null;

  const getDialogContent = () => {
    if (actionType === 'availability') {
      return {
        title: 'Confirm Availability Change',
        message: 'Are you sure you want to change the availability status for:',
        confirmText: 'Confirm Change',
        icon: <AlertTriangle className="w-6 h-6 text-yellow-500 mr-2" />
      };
    } else if (actionType === 'delete') {
      return {
        title: 'Delete Unit',
        message: 'Are you sure you want to delete this unit? This action cannot be undone:',
        confirmText: 'Delete Unit',
        icon: <AlertTriangle className="w-6 h-6 text-red-500 mr-2" />
      };
    }
    return {
      title: 'Confirm Action',
      message: 'Are you sure you want to proceed?',
      confirmText: 'Confirm',
      icon: <AlertTriangle className="w-6 h-6 text-yellow-500 mr-2" />
    };
  };

  const content = getDialogContent();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center">
            {content.icon}
            <h3 className="text-lg font-semibold">{content.title}</h3>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-6">
          <p className="text-gray-700 mb-4">
            {content.message}
          </p>
          <div className="bg-gray-50 rounded-lg p-4 mb-4">
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="font-medium text-gray-600">Unit:</div>
              <div className="font-semibold">{unit?.unit_number}</div>
              
              <div className="font-medium text-gray-600">Property:</div>
              <div>{unit?.property?.name || 'N/A'}</div>
              
              <div className="font-medium text-gray-600">Type:</div>
              <div>{unit?.unit_type?.name || 'N/A'}</div>
              
              {actionType === 'availability' && (
                <>
                  <div className="font-medium text-gray-600">Current Status:</div>
                  <div>
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      unit?.is_available 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {unit?.is_available ? 'available' : 'occupied'}
                    </span>
                  </div>
                  
                  <div className="font-medium text-gray-600">New Status:</div>
                  <div>
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      !unit?.is_available 
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {!unit?.is_available ? 'available' : 'occupied'}
                    </span>
                  </div>
                </>
              )}
              
              {actionType === 'delete' && (
                <>
                  <div className="font-medium text-gray-600">Rent:</div>
                  <div className="font-semibold">KSh {unit?.rent?.toLocaleString() || '0'}</div>
                  
                  <div className="font-medium text-gray-600">Current Status:</div>
                  <div>
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      unit?.is_available 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {unit?.is_available ? 'Available' : 'Occupied'}
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>
          
          {actionType === 'delete' && unit?.tenant && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
              <div className="flex items-center">
                <AlertTriangle className="w-4 h-4 text-red-500 mr-2" />
                <p className="text-red-700 text-sm font-medium">Warning: This unit has an assigned tenant!</p>
              </div>
              <p className="text-red-600 text-xs mt-1">
                Deleting this unit will also remove the tenant assignment. The tenant will need to be reassigned to another unit.
              </p>
            </div>
          )}
        </div>

        <div className="flex gap-3 p-6 border-t bg-gray-50">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 font-medium"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
              actionType === 'delete' 
                ? 'bg-red-600 text-white hover:bg-red-700' 
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            {content.confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

// Edit Unit Dialog
const EditUnitDialog = ({ isOpen, onClose, onUpdate, unit, unitTypes = [], properties = [] }) => {
  const [unitData, setUnitData] = useState({
    property_obj: '',
    unit_number: '',
    unit_type: '',
    bedrooms: '',
    bathrooms: '',
    floor: '',
    rent: '',
    deposit: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { showToast } = useToast();

  // Initialize form when dialog opens or unit changes
  useEffect(() => {
    if (isOpen && unit) {
      setUnitData({
        property_obj: unit.property?.id || '',
        unit_number: unit.unit_number || '',
        unit_type: unit.unit_type?.id || '',
        bedrooms: unit.bedrooms || '',
        bathrooms: unit.bathrooms || '',
        floor: unit.floor || '',
        rent: unit.rent || '',
        deposit: unit.deposit || ''
      });
    }
  }, [isOpen, unit]);

  const handleSubmit = async () => {
    if (!unitData.property_obj || !unitData.unit_number) {
      showToast('Please fill in all required fields', 'error');
      return;
    }

    setIsSubmitting(true);

    try {
      const submitData = {
        property_obj: parseInt(unitData.property_obj),
        unit_number: unitData.unit_number.trim(),
        unit_type: unitData.unit_type ? parseInt(unitData.unit_type) : null,
        bedrooms: unitData.bedrooms ? parseInt(unitData.bedrooms) : 0,
        bathrooms: unitData.bathrooms ? parseInt(unitData.bathrooms) : 1,
        floor: unitData.floor ? parseInt(unitData.floor) : 0,
        rent: unitData.rent ? parseFloat(unitData.rent) : 0,
        deposit: unitData.deposit ? parseFloat(unitData.deposit) : 0
      };

      await onUpdate(unit.id, submitData);
      showToast(`Unit ${unitData.unit_number} updated successfully`, 'success');
      onClose();
      
    } catch (error) {
      console.error('Error updating unit:', error);
      const errorMessage = error.response?.data?.error || error.message || 'Failed to update unit. Please try again.';
      showToast(errorMessage, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen || !unit) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl my-8 mx-auto flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-white rounded-t-xl">
          <div>
            <h3 className="text-xl font-bold text-gray-900">Edit Unit</h3>
            <p className="text-sm text-gray-600 mt-1">Update unit details for {unit.unit_number}</p>
          </div>
          <button 
            onClick={onClose} 
            className="text-gray-400 hover:text-gray-600 transition-colors p-2 hover:bg-gray-100 rounded-lg"
            disabled={isSubmitting}
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        
        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Property Selection */}
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Property <span className="text-red-500">*</span>
              </label>
              <select
                value={unitData.property_obj}
                onChange={(e) => setUnitData({...unitData, property_obj: e.target.value})}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                disabled={isSubmitting}
              >
                <option value="">Select a property</option>
                {Array.isArray(properties) && properties.map(property => (
                  <option key={property.id} value={property.id}>
                    {property.name} - {property.city}, {property.state}
                  </option>
                ))}
              </select>
            </div>
            
            {/* Unit Number */}
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Unit Number <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={unitData.unit_number}
                onChange={(e) => setUnitData({...unitData, unit_number: e.target.value})}
                placeholder="e.g., A101, 201, G-01"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                disabled={isSubmitting}
              />
            </div>
            
            {/* Unit Type */}
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Unit Type
              </label>
              <select
                value={unitData.unit_type}
                onChange={(e) => setUnitData({...unitData, unit_type: e.target.value})}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                disabled={isSubmitting}
              >
                <option value="">Select unit type</option>
                {Array.isArray(unitTypes) && unitTypes.map(ut => (
                  <option key={ut.id} value={ut.id}>
                    {ut.name} - KSh {ut.rent ? ut.rent.toLocaleString() : '0'}/month
                  </option>
                ))}
              </select>
            </div>

            {/* Bedrooms & Bathrooms */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Bedrooms
              </label>
              <input
                type="number"
                value={unitData.bedrooms}
                onChange={(e) => setUnitData({...unitData, bedrooms: e.target.value})}
                placeholder="0"
                min="0"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                disabled={isSubmitting}
              />
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Bathrooms
              </label>
              <input
                type="number"
                value={unitData.bathrooms}
                onChange={(e) => setUnitData({...unitData, bathrooms: e.target.value})}
                placeholder="0"
                min="0"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                disabled={isSubmitting}
              />
            </div>

            {/* Floor */}
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Floor Level
              </label>
              <input
                type="number"
                value={unitData.floor}
                onChange={(e) => setUnitData({...unitData, floor: e.target.value})}
                placeholder="e.g., 1, 2, 3 (0 for ground floor)"
                min="0"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                disabled={isSubmitting}
              />
            </div>

            {/* Rent & Deposit */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Monthly Rent (KSh) <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">KSh</span>
                <input
                  type="number"
                  value={unitData.rent}
                  onChange={(e) => setUnitData({...unitData, rent: e.target.value})}
                  placeholder="25000"
                  min="0"
                  step="100"
                  className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  disabled={isSubmitting}
                  required
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Security Deposit (KSh)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">KSh</span>
                <input
                  type="number"
                  value={unitData.deposit}
                  onChange={(e) => setUnitData({...unitData, deposit: e.target.value})}
                  placeholder="25000"
                  min="0"
                  step="100"
                  className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  disabled={isSubmitting}
                />
              </div>
            </div>
          </div>

          {/* Required Fields Note */}
          <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-sm text-blue-700 flex items-center">
              <AlertTriangle className="w-4 h-4 mr-2" />
              Fields marked with <span className="text-red-500 mx-1">*</span> are required
            </p>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex gap-3 p-6 border-t border-gray-200 bg-gray-50 rounded-b-xl">
          <button
            onClick={onClose}
            className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 font-medium transition-colors disabled:opacity-50"
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors disabled:bg-blue-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Updating Unit...
              </>
            ) : (
              <>
                <CheckCircle className="w-5 h-5" />
                Update Unit
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

// Add Unit Type Dialog
const AddUnitTypeDialog = ({ isOpen, onClose, onAdd }) => {
  const [unitType, setUnitType] = useState({ 
    name: '', 
    rent: '', 
    deposit: '',
    description: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { showToast } = useToast();

  // Reset form when dialog opens
  useEffect(() => {
    if (isOpen) {
      setUnitType({ 
        name: '', 
        rent: '', 
        deposit: '',
        description: '' 
      });
      setIsSubmitting(false);
    }
  }, [isOpen]);

  const handleSubmit = async () => {
    if (!unitType.name.trim()) {
      showToast('Please enter a unit type name', 'error');
      return;
    }

    if (!unitType.rent || parseFloat(unitType.rent) <= 0) {
      showToast('Please enter a valid rent amount', 'error');
      return;
    }

    setIsSubmitting(true);

    try {
      const submitData = {
        name: unitType.name.trim(),
        rent: parseFloat(unitType.rent),
        deposit: unitType.deposit ? parseFloat(unitType.deposit) : 0,
        description: unitType.description.trim() || ''
      };

      console.log('Submitting unit type data:', submitData);
      
      await onAdd(submitData);
      
      setUnitType({ 
        name: '', 
        rent: '', 
        deposit: '',
        description: '' 
      });
      
      showToast(`Unit type "${submitData.name}" added successfully!`, 'success');
      
    } catch (error) {
      console.error('Error adding unit type:', error);
      const errorMessage = error.response?.data?.error || error.message || 'Failed to add unit type. Please try again.';
      showToast(errorMessage, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl my-8 mx-auto flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-white rounded-t-xl">
          <div>
            <h3 className="text-xl font-bold text-gray-900">Add New Unit Type</h3>
            <p className="text-sm text-gray-600 mt-1">Define a new type of rental unit</p>
          </div>
          <button 
            onClick={onClose} 
            className="text-gray-400 hover:text-gray-600 transition-colors p-2 hover:bg-gray-100 rounded-lg"
            disabled={isSubmitting}
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        
        {/* Form Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-4">
            {/* Unit Type Name */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Unit Type Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={unitType.name}
                onChange={(e) => setUnitType({...unitType, name: e.target.value})}
                placeholder="e.g., Studio, 1 Bedroom, 2 Bedroom Deluxe"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                disabled={isSubmitting}
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Description (Optional)
              </label>
              <textarea
                value={unitType.description}
                onChange={(e) => setUnitType({...unitType, description: e.target.value})}
                placeholder="Brief description of this unit type..."
                rows="3"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-none"
                disabled={isSubmitting}
              />
            </div>

            {/* Monthly Rent */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Monthly Rent (KSh) <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">KSh</span>
                <input
                  type="number"
                  value={unitType.rent}
                  onChange={(e) => setUnitType({...unitType, rent: e.target.value})}
                  placeholder="25000"
                  min="0"
                  step="100"
                  className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  disabled={isSubmitting}
                />
              </div>
            </div>

            {/* Security Deposit */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Security Deposit (KSh)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">KSh</span>
                <input
                  type="number"
                  value={unitType.deposit}
                  onChange={(e) => setUnitType({...unitType, deposit: e.target.value})}
                  placeholder="25000"
                  min="0"
                  step="100"
                  className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  disabled={isSubmitting}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex gap-3 p-6 border-t border-gray-200 bg-gray-50 rounded-b-xl">
          <button
            onClick={onClose}
            className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 font-medium transition-colors disabled:opacity-50"
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors disabled:bg-blue-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Adding...
              </>
            ) : (
              <>
                <Plus className="w-5 h-5" />
                Add Unit Type
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

// Add Unit Dialog
const AddUnitDialog = ({ isOpen, onClose, onAdd, unitTypes = [], properties = [] }) => {
  const [unitData, setUnitData] = useState({
    property_obj: '',
    unit_number: '',
    unit_type: '',
    bedrooms: '',
    bathrooms: '',
    floor: '',
    rent: '',
    deposit: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset form when dialog opens
  useEffect(() => {
    if (isOpen) {
      setUnitData({
        property_obj: '',
        unit_number: '',
        unit_type: '',
        bedrooms: '',
        bathrooms: '',
        floor: '',
        rent: '',
        deposit: ''
      });
      setIsSubmitting(false);
    }
  }, [isOpen]);

  // Auto-fill rent and deposit from unit type
  useEffect(() => {
    if (isOpen && unitData.unit_type) {
      const selectedUnitType = Array.isArray(unitTypes) 
        ? unitTypes.find(ut => ut.id === parseInt(unitData.unit_type))
        : null;
        
      if (selectedUnitType) {
        setUnitData(prev => ({
          ...prev,
          rent: prev.rent || selectedUnitType.rent || '',
          deposit: prev.deposit || selectedUnitType.deposit || ''
        }));
      }
    }
  }, [unitData.unit_type, isOpen, unitTypes]);

  const selectedUnitType = Array.isArray(unitTypes) 
    ? unitTypes.find(ut => ut.id === parseInt(unitData.unit_type))
    : null;

  const handleSubmit = async () => {
    if (!unitData.property_obj || !unitData.unit_number || !unitData.unit_type) {
      alert('Please fill in all required fields (Property, Unit Number, and Unit Type)');
      return;
    }

    if (!unitData.unit_number.trim()) {
      alert('Please enter a valid unit number');
      return;
    }

    setIsSubmitting(true);

    try {
      const submitData = {
        property_obj: parseInt(unitData.property_obj),
        unit_number: unitData.unit_number.trim(),
        unit_type: parseInt(unitData.unit_type),
        bedrooms: unitData.bedrooms ? parseInt(unitData.bedrooms) : 0,
        bathrooms: unitData.bathrooms ? parseInt(unitData.bathrooms) : 1,
        floor: unitData.floor ? parseInt(unitData.floor) : 0,
        rent: unitData.rent ? parseFloat(unitData.rent) : 0,
        deposit: unitData.deposit ? parseFloat(unitData.deposit) : 0,
        is_available: true
      };

      await onAdd(submitData);
      
      setUnitData({
        property_obj: '',
        unit_number: '',
        unit_type: '',
        bedrooms: '',
        bathrooms: '',
        floor: '',
        rent: '',
        deposit: ''
      });
      
    } catch (error) {
      console.error('Error adding unit:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl my-8 mx-auto flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-white rounded-t-xl">
          <div>
            <h3 className="text-xl font-bold text-gray-900">Add New Rental Unit</h3>
            <p className="text-sm text-gray-600 mt-1">Fill in the details for the new rental unit</p>
          </div>
          <button 
            onClick={onClose} 
            className="text-gray-400 hover:text-gray-600 transition-colors p-2 hover:bg-gray-100 rounded-lg"
            disabled={isSubmitting}
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        
        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Property Selection */}
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Property <span className="text-red-500">*</span>
              </label>
              <select
                value={unitData.property_obj}
                onChange={(e) => setUnitData({...unitData, property_obj: e.target.value})}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                disabled={isSubmitting}
              >
                <option value="">Select a property</option>
                {Array.isArray(properties) && properties.map(property => (
                  <option key={property.id} value={property.id}>
                    {property.name} - {property.city}, {property.state}
                  </option>
                ))}
              </select>
            </div>
            
            {/* Unit Number */}
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Unit Number <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={unitData.unit_number}
                onChange={(e) => setUnitData({...unitData, unit_number: e.target.value})}
                placeholder="e.g., A101, 201, G-01"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                disabled={isSubmitting}
              />
            </div>
            
            {/* Unit Type */}
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Unit Type <span className="text-red-500">*</span>
              </label>
              <select
                value={unitData.unit_type}
                onChange={(e) => setUnitData({...unitData, unit_type: e.target.value})}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                disabled={isSubmitting}
              >
                <option value="">Select unit type</option>
                {Array.isArray(unitTypes) && unitTypes.map(ut => (
                  <option key={ut.id} value={ut.id}>
                    {ut.name} - KSh {ut.rent ? ut.rent.toLocaleString() : '0'}/month
                  </option>
                ))}
              </select>
            </div>

            {/* Bedrooms & Bathrooms */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Bedrooms
              </label>
              <input
                type="number"
                value={unitData.bedrooms}
                onChange={(e) => setUnitData({...unitData, bedrooms: e.target.value})}
                placeholder="0"
                min="0"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                disabled={isSubmitting}
              />
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Bathrooms
              </label>
              <input
                type="number"
                value={unitData.bathrooms}
                onChange={(e) => setUnitData({...unitData, bathrooms: e.target.value})}
                placeholder="0"
                min="0"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                disabled={isSubmitting}
              />
            </div>

            {/* Floor */}
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Floor Level
              </label>
              <input
                type="number"
                value={unitData.floor}
                onChange={(e) => setUnitData({...unitData, floor: e.target.value})}
                placeholder="e.g., 1, 2, 3 (0 for ground floor)"
                min="0"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                disabled={isSubmitting}
              />
            </div>

            {/* Rent & Deposit */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Monthly Rent (KSh) <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">KSh</span>
                <input
                  type="number"
                  value={unitData.rent || selectedUnitType?.rent || ''}
                  onChange={(e) => setUnitData({...unitData, rent: e.target.value})}
                  placeholder="25000"
                  min="0"
                  step="100"
                  className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  disabled={isSubmitting}
                  required
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Security Deposit (KSh)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">KSh</span>
                <input
                  type="number"
                  value={unitData.deposit || selectedUnitType?.deposit || ''}
                  onChange={(e) => setUnitData({...unitData, deposit: e.target.value})}
                  placeholder="25000"
                  min="0"
                  step="100"
                  className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  disabled={isSubmitting}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex gap-3 p-6 border-t border-gray-200 bg-gray-50 rounded-b-xl">
          <button
            onClick={onClose}
            className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 font-medium transition-colors disabled:opacity-50"
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors disabled:bg-blue-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Adding Unit...
              </>
            ) : (
              <>
                <Plus className="w-5 h-5" />
                Add Unit
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

const AdminOrganisation = () => {
  const { 
    units = [],
    unitsLoading,
    properties = [],
    propertiesLoading,
    tenants = [],
    reports = [],
    unitTypes = [],
    selectedPropertyId,
    setSelectedPropertyId,
    addUnit,
    updateUnit,
    updateUnitAvailability,
    addUnitType,
    refreshData
  } = useAppContext();
  
  const { showToast } = useToast();
  
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, unit: null, actionType: 'availability' });
  const [unitTypeDialog, setUnitTypeDialog] = useState(false);
  const [addUnitDialog, setAddUnitDialog] = useState(false);
  const [editUnitDialog, setEditUnitDialog] = useState({ isOpen: false, unit: null });
  const [updatingUnits, setUpdatingUnits] = useState(new Set());

  // Filter data by selected property with safe array checks
  const propertyUnits = selectedPropertyId 
    ? (Array.isArray(units) ? units.filter(unit => unit.property?.id === parseInt(selectedPropertyId)) : [])
    : (Array.isArray(units) ? units : []);

  const propertyTenants = selectedPropertyId
    ? (Array.isArray(tenants) ? tenants.filter(tenant => tenant.unit?.property?.id === parseInt(selectedPropertyId)) : [])
    : (Array.isArray(tenants) ? tenants : []);

  const propertyReports = selectedPropertyId
    ? (Array.isArray(reports) ? reports.filter(report => report.unit?.property?.id === parseInt(selectedPropertyId)) : [])
    : (Array.isArray(reports) ? reports : []);

  // SAFE: Check if properties is array before using find
  const currentProperty = Array.isArray(properties) 
    ? properties.find(p => p.id === parseInt(selectedPropertyId))
    : null;

  // Open confirmation dialog
  const openConfirmDialog = (unit, actionType = 'availability') => {
    setConfirmDialog({ isOpen: true, unit: unit, actionType });
  };

  const closeConfirmDialog = () => {
    setConfirmDialog({ isOpen: false, unit: null, actionType: 'availability' });
  };

  // Toggle unit availability with confirmation
  const handleConfirmToggle = async () => {
    const unitToUpdate = confirmDialog.unit;
    
    setUpdatingUnits(prev => new Set(prev).add(unitToUpdate.id));
    
    try {
      await updateUnitAvailability(unitToUpdate.id, !unitToUpdate.is_available);
      showToast(
        `Unit ${unitToUpdate.unit_number} marked as ${!unitToUpdate.is_available ? 'available' : 'occupied'}`,
        'success'
      );
      await refreshData();
    } catch (error) {
      console.error('Error updating unit availability:', error);
      showToast('Failed to update unit availability', 'error');
    } finally {
      setUpdatingUnits(prev => {
        const newSet = new Set(prev);
        newSet.delete(unitToUpdate.id);
        return newSet;
      });
      closeConfirmDialog();
    }
  };

  // Handle delete unit
  const handleDeleteUnit = async () => {
    const unitToDelete = confirmDialog.unit;
    
    setUpdatingUnits(prev => new Set(prev).add(unitToDelete.id));
    
    try {
      const response = await fetch(`http://127.0.0.1:8000/api/accounts/units/${unitToDelete.id}/update/`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
        },
      });

      if (response.ok) {
        showToast(`Unit ${unitToDelete.unit_number} deleted successfully`, 'success');
        await refreshData();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete unit');
      }
    } catch (error) {
      console.error('Error deleting unit:', error);
      showToast(error.message || 'Failed to delete unit', 'error');
    } finally {
      setUpdatingUnits(prev => {
        const newSet = new Set(prev);
        newSet.delete(unitToDelete.id);
        return newSet;
      });
      closeConfirmDialog();
    }
  };

  const handleAddUnitType = async (unitTypeData) => {
    try {
      console.log('Adding unit type with data:', unitTypeData);
      
      if (!addUnitType) {
        throw new Error('addUnitType function not available in context');
      }
      
      await addUnitType(unitTypeData);
      
      // Refresh data to show the new unit type
      if (refreshData) {
        await refreshData();
      }
      
      setUnitTypeDialog(false);
      
    } catch (error) {
      console.error('Error adding unit type:', error);
      const errorMessage = error.response?.data?.error || error.message || 'Failed to add unit type. Please try again.';
      showToast(errorMessage, 'error');
      throw error;
    }
  };

  // Handle adding unit
  const handleAddUnit = async (unitData) => {
    try {
      console.log('Adding unit with data:', unitData);
      
      await addUnit(unitData);
      showToast(`Unit ${unitData.unit_number} added successfully`, 'success');
      setAddUnitDialog(false);
      
      // Refresh data to show the new unit
      if (refreshData) {
        await refreshData();
      }
    } catch (error) {
      console.error('Error adding unit:', error);
      const errorMessage = error.response?.data?.error || error.message || 'Failed to add unit. Please try again.';
      showToast(errorMessage, 'error');
      throw error;
    }
  };

  // Handle updating unit
  const handleUpdateUnit = async (unitId, unitData) => {
    try {
      await updateUnit(unitId, unitData);
      showToast(`Unit updated successfully`, 'success');
      setEditUnitDialog({ isOpen: false, unit: null });
      
      if (refreshData) {
        await refreshData();
      }
    } catch (error) {
      console.error('Error updating unit:', error);
      const errorMessage = error.response?.data?.error || error.message || 'Failed to update unit. Please try again.';
      showToast(errorMessage, 'error');
      throw error;
    }
  };

  // Calculate statistics from actual data with safe array checks
  const calculateMetrics = () => {
    const totalUnits = propertyUnits.length;
    const availableUnits = propertyUnits.filter(unit => unit.is_available).length;
    const occupiedUnits = propertyUnits.filter(unit => !unit.is_available).length;
    
    const totalRevenue = propertyUnits
      .filter(unit => !unit.is_available)
      .reduce((sum, unit) => sum + (parseFloat(unit.rent) || 0), 0);
    
    const occupancyRate = totalUnits > 0 ? ((occupiedUnits / totalUnits) * 100).toFixed(0) : 0;

    return {
      totalUnits,
      availableUnits,
      occupiedUnits,
      totalRevenue,
      occupancyRate,
      totalTenants: propertyTenants.length
    };
  };

  const metrics = calculateMetrics();

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  if (propertiesLoading || unitsLoading) {
    return (
      <div className="space-y-6">
        <div className="bg-white p-6 rounded-lg shadow animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white p-6 rounded-lg shadow animate-pulse">
              <div className="h-4 bg-gray-200 rounded mb-2"></div>
              <div className="h-8 bg-gray-200 rounded mb-2"></div>
              <div className="h-3 bg-gray-200 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <ConfirmationDialog
        isOpen={confirmDialog.isOpen}
        onClose={closeConfirmDialog}
        onConfirm={confirmDialog.actionType === 'delete' ? handleDeleteUnit : handleConfirmToggle}
        unit={confirmDialog.unit}
        actionType={confirmDialog.actionType}
      />

      <EditUnitDialog
        isOpen={editUnitDialog.isOpen}
        onClose={() => setEditUnitDialog({ isOpen: false, unit: null })}
        onUpdate={handleUpdateUnit}
        unit={editUnitDialog.unit}
        unitTypes={unitTypes}
        properties={properties}
      />

      <AddUnitTypeDialog
        isOpen={unitTypeDialog}
        onClose={() => setUnitTypeDialog(false)}
        onAdd={handleAddUnitType}
      />

      <AddUnitDialog
        isOpen={addUnitDialog}
        onClose={() => setAddUnitDialog(false)}
        onAdd={handleAddUnit}
        unitTypes={unitTypes}
        properties={properties}
      />

      {/* Header with Property Selector */}
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Property Management</h1>
            <p className="text-gray-600 mt-1">Manage your properties and rental units</p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
            <select
              value={selectedPropertyId || ''}
              onChange={(e) => setSelectedPropertyId(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="">All Properties</option>
              {/* SAFE: Check if properties is array before mapping */}
              {Array.isArray(properties) && properties.map(property => (
                <option key={property.id} value={property.id}>
                  {property.name} - {property.city}
                </option>
              ))}
            </select>
            
            <NavLink to="/admin/add-property">
              <button className="w-full sm:w-auto bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2 transition-colors">
                <Plus className="w-5 h-5" />
                Add New Property
              </button>
            </NavLink>
          </div>
        </div>
      </div>

      {/* Property Info Banner */}
      {currentProperty && (
        <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-lg">
          <div className="flex items-start">
            <Building2 className="w-5 h-5 text-blue-600 mr-3 mt-0.5" />
            <div className="flex-1">
              <p className="font-semibold text-blue-900">
                Viewing: {currentProperty.name}
              </p>
              <div className="flex flex-wrap items-center gap-4 mt-1">
                <div className="flex items-center text-sm text-blue-700">
                  <MapPin className="w-4 h-4 mr-1" />
                  {currentProperty.city}, {currentProperty.state}
                </div>
                <div className="flex items-center text-sm text-blue-700">
                  <Home className="w-4 h-4 mr-1" />
                  {currentProperty.unit_count} units total
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Total Tenants</p>
              <p className="text-3xl font-bold text-gray-900">{metrics.totalTenants}</p>
              <p className="text-gray-600 text-sm">Active tenants</p>
            </div>
            <Users className="w-8 h-8 text-blue-500" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Total Units</p>
              <p className="text-3xl font-bold text-gray-900">{metrics.totalUnits}</p>
              <p className="text-gray-600 text-sm">
                {currentProperty ? 'In this property' : 'Across all properties'}
              </p>
            </div>
            <Bed className="w-8 h-8 text-green-500" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Available Units</p>
              <p className="text-3xl font-bold text-gray-900">{metrics.availableUnits}</p>
              <p className="text-gray-600 text-sm">Ready for tenants</p>
            </div>
            <Key className="w-8 h-8 text-yellow-500" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Occupancy Rate</p>
              <p className="text-3xl font-bold text-gray-900">{metrics.occupancyRate}%</p>
              <p className="text-gray-600 text-sm">{metrics.occupiedUnits}/{metrics.totalUnits} occupied</p>
            </div>
            <DollarSign className="w-8 h-8 text-purple-500" />
          </div>
        </div>
      </div>

      {/* Additional Revenue Card */}
      {metrics.totalRevenue > 0 && (
        <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-6 rounded-lg shadow text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm">Monthly Revenue</p>
              <p className="text-3xl font-bold">{formatCurrency(metrics.totalRevenue)}</p>
              <p className="text-green-100 text-sm">From occupied units</p>
            </div>
            <DollarSign className="w-8 h-8 text-white" />
          </div>
        </div>
      )}

      {/* Unit Types Management */}
      <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Unit Types</h2>
          <button
            onClick={() => setUnitTypeDialog(true)}
            className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Unit Type
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* SAFE: Check if unitTypes is array before mapping */}
          {Array.isArray(unitTypes) && unitTypes.map(unitType => (
            <div key={unitType.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">{unitType.name}</h3>
                  <div className="mt-2 space-y-1">
                    <p className="text-lg text-blue-600 font-bold">
                      {formatCurrency(unitType.rent)}/month
                    </p>
                    {unitType.deposit > 0 && (
                      <p className="text-sm text-gray-600">
                        Deposit: {formatCurrency(unitType.deposit)}
                      </p>
                    )}
                  </div>
                </div>
                <button 
                  onClick={() => {/* Implement delete */}}
                  className="text-red-400 hover:text-red-600 transition-colors ml-2"
                  title="Delete unit type"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
          
          {(!Array.isArray(unitTypes) || unitTypes.length === 0) && (
            <div className="col-span-full text-center py-8 text-gray-500">
              <Bed className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p>No unit types defined.</p>
              <p className="text-sm mt-1">Click "Add Unit Type" to create your first unit type.</p>
            </div>
          )}
        </div>
      </div>

      {/* Unit Management Section */}
      <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-xl font-semibold">Unit Management</h2>
            <p className="text-sm text-gray-500 mt-1">
              {currentProperty 
                ? `Managing units for ${currentProperty.name}`
                : 'Viewing units across all properties'
              }
            </p>
          </div>
          <button
            onClick={() => setAddUnitDialog(true)}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Rental Unit
          </button>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-gray-50">
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Unit</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Property</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Type</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Bed/Bath</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Rent (KSh)</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Tenant</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Status</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {/* SAFE: Check if propertyUnits is array before mapping */}
              {Array.isArray(propertyUnits) && propertyUnits.map(unit => (
                <tr key={unit.id} className="border-b hover:bg-gray-50 transition-colors">
                  <td className="py-3 px-4 font-medium">
                    <div>
                      <div className="font-semibold">{unit.unit_number}</div>
                      {unit.unit_code && (
                        <div className="text-xs text-gray-500">{unit.unit_code}</div>
                      )}
                    </div>
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-600">
                    {unit.property?.name || 'N/A'}
                  </td>
                  <td className="py-3 px-4">
                    {unit.unit_type?.name || 'N/A'}
                  </td>
                  <td className="py-3 px-4 text-sm">
                    {unit.bedrooms || 0} bed / {unit.bathrooms || 0} bath
                    {unit.floor && ` • Floor ${unit.floor}`}
                  </td>
                  <td className="py-3 px-4 font-semibold">
                    {formatCurrency(unit.rent)}
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-600">
                    {unit.tenant ? (
                      <div>
                        <div className="font-medium">{unit.tenant.name}</div>
                        <div className="text-xs">{unit.tenant.email}</div>
                      </div>
                    ) : (
                      '-'
                    )}
                  </td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      unit.is_available 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {unit.is_available ? 'Available' : 'Occupied'}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => setEditUnitDialog({ isOpen: true, unit })}
                        className="text-blue-600 hover:text-blue-800 p-1 rounded transition-colors"
                        title="Edit Unit"
                        disabled={updatingUnits.has(unit.id)}
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => openConfirmDialog(unit, 'availability')}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                          unit.is_available ? 'bg-green-500' : 'bg-gray-300'
                        } ${updatingUnits.has(unit.id) ? 'opacity-50 cursor-not-allowed' : ''}`}
                        title={`Mark as ${unit.is_available ? 'occupied' : 'available'}`}
                        disabled={updatingUnits.has(unit.id)}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            unit.is_available ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                      <button
                        onClick={() => openConfirmDialog(unit, 'delete')}
                        className="text-red-600 hover:text-red-800 p-1 rounded transition-colors"
                        title="Delete Unit"
                        disabled={updatingUnits.has(unit.id)}
                      >
                        {updatingUnits.has(unit.id) ? (
                          <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {(!Array.isArray(propertyUnits) || propertyUnits.length === 0) && (
            <div className="text-center py-12 text-gray-500">
              <Home className="w-12 w-12 text-gray-300 mx-auto mb-3" />
              <p>No rental units found.</p>
              <p className="text-sm mt-1">
                {currentProperty 
                  ? `Click "Add Rental Unit" to add units to ${currentProperty.name}.`
                  : 'Select a property or add units to get started.'
                }
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <AlertTriangle className="w-5 h-5 mr-2 text-orange-500" />
            Recent Reports
          </h3>
          <div className="space-y-3">
            {/* SAFE: Check if propertyReports is array before mapping */}
            {Array.isArray(propertyReports) && propertyReports.slice(0, 3).map(report => (
              <div key={report.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border">
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{report.title}</p>
                  <div className="flex items-center text-sm text-gray-600 mt-1">
                    <span>{report.tenant?.name || 'Unknown Tenant'}</span>
                    {report.unit && (
                      <>
                        <span className="mx-2">•</span>
                        <span>Unit {report.unit.unit_number}</span>
                      </>
                    )}
                  </div>
                </div>
                <span className={`px-2 py-1 text-xs rounded-full ${
                  report.priority === 'urgent' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {report.priority}
                </span>
              </div>
            ))}
            
            {(!Array.isArray(propertyReports) || propertyReports.length === 0) && (
              <div className="text-center py-8 text-gray-500">
                <AlertTriangle className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                <p>No reports found</p>
              </div>
            )}
          </div>
          <NavLink to="/landlord-dashboard/reports">
            <button className="w-full mt-4 px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-900 transition-colors">
              View All Reports
            </button>
          </NavLink>
        </div>

        <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <Users className="w-5 h-5 mr-2 text-blue-500" />
            Recent Tenants
          </h3>
          <div className="space-y-3">
            {/* SAFE: Check if propertyTenants is array before mapping */}
            {Array.isArray(propertyTenants) && propertyTenants.slice(0, 3).map(tenant => (
              <div key={tenant.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border">
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{tenant.name}</p>
                  <div className="flex items-center text-sm text-gray-600 mt-1">
                    <span>{tenant.email}</span>
                    {tenant.unit && (
                      <>
                        <span className="mx-2">•</span>
                        <span>Unit {tenant.unit.unit_number}</span>
                      </>
                    )}
                  </div>
                </div>
                <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                  Active
                </span>
              </div>
            ))}
            
            {(!Array.isArray(propertyTenants) || propertyTenants.length === 0) && (
              <div className="text-center py-8 text-gray-500">
                <Users className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                <p>No tenants found</p>
              </div>
            )}
          </div>
          <NavLink to="/landlord-dashboard/tenants">
            <button className="w-full mt-4 px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-900 transition-colors">
              View All Tenants
            </button>
          </NavLink>
        </div>
      </div>
    </div>
  );
};

export default AdminOrganisation;