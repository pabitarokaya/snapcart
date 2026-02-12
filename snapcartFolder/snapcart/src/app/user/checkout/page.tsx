'use client'
import React, { useEffect, useState } from 'react'
import { motion } from "motion/react"
import { ArrowLeft, Building, CreditCard, CreditCardIcon, Home, Loader2, LocateFixed, MapPin, Navigation, Phone, Search, Truck, User } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useSelector } from 'react-redux'
import { RootState } from '@/redux/store'
import axios from 'axios'
import dynamic from 'next/dynamic'

const CheckOutMap = dynamic(() => import("@/components/CheckoutMap"), { ssr: false })
const EsewaPayment = dynamic(() => import("@/components/EsewaPAyment"), { ssr: false })

function Checkout() {
    const router = useRouter()
    const { userData } = useSelector((state: RootState) => state.user)
    const { subTotal, deliveryFee, finalTotal, cartData } = useSelector((state: RootState) => state.cart)
    
    const [address, setAddress] = useState({
        fullName: "",
        mobile: "",
        city: "",
        state: "",
        pincode: "",
        fullAddress: ""
    })
    const [searchLoading, setSearchLoading] = useState(false)
    const [searchQuery, setSearchQuery] = useState("")
    const [position, setPosition] = useState<[number, number] | null>(null)
    const [paymentMethod, setPaymentMethod] = useState<"cod" | "online">("cod")
    const [showEsewaModal, setShowEsewaModal] = useState(false)
    const [orderId, setOrderId] = useState<string | null>(null)
    const [isProcessing, setIsProcessing] = useState(false) // Track processing state to hide map

    useEffect(() => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition((pos) => {
                const { latitude, longitude } = pos.coords
                setPosition([latitude, longitude])
            }, (err) => { console.log('location error', err) }, { enableHighAccuracy: true, maximumAge: 0, timeout: 10000 })
        }
    }, [])

    useEffect(() => {
        if (userData) {
            setAddress((prev) => ({ ...prev, fullName: userData?.name || "" }))
            setAddress((prev) => ({ ...prev, mobile: userData?.mobile || "" }))
        }
    }, [userData])

    const handleSearchQuery = async () => {
        setSearchLoading(true)
        const { OpenStreetMapProvider } = await import("leaflet-geosearch")
        const provider = new OpenStreetMapProvider()
        const results = await provider.search({ query: searchQuery });
        if (results) {
            setSearchLoading(false)
            setPosition([results[0].y, results[0].x])
        }
    }

    useEffect(() => {
        const fetchAddress = async () => {
            if (!position) return
            try {
                const result = await axios.get(`https://nominatim.openstreetmap.org/reverse?lat=${position[0]}&lon=${position[1]}&format=json`)
                console.log(result.data)
                setAddress(prev => ({
                    ...prev,
                    city: result.data.address.city,
                    state: result.data.address.state,
                    pincode: result.data.address.postcode,
                    fullAddress: result.data.display_name
                }))
            } catch (error) {
                console.log(error)
            }
        }
        fetchAddress()
    }, [position])

    const handleCod = async () => {
        if (!position) {
            alert("Please select a delivery location on the map")
            return
        }
        
        if (!address.fullName || !address.mobile) {
            alert("Please fill in your name and mobile number")
            return
        }

        setIsProcessing(true) // Hide map during processing

        try {
            await axios.post("/api/user/order", {
                userId: userData?._id,
                items: cartData.map(item => ({
                    grocery: item._id,
                    name: item.name,
                    price: item.price,
                    unit: item.unit,
                    quantity: item.quantity,
                    image: item.image
                })),
                totalAmount: finalTotal,
                address: {
                    fullName: address.fullName,
                    mobile: address.mobile,
                    city: address.city,
                    state: address.state,
                    fullAddress: address.fullAddress,
                    pincode: address.pincode,
                    latitude: position[0],
                    longitude: position[1]
                },
                paymentMethod
            })

            router.push("/user/order-success")
        } catch (error) {
            console.log(error)
            alert("Failed to place order. Please try again.")
            setIsProcessing(false) // Show map again on error
        }
    }

    const handleOnlinePayment = async () => {
        if (!position) {
            alert("Please select a delivery location on the map")
            return
        }

        if (!address.fullName || !address.mobile) {
            alert("Please fill in your name and mobile number")
            return
        }

        if (!userData?.email) {
            alert("Email is required for online payment. Please update your profile.")
            return
        }

        setIsProcessing(true) // Hide map during processing

        try {
            const response = await axios.post("/api/user/order", {
                userId: userData?._id,
                items: cartData.map(item => ({
                    grocery: item._id,
                    name: item.name,
                    price: item.price,
                    unit: item.unit,
                    quantity: item.quantity,
                    image: item.image
                })),
                totalAmount: finalTotal,
                address: {
                    fullName: address.fullName,
                    mobile: address.mobile,
                    city: address.city,
                    state: address.state,
                    fullAddress: address.fullAddress,
                    pincode: address.pincode,
                    latitude: position[0],
                    longitude: position[1]
                },
                paymentMethod: "online"
            })

            const createdOrderId = response.data._id || response.data.orderId || response.data.id
            
            if (!createdOrderId) {
                console.error("No order ID returned:", response.data)
                alert("Failed to create order. Please try again.")
                setIsProcessing(false) // Show map again on error
                return
            }

            setOrderId(createdOrderId)
            setShowEsewaModal(true)
            // Keep isProcessing true to hide map during payment modal

        } catch (error) {
            console.log(error)
            alert("Failed to create order. Please try again.")
            setIsProcessing(false) // Show map again on error
        }
    }

    const handleCurrentLocation = () => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition((pos) => {
                const { latitude, longitude } = pos.coords
                setPosition([latitude, longitude])
            }, (err) => { console.log('location error', err) }, { enableHighAccuracy: true, maximumAge: 0, timeout: 10000 })
        }
    }

    return (
        <div className='w-[92%] md:w-[80%] mx-auto py-10 relative'>
            <motion.button
                whileTap={{ scale: 0.97 }}
                className='absolute left-0 top-2 flex items-center gap-2 text-green-700 hover:text-green-800 font-semibold'
                onClick={() => router.push("/user/cart")}
            >
                <ArrowLeft size={16} />
                <span>Back to cart</span>
            </motion.button>

            <motion.h1
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className='text-3xl md:text-4xl font-bold text-green-700 text-center mb-10'
            >
                Checkout
            </motion.h1>

            <div className='grid md:grid-cols-2 gap-8'>
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3 }}
                    className='bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 p-6 border border-gray-100'
                >
                    <h2 className='text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2'>
                        <MapPin className='text-green-700' /> Delivery Address
                    </h2>
                    <div className='space-y-4'>
                        <div className='relative'>
                            <User className="absolute left-3 top-3 text-green-600" size={18} />
                            <input 
                                type="text" 
                                value={address.fullName} 
                                onChange={(e) => setAddress((prev) => ({ ...prev, fullName: e.target.value }))} 
                                placeholder="Full Name"
                                className='pl-10 w-full border rounded-lg p-3 text-sm bg-gray-50'
                                disabled={isProcessing}
                            />
                        </div>
                        <div className='relative'>
                            <Phone className="absolute left-3 top-3 text-green-600" size={18} />
                            <input 
                                type="text" 
                                value={address.mobile} 
                                onChange={(e) => setAddress((prev) => ({ ...prev, mobile: e.target.value }))} 
                                placeholder="Mobile Number"
                                className='pl-10 w-full border rounded-lg p-3 text-sm bg-gray-50'
                                disabled={isProcessing}
                            />
                        </div>
                        <div className='relative'>
                            <Home className="absolute left-3 top-3 text-green-600" size={18} />
                            <input 
                                type="text" 
                                value={address.fullAddress} 
                                placeholder='Full Address' 
                                onChange={(e) => setAddress((prev) => ({ ...prev, fullAddress: e.target.value }))} 
                                className='pl-10 w-full border rounded-lg p-3 text-sm bg-gray-50'
                                disabled={isProcessing}
                            />
                        </div>
                        <div className='grid grid-cols-3 gap-3'>
                            <div className='relative'>
                                <Building className="absolute left-3 top-3 text-green-600" size={18} />
                                <input 
                                    type="text" 
                                    value={address.city} 
                                    placeholder='City' 
                                    onChange={(e) => setAddress((prev) => ({ ...prev, city: e.target.value }))} 
                                    className='pl-10 w-full border rounded-lg p-3 text-sm bg-gray-50'
                                    disabled={isProcessing}
                                />
                            </div>
                            <div className='relative'>
                                <Navigation className="absolute left-3 top-3 text-green-600" size={18} />
                                <input 
                                    type="text" 
                                    value={address.state} 
                                    placeholder='State' 
                                    onChange={(e) => setAddress((prev) => ({ ...prev, state: e.target.value }))} 
                                    className='pl-10 w-full border rounded-lg p-3 text-sm bg-gray-50'
                                    disabled={isProcessing}
                                />
                            </div>
                            <div className='relative'>
                                <Search className="absolute left-3 top-3 text-green-600" size={18} />
                                <input 
                                    type="text" 
                                    value={address.pincode} 
                                    placeholder='Pincode' 
                                    onChange={(e) => setAddress((prev) => ({ ...prev, pincode: e.target.value }))} 
                                    className='pl-10 w-full border rounded-lg p-3 text-sm bg-gray-50'
                                    disabled={isProcessing}
                                />
                            </div>
                        </div>
                        <div className='flex gap-2 mt-3'>
                            <input 
                                type="text" 
                                placeholder='Search city or area...' 
                                className='flex-1 border rounded-lg p-3 text-sm focus:ring-2 focus:ring-green-500 outline-none' 
                                value={searchQuery} 
                                onChange={(e) => setSearchQuery(e.target.value)}
                                disabled={isProcessing}
                            />
                            <button 
                                className='bg-green-600 text-white px-5 rounded-lg hover:bg-green-700 transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed' 
                                onClick={handleSearchQuery}
                                disabled={isProcessing || searchLoading}
                            >
                                {searchLoading ? <Loader2 size={16} className='animate-spin' /> : "Search"}
                            </button>
                        </div>

                        {/* MAP SECTION - HIDDEN DURING PROCESSING */}
                        {!isProcessing ? (
                            <div className='relative mt-6 h-[330px] rounded-xl overflow-hidden border border-gray-200 shadow-inner'>
                                {position && <CheckOutMap position={position} setPosition={setPosition} />}
                                <motion.button
                                    whileTap={{ scale: 0.93 }}
                                    className='absolute bottom-4 right-4 bg-green-600 text-white shadow-lg rounded-full p-3 hover:bg-green-700 transition-all flex items-center justify-center z-[999]'
                                    onClick={handleCurrentLocation}
                                >
                                    <LocateFixed size={22} />
                                </motion.button>
                            </div>
                        ) : (
                            <div className='relative mt-6 h-[330px] rounded-xl overflow-hidden border border-gray-200 shadow-inner bg-gray-50 flex items-center justify-center'>
                                <div className='text-center'>
                                    <Loader2 size={48} className='animate-spin text-green-600 mx-auto mb-4' />
                                    <p className='text-gray-600 font-medium'>Processing your order...</p>
                                    <p className='text-gray-500 text-sm mt-2'>Please wait</p>
                                </div>
                            </div>
                        )}
                    </div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3 }}
                    className='bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 p-6 border border-gray-100 h-fit'
                >
                    <h2 className='text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2'>
                        <CreditCard className='text-green-600' /> Payment Method
                    </h2>
                    <div className='space-y-4 mb-6'>
                        <button
                            onClick={() => setPaymentMethod("online")}
                            disabled={isProcessing}
                            className={`flex items-center gap-3 w-full border rounded-lg p-3 transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                                paymentMethod === "online"
                                    ? "border-green-600 bg-green-50 shadow-sm"
                                    : "hover:bg-gray-50"
                            }`}
                        >
                            <CreditCardIcon className='text-green-600' />
                            <span className='font-medium text-gray-700'>Pay Online</span>
                        </button>
                        <button
                            onClick={() => setPaymentMethod("cod")}
                            disabled={isProcessing}
                            className={`flex items-center gap-3 w-full border rounded-lg p-3 transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                                paymentMethod === "cod"
                                    ? "border-green-600 bg-green-50 shadow-sm"
                                    : "hover:bg-gray-50"
                            }`}
                        >
                            <Truck className='text-green-600' />
                            <span className='font-medium text-gray-700'>Cash on Delivery</span>
                        </button>
                    </div>
                    <div className='border-t pt-4 text-gray-700 space-y-2 text-sm sm:text-base'>
                        <div className='flex justify-between'>
                            <span className='font-semibold'>Subtotal</span>
                            <span className='font-semibold text-green-600'>Rs.{subTotal}</span>
                        </div>
                        <div className='flex justify-between'>
                            <span className='font-semibold'>Delivery Fee</span>
                            <span className='font-semibold text-green-600'>Rs.{deliveryFee}</span>
                        </div>
                        <div className='flex justify-between font-bold text-lg border-t pt-3'>
                            <span>Final Total</span>
                            <span className='font-semibold text-green-600'>Rs.{finalTotal}</span>
                        </div>
                    </div>
                    <motion.button 
                        whileTap={{ scale: 0.93 }} 
                        className='w-full mt-6 bg-green-600 text-white py-3 rounded-full hover:bg-green-700 transition-all font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2'
                        onClick={() => {
                            if (paymentMethod === "cod") {
                                handleCod()
                            } else {
                                handleOnlinePayment()
                            }
                        }}
                        disabled={isProcessing}
                    >
                        {isProcessing ? (
                            <>
                                <Loader2 size={20} className='animate-spin' />
                                Processing...
                            </>
                        ) : (
                            paymentMethod === "cod" ? "Place Order" : "Pay & Place Order"
                        )}
                    </motion.button>
                </motion.div>
            </div>

            {/* eSewa Payment Modal */}
            {showEsewaModal && orderId && (
                <EsewaPayment 
                    orderId={orderId}
                    amount={finalTotal}
                    userName={address.fullName}
                    userEmail={userData?.email || ""}
                    onClose={() => {
                        setShowEsewaModal(false)
                        setIsProcessing(false) // Show map again when closing payment modal
                    }} 
                />
            )}
        </div>
    )
}

export default Checkout