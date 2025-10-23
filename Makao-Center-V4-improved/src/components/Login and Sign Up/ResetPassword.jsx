"use client"

import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { AlertCircle, Eye, EyeOff, CheckCircle, ArrowLeft } from "lucide-react"

const ResetPassword = () => {
  const navigate = useNavigate()
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [resetEmail, setResetEmail] = useState("")

  useEffect(() => {
    // Check if user came from forgot password page
    const email = sessionStorage.getItem("resetEmail")
    const token = sessionStorage.getItem("resetToken")

    if (!email || !token) {
      navigate("/forgot-password")
      return
    }

    setResetEmail(email)
  }, [navigate])

  const validatePassword = (password) => {
    return {
      isValid: password.length >= 8 && /[A-Z]/.test(password) && /[a-z]/.test(password) && /\d/.test(password),
      minLength: password.length >= 8,
      hasUppercase: /[A-Z]/.test(password),
      hasLowercase: /[a-z]/.test(password),
      hasNumber: /\d/.test(password),
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    try {
      if (!password.trim()) {
        throw new Error("Password is required")
      }

      if (!confirmPassword.trim()) {
        throw new Error("Please confirm your password")
      }

      const passValidation = validatePassword(password)
      if (!passValidation.isValid) {
        throw new Error("Password does not meet all requirements")
      }

      if (password !== confirmPassword) {
        throw new Error("Passwords do not match")
      }

      // Simulate API call to reset password
      await new Promise((resolve) => setTimeout(resolve, 2000))

      // Clear session storage
      sessionStorage.removeItem("resetEmail")
      sessionStorage.removeItem("resetToken")

      // Navigate to success page
      navigate("/reset-success")
    } catch (err) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  const passwordValidation = validatePassword(password)

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-blue-600 mb-2">TenantHub</h1>
          <p className="text-gray-600">Create New Password</p>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          <div className="p-8">
            <h2 className="text-2xl font-bold mb-2">Reset Your Password</h2>
            <p className="text-gray-600 mb-6">Create a strong password for your account</p>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start">
                <AlertCircle className="w-5 h-5 text-red-500 mr-2 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">New Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
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
                <label className="block text-sm font-medium mb-2">Confirm Password</label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
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

              {/* Password Requirements */}
              {password && (
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <p className="font-semibold text-gray-900 mb-3 text-sm">Password Requirements:</p>
                  <div className="space-y-2">
                    {[
                      { label: "At least 8 characters", met: passwordValidation.minLength },
                      { label: "Contains uppercase letter", met: passwordValidation.hasUppercase },
                      { label: "Contains lowercase letter", met: passwordValidation.hasLowercase },
                      { label: "Contains number", met: passwordValidation.hasNumber },
                    ].map((req, index) => (
                      <div
                        key={index}
                        className={`flex items-center text-sm ${req.met ? "text-green-600" : "text-gray-500"}`}
                      >
                        <div
                          className={`w-5 h-5 rounded-full flex items-center justify-center mr-2 ${
                            req.met ? "bg-green-100" : "bg-gray-100"
                          }`}
                        >
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

              {password && confirmPassword && (
                <div
                  className={`p-3 rounded-lg border flex items-center ${
                    password === confirmPassword
                      ? "bg-green-50 border-green-200 text-green-700"
                      : "bg-red-50 border-red-200 text-red-700"
                  }`}
                >
                  {password === confirmPassword ? (
                    <>
                      <CheckCircle size={18} className="mr-2" />
                      <span className="text-sm font-medium">Passwords match</span>
                    </>
                  ) : (
                    <>
                      <AlertCircle size={18} className="mr-2" />
                      <span className="text-sm font-medium">Passwords do not match</span>
                    </>
                  )}
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading || !passwordValidation.isValid || password !== confirmPassword}
                className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium transition-colors"
              >
                {isLoading ? "Resetting Password..." : "Reset Password"}
              </button>
            </form>

            <div className="mt-6 pt-6 border-t">
              <button
                onClick={() => navigate("/login")}
                className="w-full flex items-center justify-center text-blue-600 hover:text-blue-700 font-medium"
              >
                <ArrowLeft size={18} className="mr-2" />
                Back to Login
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-6 text-sm text-gray-600">
          <p>© 2025 TenantHub. All rights reserved.</p>
        </div>
      </div>
    </div>
  )
}

export default ResetPassword
