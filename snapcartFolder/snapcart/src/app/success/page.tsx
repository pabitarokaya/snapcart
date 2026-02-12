'use client'
import React, { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { CheckCircle, Loader2, ShoppingBag } from 'lucide-react'
import { motion } from 'framer-motion'

function SuccessPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [verifying, setVerifying] = useState(true)
  const [paymentData, setPaymentData] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const verifyPayment = async () => {
      try {
        const encodedData = searchParams.get('data')
        
        if (!encodedData) {
          setError('No payment data received')
          setVerifying(false)
          return
        }

        const decodedData = JSON.parse(atob(encodedData))
        console.log('Payment data received:', decodedData)

        setPaymentData(decodedData)

        // IMPORTANT: Verify payment with backend to update order
        const verifyResponse = await fetch('/api/payment/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(decodedData)
        })

        const verifyResult = await verifyResponse.json()
        console.log('Verification result:', verifyResult)

        if (verifyResult.success) {
          // Payment verified and order updated successfully
          setVerifying(false)
          setTimeout(() => {
            router.push('/user/order-success')
          }, 3000)
        } else {
          setError(verifyResult.error || 'Payment verification failed')
          setVerifying(false)
        }

      } catch (err) {
        console.error('Payment verification error:', err)
        setError('Failed to verify payment')
        setVerifying(false)
      }
    }

    verifyPayment()
  }, [searchParams, router])

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-orange-50 p-4">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full text-center"
        >
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-4xl">❌</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Payment Verification Error</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <div className="space-y-3">
            <button
              onClick={() => router.push('/user/my-orders')}
              className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition-all"
            >
              View My Orders
            </button>
            <button
              onClick={() => router.push('/user/cart')}
              className="w-full border border-gray-300 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-50 transition-all"
            >
              Back to Cart
            </button>
          </div>
        </motion.div>
      </div>
    )
  }

  if (verifying) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-blue-50 p-4">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full text-center"
        >
          <Loader2 className="w-16 h-16 text-green-600 mx-auto mb-4 animate-spin" />
          <h1 className="text-2xl font-bold text-gray-800 mb-2">
            Verifying Payment...
          </h1>
          <p className="text-gray-600">
            Please wait while we confirm your payment with eSewa and update your order
          </p>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-blue-50 p-4">
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
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-12 h-12 text-green-600" />
          </div>
        </motion.div>

        <h1 className="text-3xl font-bold text-gray-800 mb-2">
          Payment Successful!
        </h1>
        <p className="text-gray-600 mb-6">
          Thank you for your payment. Your order has been confirmed and updated.
        </p>

        {paymentData && (
          <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
            <h3 className="font-semibold text-gray-800 mb-3">Transaction Details</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Transaction Code:</span>
                <span className="font-medium text-gray-800">{paymentData.transaction_code}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Amount:</span>
                <span className="font-medium text-green-600">NPR {paymentData.total_amount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Status:</span>
                <span className="font-medium text-green-600">{paymentData.status}</span>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-3">
          <p className="text-sm text-gray-500 flex items-center justify-center gap-2">
            <ShoppingBag size={16} />
            Redirecting to your orders...
          </p>
          
          <button
            onClick={() => router.push('/user/order-success')}
            className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition-all"
          >
            View Order
          </button>

          <button
            onClick={() => router.push('/')}
            className="w-full border border-gray-300 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-50 transition-all"
          >
            Continue Shopping
          </button>
        </div>
      </motion.div>
    </div>
  )
}

export default SuccessPage