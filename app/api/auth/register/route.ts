import connectDb from "@/app/lib/Db";
import User from "@/app/models/user.model";
import bcrypt from "bcryptjs";
import { NextRequest, NextResponse } from "next/server";
export async function POST(req:NextRequest){
    try {
        await connectDb()
        const {name,email,password}=await req.json();
        const existuser=await User.findOne({email})
        if(existuser){
            return NextResponse.json({message:"email is already exisit"},{status:400})
        }
        if(password.length<6){
            NextResponse.json({message:"password is already exists"},{status:400})
        }
        const hashpassword=await bcrypt.hash(password,10);
        const user=await User.create({
            name,email,password:hashpassword
        })
        return NextResponse.json(user,{
            status:200
        })
    } catch (error) {
        return NextResponse.json({message:`register error ${error}`})
    }
}