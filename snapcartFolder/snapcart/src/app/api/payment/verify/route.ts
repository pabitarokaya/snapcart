/* eslint-disable @typescript-eslint/no-explicit-any */

// app/api/payment/verify/route.ts

import { NextRequest, NextResponse } from 'next/server';
import Order from '@/models/order.model';

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    
    const {
      transaction_uuid,
      transaction_code,
      total_amount,
      product_code,
    } = data;

    // Validate required fields
    if (!transaction_uuid || !total_amount || !product_code) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Verify with eSewa API - FIXED: Added $ for template literal
    const verifyUrl = `${process.env.ESEWA_BASE_URL}/api/epay/transaction/status/`;
    
    const verifyParams = new URLSearchParams({
      product_code: product_code,
      total_amount: total_amount,
      transaction_uuid: transaction_uuid
    });

    console.log('Verifying payment with eSewa:', {
      transaction_uuid,
      total_amount,
      product_code
    });

    // FIXED: Added $ for template literals
    const response = await fetch(`${verifyUrl}?${verifyParams}`, {
      method: 'GET',
      headers: {  // FIXED: Corrected typo from 'heade' to 'headers'
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      // FIXED: Added $ for template literal
      throw new Error(`eSewa verification request failed: ${response.statusText}`);
    }

    const verificationResult = await response.json();
    
    console.log('eSewa verification result:', verificationResult);

    // Check if payment is verified
    if (verificationResult.status === 'COMPLETE') {
      
      // Find order by transaction UUID
      const order = await Order.findOne({ transactionUuid: transaction_uuid });

      if (!order) {
        console.error('Order not found for transaction:', transaction_uuid);
        return NextResponse.json({ 
          success: false, 
          error: 'Order not found for this transaction' 
        }, { status: 404 });
      }

      // Check if already paid (to prevent double processing)
      if (order.isPaid) {
        console.log('Order already marked as paid:', order._id);
        return NextResponse.json({ 
          success: true, 
          message: 'Payment already processed',
          data: verificationResult 
        });
      }

      // Update order status to paid
      order.isPaid = true;
      order.transactionCode = transaction_code;
      order.paidAt = new Date();
      await order.save();

      console.log('Order updated to paid:', {
        orderId: order._id,
        transactionCode: transaction_code
      });

      return NextResponse.json({ 
        success: true, 
        message: 'Payment verified and order updated successfully',
        data: {
          orderId: order._id,
          transactionCode: transaction_code,
          amount: total_amount,
          verificationResult
        }
      });
    }
    
    // Payment not complete
    console.warn('Payment verification failed:', {
      transaction_uuid,
      status: verificationResult.status
    });

    return NextResponse.json({ 
      success: false, 
      error: 'Payment not complete',
      status: verificationResult.status 
    }, { status: 400 });
    
  } catch (error: any) {
    console.error('Payment verification error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message || 'Verification failed' 
    }, { status: 500 });
  }
}