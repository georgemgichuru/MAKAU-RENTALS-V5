// LoginForm.jsx
import { useState } from 'react';
import { Building, AlertCircle, Eye, EyeOff, CheckCircle, X, Info, CreditCard, Loader2, Home, Users, ArrowLeft, Upload, FileText, Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '/src/context/AuthContext';
import { authAPI, paymentsAPI } from '/src/services/api';

// Simple UUID generator
const generateUUID = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

const LoginForm = ({ onLogin }) => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [authMode, setAuthMode] = useState('login');
  const [userType, setUserType] = useState('tenant');
  const [currentStep, setCurrentStep] = useState(1);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [paymentStatus, setPaymentStatus] = useState(null);

  // Add this state
  const [sessionId, setSessionId] = useState(null);

  // Login Form Data
  const [loginData, setLoginData] = useState({
    email: '',
    password: ''
  });

  // Tenant Signup Data
  const [tenantData, setTenantData] = useState({
    landlordId: '',
    name: '',
    governmentId: '',
    email: '',
    phone: '',
    emergencyContact: '',
    selectedProperty: '',
    selectedRoom: null,
    monthlyRent: 0,
    depositAmount: 0,
    idDocument: null,
    mpesaPhone: '',
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
    const clean = phone.replace(/[\s\-]/g, '');
    return /^(\+254|254)?[17]\d{8}$/.test(clean);
  };

  const validateKenyanID = (id) => {
    const cleanId = id.replace(/[^a-zA-Z0-9]/g, '');
    return cleanId.length >= 7 && cleanId.length <= 10;
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

  // Handle Login
  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      console.log('Attempting login with:', { email: loginData.email, userType });

      const response = await authAPI.login({
        email: loginData.email,
        password: loginData.password,
        user_type: userType
      });
      
      const { access, refresh } = response.data;
      
      // Store tokens immediately
      localStorage.setItem('accessToken', access);
      localStorage.setItem('refreshToken', refresh);
      localStorage.setItem('userType', userType);

      // Get user data
      const userResponse = await authAPI.getCurrentUser();
      const userData = userResponse.data;

      console.log('User data received:', userData);

      // Use the auth context login
      login(userType, userData, { access, refresh });
      
      // Navigate based on user type
      if (userType === 'landlord') {
        navigate('/admin');
      } else {
        navigate('/tenant');
      }
    } catch (err) {
      console.error('Login error:', err);
      const errorMessage = err.response?.data?.detail || 
                          err.response?.data?.error || 
                          'Invalid email or password';
      setError(errorMessage);
      
      // Clear tokens on error
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('userType');
    } finally {
      setIsLoading(false);
    }
  };

  // REAL API: Fetch properties when landlord ID is entered
  const fetchLandlordProperties = async (landlordId) => {
    try {
      const response = await authAPI.validateLandlord(landlordId);
      const { properties, landlord_name, landlord_email } = response.data;
      
      setAvailableProperties(properties);
      return true;
    } catch (err) {
      const errorMessage = err.response?.data?.error || 'Landlord ID not found. Please check and try again.';
      setError(errorMessage);
      setAvailableProperties([]);
      return false;
    }
  };

  // Fetch available rooms when property is selected
  const fetchAvailableRooms = (propertyId) => {
    console.log('🔍 Fetching rooms for property:', propertyId);
    const property = availableProperties.find(p => p.id.toString() === propertyId.toString());

    if (property) {
      const availableUnits = property.units.filter(u => !u.occupied);
      console.log('📋 Available units:', availableUnits);
      setAvailableRooms(availableUnits);
      return availableUnits;
    }

    console.log('❌ Property not found:', propertyId);
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
        monthlyRent: parseFloat(room.rent) || 0,
        depositAmount: parseFloat(room.rent) || 0 // Deposit = 1 month rent
      }));

      // Clear any previous errors
      setError('');
    }
  };

  // Handle file upload for ID document
  const handleFileUpload = async (e) => {
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
      
      // Convert file to base64 for backend
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64File = event.target.result;
        setTenantData(prev => ({ 
          ...prev, 
          idDocument: {
            file: file,
            base64: base64File,
            name: file.name,
            type: file.type
          }
        }));
      };
      reader.readAsDataURL(file);
      setError('');
    }
  };

  // REAL API: Process tenant deposit payment
  const processTenantDepositPayment = async () => {
    setIsLoading(true);
    setPaymentStatus(null);

    try {
      if (!validateKenyanPhone(tenantData.mpesaPhone)) {
        throw new Error('Invalid M-Pesa phone number');
      }

      // Real payment processing for registration
      const paymentData = {
        unit_id: tenantData.selectedRoom,
        phone_number: tenantData.mpesaPhone,
        session_id: sessionId // Include session ID for linking later
      };

      const response = await paymentsAPI.initiateDeposit(paymentData);

      setPaymentStatus({
        type: 'success',
        message: 'Deposit payment initiated successfully! Check your phone for M-Pesa prompt.',
        transactionId: response.data.checkout_request_id,
        paymentId: response.data.payment_id
      });
      return true;
    } catch (err) {
      const errorMessage = err.response?.data?.error || 'Payment initiation failed. Please try again.';
      setPaymentStatus({
        type: 'error',
        message: errorMessage
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Tenant Signup Navigation
  const handleTenantNext = async () => {
    setError('');

    // Generate session_id if not exists (when starting registration)
    if (!sessionId) {
      setSessionId(generateUUID());
    }

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

      // Fetch landlord properties via API
      const found = await fetchLandlordProperties(tenantData.landlordId);
      if (!found) return;

      // Save step data to backend
      try {
        await authAPI.registerTenantStep(2, {
          session_id: sessionId,
          landlord_id: tenantData.landlordId,
          full_name: tenantData.name,
          government_id: tenantData.governmentId,
          email: tenantData.email,
          phone_number: tenantData.phone,
          emergency_contact: tenantData.emergencyContact
        });
      } catch (err) {
        console.error('Error saving step 2:', err);
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

      // Complete registration via API
      setIsLoading(true);
      try {
        const registrationData = {
          session_id: sessionId,
          full_name: tenantData.name,
          email: tenantData.email,
          password: tenantData.password,
          phone_number: tenantData.phone,
          government_id: tenantData.governmentId,
          emergency_contact: tenantData.emergencyContact,
          landlord_code: tenantData.landlordId,
          unit_code: tenantData.selectedRoom,
          id_document: tenantData.idDocument?.base64 // Send base64 encoded file
        };

        await authAPI.registerTenant(registrationData);

        alert('Tenant registration successful! Please login.');
        setAuthMode('login');
        resetTenantForm();
      } catch (err) {
        const errorMessage = err.response?.data?.message || err.response?.data?.error || 'Registration failed. Please try again.';
        setError(errorMessage);
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

  // Calculate total units for landlord
  const calculateTotalUnits = () => {
    return landlordData.properties.reduce((total, property) => {
      return total + property.units.length;
    }, 0);
  };

  // Calculate monthly fee for landlord
  const calculateMonthlyFee = () => {
    const totalUnits = calculateTotalUnits();
    const tier = pricingTiers.find(t => totalUnits >= t.min && totalUnits <= t.max);
    return tier ? tier.price : 0;
  };

  // Handle Landlord Signup Navigation
  const handleLandlordNext = async () => {
    setError('');

    // Generate session_id if not exists (when starting registration)
    if (!sessionId) {
      setSessionId(generateUUID());
    }

    // Step 2: Personal Information validation
    if (currentStep === 2) {
      if (!landlordData.fullName.trim()) {
        setError('Full name is required');
        return;
      }

      // Updated ID validation to accept 7-10 characters
      const idLength = landlordData.nationalId.replace(/[^a-zA-Z0-9]/g, '').length;
      if (idLength < 7 || idLength > 10) {
        setError('National ID must be between 7 and 10 characters');
        return;
      }

      // Make till number optional with validation message
      if (landlordData.tillNumber.trim() && !/^\d{5,8}$/.test(landlordData.tillNumber)) {
        setError('M-Pesa Till Number must be 5-8 digits');
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

      // Save step 2 data to backend to create session
      try {
        await authAPI.registerLandlordStep(2, {
          session_id: sessionId,
          full_name: landlordData.fullName,
          email: landlordData.email,
          password: landlordData.password,
          phone_number: landlordData.phone,
          government_id: landlordData.nationalId,
          mpesa_till_number: landlordData.tillNumber || '', // Send empty if not provided
          address: landlordData.address,
          website: landlordData.website || ''
        });
      } catch (err) {
        const errorMessage = err.response?.data?.message || err.response?.data?.error || 'Failed to save personal information';
        setError(errorMessage);
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

      // Save step 3 data to backend
      try {
        await authAPI.registerLandlordStep(3, {
          properties: landlordData.properties.map(property => ({
            name: property.propertyName,
            address: property.propertyAddress,
            units: property.units.map(unit => ({
              unit_number: unit.unitNumber,
              room_type: unit.roomType,
              monthly_rent: unit.monthlyRent
            }))
          }))
        });
      } catch (err) {
        const errorMessage = err.response?.data?.message || err.response?.data?.error || 'Failed to save property information';
        setError(errorMessage);
        return;
      }
    }

    // Step 4: Complete Registration
    if (currentStep === 4) {
      setIsLoading(true);
      try {
        // Complete the registration
        const response = await authAPI.registerLandlord({
          session_id: sessionId,
          full_name: landlordData.fullName,
          email: landlordData.email,
          password: landlordData.password,
          phone_number: landlordData.phone,
          national_id: landlordData.nationalId,
          mpesa_till_number: landlordData.tillNumber,
          address: landlordData.address,
          website: landlordData.website,
          properties: landlordData.properties
        });

        alert('Landlord registration successful! Please login.');
        setAuthMode('login');
        resetLandlordForm();
      } catch (err) {
        const errorMessage = err.response?.data?.message || err.response?.data?.error || 'Registration failed. Please try again.';
        setError(errorMessage);
      } finally {
        setIsLoading(false);
      }
      return;
    }

    setCurrentStep(prev => prev + 1);
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

  // Step Indicator Component
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

  // JSX for Tenant Signup Steps
  const renderTenantStep2 = () => (
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
              placeholder="+254712345678"
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
  );

  const renderTenantStep3 = () => (
    <div>
      <h2 className="text-2xl font-bold mb-2">Property & Room Selection</h2>
      <p className="text-gray-600 mb-6">Choose your preferred property and room</p>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start">
          <AlertCircle className="w-5 h-5 text-red-500 mr-2 flex-shrink-0" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      <div className="space-y-4">
        {availableProperties.length > 0 ? (
          <div>
            <label className="block text-sm font-medium mb-2">Select Property *</label>
            <select
              value={tenantData.selectedProperty}
              onChange={(e) => {
                const propertyId = e.target.value;
                setTenantData(prev => ({
                  ...prev,
                  selectedProperty: propertyId,
                  selectedRoom: null,
                  monthlyRent: 0,
                  depositAmount: 0
                }));
                if (propertyId) {
                  fetchAvailableRooms(propertyId);
                } else {
                  setAvailableRooms([]);
                }
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
        ) : (
          <div className="text-center py-8 text-gray-500">
            <Building className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>No properties found for this landlord ID</p>
          </div>
        )}

        {tenantData.selectedProperty && availableRooms.length > 0 && (
          <div>
            <label className="block text-sm font-medium mb-2">Available Rooms *</label>
            <div className="grid gap-3">
              {availableRooms.map(room => (
                <div
                  key={room.id}
                  onClick={() => handleRoomSelection(room.id)}
                  className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                    tenantData.selectedRoom?.toString() === room.id.toString()
                      ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
                      : 'border-gray-200 hover:border-blue-300'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="font-medium">Unit {room.unit_number}</h3>
                      <p className="text-sm text-gray-600">Type: {room.room_type}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">KES {room.rent}/month</p>
                      <p className="text-sm text-gray-600">Deposit: KES {room.rent}</p>
                    </div>
                  </div>
                  {tenantData.selectedRoom?.toString() === room.id.toString() && (
                    <div className="flex items-center mt-2 text-green-600 text-sm">
                      <CheckCircle className="w-4 h-4 mr-1" />
                      Selected
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {tenantData.selectedRoom && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center">
              <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
              <p className="text-green-700">
                Selected: Unit {availableRooms.find(r => r.id.toString() === tenantData.selectedRoom.toString())?.unit_number}
                - KES {tenantData.monthlyRent}/month
              </p>
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
          disabled={!tenantData.selectedRoom}
          className={`flex-1 px-4 py-3 rounded-lg font-medium ${
            tenantData.selectedRoom
              ? 'bg-blue-600 text-white hover:bg-blue-700'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
        >
          Continue to Document Upload
        </button>
      </div>
    </div>
  );

  const renderTenantStep4 = () => (
    <div>
      <h2 className="text-2xl font-bold mb-2">Document Upload</h2>
      <p className="text-gray-600 mb-6">Upload your government ID for verification</p>
      
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start">
          <AlertCircle className="w-5 h-5 text-red-500 mr-2 flex-shrink-0" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      <div className="space-y-4">
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
          {tenantData.idDocument ? (
            <div className="space-y-3">
              <FileText className="w-12 h-12 text-green-500 mx-auto" />
              <p className="font-medium text-green-700">Document Uploaded Successfully</p>
              <p className="text-sm text-gray-600">{tenantData.idDocument.name}</p>
              <button
                onClick={() => setTenantData(prev => ({ ...prev, idDocument: null }))}
                className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 text-sm"
              >
                Remove File
              </button>
            </div>
          ) : (
            <div>
              <Upload className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="font-medium mb-2">Upload Government ID</p>
              <p className="text-sm text-gray-600 mb-4">
                Supported formats: PDF, JPEG, JPG, PNG (Max 5MB)
              </p>
              <input
                type="file"
                onChange={handleFileUpload}
                accept=".pdf,.jpg,.jpeg,.png"
                className="hidden"
                id="idDocument"
              />
              <label
                htmlFor="idDocument"
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer"
              >
                Choose File
              </label>
            </div>
          )}
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start">
            <Info className="w-5 h-5 text-blue-500 mr-2 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-blue-700 text-sm">
                Your document will be securely stored and used for verification purposes only.
              </p>
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
          disabled={!tenantData.idDocument}
          className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium"
        >
          Continue to Deposit Payment
        </button>
      </div>
    </div>
  );

  const renderTenantStep5 = () => (
    <div>
      <h2 className="text-2xl font-bold mb-2">Deposit Payment</h2>
      <p className="text-gray-600 mb-6">Pay your security deposit via M-Pesa</p>
      
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start">
          <AlertCircle className="w-5 h-5 text-red-500 mr-2 flex-shrink-0" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {paymentStatus && (
        <div className={`mb-4 p-3 rounded-lg flex items-start ${
          paymentStatus.type === 'success' 
            ? 'bg-green-50 border border-green-200' 
            : 'bg-red-50 border border-red-200'
        }`}>
          {paymentStatus.type === 'success' ? (
            <CheckCircle className="w-5 h-5 text-green-500 mr-2 flex-shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-red-500 mr-2 flex-shrink-0" />
          )}
          <p className={`text-sm ${
            paymentStatus.type === 'success' ? 'text-green-700' : 'text-red-700'
          }`}>
            {paymentStatus.message}
          </p>
        </div>
      )}

      <div className="space-y-4">
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-gray-600">Monthly Rent:</span>
            <span className="font-bold">KES {tenantData.monthlyRent}</span>
          </div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-gray-600">Security Deposit:</span>
            <span className="font-bold">KES {tenantData.depositAmount}</span>
          </div>
          <div className="flex justify-between items-center border-t pt-2">
            <span className="font-medium">Total to Pay:</span>
            <span className="font-bold text-lg">KES {tenantData.depositAmount}</span>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">M-Pesa Phone Number *</label>
          <input
            type="tel"
            value={tenantData.mpesaPhone}
            onChange={(e) => setTenantData(prev => ({ ...prev, mpesaPhone: e.target.value }))}
            className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            placeholder="+254712345678"
            required
          />
          <p className="text-xs text-gray-500 mt-1">
            You will receive an M-Pesa prompt on this number
          </p>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start">
            <CreditCard className="w-5 h-5 text-blue-500 mr-2 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-blue-700 text-sm">
                Click "Pay Now" to initiate the M-Pesa payment. You will receive a prompt on your phone to complete the payment.
              </p>
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
          disabled={isLoading || !tenantData.mpesaPhone}
          className="flex-1 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 font-medium flex items-center justify-center"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
              Processing...
            </>
          ) : (
            <>
              <CreditCard className="w-4 h-4 mr-2" />
              Pay Now
            </>
          )}
        </button>
      </div>
    </div>
  );

  const renderTenantStep6 = () => (
    <div>
      <h2 className="text-2xl font-bold mb-2">Account Security</h2>
      <p className="text-gray-600 mb-6">Create your account password</p>
      
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start">
          <AlertCircle className="w-5 h-5 text-red-500 mr-2 flex-shrink-0" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Password *</label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              value={tenantData.password}
              onChange={(e) => setTenantData(prev => ({ ...prev, password: e.target.value }))}
              className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none pr-10"
              placeholder="Create a strong password"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Confirm Password *</label>
          <div className="relative">
            <input
              type={showConfirmPassword ? "text" : "password"}
              value={tenantData.confirmPassword}
              onChange={(e) => setTenantData(prev => ({ ...prev, confirmPassword: e.target.value }))}
              className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none pr-10"
              placeholder="Confirm your password"
              required
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
            >
              {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
        </div>

        <div className="bg-gray-50 rounded-lg p-4">
          <p className="text-sm font-medium mb-2">Password Requirements:</p>
          <ul className="text-sm space-y-1">
            <li className={`flex items-center ${validatePassword(tenantData.password).minLength ? 'text-green-600' : 'text-gray-500'}`}>
              <CheckCircle className="w-4 h-4 mr-2" />
              At least 8 characters
            </li>
            <li className={`flex items-center ${validatePassword(tenantData.password).hasUppercase ? 'text-green-600' : 'text-gray-500'}`}>
              <CheckCircle className="w-4 h-4 mr-2" />
              One uppercase letter
            </li>
            <li className={`flex items-center ${validatePassword(tenantData.password).hasLowercase ? 'text-green-600' : 'text-gray-500'}`}>
              <CheckCircle className="w-4 h-4 mr-2" />
              One lowercase letter
            </li>
            <li className={`flex items-center ${validatePassword(tenantData.password).hasNumber ? 'text-green-600' : 'text-gray-500'}`}>
              <CheckCircle className="w-4 h-4 mr-2" />
              One number
            </li>
          </ul>
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
          disabled={isLoading}
          className="flex-1 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 font-medium flex items-center justify-center"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
              Creating Account...
            </>
          ) : (
            'Complete Registration'
          )}
        </button>
      </div>
    </div>
  );

  const renderLandlordStep2 = () => (
    <div>
      <h2 className="text-2xl font-bold mb-2">Personal Information</h2>
      <p className="text-gray-600 mb-6">Please provide your personal and business details</p>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start">
          <AlertCircle className="w-5 h-5 text-red-500 mr-2 flex-shrink-0" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Full Name *</label>
          <input
            type="text"
            value={landlordData.fullName}
            onChange={(e) => setLandlordData(prev => ({ ...prev, fullName: e.target.value }))}
            className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            placeholder="Enter your full name"
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">National ID *</label>
            <input
              type="text"
              value={landlordData.nationalId}
              onChange={(e) => setLandlordData(prev => ({ ...prev, nationalId: e.target.value }))}
              className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="7-10 characters"
              required
            />
            <p className="text-xs text-gray-500 mt-1">Must be 7-10 characters</p>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">M-Pesa Till Number (Optional)</label>
            <input
              type="text"
              value={landlordData.tillNumber}
              onChange={(e) => setLandlordData(prev => ({ ...prev, tillNumber: e.target.value }))}
              className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="123456 (5-8 digits)"
            />
            {landlordData.tillNumber ? (
              <p className="text-xs text-green-600 mt-1">This till will be used by tenants to make payments</p>
            ) : (
              <p className="text-xs text-amber-600 mt-1">You will receive payments via M-Pesa - not recommended if you make more than 500,000 in rent</p>
            )}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Email Address *</label>
          <input
            type="email"
            value={landlordData.email}
            onChange={(e) => setLandlordData(prev => ({ ...prev, email: e.target.value }))}
            className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            placeholder="your.email@example.com"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Phone Number *</label>
          <input
            type="tel"
            value={landlordData.phone}
            onChange={(e) => setLandlordData(prev => ({ ...prev, phone: e.target.value }))}
            className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            placeholder="+254712345678"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Property Address *</label>
          <input
            type="text"
            value={landlordData.address}
            onChange={(e) => setLandlordData(prev => ({ ...prev, address: e.target.value }))}
            className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            placeholder="Enter your main property address"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Website (Optional)</label>
          <input
            type="url"
            value={landlordData.website}
            onChange={(e) => setLandlordData(prev => ({ ...prev, website: e.target.value }))}
            className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            placeholder="https://yourwebsite.com"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Password *</label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              value={landlordData.password}
              onChange={(e) => setLandlordData(prev => ({ ...prev, password: e.target.value }))}
              className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none pr-10"
              placeholder="Create a strong password"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
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
              className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none pr-10"
              placeholder="Confirm your password"
              required
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
            >
              {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
        </div>

        <div className="bg-gray-50 rounded-lg p-4">
          <p className="text-sm font-medium mb-2">Password Requirements:</p>
          <ul className="text-sm space-y-1">
            <li className={`flex items-center ${validatePassword(landlordData.password).minLength ? 'text-green-600' : 'text-gray-500'}`}>
              <CheckCircle className="w-4 h-4 mr-2" />
              At least 8 characters
            </li>
            <li className={`flex items-center ${validatePassword(landlordData.password).hasUppercase ? 'text-green-600' : 'text-gray-500'}`}>
              <CheckCircle className="w-4 h-4 mr-2" />
              One uppercase letter
            </li>
            <li className={`flex items-center ${validatePassword(landlordData.password).hasLowercase ? 'text-green-600' : 'text-gray-500'}`}>
              <CheckCircle className="w-4 h-4 mr-2" />
              One lowercase letter
            </li>
            <li className={`flex items-center ${validatePassword(landlordData.password).hasNumber ? 'text-green-600' : 'text-gray-500'}`}>
              <CheckCircle className="w-4 h-4 mr-2" />
              One number
            </li>
          </ul>
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
          onClick={handleLandlordNext}
          className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
        >
          Continue to Properties
        </button>
      </div>
    </div>
  );

  const renderLandlordStep3 = () => (
    <div>
      <h2 className="text-2xl font-bold mb-2">Property Management</h2>
      <p className="text-gray-600 mb-6">Add your properties and units</p>
      
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start">
          <AlertCircle className="w-5 h-5 text-red-500 mr-2 flex-shrink-0" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      <div className="space-y-6">
        {landlordData.properties.map((property, propertyIndex) => (
          <div key={property.id} className="border rounded-lg p-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold">Property {propertyIndex + 1}</h3>
              {landlordData.properties.length > 1 && (
                <button
                  onClick={() => removeProperty(property.id)}
                  className="text-red-500 hover:text-red-700"
                >
                  <X size={20} />
                </button>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium mb-1">Property Name *</label>
                <input
                  type="text"
                  value={property.propertyName}
                  onChange={(e) => updatePropertyField(property.id, 'propertyName', e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="e.g., Greenview Apartments"
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
                  placeholder="e.g., 123 Main Street, Nairobi"
                  required
                />
              </div>
            </div>

            <div className="mb-4">
              <div className="flex justify-between items-center mb-2">
                <h4 className="font-medium">Units ({property.units.length})</h4>
                <div className="flex gap-2">
                  <button
                    onClick={() => setBulkUnitMode(prev => ({ ...prev, [property.id]: {} }))}
                    className="px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded text-sm"
                  >
                    Bulk Add
                  </button>
                  <button
                    onClick={() => addUnit(property.id)}
                    className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
                  >
                    Add Unit
                  </button>
                </div>
              </div>

              {bulkUnitMode[property.id] && (
                <div className="bg-gray-50 p-4 rounded-lg mb-4">
                  <h5 className="font-medium mb-2">Bulk Add Units</h5>
                  <div className="grid grid-cols-2 gap-4 mb-3">
                    <div>
                      <label className="block text-xs font-medium mb-1">Number of Units</label>
                      <input
                        type="number"
                        min="1"
                        max="100"
                        className="w-full px-3 py-2 border rounded text-sm"
                        placeholder="e.g., 10"
                        onChange={(e) => setBulkUnitMode(prev => ({
                          ...prev,
                          [property.id]: { ...prev[property.id], count: e.target.value }
                        }))}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium mb-1">Room Type</label>
                      <select
                        className="w-full px-3 py-2 border rounded text-sm"
                        onChange={(e) => setBulkUnitMode(prev => ({
                          ...prev,
                          [property.id]: { ...prev[property.id], roomType: e.target.value }
                        }))}
                      >
                        <option value="studio">Studio</option>
                        <option value="1-bedroom">1 Bedroom</option>
                        <option value="2-bedroom">2 Bedroom</option>
                        <option value="3-bedroom">3 Bedroom</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium mb-1">Monthly Rent (KES)</label>
                      <input
                        type="number"
                        min="0"
                        className="w-full px-3 py-2 border rounded text-sm"
                        placeholder="e.g., 15000"
                        onChange={(e) => setBulkUnitMode(prev => ({
                          ...prev,
                          [property.id]: { ...prev[property.id], rentAmount: e.target.value }
                        }))}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium mb-1">Start Number (Optional)</label>
                      <input
                        type="text"
                        className="w-full px-3 py-2 border rounded text-sm"
                        placeholder="e.g., A"
                        onChange={(e) => setBulkUnitMode(prev => ({
                          ...prev,
                          [property.id]: { ...prev[property.id], startNumber: e.target.value }
                        }))}
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => addBulkUnits(property.id, bulkUnitMode[property.id])}
                      className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 text-sm"
                    >
                      Add Units
                    </button>
                    <button
                      onClick={() => setBulkUnitMode(prev => ({ ...prev, [property.id]: null }))}
                      className="px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded text-sm"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {property.units.length > 0 ? (
                <div className="space-y-2">
                  {property.units.map((unit) => (
                    <div key={unit.id} className="flex items-center gap-2 p-2 border rounded">
                      <input
                        type="text"
                        value={unit.unitNumber}
                        onChange={(e) => updateUnitField(property.id, unit.id, 'unitNumber', e.target.value)}
                        className="flex-1 px-3 py-1 border rounded text-sm"
                        placeholder="Unit number"
                        required
                      />
                      <select
                        value={unit.roomType}
                        onChange={(e) => updateUnitField(property.id, unit.id, 'roomType', e.target.value)}
                        className="px-3 py-1 border rounded text-sm"
                      >
                        <option value="studio">Studio</option>
                        <option value="1-bedroom">1 Bedroom</option>
                        <option value="2-bedroom">2 Bedroom</option>
                        <option value="3-bedroom">3 Bedroom</option>
                      </select>
                      <input
                        type="number"
                        value={unit.monthlyRent}
                        onChange={(e) => updateUnitField(property.id, unit.id, 'monthlyRent', e.target.value)}
                        className="w-24 px-3 py-1 border rounded text-sm"
                        placeholder="Rent"
                        min="0"
                        required
                      />
                      <button
                        onClick={() => removeUnit(property.id, unit.id)}
                        className="text-red-500 hover:text-red-700 p-1"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-sm">No units added yet</p>
              )}
            </div>
          </div>
        ))}

        <button
          onClick={addProperty}
          className="w-full py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-gray-400 hover:text-gray-700"
        >
          + Add Another Property
        </button>
      </div>

      <div className="mt-6">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
          <div className="flex items-start">
            <Info className="w-5 h-5 text-blue-500 mr-2 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-blue-700 text-sm">
                Total Units: <strong>{calculateTotalUnits()}</strong> | 
                Monthly Subscription: <strong>KES {calculateMonthlyFee()}</strong>
              </p>
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={prevStep}
            className="flex-1 px-4 py-3 bg-gray-200 hover:bg-gray-300 rounded-lg font-medium"
          >
            Back
          </button>
          <button
            onClick={handleLandlordNext}
            className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
          >
            Continue to Subscription
          </button>
        </div>
      </div>
    </div>
  );

  const renderLandlordStep4 = () => (
    <div>
      <h2 className="text-2xl font-bold mb-2">Subscription Plan</h2>
      <p className="text-gray-600 mb-6">Choose your subscription plan based on your units</p>
      
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start">
          <AlertCircle className="w-5 h-5 text-red-500 mr-2 flex-shrink-0" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      <div className="space-y-4">
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-gray-600">Total Units:</span>
            <span className="font-bold">{calculateTotalUnits()}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Monthly Subscription:</span>
            <span className="font-bold text-lg">KES {calculateMonthlyFee()}</span>
          </div>
        </div>

        <div className="space-y-3">
          {pricingTiers.map((tier, index) => (
            <div
              key={index}
              className={`p-4 border rounded-lg ${
                calculateTotalUnits() >= tier.min && calculateTotalUnits() <= tier.max
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200'
              }`}
            >
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="font-medium">{tier.label}</h3>
                  {tier.max === Infinity && (
                    <p className="text-sm text-gray-600">Custom pricing</p>
                  )}
                </div>
                <div className="text-right">
                  {tier.price > 0 ? (
                    <p className="font-bold">KES {tier.price}/month</p>
                  ) : (
                    <p className="font-bold">Contact Us</p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start">
            <Info className="w-5 h-5 text-blue-500 mr-2 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-blue-700 text-sm">
                Your subscription will be automatically billed monthly. You can upgrade or downgrade your plan at any time.
              </p>
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
          onClick={handleLandlordNext}
          disabled={isLoading || calculateMonthlyFee() === 0}
          className="flex-1 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 font-medium flex items-center justify-center"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
              Creating Account...
            </>
          ) : (
            'Complete Registration'
          )}
        </button>
      </div>
    </div>
  );

  // Main render function
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
      <div className="max-w-md mx-auto">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-6 text-white text-center">
            <div className="flex items-center justify-center mb-2">
              <Building className="w-8 h-8 mr-2" />
              <h1 className="text-2xl font-bold">RentFlow</h1>
            </div>
            <p className="opacity-90">Streamlined Rental Management</p>
          </div>

          {/* Auth Tabs */}
          <div className="p-6">
            <div className="flex bg-gray-100 rounded-lg p-1 mb-6">
              <button
                onClick={() => setAuthMode('login')}
                className={`flex-1 py-2 rounded-md font-medium transition-colors ${
                  authMode === 'login'
                    ? 'bg-white shadow-sm text-blue-600'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                Login
              </button>
              <button
                onClick={() => setAuthMode('signup')}
                className={`flex-1 py-2 rounded-md font-medium transition-colors ${
                  authMode === 'signup'
                    ? 'bg-white shadow-sm text-blue-600'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                Sign Up
              </button>
            </div>

            {/* User Type Selection */}
            <div className="flex bg-gray-100 rounded-lg p-1 mb-6">
              <button
                onClick={() => setUserType('tenant')}
                className={`flex-1 py-2 rounded-md font-medium transition-colors flex items-center justify-center ${
                  userType === 'tenant'
                    ? 'bg-white shadow-sm text-blue-600'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                <Users className="w-4 h-4 mr-2" />
                Tenant
              </button>
              <button
                onClick={() => setUserType('landlord')}
                className={`flex-1 py-2 rounded-md font-medium transition-colors flex items-center justify-center ${
                  userType === 'landlord'
                    ? 'bg-white shadow-sm text-blue-600'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                <Home className="w-4 h-4 mr-2" />
                Landlord
              </button>
            </div>

            {/* Login Form */}
            {authMode === 'login' && (
              <form onSubmit={handleLogin}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Email Address</label>
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
                    <label className="block text-sm font-medium mb-1">Password</label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        value={loginData.password}
                        onChange={(e) => setLoginData(prev => ({ ...prev, password: e.target.value }))}
                        className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none pr-10"
                        placeholder="Enter your password"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                      >
                        {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                      </button>
                    </div>
                  </div>
                </div>

                {error && (
                  <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start">
                    <AlertCircle className="w-5 h-5 text-red-500 mr-2 flex-shrink-0" />
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full mt-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium flex items-center justify-center"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      Signing In...
                    </>
                  ) : (
                    `Sign In as ${userType === 'tenant' ? 'Tenant' : 'Landlord'}`
                  )}
                </button>
              </form>
            )}

            {/* Signup Flow */}
            {authMode === 'signup' && (
              <div>
                {/* Step 1: Welcome */}
                {currentStep === 1 && (
                  <div className="text-center">
                    <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      {userType === 'tenant' ? (
                        <Users className="w-8 h-8 text-blue-600" />
                      ) : (
                        <Home className="w-8 h-8 text-blue-600" />
                      )}
                    </div>
                    <h2 className="text-2xl font-bold mb-2">
                      {userType === 'tenant' ? 'Tenant Registration' : 'Landlord Registration'}
                    </h2>
                    <p className="text-gray-600 mb-6">
                      {userType === 'tenant' 
                        ? 'Find your perfect rental home with ease'
                        : 'Manage your properties efficiently with our platform'
                      }
                    </p>
                    
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                      <div className="flex items-start">
                        <Info className="w-5 h-5 text-blue-500 mr-2 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-blue-700 text-sm">
                            {userType === 'tenant'
                              ? 'You will need your Landlord ID to proceed with registration.'
                              : 'You will need your M-Pesa Till Number and property details.'
                            }
                          </p>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => setCurrentStep(2)}
                      className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                    >
                      Get Started
                    </button>
                  </div>
                )}

                {/* Tenant Signup Steps */}
                {userType === 'tenant' && currentStep > 1 && (
                  <>
                    <StepIndicator
                      currentStep={currentStep}
                      totalSteps={6}
                      labels={['Welcome', 'Personal Info', 'Property Selection', 'Document Upload', 'Deposit Payment', 'Account Security']}
                    />
                    
                    {currentStep === 2 && renderTenantStep2()}
                    {currentStep === 3 && renderTenantStep3()}
                    {currentStep === 4 && renderTenantStep4()}
                    {currentStep === 5 && renderTenantStep5()}
                    {currentStep === 6 && renderTenantStep6()}
                  </>
                )}

                {/* Landlord Signup Steps */}
                {userType === 'landlord' && currentStep > 1 && (
                  <>
                    <StepIndicator
                      currentStep={currentStep}
                      totalSteps={4}
                      labels={['Welcome', 'Personal Info', 'Property Setup', 'Subscription']}
                    />
                    
                    {currentStep === 2 && renderLandlordStep2()}
                    {currentStep === 3 && renderLandlordStep3()}
                    {currentStep === 4 && renderLandlordStep4()}
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginForm;