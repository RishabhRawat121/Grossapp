import connectDb from "@/app/lib/Db";
import DeliveryAssignment from "@/app/models/deliveryAssignment.model";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    await connectDb();
    const session = await getServerSession(authOptions);
    const data = await DeliveryAssignment.find({
      broadcastedTo: (session?.user as any)?.id,
    });
    return NextResponse.json({ message: "Delivery data fetched", data });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: "Error fetching data", error }, { status: 500 });
  }
}