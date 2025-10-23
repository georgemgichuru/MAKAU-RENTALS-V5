import { useState } from "react";
import { 
  FaUpload, 
  FaFilePdf, 
  FaCheckCircle, 
  FaMobileAlt,
  FaCreditCard,
  FaSpinner,
  FaInfoCircle,
  FaTimes,
  FaExclamationTriangle,
  FaFileImage,
  FaTrashAlt,
  FaEye,
  FaEyeSlash
} from "react-icons/fa";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

const TenantSignUpForm = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    governmentId: "",
    email: "",
    name: "",
    phoneNumber: "",
    emergencyContact: "",
    password: "",
    confirmPassword: "",
  });
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [paymentData, setPaymentData] = useState({
    amount: "",
    phoneNumber: "",
    roomType: "",
    duration: "1" // months
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState(null);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});

  // Room types and pricing
  const roomTypes = [
    { id: "studio", name: "Studio", price: 20000, deposit: 40000 },
    { id: "1br", name: "1 Bedroom", price: 25000, deposit: 50000 },
    { id: "2br", name: "2 Bedroom", price: 35000, deposit: 70000 }
  ];

  // Validation functions
  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validateKenyanPhone = (phone) => {
    // Remove spaces and special characters for validation
    const cleanPhone = phone.replace(/[\s\-\(\)]/g, '');
    
    // Kenyan phone number patterns
    const patterns = [
      /^(\+254|254)?[17]\d{8}$/, // Safaricom: +254712345678, +254722345678
      /^(\+254|254)?[17]\d{8}$/, // Airtel: +254732345678, +254782345678
      /^(\+254|254)?[17]\d{8}$/, // Telkom: +254772345678
    ];
    
    return patterns.some(pattern => pattern.test(cleanPhone));
  };

  const validateKenyanID = (id) => {
    // Kenyan National ID: 8 digits
    // Kenyan Passport: 2 letters followed by 7 digits
    const nationalIdPattern = /^\d{8}$/;
    const passportPattern = /^[A-Z]{2}\d{7}$/;
    
    return nationalIdPattern.test(id) || passportPattern.test(id.toUpperCase());
  };

  const validatePassword = (password) => {
    const minLength = password.length >= 8;
    const hasUppercase = /[A-Z]/.test(password);
    const hasLowercase = /[a-z]/.test(password);
    const hasNumber = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    
    return {
      isValid: minLength && hasUppercase && hasLowercase && hasNumber,
      requirements: {
        minLength,
        hasUppercase,
        hasLowercase,
        hasNumber,
        hasSpecialChar
      }
    };
  };

  const validateField = (name, value) => {
    let error = "";
    
    switch (name) {
      case "name":
        if (!value.trim()) error = "Full name is required";
        else if (value.trim().length < 2) error = "Name must be at least 2 characters";
        break;
        
      case "email":
        if (!value) error = "Email is required";
        else if (!validateEmail(value)) error = "Please enter a valid email address";
        break;
        
      case "phoneNumber":
      case "emergencyContact":
        if (!value) error = `${name === 'phoneNumber' ? 'Phone number' : 'Emergency contact'} is required`;
        else if (!validateKenyanPhone(value)) error = "Please enter a valid Kenyan phone number (e.g., +254712345678)";
        break;
        
      case "governmentId":
        if (!value) error = "Government ID is required";
        else if (!validateKenyanID(value)) error = "Please enter a valid Kenyan National ID (8 digits) or Passport (2 letters + 7 digits)";
        break;
        
      case "password":
        if (!value) error = "Password is required";
        else {
          const validation = validatePassword(value);
          if (!validation.isValid) error = "Password must meet all requirements";
        }
        break;
        
      case "confirmPassword":
        if (!value) error = "Please confirm your password";
        else if (value !== formData.password) error = "Passwords do not match";
        break;
        
      default:
        break;
    }
    
    return error;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    // Clear previous validation error
    if (validationErrors[name]) {
      setValidationErrors(prev => ({
        ...prev,
        [name]: ""
      }));
    }
    
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleInputBlur = (e) => {
    const { name, value } = e.target;
    const error = validateField(name, value);
    
    setValidationErrors(prev => ({
      ...prev,
      [name]: error
    }));
  };

  const handlePaymentChange = (e) => {
    const { name, value } = e.target;
    setPaymentData(prev => ({ ...prev, [name]: value }));
    
    // Auto-fill phone number from registration form
    if (name === 'phoneNumber' && !value && formData.phoneNumber) {
      setPaymentData(prev => ({ ...prev, phoneNumber: formData.phoneNumber }));
    }
  };

  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files);
    const maxFileSize = 5 * 1024 * 1024; // 5MB
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
    
    const validFiles = [];
    const errors = [];
    
    files.forEach(file => {
      if (!allowedTypes.includes(file.type)) {
        errors.push(`${file.name}: Only PDF, JPEG, JPG, and PNG files are allowed`);
        return;
      }
      
      if (file.size > maxFileSize) {
        errors.push(`${file.name}: File size must be less than 5MB`);
        return;
      }
      
      // Check for duplicates
      const isDuplicate = uploadedFiles.some(existingFile => 
        existingFile.name === file.name && existingFile.size === file.size
      );
      
      if (isDuplicate) {
        errors.push(`${file.name}: File already uploaded`);
        return;
      }
      
      validFiles.push({
        file,
        id: Date.now() + Math.random(),
        name: file.name,
        size: file.size,
        type: file.type
      });
    });
    
    if (errors.length > 0) {
      errors.forEach(error => toast.error(error));
    }
    
    if (validFiles.length > 0) {
      setUploadedFiles(prev => [...prev, ...validFiles]);
      toast.success(`${validFiles.length} file(s) uploaded successfully`);
    }
    
    // Reset input
    e.target.value = '';
  };

  const removeFile = (fileId) => {
    setUploadedFiles(prev => prev.filter(file => file.id !== fileId));
    toast.success("File removed");
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (fileType) => {
    if (fileType === 'application/pdf') return <FaFilePdf className="text-red-500" />;
    if (fileType.startsWith('image/')) return <FaFileImage className="text-blue-500" />;
    return <FaUpload className="text-gray-500" />;
  };

  // Format phone number
  const formatPhoneNumber = (value) => {
    let cleaned = value.replace(/[^\d+]/g, '');
    if (cleaned.startsWith('0')) {
      cleaned = '+254' + cleaned.substring(1);
    } else if (cleaned.startsWith('254')) {
      cleaned = '+' + cleaned;
    } else if (!cleaned.startsWith('+254') && cleaned.length > 0 && !cleaned.startsWith('+')) {
      cleaned = '+254' + cleaned;
    }
    return cleaned;
  };

  // Calculate total payment amount
  const calculateTotalAmount = () => {
    const selectedRoom = roomTypes.find(room => room.id === paymentData.roomType);
    if (!selectedRoom) return 0;
    
    const monthlyRent = selectedRoom.price * parseInt(paymentData.duration);
    const deposit = selectedRoom.deposit;
    return monthlyRent + deposit;
  };

  // Simulate M-Pesa payment
  const initiatePayment = async () => {
    const totalAmount = calculateTotalAmount();
    const formattedPhone = formatPhoneNumber(paymentData.phoneNumber || formData.phoneNumber);
    
    // Simulate M-Pesa STK Push
    const mpesaPayload = {
      BusinessShortCode: "174379",
      Password: "YOUR_PASSWORD",
      Timestamp: new Date().toISOString().replace(/[^0-9]/g, '').slice(0, 14),
      TransactionType: "CustomerPayBillOnline",
      Amount: totalAmount,
      PartyA: formattedPhone,
      PartyB: "174379",
      PhoneNumber: formattedPhone,
      CallBackURL: "https://your-domain.com/api/mpesa/callback",
      AccountReference: `DEPOSIT-${paymentData.roomType.toUpperCase()}-${Date.now()}`,
      TransactionDesc: `Rental deposit and advance rent payment`
    };

    // Simulate API call
    return new Promise((resolve) => {
      setTimeout(() => {
        const isSuccess = Math.random() > 0.2; // 80% success rate
        resolve({
          success: isSuccess,
          message: isSuccess 
            ? "Payment request sent! Check your phone for M-Pesa prompt." 
            : "Payment failed. Please try again.",
          transactionId: isSuccess ? `MPX${Date.now()}` : null
        });
      }, 3000);
    });
  };

  const handlePayment = async (e) => {
    e.preventDefault();
    
    if (!paymentData.roomType) {
      toast.error("Please select a room type");
      return;
    }

    if (!paymentData.phoneNumber && !formData.phoneNumber) {
      toast.error("Please provide a phone number for payment");
      return;
    }

    // Validate payment phone number
    const phoneToUse = paymentData.phoneNumber || formData.phoneNumber;
    if (!validateKenyanPhone(phoneToUse)) {
      toast.error("Please provide a valid Kenyan phone number for payment");
      return;
    }

    setIsProcessingPayment(true);
    setPaymentStatus(null);

    try {
      const response = await initiatePayment();
      
      if (response.success) {
        setPaymentStatus({
          type: 'success',
          message: response.message,
          transactionId: response.transactionId
        });
        
        // Move to next step after successful payment
        setTimeout(() => {
          setCurrentStep(5);
        }, 2000);
        
      } else {
        setPaymentStatus({
          type: 'error',
          message: response.message
        });
      }
    } catch (error) {
      setPaymentStatus({
        type: 'error',
        message: 'Payment processing failed. Please try again.'
      });
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (uploadedFiles.length === 0) {
      toast.error("Please upload at least one document");
      return;
    }

    if (!paymentStatus || paymentStatus.type !== 'success') {
      toast.error("Payment must be completed before submitting application");
      return;
    }

    setIsSubmitting(true);

    // Prepare application data
    const applicationData = {
      ...formData,
      ...paymentData,
      uploadedFiles: uploadedFiles.map(f => ({ name: f.name, size: f.size, type: f.type })),
      paymentDetails: {
        transactionId: paymentStatus.transactionId,
        amount: calculateTotalAmount(),
        timestamp: new Date().toISOString()
      },
      applicationStatus: 'pending',
      submittedAt: new Date().toISOString()
    };

    // Simulate API submission
    await new Promise((resolve) => setTimeout(resolve, 2000));

    toast.success(
      "Application submitted successfully! Your payment has been processed. The landlord will review your application shortly."
    );
    
    setIsSubmitting(false);

    // Reset form
    setFormData({
      governmentId: "",
      email: "",
      name: "",
      phoneNumber: "",
      emergencyContact: "",
      password: "",
      confirmPassword: "",
    });
    setPaymentData({
      amount: "",
      phoneNumber: "",
      roomType: "",
      duration: "1"
    });
    setUploadedFiles([]);
    setPaymentStatus(null);
    setValidationErrors({});
    setCurrentStep(1);

    // Navigate to success page or login
    setTimeout(() => {
      navigate("/login");
    }, 3000);
  };

  const validateCurrentStep = () => {
    const errors = {};
    
    if (currentStep === 1) {
      // Validate personal information
      const fields = ['name', 'email', 'phoneNumber', 'governmentId', 'emergencyContact'];
      fields.forEach(field => {
        const error = validateField(field, formData[field]);
        if (error) errors[field] = error;
      });
    }
    
    if (currentStep === 2) {
      // Validate passwords
      const passwordError = validateField('password', formData.password);
      const confirmPasswordError = validateField('confirmPassword', formData.confirmPassword);
      if (passwordError) errors.password = passwordError;
      if (confirmPasswordError) errors.confirmPassword = confirmPasswordError;
    }

    if (currentStep === 3) {
      // Validate document upload
      if (uploadedFiles.length === 0) {
        errors.documents = "Please upload at least one document";
      }
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const nextStep = () => {
    if (!validateCurrentStep()) {
      toast.error("Please fix the validation errors before proceeding");
      return;
    }

    if (currentStep === 3) {
      // Auto-fill payment phone number
      if (!paymentData.phoneNumber) {
        setPaymentData(prev => ({ ...prev, phoneNumber: formData.phoneNumber }));
      }
    }

    setCurrentStep(currentStep + 1);
  };

  const prevStep = () => {
    setCurrentStep(currentStep - 1);
  };

  const StepIndicator = () => (
    <div className="flex items-center justify-center mb-8">
      {[1, 2, 3, 4, 5].map((step) => (
        <div key={step} className="flex items-center">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
            currentStep >= step 
              ? 'bg-blue-600 text-white' 
              : 'bg-gray-200 text-gray-600'
          }`}>
            {step}
          </div>
          {step < 5 && (
            <div className={`w-5 h-1 mx-2 sm:w-16  ${
              currentStep > step ? 'bg-blue-600' : 'bg-gray-200'
            }`} />
          )}
        </div>
      ))}
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4">
      <div className="max-w-2xl mx-auto py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            Tenant Registration
          </h1>
          <p className="text-gray-600 mt-2">
            Complete your application and secure your rental
          </p>
        </div>

        {/* Step Indicator */}
        <StepIndicator />

        {/* Card */}
        <div className="bg-white/80 backdrop-blur-sm border rounded-2xl shadow-xl p-6">
          
          {/* Step 1: Personal Information */}
          {currentStep === 1 && (
            <div>
              <h2 className="text-xl font-semibold mb-2">Personal Information</h2>
              <p className="text-gray-600 mb-6">
                Please provide your personal details
              </p>

              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Full Name *</label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      onBlur={handleInputBlur}
                      placeholder="Enter your full name"
                      className={`w-full rounded-lg border px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none ${
                        validationErrors.name ? 'border-red-500' : 'border-gray-300'
                      }`}
                      required
                    />
                    {validationErrors.name && (
                      <p className="text-red-500 text-xs mt-1">{validationErrors.name}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Government ID *</label>
                    <input
                      type="text"
                      name="governmentId"
                      value={formData.governmentId}
                      onChange={handleInputChange}
                      onBlur={handleInputBlur}
                      placeholder="12345678 or AB1234567"
                      className={`w-full rounded-lg border px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none ${
                        validationErrors.governmentId ? 'border-red-500' : 'border-gray-300'
                      }`}
                      required
                    />
                    {validationErrors.governmentId && (
                      <p className="text-red-500 text-xs mt-1">{validationErrors.governmentId}</p>
                    )}
                    <p className="text-xs text-gray-500 mt-1">
                      National ID (8 digits) or Passport (2 letters + 7 digits)
                    </p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Email Address *</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    onBlur={handleInputBlur}
                    placeholder="your.email@example.com"
                    className={`w-full rounded-lg border px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none ${
                      validationErrors.email ? 'border-red-500' : 'border-gray-300'
                    }`}
                    required
                  />
                  {validationErrors.email && (
                    <p className="text-red-500 text-xs mt-1">{validationErrors.email}</p>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Phone Number *</label>
                    <input
                      type="tel"
                      name="phoneNumber"
                      value={formData.phoneNumber}
                      onChange={handleInputChange}
                      onBlur={handleInputBlur}
                      placeholder="+254712345678"
                      className={`w-full rounded-lg border px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none ${
                        validationErrors.phoneNumber ? 'border-red-500' : 'border-gray-300'
                      }`}
                      required
                    />
                    {validationErrors.phoneNumber && (
                      <p className="text-red-500 text-xs mt-1">{validationErrors.phoneNumber}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Emergency Contact *</label>
                    <input
                      type="tel"
                      name="emergencyContact"
                      value={formData.emergencyContact}
                      onChange={handleInputChange}
                      onBlur={handleInputBlur}
                      placeholder="+254798765432"
                      className={`w-full rounded-lg border px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none ${
                        validationErrors.emergencyContact ? 'border-red-500' : 'border-gray-300'
                      }`}
                      required
                    />
                    {validationErrors.emergencyContact && (
                      <p className="text-red-500 text-xs mt-1">{validationErrors.emergencyContact}</p>
                    )}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={nextStep}
                  className="w-full rounded-lg px-4 py-3 font-medium text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                >
                  Continue to Account Security
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Account Security */}
          {currentStep === 2 && (
            <div>
              <h2 className="text-xl font-semibold mb-2">Account Security</h2>
              <p className="text-gray-600 mb-6">
                Create a secure password for your account
              </p>

              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Password *</label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        name="password"
                        value={formData.password}
                        onChange={handleInputChange}
                        onBlur={handleInputBlur}
                        placeholder="Create a strong password"
                        className={`w-full rounded-lg border px-3 py-2 pr-10 focus:ring-2 focus:ring-blue-500 outline-none ${
                          validationErrors.password ? 'border-red-500' : 'border-gray-300'
                        }`}
                        required
                      />
                      <button
                        type="button"
                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <FaEyeSlash className="text-gray-400" /> : <FaEye className="text-gray-400" />}
                      </button>
                    </div>
                    {validationErrors.password && (
                      <p className="text-red-500 text-xs mt-1">{validationErrors.password}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Confirm Password *</label>
                    <div className="relative">
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        name="confirmPassword"
                        value={formData.confirmPassword}
                        onChange={handleInputChange}
                        onBlur={handleInputBlur}
                        placeholder="Confirm your password"
                        className={`w-full rounded-lg border px-3 py-2 pr-10 focus:ring-2 focus:ring-blue-500 outline-none ${
                          validationErrors.confirmPassword ? 'border-red-500' : 'border-gray-300'
                        }`}
                        required
                      />
                      <button
                        type="button"
                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      >
                        {showConfirmPassword ? <FaEyeSlash className="text-gray-400" /> : <FaEye className="text-gray-400" />}
                      </button>
                    </div>
                    {validationErrors.confirmPassword && (
                      <p className="text-red-500 text-xs mt-1">{validationErrors.confirmPassword}</p>
                    )}
                  </div>
                </div>

                {/* Password Requirements */}
                {formData.password && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="text-sm font-medium mb-2">Password Requirements:</h4>
                    <div className="space-y-1 text-xs">
                      {Object.entries({
                        "At least 8 characters": formData.password.length >= 8,
                        "Contains uppercase letter": /[A-Z]/.test(formData.password),
                        "Contains lowercase letter": /[a-z]/.test(formData.password),
                        "Contains number": /\d/.test(formData.password),
                      }).map(([requirement, met]) => (
                        <div key={requirement} className={`flex items-center ${met ? 'text-green-600' : 'text-gray-500'}`}>
                          {met ? <FaCheckCircle className="mr-2" /> : <FaTimes className="mr-2" />}
                          {requirement}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={prevStep}
                    className="flex-1 rounded-lg px-4 py-3 font-medium text-gray-700 bg-gray-200 hover:bg-gray-300"
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={nextStep}
                    className="flex-1 rounded-lg px-4 py-3 font-medium text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                  >
                    Continue to Documents
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Document Upload */}
          {currentStep === 3 && (
            <div>
              <h2 className="text-xl font-semibold mb-2">Document Upload</h2>
              <p className="text-gray-600 mb-6">
                Upload your identification and supporting documents
              </p>

              <div className="space-y-4">
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <input
                    type="file"
                    accept=".pdf,.png,.jpg,.jpeg"
                    onChange={handleFileUpload}
                    className="hidden"
                    id="file-upload"
                    multiple
                  />
                  <label htmlFor="file-upload" className="cursor-pointer">
                    <div className="space-y-2">
                      <FaUpload className="h-12 w-12 text-gray-400 mx-auto" />
                      <p className="text-lg font-medium text-gray-900">Upload Documents</p>
                      <p className="text-gray-600">
                        Click to select files or drag and drop
                      </p>
                      <p className="text-sm text-gray-500">
                        Supported formats: PDF, JPEG, JPG, PNG (Max 5MB each)
                      </p>
                    </div>
                  </label>
                </div>

                {/* Uploaded Files */}
                {uploadedFiles.length > 0 && (
                  <div className="space-y-2">
                    <h3 className="font-medium text-gray-900">Uploaded Files ({uploadedFiles.length})</h3>
                    {uploadedFiles.map((file) => (
                      <div key={file.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          {getFileIcon(file.type)}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">{file.name}</p>
                            <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeFile(file.id)}
                          className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-full transition-colors"
                          title="Remove file"
                        >
                          <FaTrashAlt className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {validationErrors.documents && (
                  <p className="text-red-500 text-sm">{validationErrors.documents}</p>
                )}

                <div className="flex items-start space-x-2 rounded-lg border border-yellow-300 bg-yellow-50 p-3 text-sm text-yellow-800">
                  <FaInfoCircle className="mt-0.5 h-5 w-5 text-yellow-600" />
                  <div>
                    <p className="font-medium mb-1">Required Documents:</p>
                    <ul className="text-xs space-y-1">
                      <li>• Copy of Government ID (National ID or Passport)</li>
                      <li>• Any additional documents requested by landlord</li>
                      <li>• Accepted formats: PDF, JPEG, JPG, PNG</li>
                      <li>• Maximum file size: 5MB per file</li>
                    </ul>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={prevStep}
                    className="flex-1 rounded-lg px-4 py-3 font-medium text-gray-700 bg-gray-200 hover:bg-gray-300"
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={nextStep}
                    className="flex-1 rounded-lg px-4 py-3 font-medium text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                  >
                    Continue to Payment
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Payment */}
          {currentStep === 4 && (
            <div>
              <h2 className="text-xl font-semibold mb-2 flex items-center">
                <FaMobileAlt className="mr-2 text-green-600" />
                Secure Your Rental - M-Pesa Payment
              </h2>
              <p className="text-gray-600 mb-6">
                Pay your deposit and advance rent to secure your room
              </p>

              {/* Payment Status */}
              {paymentStatus && (
                <div className={`mb-4 p-4 rounded-lg border flex items-start ${
                  paymentStatus.type === 'success' 
                    ? 'bg-green-50 border-green-200 text-green-800' 
                    : 'bg-red-50 border-red-200 text-red-800'
                }`}>
                  {paymentStatus.type === 'success' ? (
                    <FaCheckCircle className="mr-2 mt-0.5 text-green-600" />
                  ) : (
                    <FaTimes className="mr-2 mt-0.5 text-red-600" />
                  )}
                  <div>
                    <p className="font-medium">{paymentStatus.message}</p>
                    {paymentStatus.transactionId && (
                      <p className="text-sm mt-1">Transaction ID: {paymentStatus.transactionId}</p>
                    )}
                  </div>
                </div>
              )}

              <form onSubmit={handlePayment} className="space-y-6">
                {/* Room Selection */}
                <div>
                  <label className="block text-sm font-medium mb-2">Select Room Type *</label>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {roomTypes.map((room) => (
                      <div 
                        key={room.id}
                        className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                          paymentData.roomType === room.id 
                            ? 'border-blue-500 bg-blue-50' 
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                        onClick={() => setPaymentData(prev => ({ ...prev, roomType: room.id }))}
                      >
                        <input
                          type="radio"
                          name="roomType"
                          value={room.id}
                          checked={paymentData.roomType === room.id}
                          onChange={handlePaymentChange}
                          className="hidden"
                        />
                        <h3 className="font-medium text-lg">{room.name}</h3>
                        <p className="text-sm text-gray-600 mb-2">Monthly: KSh {room.price.toLocaleString()}</p>
                        <p className="text-sm text-gray-600">Deposit: KSh {room.deposit.toLocaleString()}</p>
                        <div className="mt-2 pt-2 border-t">
                          <p className="font-semibold text-blue-600">
                            Total: KSh {(room.price + room.deposit).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Payment Amount Display */}
                {paymentData.roomType && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h3 className="font-semibold text-blue-900 mb-3">Payment Summary</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Monthly Rent ({paymentData.duration} month{paymentData.duration > 1 ? 's' : ''}):</span>
                        <span>KSh {(roomTypes.find(r => r.id === paymentData.roomType)?.price * parseInt(paymentData.duration) || 0).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Security Deposit:</span>
                        <span>KSh {(roomTypes.find(r => r.id === paymentData.roomType)?.deposit || 0).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between font-bold text-lg border-t border-blue-200 pt-2">
                        <span>Total Amount:</span>
                        <span>KSh {calculateTotalAmount().toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Phone Number */}
                <div>
                  <label className="block text-sm font-medium mb-1">M-Pesa Phone Number *</label>
                  <input
                    type="tel"
                    name="phoneNumber"
                    value={paymentData.phoneNumber}
                    onChange={handlePaymentChange}
                    placeholder="+254712345678"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-green-500 outline-none"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    This will be used for M-Pesa payment processing
                  </p>
                </div>

                {/* Info Alert */}
                <div className="flex items-start p-3 rounded-lg bg-blue-50 border border-blue-200 text-blue-700 text-sm">
                  <FaInfoCircle className="mr-2 mt-0.5 text-blue-600" />
                  <div>
                    <p className="font-medium mb-1">Payment Process:</p>
                    <ul className="text-xs space-y-1">
                      <li>• Click "Pay with M-Pesa" to initiate payment</li>
                      <li>• You'll receive an M-Pesa prompt on your phone</li>
                      <li>• Enter your M-Pesa PIN to complete payment</li>
                      <li>• Your application will be submitted after successful payment</li>
                    </ul>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={prevStep}
                    disabled={isProcessingPayment}
                    className="flex-1 rounded-lg px-4 py-3 font-medium text-gray-700 bg-gray-200 hover:bg-gray-300 disabled:opacity-50"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={isProcessingPayment || !paymentData.roomType}
                    className="flex-1 rounded-lg px-4 py-3 font-medium text-white bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 disabled:opacity-50"
                  >
                    {isProcessingPayment ? (
                      <>
                        <FaSpinner className="inline mr-2 animate-spin" />
                        Processing Payment...
                      </>
                    ) : (
                      <>
                        <FaCreditCard className="inline mr-2" />
                        Pay with M-Pesa
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Step 5: Final Submission */}
          {currentStep === 5 && (
            <div>
              <h2 className="text-xl font-semibold mb-2">Complete Application</h2>
              <p className="text-gray-600 mb-6">
                Review your information and submit your application
              </p>

              {/* Summary */}
              <div className="bg-gray-50 rounded-lg p-6 mb-6 space-y-4">
                <h3 className="font-semibold text-gray-900">Application Summary</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="font-medium">Name:</p>
                    <p className="text-gray-600">{formData.name}</p>
                  </div>
                  <div>
                    <p className="font-medium">Email:</p>
                    <p className="text-gray-600">{formData.email}</p>
                  </div>
                  <div>
                    <p className="font-medium">Phone:</p>
                    <p className="text-gray-600">{formData.phoneNumber}</p>
                  </div>
                  <div>
                    <p className="font-medium">Room Type:</p>
                    <p className="text-gray-600">{roomTypes.find(r => r.id === paymentData.roomType)?.name}</p>
                  </div>
                  <div>
                    <p className="font-medium">Payment Status:</p>
                    <p className="text-green-600 flex items-center">
                      <FaCheckCircle className="mr-1" /> Paid
                    </p>
                  </div>
                  <div>
                    <p className="font-medium">Documents:</p>
                    <p className="text-green-600 flex items-center">
                      <FaCheckCircle className="mr-1" /> {uploadedFiles.length} file(s) uploaded
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={prevStep}
                  disabled={isSubmitting}
                  className="flex-1 rounded-lg px-4 py-3 font-medium text-gray-700 bg-gray-200 hover:bg-gray-300 disabled:opacity-50"
                >
                  Back
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="flex-1 rounded-lg px-4 py-3 font-medium text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:opacity-70"
                >
                  {isSubmitting ? (
                    <>
                      <FaSpinner className="inline mr-2 animate-spin" />
                      Submitting Application...
                    </>
                  ) : (
                    "Submit Application"
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Login Redirect - Only show on first step */}
          {currentStep === 1 && (
            <div className="text-center mt-6">
              <button
                type="button"
                className="text-blue-600 hover:underline"
                onClick={() => navigate("/login")}
              >
                Already have an account? Sign in
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TenantSignUpForm;