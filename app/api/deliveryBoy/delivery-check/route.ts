import connectDb from "@/app/lib/Db";
import deliveryAssignmentModel from "@/app/models/deliveryAssignment.model";
import Order from "@/app/models/order.model";
import User from "@/app/models/user.model";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    await connectDb();

    const { orderId, total } = await req.json();

    if (!orderId || !total) {
      return NextResponse.json(
        { success: false, message: "orderId or total missing" },
        { status: 400 }
      );
    }

    const order = await Order.findById(orderId);

    if (!order) {
      return NextResponse.json(
        { success: false, message: "Order not found" },
        { status: 404 }
      );
    }
   
    order.status = "delivered";
    order.total = total;
    order.deliveredAt = new Date();

    const delivered=await deliveryAssignmentModel.findById(order.assignment);

    const user=await User.findById(delivered.assignedTo);
    console.log("the delivery user data",user)
    user.working=false;
   

    await order.save();

    return NextResponse.json(
      {
        success: true,
        message: "Order delivered successfully",
        data: order,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
