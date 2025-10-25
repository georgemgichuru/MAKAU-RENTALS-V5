import React from 'react'
import { createContext, useState, useContext } from 'react';
import {useNavigate} from 'react-router-dom';
export const AppContext = createContext();

const ContextProvider = (props) => {

  //tenants for the specific landlord
  //remember for the tenant it fetches only their own details from the database and for the landlord it fetches all tenants under their properties

  // --- make tenants editable (use state) so payments can update tenant records ---
  const [mockTenants, setMockTenants] = useState([
    { id: 1, name: 'John Doe', email: 'john@email.com', room: 'A101', phone: '+254712345678', status: 'active', rentStatus: 'paid', rentAmount: 4000, rentDue: 0, prepaidMonths: 0, bookingId: 'BK001', password: 'Tenant123!', propertyId: 'P001' },
    { id: 2, name: 'Jane Smith', email: 'jane@email.com', room: 'B205', phone: '+254723456789', status: 'active', rentStatus: 'due', rentAmount: 6000, rentDue: 6000, prepaidMonths: 0, bookingId: 'BK002', propertyId: 'P001' },
    { id: 3, name: 'Mike Johnson', email: 'mike@email.com', room: 'C301', phone: '+254734567890', status: 'pending', rentStatus: 'overdue', rentAmount: 8000, rentDue: 16000, prepaidMonths: 0, bookingId: 'BK003', propertyId: 'P002' },
    { id: 4, name: 'Dickens Okoth', email: 'dickens@email.com', room: 'B205', phone: '+254723456789', status: 'active', rentStatus: 'due', rentAmount: 6000, rentDue: 6000, prepaidMonths: 0, bookingId: 'BK004', propertyId: 'P001' },
    { id: 5, name: 'Jerry Williams', email: 'jerry@email.com', room: 'C301', phone: '+254734567890', status: 'pending', rentStatus: 'overdue', rentAmount: 8000, rentDue: 16000, prepaidMonths: 0, bookingId: 'BK005', propertyId: 'P002' }
  ]);
  
  // Landlords with properties
  const [landlords, setLandlords] = useState([
    {
      id: 'LL001',
      name: 'Jane Smith',
      email: 'landlord@property.com',
      password: 'Landlord123!',
      role: 'landlord',
      phone: '+254722345678',
      properties: [
        {
          propertyId: 'P001',
          name: 'Sunrise Apartments',
          address: '123 Main St, Nairobi',
          city: 'Nairobi',
          numberOfUnits: 24,
          waterRate: 50,
          electricityRate: 25,
          mpesaTillNumber: '123456',
          mpesaStoreNumber: 'STORE123',
          taxRate: 7.5,
          managementFee: 'percentage',
          managementFeeValue: 10,
          streetName: 'Main Street',
          companyName: 'Sunrise Holdings',
          notes: 'Premium apartments with modern amenities',
          paymentInstructions: 'Pay by 5th of each month',
          ownerPhone: '+254722345678',
          roomTypes: [
            { id: 'RT001', name: 'Studio', baseRent: 18000 },
            { id: 'RT002', name: '1 Bedroom', baseRent: 25000 },
            { id: 'RT003', name: '2 Bedroom', baseRent: 35000 }
          ],
          images: [
            'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=400&h=300&fit=crop',
            'https://images.unsplash.com/photo-1582407947304-fd86f028f716?w=400&h=300&fit=crop'
          ]
        },
        {
          propertyId: 'P002',
          name: 'Ocean View Complex',
          address: '456 Beach Rd, Mombasa',
          city: 'Mombasa',
          numberOfUnits: 12,
          waterRate: 45,
          electricityRate: 22,
          mpesaTillNumber: '654321',
          mpesaStoreNumber: 'STORE456',
          taxRate: 7.5,
          managementFee: 'fixed',
          managementFeeValue: 5000,
          streetName: 'Beach Road',
          companyName: 'Ocean Realty',
          notes: 'Beachfront property with ocean views',
          paymentInstructions: 'Pay by 1st of each month',
          ownerPhone: '+254722345678',
          roomTypes: [
            { id: 'RT004', name: '2 Bedroom', baseRent: 40000 },
            { id: 'RT005', name: '3 Bedroom', baseRent: 55000 }
          ],
          images: [
            'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=400&h=300&fit=crop'
          ]
        }
      ]
    }
   
  ]);

  // Mock reports for the specific property for the landlord
const mockReports = [
  { tenant_ID: 1, title: 'Power Outlet Not Working', tenant: 'John Doe', room: 'A101', category: 'Electrical', priority: 'high', status: 'open', date: '15/03/2024', description: 'Main power outlet not working', propertyId: 'P001' },
  { tenant_ID: 2, title: 'Leaky Faucet', tenant: 'Jane Smith', room: 'B205', category: 'Plumbing', priority: 'medium', status: 'in-progress', date: '10/03/2024', description: 'Kitchen faucet leaking', propertyId: 'P001' },
  { tenant_ID: 3, title: 'Broken Window', tenant: 'Mike Johnson', room: 'C301', category: 'Maintenance', priority: 'medium', status: 'in-progress', date: '10/03/2024', description: 'Bedroom window cracked', propertyId: 'P002' }
];


  // canonical initial units (keep this as a plain const to avoid duplicate state names)
  const initialPropertyUnits = [
    {
      id: 1,
      unitNumber: "A101",
      type: "Studio",
      rent: 25000,
      size: "30 sqm",
      status: "available",
      isAvailable: true,
      tenant: "John Doe",
      propertyId: "P001"
    },
    {
      id: 2,
      unitNumber: "A205",
      type: "1 Bedroom",
      rent: 35000,
      size: "45 sqm",
      status: "available",
      isAvailable: true,
      tenant: "Jane Smith",
      propertyId: "P001"
    },
    {
      id: 3,
      unitNumber: "A312",
      type: "2 Bedroom",
      rent: 50000,
      size: "65 sqm",
      status: "occupied",
      isAvailable: false,
      tenant: "Mike Johnson",
      propertyId: "P002"
    },
    {
      id: 4,
      unitNumber: "B104",
      type: "Studio",
      rent: 28000,
      size: "32 sqm",
      status: "maintenance",
      isAvailable: false,
      tenant: null,
      propertyId: "P001"
    },
    {
      id: 5,
      unitNumber: "B201",
      type: "1 Bedroom",
      rent: 38000,
      size: "48 sqm",
      status: "available",
      isAvailable: true,
      tenant: null,
      propertyId: "P001"
    }
  ];

  // State for managing all property units (single declaration to avoid duplicate identifier errors)
  const [propertyUnits, setPropertyUnits] = useState(initialPropertyUnits);

  // helper: get units for a specific property
  const getUnitsByProperty = (propertyId) => {
    return (propertyUnits || []).filter(u => u.propertyId === propertyId);
  };

  // helper: get simple stats for a property
  const getPropertyUnitStats = (propertyId) => {
    const unitsForProperty = getUnitsByProperty(propertyId);
    const total = unitsForProperty.length;
    const available = unitsForProperty.filter(u => u.isAvailable).length;
    const occupied = unitsForProperty.filter(u => u.status === 'occupied').length;
    const revenue = unitsForProperty
      .filter(u => u.status === 'occupied')
      .reduce((s, u) => s + (Number(u.rent) || 0), 0);
    return { total, available, occupied, revenue, units: unitsForProperty };
  };

  // Function to add a new unit
  const addUnit = (newUnit) => {
    setPropertyUnits(prev => [...prev, newUnit]);
  };

  // Function to update unit availability / status
  const updateUnitAvailability = (unitId, isAvailable) => {
    setPropertyUnits(prev =>
      prev.map(unit => {
        if (unit.id === unitId) {
          return {
            ...unit,
            isAvailable: isAvailable,
            status: isAvailable ? 'available' : 'occupied'
          };
        }
        return unit;
      })
    );
  };

  // central transactions store (tenantId uses the same id as tenants in mockTenants)
  const [transactions, setTransactions] = useState([
    {
      id: 'TXN1001',
      tenantId: 1,
      date: '2024-03-05',
      description: 'Rent Payment - March 2024',
      amount: 25000,
      type: 'Payment',
      status: 'completed',
      reference: 'MPX1234567890',
      paymentMethod: 'M-PESA',
      propertyId: 'P001'
    },
    {
      id: 'TXN1002',
      tenantId: 2,
      date: '2024-03-01',
      description: 'Rent Payment - March 2024',
      amount: 35000,
      type: 'Payment',
      status: 'completed',
      reference: 'MPX2234567890',
      paymentMethod: 'M-PESA',
      propertyId: 'P001'
    },
    {
      id: 'TXN1003',
      tenantId: 3,
      date: '2024-02-28',
      description: 'Deposit Payment',
      amount: 50000,
      type: 'Deposit',
      status: 'completed',
      reference: 'MPX3234567890',
      paymentMethod: 'Bank Transfer',
      propertyId: 'P002'
    },
    {
      id: 'TXN1004',
      tenantId: 1,
      date: '2024-02-05',
      description: 'Rent Payment - February 2024',
      amount: 25000,
      type: 'Payment',
      status: 'completed',
      reference: 'MPX4234567890',
      paymentMethod: 'M-PESA',
      propertyId: 'P001'
    },
     {
      id: 'TXN1001',
      tenantId: 1,
      date: '2024-03-05',
      description: 'Rent Payment - March 2024',
      amount: 25000,
      type: 'Payment',
      status: 'completed',
      reference: 'MPX1234567890',
      paymentMethod: 'M-PESA',
      propertyId: 'P001'
    },
    {
      id: 'TXN1002',
      tenantId: 2,
      date: '2024-03-01',
      description: 'Rent Payment - March 2024',
      amount: 35000,
      type: 'Payment',
      status: 'completed',
      reference: 'MPX2234567890',
      paymentMethod: 'M-PESA',
      propertyId: 'P001'
    },
    {
      id: 'TXN1003',
      tenantId: 3,
      date: '2024-02-28',
      description: 'Deposit Payment',
      amount: 50000,
      type: 'Deposit',
      status: 'completed',
      reference: 'MPX3234567890',
      paymentMethod: 'Bank Transfer',
      propertyId: 'P002'
    },
    {
      id: 'TXN1004',
      tenantId: 1,
      date: '2024-02-05',
      description: 'Rent Payment - February 2024',
      amount: 25000,
      type: 'Payment',
      status: 'completed',
      reference: 'MPX4234567890',
      paymentMethod: 'M-PESA',
      propertyId: 'P001'
    },
  ]);

  // helper: add transaction (updates local context)
  const addTransaction = (txn) => {
    setTransactions(prev => [{ ...txn }, ...prev]);
  };

  // helper: apply a payment to a tenant record and record transaction
  const applyPayment = (txn) => {
    // add transaction
    setTransactions(prev => [{ ...txn }, ...prev]);

    // update tenant financial data
    setMockTenants(prev =>
      prev.map(t => {
        if (String(t.id) === String(txn.tenantId)) {
          const monthly = Number(t.rentAmount) || 0;
          const paymentAmount = Number(txn.amount) || 0;

          // compute how many full months the payment covers
          const monthsPaid = monthly > 0 ? Math.floor(paymentAmount / monthly) : 0;
          const remainder = monthly > 0 ? (paymentAmount - monthsPaid * monthly) : 0;

          // update prepaidMonths
          const newPrepaid = (t.prepaidMonths || 0) + monthsPaid;

          // update rentDue: subtract paymentAmount, but don't go below 0
          const currentDue = (t.rentDue !== undefined && t.rentDue !== null) ? Number(t.rentDue) : monthly;
          const newDue = Math.max(0, currentDue - paymentAmount);

          // determine new status
          let newStatus = t.rentStatus;
          if (newPrepaid > 0 || newDue === 0) {
            newStatus = 'paid';
          } else if (newDue > 0 && newDue < monthly) {
            newStatus = 'partial';
          } else if (newDue > 0) {
            newStatus = 'due';
          }

          return {
            ...t,
            prepaidMonths: newPrepaid,
            rentDue: newDue,
            rentStatus: newStatus
          };
        }
        return t;
      })
    );
  };

  // helper: get transactions by tenant id
  const getTransactionsByTenant = (tenantId) => {
    return transactions.filter(t => t.tenantId == tenantId); // loose equality to tolerate string/number ids
  };

  // Selected property (so admin pages know which property is active)
  const [selectedPropertyId, setSelectedPropertyId] = useState(
    // prefer existing landlord/property if present
    landlords?.[0]?.properties?.[0]?.propertyId || (initialPropertyUnits[0]?.propertyId ?? null)
  );

  // Admin: add a new property for a landlord
  const addProperty = (landlordId, propertyData = {}) => {
    setLandlords(prev =>
      prev.map(l => {
        if (l.id !== landlordId) return l;
        const newPropertyId = `P${Date.now()}`;
        const newProperty = {
          propertyId: newPropertyId,
          name: propertyData.name || `New Property ${newPropertyId}`,
          address: propertyData.streetName || propertyData.address || '',
          city: propertyData.city || '',
          numberOfUnits: Number(propertyData.numberOfUnits) || 0,
          waterRate: Number(propertyData.waterRate) || 0,
          electricityRate: Number(propertyData.electricityRate) || 0,
          mpesaTillNumber: propertyData.mpesaTillNumber || '',
          mpesaStoreNumber: propertyData.mpesaStoreNumber || '',
          taxRate: Number(propertyData.taxRate) || 0,
          managementFee: propertyData.managementFee || '',
          managementFeeValue: propertyData.managementFeeValue || 0,
          streetName: propertyData.streetName || '',
          companyName: propertyData.companyName || '',
          notes: propertyData.notes || '',
          paymentInstructions: propertyData.paymentInstructions || '',
          ownerPhone: propertyData.ownerPhone || '',
          roomTypes: propertyData.roomTypes || [],
          images: propertyData.images || []
        };
        return { ...l, properties: [...l.properties, newProperty] };
      })
    );
  };

  // Update property fields
  const updateProperty = (landlordId, propertyId, updates = {}) => {
    setLandlords(prev =>
      prev.map(l => {
        if (l.id !== landlordId) return l;
        return {
          ...l,
          properties: l.properties.map(p =>
            p.propertyId === propertyId ? { ...p, ...updates } : p
          )
        };
      })
    );
  };

  // Room type helpers
  const addRoomType = (landlordId, propertyId, roomType = {}) => {
    setLandlords(prev =>
      prev.map(l => {
        if (l.id !== landlordId) return l;
        return {
          ...l,
          properties: l.properties.map(p =>
            p.propertyId === propertyId
              ? {
                  ...p,
                  roomTypes: [
                    ...(p.roomTypes || []),
                    { id: `RT${Date.now()}`, name: roomType.name, baseRent: Number(roomType.baseRent) || 0 }
                  ]
                }
              : p
          )
        };
      })
    );
  };

  const deleteRoomType = (landlordId, propertyId, roomTypeId) => {
    setLandlords(prev =>
      prev.map(l => {
        if (l.id !== landlordId) return l;
        return {
          ...l,
          properties: l.properties.map(p =>
            p.propertyId === propertyId
              ? { ...p, roomTypes: (p.roomTypes || []).filter(rt => rt.id !== roomTypeId) }
              : p
          )
        };
      })
    );
  };

  return (
    <AppContext.Provider value={{
      mockTenants,
      mockReports,
      propertyUnits,
      // expose property selection + management helpers used across the app
      selectedPropertyId,
      setSelectedPropertyId,
      addProperty,
      updateProperty,
      addRoomType,
      deleteRoomType,
      addUnit,
      updateUnitAvailability,
      // helpers for consumers
      getUnitsByProperty,
      getPropertyUnitStats,
      // transaction API
      transactions,
      addTransaction,
      applyPayment,
      getTransactionsByTenant,
      landlords,
      setLandlords
    }}>
      {props.children}
    </AppContext.Provider>
  )
}

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within an AppContext Provider');
  }
  return context;
};


