import React, { useState } from 'react';
import { X, ArrowRightLeft, AlertTriangle, CheckCircle } from 'lucide-react';

const ShiftTenantModal = ({ isOpen, onClose, tenant, availableUnits }) => {
  const [selectedUnit, setSelectedUnit] = useState('');
  const [showDisclaimer, setShowDisclaimer] = useState(false);
  const [confirmedShift, setConfirmedShift] = useState(false);

  if (!isOpen || !tenant) return null;

  // Get selected unit details
  const getSelectedUnitDetails = () => {
    return availableUnits.find(unit => unit.id === parseInt(selectedUnit));
  };

  const handleUnitSelection = (e) => {
    setSelectedUnit(e.target.value);
    setShowDisclaimer(true);
    setConfirmedShift(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedUnit) {
      alert('Please select a unit to shift to');
      return;
    }

    if (!confirmedShift) {
      alert('Please confirm the shift by checking the disclaimer checkbox');
      return;
    }

    const unitDetails = getSelectedUnitDetails();

    const payload = {
      tenantId: tenant.id,
      tenantName: tenant.name,
      currentRoom: tenant.room,
      currentRent: tenant.rentAmount,
      newUnitId: selectedUnit,
      newRoom: unitDetails.unitNumber,
      newRent: unitDetails.rent,
      shiftDate: new Date().toISOString()
    };

    try {
      // BACKEND INTEGRATION - Uncomment when backend is ready
      /*
      const response = await fetch('/api/v1/tenants/shift/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error('Failed to shift tenant');
      }

      const result = await response.json();
      */

      // SIMULATION
      console.log('Shift tenant payload ready for backend:', payload);
      
      alert(`Tenant shift successful!\n\n${tenant.name} has been moved from Room ${tenant.room} to Room ${unitDetails.unitNumber}.\n\nNew rent: KSh ${unitDetails.rent.toLocaleString()}`);
      onClose();
      
      // Reset form
      setSelectedUnit('');
      setShowDisclaimer(false);
      setConfirmedShift(false);

    } catch (error) {
      console.error('Error shifting tenant:', error);
      alert('Error shifting tenant. Please try again.');
    }
  };

  const selectedUnitDetails = getSelectedUnitDetails();

  return (
    <div className="fixed inset-0 bg-opacity-40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto border-2 border-black-500">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center">
            <ArrowRightLeft className="w-6 h-6 text-blue-600 mr-2" />
            <h2 className="text-2xl font-bold">Shift Tenant</h2>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Current Tenant Info */}
        <div className="bg-blue-50 p-4 rounded-lg mb-6 border border-blue-200">
          <h3 className="font-semibold mb-3 flex items-center text-blue-900">
            <CheckCircle className="w-5 h-5 mr-2" />
            Current Details
          </h3>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-blue-700">Tenant Name:</p>
              <p className="font-medium text-blue-900">{tenant.name}</p>
            </div>
            <div>
              <p className="text-blue-700">Current Room:</p>
              <p className="font-medium text-blue-900">{tenant.room}</p>
            </div>
            <div>
              <p className="text-blue-700">Current Rent:</p>
              <p className="font-medium text-green-600">KSh {tenant.rentAmount.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-blue-700">Booking ID:</p>
              <p className="font-medium text-blue-900">{tenant.bookingId}</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Unit Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select New Unit <span className="text-red-500">*</span>
            </label>
            {availableUnits.length === 0 ? (
              <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                <p className="text-sm text-yellow-800">
                  <strong>No available units:</strong> All units are currently occupied. Please free up a unit before shifting this tenant.
                </p>
              </div>
            ) : (
              <select
                value={selectedUnit}
                onChange={handleUnitSelection}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">-- Select a Unit --</option>
                {availableUnits.map(unit => (
                  <option key={unit.id} value={unit.id}>
                    Room {unit.unitNumber} - {unit.type} - KSh {unit.rent.toLocaleString()}/month
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Disclaimer when unit is selected */}
          {showDisclaimer && selectedUnitDetails && (
            <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-300">
              <div className="flex items-start mb-3">
                <AlertTriangle className="w-5 h-5 text-yellow-600 mr-2 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-yellow-900 mb-2">Shift Confirmation Required</h4>
                  <p className="text-sm text-yellow-800 mb-3">
                    <strong>{tenant.name}</strong> will be shifted from <strong>Room {tenant.room}</strong> to <strong>Room {selectedUnitDetails.unitNumber}</strong>.
                  </p>
                  <div className="bg-white p-3 rounded border border-yellow-200 mb-3">
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <p className="text-gray-600">Current Rent:</p>
                        <p className="font-bold text-gray-900">KSh {tenant.rentAmount.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">New Rent:</p>
                        <p className="font-bold text-green-600">KSh {selectedUnitDetails.rent.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Room Type:</p>
                        <p className="font-medium text-gray-900">{selectedUnitDetails.type}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Size:</p>
                        <p className="font-medium text-gray-900">{selectedUnitDetails.size}</p>
                      </div>
                    </div>
                  </div>
                  {tenant.rentAmount !== selectedUnitDetails.rent && (
                    <p className="text-sm text-yellow-800 font-medium">
                      ⚠️ Note: The rent amount will change by KSh {Math.abs(selectedUnitDetails.rent - tenant.rentAmount).toLocaleString()} 
                      ({selectedUnitDetails.rent > tenant.rentAmount ? 'increase' : 'decrease'})
                    </p>
                  )}
                </div>
              </div>
              
              <label className="flex items-start cursor-pointer">
                <input
                  type="checkbox"
                  checked={confirmedShift}
                  onChange={(e) => setConfirmedShift(e.target.checked)}
                  className="mr-2 mt-1"
                  required
                />
                <span className="text-sm text-yellow-900">
                  I confirm that I want to shift this tenant. The tenant will be notified of the change, and their rent will be updated accordingly.
                </span>
              </label>
            </div>
          )}

          {/* New Unit Details Preview */}
          {selectedUnitDetails && (
            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <h3 className="font-semibold mb-3 flex items-center text-green-900">
                <ArrowRightLeft className="w-5 h-5 mr-2" />
                New Unit Details
              </h3>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-green-700">Unit Number:</p>
                  <p className="font-medium text-green-900">{selectedUnitDetails.unitNumber}</p>
                </div>
                <div>
                  <p className="text-green-700">Room Type:</p>
                  <p className="font-medium text-green-900">{selectedUnitDetails.type}</p>
                </div>
                <div>
                  <p className="text-green-700">New Rent:</p>
                  <p className="font-medium text-green-600">KSh {selectedUnitDetails.rent.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-green-700">Size:</p>
                  <p className="font-medium text-green-900">{selectedUnitDetails.size}</p>
                </div>
              </div>
            </div>
          )}

          {/* Submit Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={!selectedUnit || !confirmedShift || availableUnits.length === 0}
              className="flex-1 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 flex items-center justify-center disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              <ArrowRightLeft className="w-5 h-5 mr-2" />
              Confirm Shift
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-300 text-gray-700 py-3 rounded-lg hover:bg-gray-400"
            >
              Cancel
            </button>
          </div>

          {/* Info Alert */}
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Note:</strong> Once the shift is confirmed, the tenant's records will be updated immediately. 
              The tenant will receive a notification about the room change.
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ShiftTenantModal;
