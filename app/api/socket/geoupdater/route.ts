import connectDb from "@/app/lib/Db";
import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import User from "@/app/models/user.model";
export async function POST(req:NextRequest){
   try {
      await connectDb();
      const {userId,latitude,longitude}=await req.json();
      console.log("the lat",latitude)
      console.log("the lon",longitude)
      const trimuserid=userId.trim();
      if(!mongoose.Types.ObjectId.isValid(trimuserid)){
        return NextResponse.json({success:false},{status:404});
      }
      const user=await User.findByIdAndUpdate(
    trimuserid,
    {
        $set: {
            location: {
                type: "Point",
                coordinates: [longitude, latitude]
            }
        }
    },
    { new: true }
);

      console.log("the geo user",user);
      return NextResponse.json({success:true},{status:200})
   } catch (error) {
      return NextResponse.json({success:false},{status:500})
   }
}