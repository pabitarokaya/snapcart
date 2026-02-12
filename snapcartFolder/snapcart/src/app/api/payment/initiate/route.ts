/* eslint-disable @typescript-eslint/no-explicit-any */

// app/api/payment/initiate/route.ts

import { NextResponse } from "next/server";
import { v4 as uuidv4 } from 'uuid';
import { generateEsewaSignature } from "@/lib/esewa/verifySignature";
import Order from "@/models/order.model";

export async function POST(req: Request) {
  try {
    const { amount, name, email, orderId } = await req.json();

    // Validate inputs
    if (!amount || !name || !email) {
      return NextResponse.json(
        { error: "Missing required fields: amount, name, email" },
        { status: 400 }
      );
    }

    if (!orderId) {
      return NextResponse.json(
        { error: "Order ID is required" },
        { status: 400 }
      );
    }

    const numericAmount = Number(amount);
    if (isNaN(numericAmount) || numericAmount < 1) {
      return NextResponse.json(
        { error: "Invalid amount" },
        { status: 400 }
      );
    }

    // Find the order (Mongoose handles connection automatically)
    const order = await Order.findById(orderId);
    
    if (!order) {
      return NextResponse.json(
        { error: "Order not found" },
        { status: 404 }
      );
    }

    // Check if order is already paid
    if (order.isPaid) {
      return NextResponse.json(
        { error: "Order is already paid" },
        { status: 400 }
      );
    }

    // Calculate amounts with 13% VAT
    const baseAmount = Number(numericAmount.toFixed(2));
    const taxAmount = Number((baseAmount * 0.13).toFixed(2));
    const totalAmount = Number((baseAmount + taxAmount).toFixed(2));

    // Generate unique transaction UUID
    const transactionUuid = uuidv4();

    // Generate eSewa signature
    const message = [
      `total_amount=${totalAmount.toFixed(2)}`,
      `transaction_uuid=${transactionUuid}`,
      `product_code=${process.env.ESEWA_MERCHANT_ID}`
    ].join(',');

    const signature = generateEsewaSignature(message);

    // Update order with transaction UUID
    order.transactionUuid = transactionUuid;
    await order.save();

    console.log('Payment initiated:', {
      orderId: order._id,
      transactionUuid,
      amount: totalAmount
    });

    // Return payment form data
    return NextResponse.json({
      success: true,
      paymentUrl: `${process.env.ESEWA_BASE_URL}/api/epay/main/v2/form`,
      params: {
        amount: baseAmount.toFixed(2),
        tax_amount: taxAmount.toFixed(2),
        total_amount: totalAmount.toFixed(2),
        product_service_charge: "0.00",
        product_delivery_charge: "0.00",
        transaction_uuid: transactionUuid,
        product_code: process.env.ESEWA_MERCHANT_ID!,
        signature,
        success_url: `${process.env.NEXT_BASE_URL}/success`, 
        failure_url: `${process.env.NEXT_BASE_URL}/failure`,  
        signed_field_names: 'total_amount,transaction_uuid,product_code'
      }
    });
    
  } catch (error: any) {
    console.error("Payment initiation error:", error);
    return NextResponse.json(
      { 
        success: false,
        error: error.message || "Payment initiation failed" 
      },
      { status: 500 }
    );
  }
}