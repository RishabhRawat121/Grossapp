import connectDb from "@/app/lib/Db";
import User from "@/app/models/user.model";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    await connectDb();
    const { role, mobile } = await req.json();
    const session = await getServerSession(authOptions);
    const user = await User.findOneAndUpdate(
      { email: session?.user?.email },
      { role, mobile },
      { new: true }
    );
    if (!user) {
      return NextResponse.json({ message: "user not found" }, { status: 400 });
    }
    return NextResponse.json(user, { status: 200 });
  } catch (error) {
    return NextResponse.json({ message: `edit role and mobile error ${error}` }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    await connectDb();
    const data = await User.find();
    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.log(error);
  }
}