export default ContextProvider;

// ============== ADD PROPERTY FORM COMPONENT ==============
export const AddPropertyForm = () => {
  const navigate = useNavigate();
  const { addProperty } = useContext(AppContext);
  const [formData, setFormData] = useState({
    name: '',
    numberOfUnits: '',
    city: '',
    waterRate: '',
    electricityRate: '',
    mpesaType: 'till',
    mpesaStoreNumber: '',
    mpesaTillNumber: '',
    rentPenaltyType: '',
    taxRate: 7.5,
    recurringBills: [{ type: '', amount: '' }],
    managementFee: '',
    streetName: '',
    companyName: '',
    notes: '',
    paymentInstructions: '',
    ownerPhone: '+254'
  });

  const [errors, setErrors] = useState({});

  const validate = () => {
    const newErrors = {};
    // Required fields
    if (!formData.name.trim()) newErrors.name = 'Property name is required';
    if (!formData.numberOfUnits || isNaN(formData.numberOfUnits) || Number(formData.numberOfUnits) <= 0) newErrors.numberOfUnits = 'Number of units must be a positive number';
    if (!formData.city.trim()) newErrors.city = 'City is required';
    if (!formData.streetName.trim()) newErrors.streetName = 'Property address is required';
    if (!formData.ownerPhone.match(/^\+254\d{9}$/)) newErrors.ownerPhone = 'Phone must be in +254XXXXXXXXX format';

    // Water/Electricity rates
    if (formData.waterRate === '' || isNaN(formData.waterRate) || Number(formData.waterRate) < 0) newErrors.waterRate = 'Water rate must be a positive number';
    if (formData.electricityRate === '' || isNaN(formData.electricityRate) || Number(formData.electricityRate) < 0) newErrors.electricityRate = 'Electricity rate must be a positive number';

    // MPESA validation
    if (formData.mpesaType === 'paybill') {
      if (!formData.mpesaStoreNumber.trim()) newErrors.mpesaStoreNumber = 'Store number is required for Paybill';
      if (!formData.mpesaTillNumber.match(/^\d+$/)) newErrors.mpesaTillNumber = 'Paybill number must be numeric';
    } else if (formData.mpesaType === 'till') {
      if (!formData.mpesaTillNumber.match(/^\d+$/)) newErrors.mpesaTillNumber = 'Till number must be numeric';
    }

    return newErrors;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setErrors(prev => ({ ...prev, [name]: undefined }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    // Add property to context
    addProperty('LL001', formData);

    // Prepare for backend (commented out)
    /*
    try {
      const response = await fetch('/api/properties', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (!response.ok) throw new Error('Failed to add property');
      // Optionally handle response
    } catch (err) {
      alert('Error sending data to backend');
      return;
    }
    */

    alert('Property added successfully!');
    navigate('/admin/organisation');
  };

  const handleClear = () => {
    setFormData({
      name: '',
      numberOfUnits: '',
      city: '',
      waterRate: '',
      electricityRate: '',
      mpesaType: 'till',
      mpesaStoreNumber: '',
      mpesaTillNumber: '',
      rentPenaltyType: '',
      taxRate: 7.5,
      recurringBills: [{ type: '', amount: '' }],
      managementFee: '',
      streetName: '',
      companyName: '',
      notes: '',
      paymentInstructions: '',
      ownerPhone: '+254'
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-3xl mx-auto">
        <button
          onClick={() => navigate('/admin/organisation')}
          className="mb-6 flex items-center text-blue-600 hover:text-blue-800 font-medium"
        >
          <span className="mr-2">←</span> Back
        </button>
        <div className="bg-white rounded-lg shadow-md p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Property Form</h1>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Property Name */}
            <div className="grid grid-cols-3 gap-4 items-center">
              <label className="text-right font-medium text-gray-700">
                Property Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="Property Name ..."
                className={`col-span-2 px-4 py-2 border ${errors.name ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                required
              />
              {errors.name && <span className="text-red-500 col-span-3 text-sm">{errors.name}</span>}
            </div>
            {/* Number of Units */}
            <div className="grid grid-cols-3 gap-4 items-center">
              <label className="text-right font-medium text-gray-700">
                Number of units <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                name="numberOfUnits"
                value={formData.numberOfUnits}
                onChange={handleInputChange}
                min="1"
                className={`col-span-2 px-4 py-2 border ${errors.numberOfUnits ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                required
              />
              {errors.numberOfUnits && <span className="text-red-500 col-span-3 text-sm">{errors.numberOfUnits}</span>}
            </div>
            {/* City */}
            <div className="grid grid-cols-3 gap-4 items-center">
              <label className="text-right font-medium text-gray-700">
                City <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="city"
                value={formData.city}
                onChange={handleInputChange}
                placeholder="City or nearest town ..."
                className={`col-span-2 px-4 py-2 border ${errors.city ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                required
              />
              {errors.city && <span className="text-red-500 col-span-3 text-sm">{errors.city}</span>}
            </div>
            {/* MPESA */}
            <div className="grid grid-cols-3 gap-4 items-start">
              <label className="text-right font-medium text-gray-700 pt-2">
                MPESA <span className="text-red-500">*</span>
              </label>
              <div className="col-span-2 space-y-3">
                <div className="flex gap-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="mpesaType"
                      value="paybill"
                      checked={formData.mpesaType === 'paybill'}
                      onChange={handleInputChange}
                      required
                      className="mr-2"
                    />
                    Paybill
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="mpesaType"
                      value="till"
                      checked={formData.mpesaType === 'till'}
                      onChange={handleInputChange}
                      className="mr-2"
                    />
                    Till Number
                  </label>
                </div>
                {formData.mpesaType === 'paybill' && (
                  <div>
                    <label className="text-sm text-gray-600 flex items-center mb-1">
                      Store Number 
                      <span className="ml-1 text-gray-400 cursor-help" title="Store Number Info">ⓘ</span>
                    </label>
                    <input
                      type="text"
                      name="mpesaStoreNumber"
                      value={formData.mpesaStoreNumber}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-2 border ${errors.mpesaStoreNumber ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                      required={formData.mpesaType === 'paybill'}
                    />
                    {errors.mpesaStoreNumber && <span className="text-red-500 text-sm">{errors.mpesaStoreNumber}</span>}
                  </div>
                )}
                <div>
                  <label className="text-sm text-gray-600 mb-1 block">
                    {formData.mpesaType === 'paybill' ? 'Paybill Number' : 'Till Number'}
                  </label>
                  <input
                    type="text"
                    name="mpesaTillNumber"
                    value={formData.mpesaTillNumber}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-2 border ${errors.mpesaTillNumber ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                    required
                  />
                  {errors.mpesaTillNumber && <span className="text-red-500 text-sm">{errors.mpesaTillNumber}</span>}
                </div>
              </div>
            </div>
            {/* Street Name */}
            <div className="grid grid-cols-3 gap-4 items-center">
              <label className="text-right font-medium text-gray-700">
                Property Address <span className="text-red-500">*</span>
              </label> 
              <input
                type="text"
                name="streetName"
                value={formData.streetName}
                onChange={handleInputChange}
                placeholder="Address / Closest street Name ..."
                required
                className={`col-span-2 px-4 py-2 border ${errors.streetName ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
              />
              {errors.streetName && <span className="text-red-500 col-span-3 text-sm">{errors.streetName}</span>}
            </div>
            {/* Owner Phone Number */}
            <div className="grid grid-cols-3 gap-4 items-start">
              <label className="text-right font-medium text-gray-700 pt-2 flex items-center">
                Owner Phone Number <span className="text-red-500">*</span>
                <span className="ml-1 text-gray-400 cursor-help" title="Phone Info">ⓘ</span>
              </label>
              <div className="col-span-2">
                <input
                  type="tel"
                  name="ownerPhone"
                  value={formData.ownerPhone}
                  onChange={handleInputChange}
                  required
                  placeholder="+254XXXXXXXXX"
                  className={`w-full px-4 py-2 border ${errors.ownerPhone ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                />
                <p className="text-sm text-gray-500 mt-1">
                  The phone number should be in international format: +254XXXXXXXXX.
                </p>
                {errors.ownerPhone && <span className="text-red-500 text-sm">{errors.ownerPhone}</span>}
              </div>
            </div>
            {/* Submit Buttons */}
            <div className="pt-6 space-y-3">
              <button
                type="submit"
                className="w-full bg-blue-900 text-white py-3 rounded-lg hover:bg-blue-800 font-semibold text-lg flex items-center justify-center"
              >
                <span className="mr-2">+</span> Add Property
              </button>
              <button
                type="button"
                onClick={handleClear}
                className="w-full bg-white border-2 border-gray-300 text-gray-700 py-3 rounded-lg hover:bg-gray-50 font-semibold"
              >
                Clear
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};