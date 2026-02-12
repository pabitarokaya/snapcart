import React from 'react'
import DeliveryBoyDashboard from './DeliveryBoyDashboard'
import { auth } from '@/auth'
import connectDb from '@/lib/db'
import Order from '@/models/order.model'

async function DeliveryBoy() {
  await connectDb()
  const session = await auth()
  const deliveryBoyId = session?.user?.id
  
  const orders = await Order.find({
    assignedDeliveryBoy: deliveryBoyId,
    deliveryOtpVerification: true
  })

  // Calculate today's earning
  const today = new Date().toDateString()
  const todayOrders = orders.filter((o) => new Date(o.deliveredAt).toDateString() === today).length
  const todaysEarning = todayOrders * 40

  // Calculate last 7 days earnings (for weekly graph)
  const last7Days = []
  const weeklyData = []
  
  for (let i = 6; i >= 0; i--) {
    const date = new Date()
    date.setDate(date.getDate() - i)
    last7Days.push(date)
  }

  for (const date of last7Days) {
    const dayStr = date.toDateString()
    const dayOrders = orders.filter((o) => new Date(o.deliveredAt).toDateString() === dayStr)
    const dayEarning = dayOrders.length * 40
    
    weeklyData.push({
      day: date.toLocaleDateString('en-US', { weekday: 'short' }), // Mon, Tue, Wed...
      date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), // Jan 26
      revenue: dayEarning,
      deliveries: dayOrders.length
    })
  }

  // Calculate total weekly earnings
  const weeklyEarning = weeklyData.reduce((sum, day) => sum + day.revenue, 0)
  const weeklyDeliveries = weeklyData.reduce((sum, day) => sum + day.deliveries, 0)

  return (
    <>
      <DeliveryBoyDashboard 
        earning={todaysEarning}
        weeklyData={weeklyData}
        weeklyEarning={weeklyEarning}
        weeklyDeliveries={weeklyDeliveries}
      />
    </>
  )
}

export default DeliveryBoy