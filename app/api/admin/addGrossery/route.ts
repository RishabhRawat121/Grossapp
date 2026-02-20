import uploadToCloudinary from "@/app/lib/cloudinary";
import connectDb from "@/app/lib/Db";
import Grocery from "@/app/models/grocery.model";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    await connectDb();
    const session = await getServerSession(authOptions);
    if ((session?.user as any)?.role !== 'admin') {
      return NextResponse.json({ message: "you are not admin" }, { status: 400 });
    }
    const formData = await req.formData();
    const name = formData.get("name");
    const category = formData.get("category") as string;
    const unit = formData.get("unit") as string;
    const price = formData.get("price") as string;
    const file = formData.get("image") as Blob | null;
    let imageUrl;
    if (file) {
      imageUrl = await uploadToCloudinary(file);
    }
    const grocery = await Grocery.create({ name, price, category, unit, image: imageUrl });
    return NextResponse.json(grocery, { status: 200 });
  } catch (error) {
    return NextResponse.json({ message: `add grocery error ${error}` });
  }
}