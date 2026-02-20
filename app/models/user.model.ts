import mongoose from "mongoose";
import { number } from "framer-motion";
interface Iuser{
   _id?:mongoose.Types.ObjectId
   name:string,
   email:string,
   password?:string,
   mobile?:string,
   role:"user"|"deliveryBoy"|"admin"
   image?:string
   socketId:string|null
   isOnline:boolean
   location?:{
    type:"Point",
    coordinates:number[]
   }
   working?:boolean
}

const userSchema=new mongoose.Schema<Iuser>({
  name:{
    type:String
  },
  email:{
    type:String,
    unique:true,
  },
  password:{
    type:String,
    required:false
  },
  mobile:{
    type:String
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
     default:"Point",
     require:true
    },
    coordinates:{
      type:[Number],
      default:[0,0],
      required:true
    },
  },
  socketId:{
    type:String,
    default:null
  },
  isOnline:{
    type:Boolean,
    default:false
  },
  working:{
    type:Boolean,
    default:false,
    required:false,
  }
 
},{timestamps:true});

userSchema.index({location:"2dsphere"})

const User=mongoose.models.User||mongoose.model("User",userSchema)

export default User