import React, { useContext, useState, useEffect } from 'react';
import { 
  Users, 
  Bed, 
  Key,
  DollarSign,
  AlertTriangle,
  X,
  Building2,
  Plus,
  Trash2
} from 'lucide-react';
import { AppContext } from '../../context/AppContext';
import { useToast } from '../../context/ToastContext';
import { NavLink } from "react-router-dom";

// Confirmation Dialog Component
const ConfirmationDialog = ({ isOpen, onClose, onConfirm, room }) => {
  if (!isOpen) return null;

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
                  room?.status === 'available' 
                    ? 'bg-green-100 text-green-800' 
                    : room?.status === 'occupied'
                    ? 'bg-red-100 text-red-800'
                    : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {room?.status}
                </span>
              </div>
              
              <div className="font-medium text-gray-600">New Status:</div>
              <div>
                <span className={`px-2 py-1 text-xs rounded-full ${
                  room?.isAvailable 
                    ? 'bg-red-100 text-red-800'
                    : 'bg-green-100 text-green-800'
                }`}>
                  {room?.isAvailable ? 'occupied' : 'available'}
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
  const [roomType, setRoomType] = useState({ name: '', baseRent: '' });

  if (!isOpen) return null;

  const handleSubmit = () => {
    if (!roomType.name || !roomType.baseRent) {
      alert('Please fill in all fields');
      return;
    }
    onAdd(roomType);
    setRoomType({ name: '', baseRent: '' });
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
              onChange={(e) => setRoomType({...roomType, name: e.target.value})}
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
              onChange={(e) => setRoomType({...roomType, baseRent: e.target.value})}
              placeholder="25000"
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

// Add Rental Unit Dialog
const AddRentalUnitDialog = ({ isOpen, onClose, onAdd, roomTypes, propertyId }) => {
  const [unitData, setUnitData] = useState({
    unitNumber: '',
    type: '',
    rent: ''
  });

  if (!isOpen) return null;

  const handleSubmit = () => {
    if (!unitData.unitNumber || !unitData.type /* || !unitData.size */ || !unitData.rent) {
      // note: size removed from validation
      alert('Please fill in all fields');
      return;
    }
    onAdd(unitData);
    setUnitData({ unitNumber: '', type: '', /* size: '', */ rent: '' });
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
              Unit Number
            </label>
            <input
              type="text"
              value={unitData.unitNumber}
              onChange={(e) => setUnitData({...unitData, unitNumber: e.target.value})}
              placeholder="e.g., A101"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Room Type
            </label>
            <select
              value={unitData.type}
              onChange={(e) => {
                const selectedType = roomTypes.find(rt => rt.name === e.target.value);
                setUnitData({
                  ...unitData, 
                  type: e.target.value,
                  rent: selectedType ? selectedType.baseRent : unitData.rent
                });
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select room type</option>
              {roomTypes.map(rt => (
                <option key={rt.id} value={rt.name}>{rt.name}</option>
              ))}
            </select>
          </div>
          
          {/* Size field removed per request
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Size (sqm)
            </label>
            <input
              type="text"
              value={unitData.size}
              onChange={(e) => setUnitData({...unitData, size: e.target.value})}
              placeholder="e.g., 30 sqm"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          */}
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Rent (KSh)
            </label>
            <input
              type="number"
              value={unitData.rent}
              onChange={(e) => setUnitData({...unitData, rent: e.target.value})}
              placeholder="25000"
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
            Add Unit
          </button>
        </div>
      </div>
    </div>
  );
};

const AdminOrganisation = () => {
  const { 
    mockReports, 
    mockTenants, 
    propertyUnits: allPropertyUnits,
    landlords,
    selectedPropertyId,
    setSelectedPropertyId,
    addRoomType,
    deleteRoomType,
    addUnit,
    updateUnitAvailability
  } = useContext(AppContext);
  const { showToast } = useToast();
  
  // Get current landlord (assuming first landlord)
  const currentLandlord = landlords[0];
  const currentProperty = currentLandlord?.properties.find(p => p.propertyId === selectedPropertyId);
  
  // Filter data by selected property
  const propertyUnits = (allPropertyUnits || []).filter(unit => unit.propertyId === selectedPropertyId);
  const propertyTenants = mockTenants.filter(tenant => tenant.propertyId === selectedPropertyId);
  const propertyReports = mockReports.filter(report => report.propertyId === selectedPropertyId);
  
  const [rooms, setRooms] = useState(propertyUnits);
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, room: null });
  const [roomTypeDialog, setRoomTypeDialog] = useState(false);
  const [addUnitDialog, setAddUnitDialog] = useState(false);

  // Update rooms when property changes
  useEffect(() => {
    setRooms(propertyUnits);
  }, [selectedPropertyId, /* mockUnits changed -> now allPropertyUnits */ allPropertyUnits]);

  // Open confirmation dialog
  const openConfirmDialog = (room) => {
    setConfirmDialog({ isOpen: true, room: room });
  };

  const closeConfirmDialog = () => {
    setConfirmDialog({ isOpen: false, room: null });
  };

  // Toggle room availability with confirmation
  const handleConfirmToggle = () => {
    const roomToUpdate = confirmDialog.room;
    
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
  const handleAddRoomType = (roomType) => {
    addRoomType(currentLandlord.id, selectedPropertyId, roomType);
    showToast('Room type added successfully', 'success', 3000);
    setRoomTypeDialog(false);
  };

  // Handle deleting room type
  const handleDeleteRoomType = (roomTypeId) => {
    if (window.confirm('Are you sure you want to delete this room type?')) {
      deleteRoomType(currentLandlord.id, selectedPropertyId, roomTypeId);
      showToast('Room type deleted successfully', 'success', 3000);
    }
  };

  // Handle adding rental unit
  const handleAddUnit = (unitData) => {
    const newUnit = {
      id: Date.now(),
      unitNumber: unitData.unitNumber,
      type: unitData.type,
      rent: parseInt(unitData.rent),
      // size: unitData.size, // removed per request
      status: 'available',
      isAvailable: true,
      tenant: null,
      propertyId: selectedPropertyId
    };
    
    addUnit(newUnit);
    showToast(`Unit ${unitData.unitNumber} added successfully`, 'success', 3000);
    setAddUnitDialog(false);
  };

  // Calculate statistics for the selected property
  const totalUnits = Number(currentProperty?.numberOfUnits || 0);
  const occupiedUnits = propertyUnits.filter(unit => unit.status === 'occupied').length;
  const availableUnits = Math.max(0, totalUnits - occupiedUnits);
  const unitsAdded = propertyUnits.length;
  const totalRevenue = propertyUnits
    .filter(unit => unit.status === 'occupied')
    .reduce((sum, unit) => sum + (Number(unit.rent) || 0), 0);
  
  const occupancyRate = totalUnits > 0 ? Math.round((occupiedUnits / totalUnits) * 100) : 0;
  const totalTenants = propertyTenants.length;

  // Check if property limit reached
  const canAddUnits = rooms.length < (currentProperty?.numberOfUnits || 0);
 
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

      <AddRentalUnitDialog
        isOpen={addUnitDialog}
        onClose={() => setAddUnitDialog(false)}
        onAdd={handleAddUnit}
        roomTypes={currentProperty?.roomTypes || []}
        propertyId={selectedPropertyId}
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
              value={selectedPropertyId}
              onChange={(e) => setSelectedPropertyId(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
            >
              {currentLandlord?.properties.map(property => (
                <option key={property.propertyId} value={property.propertyId}>
                  {property.name}
                </option>
              ))}
            </select>
            
            <NavLink to="/admin/add-property">
              <button className="w-full sm:w-auto bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2">
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
            <div>
              <p className="font-semibold text-blue-900">
                Viewing: {currentProperty.name}
              </p>
              <p className="text-sm text-blue-700">
                {currentProperty.address} • {currentProperty.city}
              </p>
              <p className="text-sm text-blue-600 mt-1">
                Unit Capacity: {rooms.length}/{currentProperty.numberOfUnits} units added
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
              <p className="text-gray-600 text-sm">Total Units (capacity)</p>
              <p className="text-3xl font-bold text-gray-900">{totalUnits}</p>
              <p className="text-gray-600 text-sm">Units capacity for this property</p>
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
      {currentProperty?.images && currentProperty.images.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Property Gallery</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {currentProperty.images.map((image, index) => (
              <div key={index} className="bg-gray-50 rounded-lg overflow-hidden">
                <img 
                  src={image} 
                  alt={`${currentProperty.name} ${index + 1}`}
                  className="w-full h-48 object-cover"
                />
                <div className="p-4">
                  <h3 className="font-medium text-gray-900">{currentProperty.name}</h3>
                  <p className="text-sm text-gray-600">{currentProperty.address}</p>
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
          {currentProperty?.roomTypes?.map(roomType => (
            <div key={roomType.id} className="border border-gray-200 rounded-lg p-4">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold text-gray-900">{roomType.name}</h3>
                  <p className="text-lg text-blue-600 font-bold mt-1">
                    KSh {roomType.baseRent.toLocaleString()}
                  </p>
                </div>
                <button 
                  onClick={() => handleDeleteRoomType(roomType.id)}
                  className="text-red-400 hover:text-red-600"
                  title="Delete room type"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
          
          {(!currentProperty?.roomTypes || currentProperty.roomTypes.length === 0) && (
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
              {canAddUnits 
                ? `You can add ${currentProperty?.numberOfUnits - rooms.length} more units`
                : 'Unit limit reached for this property'}
            </p>
          </div>
          <button
            onClick={() => setAddUnitDialog(true)}
            disabled={!canAddUnits}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
              canAddUnits
                ? 'bg-green-600 text-white hover:bg-green-700'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            <Plus className="w-4 h-4" />
            Add Rental Unit
          </button>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3 px-4">Room</th>
                <th className="text-left py-3 px-4">Type</th>
                {/* <th className="text-left py-3 px-4">Size</th> */} {/* commented out */}
                <th className="text-left py-3 px-4">Rent (KSh)</th>
                <th className="text-left py-3 px-4">Tenant</th>
                <th className="text-left py-3 px-4">Status</th>
                <th className="text-left py-3 px-4">Availability</th>
              </tr>
            </thead>
            <tbody>
              {rooms.map(room => (
                <tr key={room.id} className="border-b hover:bg-gray-50">
                  <td className="py-3 px-4 font-medium">{room.unitNumber}</td>
                  <td className="py-3 px-4">{room.type}</td>
                  {/* <td className="py-3 px-4">{room.size}</td> */} {/* commented out */}
                  <td className="py-3 px-4">{room.rent.toLocaleString()}</td>
                  <td className="py-3 px-4 text-sm text-gray-600">
                    {room.tenant || '-'}
                  </td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      room.status === 'available' 
                        ? 'bg-green-100 text-green-800' 
                        : room.status === 'occupied'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {room.status}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <button
                      onClick={() => openConfirmDialog(room)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                        room.isAvailable ? 'bg-green-500' : 'bg-gray-300'
                      }`}
                      title="Click to change availability"
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          room.isAvailable ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {rooms.length === 0 && (
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
            {propertyReports.slice(0, 3).map(report => (
              <div key={report.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium">{report.title}</p>
                  <p className="text-sm text-gray-600">{report.tenant} - Room {report.room}</p>
                </div>
                <span className={`px-2 py-1 text-xs rounded-full ${
                  report.priority === 'high' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {report.priority}
                </span>
              </div>
            ))}
            
            {propertyReports.length === 0 && (
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
            {propertyTenants.slice(0, 3).map(tenant => (
              <div key={tenant.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium">{tenant.name}</p>
                  <p className="text-sm text-gray-600">Room {tenant.room}</p>
                </div>
                <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                  {tenant.status}
                </span>
              </div>
            ))}
            
            {propertyTenants.length === 0 && (
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