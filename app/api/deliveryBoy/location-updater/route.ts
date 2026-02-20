import connectDb from "@/app/lib/Db";
import { NextRequest, NextResponse } from "next/server";
import DeliveryAssignment from "@/app/models/deliveryAssignment.model";

export async function PATCH(request: NextRequest) {
  try {
    await connectDb();
    const { userId, lat, lon } = await request.json();
    
    console.log("📍 Location update request received:");
    console.log("- userId:", userId);
    console.log("- lat:", lat);
    console.log("- lon:", lon);
    
    if (!userId || lat === undefined || lon === undefined) {
      console.log("❌ Missing fields");
      return NextResponse.json(
        { success: false, message: "Missing required fields" },
        { status: 400 }
      );
    }

    // First, let's find the assignment to see what we're working with
    const existingAssignment = await DeliveryAssignment.findOne({
      assignedTo: userId,
      status: "accept"
    });

    console.log("🔍 Found assignment:", existingAssignment ? "YES" : "NO");
    if (existingAssignment) {
      console.log("📄 Assignment details:", {
        _id: existingAssignment._id,
        assignedTo: existingAssignment.assignedTo,
        status: existingAssignment.status
      });
    }

    // Now update it
    const deliveryAssignment = await DeliveryAssignment.findOneAndUpdate(
      { 
        assignedTo: userId,
        status: "accept"
      },
      { 
        $set: { 
          latitude: lat,
          longitude: lon,
          lastLocationUpdate: new Date() 
        } 
      },
      { new: true }
    );
    console.log("🔍 Found assignment:", existingAssignment ? "YES" : "NO");
    if (!deliveryAssignment) {
      console.log("⚠️ Update failed - no assignment found");
      return NextResponse.json(
        { success: false, message: "No active assignment found for this delivery boy" },
        { status: 404 }
      );
    }

    console.log("✅ Location updated successfully!");
    console.log("- Assignment ID:", deliveryAssignment._id);
    console.log("- New latitude:", deliveryAssignment.latitude);
    console.log("- New longitude:", deliveryAssignment.longitude);
    
    return NextResponse.json({ 
      success: true, 
      data: {
        _id: deliveryAssignment._id,
        latitude: deliveryAssignment.latitude,
        longitude: deliveryAssignment.longitude,
        lastLocationUpdate: deliveryAssignment.lastLocationUpdate
      },
      message: "Location updated successfully"
    });
  } catch (error: any) {
    console.error("❌ Error updating location:", error);
    console.error("Error stack:", error.stack);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}