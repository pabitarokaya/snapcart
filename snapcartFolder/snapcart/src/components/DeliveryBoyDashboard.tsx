'use client'
import { getSocket } from '@/lib/socket'
import { RootState } from '@/redux/store'
import axios from 'axios'
import React, { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import LiveMap from './LiveMap'
import DeliveryChat from './DeliveryChat'
import { Loader } from 'lucide-react'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

interface ILocation {
  latitude: number,
  longitude: number
}

interface WeeklyData {
  day: string
  date: string
  revenue: number
  deliveries: number
}

interface DashboardProps {
  earning: number
  weeklyData: WeeklyData[]
  weeklyEarning: number
  weeklyDeliveries: number
}

function DeliveryBoyDashboard({ earning, weeklyData, weeklyEarning, weeklyDeliveries }: DashboardProps) {
  const [assignments, setAssignments] = useState<any[]>([])
  const { userData } = useSelector((state: RootState) => state.user)
  const [activeOrder, setActiveOrder] = useState<any>(null)
  const [showOtpBox, setShowOtpBox] = useState(false)
  const [otpError, setOtpError] = useState("")
  const [sendOtpLoading, setSendOtpLoading] = useState(false)
  const [verifyOtpLoading, setVerifyOtpLoading] = useState(false)
  const [otp, setOtp] = useState("")
  const [userLocation, setUserLocation] = useState<ILocation>({
    latitude: 0,
    longitude: 0
  })
  const [deliveryBoyLocation, setDeliveryBoyLocation] = useState<ILocation>({
    latitude: 0,
    longitude: 0
  })
  
  const fetchAssignments = async () => {
    try {
      const result = await axios.get("/api/delivery/get-assignments")
      setAssignments(result.data)
    } catch (error) {
      console.log(error)
    }
  }

  useEffect(() => {
    const socket = getSocket()
    if (!userData?._id) return
    if (!navigator.geolocation) return
    const watcher = navigator.geolocation.watchPosition((pos) => {
      const lat = pos.coords.latitude
      const lon = pos.coords.longitude
      setDeliveryBoyLocation({
        latitude: lat,
        longitude: lon
      })
      socket.emit("update-location", {
        userId: userData?._id,
        latitude: lat,
        longitude: lon
      })
    }, (err) => {
      console.log(err)
    }, { enableHighAccuracy: true })
    return () => navigator.geolocation.clearWatch(watcher)
  }, [userData?._id])

  useEffect((): any => {
    const socket = getSocket()

    socket.on("new-assignment", (deliveryAssignment) => {
      setAssignments((prev) => [...prev, deliveryAssignment])
    })

    socket.on("assignment-accepted", ({ assignmentId }) => {
      setAssignments((prev) => prev.filter((a) => a._id !== assignmentId))
    })

    return () => {
      socket.off("new-assignment")
      socket.off("assignment-accepted")
    }
  }, [])

  const handleAccept = async (id: string) => {
    try {
      await axios.get(`/api/delivery/assignment/${id}/accept-assignment`)
      fetchCurrentOrder()

      const socket = getSocket()
      socket.emit("accept-assignment", { assignmentId: id })
      
      setAssignments((prev) => prev.filter((a) => a._id !== id))
    } catch (error) {
      console.log(error)
    }
  }

  const handleReject = async (id: string) => {
    try {
      setAssignments((prev) => prev.filter((a) => a._id !== id))
      console.log(`Rejected assignment: ${id}`)
    } catch (error) {
      console.log(error)
    }
  }

  const fetchCurrentOrder = async () => {
    try {
      const result = await axios.get("/api/delivery/current-order")
      if (result.data.active) {
        setActiveOrder(result.data.assignment)
        setUserLocation({
          latitude: result.data.assignment.order.address.latitude,
          longitude: result.data.assignment.order.address.longitude
        })
      }
    } catch (error) {
      console.log(error)
    }
  }

  useEffect((): any => {
    const socket = getSocket()
    socket.on("update-deliveryBoy-location", ({ userId, location }) => {
      setDeliveryBoyLocation({
        latitude: location.coordinates[1],
        longitude: location.coordinates[0]
      })
    })
    return () => socket.off("update-deliveryBoy-location")
  }, [])

  useEffect(() => {
    fetchCurrentOrder()
    fetchAssignments()
  }, [userData])

  const sendOtp = async () => {
    setSendOtpLoading(true)
    try {
      const result = await axios.post("/api/delivery/otp/send", { orderId: activeOrder.order._id })
      console.log(result.data)
      setShowOtpBox(true)
      setSendOtpLoading(false)
    } catch (error) {
      console.log(error)
      setSendOtpLoading(false)
    }
  }

  const verifyOtp = async () => {
    setVerifyOtpLoading(true)
    try {
      const result = await axios.post("/api/delivery/otp/verify", { orderId: activeOrder.order._id, otp })
      console.log(result.data)
      setActiveOrder(null)
      setVerifyOtpLoading(false)
      await fetchCurrentOrder()
      window.location.reload()
    } catch (error) {
      setOtpError("Otp Verification Error")
      setVerifyOtpLoading(false)
    }
  }

  if (!activeOrder && assignments.length === 0) {
    return (
      <div className='flex items-center justify-center min-h-screen bg-gradient-to-br from-white to-green-50 p-6'>
        <div className='max-w-4xl w-full'>
          <h2 className='text-3xl font-bold text-gray-800 text-center mb-2'>No Active Deliveries 🚛</h2>
          <p className='text-gray-500 mb-8 text-center'>Stay online to receive new orders</p>

          <div className='grid grid-cols-1 md:grid-cols-2 gap-4 mb-6'>
            <div className='bg-white border rounded-xl shadow-lg p-5 text-center'>
              <p className='text-sm text-gray-600 mb-1'>Today's Earnings</p>
              <p className='text-3xl font-bold text-green-700'>₹{earning}</p>
              <p className='text-xs text-gray-500 mt-1'>{earning / 40} deliveries</p>
            </div>

            <div className='bg-white border rounded-xl shadow-lg p-5 text-center'>
              <p className='text-sm text-gray-600 mb-1'>Weekly Earnings</p>
              <p className='text-3xl font-bold text-blue-700'>₹{weeklyEarning}</p>
              <p className='text-xs text-gray-500 mt-1'>{weeklyDeliveries} deliveries</p>
            </div>
          </div>

          <div className='bg-white border rounded-xl shadow-xl p-6'>
            <h2 className='text-xl font-bold text-gray-800 mb-2'>Weekly Performance</h2>
            <p className='text-sm text-gray-500 mb-6'>Last 7 days earnings and deliveries</p>
            
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={weeklyData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis 
                  dataKey="day" 
                  stroke="#6b7280"
                  fontSize={13}
                  fontWeight={500}
                />
                <YAxis 
                  stroke="#6b7280"
                  fontSize={12}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#fff', 
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    padding: '12px',
                    boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                  }}
                  formatter={(value: any, name: string) => {
                    if (name === 'revenue') return [`₹${value}`, 'Earnings']
                    if (name === 'deliveries') return [`${value}`, 'Deliveries']
                    return [value, name]
                  }}
                  labelFormatter={(label) => {
                    const dayData = weeklyData.find(d => d.day === label)
                    return dayData ? `${label}, ${dayData.date}` : label
                  }}
                />
                <Bar 
                  dataKey="revenue" 
                  fill="#16a34a" 
                  radius={[6, 6, 0, 0]}
                  name="revenue"
                  maxBarSize={60}
                />
              </BarChart>
            </ResponsiveContainer>

            <div className='mt-6 grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg'>
              <div className='text-center'>
                <div className='flex items-center justify-center gap-2 mb-1'>
                  <div className='w-3 h-3 bg-green-600 rounded'></div>
                  <p className='text-xs text-gray-600 font-medium'>Earnings (₹)</p>
                </div>
                <p className='text-lg font-bold text-green-700'>₹{weeklyEarning}</p>
              </div>
              <div className='text-center'>
                <div className='flex items-center justify-center gap-2 mb-1'>
                  <div className='w-3 h-3 bg-gray-400 rounded'></div>
                  <p className='text-xs text-gray-600 font-medium'>Total Deliveries</p>
                </div>
                <p className='text-lg font-bold text-gray-700'>{weeklyDeliveries}</p>
              </div>
            </div>

            <button 
              className='mt-6 w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg font-semibold transition-colors shadow-md' 
              onClick={() => window.location.reload()}
            >
              🔄 Refresh Dashboard
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (activeOrder && userLocation) {
    return (
      <div className='p-4 pt-[120px] min-h-screen bg-gray-50'>
        <div className='max-w-3xl mx-auto'>
          <h1 className='text-2xl font-bold text-green-700 mb-2'>Active Delivery</h1>
          <p className='text-gray-600 text-sm mb-4'>order#{activeOrder.order._id.slice(-6)}</p>

          <div className='rounded-xl border shadow-lg overflow-hidden mb-6'>
            <LiveMap userLocation={userLocation} deliveryBoyLocation={deliveryBoyLocation} />
          </div>
          <DeliveryChat orderId={activeOrder.order._id} deliveryBoyId={userData?._id?.toString()!} />
          <div className='mt-6 bg-white rounded-xl border shadow p-6'>
            {!activeOrder.order.deliveryOtpVerification && !showOtpBox && (
              <button
                onClick={sendOtp}
                className='w-full py-4 bg-green-600 text-center text-white rounded-lg'
              >{sendOtpLoading ? <Loader size={16} className='animate-spin text-white text-center' /> : "Mark as Delivered"}</button>
            )}
            {
              showOtpBox &&
              <div className='mt-4'>
                <input type="text" className='w-full py-3 border rounded-lg text-center' placeholder='Enter Otp' maxLength={4} onChange={(e) => setOtp(e.target.value)} value={otp} />
                <button className='w-full mt-4 bg-blue-600 text-white py-3 text-center rounded-lg' onClick={verifyOtp}>{verifyOtpLoading ? <Loader size={16} className='animate-spin text-white text-center' /> : "Verify OTP"}</button>
                {otpError && <div className='text-red-600 mt-2'>{otpError}</div>}
              </div>
            }
            {activeOrder.order.deliveryOtpVerification && <div className='text-green-700 text-center font-bold'>Delivery completed!</div>}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className='w-full min-h-screen bg-gray-50 p-4'>
      <div className="max-w-3xl mx-auto">
        <h2 className='text-2xl font-bold mt-[120px] mb-[30px]'>Delivery Assignments</h2>

        {assignments.map((a, index) => (
          <div key={index} className='p-5 bg-white rounded-xl shadow mb-4 border'>
            <p><b>Order Id </b> #{a?.order._id.slice(-6)}</p>
            <p className='text-gray-600'>{a.order.address.fullAddress}</p>

            <div className='flex gap-3 mt-4'>
              <button
                className='flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition-colors'
                onClick={() => handleAccept(a._id)}
              >
                Accept
              </button>
              <button
                className='flex-1 bg-red-600 text-white py-2 rounded-lg hover:bg-red-700 transition-colors'
                onClick={() => handleReject(a._id)}
              >
                Reject
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default DeliveryBoyDashboard