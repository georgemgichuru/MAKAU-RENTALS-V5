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

  // Forgot password states
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotSuccess, setForgotSuccess] = useState('');
  const [forgotError, setForgotError] = useState('');

  // Add this state
  const [sessionId, setSessionId] = useState(null);
  // Prevent rapid navigation clicks and support optional doc acknowledgement
  const [navBusy, setNavBusy] = useState(false);
  const [idUploadAcknowledged, setIdUploadAcknowledged] = useState(false);

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
    selectedRoomId: null,
    monthlyRent: 0,
    depositAmount: 0,
    idDocument: null,
    password: '',
    confirmPassword: '',
    alreadyLivingInProperty: false,
    requiresDeposit: true,
    depositPaymentCompleted: false // Track if deposit payment was successfully completed
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
    unitTypes: [
      {
        id: Date.now(),
        name: '',
        rent: '',
        deposit: '',
        description: '',
        amenities: []
      }
    ],
    properties: [
      {
        id: Date.now(),
        propertyName: '',
        propertyAddress: '',
        units: [] // Will contain {unitTypeId, count} objects
      }
    ]
  });

  // Bulk unit addition state
  const [bulkUnitMode, setBulkUnitMode] = useState({});
  
  // Single unit addition state - track selected room type per property
  const [singleUnitSelection, setSingleUnitSelection] = useState({});

  const pricingTiers = [
    { min: 1, max: 10, price: 2000, label: '1-10 units' },
    { min: 11, max: 20, price: 2500, label: '11-20 units' },
    { min: 21, max: 50, price: 4500, label: '21-50 units' },
    { min: 51, max: 100, price: 7500, label: '51-100 units' },
    { min: 101, max: Infinity, price: 'custom', label: '100+ units - Contact us for custom pricing', isCustom: true }
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

  // ---------- Step validity helpers ----------
  const isTenantStep2Valid = () => {
    try {
      if (!tenantData.landlordId?.trim()) return false;
      if (!tenantData.name?.trim()) return false;
      if (!validateKenyanID(tenantData.governmentId || '')) return false;
      if (!validateEmail(tenantData.email || '')) return false;
      if (!validateKenyanPhone(tenantData.phone || '')) return false;
      if (!validateKenyanPhone(tenantData.emergencyContact || '')) return false;
      return true;
    } catch {
      return false;
    }
  };

  const isTenantStep3Valid = () => Boolean(tenantData.selectedProperty) && Boolean(tenantData.selectedRoom);
  const isTenantStep4Valid = () => Boolean(tenantData.idDocument) || Boolean(idUploadAcknowledged);
  const isTenantStep5Valid = () => (tenantData.alreadyLivingInProperty || tenantData.requiresDeposit === false) || tenantData.depositPaymentCompleted === true;
  const isTenantStep6Valid = () => {
    const v = validatePassword(tenantData.password || '');
    return v.isValid && tenantData.password === tenantData.confirmPassword;
  };

  const isLandlordStep2Valid = () => {
    const v = validatePassword(landlordData.password || '');
    const tillOk = !landlordData.tillNumber || /^\d{5,8}$/.test((landlordData.tillNumber || '').trim());
    return (
      Boolean(landlordData.fullName?.trim()) &&
      validateKenyanID(landlordData.nationalId || '') &&
      validateEmail(landlordData.email || '') &&
      validateKenyanPhone(landlordData.phone || '') &&
      Boolean(landlordData.address?.trim()) &&
      v.isValid &&
      landlordData.password === landlordData.confirmPassword &&
      tillOk
    );
  };

  const isLandlordStep3Valid = () => {
    if (!landlordData.properties || landlordData.properties.length === 0) return false;
    for (const p of landlordData.properties) {
      if (!p.propertyName?.trim() || !p.propertyAddress?.trim()) return false;
      if (!p.units || p.units.length === 0) return false;
    }
    return true;
  };

  // ---------- Guarded next handlers ----------
  const handleTenantNextSafe = async () => {
    if (navBusy) return;
    setError('');
    if (!sessionId) setSessionId(generateUUID());
    try {
      setNavBusy(true);
      if (currentStep === 2 && !isTenantStep2Valid()) { setError('Please complete all required personal information with valid details.'); return; }
      if (currentStep === 3 && !isTenantStep3Valid()) { setError('Please select a property and an available room to continue.'); return; }
      if (currentStep === 4 && !isTenantStep4Valid()) { setError('Upload your government ID or check “I will upload later” to proceed.'); return; }
      if (currentStep === 5 && !isTenantStep5Valid()) { setError('Please complete the deposit payment or indicate you are already living in the property.'); return; }
      if (currentStep === 6 && !isTenantStep6Valid()) { setError('Please create a strong password and ensure both passwords match.'); return; }
      await handleTenantNext();
    } finally {
      setNavBusy(false);
    }
  };

  const handleLandlordNextSafe = async () => {
    if (navBusy) return;
    setError('');
    if (!sessionId) setSessionId(generateUUID());
    try {
      setNavBusy(true);
      if (currentStep === 2 && !isLandlordStep2Valid()) { setError('Please fill in all required personal and business details with valid information.'); return; }
      if (currentStep === 3 && !isLandlordStep3Valid()) { setError('Please add at least one property with address and at least one unit.'); return; }
      await handleLandlordNext();
    } finally {
      setNavBusy(false);
    }
  };

  // ---------- Mode/type switching helpers ----------
  const handleAuthModeChange = (mode) => {
    if (mode === authMode) return;
    if (authMode === 'signup' && currentStep > 1) {
      const ok = window.confirm('Switching modes will clear your current signup progress. Continue?');
      if (!ok) return;
    }
    setAuthMode(mode);
    setError('');
    setPaymentStatus(null);
    setShowForgotPassword(false);
    setForgotEmail('');
    setForgotLoading(false);
    setForgotSuccess('');
    setForgotError('');
    setCurrentStep(1);
    setLoginData({ email: '', password: '' });
    resetTenantForm();
    resetLandlordForm();
    setIdUploadAcknowledged(false);
  };

  const handleSwitchUserType = (newType) => {
    if (newType === userType) return;
    const hasTenantProgress = Boolean(
      tenantData.landlordId || tenantData.name || tenantData.email || tenantData.phone || tenantData.selectedProperty || tenantData.selectedRoom
    );
    const hasLandlordProgress = Boolean(
      landlordData.fullName || landlordData.email || (landlordData.properties && landlordData.properties.some(p => p.propertyName || (p.units && p.units.length)))
    );
    const hasProgress = currentStep > 1 && (hasTenantProgress || hasLandlordProgress);
    if (authMode === 'signup' && hasProgress) {
      const ok = window.confirm('Switching between Tenant and Landlord will clear your current signup progress. Continue?');
      if (!ok) return;
    }
    setUserType(newType);
    resetTenantForm();
    resetLandlordForm();
    setError('');
    setPaymentStatus(null);
    setCurrentStep(1);
    setIdUploadAcknowledged(false);
  };

  const handleRemoveIdDocument = () => {
    setTenantData(prev => ({ ...prev, idDocument: null }));
    setIdUploadAcknowledged(false);
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

      // Check if response is HTML error page (server error)
      if (typeof response.data === 'string' && response.data.includes('DOCTYPE html')) {
        console.error('Login failed: server error or backend unavailable');
        setError('Login service temporarily unavailable. Please try again later.');
        return;
      }

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
      console.error('Error response:', err.response?.data);
      
      // Extract error message from backend response
      let errorMessage = 'Invalid email or password';
      
      if (err.response?.data) {
        // Handle DRF non_field_errors (most common for ValidationError)
        if (err.response.data.non_field_errors) {
          errorMessage = Array.isArray(err.response.data.non_field_errors) 
            ? err.response.data.non_field_errors[0] 
            : err.response.data.non_field_errors;
        }
        // Handle non-field errors (detail)
        else if (err.response.data.detail) {
          errorMessage = Array.isArray(err.response.data.detail) 
            ? err.response.data.detail[0] 
            : err.response.data.detail;
        } 
        // Handle form-level errors (error key)
        else if (err.response.data.error) {
          errorMessage = Array.isArray(err.response.data.error)
            ? err.response.data.error[0]
            : err.response.data.error;
        }
        // Handle user_type validation errors
        else if (err.response.data.user_type) {
          errorMessage = Array.isArray(err.response.data.user_type) 
            ? err.response.data.user_type[0] 
            : err.response.data.user_type;
        }
      }
      
      // Ensure errorMessage is a string before calling toLowerCase
      const errorStr = typeof errorMessage === 'string' ? errorMessage : String(errorMessage);
      
      // Check for inactive account (pending landlord approval)
      if (errorStr.toLowerCase().includes('inactive') || 
          errorStr.toLowerCase().includes('disabled') ||
          errorStr.toLowerCase().includes('not active') ||
          errorStr.toLowerCase().includes('pending approval')) {
        errorMessage = 'Your account is pending approval. Please await approval from your landlord or contact us for support.';
      }
      // Check for account type mismatch error and provide user-friendly message
      else if (errorStr.toLowerCase().includes('invalid account type') || 
          errorStr.toLowerCase().includes('not a')) {
        // Extract actual user type from error message if available
        const actualUserType = errorStr.includes('landlord') ? 'landlord' : 
                              errorStr.includes('tenant') ? 'tenant' : 'different user type';
        const currentUserType = userType === 'landlord' ? 'Landlord' : 'Tenant';
        
        errorMessage = `This account is registered as a ${actualUserType}, not as a ${currentUserType}. Please log in with the correct account type.`;
      }
      
      setError(errorMessage);
      
      // Clear tokens on error
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('userType');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle forgot password submit
  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setForgotError('');
    setForgotSuccess('');
    setForgotLoading(true);
    
    try {
      // Get the API base URL from environment or use default
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://preaccommodatingly-nonabsorbable-joanie.ngrok-free.dev/api';
      
      console.log('Sending password reset request to:', `${API_BASE_URL}/accounts/password/reset/`);
      console.log('Email:', forgotEmail);
      console.log('Frontend URL:', window.location.origin);
      
      // Call backend API to send reset email
      const response = await fetch(`${API_BASE_URL}/accounts/password/reset/`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'true'
        },
        body: JSON.stringify({ 
          email: forgotEmail,
          frontend_url: window.location.origin  // Send actual frontend URL
        })
      });
      
      console.log('Response status:', response.status);
      
      if (!response.ok) {
        const data = await response.json();
        console.error('Error response:', data);
        throw new Error(data.error || data.email?.[0] || 'Failed to send reset email');
      }
      
      const result = await response.json();
      console.log('Success response:', result);
      
      setForgotSuccess('A password reset link has been sent to your email.');
      setForgotEmail('');
    } catch (err) {
      console.error('Forgot password error:', err);
      setForgotError(err.message || 'An error occurred. Please try again.');
    } finally {
      setForgotLoading(false);
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
      // Check if the error is specifically about no available units
      const isNoUnitsAvailable = err.response?.data?.no_available_units === true;
      const errorMessage = err.response?.data?.error || 'Landlord ID not found. Please check and try again.';
      
      setError(errorMessage);
      setAvailableProperties([]);
      
      // If no units available, we should not allow progression
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

  // Handle room selection - ensure amounts are properly set
  const handleRoomSelection = (roomId) => {
    const room = availableRooms.find(r => r.id === roomId);
    if (room) {
      const rentAmount = parseFloat(room.rent) || 5000; // Fallback to 5000 if 0
      const depositAmount = parseFloat(room.deposit) || rentAmount; // Use deposit if set, otherwise use rent

      console.log('Room selected:', {
        roomId,
        unitCode: room.unit_code,
        rent: rentAmount,
        deposit: depositAmount
      });

      setTenantData(prev => ({
        ...prev,
        selectedRoom: room.unit_code, // Store unit_code for registration
        selectedRoomId: room.id,      // Store id for payment
        monthlyRent: rentAmount,
        depositAmount: depositAmount
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

  // REAL API: Process tenant deposit payment using PesaPal
  const processTenantDepositPayment = async () => {
    setIsLoading(true);
    setPaymentStatus(null);

    try {
      // Ensure we have a session ID
      const currentSessionId = sessionId || generateUUID();
      if (!sessionId) {
        setSessionId(currentSessionId);
      }

      console.log('Processing deposit payment:', {
        unit_id: tenantData.selectedRoomId,
        amount: tenantData.depositAmount,
        session_id: currentSessionId,
        email: tenantData.email
      });

      // Real payment processing for registration (use unauthenticated endpoint)
      const paymentData = {
        unit_id: parseInt(tenantData.selectedRoomId),
        amount: Math.round(tenantData.depositAmount),
        phone_number: tenantData.phone,
        email: tenantData.email,  // ✅ Send tenant email for better tracking
        session_id: currentSessionId
      };

      const response = await paymentsAPI.initiateDepositRegistration(paymentData);

      console.log('Payment response:', response.data);

      if (response.data.success && response.data.redirect_url) {
        // Store payment info for status checking after redirect
        localStorage.setItem('pending_payment_id', response.data.payment_id);
        localStorage.setItem('payment_type', 'deposit');
        localStorage.setItem('registration_session_id', currentSessionId);
        
        // Mark deposit as initiated (will be completed after payment verification)
        setTenantData(prev => ({ ...prev, depositPaymentCompleted: true }));
        
        setPaymentStatus({
          type: 'redirecting',
          message: 'Redirecting to payment gateway...',
          transactionId: response.data.order_tracking_id,
          paymentId: response.data.payment_id
        });
        
        // Redirect to PesaPal
        window.location.href = response.data.redirect_url;
        return true;
      } else {
        throw new Error(response.data.error || 'Payment initiation failed');
      }
    } catch (err) {
      console.error('Payment error:', err);
      const errorMessage = err.response?.data?.error ||
                          err.response?.data?.message ||
                          err.response?.data?.detail ||
                          'Payment initiation failed. Please try again.';
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
    const currentSessionId = sessionId || generateUUID();
    if (!sessionId) {
      setSessionId(currentSessionId);
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
        setError('National ID must be 7-10 alphanumeric characters (e.g., 12345678 or AB1234567)');
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
          session_id: currentSessionId,
          landlord_id: tenantData.landlordId,
          full_name: tenantData.name,
          national_id: tenantData.governmentId,
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

    // Step 4: Document Upload (optional)
    if (currentStep === 4) {
        // Always persist step 4 flags; include document only if provided
        try {
          const payload = {
            session_id: currentSessionId,
            already_living_in_property: tenantData.alreadyLivingInProperty,
            requires_deposit: tenantData.requiresDeposit
          };
          if (tenantData.idDocument?.base64) {
            payload.id_document = tenantData.idDocument.base64;
            payload.id_document_name = tenantData.idDocument.name;
          }
          await authAPI.registerTenantStep(4, payload);
        } catch (err) {
          console.error('Error saving step 4 (optional document):', err);
          // Don't block progression if document upload fails; just show a warning
          setError(err.response?.data?.error || 'We could not save your document right now. You can proceed and upload later.');
        }

        // If tenant is already living in property, skip deposit payment
        if (tenantData.alreadyLivingInProperty) {
          setCurrentStep(6); // Skip step 5 (deposit payment) and go to step 6 (password)
          return;
        }
      }

    // Step 5: Deposit Payment
    if (currentStep === 5) {
      // If deposit payment already completed (returning from next step), just proceed
      if (tenantData.depositPaymentCompleted) {
        setCurrentStep(6);
        return;
      }
      
      // Otherwise, initiate deposit payment
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
          session_id: currentSessionId,
          full_name: tenantData.name,
          email: tenantData.email,
          password: tenantData.password,
          phone_number: tenantData.phone,
          national_id: tenantData.governmentId,
          emergency_contact: tenantData.emergencyContact,
          landlord_code: tenantData.landlordId,
          unit_code: tenantData.selectedRoom,
          id_document: tenantData.idDocument?.base64,
          already_living_in_property: tenantData.alreadyLivingInProperty,
          requires_deposit: tenantData.requiresDeposit
        };

        const response = await authAPI.registerTenant(registrationData);

        // Show success message based on whether approval is needed
        if (tenantData.alreadyLivingInProperty) {
          alert('Registration submitted successfully! Your application has been sent to the landlord for approval. You will be notified once approved.');
        } else {
          alert('Tenant registration successful! Please login.');
        }
        
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
      selectedRoom: null,
      selectedRoomId: null,
      monthlyRent: 0,
      depositAmount: 0,
      idDocument: null,
      password: '',
      confirmPassword: '',
      alreadyLivingInProperty: false,
      requiresDeposit: true,
      depositPaymentCompleted: false
    });
    setCurrentStep(1);
    setAvailableProperties([]);
    setAvailableRooms([]);
    setPaymentStatus(null);
    setSessionId(null);
    setIdUploadAcknowledged(false);
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
    return tier ? tier.price : 'custom';
  };

  // Helper function to format the fee display
  const formatFeeDisplay = () => {
    const fee = calculateMonthlyFee();
    if (fee === 'custom') {
      return 'Contact us for custom pricing at +254722714334';
    }
    return `KES ${fee}`;
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
        // Log the data being sent
        const propertiesPayload = landlordData.properties.map(property => ({
          name: property.propertyName,
          address: property.propertyAddress,
          units: property.units.map(unit => {
            // Validate room type before sending
            if (!unit.roomType || unit.roomType.trim() === '') {
              throw new Error(`Unit ${unit.unitNumber} is missing a room type`);
            }
            return {
              unit_number: unit.unitNumber,
              room_type: unit.roomType,
              monthly_rent: unit.monthlyRent
            };
          })
        }));
        
        console.log('📤 Sending landlord step 3 data:', JSON.stringify(propertiesPayload, null, 2));
        
        await authAPI.registerLandlordStep(3, {
          properties: propertiesPayload
        });
      } catch (err) {
        const errorMessage = err.response?.data?.message || err.response?.data?.error || err.message || 'Failed to save property information';
        setError(errorMessage);
        return;
      }
    }

    // Step 4: Complete Registration
    if (currentStep === 4) {
      setIsLoading(true);
      try {
        // Prepare properties payload with validation - use snake_case for backend compatibility
        const propertiesPayload = landlordData.properties.map(property => ({
          name: property.propertyName,  // Backend expects 'name'
          address: property.propertyAddress,  // Backend expects 'address'
          units: property.units.map(unit => {
            // Final validation
            if (!unit.roomType || unit.roomType.trim() === '') {
              throw new Error(`Unit ${unit.unitNumber || 'unnamed'} is missing a room type`);
            }
            if (!unit.monthlyRent || parseFloat(unit.monthlyRent) <= 0) {
              throw new Error(`Unit ${unit.unitNumber || 'unnamed'} must have a valid rent amount`);
            }
            return {
              unitNumber: unit.unitNumber,  // Send both for backend compatibility
              unit_number: unit.unitNumber,
              roomType: unit.roomType,      // Send both camelCase and snake_case
              room_type: unit.roomType,
              monthlyRent: unit.monthlyRent,
              monthly_rent: unit.monthlyRent
            };
          })
        }));
        
        console.log('📤 Final landlord registration data:', {
          session_id: sessionId,
          email: landlordData.email,
          properties: propertiesPayload
        });
        
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
          properties: propertiesPayload
        });

        // Determine landlord identifier from response (best-effort)
        const landlordId = response?.data?.id || response?.data?.user_id || null;

        // Decide whether this is a first-time signup. For registration flow we treat newly created
        // accounts as "first time". We also persist a small local marker so subsequent flow can
        // detect that the free trial was already granted for this email.
        const trialKey = `trial_${landlordData.email}`;
        const hasTrial = !!localStorage.getItem(trialKey);

        if (!hasTrial) {
          // Grant 30-day free trial locally (backend should also track this ideally).
          const trialEnds = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
          localStorage.setItem(trialKey, trialEnds);

          // NOTE: Ideally you'd call a backend endpoint here to register the trial server-side.
          // If such an endpoint exists (e.g. subscriptionAPI.createTrial) call it.

          alert(`🎉 Registration Successful!\n\nYour FREE 30-day trial has started!\n\nTrial ends: ${new Date(trialEnds).toLocaleDateString()}\n\nYou can now login and start managing your properties immediately with full access to all features.\n\nNo payment required until ${new Date(trialEnds).toLocaleDateString()}.`);
          setAuthMode('login');
          resetLandlordForm();
        } else {
          // Non-first-time flow: initiate subscription payment and navigate to payment tracking
          const amount = calculateMonthlyFee();
          if (!amount || amount <= 0) {
            // Free / contact-us tier — just finish registration
            alert('Registration successful! Your plan requires manual setup. Please contact support.');
            setAuthMode('login');
            resetLandlordForm();
          } else {
            try {
              setPaymentStatus(null);
              // Start subscription STK push (backend endpoint: /payments/stk-push-subscription/)
              const payPayload = {
                amount: Math.round(amount),
                phone_number: landlordData.phone.replace(/\s+/g, ''),
                session_id: sessionId,
                email: landlordData.email,
                landlord_id: landlordId
              };

              const payResp = await paymentsAPI.stkPushSubscription(payPayload);

              // navigate to a payment tracking page (frontend should have a route to show status)
              const paymentId = payResp?.data?.payment_id || payResp?.data?.id || null;
              const checkoutRequestId = payResp?.data?.checkout_request_id || payResp?.data?.checkout_request || null;

              setPaymentStatus({ type: 'success', message: 'Subscription payment initiated. Check your phone for M-Pesa prompt.' });

              // Pass payment tracking info to a payments page (or show inline). We navigate with state.
              navigate('/payments/subscribe', { state: { paymentId, checkoutRequestId, landlordEmail: landlordData.email } });
            } catch (payErr) {
              console.error('Subscription payment initiation failed:', payErr);
              const errorMessage = payErr.response?.data?.error || payErr.response?.data?.message || 'Failed to initiate subscription payment. Please try again.';
              setPaymentStatus({ type: 'error', message: errorMessage });
              // Allow the user to try again or login
            }
          }
        }
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
  // Add Unit with selected type
  const addUnit = (propertyId, selectedRoomType = 'studio', selectedRent = '', selectedDeposit = '') => {
    setLandlordData(prev => ({
      ...prev,
      properties: prev.properties.map(property => {
        if (property.id === propertyId) {
          const unitNumber = singleUnitSelection[propertyId]?.unitNumber || '';
          return {
            ...property,
            units: [...property.units, {
              id: Date.now(),
              unitNumber,
              roomType: selectedRoomType,
              monthlyRent: selectedRent,
              depositAmount: selectedDeposit
            }]
          };
        }
        return property;
      })
    }));
  };

  const addBulkUnits = (propertyId, bulkData) => {
    const { count, roomType, rentAmount, depositAmount, startNumber } = bulkData;
    
    // Validation: Ensure room type is provided
    if (!roomType || roomType.trim() === '') {
      setError('Room type is required for bulk units');
      return;
    }
    
    console.log('🏠 Adding bulk units:', { count, roomType, rentAmount, depositAmount, startNumber });
    
    const newUnits = [];
    
    for (let i = 0; i < parseInt(count); i++) {
      newUnits.push({
        id: Date.now() + i,
        unitNumber: startNumber ? `${startNumber}${i + 1}` : `Unit ${i + 1}`,
        roomType: roomType, // Ensure this is the actual selected value
        monthlyRent: rentAmount,
        depositAmount: depositAmount || rentAmount // Default to rent amount if not specified
      });
    }
    
    console.log('✅ Created units:', newUnits);

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
    
    // Smart navigation: If coming from Account Security (step 6) and user already lives in property,
    // skip Deposit Payment (step 5) and go back to Document Upload (step 4)
    if (currentStep === 6 && tenantData.alreadyLivingInProperty) {
      setCurrentStep(4);
    } else {
      setCurrentStep(prev => prev - 1);
    }
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
            <label className="block text-sm font-medium mb-1">National ID *</label>
            <input
              type="text"
              value={tenantData.governmentId}
              onChange={(e) => setTenantData(prev => ({ ...prev, governmentId: e.target.value }))}
              className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="12345678 or AB1234567"
              required
            />
            <p className="text-xs text-gray-500 mt-1">Must be 7-10 characters</p>
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
          onClick={handleTenantNextSafe}
          disabled={!isTenantStep2Valid() || navBusy}
          className={`flex-1 px-4 py-3 rounded-lg font-medium ${(!isTenantStep2Valid() || navBusy) ? 'bg-blue-300 text-white cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
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
                  selectedRoomId: null,
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
                    tenantData.selectedRoom === room.unit_code
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
                  {tenantData.selectedRoom === room.unit_code && (
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

        {tenantData.selectedProperty && availableRooms.length === 0 && (
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-6 text-center">
            <AlertCircle className="w-12 h-12 mx-auto mb-3 text-orange-500" />
            <h3 className="font-semibold text-orange-900 mb-2">No Available Units</h3>
            <p className="text-sm text-orange-700">
              All units in this property are currently occupied. Please select a different property or contact the landlord for more information.
            </p>
          </div>
        )}

        {tenantData.selectedRoom && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center">
              <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
              <p className="text-green-700">
                Selected: Unit {availableRooms.find(r => r.unit_code === tenantData.selectedRoom)?.unit_number}
                - KES {tenantData.monthlyRent}/month
              </p>
            </div>
          </div>
        )}

        {tenantData.selectedRoom && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <label className="flex items-start cursor-pointer">
              <input
                type="checkbox"
                checked={tenantData.alreadyLivingInProperty}
                onChange={(e) => setTenantData(prev => ({
                  ...prev,
                  alreadyLivingInProperty: e.target.checked,
                  requiresDeposit: !e.target.checked
                }))}
                className="mt-1 mr-3 h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <div>
                <p className="font-medium text-blue-900">I am already living in this property</p>
                <p className="text-sm text-blue-700 mt-1">
                  Check this box if you're already a resident and don't need to pay a deposit. 
                  Your application will be sent to the landlord for approval.
                </p>
              </div>
            </label>
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
          onClick={handleTenantNextSafe}
          disabled={!isTenantStep3Valid() || navBusy}
          className={`flex-1 px-4 py-3 rounded-lg font-medium ${
            isTenantStep3Valid() && !navBusy
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
      <h2 className="text-2xl font-bold mb-2">Document Upload <span className="text-sm font-normal text-gray-500">(Optional)</span></h2>
      <p className="text-gray-600 mb-6">You can upload your government ID now or skip and upload it later from your profile.</p>
      
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start">
          <AlertCircle className="w-5 h-5 text-red-500 mr-2 flex-shrink-0" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {tenantData.alreadyLivingInProperty && (
        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start">
          <Info className="w-5 h-5 text-yellow-500 mr-2 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-yellow-900">Application Pending Approval</p>
            <p className="text-sm text-yellow-700 mt-1">
              Since you're already living in this property, you won't need to pay a deposit. 
              Your application will be submitted to the landlord for approval after you create your password.
            </p>
          </div>
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
                onClick={handleRemoveIdDocument}
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
              <div className="mt-4 flex items-start">
                <input
                  id="ackSkipId"
                  type="checkbox"
                  checked={idUploadAcknowledged}
                  onChange={(e) => setIdUploadAcknowledged(e.target.checked)}
                  className="mt-1 mr-3 h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="ackSkipId" className="text-sm text-gray-700">
                  I will upload my ID later from my profile.
                </label>
              </div>
            </div>
          )}
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start">
            <Info className="w-5 h-5 text-blue-500 mr-2 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-blue-700 text-sm">Your document will be securely stored and used for verification purposes only.</p>
              <p className="text-blue-700 text-xs mt-1">This step is optional. You can proceed without uploading and add it later.</p>
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
          onClick={handleTenantNextSafe}
          disabled={!isTenantStep4Valid() || navBusy}
          className={`flex-1 px-4 py-3 rounded-lg font-medium ${(!isTenantStep4Valid() || navBusy) ? 'bg-blue-300 text-white cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
        >
          {tenantData.alreadyLivingInProperty 
            ? 'Continue to Account Setup' 
            : 'Continue to Deposit Payment'}
        </button>
      </div>
    </div>
  );

  const renderTenantStep5 = () => {
    // If deposit payment was already completed, show confirmation instead of payment form
    if (tenantData.depositPaymentCompleted) {
      return (
        <div>
          <h2 className="text-2xl font-bold mb-2">Deposit Payment</h2>
          <p className="text-gray-600 mb-6">Your deposit payment has been processed</p>
          
          <div className="bg-green-50 border-2 border-green-200 rounded-lg p-6 mb-6">
            <div className="flex items-start mb-4">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mr-4">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-green-900 mb-2">Payment Initiated Successfully!</h3>
                <p className="text-green-700 text-sm mb-3">
                  Your deposit payment has been initiated and is being processed. You will receive a confirmation once the payment is verified.
                </p>
              </div>
            </div>
            
            <div className="bg-white rounded-lg p-4 space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-gray-600 text-sm">Amount Paid:</span>
                <span className="font-bold text-green-700">KES {tenantData.depositAmount}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600 text-sm">Status:</span>
                <span className="px-3 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded-full">
                  Processing
                </span>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-start">
              <Info className="w-5 h-5 text-blue-500 mr-2 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-blue-700 text-sm font-medium mb-2">Next Steps:</p>
                <ul className="text-blue-700 text-sm space-y-1 list-disc list-inside">
                  <li>Complete your account setup in the next step</li>
                  <li>Your payment will be verified within a few minutes</li>
                  <li>You'll receive an email confirmation once verified</li>
                  <li>Your landlord will also be notified of your registration</li>
                </ul>
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
              className="flex-1 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
            >
              Continue to Account Setup
            </button>
          </div>
        </div>
      );
    }

    // Normal payment form if deposit not yet paid
    return (
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

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start">
              <CreditCard className="w-5 h-5 text-blue-500 mr-2 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-blue-700 text-sm">
                  Click "Pay Now" to be redirected to PesaPal payment gateway. You can pay using M-Pesa, cards, or other available payment methods.
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
            disabled={isLoading}
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
  };

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
          onClick={handleTenantNextSafe}
          disabled={!isTenantStep6Valid() || isLoading || navBusy}
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

  const renderLandlordUnitTypes = () => (
    <div>
      <h2 className="text-2xl font-bold mb-2">Unit Types</h2>
      <p className="text-gray-600 mb-6">Define the types of units you have across all your properties</p>
      
      <div className="space-y-6">
        {landlordData.unitTypes.map((unitType, index) => (
          <div key={unitType.id} className="p-4 border rounded-lg bg-white">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-medium">Unit Type {index + 1}</h3>
              {index > 0 && (
                <button
                  onClick={() => removeUnitType(unitType.id)}
                  className="text-red-600 hover:text-red-800"
                >
                  <X size={20} />
                </button>
              )}
            </div>

            <div className="grid gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Type Name *</label>
                <input
                  type="text"
                  value={unitType.name}
                  onChange={(e) => updateUnitTypeField(unitType.id, 'name', e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg"
                  placeholder="e.g., Studio, 1 Bedroom, 2 Bedroom"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Monthly Rent (KES) *</label>
                  <input
                    type="number"
                    value={unitType.rent}
                    onChange={(e) => updateUnitTypeField(unitType.id, 'rent', e.target.value)}
                    className="w-full px-4 py-2 border rounded-lg"
                    placeholder="15000"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Deposit (KES) *</label>
                  <input
                    type="number"
                    value={unitType.deposit}
                    onChange={(e) => updateUnitTypeField(unitType.id, 'deposit', e.target.value)}
                    className="w-full px-4 py-2 border rounded-lg"
                    placeholder="15000"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea
                  value={unitType.description}
                  onChange={(e) => updateUnitTypeField(unitType.id, 'description', e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg"
                  placeholder="Describe the features of this unit type"
                  rows={3}
                />
              </div>
            </div>
          </div>
        ))}

        <button
          onClick={addUnitType}
          className="w-full py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-gray-400 hover:text-gray-700"
        >
          + Add Another Unit Type
        </button>
      </div>

      <div className="flex gap-3 mt-6">
        <button
          onClick={() => setCurrentStep(2)}
          className="flex-1 px-4 py-3 bg-gray-200 hover:bg-gray-300 rounded-lg font-medium"
        >
          Back
        </button>
        <button
          onClick={handleLandlordNextSafe}
          disabled={!isLandlordStep2Valid() || navBusy}
          className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50"
        >
          Continue to Properties
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
      <p className="text-gray-600 mb-6">Add your properties and units below. You can add multiple properties and units in bulk or individually.</p>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start">
          <AlertCircle className="w-5 h-5 text-red-500 mr-2 flex-shrink-0" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      <div className="space-y-8">
        {landlordData.properties.map((property, propertyIndex) => {
          // Inline validation for property fields
          const propertyNameError = !property.propertyName ? "Property name required" : "";
          const propertyAddressError = !property.propertyAddress ? "Property address required" : "";
          return (
            <div key={property.id} className="border rounded-lg p-4 shadow-sm">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-lg">Property {propertyIndex + 1}</h3>
                {landlordData.properties.length > 1 && (
                  <button
                    onClick={() => removeProperty(property.id)}
                    className="text-red-500 hover:text-red-700 px-2 py-1 rounded border border-red-200 bg-red-50"
                  >
                    <X size={18} /> Remove
                  </button>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4 mb-2">
                <div>
                  <label className="block text-sm font-medium mb-1">Property Name *</label>
                  <input
                    type="text"
                    value={property.propertyName}
                    onChange={(e) => updatePropertyField(property.id, 'propertyName', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none ${propertyNameError ? 'border-red-400' : ''}`}
                    placeholder="e.g., Greenview Apartments"
                    required
                  />
                  {propertyNameError && <span className="text-xs text-red-500">{propertyNameError}</span>}
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Property Address *</label>
                  <input
                    type="text"
                    value={property.propertyAddress}
                    onChange={(e) => updatePropertyField(property.id, 'propertyAddress', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none ${propertyAddressError ? 'border-red-400' : ''}`}
                    placeholder="e.g., 123 Main Street, Nairobi"
                    required
                  />
                  {propertyAddressError && <span className="text-xs text-red-500">{propertyAddressError}</span>}
                </div>
              </div>

              <div className="mb-4">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="font-medium">Units <span className="text-xs text-gray-500">({property.units.length})</span></h4>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setBulkUnitMode(prev => ({ ...prev, [property.id]: {} }))}
                      className="px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded text-sm border border-gray-300"
                    >
                      Bulk Add Units
                    </button>
                    <button
                      onClick={() => {
                        const selectedType = singleUnitSelection[property.id]?.roomType || 'studio';
                        const selectedRent = singleUnitSelection[property.id]?.rentAmount || '';
                        const selectedDeposit = singleUnitSelection[property.id]?.depositAmount || '';
                        addUnit(property.id, selectedType, selectedRent, selectedDeposit);
                      }}
                      className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm border border-blue-700"
                    >
                      + Add Unit
                    </button>
                  </div>
                </div>

                {/* Single Unit Type Selection */}
                <div className="bg-blue-50 p-3 rounded-lg mb-4 border border-blue-200">
                  <h5 className="font-medium mb-2 text-sm">Quick Add Unit Settings</h5>
                  <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className="block text-xs font-medium mb-1">Unit Number *</label>
                        <input
                          type="text"
                          className="w-full px-3 py-2 border rounded text-sm"
                          placeholder="e.g., 101, A1"
                          value={singleUnitSelection[property.id]?.unitNumber || ''}
                          onChange={(e) => setSingleUnitSelection(prev => ({
                            ...prev,
                            [property.id]: { ...prev[property.id], unitNumber: e.target.value }
                          }))}
                        />
                      </div>
                    <div>
                      <label className="block text-xs font-medium mb-1">Room Type *</label>
                      <select
                        className="w-full px-3 py-2 border rounded text-sm"
                        value={singleUnitSelection[property.id]?.roomType || 'studio'}
                        onChange={(e) => setSingleUnitSelection(prev => ({
                          ...prev,
                          [property.id]: { ...prev[property.id], roomType: e.target.value }
                        }))}
                      >
                        <option value="studio">Studio</option>
                        <option value="1-bedroom">1 Bedroom</option>
                        <option value="2-bedroom">2 Bedroom</option>
                        <option value="3-bedroom">3 Bedroom</option>
                        <option value="4-bedroom">4 Bedroom</option>
                        <option value="5-bedroom">5 Bedroom</option>
                        <option value="6-bedroom">6 Bedroom</option>
                        <option value="7-bedroom">7 Bedroom</option>
                        <option value="8-bedroom">8 Bedroom</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium mb-1">Monthly Rent (KES)</label>
                      <input
                        type="number"
                        min="0"
                        className="w-full px-3 py-2 border rounded text-sm"
                        placeholder="e.g., 15000"
                        value={singleUnitSelection[property.id]?.rentAmount || ''}
                        onChange={(e) => setSingleUnitSelection(prev => ({
                          ...prev,
                          [property.id]: { ...prev[property.id], rentAmount: e.target.value }
                        }))}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium mb-1">Deposit (KES)</label>
                      <input
                        type="number"
                        min="0"
                        className="w-full px-3 py-2 border rounded text-sm"
                        placeholder="e.g., 15000"
                        value={singleUnitSelection[property.id]?.depositAmount || ''}
                        onChange={(e) => setSingleUnitSelection(prev => ({
                          ...prev,
                          [property.id]: { ...prev[property.id], depositAmount: e.target.value }
                        }))}
                      />
                    </div>
                  </div>
                  <p className="text-xs text-blue-600 mt-2">These settings will be used when you click "+ Add Unit"</p>
                </div>

                {bulkUnitMode[property.id] && (
                  <div className="bg-gray-50 p-4 rounded-lg mb-4 border border-blue-100">
                    <h5 className="font-medium mb-2">Bulk Add Units</h5>
                    <div className="grid grid-cols-2 gap-4 mb-3">
                      <div>
                        <label className="block text-xs font-medium mb-1">Number of Units *</label>
                        <input
                          type="number"
                          min="1"
                          max="100"
                          className="w-full px-3 py-2 border rounded text-sm"
                          placeholder="e.g., 10"
                          value={bulkUnitMode[property.id]?.count || ''}
                          onChange={(e) => setBulkUnitMode(prev => ({
                            ...prev,
                            [property.id]: { ...prev[property.id], count: e.target.value }
                          }))}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium mb-1">Room Type *</label>
                        <select
                          className="w-full px-3 py-2 border rounded text-sm"
                          value={bulkUnitMode[property.id]?.roomType || ''}
                          onChange={(e) => setBulkUnitMode(prev => ({
                            ...prev,
                            [property.id]: { ...prev[property.id], roomType: e.target.value }
                          }))}
                        >
                          <option value="">Select type</option>
                          <option value="studio">Studio</option>
                          <option value="1-bedroom">1 Bedroom</option>
                          <option value="2-bedroom">2 Bedroom</option>
                          <option value="3-bedroom">3 Bedroom</option>
                          <option value="4-bedroom">4 Bedroom</option>
                          <option value="5-bedroom">5 Bedroom</option>
                          <option value="6-bedroom">6 Bedroom</option>
                          <option value="7-bedroom">7 Bedroom</option>
                          <option value="8-bedroom">8 Bedroom</option>
                          <option value="custom">Custom Room Type</option>
                        </select>
                        {bulkUnitMode[property.id]?.roomType === 'custom' && (
                          <input
                            type="text"
                            className="w-full px-3 py-2 border rounded text-sm mt-2"
                            placeholder="Enter custom room type"
                            value={bulkUnitMode[property.id]?.customRoomType || ''}
                            onChange={(e) => setBulkUnitMode(prev => ({
                              ...prev,
                              [property.id]: { ...prev[property.id], customRoomType: e.target.value, roomType: `custom-${e.target.value}` }
                            }))}
                          />
                        )}
                      </div>
                      <div>
                        <label className="block text-xs font-medium mb-1">Monthly Rent (KES) *</label>
                        <input
                          type="number"
                          min="0"
                          className="w-full px-3 py-2 border rounded text-sm"
                          placeholder="e.g., 15000"
                          value={bulkUnitMode[property.id]?.rentAmount || ''}
                          onChange={(e) => setBulkUnitMode(prev => ({
                            ...prev,
                            [property.id]: { ...prev[property.id], rentAmount: e.target.value }
                          }))}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium mb-1">Deposit Amount (KES)</label>
                        <input
                          type="number"
                          min="0"
                          className="w-full px-3 py-2 border rounded text-sm"
                          placeholder="e.g., 15000"
                          value={bulkUnitMode[property.id]?.depositAmount || ''}
                          onChange={(e) => setBulkUnitMode(prev => ({
                            ...prev,
                            [property.id]: { ...prev[property.id], depositAmount: e.target.value }
                          }))}
                        />
                        <p className="text-xs text-gray-500 mt-1">Leave empty to use rent amount</p>
                      </div>
                      <div>
                        <label className="block text-xs font-medium mb-1">Start Number (Optional)</label>
                        <input
                          type="text"
                          className="w-full px-3 py-2 border rounded text-sm"
                          placeholder="e.g., A"
                          value={bulkUnitMode[property.id]?.startNumber || ''}
                          onChange={(e) => setBulkUnitMode(prev => ({
                            ...prev,
                            [property.id]: { ...prev[property.id], startNumber: e.target.value }
                          }))}
                        />
                      </div>
                    </div>
                    <div className="flex gap-2 mt-2">
                      <button
                        onClick={() => addBulkUnits(property.id, bulkUnitMode[property.id])}
                        className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 text-sm"
                        disabled={
                          !bulkUnitMode[property.id]?.count ||
                          !bulkUnitMode[property.id]?.roomType ||
                          !bulkUnitMode[property.id]?.rentAmount
                        }
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
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {property.units.map((unit, unitIndex) => {
                      // Inline validation for unit fields
                      const unitNumberError = !unit.unitNumber ? "Unit number required" : "";
                      const unitRentError = !unit.monthlyRent ? "Rent required" : "";
                      return (
                        <div key={unit.id} className="flex flex-col justify-between border rounded-lg p-3 bg-gray-50 shadow-sm min-w-0" style={{ wordBreak: 'break-word' }}>
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-bold text-blue-700 text-sm">Unit {unit.unitNumber || unitIndex + 1}</span>
                            <span className="text-xs text-gray-500">{unit.roomType}</span>
                          </div>
                          <div className="space-y-1">
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-gray-600">Rent:</span>
                              <span className="font-bold text-green-700 text-sm">KES {unit.monthlyRent}</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-gray-600">Deposit:</span>
                              <span className="font-bold text-blue-700 text-sm">KES {unit.depositAmount || unit.monthlyRent}</span>
                            </div>
                          </div>
                          <div className="flex gap-2 mt-2">
                            <button
                              onClick={() => removeUnit(property.id, unit.id)}
                              className="text-red-500 hover:text-red-700 p-1 text-xs border border-red-200 rounded"
                            >
                              <X size={14} /> Remove
                            </button>
                          </div>
                          {unitNumberError && <span className="text-xs text-red-500 mt-1">{unitNumberError}</span>}
                          {unitRentError && <span className="text-xs text-red-500 mt-1">{unitRentError}</span>}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm">No units added yet</p>
                )}
              </div>
            </div>
          );
        })}

        <button
          onClick={addProperty}
          className="w-full py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-gray-400 hover:text-gray-700 mt-2"
        >
          + Add Another Property
        </button>
      </div>

      <div className="mt-8">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
          <div className="flex items-start">
            <Info className="w-5 h-5 text-blue-500 mr-2 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-blue-700 text-sm">
                Total Units: <strong>{calculateTotalUnits()}</strong> | 
                Monthly Subscription: <strong>{formatFeeDisplay()}</strong>
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
            onClick={handleLandlordNextSafe}
            disabled={!isLandlordStep3Valid() || navBusy}
            className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50"
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
        {/* Free Trial Banner */}
        <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg p-6 text-white text-center shadow-lg">
          <div className="flex items-center justify-center mb-3">
            <CheckCircle className="w-8 h-8 mr-2" />
            <h3 className="text-2xl font-bold">🎉 1 Month FREE Trial!</h3>
          </div>
          <p className="text-green-50 text-sm mb-2">
            Start managing your properties today with no upfront payment
          </p>
          <p className="text-xs text-green-100">
            No credit card required • Cancel anytime • Full access to all features
          </p>
        </div>

        <div className="bg-gray-50 rounded-lg p-4 border-2 border-blue-500">
          <div className="flex justify-between items-center mb-2">
            <span className="text-gray-600">Total Units:</span>
            <span className="font-bold text-lg">{calculateTotalUnits()}</span>
          </div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-gray-600">Your Plan:</span>
            <span className="font-bold text-blue-600">
              {pricingTiers.find(tier => calculateTotalUnits() >= tier.min && calculateTotalUnits() <= tier.max)?.label || 'Custom'}
            </span>
          </div>
          <div className="flex justify-between items-center pt-2 border-t border-gray-300">
            <span className="text-gray-600">Monthly Subscription (after trial):</span>
            <span className="font-bold text-lg text-blue-600">{formatFeeDisplay()}</span>
          </div>
          {calculateMonthlyFee() !== 'custom' && (
            <div className="mt-3 p-2 bg-green-100 rounded text-center">
              <p className="text-sm font-semibold text-green-700">
                First month: <span className="line-through text-gray-500">KES {calculateMonthlyFee()}</span> <span className="text-xl">FREE</span>
              </p>
            </div>
          )}
          {calculateMonthlyFee() === 'custom' && (
            <div className="mt-3 p-3 bg-amber-50 border border-amber-300 rounded text-center">
              <p className="text-sm font-semibold text-amber-800 mb-1">
                📞 Custom Enterprise Pricing
              </p>
              <p className="text-xs text-amber-700">
                Please contact us at <a href="tel:+254722714334" className="underline font-bold">+254722714334</a> for a personalized quote
              </p>
            </div>
          )}
        </div>

        <div className="space-y-3">
          <h4 className="font-semibold text-gray-700">Available Plans:</h4>
          {pricingTiers.map((tier, index) => (
            <div
              key={index}
              className={`p-4 border-2 rounded-lg transition-all ${
                calculateTotalUnits() >= tier.min && calculateTotalUnits() <= tier.max
                  ? 'border-blue-500 bg-blue-50 shadow-md'
                  : 'border-gray-200 bg-white'
              }`}
            >
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="font-medium text-lg">{tier.label}</h3>
                  {tier.isCustom && (
                    <p className="text-sm text-amber-600 font-semibold mt-1">
                      Contact: +254722714334
                    </p>
                  )}
                  {calculateTotalUnits() >= tier.min && calculateTotalUnits() <= tier.max && (
                    <span className="inline-block mt-1 px-2 py-1 bg-blue-600 text-white text-xs rounded-full">
                      Your Current Plan
                    </span>
                  )}
                </div>
                <div className="text-right">
                  {tier.isCustom ? (
                    <div>
                      <p className="font-bold text-xl text-amber-600">Custom Pricing</p>
                      <p className="text-xs text-gray-500">Call for quote</p>
                    </div>
                  ) : (
                    <>
                      <p className="font-bold text-xl">KES {tier.price}<span className="text-sm text-gray-500">/month</span></p>
                      <p className="text-xs text-gray-500">After free trial</p>
                    </>
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
              <p className="text-blue-700 text-sm font-semibold mb-2">
                ✓ Start your FREE 30-day trial now
              </p>
              <ul className="text-blue-700 text-sm space-y-1">
                <li>• No payment required today</li>
                <li>• Access all features immediately</li>
                <li>• Cancel anytime during trial</li>
                <li>• After trial, subscription auto-renews monthly</li>
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
          onClick={handleLandlordNextSafe}
          disabled={isLoading}
          className="flex-1 px-4 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 disabled:opacity-50 font-bold text-lg shadow-lg flex items-center justify-center"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
              Creating Account...
            </>
          ) : (
            <>
              <CheckCircle className="w-5 h-5 mr-2" />
              {calculateMonthlyFee() === 'custom' ? 'Complete Registration' : 'Start Free Trial'}
            </>
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
              <h1 className="text-2xl font-bold">Nyumbani Rentals</h1>
            </div>
            <p className="opacity-90">Streamlined Rental Management</p>
          </div>

          {/* Auth Tabs */}
          <div className="p-6">
            <div className="flex bg-gray-100 rounded-lg p-1 mb-6">
              <button
                onClick={() => handleAuthModeChange('login')}
                className={`flex-1 py-2 rounded-md font-medium transition-colors ${
                  authMode === 'login'
                    ? 'bg-white shadow-sm text-blue-600'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                Login
              </button>
              <button
                onClick={() => handleAuthModeChange('signup')}
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
                onClick={() => handleSwitchUserType('tenant')}
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
                onClick={() => handleSwitchUserType('landlord')}
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
              <>
                {!showForgotPassword ? (
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
                    <div className="mt-4 text-center">
                      <button
                        type="button"
                        className="text-blue-600 hover:underline text-sm font-medium"
                        onClick={() => setShowForgotPassword(true)}
                      >
                        Forgot Password?
                      </button>
                    </div>
                  </form>
                ) : (
                  <form onSubmit={handleForgotPassword} className="space-y-4">
                    <h2 className="text-xl font-bold mb-2 text-center">Reset Your Password</h2>
                    <p className="text-gray-600 mb-4 text-center">Enter your email address and we'll send you a link to reset your password.</p>
                    <input
                      type="email"
                      value={forgotEmail}
                      onChange={e => setForgotEmail(e.target.value)}
                      className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                      placeholder="your.email@example.com"
                      required
                    />
                    {forgotError && (
                      <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{forgotError}</div>
                    )}
                    {forgotSuccess && (
                      <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">{forgotSuccess}</div>
                    )}
                    <button
                      type="submit"
                      disabled={forgotLoading}
                      className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium flex items-center justify-center"
                    >
                      {forgotLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin mr-2" />
                          Sending...
                        </>
                      ) : (
                        'Send Reset Link'
                      )}
                    </button>
                    <div className="mt-2 text-center">
                      <button
                        type="button"
                        className="text-gray-600 hover:underline text-sm font-medium"
                        onClick={() => handleAuthModeChange('login')}
                      >
                        Back to Login
                      </button>
                    </div>
                  </form>
                )}
              </>
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