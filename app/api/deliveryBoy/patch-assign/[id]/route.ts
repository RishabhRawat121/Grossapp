import connectDb from "@/app/lib/Db";
import emitEventHandler from "@/app/lib/emitEventHandler";
import deliveryAssignmentModel from "@/app/models/deliveryAssignment.model";
import DeliveryAssignment from "@/app/models/deliveryAssignment.model";
import Order from "@/app/models/order.model";
import User from "@/app/models/user.model";
import { NextRequest, NextResponse } from "next/server";

type Params = {
  params: Promise<{ id: string }>;
};


export async function PATCH(request: NextRequest, props: Params) {
  try {
    await connectDb();

    const params = await props.params;
    const id = params.id;

    console.log("✅ PATCH request received for ID:", id);

    if (!id) {
      return NextResponse.json(
        { success: false, message: "Missing assignment ID" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { action } = body;

    console.log("Action received:", action);

    if (!action) {
      return NextResponse.json(
        {
          success: false,
          message: "Missing action. Please provide 'accept' or 'reject'",
        },
        { status: 400 }
      );
    }

    if (!["accept", "reject"].includes(action)) {
      return NextResponse.json(
        { success: false, message: "Invalid action. Must be 'accept' or 'reject'" },
        { status: 400 }
      );
    }

    const assignment = await DeliveryAssignment.findById(id);

    if (!assignment) {
      return NextResponse.json(
        { success: false, message: "Assignment not found" },
        { status: 404 }
      );
    }

    const deliveryBoy = await User.findById(assignment.broadcastedTo[0]);

    if (!deliveryBoy) {
      return NextResponse.json(
        { success: false, message: "Delivery boy not found" },
        { status: 404 }
      );
    }

    // Update delivery boy info
    await DeliveryAssignment.findByIdAndUpdate(
      id,
      {
        deliveryBoyName: deliveryBoy.name,
        deliveryBoyContact: deliveryBoy.mobile,
      }
    );

    // update status
    const updateData: any = {
      status: action === "accept" ? "accept" : "rejected",
    };

    if (action === "accept") {
      updateData.acceptedAt = new Date();
      updateData.assignedTo = deliveryBoy._id;
    }

    const updated = await DeliveryAssignment.findByIdAndUpdate(
      id,
      updateData,
      { new: true }
    );

    // Emit socket event to user
    const order = await Order.findById(assignment.order);
    const user = await User.findById(order?.user);

    const deliverypayload = {
      name: deliveryBoy.name,
      number: deliveryBoy.mobile,
    };

    await emitEventHandler("order-data", deliverypayload, user?.socketId);

    return NextResponse.json({
      success: true,
      message: `Assignment ${action}ed successfully`,
      data: updated,
    });
  } catch (error: any) {
    console.error("Error in PATCH handler:", error);

    if (error.name === "CastError") {
      return NextResponse.json(
        { success: false, message: "Invalid assignment ID format" },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
}

export async function GET(req: NextRequest, props: Params) {
  try {
    await connectDb();
    const { id } = await props.params;


    const order = await Order.findOne({ user: id });
    console.log("the order",order);
    let deliverydata = null;
    console.log("the assignment id",order.assignment)
    if (order) {
      deliverydata = await DeliveryAssignment.findOne({_id:order.assignment});
    }
    console.log("the assinment data",deliverydata)
    return NextResponse.json({
      success: true,
      data: deliverydata,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 }
    );
  }
}