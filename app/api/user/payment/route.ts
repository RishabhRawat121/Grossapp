import connectDb from "@/app/lib/Db";
import Order from "@/app/models/order.model";
import User from "@/app/models/user.model";
import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-06-20",
});

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

    const baseUrl = process.env.NEXT_BASE_URL || "http://localhost:3000";

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      success_url: `${baseUrl}/user/order-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/user/order-cancel`,
      line_items: [
        {
          price_data: {
            currency: "inr",
            product_data: {
              name: "GrossCart Payment",
            },
            unit_amount: Math.round(totalAmount * 100),
          },
          quantity: 1,
        },
      ],
      metadata: {
        orderId: newOrder._id.toString(),
        userId: userId,
      },
    });

    return NextResponse.json({ url: session.url }, { status: 200 });

  } catch (error: any) {
    console.error("Order payment error:", error);
    return NextResponse.json(
      {
        message: "Order payment error",
        error: error?.message || "Unknown error"
      },
      { status: 500 }
    );
  }
}
