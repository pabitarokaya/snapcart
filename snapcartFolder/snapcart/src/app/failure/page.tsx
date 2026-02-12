'use client'
import React from 'react'
import { useRouter } from 'next/navigation'
import { XCircle, ArrowLeft, RefreshCw } from 'lucide-react'
import { motion } from 'framer-motion'

function FailurePage() {
  const router = useRouter()

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-orange-50 p-4">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full text-center"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', duration: 0.5, delay: 0.2 }}
        >
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <XCircle className="w-12 h-12 text-red-600" />
          </div>
        </motion.div>

        <h1 className="text-3xl font-bold text-gray-800 mb-2">
          Payment Failed
        </h1>
        <p className="text-gray-600 mb-6">
          The transaction could not be completed. Please try again.
        </p>

        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6">
          <h3 className="font-semibold text-orange-800 mb-2">What happened?</h3>
          <p className="text-sm text-gray-700">
            Your payment was not processed. This could be due to:
          </p>
          <ul className="text-sm text-gray-700 text-left mt-2 space-y-1">
            <li>• Insufficient balance</li>
            <li>• Payment cancelled</li>
            <li>• Network issues</li>
            <li>• Invalid credentials</li>
          </ul>
        </div>

        <div className="space-y-3">
          <button
            onClick={() => router.push('/user/checkout')}
            className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition-all flex items-center justify-center gap-2"
          >
            <RefreshCw size={18} />
            Try Again
          </button>

          <button
            onClick={() => router.push('/user/cart')}
            className="w-full border border-gray-300 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-50 transition-all flex items-center justify-center gap-2"
          >
            <ArrowLeft size={18} />
            Back to Cart
          </button>

          <button
            onClick={() => router.push('/')}
            className="w-full text-gray-600 py-2 rounded-lg font-medium hover:text-gray-800 transition-all"
          >
            Continue Shopping
          </button>
        </div>
      </motion.div>
    </div>
  )
}

export default FailurePage