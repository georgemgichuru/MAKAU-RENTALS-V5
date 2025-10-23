import { useState } from 'react';
import { Building, AlertCircle, Eye, EyeOff, CheckCircle, X, Info, CreditCard, Loader2, Home, Users, ArrowLeft, Upload, FileText, Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '/src/context/AppContext.jsx';

const UnifiedAuthSystem = ({ onLogin }) => {
  const navigate = useNavigate();
  const { landlords, mockTenants } = useAppContext();
  const [authMode, setAuthMode] = useState('login');
  const [userType, setUserType] = useState('tenant');
  const [currentStep, setCurrentStep] = useState(1);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [paymentStatus, setPaymentStatus] = useState(null);
  
  // Login Form Data
  const [loginData, setLoginData] = useState({
    email: '',
    password: ''
  });

  // Tenant Signup Data
  const [tenantData, setTenantData] = useState({
    // Step 2: Personal Info
    landlordId: '',
    name: '',
    governmentId: '',
    email: '',
    phone: '',
    emergencyContact: '',
    // Step 3: Property Selection
    selectedProperty: '',
    selectedRoom: '',
    monthlyRent: 0,
    depositAmount: 0,
    // Step 4: Document Upload
    idDocument: null,
    // Step 5: Payment
    mpesaPhone: '',
    // Step 6: Account Security
    password: '',
    confirmPassword: ''
  });

  // Available properties based on landlord ID
  const [availableProperties, setAvailableProperties] = useState([]);
  const [availableRooms, setAvailableRooms] = useState([]);

  // Landlord Signup Data
  const [landlordData, setLandlordData] = useState({
    fullName: '',
    nationalId: '',
    tillNumber: '',
    email: '',
    phone: '',
    address: '',
    website: '',
    password: '',
    confirmPassword: '',
    properties: [
      {
        id: Date.now(),
        propertyName: '',
        propertyAddress: '',
        units: []
      }
    ]
  });

  // Bulk unit addition state
  const [bulkUnitMode, setBulkUnitMode] = useState({});

  const pricingTiers = [
    { min: 1, max: 10, price: 2000, label: '1-10 units' },
    { min: 11, max: 20, price: 2500, label: '11-20 units' },
    { min: 21, max: 50, price: 4500, label: '21-50 units' },
    { min: 51, max: 100, price: 7500, label: '51-100 units' },
    { min: 101, max: Infinity, price: 0, label: '100+ units (Contact us)' }
  ];

  // Validation functions
  const validateEmail = (email) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const validateKenyanPhone = (phone) => {
    const clean = phone.replace(/[\s\-$$$$]/g, '');
    return /^(\+254|254)?[17]\d{8}$/.test(clean);
  };

  const validateKenyanID = (id) => {
    return /^\d{8}$/.test(id) || /^[A-Z]{2}\d{7}$/i.test(id);
  };

  const validatePassword = (password) => {
    return {
      isValid: password.length >= 8 && /[A-Z]/.test(password) && /[a-z]/.test(password) && /\d/.test(password),
      minLength: password.length >= 8,
      hasUppercase: /[A-Z]/.test(password),
      hasLowercase: /[a-z]/.test(password),
      hasNumber: /\d/.test(password)
    };
  };

  // Calculate total units
  const calculateTotalUnits = () => {
    return landlordData.properties.reduce((total, property) => {
      return total + property.units.length;
    }, 0);
  };

  // Calculate monthly fee
  const calculateMonthlyFee = () => {
    const totalUnits = calculateTotalUnits();
    const tier = pricingTiers.find(t => totalUnits >= t.min && totalUnits <= t.max);
    return tier ? tier.price : 0;
  };

  // Fetch properties when landlord ID is entered
  const fetchLandlordProperties = (landlordId) => {
    const landlord = mockUsers.landlords.find(l => l.id === landlordId);
    if (landlord && landlord.properties) {
      setAvailableProperties(landlord.properties);
      return true;
    }
    setAvailableProperties([]);
    return false;
  };

  // Fetch available rooms when property is selected
  const fetchAvailableRooms = (propertyId) => {
    const property = availableProperties.find(p => p.id === propertyId);
    if (property) {
      const availableUnits = property.units.filter(u => !u.occupied);
      setAvailableRooms(availableUnits);
      return availableUnits;
    }
    setAvailableRooms([]);
    return [];
  };

  // Handle room selection
  const handleRoomSelection = (roomId) => {
    const room = availableRooms.find(r => r.id === roomId);
    if (room) {
      setTenantData(prev => ({
        ...prev,
        selectedRoom: roomId,
        monthlyRent: room.rent,
        depositAmount: room.rent // Deposit = 1 month rent
      }));
    }
  };

  // Handle file upload
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError('File size must be less than 5MB');
        return;
      }
      // Validate file type
      const validTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
      if (!validTypes.includes(file.type)) {
        setError('Only PDF, JPEG, JPG, and PNG files are allowed');
        return;
      }
      setTenantData(prev => ({ ...prev, idDocument: file }));
      setError('');
    }
  };

  // Handle Login
  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));

      let user = landlords.find(u => u.email === loginData.email);
      let role = 'admin';
      
      if (!user) {
        user = mockTenants.find(u => u.email === loginData.email);
        role = 'tenant';
      }

      if (!user || user.password !== loginData.password) {
        throw new Error('Invalid email or password');
      }

      const { password, ...userData } = user;
      onLogin(role, userData);

    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Process tenant deposit payment
  const processTenantDepositPayment = async () => {
    setIsLoading(true);
    setPaymentStatus(null);

    try {
      if (!validateKenyanPhone(tenantData.mpesaPhone)) {
        throw new Error('Invalid M-Pesa phone number');
      }

      // Simulate M-Pesa STK Push
      await new Promise(resolve => setTimeout(resolve, 3000));

      const isSuccess = Math.random() > 0.2; // 80% success rate
      
      if (isSuccess) {
        setPaymentStatus({
          type: 'success',
          message: 'Deposit payment successful!',
          transactionId: `MPX${Date.now()}`
        });
        return true;
      } else {
        throw new Error('Payment failed. Please try again.');
      }
    } catch (err) {
      setPaymentStatus({
        type: 'error',
        message: err.message
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Tenant Signup Navigation
  const handleTenantNext = async () => {
    setError('');

    // Step 2: Personal Information validation
    if (currentStep === 2) {
      if (!tenantData.landlordId.trim()) {
        setError('Landlord ID is required');
        return;
      }
      if (!tenantData.name.trim()) {
        setError('Full name is required');
        return;
      }
      if (!validateKenyanID(tenantData.governmentId)) {
        setError('Invalid Government ID format');
        return;
      }
      if (!validateEmail(tenantData.email)) {
        setError('Invalid email address');
        return;
      }
      if (!validateKenyanPhone(tenantData.phone)) {
        setError('Invalid phone number format');
        return;
      }
      if (!validateKenyanPhone(tenantData.emergencyContact)) {
        setError('Invalid emergency contact format');
        return;
      }

      // Fetch landlord properties
      const found = fetchLandlordProperties(tenantData.landlordId);
      if (!found) {
        setError('Landlord ID not found. Please check and try again.');
        return;
      }
    }

    // Step 3: Property & Room Selection validation
    if (currentStep === 3) {
      if (!tenantData.selectedProperty) {
        setError('Please select a property');
        return;
      }
      if (!tenantData.selectedRoom) {
        setError('Please select a room');
        return;
      }
    }

    // Step 4: Document Upload validation
    if (currentStep === 4) {
      if (!tenantData.idDocument) {
        setError('Please upload your ID document');
        return;
      }
    }

    // Step 5: Deposit Payment
    if (currentStep === 5) {
      const success = await processTenantDepositPayment();
      if (!success) return;
    }

    // Step 6: Account Security validation
    if (currentStep === 6) {
      const passValidation = validatePassword(tenantData.password);
      if (!passValidation.isValid) {
        setError('Password does not meet all requirements');
        return;
      }
      if (tenantData.password !== tenantData.confirmPassword) {
        setError('Passwords do not match');
        return;
      }

      // Complete registration
      setIsLoading(true);
      try {
        await new Promise(resolve => setTimeout(resolve, 2000));
        alert('Tenant registration successful! Please login.');
        setAuthMode('login');
        resetTenantForm();
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
      return;
    }

    setCurrentStep(prev => prev + 1);
  };

  const resetTenantForm = () => {
    setTenantData({
      landlordId: '',
      name: '',
      governmentId: '',
      email: '',
      phone: '',
      emergencyContact: '',
      selectedProperty: '',
      selectedRoom: '',
      monthlyRent: 0,
      depositAmount: 0,
      idDocument: null,
      mpesaPhone: '',
      password: '',
      confirmPassword: ''
    });
    setCurrentStep(1);
    setAvailableProperties([]);
    setAvailableRooms([]);
    setPaymentStatus(null);
  };

  // Handle Landlord Signup Navigation
  const handleLandlordNext = async () => {
    setError('');

    // Step 2: Personal Information validation
    if (currentStep === 2) {
      if (!landlordData.fullName.trim()) {
        setError('Full name is required');
        return;
      }
      if (!validateKenyanID(landlordData.nationalId)) {
        setError('Invalid National ID format');
        return;
      }
      if (!landlordData.tillNumber.trim()) {
        setError('M-Pesa Till Number is required');
        return;
      }
      if (!validateEmail(landlordData.email)) {
        setError('Invalid email address');
        return;
      }
      if (!validateKenyanPhone(landlordData.phone)) {
        setError('Invalid phone number format');
        return;
      }
      if (!landlordData.address.trim()) {
        setError('Property address is required');
        return;
      }

      const passValidation = validatePassword(landlordData.password);
      if (!passValidation.isValid) {
        setError('Password does not meet all requirements');
        return;
      }
      if (landlordData.password !== landlordData.confirmPassword) {
        setError('Passwords do not match');
        return;
      }
    }

    // Step 3: Properties validation
    if (currentStep === 3) {
      if (calculateTotalUnits() === 0) {
        setError('Please add at least one unit');
        return;
      }

      for (const property of landlordData.properties) {
        if (!property.propertyName.trim()) {
          setError('All properties must have a name');
          return;
        }
        if (!property.propertyAddress.trim()) {
          setError('All properties must have an address');
          return;
        }
        for (const unit of property.units) {
          if (!unit.unitNumber.trim()) {
            setError('All units must have a unit number');
            return;
          }
          if (!unit.monthlyRent || unit.monthlyRent <= 0) {
            setError('All units must have a valid rent amount');
            return;
          }
        }
      }
    }

    // Step 4: Payment
    if (currentStep === 4) {
      const success = await processLandlordPayment();
      if (!success) return;
      
      // Complete registration after successful payment
      setIsLoading(true);
      try {
        await new Promise(resolve => setTimeout(resolve, 2000));
        alert('Landlord registration successful! Please login.');
        setAuthMode('login');
        resetLandlordForm();
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
      return;
    }

    setCurrentStep(prev => prev + 1);
  };

  // M-Pesa Payment Simulation for Landlord
  const processLandlordPayment = async () => {
    setIsLoading(true);
    setPaymentStatus(null);

    try {
      const amount = calculateMonthlyFee();
      if (amount === 0) {
        throw new Error('Please contact us for 100+ units pricing');
      }

      await new Promise(resolve => setTimeout(resolve, 3000));

      const isSuccess = Math.random() > 0.2;
      
      if (isSuccess) {
        setPaymentStatus({
          type: 'success',
          message: 'Payment successful!',
          transactionId: `MPX${Date.now()}`
        });
        return true;
      } else {
        throw new Error('Payment failed. Please try again.');
      }
    } catch (err) {
      setPaymentStatus({
        type: 'error',
        message: err.message
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const resetLandlordForm = () => {
    setLandlordData({
      fullName: '',
      nationalId: '',
      tillNumber: '',
      email: '',
      phone: '',
      address: '',
      website: '',
      password: '',
      confirmPassword: '',
      properties: [{ id: Date.now(), propertyName: '', propertyAddress: '', units: [] }]
    });
    setCurrentStep(1);
    setPaymentStatus(null);
    setBulkUnitMode({});
  };

  // Property Management Functions
  const addProperty = () => {
    setLandlordData(prev => ({
      ...prev,
      properties: [...prev.properties, {
        id: Date.now(),
        propertyName: '',
        propertyAddress: '',
        units: []
      }]
    }));
  };

  const removeProperty = (propertyId) => {
    setLandlordData(prev => ({
      ...prev,
      properties: prev.properties.filter(p => p.id !== propertyId)
    }));
  };

  const updatePropertyField = (propertyId, field, value) => {
    setLandlordData(prev => ({
      ...prev,
      properties: prev.properties.map(property => 
        property.id === propertyId ? { ...property, [field]: value } : property
      )
    }));
  };

  // Unit Management Functions
  const addUnit = (propertyId) => {
    setLandlordData(prev => ({
      ...prev,
      properties: prev.properties.map(property => {
        if (property.id === propertyId) {
          return {
            ...property,
            units: [...property.units, {
              id: Date.now(),
              unitNumber: '',
              roomType: 'studio',
              monthlyRent: ''
            }]
          };
        }
        return property;
      })
    }));
  };

  // <CHANGE> Added bulk unit addition functionality
  const addBulkUnits = (propertyId, bulkData) => {
    const { count, roomType, rentAmount, startNumber } = bulkData;
    const newUnits = [];
    
    for (let i = 0; i < parseInt(count); i++) {
      newUnits.push({
        id: Date.now() + i,
        unitNumber: startNumber ? `${startNumber}${i + 1}` : `Unit ${i + 1}`,
        roomType: roomType,
        monthlyRent: rentAmount
      });
    }

    setLandlordData(prev => ({
      ...prev,
      properties: prev.properties.map(property => {
        if (property.id === propertyId) {
          return {
            ...property,
            units: [...property.units, ...newUnits]
          };
        }
        return property;
      })
    }));

    // Reset bulk mode for this property
    setBulkUnitMode(prev => ({ ...prev, [propertyId]: null }));
  };

  const removeUnit = (propertyId, unitId) => {
    setLandlordData(prev => ({
      ...prev,
      properties: prev.properties.map(property => {
        if (property.id === propertyId) {
          return {
            ...property,
            units: property.units.filter(u => u.id !== unitId)
          };
        }
        return property;
      })
    }));
  };

  const updateUnitField = (propertyId, unitId, field, value) => {
    setLandlordData(prev => ({
      ...prev,
      properties: prev.properties.map(property => {
        if (property.id === propertyId) {
          return {
            ...property,
            units: property.units.map(unit =>
              unit.id === unitId ? { ...unit, [field]: value } : unit
            )
          };
        }
        return property;
      })
    }));
  };

  const prevStep = () => {
    setError('');
    setPaymentStatus(null);
    setCurrentStep(prev => prev - 1);
  };

  // <CHANGE> Added step indicator component for multi-step forms
  const StepIndicator = ({ currentStep, totalSteps, labels }) => (
    <div className="mb-8">
      <div className="flex items-center justify-between">
        {Array.from({ length: totalSteps }, (_, i) => i + 1).map((step, index) => (
          <div key={step} className="flex items-center flex-1">
            <div className="flex flex-col items-center flex-1">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-colors ${
                step < currentStep ? 'bg-green-500 text-white' :
                step === currentStep ? 'bg-blue-600 text-white' :
                'bg-gray-200 text-gray-500'
              }`}>
                {step < currentStep ? <Check size={20} /> : step}
              </div>
              {labels && labels[index] && (
                <span className="text-xs mt-2 text-center text-gray-600">{labels[index]}</span>
              )}
            </div>
            {index < totalSteps - 1 && (
              <div className={`h-1 flex-1 mx-2 transition-colors ${
                step < currentStep ? 'bg-green-500' : 'bg-gray-200'
              }`} />
            )}
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <Building className="w-16 h-16 text-blue-600 mx-auto mb-4" />
          <h1 className="text-4xl font-bold text-blue-600 mb-2">TenantHub</h1>
          <p className="text-gray-600">Property Management Made Simple</p>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          {/* Auth Mode Selector */}
          <div className="flex border-b">
            <button
              onClick={() => { setAuthMode('login'); setError(''); setCurrentStep(1); }}
              className={`flex-1 py-4 font-semibold transition-colors ${
                authMode === 'login' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Login
            </button>
            <button
              onClick={() => { setAuthMode('signup'); setError(''); setCurrentStep(1); }}
              className={`flex-1 py-4 font-semibold transition-colors ${
                authMode === 'signup' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Sign Up
            </button>
          </div>

          <div className="p-8">
            {/* LOGIN MODE */}
            {authMode === 'login' && (
              <div>
                <h2 className="text-2xl font-bold mb-6">Welcome Back</h2>
                
                {error && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start">
                    <AlertCircle className="w-5 h-5 text-red-500 mr-2 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                )}

                <form onSubmit={handleLogin} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Email</label>
                    <input
                      type="email"
                      value={loginData.email}
                      onChange={(e) => setLoginData(prev => ({ ...prev, email: e.target.value }))}
                      className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                      placeholder="your.email@example.com"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Password</label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        value={loginData.password}
                        onChange={(e) => setLoginData(prev => ({ ...prev, password: e.target.value }))}
                        className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none pr-12"
                        placeholder="Enter your password"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium transition-colors"
                  >
                    {isLoading ? 'Signing In...' : 'Sign In'}
                  </button>
                </form>

                <div className="mt-4 text-center">
                  <button 
                    onClick={() => navigate('/forgot-password')}
                    className="text-blue-600 hover:underline text-sm"
                  >
                    Forgot Password?
                  </button>
                </div>

                {/* Demo Logins */}
                <div className="mt-6 pt-6 border-t">
                  <p className="text-sm text-center text-gray-600 mb-3">Quick Demo:</p>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setLoginData({ email: 'landlord@property.com', password: 'Landlord123!' })}
                      className="px-4 py-2 bg-gray-50 hover:bg-gray-100 rounded-lg text-sm"
                    >
                      <Home className="inline mr-1" size={16} />
                      Landlord
                    </button>
                    <button
                      type="button"
                      onClick={() => setLoginData({ email: 'john@email.com', password: 'Tenant123!' })}
                      className="px-4 py-2 bg-gray-50 hover:bg-gray-100 rounded-lg text-sm"
                    >
                      <Users className="inline mr-1" size={16} />
                      Tenant
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* SIGNUP MODE */}
            {authMode === 'signup' && (
              <div>
                {/* Step 1: User Type Selector */}
                {currentStep === 1 && (
                  <div>
                    <h2 className="text-2xl font-bold mb-6">Choose Account Type</h2>
                    <div className="grid grid-cols-2 gap-4">
                      <button
                        onClick={() => { setUserType('tenant'); setCurrentStep(2); }}
                        className="p-6 border-2 border-gray-200 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all"
                      >
                        <Users className="w-12 h-12 text-blue-600 mx-auto mb-3" />
                        <h3 className="font-bold text-lg mb-2">Tenant</h3>
                        <p className="text-sm text-gray-600">Find and manage your rental</p>
                      </button>
                      <button
                        onClick={() => { setUserType('landlord'); setCurrentStep(2); }}
                        className="p-6 border-2 border-gray-200 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all"
                      >
                        <Home className="w-12 h-12 text-blue-600 mx-auto mb-3" />
                        <h3 className="font-bold text-lg mb-2">Landlord</h3>
                        <p className="text-sm text-gray-600">Manage your properties</p>
                      </button>
                    </div>
                  </div>
                )}

                {/* TENANT SIGNUP FLOW */}
                {userType === 'tenant' && currentStep > 1 && (
                  <div>
                    {/* <CHANGE> Added step indicator for tenant signup */}
                    <StepIndicator 
                      currentStep={currentStep - 1} 
                      totalSteps={5}
                      labels={['Personal', 'Property', 'Documents', 'Payment', 'Security']}
                    />

                    {/* Step 2: Personal Information */}
                    {currentStep === 2 && (
                      <div>
                        <h2 className="text-2xl font-bold mb-2">Personal Information</h2>
                        <p className="text-gray-600 mb-6">Please provide your personal details</p>
                        
                        {error && (
                          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start">
                            <AlertCircle className="w-5 h-5 text-red-500 mr-2 flex-shrink-0" />
                            <p className="text-sm text-red-700">{error}</p>
                          </div>
                        )}

                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium mb-1">Landlord ID *</label>
                            <input
                              type="text"
                              value={tenantData.landlordId}
                              onChange={(e) => setTenantData(prev => ({ ...prev, landlordId: e.target.value }))}
                              className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                              placeholder="Enter your landlord's ID"
                              required
                            />
                            <p className="text-xs text-gray-500 mt-1">This ID is provided by your landlord</p>
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium mb-1">Full Name *</label>
                              <input
                                type="text"
                                value={tenantData.name}
                                onChange={(e) => setTenantData(prev => ({ ...prev, name: e.target.value }))}
                                className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                placeholder="Enter your full name"
                                required
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium mb-1">Government ID *</label>
                              <input
                                type="text"
                                value={tenantData.governmentId}
                                onChange={(e) => setTenantData(prev => ({ ...prev, governmentId: e.target.value }))}
                                className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                placeholder="12345678 or AB1234567"
                                required
                              />
                            </div>
                          </div>

                          <div>
                            <label className="block text-sm font-medium mb-1">Email Address *</label>
                            <input
                              type="email"
                              value={tenantData.email}
                              onChange={(e) => setTenantData(prev => ({ ...prev, email: e.target.value }))}
                              className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                              placeholder="your.email@example.com"
                              required
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium mb-1">Phone Number *</label>
                              <input
                                type="tel"
                                value={tenantData.phone}
                                onChange={(e) => setTenantData(prev => ({ ...prev, phone: e.target.value }))}
                                className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                placeholder="+254712345678"
                                required
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium mb-1">Emergency Contact *</label>
                              <input
                                type="tel"
                                value={tenantData.emergencyContact}
                                onChange={(e) => setTenantData(prev => ({ ...prev, emergencyContact: e.target.value }))}
                                className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                placeholder="+254798765432"
                                required
                              />
                            </div>
                          </div>
                        </div>

                        <div className="flex gap-3 mt-6">
                          <button
                            onClick={() => setCurrentStep(1)}
                            className="flex-1 px-4 py-3 bg-gray-200 hover:bg-gray-300 rounded-lg font-medium"
                          >
                            Back
                          </button>
                          <button
                            onClick={handleTenantNext}
                            className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                          >
                            Continue to Property Selection
                          </button>
                        </div>
                      </div>
                    )}

                    {/* <CHANGE> Step 3: Property & Room Selection */}
                    {currentStep === 3 && (
                      <div>
                        <h2 className="text-2xl font-bold mb-2">Property & Room Selection</h2>
                        <p className="text-gray-600 mb-6">Select your property and room</p>
                        
                        {error && (
                          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start">
                            <AlertCircle className="w-5 h-5 text-red-500 mr-2 flex-shrink-0" />
                            <p className="text-sm text-red-700">{error}</p>
                          </div>
                        )}

                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium mb-2">Select Property *</label>
                            <select
                              value={tenantData.selectedProperty}
                              onChange={(e) => {
                                setTenantData(prev => ({ 
                                  ...prev, 
                                  selectedProperty: e.target.value,
                                  selectedRoom: '',
                                  monthlyRent: 0,
                                  depositAmount: 0
                                }));
                                fetchAvailableRooms(e.target.value);
                              }}
                              className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                              required
                            >
                              <option value="">Choose a property</option>
                              {availableProperties.map(property => (
                                <option key={property.id} value={property.id}>
                                  {property.name} - {property.address}
                                </option>
                              ))}
                            </select>
                          </div>

                          {tenantData.selectedProperty && (
                            <div>
                              <label className="block text-sm font-medium mb-2">Select Room *</label>
                              {availableRooms.length > 0 ? (
                                <div className="grid grid-cols-1 gap-3">
                                  {availableRooms.map(room => (
                                    <div
                                      key={room.id}
                                      onClick={() => handleRoomSelection(room.id)}
                                      className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                                        tenantData.selectedRoom === room.id
                                          ? 'border-blue-500 bg-blue-50'
                                          : 'border-gray-200 hover:border-blue-300'
                                      }`}
                                    >
                                      <div className="flex justify-between items-center">
                                        <div>
                                          <h4 className="font-semibold text-lg">Room {room.number}</h4>
                                          <p className="text-sm text-gray-600 capitalize">
                                            {room.type === '1br' ? '1 Bedroom' : 
                                             room.type === '2br' ? '2 Bedroom' : 
                                             room.type === '3br' ? '3 Bedroom' : 
                                             'Studio'}
                                          </p>
                                        </div>
                                        <div className="text-right">
                                          <p className="text-2xl font-bold text-blue-600">
                                            KSh {room.rent.toLocaleString()}
                                          </p>
                                          <p className="text-xs text-gray-500">per month</p>
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <div className="p-6 bg-gray-50 rounded-lg text-center">
                                  <p className="text-gray-600">No available rooms in this property</p>
                                </div>
                              )}
                            </div>
                          )}

                          {tenantData.selectedRoom && (
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                              <h4 className="font-semibold text-blue-900 mb-2">Payment Summary</h4>
                              <div className="space-y-1 text-sm">
                                <div className="flex justify-between">
                                  <span>Monthly Rent:</span>
                                  <span className="font-semibold">KSh {tenantData.monthlyRent.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span>Deposit (1 month):</span>
                                  <span className="font-semibold">KSh {tenantData.depositAmount.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between pt-2 border-t border-blue-200">
                                  <span className="font-bold">Total Due Now:</span>
                                  <span className="font-bold text-blue-600">
                                    KSh {tenantData.depositAmount.toLocaleString()}
                                  </span>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>

                        <div className="flex gap-3 mt-6">
                          <button
                            onClick={prevStep}
                            className="flex-1 px-4 py-3 bg-gray-200 hover:bg-gray-300 rounded-lg font-medium"
                          >
                            Back
                          </button>
                          <button
                            onClick={handleTenantNext}
                            className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                          >
                            Continue to Documents
                          </button>
                        </div>
                      </div>
                    )}

                    {/* <CHANGE> Step 4: Document Upload */}
                    {currentStep === 4 && (
                      <div>
                        <h2 className="text-2xl font-bold mb-2">Document Upload</h2>
                        <p className="text-gray-600 mb-6">Upload your identification and supporting documents</p>
                        
                        {error && (
                          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start">
                            <AlertCircle className="w-5 h-5 text-red-500 mr-2 flex-shrink-0" />
                            <p className="text-sm text-red-700">{error}</p>
                          </div>
                        )}

                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium mb-2">Government ID Document *</label>
                            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors">
                              <input
                                type="file"
                                id="idUpload"
                                accept=".pdf,.jpg,.jpeg,.png"
                                onChange={handleFileUpload}
                                className="hidden"
                              />
                              <label htmlFor="idUpload" className="cursor-pointer">
                                <Upload className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                                <p className="font-medium text-gray-700 mb-1">Upload Documents</p>
                                <p className="text-sm text-gray-500 mb-2">Click to select files or drag and drop</p>
                                <p className="text-xs text-gray-400">
                                  Supported formats: PDF, JPEG, JPG, PNG (Max 5MB each)
                                </p>
                              </label>
                            </div>

                            {tenantData.idDocument && (
                              <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center justify-between">
                                <div className="flex items-center">
                                  <FileText className="text-green-600 mr-2" size={20} />
                                  <div>
                                    <p className="text-sm font-medium text-green-900">{tenantData.idDocument.name}</p>
                                    <p className="text-xs text-green-700">
                                      {(tenantData.idDocument.size / 1024).toFixed(2)} KB
                                    </p>
                                  </div>
                                </div>
                                <button
                                  onClick={() => setTenantData(prev => ({ ...prev, idDocument: null }))}
                                  className="text-red-500 hover:text-red-700"
                                >
                                  <X size={20} />
                                </button>
                              </div>
                            )}
                          </div>

                          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                            <div className="flex items-start">
                              <Info className="text-yellow-600 mr-2 mt-0.5 flex-shrink-0" size={18} />
                              <div className="text-sm text-yellow-800">
                                <p className="font-medium mb-1">Required Documents:</p>
                                <ul className="text-xs space-y-1 ml-4 list-disc">
                                  <li>Copy of Government ID (National ID or Passport)</li>
                                  <li>Any additional documents requested by landlord</li>
                                </ul>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="flex gap-3 mt-6">
                          <button
                            onClick={prevStep}
                            className="flex-1 px-4 py-3 bg-gray-200 hover:bg-gray-300 rounded-lg font-medium"
                          >
                            Back
                          </button>
                          <button
                            onClick={handleTenantNext}
                            className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                          >
                            Continue to Payment
                          </button>
                        </div>
                      </div>
                    )}

                    {/* <CHANGE> Step 5: Deposit Payment */}
                    {currentStep === 5 && (
                      <div>
                        <h2 className="text-2xl font-bold mb-2 flex items-center">
                          <CreditCard className="mr-2 text-green-600" />
                          Deposit Payment
                        </h2>
                        <p className="text-gray-600 mb-6">Pay your security deposit to complete registration</p>

                        {paymentStatus && (
                          <div className={`mb-4 p-4 rounded-lg border flex items-start ${
                            paymentStatus.type === 'success' 
                              ? 'bg-green-50 border-green-200 text-green-800' 
                              : 'bg-red-50 border-red-200 text-red-800'
                          }`}>
                            {paymentStatus.type === 'success' ? (
                              <CheckCircle className="mr-2 mt-0.5 text-green-600" />
                            ) : (
                              <X className="mr-2 mt-0.5 text-red-600" />
                            )}
                            <div>
                              <p className="font-medium">{paymentStatus.message}</p>
                              {paymentStatus.transactionId && (
                                <p className="text-sm mt-1">Transaction ID: {paymentStatus.transactionId}</p>
                              )}
                            </div>
                          </div>
                        )}

                        {!paymentStatus && (
                          <div>
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
                              <h3 className="font-semibold text-blue-900 mb-4">Payment Details</h3>
                              <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                  <span>Room Number:</span>
                                  <span className="font-semibold">
                                    {availableRooms.find(r => r.id === tenantData.selectedRoom)?.number}
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span>Monthly Rent:</span>
                                  <span className="font-semibold">KSh {tenantData.monthlyRent.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between items-center pt-3 border-t border-blue-200">
                                  <span className="text-lg font-bold">Deposit Amount:</span>
                                  <span className="text-2xl font-bold text-blue-600">
                                    KSh {tenantData.depositAmount.toLocaleString()}
                                  </span>
                                </div>
                              </div>
                            </div>

                            <div>
                              <label className="block text-sm font-medium mb-2">M-Pesa Phone Number *</label>
                              <input
                                type="tel"
                                value={tenantData.mpesaPhone || tenantData.phone}
                                onChange={(e) => setTenantData(prev => ({ ...prev, mpesaPhone: e.target.value }))}
                                className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                                placeholder="+254712345678"
                                required
                              />
                              <p className="text-xs text-gray-500 mt-1">
                                Payment will be processed to this number
                              </p>
                            </div>

                            <div className="flex items-start mt-4 p-3 rounded-lg bg-blue-50 border border-blue-200 text-blue-700 text-sm">
                              <Info className="mr-2 mt-0.5 text-blue-600 flex-shrink-0" />
                              <div>
                                <p className="font-medium mb-1">Payment Process:</p>
                                <ul className="text-xs space-y-1">
                                  <li>• Click "Pay Deposit" to initiate M-Pesa payment</li>
                                  <li>• You'll receive an M-Pesa prompt on your phone</li>
                                  <li>• Enter your M-Pesa PIN to complete payment</li>
                                  <li>• After successful payment, continue to set up your account</li>
                                </ul>
                              </div>
                            </div>
                          </div>
                        )}

                        <div className="flex gap-3 mt-6">
                          {!paymentStatus && (
                            <>
                              <button
                                onClick={prevStep}
                                disabled={isLoading}
                                className="flex-1 px-4 py-3 bg-gray-200 hover:bg-gray-300 rounded-lg font-medium disabled:opacity-50"
                              >
                                Back
                              </button>
                              <button
                                onClick={handleTenantNext}
                                disabled={isLoading}
                                className="flex-1 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium disabled:opacity-50 flex items-center justify-center"
                              >
                                {isLoading ? (
                                  <>
                                    <Loader2 className="animate-spin mr-2" size={20} />
                                    Processing...
                                  </>
                                ) : (
                                  <>
                                    <CreditCard className="mr-2" size={20} />
                                    Pay Deposit
                                  </>
                                )}
                              </button>
                            </>
                          )}
                          
                          {paymentStatus?.type === 'success' && (
                            <button
                              onClick={handleTenantNext}
                              className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                            >
                              Continue to Account Security
                            </button>
                          )}
                        </div>
                      </div>
                    )}

                    {/* <CHANGE> Step 6: Account Security (Password Setup) */}
                    {currentStep === 6 && (
                      <div>
                        <h2 className="text-2xl font-bold mb-2">Account Security</h2>
                        <p className="text-gray-600 mb-6">Create a strong password for your account</p>
                        
                        {error && (
                          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start">
                            <AlertCircle className="w-5 h-5 text-red-500 mr-2 flex-shrink-0" />
                            <p className="text-sm text-red-700">{error}</p>
                          </div>
                        )}

                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium mb-2">Password *</label>
                            <div className="relative">
                              <input
                                type={showPassword ? "text" : "password"}
                                value={tenantData.password}
                                onChange={(e) => setTenantData(prev => ({ ...prev, password: e.target.value }))}
                                className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none pr-12"
                                placeholder="Create a strong password"
                                required
                              />
                              <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                              >
                                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                              </button>
                            </div>
                          </div>

                          <div>
                            <label className="block text-sm font-medium mb-2">Confirm Password *</label>
                            <div className="relative">
                              <input
                                type={showConfirmPassword ? "text" : "password"}
                                value={tenantData.confirmPassword}
                                onChange={(e) => setTenantData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                                className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none pr-12"
                                placeholder="Confirm your password"
                                required
                              />
                              <button
                                type="button"
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                              >
                                {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                              </button>
                            </div>
                          </div>

                          {/* <CHANGE> Enhanced password requirements display */}
                          {tenantData.password && (
                            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                              <p className="font-semibold text-gray-900 mb-3">Password Requirements:</p>
                              <div className="space-y-2">
                                {[
                                  { label: 'At least 8 characters', met: tenantData.password.length >= 8 },
                                  { label: 'Contains uppercase letter', met: /[A-Z]/.test(tenantData.password) },
                                  { label: 'Contains lowercase letter', met: /[a-z]/.test(tenantData.password) },
                                  { label: 'Contains number', met: /\d/.test(tenantData.password) }
                                ].map((req, index) => (
                                  <div 
                                    key={index} 
                                    className={`flex items-center text-sm ${req.met ? 'text-green-600' : 'text-gray-500'}`}
                                  >
                                    <div className={`w-5 h-5 rounded-full flex items-center justify-center mr-2 ${
                                      req.met ? 'bg-green-100' : 'bg-gray-100'
                                    }`}>
                                      {req.met ? (
                                        <CheckCircle size={16} className="text-green-600" />
                                      ) : (
                                        <div className="w-2 h-2 rounded-full bg-gray-400" />
                                      )}
                                    </div>
                                    {req.label}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {tenantData.password && tenantData.confirmPassword && (
                            <div className={`p-3 rounded-lg border flex items-center ${
                              tenantData.password === tenantData.confirmPassword
                                ? 'bg-green-50 border-green-200 text-green-700'
                                : 'bg-red-50 border-red-200 text-red-700'
                            }`}>
                              {tenantData.password === tenantData.confirmPassword ? (
                                <>
                                  <CheckCircle size={18} className="mr-2" />
                                  <span className="text-sm font-medium">Passwords match</span>
                                </>
                              ) : (
                                <>
                                  <X size={18} className="mr-2" />
                                  <span className="text-sm font-medium">Passwords do not match</span>
                                </>
                              )}
                            </div>
                          )}
                        </div>

                        <div className="flex gap-3 mt-6">
                          <button
                            onClick={prevStep}
                            disabled={isLoading}
                            className="flex-1 px-4 py-3 bg-gray-200 hover:bg-gray-300 rounded-lg font-medium disabled:opacity-50"
                          >
                            Back
                          </button>
                          <button
                            onClick={handleTenantNext}
                            disabled={isLoading}
                            className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50"
                          >
                            {isLoading ? 'Completing Registration...' : 'Complete Registration'}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* LANDLORD SIGNUP FLOW */}
                {userType === 'landlord' && currentStep > 1 && (
                  <div>
                    {/* <CHANGE> Added step indicator for landlord signup */}
                    <StepIndicator 
                      currentStep={currentStep - 1} 
                      totalSteps={3}
                      labels={['Personal Info', 'Properties', 'Payment']}
                    />

                    {/* Step 2: Personal Information */}
                    {currentStep === 2 && (
                      <div>
                        <h2 className="text-2xl font-bold mb-2">Landlord Information</h2>
                        <p className="text-gray-600 mb-6">Please provide your details</p>
                        
                        {error && (
                          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start">
                            <AlertCircle className="w-5 h-5 text-red-500 mr-2 flex-shrink-0" />
                            <p className="text-sm text-red-700">{error}</p>
                          </div>
                        )}
                        
                        <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium mb-1">Full Name *</label>
                              <input
                                type="text"
                                value={landlordData.fullName}
                                onChange={(e) => setLandlordData(prev => ({ ...prev, fullName: e.target.value }))}
                                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                required
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium mb-1">National ID *</label>
                              <input
                                type="text"
                                value={landlordData.nationalId}
                                onChange={(e) => setLandlordData(prev => ({ ...prev, nationalId: e.target.value }))}
                                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                placeholder="12345678"
                                required
                              />
                            </div>
                          </div>

                          <div>
                            <label className="block text-sm font-medium mb-1">M-Pesa Till Number *</label>
                            <input
                              type="text"
                              value={landlordData.tillNumber}
                              onChange={(e) => setLandlordData(prev => ({ ...prev, tillNumber: e.target.value }))}
                              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                              placeholder="123456"
                              required
                            />
                            <div className="flex items-start mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-800">
                              <AlertCircle className="mr-2 flex-shrink-0 mt-0.5" size={14} />
                              <p>Please ensure this is your correct M-Pesa Till Number for receiving tenant payments</p>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium mb-1">Email *</label>
                              <input
                                type="email"
                                value={landlordData.email}
                                onChange={(e) => setLandlordData(prev => ({ ...prev, email: e.target.value }))}
                                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                required
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium mb-1">Phone *</label>
                              <input
                                type="tel"
                                value={landlordData.phone}
                                onChange={(e) => setLandlordData(prev => ({ ...prev, phone: e.target.value }))}
                                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                placeholder="+254722345678"
                                required
                              />
                            </div>
                          </div>

                          <div>
                            <label className="block text-sm font-medium mb-1">Property Address *</label>
                            <input
                              type="text"
                              value={landlordData.address}
                              onChange={(e) => setLandlordData(prev => ({ ...prev, address: e.target.value }))}
                              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                              placeholder="Main property address"
                              required
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium mb-1">Website (Optional)</label>
                            <input
                              type="url"
                              value={landlordData.website}
                              onChange={(e) => setLandlordData(prev => ({ ...prev, website: e.target.value }))}
                              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                              placeholder="https://yourwebsite.com"
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium mb-1">Password *</label>
                              <div className="relative">
                                <input
                                  type={showPassword ? "text" : "password"}
                                  value={landlordData.password}
                                  onChange={(e) => setLandlordData(prev => ({ ...prev, password: e.target.value }))}
                                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none pr-10"
                                  required
                                />
                                <button
                                  type="button"
                                  onClick={() => setShowPassword(!showPassword)}
                                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                                >
                                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                              </div>
                            </div>
                            <div>
                              <label className="block text-sm font-medium mb-1">Confirm Password *</label>
                              <div className="relative">
                                <input
                                  type={showConfirmPassword ? "text" : "password"}
                                  value={landlordData.confirmPassword}
                                  onChange={(e) => setLandlordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none pr-10"
                                  required
                                />
                                <button
                                  type="button"
                                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                                >
                                  {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                              </div>
                            </div>
                          </div>

                          {/* <CHANGE> Enhanced password requirements display for landlord */}
                          {landlordData.password && (
                            <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                              <p className="font-semibold text-gray-900 mb-2 text-sm">Password Requirements:</p>
                              <div className="space-y-1">
                                {[
                                  { label: 'At least 8 characters', met: landlordData.password.length >= 8 },
                                  { label: 'Contains uppercase letter', met: /[A-Z]/.test(landlordData.password) },
                                  { label: 'Contains lowercase letter', met: /[a-z]/.test(landlordData.password) },
                                  { label: 'Contains number', met: /\d/.test(landlordData.password) }
                                ].map((req, index) => (
                                  <div 
                                    key={index} 
                                    className={`flex items-center text-xs ${req.met ? 'text-green-600' : 'text-gray-500'}`}
                                  >
                                    {req.met ? (
                                      <CheckCircle size={14} className="mr-1" />
                                    ) : (
                                      <div className="w-3 h-3 rounded-full border border-gray-300 mr-1" />
                                    )}
                                    {req.label}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>

                        <div className="flex gap-3 mt-6">
                          <button
                            onClick={() => setCurrentStep(1)}
                            className="flex-1 px-4 py-3 bg-gray-200 hover:bg-gray-300 rounded-lg font-medium"
                          >
                            Back
                          </button>
                          <button
                            onClick={handleLandlordNext}
                            className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                          >
                            Continue to Properties
                          </button>
                        </div>
                      </div>
                    )}

                    {/* <CHANGE> Step 3: Properties & Units with bulk addition */}
                    {currentStep === 3 && (
                      <div>
                        <h2 className="text-2xl font-bold mb-2">Properties & Units</h2>
                        <p className="text-sm text-gray-600 mb-6">Add your properties and their units</p>

                        {error && (
                          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start">
                            <AlertCircle className="w-5 h-5 text-red-500 mr-2 flex-shrink-0" />
                            <p className="text-sm text-red-700">{error}</p>
                          </div>
                        )}

                        <div className="max-h-96 overflow-y-auto pr-2 space-y-6">
                          {landlordData.properties.map((property, propIndex) => (
                            <div key={property.id} className="border-2 border-gray-200 rounded-lg p-4">
                              <div className="flex justify-between items-center mb-4">
                                <h3 className="font-semibold text-lg">Property {propIndex + 1}</h3>
                                {landlordData.properties.length > 1 && (
                                  <button
                                    onClick={() => removeProperty(property.id)}
                                    className="text-red-500 hover:text-red-700"
                                  >
                                    <X size={20} />
                                  </button>
                                )}
                              </div>

                              <div className="space-y-3">
                                <div>
                                  <label className="block text-sm font-medium mb-1">Property Name *</label>
                                  <input
                                    type="text"
                                    value={property.propertyName}
                                    onChange={(e) => updatePropertyField(property.id, 'propertyName', e.target.value)}
                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                    placeholder="e.g., Sunrise Apartments"
                                    required
                                  />
                                </div>

                                <div>
                                  <label className="block text-sm font-medium mb-1">Property Address *</label>
                                  <input
                                    type="text"
                                    value={property.propertyAddress}
                                    onChange={(e) => updatePropertyField(property.id, 'propertyAddress', e.target.value)}
                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                    placeholder="Street address"
                                    required
                                  />
                                </div>

                                {/* Units Section */}
                                <div>
                                  <div className="flex justify-between items-center mb-2">
                                    <label className="block text-sm font-medium">Units</label>
                                    <div className="flex gap-2">
                                      <button
                                        onClick={() => setBulkUnitMode(prev => ({ 
                                          ...prev, 
                                          [property.id]: prev[property.id] ? null : { count: '', roomType: 'studio', rentAmount: '', startNumber: '' }
                                        }))}
                                        className="text-xs px-3 py-1 bg-purple-100 text-purple-700 rounded hover:bg-purple-200"
                                      >
                                        {bulkUnitMode[property.id] ? 'Cancel Bulk' : 'Bulk Add'}
                                      </button>
                                      <button
                                        onClick={() => addUnit(property.id)}
                                        className="text-xs px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                                      >
                                        + Add Single
                                      </button>
                                    </div>
                                  </div>

                                  {/* <CHANGE> Bulk unit addition form */}
                                  {bulkUnitMode[property.id] && (
                                    <div className="mb-3 p-3 bg-purple-50 border border-purple-200 rounded-lg">
                                      <p className="text-xs font-medium text-purple-900 mb-2">Add Multiple Units</p>
                                      <div className="grid grid-cols-4 gap-2">
                                        <input
                                          type="number"
                                          placeholder="Count"
                                          value={bulkUnitMode[property.id].count}
                                          onChange={(e) => setBulkUnitMode(prev => ({
                                            ...prev,
                                            [property.id]: { ...prev[property.id], count: e.target.value }
                                          }))}
                                          className="px-2 py-1 border rounded text-sm"
                                          min="1"
                                        />
                                        <select
                                          value={bulkUnitMode[property.id].roomType}
                                          onChange={(e) => setBulkUnitMode(prev => ({
                                            ...prev,
                                            [property.id]: { ...prev[property.id], roomType: e.target.value }
                                          }))}
                                          className="px-2 py-1 border rounded text-sm"
                                        >
                                          <option value="studio">Studio</option>
                                          <option value="1br">1 Bedroom</option>
                                          <option value="2br">2 Bedroom</option>
                                          <option value="3br">3 Bedroom</option>
                                        </select>
                                        <input
                                          type="number"
                                          placeholder="Rent"
                                          value={bulkUnitMode[property.id].rentAmount}
                                          onChange={(e) => setBulkUnitMode(prev => ({
                                            ...prev,
                                            [property.id]: { ...prev[property.id], rentAmount: e.target.value }
                                          }))}
                                          className="px-2 py-1 border rounded text-sm"
                                        />
                                        <input
                                          type="text"
                                          placeholder="Prefix (A)"
                                          value={bulkUnitMode[property.id].startNumber}
                                          onChange={(e) => setBulkUnitMode(prev => ({
                                            ...prev,
                                            [property.id]: { ...prev[property.id], startNumber: e.target.value }
                                          }))}
                                          className="px-2 py-1 border rounded text-sm"
                                        />
                                      </div>
                                      <button
                                        onClick={() => addBulkUnits(property.id, bulkUnitMode[property.id])}
                                        disabled={!bulkUnitMode[property.id].count || !bulkUnitMode[property.id].rentAmount}
                                        className="mt-2 w-full py-1 bg-purple-600 text-white rounded text-xs hover:bg-purple-700 disabled:opacity-50"
                                      >
                                        Add {bulkUnitMode[property.id].count || 0} Units
                                      </button>
                                    </div>
                                  )}

                                  <div className="space-y-2">
                                    {property.units.map((unit, unitIndex) => (
                                      <div key={unit.id} className="flex gap-2 items-start bg-gray-50 p-3 rounded-lg">
                                        <div className="flex-1 grid grid-cols-3 gap-2">
                                          <input
                                            type="text"
                                            value={unit.unitNumber}
                                            onChange={(e) => updateUnitField(property.id, unit.id, 'unitNumber', e.target.value)}
                                            className="px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                            placeholder="Unit #"
                                            required
                                          />
                                          <select
                                            value={unit.roomType}
                                            onChange={(e) => updateUnitField(property.id, unit.id, 'roomType', e.target.value)}
                                            className="px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                          >
                                            <option value="studio">Studio</option>
                                            <option value="1br">1 Bedroom</option>
                                            <option value="2br">2 Bedroom</option>
                                            <option value="3br">3 Bedroom</option>
                                          </select>
                                          <input
                                            type="number"
                                            value={unit.monthlyRent}
                                            onChange={(e) => updateUnitField(property.id, unit.id, 'monthlyRent', e.target.value)}
                                            className="px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                            placeholder="Rent (KSh)"
                                            required
                                          />
                                        </div>
                                        <button
                                          onClick={() => removeUnit(property.id, unit.id)}
                                          className="text-red-500 hover:text-red-700 mt-2"
                                        >
                                          <X size={18} />
                                        </button>
                                      </div>
                                    ))}

                                    {property.units.length === 0 && (
                                      <p className="text-sm text-gray-500 text-center py-2">No units added yet</p>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}

                          <button
                            onClick={addProperty}
                            className="w-full py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-blue-500 hover:text-blue-600 font-medium transition-colors"
                          >
                            + Add Another Property
                          </button>

                          {/* Pricing Summary */}
                          <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
                            <h4 className="font-semibold text-blue-900 mb-2">Subscription Summary</h4>
                            <div className="space-y-1 text-sm">
                              <div className="flex justify-between">
                                <span>Total Units:</span>
                                <span className="font-semibold">{calculateTotalUnits()}</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Monthly Fee:</span>
                                <span className="font-semibold text-lg text-blue-600">
                                  {calculateMonthlyFee() > 0 ? `KSh ${calculateMonthlyFee().toLocaleString()}` : 'Contact Us'}
                                </span>
                              </div>
                            </div>

                            {calculateTotalUnits() > 100 && (
                              <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-800">
                                <Info className="inline mr-1" size={12} />
                                For 100+ units, please contact us for custom pricing
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex gap-3 mt-6">
                          <button
                            onClick={prevStep}
                            className="flex-1 px-4 py-3 bg-gray-200 hover:bg-gray-300 rounded-lg font-medium"
                          >
                            Back
                          </button>
                          <button
                            onClick={handleLandlordNext}
                            disabled={calculateTotalUnits() === 0}
                            className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50"
                          >
                            Continue to Payment
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Step 4: Payment */}
                    {currentStep === 4 && (
                      <div>
                        <h2 className="text-2xl font-bold mb-2 flex items-center">
                          <CreditCard className="mr-2 text-green-600" />
                          Complete Payment
                        </h2>
                        <p className="text-gray-600 mb-6">Pay your first month's subscription to activate your account</p>

                        {paymentStatus && (
                          <div className={`mb-4 p-4 rounded-lg border flex items-start ${
                            paymentStatus.type === 'success' 
                              ? 'bg-green-50 border-green-200 text-green-800' 
                              : 'bg-red-50 border-red-200 text-red-800'
                          }`}>
                            {paymentStatus.type === 'success' ? (
                              <CheckCircle className="mr-2 mt-0.5 text-green-600" />
                            ) : (
                              <X className="mr-2 mt-0.5 text-red-600" />
                            )}
                            <div>
                              <p className="font-medium">{paymentStatus.message}</p>
                              {paymentStatus.transactionId && (
                                <p className="text-sm mt-1">Transaction ID: {paymentStatus.transactionId}</p>
                              )}
                            </div>
                          </div>
                        )}

                        {!paymentStatus && (
                          <div>
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
                              <h3 className="font-semibold text-blue-900 mb-4">Payment Summary</h3>
                              <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                  <span>Total Units:</span>
                                  <span className="font-semibold">{calculateTotalUnits()} units</span>
                                </div>
                                <div className="flex justify-between">
                                  <span>Pricing Tier:</span>
                                  <span className="font-semibold">
                                    {pricingTiers.find(t => calculateTotalUnits() >= t.min && calculateTotalUnits() <= t.max)?.label}
                                  </span>
                                </div>
                                <div className="flex justify-between items-center pt-3 border-t border-blue-200">
                                  <span className="text-lg font-bold">First Month Payment:</span>
                                  <span className="text-2xl font-bold text-blue-600">
                                    KSh {calculateMonthlyFee().toLocaleString()}
                                  </span>
                                </div>
                              </div>
                            </div>

                            <div>
                              <label className="block text-sm font-medium mb-2">M-Pesa Phone Number *</label>
                              <input
                                type="tel"
                                value={landlordData.phone}
                                className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                                placeholder="+254722345678"
                                readOnly
                              />
                              <p className="text-xs text-gray-500 mt-1">
                                Payment will be processed to this number
                              </p>
                            </div>

                            <div className="flex items-start mt-4 p-3 rounded-lg bg-blue-50 border border-blue-200 text-blue-700 text-sm">
                              <Info className="mr-2 mt-0.5 text-blue-600 flex-shrink-0" />
                              <div>
                                <p className="font-medium mb-1">Payment Process:</p>
                                <ul className="text-xs space-y-1">
                                  <li>• Click "Pay Now" to initiate M-Pesa payment</li>
                                  <li>• You'll receive an M-Pesa prompt on your phone</li>
                                  <li>• Enter your M-Pesa PIN to complete payment</li>
                                  <li>• Your account will be activated immediately after payment</li>
                                </ul>
                              </div>
                            </div>
                          </div>
                        )}

                        <div className="flex gap-3 mt-6">
                          {!paymentStatus && (
                            <>
                              <button
                                onClick={prevStep}
                                disabled={isLoading}
                                className="flex-1 px-4 py-3 bg-gray-200 hover:bg-gray-300 rounded-lg font-medium disabled:opacity-50"
                              >
                                Back
                              </button>
                              <button
                                onClick={handleLandlordNext}
                                disabled={isLoading}
                                className="flex-1 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium disabled:opacity-50 flex items-center justify-center"
                              >
                                {isLoading ? (
                                  <>
                                    <Loader2 className="animate-spin mr-2" size={20} />
                                    Processing...
                                  </>
                                ) : (
                                  <>
                                    <CreditCard className="mr-2" size={20} />
                                    Pay Now
                                  </>
                                )}
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-6 text-sm text-gray-600">
          <p>© 2025 TenantHub. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
};

export default UnifiedAuthSystem;