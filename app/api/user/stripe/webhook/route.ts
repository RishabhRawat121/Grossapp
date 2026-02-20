import connectDb from "@/app/lib/Db";
import Order from "@/app/models/order.model";
import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

const stripe=new Stripe(process.env.STRIPE_WEBHOOK_SECRET!)

export async function POST(req:NextRequest){
    const sig=req.headers.get("strip-signature")
    const rawbody=await req.text()
    let event;
    try {
        event=stripe.webhooks.constructEvent(rawbody,sig!,process.env.STRIPE_WEBHOOK_SECRET!)
    } catch (error) {
        console.error("signature verification failed",error);
    }
    if(event?.type==="checkout.session.completed"){
        const session=event.data.object;
        await connectDb()
        await Order.findByIdAndUpdate(session?.metadata?.orderId,{
            isPaid:true
        })
    }
    return NextResponse.json({
        recived:true
    },{status:200})
}