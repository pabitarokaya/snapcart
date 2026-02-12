'use client'
import { ArrowLeft, Eye, EyeOff, Key, Leaf, Loader2, Lock, LogIn, Mail, User, AlertCircle } from 'lucide-react'
import React, { FormEvent, useState } from 'react'
import {motion} from "motion/react"
import Image from 'next/image'
import googleImage from "@/assets/google.png"
import axios from 'axios'
import { useRouter } from 'next/navigation'
import { signIn, useSession } from 'next-auth/react'

function Login() {
   
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [showPassword, setShowPassword] = useState(false)
    const [loading, setLoading] = useState(false)
    const [errors, setErrors] = useState<{email?: string, password?: string, general?: string}>({})
    const [touched, setTouched] = useState<{email: boolean, password: boolean}>({email: false, password: false})
    
    const router = useRouter()
    const session = useSession()

    // Email validation function
    const validateEmail = (email: string): boolean => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        return emailRegex.test(email)
    }

    // Password validation function
    const validatePassword = (password: string): boolean => {
        return password.length >= 6
    }

    // Handle blur events to mark fields as touched
    const handleBlur = (field: 'email' | 'password') => {
        setTouched(prev => ({...prev, [field]: true}))
        validateField(field)
    }

    // Validate individual field
    const validateField = (field: 'email' | 'password') => {
        const newErrors = {...errors}
        
        if (field === 'email') {
            if (!email) {
                newErrors.email = 'Email is required'
            } else if (!validateEmail(email)) {
                newErrors.email = 'Please enter a valid email address'
            } else {
                delete newErrors.email
            }
        }
        
        if (field === 'password') {
            if (!password) {
                newErrors.password = 'Password is required'
            } else if (!validatePassword(password)) {
                newErrors.password = 'Password must be at least 6 characters'
            } else {
                delete newErrors.password
            }
        }
        
        setErrors(newErrors)
    }

    // Validate all fields
    const validateForm = (): boolean => {
        const newErrors: {email?: string, password?: string} = {}
        
        if (!email) {
            newErrors.email = 'Email is required'
        } else if (!validateEmail(email)) {
            newErrors.email = 'Please enter a valid email address'
        }
        
        if (!password) {
            newErrors.password = 'Password is required'
        } else if (!validatePassword(password)) {
            newErrors.password = 'Password must be at least 6 characters'
        }
        
        setErrors(newErrors)
        setTouched({email: true, password: true})
        
        return Object.keys(newErrors).length === 0
    }

    const handleLogin = async (e: FormEvent) => {
        e.preventDefault()
        
        // Clear previous general errors
        setErrors(prev => {
            const {general, ...rest} = prev
            return rest
        })
        
        // Validate form before submission
        if (!validateForm()) {
            return
        }
        
        setLoading(true)
        
        try {
            const result = await signIn("credentials", {
                email,
                password,
                redirect: false // Don't redirect automatically to handle errors
            })
            
            if (result?.error) {
                const errorMessage = result.error
                
                // Handle specific error codes from your authorize function
                if (errorMessage.includes('USER_NOT_FOUND')) {
                    setErrors(prev => ({
                        ...prev, 
                        general: `No account found with email "${email}". Please sign up first.`
                    }))
                } else if (errorMessage.includes('INVALID_PASSWORD')) {
                    setErrors(prev => ({
                        ...prev, 
                        general: 'Incorrect password. Please try again.'
                    }))
                } else if (errorMessage === 'CredentialsSignin') {
                    // Generic NextAuth error - user doesn't exist or wrong password
                    setErrors(prev => ({
                        ...prev, 
                        general: 'Invalid email or password. Please check your credentials.'
                    }))
                } else {
                    // Any other error
                    setErrors(prev => ({
                        ...prev, 
                        general: 'Login failed. Please try again.'
                    }))
                }
            } else if (result?.ok) {
                // Login successful - give time for session to establish
                await new Promise(resolve => setTimeout(resolve, 100))
                router.push('/')
                router.refresh()
            } else {
                setErrors(prev => ({
                    ...prev, 
                    general: 'An unexpected error occurred. Please try again.'
                }))
            }
        } catch (error) {
            console.error('Login error:', error)
            setErrors(prev => ({
                ...prev, 
                general: 'An unexpected error occurred. Please try again.'
            }))
        } finally {
            setLoading(false)
        }
    }

    const isFormValid = email !== "" && password !== "" && 
                       validateEmail(email) && validatePassword(password)

    return (
        <div className='flex flex-col items-center justify-center min-h-screen px-6 py-10 bg-white relative'>
            <motion.h1
                initial={{y: -10, opacity: 0}}
                animate={{y: 0, opacity: 1}}
                transition={{duration: 0.6}}
                className='text-4xl font-extrabold text-green-700 mb-2'
            >
                Welcome Back
            </motion.h1>
            <p className='text-gray-600 mb-8 flex items-center'>
                Login To Snapcart <Leaf className='w-5 h-5 text-green-600'/>
            </p>

            <motion.form
                onSubmit={handleLogin}
                initial={{opacity: 0}}
                animate={{opacity: 1}}
                transition={{duration: 0.6}}
                className='flex flex-col gap-5 w-full max-w-sm'
            >
                {/* General Error Message */}
                {errors.general && (
                    <motion.div 
                        initial={{opacity: 0, y: -10}}
                        animate={{opacity: 1, y: 0}}
                        className='bg-red-50 border border-red-200 rounded-xl p-3 flex items-start gap-2'
                    >
                        <AlertCircle className='w-5 h-5 text-red-600 flex-shrink-0 mt-0.5'/>
                        <p className='text-sm text-red-700'>{errors.general}</p>
                    </motion.div>
                )}

                {/* Email Field */}
                <div className='relative'>
                    <Mail className='absolute left-3 top-3.5 w-5 h-5 text-gray-400'/>
                    <input 
                        type="text" 
                        placeholder='Your Email' 
                        className={`w-full border rounded-xl py-3 pl-10 pr-4 text-gray-800 focus:ring-2 focus:outline-none transition-colors ${
                            touched.email && errors.email 
                                ? 'border-red-300 focus:ring-red-500' 
                                : 'border-gray-300 focus:ring-green-500'
                        }`}
                        onChange={(e) => {
                            setEmail(e.target.value)
                            if (touched.email) validateField('email')
                        }}
                        onBlur={() => handleBlur('email')}
                        value={email}
                    />
                    {touched.email && errors.email && (
                        <p className='text-red-600 text-xs mt-1 ml-1'>{errors.email}</p>
                    )}
                </div> 

                {/* Password Field */}
                <div className='relative'>
                    <Lock className='absolute left-3 top-3.5 w-5 h-5 text-gray-400'/>
                    <input 
                        type={showPassword ? "text" : "password"} 
                        placeholder='Your Password' 
                        className={`w-full border rounded-xl py-3 pl-10 pr-10 text-gray-800 focus:ring-2 focus:outline-none transition-colors ${
                            touched.password && errors.password 
                                ? 'border-red-300 focus:ring-red-500' 
                                : 'border-gray-300 focus:ring-green-500'
                        }`}
                        onChange={(e) => {
                            setPassword(e.target.value)
                            if (touched.password) validateField('password')
                        }}
                        onBlur={() => handleBlur('password')}
                        value={password}
                    />
                    {showPassword ? (
                        <EyeOff 
                            className='absolute right-3 top-3.5 w-5 h-5 text-gray-500 cursor-pointer' 
                            onClick={() => setShowPassword(false)}
                        />
                    ) : (
                        <Eye 
                            className='absolute right-3 top-3.5 w-5 h-5 text-gray-500 cursor-pointer' 
                            onClick={() => setShowPassword(true)}
                        />
                    )}
                    {touched.password && errors.password && (
                        <p className='text-red-600 text-xs mt-1 ml-1'>{errors.password}</p>
                    )}
                </div> 

                {/* Submit Button */}
                <button 
                    type="submit"
                    disabled={!isFormValid || loading} 
                    className={`w-full font-semibold py-3 rounded-xl transition-all duration-200 shadow-md inline-flex items-center justify-center gap-2 ${
                        isFormValid && !loading
                            ? "bg-green-600 hover:bg-green-700 text-white"
                            : "bg-gray-300 text-gray-500 cursor-not-allowed"
                    }`}
                >
                    {loading ? <Loader2 className='w-5 h-5 animate-spin'/> : "Login"}
                </button>

                <div className='flex items-center gap-2 text-gray-400 text-sm mt-2'>
                    <span className='flex-1 h-px bg-gray-200'></span>
                    OR
                    <span className='flex-1 h-px bg-gray-200'></span>
                </div>

                {/* Google Sign In */}
                <button
                    type="button"
                    className='w-full flex items-center justify-center gap-3 border border-gray-300 hover:bg-gray-50 py-3 rounded-xl text-gray-700 font-medium transition-all duration-200 cursor-pointer'
                    onClick={() => signIn("google", {callbackUrl: "/"})}
                >
                    <Image src={googleImage} width={20} height={20} alt='google'/>
                    Continue with Google
                </button>
            </motion.form>

            <p className='cursor-pointer text-gray-600 mt-6 text-sm flex items-center gap-1' onClick={() => router.push("/register")}>
                Want to create an account? <LogIn className='w-4 h-4'/> <span className='text-green-600'>Sign Up</span>
            </p>
        </div>
    )
}

export default Login