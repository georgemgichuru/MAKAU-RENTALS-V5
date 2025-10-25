"use client"

import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { AlertCircle, Mail, ArrowLeft, CheckCircle } from "lucide-react"

const ForgotPasswordRequest = () => {
  const navigate = useNavigate()
  const [email, setEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [submitted, setSubmitted] = useState(false)

  const validateEmail = (email) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    try {
      if (!email.trim()) {
        throw new Error("Email is required")
      }

      if (!validateEmail(email)) {
        throw new Error("Invalid email address")
      }

      // Simulate API call to send reset email
      await new Promise((resolve) => setTimeout(resolve, 2000))

      // In a real app, you would send an email with a reset link here
      // For now, we'll store the email in sessionStorage to simulate the flow
      sessionStorage.setItem("resetEmail", email)
      sessionStorage.setItem("resetToken", `token_${Date.now()}`)

      setSubmitted(true)
    } catch (err) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-blue-600 mb-2">TenantHub</h1>
          <p className="text-gray-600">Reset Your Password</p>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          <div className="p-8">
            {!submitted ? (
              <>
                <h2 className="text-2xl font-bold mb-2">Forgot Password?</h2>
                <p className="text-gray-600 mb-6">
                  Enter your email address and we'll send you a link to reset your password.
                </p>

                {error && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start">
                    <AlertCircle className="w-5 h-5 text-red-500 mr-2 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Email Address</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                        placeholder="your.email@example.com"
                        required
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium transition-colors"
                  >
                    {isLoading ? "Sending..." : "Send Reset Link"}
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
              </>
            ) : (
              <>
                <div className="text-center">
                  <div className="mb-4 flex justify-center">
                    <div className="bg-green-100 rounded-full p-3">
                      <CheckCircle className="w-8 h-8 text-green-600" />
                    </div>
                  </div>
                  <h2 className="text-2xl font-bold mb-2">Check Your Email</h2>
                  <p className="text-gray-600 mb-4">
                    We've sent a password reset link to <span className="font-semibold">{email}</span>
                  </p>
                  <p className="text-sm text-gray-500 mb-6">
                    The link will expire in 24 hours. If you don't see the email, check your spam folder.
                  </p>

                  <button
                    onClick={() => navigate("/reset-password")}
                    className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 font-medium transition-colors mb-3"
                  >
                    Continue to Reset Password
                  </button>

                  <button
                    onClick={() => navigate("/login")}
                    className="w-full flex items-center justify-center text-blue-600 hover:text-blue-700 font-medium"
                  >
                    <ArrowLeft size={18} className="mr-2" />
                    Back to Login
                  </button>
                </div>
              </>
            )}
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

export default ForgotPasswordRequest;
