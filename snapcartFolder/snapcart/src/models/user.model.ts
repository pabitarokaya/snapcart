import mongoose from "mongoose";

export interface IUser{
    _id?:mongoose.Types.ObjectId
    name:string
    email:string
    password?:string
    mobile?:string
    role:"user" | "deliveryBoy" | "admin"
    image?:string,
   location?: {
    type: {
        type: StringConstructor;
        enum: string[];
        default: string;
    };
    coordinates: {
        type: NumberConstructor[];
        default: number[];
    };
},
socketId:string | null
isOnline:Boolean
  
}

const userSchema=new mongoose.Schema<IUser>({
name:{
    type:String,
    required:true

},
email:{
    type:String,
    unique:true,
    required:true
},
password:{
    type:String,
    required:false
},
mobile: {
    type: String,
    unique: true,
    sparse: true, // Allows multiple null values, but unique non-null values
    trim: true,
    validate: {
        validator: function(v: string) {
            // Only validate if mobile is provided
            if (!v) return true
            return /^[0-9]{10,15}$/.test(v)
        },
        message: 'Please enter a valid mobile number'
    }
},
role:{
    type:String,
    enum:["user","deliveryBoy","admin"],
    default:"user"
},
image:{
    type:String
},
location:{
    type:{
      type:String,
       enum:["Point"],
       default:"Point"
    },
    coordinates:{
        type:[Number],
        default:[0,0]
    }
},
socketId:{
    type:String,
    default:null
},
isOnline:{
    type:Boolean,
    default:false
}

    },{timestamps:true})

userSchema.index({location:"2dsphere"})

const User=mongoose.models.User || mongoose.model("User",userSchema)
export default User
