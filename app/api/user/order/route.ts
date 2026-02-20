import connectDb from "@/app/lib/Db";
import Order from "@/app/models/order.model";
import User from "@/app/models/user.model";
import { NextRequest, NextResponse } from "next/server";
import DeliveryAssignment from "@/app/models/deliveryAssignment.model";
import emitEventHandler from "@/app/lib/emitEventHandler";

export async function POST(req: NextRequest) {
  try {
    await connectDb();
    const { userId, items, paymentMethod, totalAmount, address } = await req.json();

    if (!userId || !items || !paymentMethod || !totalAmount || !address) {
      return NextResponse.json(
        { message: "Please send all required fields" },
        { status: 400 }
      );
    }

    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 400 });
    }

    for (const item of items) {
      if (!item.groceries) {
        return NextResponse.json(
          { message: "Each item must have a groceries field" },
          { status: 400 }
        );
      }
    }

    const newOrder = await Order.create({
      user: userId,
      items,
      paymentMethod,
      totalAmount,
      address,
    });

    await emitEventHandler("new-order", newOrder);

    return NextResponse.json(
      { message: "Order is created", order: newOrder },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      { message: `Place order error: ${error}` },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    await connectDb();

    const userId = req.nextUrl.searchParams.get("userId");
    let orders;

    if (userId) {
      orders = await Order.find({ user: userId }).sort({ createdAt: -1 });
    } else {
      orders = await Order.find()
        .populate("user", "name email")
        .sort({ createdAt: -1 });
    }

    return NextResponse.json(
      { message: "Orders fetched", orders },
      { status: 200 }
    );
  } catch {
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    await connectDb();

    const orderId = req.nextUrl.searchParams.get("id");
    if (!orderId) {
      return NextResponse.json(
        { message: "Order ID not provided" },
        { status: 400 }
      );
    }

    const { status } = await req.json();
    if (!status) {
      return NextResponse.json(
        { message: "Status not provided" },
        { status: 400 }
      );
    }
    
    const normalizedStatus = status.toLowerCase();
    const validStatuses = ["pending", "out of delivery"];

    if (!validStatuses.includes(normalizedStatus)) {
      return NextResponse.json(
        { message: "Invalid status" },
        { status: 400 }
      );
    }

    const order = await Order.findById(orderId).populate("user");
    if (!order) {
      return NextResponse.json(
        { message: "Order not found" },
        { status: 404 }
      );
    }
    
    order.status = normalizedStatus;
   
    if (normalizedStatus === "out of delivery" && !order.assignment) {
      const { latitute, longitute } = order.address || {};

      if (latitute == null || longitute == null) {
        await order.save();
        return NextResponse.json({
          message: "Order updated, but location missing for assignment",
          order,
        });
      }

      const nearByDeliveryBoys = await User.find({
        role: "deliveryBoy",
        location: {
          $near: {
            $geometry: {
              type: "Point",
              coordinates: [Number(longitute), Number(latitute)],
            },
            $maxDistance: 20000,
          },
        },
      });

     
      console.log("the nearbydeliveryboys",nearByDeliveryBoys);
      const nearByIds = nearByDeliveryBoys.map((b) => b._id);
      await User.findByIdAndUpdate(nearByIds,{
        working:true
      });
      const busyIds = await DeliveryAssignment.find({
        assignedTo: { $in: nearByIds },
        status: { $nin: ["broadcasted", "completed"] },
      }).distinct("assignedTo");

      const busyIdSet = new Set(busyIds.map((b) => String(b)));

      const availableDeliveryBoys = nearByDeliveryBoys.filter(
        (b) => !busyIdSet.has(String(b._id))
      );

      if (availableDeliveryBoys.length === 0) {
        await order.save();
        return NextResponse.json({
          message: "No available delivery boys",
          order,
        });
      }

      const deliveryAssignment = await DeliveryAssignment.create({
       order: order._id,
       broadcastedTo: availableDeliveryBoys.map(b => b._id),
       status: "broadcasted",
       address: order.address.fulladdress, 
       total:order.totalAmount
      });


      order.assignment = deliveryAssignment._id;

      await order.save();

      const deliveryRequestPayload = {
        orderId: String(order._id),
        assignmentId: String(deliveryAssignment._id),
        customerAddress: order.address.fulladdress,
        totalAmount: order.totalAmount,
        items: order.items
      };
  
       
      for (const boy of availableDeliveryBoys) {
        if (boy.socketId) {
          console.log("logged delivery boy",boy.socketId)
          await emitEventHandler(
            "new-delivery-request",
            deliveryRequestPayload,
            boy.socketId
          );
        }
      }

      return NextResponse.json({
        message: "Order updated successfully",
        assignment: deliveryAssignment._id,
        order,
      });
    }

    await order.save();

    

    return NextResponse.json({
      message: "Order updated successfully",
      order,
    });
  } catch (error) {
    return NextResponse.json(
      { message: "Internal server error", error },
      { status: 500 }
    );
  }
}
