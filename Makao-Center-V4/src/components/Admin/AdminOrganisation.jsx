import React, { useContext, useState, useEffect, useMemo } from 'react';
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
  RefreshCw,
  Upload
} from 'lucide-react';
import { AppContext } from '../../context/AppContext';
import { useToast } from '../../context/ToastContext';
import { NavLink, useNavigate } from "react-router-dom";
import { propertiesAPI, communicationAPI, tenantsAPI } from '../../services/api';

// Confirmation Dialog Component
const ConfirmationDialog = ({ isOpen, onClose, onConfirm, room }) => {
  if (!isOpen) return null;

  const hasTenant = room?.hasTenant || room?.tenant;
  const currentStatus = hasTenant ? 'occupied' : (room?.isAvailable ? 'available' : 'unavailable');
  const newStatus = room?.isAvailable ? 'unavailable' : 'available';

  return (
    <div className="fixed inset-0 bg-opacity-40 backdrop-blur-sm flex items-center justify-center z-50 p-4 ">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center">
            <AlertTriangle className="w-6 h-6 text-yellow-500 mr-2" />
            <h3 className="text-lg font-semibold">Confirm Availability Change</h3>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-6">
          <p className="text-gray-700 mb-4">
            Are you sure you want to change the availability status for:
          </p>
          <div className="bg-gray-50 rounded-lg p-4 mb-4">
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="font-medium text-gray-600">Room:</div>
              <div className="font-semibold">{room?.unitNumber}</div>
              
              <div className="font-medium text-gray-600">Type:</div>
              <div>{room?.type}</div>
              
              <div className="font-medium text-gray-600">Current Status:</div>
              <div>
                <span className={`px-2 py-1 text-xs rounded-full ${
                  currentStatus === 'available' 
                    ? 'bg-green-100 text-green-800' 
                    : currentStatus === 'occupied'
                    ? 'bg-red-100 text-red-800'
                    : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {currentStatus}
                </span>
              </div>
              
              <div className="font-medium text-gray-600">New Status:</div>
              <div>
                <span className={`px-2 py-1 text-xs rounded-full ${
                  newStatus === 'available'
                    ? 'bg-green-100 text-green-800'
                    : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {newStatus}
                </span>
              </div>
            </div>
          </div>
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
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
          >
            Confirm Change
          </button>
        </div>
      </div>
    </div>
  );
};

// Add Room Type Dialog
const AddRoomTypeDialog = ({ isOpen, onClose, onAdd }) => {
  const [roomType, setRoomType] = useState({
    name: '',
    baseRent: '',
    deposit: '',
    description: ''
  });

  if (!isOpen) return null;

  const handleSubmit = async () => {
    if (!roomType.name || !roomType.baseRent) {
      alert('Please provide both name and base rent.');
      return;
    }
    // Prepare payload for backend - match Django model fields
    const payload = {
      name: roomType.name,
      rent: Number(roomType.baseRent),  // Backend expects 'rent', not 'base_rent'
      deposit: Number(roomType.deposit) || 0,  // Deposit field
      description: roomType.description || '',
      number_of_units: 0  // Required field with default
    };
    
    console.log('🚀 Creating unit type with payload:', payload);
    
    // Let the parent component handle the API call
    if (onAdd) onAdd(payload);
    setRoomType({ name: '', baseRent: '', deposit: '', description: '' });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-opacity-40 backdrop-blur-sm flex items-center justify-center z-50 p-4 ">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        <div className="flex items-center justify-between p-6 border-b">
          <h3 className="text-lg font-semibold">Add Room Type</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Room Type Name
            </label>
            <input
              type="text"
              value={roomType.name}
              onChange={(e) => setRoomType({ ...roomType, name: e.target.value })}
              placeholder="e.g., Studio, 1 Bedroom"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Base Rent (KSh)
            </label>
            <input
              type="number"
              value={roomType.baseRent}
              onChange={(e) => setRoomType({ ...roomType, baseRent: e.target.value })}
              placeholder="25000"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Deposit Amount (KSh)
            </label>
            <input
              type="number"
              value={roomType.deposit}
              onChange={(e) => setRoomType({ ...roomType, deposit: e.target.value })}
              placeholder="25000"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <input
              type="text"
              value={roomType.description}
              onChange={(e) => setRoomType({ ...roomType, description: e.target.value })}
              placeholder="Optional description"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
        <div className="flex gap-3 p-6 border-t bg-gray-50">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 font-medium"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
          >
            Add Room Type
          </button>
        </div>
      </div>
    </div>
  );
};

// Edit Room Type Dialog
const EditRoomTypeDialog = ({ isOpen, onClose, onUpdate, roomType }) => {
  const [editData, setEditData] = useState({
    name: '',
    baseRent: '',
    deposit: '',
    description: ''
  });

  useEffect(() => {
    if (isOpen && roomType) {
      setEditData({
        name: roomType.name || '',
        baseRent: String(roomType.rent || roomType.baseRent || ''),
        deposit: String(roomType.deposit || '0'),
        description: roomType.description || ''
      });
    }
  }, [isOpen, roomType]);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    if (!editData.name || !editData.baseRent) {
      alert('Please provide both name and base rent.');
      return;
    }
    // Prepare payload for backend
    const payload = {
      name: editData.name,
      rent: Number(editData.baseRent),
      deposit: Number(editData.deposit) || 0,
      description: editData.description || ''
    };
    
    console.log('🔧 Updating unit type with payload:', payload);
    
    // Let the parent component handle the API call
    if (onUpdate) onUpdate(roomType.id, payload);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-opacity-40 backdrop-blur-sm flex items-center justify-center z-50 p-4 ">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        <div className="flex items-center justify-between p-6 border-b">
          <h3 className="text-lg font-semibold">Edit Room Type</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Room Type Name
            </label>
            <input
              type="text"
              value={editData.name}
              onChange={(e) => setEditData({ ...editData, name: e.target.value })}
              placeholder="e.g., Studio, 1 Bedroom"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Base Rent (KSh)
            </label>
            <input
              type="number"
              value={editData.baseRent}
              onChange={(e) => setEditData({ ...editData, baseRent: e.target.value })}
              placeholder="25000"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Deposit Amount (KSh)
            </label>
            <input
              type="number"
              value={editData.deposit}
              onChange={(e) => setEditData({ ...editData, deposit: e.target.value })}
              placeholder="25000"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <input
              type="text"
              value={editData.description}
              onChange={(e) => setEditData({ ...editData, description: e.target.value })}
              placeholder="Optional description"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
        <div className="flex gap-3 p-6 border-t bg-gray-50">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 font-medium"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
          >
            Update Room Type
          </button>
        </div>
      </div>
    </div>
  );
};

// Add Rental Unit Dialog
const AddRentalUnitDialog = ({ isOpen, onClose, onAdd, roomTypes, propertyId }) => {
  const [unitData, setUnitData] = useState({
    unitNumber: '',
    type: '',
    rent: '',
    deposit: ''
  });

  if (!isOpen) return null;

  const handleSubmit = () => {
    if (!unitData.unitNumber || !unitData.type || !unitData.rent) {
      alert('Please fill in all required fields');
      return;
    }
    onAdd(unitData);
    setUnitData({ unitNumber: '', type: '', rent: '', deposit: '' });
  };

  return (
    <div className="fixed inset-0 bg-opacity-40 backdrop-blur-sm flex items-center justify-center z-50 p-4 ">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        <div className="flex items-center justify-between p-6 border-b">
          <h3 className="text-lg font-semibold">Add Rental Unit</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Unit Number *
            </label>
            <input
              type="text"
              value={unitData.unitNumber}
              onChange={(e) => setUnitData({ ...unitData, unitNumber: e.target.value })}
              placeholder="e.g., 101, A1"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Unit Type *
            </label>
            <select
              value={unitData.type}
              onChange={(e) => setUnitData({ ...unitData, type: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select a type</option>
              <option value="studio">Studio</option>
              <option value="1-bedroom">1 Bedroom</option>
              <option value="2-bedroom">2 Bedroom</option>
              <option value="3-bedroom">3 Bedroom</option>
              <option value="4-bedroom">4 Bedroom</option>
              <option value="5-bedroom">5 Bedroom</option>
              <option value="6-bedroom">6 Bedroom</option>
              <option value="7-bedroom">7 Bedroom</option>
              <option value="8-bedroom">8 Bedroom</option>
              {(roomTypes || []).length > 0 && <option disabled>──────────</option>}
              {(roomTypes || []).map(type => (
                <option key={type.id} value={type.id}>
                  {type.name} (Custom)
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Monthly Rent (KSh) *
            </label>
            <input
              type="number"
              value={unitData.rent}
              onChange={(e) => setUnitData({ ...unitData, rent: e.target.value })}
              placeholder="25000"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Deposit Amount (KSh)
            </label>
            <input
              type="number"
              value={unitData.deposit}
              onChange={(e) => setUnitData({ ...unitData, deposit: e.target.value })}
              placeholder="25000"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-gray-500 mt-1">Leave empty to use monthly rent as deposit</p>
          </div>
        </div>
        <div className="flex gap-3 p-6 border-t bg-gray-50">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 font-medium"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
          >
            Add Unit
          </button>
        </div>
      </div>
    </div>
  );
};

// Bulk Add Units Dialog
const BulkAddUnitsDialog = ({ isOpen, onClose, onBulkAdd, roomTypes, propertyId }) => {
  const [bulkData, setBulkData] = useState({
    type: '',
    rent: '',
    deposit: '',
    startNumber: '',
    endNumber: '',
    prefix: ''
  });
  const [previewUnits, setPreviewUnits] = useState([]);

  useEffect(() => {
    if (bulkData.startNumber && bulkData.endNumber && bulkData.type) {
      const start = parseInt(bulkData.startNumber);
      const end = parseInt(bulkData.endNumber);
      
      if (start <= end && !isNaN(start) && !isNaN(end)) {
        // Check if it's a custom room type
        const predefinedTypes = ['studio', '1-bedroom', '2-bedroom', '3-bedroom', '4-bedroom', 
                                  '5-bedroom', '6-bedroom', '7-bedroom', '8-bedroom'];
        const isCustomType = !predefinedTypes.includes(bulkData.type);
        const customType = isCustomType ? roomTypes?.find(rt => rt.id?.toString() === bulkData.type) : null;
        
        // Use custom room type defaults if no rent/deposit provided
        const rentToUse = bulkData.rent || (customType?.rent || customType?.baseRent) || '';
        const depositToUse = bulkData.deposit || (customType?.deposit || customType?.rent || customType?.baseRent) || rentToUse;
        
        const units = [];
        for (let i = start; i <= end; i++) {
          units.push({
            unitNumber: `${bulkData.prefix}${i}`,
            type: bulkData.type,
            rent: rentToUse,
            deposit: depositToUse
          });
        }
        setPreviewUnits(units);
      } else {
        setPreviewUnits([]);
      }
    } else {
      setPreviewUnits([]);
    }
  }, [bulkData, roomTypes]);

  if (!isOpen) return null;

  const handleSubmit = () => {
    // Check if it's a custom room type
    const predefinedTypes = ['studio', '1-bedroom', '2-bedroom', '3-bedroom', '4-bedroom', 
                              '5-bedroom', '6-bedroom', '7-bedroom', '8-bedroom'];
    const isCustomType = !predefinedTypes.includes(bulkData.type);
    const customType = isCustomType ? roomTypes?.find(rt => rt.id?.toString() === bulkData.type) : null;
    
    // For custom types, rent is optional (will use default from room type)
    // For predefined types, rent is required
    if (!bulkData.type || !bulkData.startNumber || !bulkData.endNumber) {
      alert('Please fill in unit type and number range');
      return;
    }
    
    if (!isCustomType && !bulkData.rent) {
      alert('Please enter monthly rent');
      return;
    }
    
    const start = parseInt(bulkData.startNumber);
    const end = parseInt(bulkData.endNumber);
    
    if (start > end) {
      alert('Start number must be less than or equal to end number');
      return;
    }
    
    if (end - start > 99) {
      alert('Cannot add more than 100 units at once');
      return;
    }
    
    // Close dialog immediately
    onClose();
    
    // Then process the units
    onBulkAdd(previewUnits);
    setBulkData({ type: '', rent: '', deposit: '', startNumber: '', endNumber: '', prefix: '' });
    setPreviewUnits([]);
  };

  // Check if it's a custom room type (ID) or predefined type (string)
  const predefinedTypes = ['studio', '1-bedroom', '2-bedroom', '3-bedroom', '4-bedroom', 
                            '5-bedroom', '6-bedroom', '7-bedroom', '8-bedroom'];
  const selectedType = predefinedTypes.includes(bulkData.type) 
    ? null // Predefined types don't have associated room type objects
    : roomTypes?.find(rt => rt.id?.toString() === bulkData.type);

  return (
    <div className="fixed inset-0 bg-opacity-40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b sticky top-0 bg-white">
          <div>
            <h3 className="text-lg font-semibold">Bulk Add Rental Units</h3>
            <p className="text-sm text-gray-500 mt-1">Add multiple units with sequential numbering</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Unit Number Prefix (Optional)
              </label>
              <input
                type="text"
                value={bulkData.prefix}
                onChange={(e) => setBulkData({ ...bulkData, prefix: e.target.value })}
                placeholder="e.g., A, B, Floor1-"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">Leave empty for just numbers</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Unit Type *
              </label>
              <select
                value={bulkData.type}
                onChange={(e) => {
                  const selectedValue = e.target.value;
                  const predefinedTypes = ['studio', '1-bedroom', '2-bedroom', '3-bedroom', '4-bedroom', 
                                            '5-bedroom', '6-bedroom', '7-bedroom', '8-bedroom'];
                  
                  // Check if it's a custom room type
                  if (!predefinedTypes.includes(selectedValue) && selectedValue) {
                    const customType = roomTypes?.find(rt => rt.id?.toString() === selectedValue);
                    if (customType) {
                      // Auto-fill rent and deposit from custom room type
                      setBulkData({ 
                        ...bulkData, 
                        type: selectedValue,
                        rent: customType.rent || customType.baseRent || '',
                        deposit: customType.deposit || customType.rent || customType.baseRent || ''
                      });
                      return;
                    }
                  }
                  
                  // For predefined types or no selection, just update the type
                  setBulkData({ ...bulkData, type: selectedValue });
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select a type</option>
                <option value="studio">Studio</option>
                <option value="1-bedroom">1 Bedroom</option>
                <option value="2-bedroom">2 Bedroom</option>
                <option value="3-bedroom">3 Bedroom</option>
                <option value="4-bedroom">4 Bedroom</option>
                <option value="5-bedroom">5 Bedroom</option>
                <option value="6-bedroom">6 Bedroom</option>
                <option value="7-bedroom">7 Bedroom</option>
                <option value="8-bedroom">8 Bedroom</option>
                {(roomTypes || []).length > 0 && <option disabled>──────────</option>}
                {(roomTypes || []).map(type => (
                  <option key={type.id} value={type.id}>
                    {type.name} (Custom)
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Start Number
              </label>
              <input
                type="number"
                value={bulkData.startNumber}
                onChange={(e) => setBulkData({ ...bulkData, startNumber: e.target.value })}
                placeholder="101"
                min="1"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                End Number
              </label>
              <input
                type="number"
                value={bulkData.endNumber}
                onChange={(e) => setBulkData({ ...bulkData, endNumber: e.target.value })}
                placeholder="110"
                min="1"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Monthly Rent (KSh) {selectedType && <span className="text-gray-500 font-normal">(Optional - defaults to {(selectedType.rent || selectedType.baseRent)?.toLocaleString()})</span>}
            </label>
            <input
              type="number"
              value={bulkData.rent}
              onChange={(e) => setBulkData({ ...bulkData, rent: e.target.value })}
              placeholder={selectedType ? `Default: ${selectedType.rent || selectedType.baseRent}` : '25000'}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
            {selectedType && (
              <p className="text-xs text-green-600 mt-1">
                ✓ Using base rent from {selectedType.name}: KSh {(selectedType.rent || selectedType.baseRent)?.toLocaleString()} (you can override)
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Deposit Amount (KSh) {selectedType && <span className="text-gray-500 font-normal">(Optional - defaults to {(selectedType.deposit || selectedType.rent || selectedType.baseRent)?.toLocaleString()})</span>}
            </label>
            <input
              type="number"
              value={bulkData.deposit}
              onChange={(e) => setBulkData({ ...bulkData, deposit: e.target.value })}
              placeholder={selectedType ? `Default: ${selectedType.deposit || selectedType.rent || selectedType.baseRent}` : '25000'}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-gray-500 mt-1">
              Leave empty to use monthly rent as deposit
            </p>
          </div>

          {/* Preview Section */}
          {previewUnits.length > 0 && (
            <div className="border-t pt-4">
              <h4 className="font-medium text-gray-900 mb-3">
                Preview ({previewUnits.length} units will be created)
              </h4>
              <div className="bg-gray-50 rounded-lg p-4 max-h-60 overflow-y-auto">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {previewUnits.map((unit, index) => (
                    <div key={index} className="text-sm bg-white px-3 py-2 rounded border border-gray-200">
                      <span className="font-medium">{unit.unitNumber}</span>
                      <span className="text-gray-500 text-xs ml-2">
                        KSh {parseInt(unit.rent).toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              {previewUnits.length > 50 && (
                <p className="text-xs text-yellow-600 mt-2">
                  ⚠️ Creating {previewUnits.length} units. This may take a moment.
                </p>
              )}
            </div>
          )}
        </div>

        <div className="flex gap-3 p-6 border-t bg-gray-50 sticky bottom-0">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 font-medium"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={previewUnits.length === 0}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            Create {previewUnits.length} Unit{previewUnits.length !== 1 ? 's' : ''}
          </button>
        </div>
      </div>
    </div>
  );
};

// Main AdminOrganisation Component
const AdminOrganisation = () => {
  // Safe context access with error handling
  let contextValue;
  try {
    contextValue = useContext(AppContext);
  } catch (error) {
    console.error('Error accessing AppContext:', error);
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Context Error</h2>
          <p className="text-gray-600">Unable to access application context. Please refresh the page.</p>
        </div>
      </div>
    );
  }

  // Use the exact same destructuring as AdminDashboard
  const {
    selectedPropertyId,
    setSelectedPropertyId,
    reports = [],
    tenants = [],
    properties = [],
    propertyUnits: allPropertyUnits = [],
    addRoomType = () => {},
    deleteRoomType = () => {},
    addUnit = () => {},
    updateUnitAvailability = () => {},
  } = contextValue || {};
  
  const { showToast = () => {} } = useToast() || {};
  const navigate = useNavigate();
  
  const [currentProperty, setCurrentProperty] = useState(null);
  const [apiPropertyUnits, setApiPropertyUnits] = useState([]);
  const [apiPropertyTenants, setApiPropertyTenants] = useState([]);
  const [apiPropertyReports, setApiPropertyReports] = useState([]);
  const [apiRoomTypes, setApiRoomTypes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState(null);
  const [totalTenants, setTotalTenants] = useState(0);

  const [rooms, setRooms] = useState(allPropertyUnits);
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, room: null });
  const [roomTypeDialog, setRoomTypeDialog] = useState(false);
  const [editRoomTypeDialog, setEditRoomTypeDialog] = useState({ isOpen: false, roomType: null });
  const [addUnitDialog, setAddUnitDialog] = useState(false);
  const [bulkAddDialog, setBulkAddDialog] = useState(false);

  // Get current property
  const contextCurrentProperty = properties?.find(p => {
    const propertyId = p?.id?.toString();
    const selectedId = selectedPropertyId?.toString();
    return propertyId === selectedId;
  }) || properties?.[0];

  // Auto-select first property if none selected
  useEffect(() => {
    if (properties?.length > 0 && (!selectedPropertyId || !contextCurrentProperty)) {
      const firstProperty = properties[0];
      setSelectedPropertyId(firstProperty.id.toString());
      setCurrentProperty(firstProperty);
    }
  }, [properties, selectedPropertyId, contextCurrentProperty, setSelectedPropertyId]);

  // Filter data by selected property
  const propertyUnits = useMemo(() => {
    return (allPropertyUnits || []).filter(unit => {
      const unitPropertyId = unit?.propertyId?.toString();
      const selectedId = selectedPropertyId?.toString();
      return unitPropertyId === selectedId;
    });
  }, [allPropertyUnits, selectedPropertyId]);

  const propertyReports = useMemo(() => {
    console.log('🔍 Filtering context reports:', {
      totalReports: reports?.length,
      selectedPropertyId,
      sampleReport: reports?.[0]
    });
    
    return (reports || []).filter(report => {
      // Try multiple ways to get the property ID from the report
      const reportPropertyId = report?.unit?.property_obj?.id?.toString() ||
                              report?.unit?.property?.toString() ||
                              report?.property?.toString() ||
                              report?.propertyId?.toString() ||
                              report?.property_id?.toString();
      const selectedId = selectedPropertyId?.toString();
      
      const matches = reportPropertyId === selectedId;
      
      if (reports?.length <= 3) { // Only log for first few to avoid spam
        console.log('📋 Context report filter:', {
          reportId: report?.id,
          reportPropertyId,
          selectedId,
          matches,
          report
        });
      }
      
      return matches;
    });
  }, [reports, selectedPropertyId]);

  // Update rooms when property changes
  useEffect(() => {
    setRooms(propertyUnits);
  }, [propertyUnits]);

  // Set current property when selectedPropertyId changes
  useEffect(() => {
    if (selectedPropertyId && properties?.length > 0) {
      const property = properties.find(p => p?.id?.toString() === selectedPropertyId.toString());
      setCurrentProperty(property || properties[0]);
    }
  }, [selectedPropertyId, properties]);

  // Fetch API data when property changes
  useEffect(() => {
    if (selectedPropertyId) {
      fetchPropertyData();
    }
  }, [selectedPropertyId]);

  // Fetch property data - SIMPLIFIED WITHOUT DEBUGGING
  const fetchPropertyData = async () => {
    if (!selectedPropertyId) return;

    try {
      setLoading(true);
      setApiError(null);

      const property = properties.find(p => p?.id?.toString() === selectedPropertyId.toString());
      setCurrentProperty(property);

      const [unitsResponse, tenantsResponse, reportsResponse, roomTypesResponse] = await Promise.allSettled([
        propertiesAPI.getPropertyUnits(selectedPropertyId),
        tenantsAPI.getTenants(),
        communicationAPI.getReports(),
        propertiesAPI.getUnitTypes()
      ]);

      // Process units data
      if (unitsResponse.status === 'fulfilled') {
        console.log('🏠 Raw units from API:', unitsResponse.value.data);
        const roomTypesData = roomTypesResponse.status === 'fulfilled' ? (roomTypesResponse.value.data || []) : [];
        
        const unitsWithStatus = (unitsResponse.value.data || []).map(unit => {
          console.log('🔍 Processing unit:', {
            unit_number: unit.unit_number,
            tenant: unit.tenant,
            tenant_obj: unit.tenant_obj,
            is_available: unit.is_available
          });
          
          // Determine if unit is occupied based on tenant presence
          const hasTenant = unit.tenant !== null && unit.tenant !== undefined;
          const actuallyAvailable = !hasTenant && unit.is_available;

          // Resolve unit type id and name from various shapes
          const typeId = unit.unit_type?.id || unit.unit_type || unit.unit_type_id || null;
          const typeName = unit.unit_type_obj?.name ||
                           roomTypesData.find(rt => `${rt.id}` === `${typeId}`)?.name ||
                           unit.unit_type?.name || unit.type || 'N/A';
          
          // Format tenant name
          let tenantName = null;
          if (unit.tenant_obj) {
            tenantName = `${unit.tenant_obj.first_name || ''} ${unit.tenant_obj.last_name || ''}`.trim();
            console.log('✅ Tenant name from tenant_obj:', tenantName);
          } else if (unit.tenant) {
            console.log('⚠️ Tenant exists but no tenant_obj, tenant value:', unit.tenant);
          }
          
          return {
            ...unit,
            status: hasTenant ? 'occupied' : (actuallyAvailable ? 'available' : 'unavailable'),
            isAvailable: actuallyAvailable,
            unitNumber: unit.unit_number || unit.unitNumber || 'N/A',
            type: typeName,
            typeId,
            rent: unit.rent || unit.baseRent || 0,
            deposit: unit.deposit || unit.rent || unit.baseRent || 0,
            propertyId: unit.property_obj?.id?.toString() || selectedPropertyId,
            tenant: tenantName || unit.tenant || null,
            tenant_obj: unit.tenant_obj,
            hasTenant: hasTenant
          };
        });
        
        console.log('📦 Processed units:', unitsWithStatus);
        setApiPropertyUnits(unitsWithStatus);
      }

      // Process tenants data - Get all tenants since tenant objects don't have property info
      if (tenantsResponse.status === 'fulfilled') {
        const apiTenants = tenantsResponse.value.data || [];
        setApiPropertyTenants(apiTenants);
      }

      // Process reports data
      if (reportsResponse.status === 'fulfilled') {
        console.log('📋 Raw reports from API:', reportsResponse.value.data);
        console.log('🔍 Sample report structure:', reportsResponse.value.data[0]);
        console.log('🏠 Selected property ID:', selectedPropertyId);
        
        const filteredReports = (reportsResponse.value.data || []).filter(report => {
          // Try multiple ways to get the property ID from the report
          const reportPropertyId = report.unit?.property_obj?.id?.toString() || 
                                  report.unit?.property?.toString() ||
                                  report.property?.toString() ||
                                  report.propertyId?.toString() ||
                                  report.property_id?.toString();
          
          console.log('📋 Report filtering:', {
            reportId: report.id,
            reportPropertyId,
            selectedPropertyId: selectedPropertyId.toString(),
            matches: reportPropertyId === selectedPropertyId.toString(),
            reportObject: report
          });
          
          return reportPropertyId === selectedPropertyId.toString();
        });
        
        console.log('✅ Filtered reports for property:', filteredReports);
        setApiPropertyReports(filteredReports);
      }

      // Process room types data
      if (roomTypesResponse.status === 'fulfilled') {
        console.log('🏷️ Room types from API:', roomTypesResponse.value.data);
        setApiRoomTypes(roomTypesResponse.value.data || []);
      }

    } catch (error) {
      console.error('Error fetching property data:', error);
      setApiError('Failed to load property data from API');
      showToast('Failed to load some data', 'error', 3000);
    } finally {
      setLoading(false);
    }
  };

  // Calculate tenant count from occupied units
  useEffect(() => {
    const displayUnits = apiPropertyUnits.length > 0 ? apiPropertyUnits : propertyUnits;
    const tenantCount = displayUnits.filter(unit => 
      unit?.hasTenant || unit?.tenant !== null && unit?.tenant !== undefined
    ).length;
    
    setTotalTenants(tenantCount);
  }, [apiPropertyUnits, propertyUnits]);

  // Calculate other stats
  const displayUnits = apiPropertyUnits.length > 0 ? apiPropertyUnits : propertyUnits;
  const totalUnits = displayUnits.length;
  const occupiedUnits = displayUnits.filter(unit => 
    unit?.hasTenant || unit?.tenant !== null && unit?.tenant !== undefined
  ).length;
  const availableUnits = displayUnits.filter(unit => 
    !unit?.hasTenant && !unit?.tenant && unit?.isAvailable
  ).length;

  const totalRevenue = displayUnits
    .filter(unit => unit?.hasTenant || unit?.tenant)
    .reduce((sum, unit) => sum + (Number(unit?.rent) || 0), 0);

  const occupancyRate = totalUnits > 0 ? Math.round((occupiedUnits / totalUnits) * 100) : 0;

  // Map reports to expected structure for display
  const displayReportsRaw = apiPropertyReports.length > 0 ? apiPropertyReports : propertyReports;
  
  // Debug: Log the raw reports data
  console.log('🔍 Raw reports data:', {
    apiPropertyReports,
    propertyReports,
    displayReportsRaw,
    selectedPropertyId
  });
  
  const displayReports = (displayReportsRaw || []).map(report => {
    // Try to get title, tenant, room, priority from various possible fields
    let title = report.title || report.subject || report.issue || report.description || 'Untitled Report';
    let tenant = report.tenant || report.tenant_name || (report.tenant_obj ? `${report.tenant_obj.first_name || ''} ${report.tenant_obj.last_name || ''}`.trim() : '');
    let room = report.room || report.unitNumber || (report.unit && (report.unit.unit_number || report.unit.unitNumber)) || (report.unit_obj && report.unit_obj.unit_number) || '';
    let priority = report.priority || report.severity || 'normal';
    
    console.log('📋 Mapped report:', { original: report, mapped: { title, tenant, room, priority } });
    
    return {
      ...report,
      title,
      tenant,
      room,
      priority
    };
  });
  
  console.log('✅ Final displayReports:', displayReports);
  
  const openReportsCount = displayReports.filter(report => 
    report.status === 'open' || report.status === 'Open' || report.status === 'pending'
  ).length;

  // Get tenants from occupied units for display
  const propertyTenantsFromUnits = useMemo(() => {
    console.log('🔍 Building tenant list from units:', {
      displayUnitsCount: displayUnits.length,
      apiPropertyTenantsCount: apiPropertyTenants.length,
      sampleUnit: displayUnits[0],
      sampleApiTenant: apiPropertyTenants[0]
    });

    return displayUnits
      .filter(unit => unit?.hasTenant || unit?.tenant)
      .map(unit => {
        console.log('📦 Processing unit for tenant display:', {
          unitId: unit.id,
          unitNumber: unit.unitNumber,
          tenant: unit.tenant,
          tenant_obj: unit.tenant_obj,
          hasTenant: unit.hasTenant
        });

        // The tenant field is just an ID, so we need to find the actual tenant data
        let tenantName = 'Unknown Tenant';
        let tenantEmail = 'No email';
        
        // Try to find tenant in apiPropertyTenants by ID
        const tenantId = unit.tenant_obj?.id || unit.tenant;
        const tenantData = apiPropertyTenants.find(t => 
          t.id === tenantId || t.id?.toString() === tenantId?.toString()
        );
        
        console.log('🔍 Looking for tenant ID:', tenantId, 'Found:', tenantData);
        
        if (tenantData) {
          // Build name from tenant data - API provides full_name directly!
          tenantName = tenantData.full_name || 
                      `${tenantData.first_name || ''} ${tenantData.last_name || ''}`.trim() ||
                      tenantData.user?.username || 
                      'Unknown Tenant';
          tenantEmail = tenantData.email || tenantData.user?.email || 'No email';
          console.log('✅ Tenant found:', tenantName);
        } else if (unit.tenant_obj) {
          // Fallback to tenant_obj if available
          tenantName = `${unit.tenant_obj.first_name || ''} ${unit.tenant_obj.last_name || ''}`.trim() || 'Unknown Tenant';
          tenantEmail = unit.tenant_obj.email || 'No email';
        } else if (typeof unit.tenant === 'string' && unit.tenant && isNaN(unit.tenant)) {
          // If tenant is already a string name (not a number)
          tenantName = unit.tenant;
        }
        
        console.log('✅ Tenant name resolved:', tenantName);
        
        return {
          id: unit.id,
          tenantId: tenantId,
          name: tenantName,
          email: tenantEmail,
          unitNumber: unit.unitNumber
        };
      });
  }, [displayUnits, apiPropertyTenants]);

  // Units count per room type (by typeId if available, fallback to name)
  const unitsCountByTypeKey = useMemo(() => {
    const map = new Map();
    (displayUnits || []).forEach(u => {
      const key = (u.typeId ?? u.unit_type?.id ?? u.unit_type ?? u.type) ?? 'unknown';
      map.set(`${key}`, (map.get(`${key}`) || 0) + 1);
    });
    return map;
  }, [displayUnits]);

  // Open confirmation dialog
  const openConfirmDialog = (room) => {
    // Don't allow changing availability if room has a tenant
    if (room.hasTenant || room.tenant) {
      showToast('Cannot change availability - unit has an assigned tenant. Remove tenant first.', 'error', 3000);
      return;
    }
    setConfirmDialog({ isOpen: true, room: room });
  };

  const closeConfirmDialog = () => {
    setConfirmDialog({ isOpen: false, room: null });
  };

  // Toggle room availability with confirmation
  const handleConfirmToggle = () => {
    const roomToUpdate = confirmDialog.room;
    
    if (!roomToUpdate?.id) {
      showToast('Invalid room data', 'error', 3000);
      return;
    }
    
    // Update via context
    updateUnitAvailability(roomToUpdate.id, !roomToUpdate.isAvailable);
    
    showToast(
      `Room ${roomToUpdate.unitNumber} marked as ${!roomToUpdate.isAvailable ? 'available' : 'occupied'}`,
      'success',
      3000
    );
    
    closeConfirmDialog();
  };

  // Handle adding room type
  const handleAddRoomType = async (roomType) => {
    if (!selectedPropertyId) {
      showToast('Please select a property first', 'error', 3000);
      return;
    }
    
    try {
      await addRoomType(selectedPropertyId, roomType);
      showToast('Room type added successfully', 'success', 3000);
      setRoomTypeDialog(false);
      // Refresh the room types data
      await fetchPropertyData();
    } catch (error) {
      console.error('Error adding room type:', error);
      const errorMessage = error.response?.data?.error || 
                          error.response?.data?.message || 
                          'Failed to add room type. Please try again.';
      showToast(errorMessage, 'error', 3000);
    }
  };

  // Handle deleting room type
  const handleDeleteRoomType = async (roomTypeId) => {
    if (!window.confirm('Are you sure you want to delete this room type? This action cannot be undone.')) {
      return;
    }
    
    try {
      await deleteRoomType(roomTypeId);
      showToast('Room type deleted successfully', 'success', 3000);
      // Refresh the room types data
      await fetchPropertyData();
    } catch (error) {
      console.error('Error deleting room type:', error);
      const errorMessage = error.response?.data?.error || 
                          error.response?.data?.message || 
                          'Failed to delete room type. It may be in use by existing units.';
      showToast(errorMessage, 'error', 3000);
    }
  };

  // Handle updating room type
  const handleUpdateRoomType = async (roomTypeId, updatedData) => {
    try {
      await propertiesAPI.updateUnitType(roomTypeId, updatedData);
      showToast('Room type updated successfully', 'success', 3000);
      setEditRoomTypeDialog({ isOpen: false, roomType: null });
      // Refresh the room types data
      await fetchPropertyData();
    } catch (error) {
      console.error('Error updating room type:', error);
      const errorMessage = error.response?.data?.error || 
                          error.response?.data?.message || 
                          'Failed to update room type.';
      showToast(errorMessage, 'error', 3000);
    }
  };

  // Handle adding rental unit
  const handleAddUnit = async (unitData) => {
    try {
      if (!selectedPropertyId) {
        showToast('Please select a property first', 'error', 3000);
        return;
      }

      // Predefined unit types (strings)
      const predefinedTypes = ['studio', '1-bedroom', '2-bedroom', '3-bedroom', '4-bedroom', 
                                '5-bedroom', '6-bedroom', '7-bedroom', '8-bedroom'];
      
      let unitTypeToSend;
      let displayName;
      
      // Check if it's a predefined type or a custom room type ID
      if (predefinedTypes.includes(unitData.type)) {
        // It's a predefined type - send the string value
        unitTypeToSend = unitData.type;
        // Format display name (e.g., "1-bedroom" -> "1 Bedroom")
        displayName = unitData.type
          .split('-')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ');
      } else {
        // It's a custom room type ID - find it in roomTypes
        const selectedType = (roomTypes || []).find(rt => `${rt.id}` === `${unitData.type}`);
        unitTypeToSend = selectedType?.id || unitData.type;
        displayName = selectedType?.name || 'N/A';
      }

      // Call the API to create the unit
      // Parse deposit - if empty or 0, use rent value
      const depositValue = unitData.deposit && parseInt(unitData.deposit) > 0 
        ? parseInt(unitData.deposit) 
        : parseInt(unitData.rent);
      
      const unitPayload = {
        unit_number: unitData.unitNumber,
        unit_type: unitTypeToSend,
        rent: parseInt(unitData.rent),
        deposit: depositValue,
        property_obj: parseInt(selectedPropertyId),
        is_available: true
      };
      
      console.log('📤 Creating single unit with payload:', unitPayload);
      
      const response = await propertiesAPI.createUnit(unitPayload);

      // If API call successful, update local state
      const newUnit = {
        id: response.data.id,
        unitNumber: response.data.unit_number,
        type: response.data.unit_type?.name || displayName,
        typeId: response.data.unit_type?.id || unitTypeToSend,
        rent: parseInt(response.data.rent),
        deposit: parseInt(response.data.deposit || response.data.rent),
        status: 'available',
        isAvailable: true,
        tenant: null,
        propertyId: selectedPropertyId
      };
      
      addUnit(newUnit);
      showToast(`Unit ${unitData.unitNumber} added successfully`, 'success', 3000);
      setAddUnitDialog(false);
      
      // Refresh the units data
      fetchPropertyData();
      
    } catch (error) {
      console.error('Error adding unit:', error);
      showToast('Failed to add unit. Please try again.', 'error', 3000);
    }
  };

  // Handle bulk adding rental units
  const handleBulkAddUnits = async (unitsArray) => {
    try {
      if (!selectedPropertyId) {
        showToast('Please select a property first', 'error', 3000);
        return;
      }

      console.log('🏢 Selected Property ID:', selectedPropertyId);
      console.log('📦 Units to create:', unitsArray);
      console.log('🏷️ Available room types:', roomTypes);

      showToast(`Creating ${unitsArray.length} units...`, 'info', 2000);
      
      let successCount = 0;
      let failCount = 0;
      const errors = [];

      // Predefined unit types (strings)
      const predefinedTypes = ['studio', '1-bedroom', '2-bedroom', '3-bedroom', '4-bedroom', 
                                '5-bedroom', '6-bedroom', '7-bedroom', '8-bedroom'];
      
      // Determine if we're using predefined or custom type
      const firstUnitType = unitsArray[0].type;
      let unitTypeToSend;
      let displayName;
      
      console.log('🔍 First unit type value:', firstUnitType);
      console.log('🔍 Type of firstUnitType:', typeof firstUnitType);
      
      if (predefinedTypes.includes(firstUnitType)) {
        // It's a predefined type
        unitTypeToSend = firstUnitType;
        displayName = firstUnitType
          .split('-')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ');
        console.log('✅ Using predefined type:', unitTypeToSend);
      } else {
        // It's a custom room type ID
        const selectedType = (roomTypes || []).find(rt => `${rt.id}` === `${firstUnitType}`);
        
        if (!selectedType) {
          console.error('❌ Room type ID not found:', firstUnitType);
          showToast(`Invalid room type selected (ID: ${firstUnitType}). Please select a valid room type.`, 'error', 5000);
          return;
        }
        
        unitTypeToSend = selectedType.id;
        displayName = selectedType.name;
        console.log('✅ Using custom room type:', { id: unitTypeToSend, name: displayName });
      }

      console.log('🎯 Unit type to send:', unitTypeToSend);
      console.log('📝 Display name:', displayName);

      // Process units in batches to avoid overwhelming the server
      const batchSize = 10;
      let shouldStop = false; // Flag to stop processing when subscription limit is hit
      
      for (let i = 0; i < unitsArray.length && !shouldStop; i += batchSize) {
        const batch = unitsArray.slice(i, i + batchSize);
        
        const batchPromises = batch.map(async (unitData) => {
          if (shouldStop) return { success: false, unitNumber: unitData.unitNumber, skipped: true };
          
          try {
            // Parse deposit - if empty or 0, use rent value
            const depositValue = unitData.deposit && parseInt(unitData.deposit) > 0 
              ? parseInt(unitData.deposit) 
              : parseInt(unitData.rent);
            
            const unitPayload = {
              unit_number: unitData.unitNumber,
              unit_type: unitTypeToSend,
              rent: parseInt(unitData.rent),
              deposit: depositValue,
              property_obj: parseInt(selectedPropertyId),
              is_available: true
            };
            
            console.log('📤 Sending unit data:', unitPayload);
            
            const response = await propertiesAPI.createUnit(unitPayload);

            // Update local state
            const newUnit = {
              id: response.data.id,
              unitNumber: response.data.unit_number,
              type: response.data.unit_type?.name || displayName,
              typeId: response.data.unit_type?.id || unitTypeToSend,
              rent: parseInt(response.data.rent),
              deposit: parseInt(response.data.deposit || response.data.rent),
              status: 'available',
              isAvailable: true,
              tenant: null,
              propertyId: selectedPropertyId
            };
            
            addUnit(newUnit);
            successCount++;
            return { success: true, unitNumber: unitData.unitNumber };
          } catch (error) {
            console.error('❌ Error creating unit:', unitData.unitNumber, error.response?.data || error.message);
            failCount++;
            
            const errorData = error.response?.data || {};
            const errorMessage = errorData.error || error.message;
            const isSubscriptionLimit = error.response?.status === 403 && errorData.upgrade_needed;
            
            errors.push({ 
              unitNumber: unitData.unitNumber, 
              error: errorMessage,
              isSubscriptionLimit: isSubscriptionLimit,
              errorDetails: errorData
            });
            
            // Stop processing if subscription limit is hit
            if (isSubscriptionLimit) {
              shouldStop = true;
            }
            
            return { 
              success: false, 
              unitNumber: unitData.unitNumber,
              isSubscriptionLimit: isSubscriptionLimit
            };
          }
        });

        await Promise.all(batchPromises);
      }

      // Check if any errors are subscription limit errors
      const subscriptionLimitError = errors.find(e => e.isSubscriptionLimit);
      
      // Always close the dialog after processing
      setBulkAddDialog(false);
      
      // Refresh the units data only if some units were created
      if (successCount > 0) {
        await fetchPropertyData();
      }
      
      // Show results AFTER closing dialog and refreshing
      if (failCount === 0) {
        showToast(`✅ Successfully created all ${successCount} units!`, 'success', 5000);
      } else if (subscriptionLimitError) {
        // Special handling for subscription limit errors
        const limitDetails = subscriptionLimitError.errorDetails;
        const upgradeMessage = successCount > 0 
          ? `✅ Created ${successCount} units successfully.\n\n🚫 Subscription Limit Reached!\n\nYou have reached your plan limit of ${limitDetails.limit} units (current: ${limitDetails.current_count}).\n\nPlease upgrade your subscription to add more units.`
          : `🚫 Subscription Limit Reached!\n\nYou have reached your plan limit of ${limitDetails.limit} units (current: ${limitDetails.current_count}).\n\nPlease upgrade your subscription to add more units.`;
        
        // Show toast
        showToast(upgradeMessage, 'error', 8000);
        
        // Also show alert as fallback (guaranteed to be visible)
        alert(upgradeMessage);
        
        // Log detailed info for debugging
        console.warn('🚫 Subscription Limit Reached:', {
          currentCount: limitDetails.current_count,
          limit: limitDetails.limit,
          suggestedPlan: limitDetails.suggested_plan,
          successfullyCreated: successCount,
          failed: failCount,
          message: 'Please upgrade your subscription or delete some units to continue.'
        });
      } else {
        const errorMsg = `Created ${successCount} units. ${failCount} failed. Check console for details.`;
        showToast(errorMsg, failCount > successCount / 2 ? 'error' : 'warning', 5000);
        
        // Show alert for visibility
        if (failCount > 0) {
          alert(errorMsg);
        }
        
        if (errors.length > 0) {
          console.error('Failed units:', errors);
        }
      }
      
    } catch (error) {
      console.error('Error in bulk add:', error);
      setBulkAddDialog(false);
      showToast('Failed to complete bulk add. Please try again.', 'error', 3000);
    }
  };

  // Use API room types if available, otherwise fall back to context
  const roomTypes = apiRoomTypes.length > 0 
    ? apiRoomTypes 
    : (contextCurrentProperty?.unit_types || contextCurrentProperty?.roomTypes || []);

  console.log('🏷️ Room types to display:', roomTypes);

  // Show loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading property data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <ConfirmationDialog
        isOpen={confirmDialog.isOpen}
        onClose={closeConfirmDialog}
        onConfirm={handleConfirmToggle}
        room={confirmDialog.room}
      />

      <AddRoomTypeDialog
        isOpen={roomTypeDialog}
        onClose={() => setRoomTypeDialog(false)}
        onAdd={handleAddRoomType}
      />

      <EditRoomTypeDialog
        isOpen={editRoomTypeDialog.isOpen}
        onClose={() => setEditRoomTypeDialog({ isOpen: false, roomType: null })}
        onUpdate={handleUpdateRoomType}
        roomType={editRoomTypeDialog.roomType}
      />

      <AddRentalUnitDialog
        isOpen={addUnitDialog}
        onClose={() => setAddUnitDialog(false)}
        onAdd={handleAddUnit}
        roomTypes={roomTypes}
        propertyId={selectedPropertyId}
      />

      <BulkAddUnitsDialog
        isOpen={bulkAddDialog}
        onClose={() => setBulkAddDialog(false)}
        onBulkAdd={handleBulkAddUnits}
        roomTypes={roomTypes}
        propertyId={selectedPropertyId}
      />

      {/* Header with Property Selector and Refresh Button */}
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
              {properties?.map(property => (
                <option key={property?.id} value={property?.id?.toString()}>
                  {property?.name || 'Unnamed Property'}
                </option>
              ))}
            </select>
            
            <button
              onClick={fetchPropertyData}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              disabled={loading}
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              {loading ? 'Refreshing...' : 'Refresh Data'}
            </button>
            
            <NavLink to="/admin/add-property">
              <button className="w-full sm:w-auto bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2">
                <Plus className="w-5 h-5" />
                Add New Property
              </button>
            </NavLink>
          </div>
        </div>
      </div>

      {/* API Status Banner */}
      {apiError && (
        <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded-lg">
          <div className="flex items-start">
            <AlertTriangle className="w-5 h-5 text-yellow-600 mr-3 mt-0.5" />
            <div>
              <p className="font-semibold text-yellow-900">API Connection Issue</p>
              <p className="text-sm text-yellow-700">
                Using local data. Some features may be limited. {apiError}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Property Info Banner */}
      {contextCurrentProperty && (
        <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-lg">
          <div className="flex items-start">
            <Building2 className="w-5 h-5 text-blue-600 mr-3 mt-0.5" />
            <div>
              <p className="font-semibold text-blue-900">
                Viewing: {contextCurrentProperty.name}
              </p>
              <p className="text-sm text-blue-700">
                {contextCurrentProperty.address || contextCurrentProperty.city} • {contextCurrentProperty.city}
              </p>
              <p className="text-sm text-blue-600 mt-1">
                Units: {displayUnits.length} total ({occupiedUnits} occupied, {availableUnits} available) • 
                Tenants: {totalTenants}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Total Tenants</p>
              <p className="text-3xl font-bold text-gray-900">{totalTenants}</p>
              <p className="text-gray-600 text-sm">Active tenants</p>
            </div>
            <Users className="w-8 h-8 text-gray-400" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Total Units</p>
              <p className="text-3xl font-bold text-gray-900">{totalUnits}</p>
              <p className="text-gray-600 text-sm">Units in this property</p>
            </div>
            <Bed className="w-8 h-8 text-gray-400" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Available Units</p>
              <p className="text-3xl font-bold text-gray-900">{availableUnits}</p>
              <p className="text-gray-600 text-sm">Units currently available</p>
            </div>
            <Key className="w-8 h-8 text-green-500" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Occupancy Rate</p>
              <p className="text-3xl font-bold text-gray-900">{occupancyRate}%</p>
              <p className="text-gray-600 text-sm">{occupiedUnits}/{totalUnits} occupied</p>
            </div>
            <DollarSign className="w-8 h-8 text-gray-400" />
          </div>
        </div>
      </div>

      {/* Property Images */}
      {contextCurrentProperty?.images && contextCurrentProperty.images.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Property Gallery</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {contextCurrentProperty.images.map((image, index) => (
              <div key={`image-${index}`} className="bg-gray-50 rounded-lg overflow-hidden">
                <img 
                  src={image} 
                  alt={`${contextCurrentProperty.name} ${index + 1}`}
                  className="w-full h-48 object-cover"
                />
                <div className="p-4">
                  <h3 className="font-medium text-gray-900">{contextCurrentProperty.name}</h3>
                  <p className="text-sm text-gray-600">{contextCurrentProperty.address}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Room Types Management */}
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Room Types</h2>
          <button
            onClick={() => setRoomTypeDialog(true)}
            className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
          >
            <Plus className="w-4 h-4" />
            Add Room Type
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {roomTypes.map(roomType => (
            <div key={roomType.id} className="border border-gray-200 rounded-lg p-4">
              <div className="flex justify-between items-start mb-3">
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">{roomType.name}</h3>
                  <p className="text-lg text-blue-600 font-bold mt-1">
                    Rent: KSh {roomType.baseRent?.toLocaleString() || roomType.rent?.toLocaleString()}
                  </p>
                  <p className="text-sm text-green-600 font-medium mt-1">
                    Deposit: KSh {roomType.deposit?.toLocaleString() || '0'}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">
                    {(unitsCountByTypeKey.get(`${roomType.id}`) || 0)} units
                  </p>
                  {roomType.description && (
                    <p className="text-xs text-gray-500 mt-2">{roomType.description}</p>
                  )}
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => setEditRoomTypeDialog({ isOpen: true, roomType })}
                    className="text-blue-400 hover:text-blue-600"
                    title="Edit room type"
                  >
                    <DollarSign className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => handleDeleteRoomType(roomType.id)}
                    className="text-red-400 hover:text-red-600"
                    title="Delete room type"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
          
          {roomTypes.length === 0 && (
            <div className="col-span-full text-center py-8 text-gray-500">
              No room types defined. Click "Add Room Type" to get started.
            </div>
          )}
        </div>
      </div>

      {/* Room Management Section */}
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-xl font-semibold">Room Management</h2>
            <p className="text-sm text-gray-500 mt-1">
              {displayUnits.length} units total • {occupiedUnits} occupied • {availableUnits} available
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setBulkAddDialog(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Upload className="w-4 h-4" />
              Bulk Add Units
            </button>
            <button
              onClick={() => setAddUnitDialog(true)}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              <Plus className="w-4 h-4" />
              Add Rental Unit
            </button>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3 px-4">Room</th>
                <th className="text-left py-3 px-4">Type</th>
                <th className="text-left py-3 px-4">Rent (KSh)</th>
                <th className="text-left py-3 px-4">Deposit (KSh)</th>
                <th className="text-left py-3 px-4">Tenant</th>
                <th className="text-left py-3 px-4">Status</th>
                <th className="text-left py-3 px-4">Availability</th>
              </tr>
            </thead>
            <tbody>
              {displayUnits.map(room => {
                const hasTenant = room.hasTenant || room.tenant;
                const isActuallyAvailable = !hasTenant && room.isAvailable;
                
                return (
                  <tr key={room.id} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4 font-medium">{room.unitNumber}</td>
                    <td className="py-3 px-4">{room.type}</td>
                    <td className="py-3 px-4">{room.rent?.toLocaleString()}</td>
                    <td className="py-3 px-4">{(room.deposit || room.rent)?.toLocaleString()}</td>
                    <td className="py-3 px-4 text-sm text-gray-600">{room.tenant || '-'}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        hasTenant
                          ? 'bg-red-100 text-red-800'
                          : isActuallyAvailable 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {hasTenant ? 'occupied' : (isActuallyAvailable ? 'available' : 'unavailable')}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <button 
                        onClick={() => openConfirmDialog(room)} 
                        disabled={hasTenant}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                          hasTenant 
                            ? 'bg-gray-300 cursor-not-allowed opacity-50' 
                            : isActuallyAvailable 
                            ? 'bg-green-500' 
                            : 'bg-gray-300'
                        }`} 
                        title={hasTenant ? 'Remove tenant first to change availability' : 'Click to change availability'}
                      >
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          isActuallyAvailable ? 'translate-x-6' : 'translate-x-1'
                        }`} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          
          {displayUnits.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <Bed className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p>No rental units added yet for this property.</p>
              <p className="text-sm mt-1">Click "Add Rental Unit" to add your first unit.</p>
            </div>
          )}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Recent Reports</h3>
          <div className="space-y-3">
            {displayReports.slice(0, 3).map(report => (
              <div key={report.id || report._id || Math.random()} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium">{report.title}</p>
                  <p className="text-sm text-gray-600">{report.tenant || 'Unknown'} - Room {report.room || 'N/A'}</p>
                </div>
                <span className={`px-2 py-1 text-xs rounded-full ${
                  report.priority === 'high' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {report.priority}
                </span>
              </div>
            ))}
            {displayReports.length === 0 && (
              <p className="text-center py-8 text-gray-500">No reports for this property</p>
            )}
          </div>
          <NavLink to="/admin/reports">
            <button className="w-full flex mt-5 items-center justify-center px-6 py-3 text-white rounded hover:bg-gray-800 bg-gray-800 cursor-pointer">
              View All Reports
            </button>
          </NavLink>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Recent Tenants</h3>
          <div className="space-y-3">
            {propertyTenantsFromUnits.slice(0, 3).map(tenant => (
              <div key={tenant.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium">{tenant.name}</p>
                  <p className="text-sm text-gray-600">Room {tenant.unitNumber}</p>
                </div>
                <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                  Active
                </span>
              </div>
            ))}
            
            {propertyTenantsFromUnits.length === 0 && (
              <p className="text-center py-8 text-gray-500">No tenants for this property</p>
            )}
          </div>
          <NavLink to="/admin/tenants">
            <button className="w-full flex mt-5 items-center justify-center px-6 py-3 text-white rounded hover:bg-gray-800 bg-gray-800 cursor-pointer">
              View All Tenants
            </button>
          </NavLink>
        </div>
      </div>
    </div>
  );
};

export default AdminOrganisation;