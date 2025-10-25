"use client"

import { useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { CheckCircle, ArrowRight } from "lucide-react"

const ResetPasswordSuccess = () => {
  const navigate = useNavigate()

  useEffect(() => {
    // Auto-redirect to login after 5 seconds
    const timer = setTimeout(() => {
      navigate("/login")
    }, 5000)

    return () => clearTimeout(timer)
  }, [navigate])

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-blue-600 mb-2">TenantHub</h1>
          <p className="text-gray-600">Password Reset Complete</p>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          <div className="p-8">
            <div className="text-center">
              <div className="mb-6 flex justify-center">
                <div className="bg-green-100 rounded-full p-4">
                  <CheckCircle className="w-12 h-12 text-green-600" />
                </div>
              </div>

              <h2 className="text-2xl font-bold mb-2 text-green-600">Password Reset Successful!</h2>
              <p className="text-gray-600 mb-6">
                Your password has been successfully reset. You can now log in with your new password.
              </p>

              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                <p className="text-sm text-green-800">You will be redirected to the login page in a few seconds...</p>
              </div>

              <button
                onClick={() => navigate("/login")}
                className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 font-medium transition-colors flex items-center justify-center"
              >
                Go to Login
                <ArrowRight size={18} className="ml-2" />
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

export default ResetPasswordSuccess;
