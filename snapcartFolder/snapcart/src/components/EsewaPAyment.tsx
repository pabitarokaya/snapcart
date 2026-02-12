/* eslint-disable @typescript-eslint/no-explicit-any */

// /src/components/EsewaPayment.tsx
"use client";
import { useState } from "react";
import { X, Loader2 } from "lucide-react";

interface EsewaPaymentProps {
  orderId: string;
  amount: number;
  userName: string;
  userEmail: string;
  onClose: () => void;
}

export default function EsewaPayment({ 
  orderId, 
  amount, 
  userName, 
  userEmail, 
  onClose 
}: EsewaPaymentProps) {
  
  const [formData] = useState({
    name: userName,
    email: userEmail,
    amount: amount,
  });
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    // Validation
    if (!formData.name || !formData.email || formData.amount < 1) {
      setError("Please ensure all information is correct");
      setIsSubmitting(false);
      return;
    }

    if (!orderId) {
      setError("Order ID is missing. Please try again.");
      setIsSubmitting(false);
      return;
    }

    try {
      console.log("Sending payment request:", {
        ...formData,
        orderId
      });

      const response = await fetch('/api/payment/initiate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }, // Fixed: was "heade"
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          amount: Number(formData.amount),
          orderId: orderId
        })
      });

      const responseData = await response.json();
      console.log("Payment response:", responseData);

      if (!response.ok) {
        throw new Error(responseData.error || 'Payment initiation failed');
      }

      const { paymentUrl, params } = responseData;

      // Create hidden form for eSewa submission
      const form = document.createElement('form');
      form.method = 'POST';
      form.action = paymentUrl;
      form.style.display = 'none';

      // Add fields in required order
      const addField = (name: string, value: string) => {
        const input = document.createElement('input');
        input.type = 'hidden';
        input.name = name;
        input.value = value;
        form.appendChild(input);
      };

      addField('amount', params.amount);
      addField('tax_amount', params.tax_amount);
      addField('total_amount', params.total_amount);
      addField('transaction_uuid', params.transaction_uuid);
      addField('product_code', params.product_code);
      addField('product_service_charge', params.product_service_charge);
      addField('product_delivery_charge', params.product_delivery_charge);
      addField('signed_field_names', params.signed_field_names);
      addField('signature', params.signature);
      addField('success_url', params.success_url);
      addField('failure_url', params.failure_url);

      document.body.appendChild(form);
      form.submit();

    } catch (err: any) {
      console.error('Payment Error:', err);
      setError(err.message || 'Payment initiation failed');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full relative drop-shadow-2xl">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 transition-colors" // Fixed: was "transition-colo"
          disabled={isSubmitting}
          type="button"
        >
          <X size={24} />
        </button>

        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-800">eSewa Payment</h2>
          <img
            src="/images/esewa_logo.png"
            alt="eSewa"
            className="h-8 w-auto"
          />
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
          <p className="text-sm font-semibold text-blue-800 mb-1">
            🔐 Secure Payment
          </p>
          <p className="text-xs text-gray-700">
            You will be redirected to eSewa's secure payment gateway where you can login with your eSewa credentials.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="bg-gray-50 rounded-lg p-4 space-y-2">
            <h3 className="font-semibold text-gray-800 mb-2">Payment Summary</h3>
            
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Customer Name:</span>
              <span className="font-medium text-gray-800">{formData.name}</span>
            </div>
            
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Email:</span>
              <span className="font-medium text-gray-800">{formData.email}</span>
            </div>
            
            <div className="border-t border-gray-200 my-2"></div>
            
            <div className="flex justify-between">
              <span className="font-semibold text-gray-700">Total Amount:</span>
              <span className="font-bold text-green-600 text-xl">NPR {formData.amount}</span>
            </div>
            
            <p className="text-xs text-gray-500 mt-1">
              * Amount includes 13% VAT
            </p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
              <p className="text-sm">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className={`w-full text-white py-3 rounded-md flex items-center justify-center gap-2 transition-all font-semibold ${
              isSubmitting 
                ? 'bg-gray-400 cursor-not-allowed' // Fixed: was "cuor-not-allowed"
                : 'bg-green-600 hover:bg-green-700 cursor-pointer' // Fixed: was "cuor-pointer"
            }`}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="animate-spin" size={20} />
                Redirecting to eSewa...
              </>
            ) : (
              <>
                Proceed to eSewa
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="w-full border border-gray-300 text-gray-700 py-3 rounded-md font-semibold hover:bg-gray-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed" // Fixed: was "cuor-not-allowed"
          >
            Cancel
          </button>

          <div className="text-center">
            <p className="text-xs text-gray-500">
              🔒 Payments are processed securely by eSewa
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}