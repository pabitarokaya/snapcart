'use client'
import React, { useEffect, useState } from 'react'
import { motion, AnimatePresence } from "motion/react"
import { ArrowRight, Bike, User, UserCog, AlertCircle, Loader2, CheckCircle } from 'lucide-react'
// Using fetch instead of axios
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'

interface Role {
  id: string
  label: string
  icon: React.ElementType
}

interface ErrorState {
  message: string
  field?: string
}

function EditRoleMobile() {
  const [roles, setRoles] = useState<Role[]>([
    { id: "admin", label: "Admin", icon: UserCog },
    { id: "user", label: "User", icon: User },
    { id: "deliveryBoy", label: "Delivery Boy", icon: Bike }
  ])
  
  const [selectedRole, setSelectedRole] = useState("")
  const [mobile, setMobile] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<ErrorState | null>(null)
  const [touched, setTouched] = useState(false)
  const [success, setSuccess] = useState(false)
  
  const { update, data } = useSession()
  const router = useRouter()

  // Validate mobile number
  const validateMobile = (value: string): boolean => {
    return /^[0-9]{10}$/.test(value)
  }

  // Handle mobile input change
  const handleMobileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '') // Only allow digits
    setMobile(value)
    setError(null) // Clear error when user types
    
    // Validate on change if field has been touched
    if (touched && value.length > 0 && value.length < 10) {
      setError({ message: "Mobile number must be exactly 10 digits", field: "mobile" })
    }
  }

  // Handle mobile blur
  const handleMobileBlur = () => {
    setTouched(true)
    if (mobile.length > 0 && !validateMobile(mobile)) {
      setError({ message: "Please enter a valid 10-digit mobile number", field: "mobile" })
    }
  }

  // Handle edit submission
  const handleEdit = async () => {
    // Final validation
    if (!validateMobile(mobile)) {
      setError({ message: "Please enter a valid 10-digit mobile number", field: "mobile" })
      return
    }

    if (!selectedRole) {
      setError({ message: "Please select a role", field: "role" })
      return
    }

    setLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/user/edit-role-mobile", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          role: selectedRole,
          mobile
        })
      })

      const data = await response.json()

      if (!response.ok) {
        const status = response.status

        switch (status) {
          case 409:
            setError({
              message: data.message || "This mobile number is already registered with another account",
              field: "mobile"
            })
            break
          case 400:
            setError({
              message: data.message || "Invalid input. Please check your details.",
              field: data.field || "general"
            })
            break
          case 401:
            setError({
              message: "Session expired. Please login again.",
              field: "general"
            })
            setTimeout(() => router.push("/login"), 2000)
            break
          case 404:
            setError({
              message: "User not found. Please try logging in again.",
              field: "general"
            })
            break
          default:
            setError({
              message: data.message || "An error occurred. Please try again.",
              field: "general"
            })
        }
        setLoading(false)
        return
      }

      if (data.success) {
        // Update session with new role
        await update({ role: selectedRole })
        
        // Show success state briefly
        setSuccess(true)
        
        // Navigate after short delay
        setTimeout(() => {
          router.push("/")
          router.refresh()
        }, 1000)
      }
    } catch (error: any) {
      console.error("Edit error:", error)
      setError({
        message: "Network error. Please check your connection and try again.",
        field: "general"
      })
      setLoading(false)
    }
  }

  // Check for existing admin
  useEffect(() => {
    const checkForAdmin = async () => {
      try {
        const response = await fetch("/api/check-for-admin")
        const data = await response.json()
        
        if (data.adminExist) {
          setRoles(prev => prev.filter(r => r.id !== "admin"))
        }
      } catch (error) {
        console.error("Error checking for admin:", error)
      }
    }
    checkForAdmin()
  }, [])

  const isFormValid = selectedRole && validateMobile(mobile) && !loading

  return (
    <div className='flex flex-col items-center min-h-screen p-6 w-full bg-gradient-to-b from-white to-green-50'>
      <motion.h1
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className='text-3xl md:text-4xl font-extrabold text-green-700 text-center mt-8'
      >
        Select Your Role
      </motion.h1>

      {/* Error Alert */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className='mt-6 w-full max-w-2xl'
          >
            <div className='bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3'>
              <AlertCircle className='w-5 h-5 text-red-600 flex-shrink-0 mt-0.5' />
              <div className='flex-1'>
                <p className='text-sm text-red-700 font-medium'>{error.message}</p>
                {error.field === 'mobile' && (
                  <p className='text-xs text-red-600 mt-1'>
                    Please use a different mobile number or contact support if this is your number.
                  </p>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Success Alert */}
      <AnimatePresence>
        {success && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className='mt-6 w-full max-w-2xl'
          >
            <div className='bg-green-50 border border-green-200 rounded-xl p-4 flex items-start gap-3'>
              <CheckCircle className='w-5 h-5 text-green-600 flex-shrink-0 mt-0.5' />
              <p className='text-sm text-green-700 font-medium'>Profile updated successfully! Redirecting...</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Role Selection */}
      <div className='flex flex-col md:flex-row justify-center items-center gap-6 mt-10 flex-wrap'>
        {roles.map((role) => {
          const Icon = role.icon
          const isSelected = selectedRole === role.id
          return (
            <motion.div
              key={role.id}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                setSelectedRole(role.id)
                setError(null)
              }}
              className={`flex flex-col items-center justify-center w-48 h-44 rounded-2xl border-2 transition-all cursor-pointer ${
                isSelected
                  ? "border-green-600 bg-green-100 shadow-lg"
                  : "border-gray-300 bg-white hover:border-green-400 hover:shadow-md"
              }`}
            >
              <Icon className={`w-12 h-12 mb-3 ${isSelected ? 'text-green-600' : 'text-gray-600'}`} />
              <span className={`font-semibold ${isSelected ? 'text-green-700' : 'text-gray-700'}`}>
                {role.label}
              </span>
            </motion.div>
          )
        })}
      </div>

      {/* Mobile Input */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5, duration: 0.6 }}
        className='flex flex-col items-center mt-10 w-full max-w-md'
      >
        <label htmlFor="mobile" className='text-gray-700 font-medium mb-2 self-start'>
          Enter Your Mobile Number
        </label>
        <input
          type="tel"
          id='mobile'
          value={mobile}
          onChange={handleMobileChange}
          onBlur={handleMobileBlur}
          maxLength={10}
          className={`w-full px-4 py-3 rounded-xl border-2 transition-all focus:outline-none text-gray-800 ${
            error?.field === 'mobile'
              ? 'border-red-300 focus:ring-2 focus:ring-red-500'
              : 'border-gray-300 focus:ring-2 focus:ring-green-500'
          }`}
          placeholder='9876543210'
          disabled={loading}
        />
        <div className='flex items-center justify-between w-full mt-2'>
          <p className='text-xs text-gray-500'>10 digits only</p>
          <p className={`text-xs ${mobile.length === 10 ? 'text-green-600' : 'text-gray-400'}`}>
            {mobile.length}/10
          </p>
        </div>
      </motion.div>

      {/* Submit Button */}
      <motion.button
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        disabled={!isFormValid || success}
        className={`inline-flex items-center justify-center gap-2 font-semibold py-3 px-8 rounded-2xl shadow-md transition-all duration-200 min-w-[200px] mt-12 ${
          isFormValid && !success
            ? "bg-green-600 hover:bg-green-700 text-white hover:shadow-lg"
            : "bg-gray-300 text-gray-500 cursor-not-allowed"
        }`}
        onClick={handleEdit}
      >
        {loading ? (
          <>
            <Loader2 className='w-5 h-5 animate-spin' />
            Updating...
          </>
        ) : success ? (
          <>
            <CheckCircle className='w-5 h-5' />
            Success!
          </>
        ) : (
          <>
            Go to Home
            <ArrowRight className='w-5 h-5' />
          </>
        )}
      </motion.button>
    </div>
  )
}

export default EditRoleMobile