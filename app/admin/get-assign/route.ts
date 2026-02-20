import connectDb from "@/app/lib/Db";
import deliveryAssignmentModel from "@/app/models/deliveryAssignment.model";
import Order from "@/app/models/order.model";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    await connectDb();

    // 1️⃣ Get delivered orders
    const deliveredOrders = await Order.find({ status: "delivered" });

    if (deliveredOrders.length === 0) {
      return NextResponse.json({ message: "No delivered orders found" });
    }

    // 2️⃣ Extract assignment IDs
    const assignmentIds = deliveredOrders.map(
      (order) => order.assignment
    );

    // 3️⃣ Fetch delivery assignment data using assignment IDs
    const deliveryData = await deliveryAssignmentModel.find({
      _id: { $in: assignmentIds },
    });

    return NextResponse.json({
      success: true,
      deliveryData,
    });

  } catch (error) {
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
