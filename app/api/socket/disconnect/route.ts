import connectDb from "@/app/lib/Db";
import User from "@/app/models/user.model";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req:NextRequest){
    try {
        await connectDb();
        const {socketId}=await req.json();
        await User.findOneAndUpdate(
    { socketId: socketId }, // find user by socketId
    { isOnline: false, socketId: null }, // update fields
    { new: true } // return the updated document (optional)
);

        return NextResponse.json({success:true},{status:200});
    } catch (error) {
         return NextResponse.json({success:false},{status:500});
    }
}