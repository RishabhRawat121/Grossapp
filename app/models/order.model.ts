import mongoose from "mongoose";

interface IOrder{
   _id?:mongoose.Types.ObjectId
   user:mongoose.Types.ObjectId
   items:[
    {
        groceries:mongoose.Types.ObjectId,
        name:string,
        price:string,
        unit:string,
        image:string
        quantity:number
    }
   ],
   isPaid:boolean
   totalAmount:string,
   paymentMethod:"cod"| "online"
   address:{
    fullName:string,
    mobile:string,
    city:string,
    state:string,
    pincode:string,
    fulladdress:string
    latitute:number,
    longitute:number,
   }
   status:"pending"|"out of delivery"|"delivered"
   createdAt?:Date,
   updatedAt?:Date,
   assignmentDeliveryBoy?:mongoose.Types.ObjectId
   assignment?:mongoose.Types.ObjectId
   delivered?:string
}

const orderSchema=new mongoose.Schema<IOrder>({
    user:{
        type: mongoose.Schema.Types.ObjectId,
        ref:"User",
        required:true
    },
    items:[
        {
            groceries:{
                type:mongoose.Schema.Types.ObjectId,
                ref:"groceries",
                required:true
            },
            name:String,
            price:String,
            unit:String,
            image:String,
            quantity:Number

        }
    ],
    assignment:{
       type:mongoose.Schema.Types.ObjectId,
       ref:"DeliveryAssignment",
       default:null
    },
    assignmentDeliveryBoy:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User"
    },
    isPaid:{
        type:Boolean,
        default:false
    },
    paymentMethod:{
        type:String,
        enum:["cod","online"],
        default:"cod"
    },
    totalAmount:Number,
    address:{
    fullName:String,
    mobile:String,
    city:String,
    state:String,
    pincode:String,
    fulladdress:String,
    latitute:Number,
    longitute:Number,
    },
    status:{
        type:String,
        enum:["pending","out of delivery","delivered"],
        default:"pending"
    }
},{timestamps:true})

const Order=mongoose.models.Order||mongoose.model("Order",orderSchema)

export default Order