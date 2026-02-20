import connectDb from "@/app/lib/Db";
import User from "@/app/models/user.model";
import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
export async function POST(req:NextRequest){
    try {
        await connectDb();
        const {userId,socketId}=await req.json();
        console.log("the backend user id",userId);
        console.log("the socket id",socketId);
        const trimmedUserId=userId.trim();
        if (!mongoose.Types.ObjectId.isValid(trimmedUserId)) {
        return NextResponse.json({message:"Invalid userId"},{status:400})
}



       const user = await User.findByIdAndUpdate(
        trimmedUserId,
    { socketId, isOnline: true },
    { new: true }
      );
      

        console.log("the user route of socket data",user)
        if(!user){
            return NextResponse.json({message:"user  is not found"},{status:404});
        }

        return NextResponse.json({message:"add is successfully get"},{status:200})
    } catch (error) {
        return NextResponse.json({message:"Internal server error at Socket"},{
            status:500
        })
    }
}