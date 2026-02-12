import { auth } from "@/auth";
import connectDb from "@/lib/db";
import User from "@/models/user.model";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
    try {
        await connectDb()
        
        const { role, mobile } = await req.json()
        
        // Get current session
        const session = await auth()
        
        if (!session?.user?.email) {
            return NextResponse.json(
                { 
                    success: false,
                    message: "Unauthorized. Please login." 
                },
                { status: 401 }
            )
        }
        
        // Validate mobile number format (optional but recommended)
        if (mobile) {
            const mobileRegex = /^[0-9]{10,15}$/
            if (!mobileRegex.test(mobile)) {
                return NextResponse.json(
                    { 
                        success: false,
                        message: "Invalid mobile number format. Please enter 10-15 digits.",
                        field: "mobile"
                    },
                    { status: 400 }
                )
            }
        }
        
        // Find current user
        const currentUser = await User.findOne({ email: session.user.email })
        
        if (!currentUser) {
            return NextResponse.json(
                { 
                    success: false,
                    message: "User not found" 
                },
                { status: 404 }
            )
        }
        
        // Check if mobile number is being changed
        if (mobile && mobile !== currentUser.mobile) {
            // Check if another user already has this mobile number
            const existingUserWithMobile = await User.findOne({ 
                mobile,
                _id: { $ne: currentUser._id } // Exclude current user
            })
            
            if (existingUserWithMobile) {
                return NextResponse.json(
                    { 
                        success: false,
                        message: "This mobile number is already registered with another account.",
                        field: "mobile",
                        error: "DUPLICATE_MOBILE"
                    },
                    { status: 409 }
                )
            }
        }
        
        // Update user with new role and mobile
        const updatedUser = await User.findOneAndUpdate(
            { email: session.user.email },
            { 
                ...(role && { role }), // Only update if role is provided
                ...(mobile && { mobile }) // Only update if mobile is provided
            },
            { 
                new: true, // Return updated document
                runValidators: true // Run mongoose schema validators
            }
        ).select('-password') // Don't return password field
        
        if (!updatedUser) {
            return NextResponse.json(
                { 
                    success: false,
                    message: "Failed to update user" 
                },
                { status: 500 }
            )
        }
        
        return NextResponse.json(
            { 
                success: true,
                message: "Profile updated successfully",
                user: updatedUser 
            },
            { status: 200 }
        )
        
    } catch (error: any) {
        console.error("Edit role and mobile error:", error)
        
        // Handle mongoose validation errors
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map((err: any) => err.message)
            return NextResponse.json(
                { 
                    success: false,
                    message: messages.join(', '),
                    field: 'validation'
                },
                { status: 400 }
            )
        }
        
        // Handle mongoose duplicate key error (11000 or 11001)
        if (error.code === 11000 || error.code === 11001) {
            const field = Object.keys(error.keyPattern || {})[0]
            let message = "This value is already in use"
            
            if (field === 'mobile') {
                message = "This mobile number is already registered with another account"
            } else if (field === 'email') {
                message = "This email is already registered"
            }
            
            return NextResponse.json(
                { 
                    success: false,
                    message,
                    field,
                    error: 'DUPLICATE_ENTRY'
                },
                { status: 409 }
            )
        }
        
        // Handle custom error messages (from pre-save hooks)
        if (error.message && error.message.includes('mobile number is already registered')) {
            return NextResponse.json(
                { 
                    success: false,
                    message: "This mobile number is already registered with another account",
                    field: 'mobile',
                    error: 'DUPLICATE_MOBILE'
                },
                { status: 409 }
            )
        }
        
        return NextResponse.json(
            { 
                success: false,
                message: "An error occurred while updating profile",
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            },
            { status: 500 }
        )
    }
}