import { useState } from 'react';
import { Building, AlertCircle, Eye, EyeOff, CheckCircle, X, Info, CreditCard, Loader2, Home, Users, ArrowLeft, Upload, FileText, Check } from 'lucide-react';

const UnifiedAuthSystem = () => {
  const [authMode, setAuthMode] = useState('login');
  const [userType, setUserType] = useState('tenant');
  const [currentStep, setCurrentStep] = useState(1);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [paymentStatus, setPaymentStatus] = useState(null);
  const [registrationSession, setRegistrationSession] = useState(`temp_${Date.now()}`);
  
  // Login Form Data
  const [loginData, setLoginData] = useState({
    email: '',
    password: '',
    user_type: 'tenant'
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
    selectedRoom: '',
    monthlyRent: 0,
    depositAmount: 0,
    idDocument: null,
    mpesaPhone: '',
    password: '',
    confirmPassword: ''
  });

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
    properties: [{
      id: Date.now(),
      propertyName: '',
      propertyAddress: '',
      units: []
    }]
  });

  const pricingTiers = [
    { min: 1, max: 10, price: 2000, label: '1-10 units' },
    { min: 11, max: 20, price: 2500, label: '11-20 units' },
    { min: 21, max: 50, price: 4500, label: '21-50 units' },
    { min: 51, max: 100, price: 7500, label: '51-100 units' },
    { min: 101, max: Infinity, price: 0, label: '100+ units (Contact us)' }
  ];

  // Validation functions
  const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const validateKenyanPhone = (phone) => /^(\+254|254)?[17]\d{8}$/.test(phone.replace(/[\s\-]/g, ''));
  const validateKenyanID = (id) => /^\d{8}$/.test(id) || /^[A-Z]{2}\d{7}$/i.test(id);
  const validatePassword = (password) => ({
    isValid: password.length >= 8 && /[A-Z]/.test(password) && /[a-z]/.test(password) && /\d/.test(password),
    minLength: password.length >= 8,
    hasUppercase: /[A-Z]/.test(password),
    hasLowercase: /[a-z]/.test(password),
    hasNumber: /\d/.test(password)
  });

  const calculateTotalUnits = () => {
    return landlordData.properties.reduce((total, property) => {
      return total + property.units.length;
    }, 0);
  };

  const calculateMonthlyFee = () => {
    const totalUnits = calculateTotalUnits();
    const tier = pricingTiers.find(t => totalUnits >= t.min && totalUnits <= t.max);
    return tier ? tier.price : 0;
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await fetch('http://localhost:8000/api/accounts/token/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginData)
      });

      if (!response.ok) throw new Error('Login failed');

      const data = await response.json();
      localStorage.setItem('accessToken', data.access);
      localStorage.setItem('refreshToken', data.refresh);
      localStorage.setItem('userType', loginData.user_type);

      alert('Login successful!');
      window.location.href = loginData.user_type === 'landlord' ? '/landlord-dashboard' : '/tenant-dashboard';
    } catch (err) {
      setError('Invalid email or password');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchLandlordProperties = async (landlordCode) => {
    try {
      setIsLoading(true);
      const response = await fetch('http://localhost:8000/api/accounts/validate-landlord/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ landlord_code: landlordCode })
      });

      if (!response.ok) throw new Error('Landlord not found');

      const data = await response.json();
      setAvailableProperties(data.properties || []);
      setTenantData(prev => ({ ...prev, landlordDbId: data.landlord_id }));
      return true;
    } catch (err) {
      setError('Invalid landlord ID');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const handleTenantNext = async () => {
    setError('');

    if (currentStep === 2) {
      if (!tenantData.landlordId.trim()) return setError('Landlord ID is required');
      if (!tenantData.name.trim()) return setError('Full name is required');
      if (!validateKenyanID(tenantData.governmentId)) return setError('Invalid Government ID');
      if (!validateEmail(tenantData.email)) return setError('Invalid email');
      if (!validateKenyanPhone(tenantData.phone)) return setError('Invalid phone number');
      if (!validateKenyanPhone(tenantData.emergencyContact)) return setError('Invalid emergency contact');

      const found = await fetchLandlordProperties(tenantData.landlordId);
      if (!found) return;
    }

    if (currentStep === 3) {
      if (!tenantData.selectedProperty) return setError('Please select a property');
      if (!tenantData.selectedRoom) return setError('Please select a room');
    }

    if (currentStep === 4) {
      if (!tenantData.idDocument) return setError('Please upload your ID document');
    }

    if (currentStep === 5) {
      if (!validateKenyanPhone(tenantData.mpesaPhone)) return setError('Invalid M-Pesa phone number');
      // Simulate payment
      setIsLoading(true);
      await new Promise(resolve => setTimeout(resolve, 2000));
      setPaymentStatus({ type: 'success', message: 'Payment successful!' });
      setIsLoading(false);
    }

    if (currentStep === 6) {
      const passValidation = validatePassword(tenantData.password);
      if (!passValidation.isValid) return setError('Password does not meet requirements');
      if (tenantData.password !== tenantData.confirmPassword) return setError('Passwords do not match');

      setIsLoading(true);
      try {
        // Complete tenant registration using the step-by-step system
        const finalData = {
          session_id: registrationSession,
          email: tenantData.email,
          full_name: tenantData.name,
          password: tenantData.password,
          government_id: tenantData.governmentId,
          phone_number: tenantData.phone,
          emergency_contact: tenantData.emergencyContact
        };

        const response = await fetch('http://localhost:8000/api/accounts/auth/tenant/complete/', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(finalData)
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Registration failed');
        }

        const result = await response.json();
        alert('Registration successful! Please login.');
        setAuthMode('login');
        resetTenantForm();
        return;
      } catch (err) {
        setError(err.message || 'Registration failed. Please try again.');
      } finally {
        setIsLoading(false);
      }
      return;
    }

    setCurrentStep(prev => prev + 1);
  };

  const handleLandlordNext = async () => {
    setError('');

    if (currentStep === 2) {
      if (!landlordData.fullName.trim()) return setError('Full name is required');
      if (!validateKenyanID(landlordData.nationalId)) return setError('Invalid National ID');
      if (!landlordData.tillNumber.trim()) return setError('M-Pesa Till Number is required');
      if (!validateEmail(landlordData.email)) return setError('Invalid email');
      if (!validateKenyanPhone(landlordData.phone)) return setError('Invalid phone number');
      if (!landlordData.address.trim()) return setError('Address is required');

      const passValidation = validatePassword(landlordData.password);
      if (!passValidation.isValid) return setError('Password does not meet requirements');
      if (landlordData.password !== landlordData.confirmPassword) return setError('Passwords do not match');
    }

    if (currentStep === 3) {
      if (calculateTotalUnits() === 0) return setError('Please add at least one unit');
      
      for (const property of landlordData.properties) {
        if (!property.propertyName.trim()) return setError('All properties must have a name');
        if (!property.propertyAddress.trim()) return setError('All properties must have an address');
        for (const unit of property.units) {
          if (!unit.unitNumber.trim()) return setError('All units must have a unit number');
          if (!unit.monthlyRent || unit.monthlyRent <= 0) return setError('All units must have valid rent');
        }
      }
    }

    if (currentStep === 4) {
      setIsLoading(true);
      await new Promise(resolve => setTimeout(resolve, 2000));
      setPaymentStatus({ type: 'success', message: 'Payment successful!' });
      setIsLoading(false);

      try {
        // Complete landlord registration using the step-by-step system
        const finalData = {
          session_id: registrationSession,
          email: landlordData.email,
          full_name: landlordData.fullName,
          password: landlordData.password,
          phone_number: landlordData.phone,
          government_id: landlordData.nationalId,
          mpesa_till_number: landlordData.tillNumber,
          address: landlordData.address,
          website: landlordData.website,
          properties: landlordData.properties.map(prop => ({
            name: prop.propertyName,
            address: prop.propertyAddress,
            units: prop.units.map(unit => ({
              unit_number: unit.unitNumber,
              room_type: unit.roomType,
              monthly_rent: parseFloat(unit.monthlyRent)
            }))
          }))
        };

        const response = await fetch('http://localhost:8000/api/accounts/auth/landlord/complete/', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(finalData)
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Registration failed');
        }

        const result = await response.json();
        alert('Registration successful! Please login.');
        setAuthMode('login');
        resetLandlordForm();
      } catch (err) {
        setError(err.message || 'Registration failed. Please try again.');
      } finally {
        setIsLoading(false);
      }
      return;
    }

    setCurrentStep(prev => prev + 1);
  };

  const resetTenantForm = () => {
    setTenantData({
      landlordId: '', name: '', governmentId: '', email: '', phone: '',
      emergencyContact: '', selectedProperty: '', selectedRoom: '',
      monthlyRent: 0, depositAmount: 0, idDocument: null, mpesaPhone: '',
      password: '', confirmPassword: ''
    });
    setCurrentStep(1);
  };

  const resetLandlordForm = () => {
    setLandlordData({
      fullName: '', nationalId: '', tillNumber: '', email: '', phone: '',
      address: '', website: '', password: '', confirmPassword: '',
      properties: [{ id: Date.now(), propertyName: '', propertyAddress: '', units: [] }]
    });
    setCurrentStep(1);
  };

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

  const PasswordRequirement = ({ met, text }) => (
    <div className="flex items-center">
      {met ? (
        <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
      ) : (
        <AlertCircle className="w-4 h-4 text-gray-400 mr-2" />
      )}
      <span className={`text-sm ${met ? 'text-green-600' : 'text-gray-500'}`}>{text}</span>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full">
        <div className="text-center mb-8">
          <Building className="w-16 h-16 text-blue-600 mx-auto mb-4" />
          <h1 className="text-4xl font-bold text-blue-600 mb-2">Makao Rentals</h1>
          <p className="text-gray-600">Property Management Made Simple</p>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          <div className="flex border-b">
            <button
              onClick={() => { setAuthMode('login'); setError(''); setCurrentStep(1); }}
              className={`flex-1 py-4 font-semibold transition-colors ${
                authMode === 'login' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'
              }`}
            >
              Login
            </button>
            <button
              onClick={() => { setAuthMode('signup'); setError(''); setCurrentStep(1); }}
              className={`flex-1 py-4 font-semibold transition-colors ${
                authMode === 'signup' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'
              }`}
            >
              Sign Up
            </button>
          </div>

          <div className="p-8">
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
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                      >
                        {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">I am a</label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setLoginData(prev => ({ ...prev, user_type: 'tenant' }))}
                        className={`p-3 border-2 rounded-lg ${
                          loginData.user_type === 'tenant' ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                        }`}
                      >
                        <Users className="w-6 h-6 mx-auto mb-1" />
                        <span className="text-sm font-medium">Tenant</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setLoginData(prev => ({ ...prev, user_type: 'landlord' }))}
                        className={`p-3 border-2 rounded-lg ${
                          loginData.user_type === 'landlord' ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                        }`}
                      >
                        <Home className="w-6 h-6 mx-auto mb-1" />
                        <span className="text-sm font-medium">Landlord</span>
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  >
                    {isLoading ? 'Signing In...' : 'Sign In'}
                  </button>
                </form>
              </div>
            )}

            {authMode === 'signup' && currentStep === 1 && (
              <div>
                <h2 className="text-2xl font-bold mb-6">Choose Account Type</h2>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => { setUserType('tenant'); setCurrentStep(2); }}
                    className="p-6 border-2 border-gray-200 rounded-xl hover:border-blue-500 hover:bg-blue-50"
                  >
                    <Users className="w-12 h-12 text-blue-600 mx-auto mb-3" />
                    <h3 className="font-bold text-lg mb-2">Tenant</h3>
                    <p className="text-sm text-gray-600">Find and manage your rental</p>
                  </button>
                  <button
                    onClick={() => { setUserType('landlord'); setCurrentStep(2); }}
                    className="p-6 border-2 border-gray-200 rounded-xl hover:border-blue-500 hover:bg-blue-50"
                  >
                    <Home className="w-12 h-12 text-blue-600 mx-auto mb-3" />
                    <h3 className="font-bold text-lg mb-2">Landlord</h3>
                    <p className="text-sm text-gray-600">Manage your properties</p>
                  </button>
                </div>
              </div>
            )}

            {/* TENANT SIGNUP FORMS */}
            {authMode === 'signup' && userType === 'tenant' && currentStep > 1 && (
              <div>
                <StepIndicator 
                  currentStep={currentStep - 1} 
                  totalSteps={6} 
                  labels={['Personal', 'Property', 'Documents', 'Payment', 'Account', 'Done']}
                />

                {error && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start">
                    <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                )}

                {/* Step 2: Personal Info */}
                {currentStep === 2 && (
                  <div className="space-y-4">
                    <h2 className="text-xl font-bold mb-4">Personal Information</h2>
                    <input
                      type="text"
                      placeholder="Landlord ID"
                      value={tenantData.landlordId}
                      onChange={(e) => setTenantData({...tenantData, landlordId: e.target.value})}
                      className="w-full px-4 py-3 border rounded-lg"
                    />
                    <input
                      type="text"
                      placeholder="Full Name"
                      value={tenantData.name}
                      onChange={(e) => setTenantData({...tenantData, name: e.target.value})}
                      className="w-full px-4 py-3 border rounded-lg"
                    />
                    <input
                      type="text"
                      placeholder="Government ID"
                      value={tenantData.governmentId}
                      onChange={(e) => setTenantData({...tenantData, governmentId: e.target.value})}
                      className="w-full px-4 py-3 border rounded-lg"
                    />
                    <input
                      type="email"
                      placeholder="Email"
                      value={tenantData.email}
                      onChange={(e) => setTenantData({...tenantData, email: e.target.value})}
                      className="w-full px-4 py-3 border rounded-lg"
                    />
                    <input
                      type="tel"
                      placeholder="Phone Number"
                      value={tenantData.phone}
                      onChange={(e) => setTenantData({...tenantData, phone: e.target.value})}
                      className="w-full px-4 py-3 border rounded-lg"
                    />
                    <input
                      type="tel"
                      placeholder="Emergency Contact"
                      value={tenantData.emergencyContact}
                      onChange={(e) => setTenantData({...tenantData, emergencyContact: e.target.value})}
                      className="w-full px-4 py-3 border rounded-lg"
                    />
                    <button
                      onClick={handleTenantNext}
                      disabled={isLoading}
                      className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700"
                    >
                      {isLoading ? 'Loading...' : 'Continue'}
                    </button>
                  </div>
                )}

                {/* Step 3: Property Selection */}
                {currentStep === 3 && (
                  <div className="space-y-4">
                    <h2 className="text-xl font-bold mb-4">Select Property & Unit</h2>
                    {availableProperties.length > 0 ? (
                      <>
                        <select
                          value={tenantData.selectedProperty}
                          onChange={(e) => {
                            setTenantData({...tenantData, selectedProperty: e.target.value});
                            const prop = availableProperties.find(p => p.id === parseInt(e.target.value));
                            setAvailableRooms(prop?.units || []);
                          }}
                          className="w-full px-4 py-3 border rounded-lg"
                        >
                          <option value="">Select Property</option>
                          {availableProperties.map(prop => (
                            <option key={prop.id} value={prop.id}>{prop.name}</option>
                          ))}
                        </select>

                        {availableRooms.length > 0 && (
                          <select
                            value={tenantData.selectedRoom}
                            onChange={(e) => {
                              const room = availableRooms.find(r => r.id === parseInt(e.target.value));
                              setTenantData({
                                ...tenantData,
                                selectedRoom: e.target.value,
                                monthlyRent: room?.rent || 0,
                                depositAmount: room?.deposit || 0
                              });
                            }}
                            className="w-full px-4 py-3 border rounded-lg"
                          >
                            <option value="">Select Unit</option>
                            {availableRooms.map(room => (
                              <option key={room.id} value={room.id}>
                                Unit {room.unit_number} - KSh {room.rent}
                              </option>
                            ))}
                          </select>
                        )}
                      </>
                    ) : (
                      <p className="text-gray-600">No properties available</p>
                    )}
                    <div className="flex gap-3">
                      <button onClick={() => setCurrentStep(2)} className="flex-1 bg-gray-200 py-3 rounded-lg">Back</button>
                      <button onClick={handleTenantNext} className="flex-1 bg-blue-600 text-white py-3 rounded-lg">Continue</button>
                    </div>
                  </div>
                )}

                {/* Step 4: Document Upload */}
                {currentStep === 4 && (
                  <div className="space-y-4">
                    <h2 className="text-xl font-bold mb-4">Upload ID Document</h2>
                    <input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={(e) => setTenantData({...tenantData, idDocument: e.target.files[0]})}
                      className="w-full px-4 py-3 border rounded-lg"
                    />
                    <div className="flex gap-3">
                      <button onClick={() => setCurrentStep(3)} className="flex-1 bg-gray-200 py-3 rounded-lg">Back</button>
                      <button onClick={handleTenantNext} className="flex-1 bg-blue-600 text-white py-3 rounded-lg">Continue</button>
                    </div>
                  </div>
                )}

                {/* Step 5: Payment */}
                {currentStep === 5 && (
                  <div className="space-y-4">
                    <h2 className="text-xl font-bold mb-4">Pay Deposit</h2>
                    <div className="bg-blue-50 p-4 rounded-lg mb-4">
                      <p className="font-semibold">Amount Due: KSh {tenantData.depositAmount.toLocaleString()}</p>
                    </div>
                    <input
                      type="tel"
                      placeholder="M-Pesa Phone Number"
                      value={tenantData.mpesaPhone}
                      onChange={(e) => setTenantData({...tenantData, mpesaPhone: e.target.value})}
                      className="w-full px-4 py-3 border rounded-lg"
                    />
                    {paymentStatus && (
                      <div className={`p-3 rounded-lg ${paymentStatus.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                        {paymentStatus.message}
                      </div>
                    )}
                    <div className="flex gap-3">
                      <button onClick={() => setCurrentStep(4)} className="flex-1 bg-gray-200 py-3 rounded-lg">Back</button>
                      <button onClick={handleTenantNext} disabled={isLoading} className="flex-1 bg-blue-600 text-white py-3 rounded-lg">
                        {isLoading ? 'Processing...' : 'Pay Now'}
                      </button>
                    </div>
                  </div>
                )}

                {/* Step 6: Account Security */}
                {currentStep === 6 && (
                  <div className="space-y-4">
                    <h2 className="text-xl font-bold mb-4">Create Password</h2>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        placeholder="Password"
                        value={tenantData.password}
                        onChange={(e) => setTenantData({...tenantData, password: e.target.value})}
                        className="w-full px-4 py-3 border rounded-lg pr-12"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2"
                      >
                        {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                      </button>
                    </div>
                    <div className="relative">
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="Confirm Password"
                        value={tenantData.confirmPassword}
                        onChange={(e) => setTenantData({...tenantData, confirmPassword: e.target.value})}
                        className="w-full px-4 py-3 border rounded-lg pr-12"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2"
                      >
                        {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                      </button>
                    </div>

                    {tenantData.password && (
                      <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                        <p className="font-medium text-sm mb-2">Password Requirements:</p>
                        <PasswordRequirement 
                          met={validatePassword(tenantData.password).minLength} 
                          text="At least 8 characters" 
                        />
                        <PasswordRequirement 
                          met={validatePassword(tenantData.password).hasUppercase} 
                          text="One uppercase letter" 
                        />
                        <PasswordRequirement 
                          met={validatePassword(tenantData.password).hasLowercase} 
                          text="One lowercase letter" 
                        />
                        <PasswordRequirement 
                          met={validatePassword(tenantData.password).hasNumber} 
                          text="One number" 
                        />
                      </div>
                    )}

                    <div className="flex gap-3">
                      <button onClick={() => setCurrentStep(5)} className="flex-1 bg-gray-200 py-3 rounded-lg">Back</button>
                      <button onClick={handleTenantNext} disabled={isLoading} className="flex-1 bg-blue-600 text-white py-3 rounded-lg">
                        {isLoading ? 'Submitting...' : 'Complete Registration'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* LANDLORD SIGNUP FORMS */}
            {authMode === 'signup' && userType === 'landlord' && currentStep > 1 && (
              <div>
                <StepIndicator 
                  currentStep={currentStep - 1} 
                  totalSteps={4} 
                  labels={['Personal', 'Properties', 'Payment', 'Done']}
                />

                {error && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start">
                    <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                )}

                {/* Step 2: Personal Info */}
                {currentStep === 2 && (
                  <div className="space-y-4">
                    <h2 className="text-xl font-bold mb-4">Personal Information</h2>
                    <input
                      type="text"
                      placeholder="Full Name"
                      value={landlordData.fullName}
                      onChange={(e) => setLandlordData({...landlordData, fullName: e.target.value})}
                      className="w-full px-4 py-3 border rounded-lg"
                    />
                    <input
                      type="text"
                      placeholder="National ID"
                      value={landlordData.nationalId}
                      onChange={(e) => setLandlordData({...landlordData, nationalId: e.target.value})}
                      className="w-full px-4 py-3 border rounded-lg"
                    />
                    <input
                      type="text"
                      placeholder="M-Pesa Till Number"
                      value={landlordData.tillNumber}
                      onChange={(e) => setLandlordData({...landlordData, tillNumber: e.target.value})}
                      className="w-full px-4 py-3 border rounded-lg"
                    />
                    <input
                      type="email"
                      placeholder="Email"
                      value={landlordData.email}
                      onChange={(e) => setLandlordData({...landlordData, email: e.target.value})}
                      className="w-full px-4 py-3 border rounded-lg"
                    />
                    <input
                      type="tel"
                      placeholder="Phone Number"
                      value={landlordData.phone}
                      onChange={(e) => setLandlordData({...landlordData, phone: e.target.value})}
                      className="w-full px-4 py-3 border rounded-lg"
                    />
                    <input
                      type="text"
                      placeholder="Business Address"
                      value={landlordData.address}
                      onChange={(e) => setLandlordData({...landlordData, address: e.target.value})}
                      className="w-full px-4 py-3 border rounded-lg"
                    />
                    <input
                      type="url"
                      placeholder="Website (Optional)"
                      value={landlordData.website}
                      onChange={(e) => setLandlordData({...landlordData, website: e.target.value})}
                      className="w-full px-4 py-3 border rounded-lg"
                    />
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        placeholder="Password"
                        value={landlordData.password}
                        onChange={(e) => setLandlordData({...landlordData, password: e.target.value})}
                        className="w-full px-4 py-3 border rounded-lg pr-12"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2"
                      >
                        {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                      </button>
                    </div>
                    <div className="relative">
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="Confirm Password"
                        value={landlordData.confirmPassword}
                        onChange={(e) => setLandlordData({...landlordData, confirmPassword: e.target.value})}
                        className="w-full px-4 py-3 border rounded-lg pr-12"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2"
                      >
                        {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                      </button>
                    </div>

                    {landlordData.password && (
                      <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                        <p className="font-medium text-sm mb-2">Password Requirements:</p>
                        <PasswordRequirement 
                          met={validatePassword(landlordData.password).minLength} 
                          text="At least 8 characters" 
                        />
                        <PasswordRequirement 
                          met={validatePassword(landlordData.password).hasUppercase} 
                          text="One uppercase letter" 
                        />
                        <PasswordRequirement 
                          met={validatePassword(landlordData.password).hasLowercase} 
                          text="One lowercase letter" 
                        />
                        <PasswordRequirement 
                          met={validatePassword(landlordData.password).hasNumber} 
                          text="One number" 
                        />
                      </div>
                    )}

                    <button
                      onClick={handleLandlordNext}
                      className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700"
                    >
                      Continue
                    </button>
                  </div>
                )}

                {/* Step 3: Properties Setup */}
                {currentStep === 3 && (
                  <div className="space-y-4">
                    <h2 className="text-xl font-bold mb-4">Add Your Properties</h2>
                    
                    {landlordData.properties.map((property, pIndex) => (
                      <div key={property.id} className="border rounded-lg p-4 space-y-3">
                        <h3 className="font-semibold">Property {pIndex + 1}</h3>
                        <input
                          type="text"
                          placeholder="Property Name"
                          value={property.propertyName}
                          onChange={(e) => {
                            const newProps = [...landlordData.properties];
                            newProps[pIndex].propertyName = e.target.value;
                            setLandlordData({...landlordData, properties: newProps});
                          }}
                          className="w-full px-4 py-2 border rounded-lg"
                        />
                        <input
                          type="text"
                          placeholder="Property Address"
                          value={property.propertyAddress}
                          onChange={(e) => {
                            const newProps = [...landlordData.properties];
                            newProps[pIndex].propertyAddress = e.target.value;
                            setLandlordData({...landlordData, properties: newProps});
                          }}
                          className="w-full px-4 py-2 border rounded-lg"
                        />

                        <div className="space-y-2">
                          <h4 className="font-medium text-sm">Units</h4>
                          {property.units.map((unit, uIndex) => (
                            <div key={unit.id} className="flex gap-2">
                              <input
                                type="text"
                                placeholder="Unit #"
                                value={unit.unitNumber}
                                onChange={(e) => {
                                  const newProps = [...landlordData.properties];
                                  newProps[pIndex].units[uIndex].unitNumber = e.target.value;
                                  setLandlordData({...landlordData, properties: newProps});
                                }}
                                className="flex-1 px-3 py-2 border rounded-lg"
                              />
                              <select
                                value={unit.roomType}
                                onChange={(e) => {
                                  const newProps = [...landlordData.properties];
                                  newProps[pIndex].units[uIndex].roomType = e.target.value;
                                  setLandlordData({...landlordData, properties: newProps});
                                }}
                                className="px-3 py-2 border rounded-lg"
                              >
                                <option value="studio">Studio</option>
                                <option value="1-bedroom">1 Bedroom</option>
                                <option value="2-bedroom">2 Bedroom</option>
                                <option value="3-bedroom">3 Bedroom</option>
                              </select>
                              <input
                                type="number"
                                placeholder="Rent"
                                value={unit.monthlyRent}
                                onChange={(e) => {
                                  const newProps = [...landlordData.properties];
                                  newProps[pIndex].units[uIndex].monthlyRent = e.target.value;
                                  setLandlordData({...landlordData, properties: newProps});
                                }}
                                className="w-24 px-3 py-2 border rounded-lg"
                              />
                              <button
                                onClick={() => {
                                  const newProps = [...landlordData.properties];
                                  newProps[pIndex].units = newProps[pIndex].units.filter((_, i) => i !== uIndex);
                                  setLandlordData({...landlordData, properties: newProps});
                                }}
                                className="px-3 py-2 bg-red-100 text-red-600 rounded-lg"
                              >
                                <X size={16} />
                              </button>
                            </div>
                          ))}
                          <button
                            onClick={() => addUnit(property.id)}
                            className="w-full py-2 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500"
                          >
                            + Add Unit
                          </button>
                        </div>
                      </div>
                    ))}

                    <button
                      onClick={addProperty}
                      className="w-full py-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500"
                    >
                      + Add Property
                    </button>

                    <div className="bg-blue-50 p-4 rounded-lg">
                      <p className="font-semibold">Total Units: {calculateTotalUnits()}</p>
                      <p className="text-sm text-gray-600">Monthly Fee: KSh {calculateMonthlyFee().toLocaleString()}</p>
                    </div>

                    <div className="flex gap-3">
                      <button onClick={() => setCurrentStep(2)} className="flex-1 bg-gray-200 py-3 rounded-lg">Back</button>
                      <button onClick={handleLandlordNext} className="flex-1 bg-blue-600 text-white py-3 rounded-lg">Continue</button>
                    </div>
                  </div>
                )}

                {/* Step 4: Payment */}
                {currentStep === 4 && (
                  <div className="space-y-4">
                    <h2 className="text-xl font-bold mb-4">Subscription Payment</h2>
                    
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-lg">
                      <h3 className="font-bold text-lg mb-2">60-Day Free Trial</h3>
                      <p className="text-gray-600 mb-4">Start managing your properties risk-free</p>
                      <div className="space-y-2">
                        <p className="flex justify-between">
                          <span>Total Units:</span>
                          <span className="font-semibold">{calculateTotalUnits()}</span>
                        </p>
                        <p className="flex justify-between">
                          <span>Monthly Fee (after trial):</span>
                          <span className="font-semibold">KSh {calculateMonthlyFee().toLocaleString()}</span>
                        </p>
                        <p className="flex justify-between text-green-600 font-bold">
                          <span>Today's Payment:</span>
                          <span>FREE</span>
                        </p>
                      </div>
                    </div>

                    {paymentStatus && (
                      <div className={`p-4 rounded-lg ${paymentStatus.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                        <CheckCircle className="inline mr-2" />
                        {paymentStatus.message}
                      </div>
                    )}

                    <div className="flex gap-3">
                      <button onClick={() => setCurrentStep(3)} className="flex-1 bg-gray-200 py-3 rounded-lg">Back</button>
                      <button 
                        onClick={handleLandlordNext} 
                        disabled={isLoading}
                        className="flex-1 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700"
                      >
                        {isLoading ? 'Processing...' : 'Complete Registration'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="text-center mt-6 text-sm text-gray-600">
          <p>© 2025 Makao Rentals. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
};

export default UnifiedAuthSystem;